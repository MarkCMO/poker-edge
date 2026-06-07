/**
 * Poker Edge RevenueCat setup via the v2 REST API. Idempotent: safe to re-run.
 *
 * Prereqs:
 *   1. An empty "Poker Edge" project exists in the RevenueCat dashboard.
 *   2. A v2 Secret API key (sk_...) for that project.
 *
 * Run:
 *   RC_SECRET_KEY=sk_xxx node scripts/setup-revenuecat.mjs
 *
 * It creates: the iOS app, the "pro" entitlement, the monthly + annual products,
 * the "default" offering with $rc_monthly and $rc_annual packages, and attaches
 * products to both the entitlement and the packages. It prints the iOS public
 * SDK key when the API exposes it (otherwise copy it from the dashboard).
 *
 * Config chosen: Monthly $9.99 / Annual $59.99 (prices are set in App Store
 * Connect, not here). Bundle id com.markcmo.pokeredge.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const KEY = process.env.RC_SECRET_KEY;
if (!KEY || !KEY.startsWith('sk_')) {
  console.error('Set RC_SECRET_KEY to a RevenueCat v2 secret key (starts with sk_).');
  process.exit(1);
}

const BASE = 'https://api.revenuecat.com/v2';
const PROJECT_NAME = 'Poker Edge';
const BUNDLE_ID = 'com.markcmo.pokeredge';
const PRODUCTS = [
  { store_identifier: 'com.markcmo.pokeredge.pro.monthly', display_name: 'Poker Edge Pro Monthly', pkg: '$rc_monthly' },
  { store_identifier: 'com.markcmo.pokeredge.pro.annual', display_name: 'Poker Edge Pro Annual', pkg: '$rc_annual' },
];

async function rc(method, urlPath, body) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

async function findOrCreate(listPath, matchFn, createPath, createBody, label) {
  const list = await rc('GET', `${listPath}?limit=50`);
  if (list.ok && Array.isArray(list.json.items)) {
    const found = list.json.items.find(matchFn);
    if (found) { console.log(`= ${label} exists: ${found.id}`); return found; }
  }
  const created = await rc('POST', createPath, createBody);
  if (!created.ok) {
    console.error(`! create ${label} failed (${created.status}):`, JSON.stringify(created.json).slice(0, 300));
    return null;
  }
  console.log(`+ created ${label}: ${created.json.id}`);
  return created.json;
}

async function main() {
  // 1. Project
  const projects = await rc('GET', '/projects?limit=50');
  if (!projects.ok) {
    console.error('Could not list projects. Is the key valid?', projects.status, JSON.stringify(projects.json).slice(0, 200));
    process.exit(1);
  }
  const project = projects.json.items.find((p) => p.name === PROJECT_NAME) || projects.json.items[0];
  if (!project) { console.error('No project found. Create a "Poker Edge" project first.'); process.exit(1); }
  console.log(`Using project: ${project.name} (${project.id})`);
  const pid = project.id;

  // 2. iOS app
  const app = await findOrCreate(
    `/projects/${pid}/apps`,
    (a) => a.type === 'app_store' || a.app_store?.bundle_id === BUNDLE_ID,
    `/projects/${pid}/apps`,
    { name: 'Poker Edge iOS', type: 'app_store', app_store: { bundle_id: BUNDLE_ID } },
    'iOS app'
  );

  // 3. Entitlement "pro"
  const ent = await findOrCreate(
    `/projects/${pid}/entitlements`,
    (e) => e.lookup_key === 'pro',
    `/projects/${pid}/entitlements`,
    { lookup_key: 'pro', display_name: 'Pro' },
    'entitlement pro'
  );

  // 4. Products
  const productIds = [];
  for (const p of PRODUCTS) {
    const prod = await findOrCreate(
      `/projects/${pid}/products`,
      (x) => x.store_identifier === p.store_identifier,
      `/projects/${pid}/products`,
      { store_identifier: p.store_identifier, type: 'subscription', display_name: p.display_name, app_id: app?.id },
      `product ${p.store_identifier}`
    );
    if (prod) productIds.push({ id: prod.id, pkg: p.pkg, store: p.store_identifier });
  }

  // 5. Attach products to entitlement
  if (ent && productIds.length) {
    const attach = await rc('POST', `/projects/${pid}/entitlements/${ent.id}/actions/attach_products`, {
      product_ids: productIds.map((p) => p.id),
    });
    console.log(attach.ok ? '= products attached to entitlement' : `! entitlement attach: ${attach.status} ${JSON.stringify(attach.json).slice(0, 200)}`);
  }

  // 6. Offering "default"
  const offering = await findOrCreate(
    `/projects/${pid}/offerings`,
    (o) => o.lookup_key === 'default',
    `/projects/${pid}/offerings`,
    { lookup_key: 'default', display_name: 'Default' },
    'offering default'
  );

  // 7. Packages + attach products
  if (offering) {
    for (let i = 0; i < productIds.length; i++) {
      const p = productIds[i];
      const pkg = await findOrCreate(
        `/projects/${pid}/offerings/${offering.id}/packages`,
        (k) => k.lookup_key === p.pkg,
        `/projects/${pid}/offerings/${offering.id}/packages`,
        { lookup_key: p.pkg, display_name: p.pkg, position: i + 1 },
        `package ${p.pkg}`
      );
      if (pkg) {
        const att = await rc('POST', `/projects/${pid}/packages/${pkg.id}/actions/attach_products`, {
          products: [{ product_id: p.id, eligibility_criteria: 'all' }],
        });
        console.log(att.ok ? `= ${p.pkg} -> ${p.store}` : `! package attach ${p.pkg}: ${att.status} ${JSON.stringify(att.json).slice(0, 200)}`);
      }
    }
  }

  // 8. Read the iOS public SDK key (appl_) from the public_api_keys endpoint.
  let publicKey = null;
  if (app?.id) {
    const keys = await rc('GET', `/projects/${pid}/apps/${app.id}/public_api_keys`);
    const match = JSON.stringify(keys.json || {}).match(/appl_[A-Za-z0-9]+/);
    publicKey = match ? match[0] : null;
  }

  console.log('\n--- RESULT ---');
  console.log('Make the "default" offering CURRENT in the dashboard if it is not already.');
  if (publicKey) {
    console.log(`iOS public SDK key: ${publicKey}`);
    // write into app.json
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const appJsonPath = path.join(__dirname, '..', 'app.json');
    const cfg = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    cfg.expo.extra.revenueCatIosKey = publicKey;
    fs.writeFileSync(appJsonPath, JSON.stringify(cfg, null, 2) + '\n');
    console.log('Wrote revenueCatIosKey into app.json.');
  } else {
    console.log('Public SDK key not returned by the API. Copy it from RevenueCat dashboard');
    console.log('(Project Settings -> API keys -> iOS public) into app.json extra.revenueCatIosKey.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
