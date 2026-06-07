/**
 * Waits for the latest Poker Edge build to finish Apple processing, clears
 * export compliance, and assigns it to an internal TestFlight group so it
 * becomes available to test. Uses the App Store Connect API (.p8).
 */
import fs from 'fs';
import crypto from 'crypto';

const APP_ID = '6777580813';
const KEY_ID = 'YRMDQTX998';
const ISSUER = 'b7b9dd56-d867-4b33-b6e0-21e133f8bf12';
const PEM = fs.readFileSync('C:/Users/13219/Downloads/AuthKey_YRMDQTX998.p8', 'utf8');

function jwt() {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const head = { alg: 'ES256', kid: KEY_ID, typ: 'JWT' };
  const payload = { iss: ISSUER, iat: now, exp: now + 1000, aud: 'appstoreconnect-v1' };
  const signing = `${b64(head)}.${b64(payload)}`;
  const sig = crypto.createSign('SHA256').update(signing).sign({ key: PEM, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return `${signing}.${sig}`;
}
async function asc(method, path, body) {
  const res = await fetch(`https://api.appstoreconnect.apple.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${jwt()}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  // 1. Poll until a build is VALID (processed)
  let build = null;
  for (let i = 0; i < 40; i++) {
    const r = await asc('GET', `/v1/builds?filter[app]=${APP_ID}&sort=-uploadedDate&limit=1`);
    build = r.json?.data?.[0];
    const state = build?.attributes?.processingState;
    console.log(`[${new Date().toISOString()}] build ${build?.attributes?.version ?? '?'} state=${state ?? 'none'}`);
    if (state === 'VALID') break;
    if (state === 'INVALID' || state === 'FAILED') { console.log('Build processing failed:', JSON.stringify(build?.attributes)); process.exit(1); }
    await sleep(30000);
  }
  if (!build || build.attributes.processingState !== 'VALID') { console.log('Timed out waiting for processing.'); process.exit(1); }
  const buildId = build.id;
  console.log('Build is VALID:', buildId);

  // 2. Clear export compliance
  if (build.attributes.usesNonExemptEncryption !== false) {
    const p = await asc('PATCH', `/v1/builds/${buildId}`, {
      data: { type: 'builds', id: buildId, attributes: { usesNonExemptEncryption: false } },
    });
    console.log('Set export compliance:', p.ok ? 'OK' : `FAIL ${p.status} ${JSON.stringify(p.json).slice(0, 200)}`);
  } else {
    console.log('Export compliance already set.');
  }

  // 3. Find or create an internal beta group
  const groups = await asc('GET', `/v1/betaGroups?filter[app]=${APP_ID}&limit=50`);
  let group = (groups.json?.data || []).find((g) => g.attributes?.isInternalGroup);
  if (!group) {
    const c = await asc('POST', '/v1/betaGroups', {
      data: {
        type: 'betaGroups',
        attributes: { name: 'Internal Testers', isInternalGroup: true },
        relationships: { app: { data: { type: 'apps', id: APP_ID } } },
      },
    });
    if (c.ok) { group = c.json.data; console.log('Created internal group:', group.id); }
    else console.log('Create group failed:', c.status, JSON.stringify(c.json).slice(0, 300));
  } else {
    console.log('Internal group exists:', group.id, group.attributes.name);
  }

  // 4. Assign the build to the internal group
  if (group) {
    const a = await asc('POST', `/v1/betaGroups/${group.id}/relationships/builds`, {
      data: [{ type: 'builds', id: buildId }],
    });
    console.log('Assign build to group:', a.ok ? 'OK' : `status ${a.status} ${JSON.stringify(a.json).slice(0, 200)}`);
  }

  console.log('\nDONE. Build should now be available in TestFlight internal testing.');
  console.log('https://appstoreconnect.apple.com/apps/' + APP_ID + '/testflight/ios');
}
main().catch((e) => { console.error(e); process.exit(1); });
