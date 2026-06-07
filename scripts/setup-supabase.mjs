/**
 * Provisions a dedicated Supabase project for Poker Edge, applies the schema,
 * wires the Cloudflare Worker secrets, and populates the DB via the worker's
 * ingest route. Secrets are set server-to-server and never printed.
 *
 * Reads credentials from local files (per the house secret-storage pattern):
 *   - Supabase PAT:   SocialScalr/web/.dev.vars  (SUPABASE_PAT=sbp_...)
 *   - Cloudflare key: MSC Mystery Cards Funnel/.dev.vars (CLOUDFLARE_API_TOKEN=)
 */
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readVar(file, key) {
  try {
    const line = fs.readFileSync(file, 'utf8').split(/\r?\n/).find((l) => l.startsWith(key + '='));
    return line ? line.slice(key.length + 1).trim().replace(/^["']|["']$/g, '') : null;
  } catch { return null; }
}

const PAT = readVar('C:/Users/13219/Desktop/SocialScalr/web/.dev.vars', 'SUPABASE_PAT');
const CF_KEY = readVar('C:/Users/13219/Desktop/MSC Mystery Cards Funnel/.dev.vars', 'CLOUDFLARE_API_TOKEN');
const CF_EMAIL = 'marklgabriellijr@gmail.com';
const CF_ACCOUNT = '5b4ea6b5589fe12f29bea5d7e43fe03c';
const CF_SCRIPT = 'pokeredge-api';
const ORG = 'hjykliewwlfczqvikmrn'; // MarkCMO
const REGION = 'us-east-1';
const PROJECT_NAME = 'poker-edge';
const WORKER_URL = 'https://pokeredge-api.marklgabriellijr.workers.dev';

if (!PAT) { console.error('Supabase PAT not found.'); process.exit(1); }
if (!CF_KEY) { console.error('Cloudflare key not found.'); process.exit(1); }

const sb = (m, p, b) => fetch(`https://api.supabase.com${p}`, {
  method: m, headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' },
  body: b ? JSON.stringify(b) : undefined,
}).then(async (r) => ({ ok: r.ok, status: r.status, json: await r.json().catch(() => ({})) }));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function setCfSecret(name, text) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT}/workers/scripts/${CF_SCRIPT}/secrets`, {
    method: 'PUT',
    headers: { 'X-Auth-Email': CF_EMAIL, 'X-Auth-Key': CF_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, text, type: 'secret_text' }),
  });
  const j = await r.json().catch(() => ({}));
  console.log(`  secret ${name}: ${j.success ? 'set' : 'FAILED ' + JSON.stringify(j.errors)}`);
}

async function main() {
  // 1. Find or create the project
  let ref = null;
  const list = await sb('GET', '/v1/projects');
  if (Array.isArray(list.json)) {
    const existing = list.json.find((p) => p.name === PROJECT_NAME);
    if (existing) { ref = existing.id; console.log(`Project exists: ${ref} (status ${existing.status})`); }
  }
  if (!ref) {
    const dbPass = crypto.randomBytes(18).toString('base64').replace(/[^A-Za-z0-9]/g, '') + 'Aa1!';
    console.log('Creating project poker-edge in MarkCMO...');
    const created = await sb('POST', '/v1/projects', {
      organization_id: ORG, name: PROJECT_NAME, region: REGION, db_pass: dbPass, plan: 'free',
    });
    if (!created.ok) { console.error('Create failed:', created.status, JSON.stringify(created.json).slice(0, 400)); process.exit(1); }
    ref = created.json.id;
    console.log(`Created project: ${ref}`);
  }

  // 2. Poll until healthy
  process.stdout.write('Waiting for project to be healthy');
  for (let i = 0; i < 30; i++) {
    const p = await sb('GET', `/v1/projects/${ref}`);
    const status = p.json?.status;
    if (status === 'ACTIVE_HEALTHY') { console.log('\n  status: ACTIVE_HEALTHY'); break; }
    process.stdout.write(`.(${status || '?'})`);
    await sleep(12000);
  }

  const url = `https://${ref}.supabase.co`;

  // 3. Service role key
  const keys = await sb('GET', `/v1/projects/${ref}/api-keys`);
  const serviceKey = Array.isArray(keys.json) ? (keys.json.find((k) => k.name === 'service_role')?.api_key) : null;
  if (!serviceKey) { console.error('Could not read service_role key:', JSON.stringify(keys.json).slice(0, 300)); process.exit(1); }
  console.log(`Service role key obtained (len ${serviceKey.length}). URL: ${url}`);

  // 4. Apply schema
  const schema = fs.readFileSync(path.join(__dirname, '..', 'server', 'supabase', 'schema.sql'), 'utf8');
  const q = await sb('POST', `/v1/projects/${ref}/database/query`, { query: schema });
  console.log(`Schema apply: ${q.ok ? 'OK' : 'FAILED ' + JSON.stringify(q.json).slice(0, 400)}`);

  // 5. Wire Cloudflare Worker secrets
  const ingestKey = crypto.randomBytes(24).toString('hex');
  console.log('Setting Cloudflare Worker secrets...');
  await setCfSecret('SUPABASE_URL', url);
  await setCfSecret('SUPABASE_SERVICE_KEY', serviceKey);
  await setCfSecret('INGEST_KEY', ingestKey);

  // 6. Populate via the worker ingest route (secrets propagate in a few seconds)
  await sleep(6000);
  const ing = await fetch(`${WORKER_URL}/admin/ingest`, { method: 'POST', headers: { 'x-ingest-key': ingestKey } });
  const ingJson = await ing.json().catch(() => ({}));
  console.log('Ingest:', ing.status, JSON.stringify(ingJson).slice(0, 300));

  // 7. Verify the API now serves DB rows
  const rooms = await fetch(`${WORKER_URL}/v1/rooms`).then((r) => r.json()).catch(() => []);
  console.log(`Verify /v1/rooms: ${rooms.length} rooms`);
  console.log(`\nDONE. Project ref: ${ref}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
