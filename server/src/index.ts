import type { Env, ApiRoom } from './types';
import { selectAll, isConfigured, upsert } from './db';
import { rowToRoom, rowToSeries, rowToTournament, roomToRow } from './normalize';
import { runIngestion } from './adapters';
import { BOOTSTRAP_ROOMS, BOOTSTRAP_SERIES, BOOTSTRAP_TOURNAMENTS } from './seed';
import { explain, type ExplainRequest } from './ai';

const EARTH_KM = 6371;
function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const la1 = (aLat * Math.PI) / 180, la2 = (bLat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(h));
}

/** Free global poker-room discovery via OpenStreetMap Overpass (no API key). */
async function nearbyRooms(lat: number, lng: number, radiusM: number): Promise<unknown[]> {
  const q = `[out:json][timeout:25];(` +
    `node["amenity"="casino"](around:${radiusM},${lat},${lng});` +
    `way["amenity"="casino"](around:${radiusM},${lat},${lng});` +
    `node["leisure"="adult_gaming_centre"](around:${radiusM},${lat},${lng});` +
    `way["leisure"="adult_gaming_centre"](around:${radiusM},${lat},${lng});` +
    `);out center 60;`;
  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json', 'User-Agent': 'PokerEdge/1.0 (+https://pokeredge.app; marklgabriellijr@gmail.com)' },
        body: 'data=' + encodeURIComponent(q),
      });
      if (!res.ok) continue;
      const j = (await res.json()) as { elements?: any[] };
      const seen = new Set<string>();
      const out = (j.elements || [])
        .map((e) => {
          const elat = e.lat ?? e.center?.lat;
          const elng = e.lon ?? e.center?.lon;
          if (elat == null || elng == null) return null;
          const t = e.tags || {};
          const name = t.name || t['name:en'] || 'Casino / card room';
          return {
            id: `osm-${e.type}-${e.id}`,
            name,
            casino: name,
            city: t['addr:city'] || t['addr:town'] || '',
            state: t['addr:state'] || '',
            country: t['addr:country'] || '',
            lat: elat,
            lng: elng,
            source: 'osm',
            distanceKm: Math.round(distanceKm(lat, lng, elat, elng) * 10) / 10,
          };
        })
        .filter((x): x is NonNullable<typeof x> => !!x)
        .filter((x) => (seen.has(x.name + x.city) ? false : (seen.add(x.name + x.city), true)))
        .sort((a, b) => a.distanceKm - b.distanceKm);
      return out;
    } catch {
      // try next mirror
    }
  }
  return [];
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...CORS },
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

    // Health
    if (url.pathname === '/' || url.pathname === '/health') {
      return json({ ok: true, service: 'pokeredge-api', configured: isConfigured(env) });
    }

    // Serve from Supabase when configured and non-empty; otherwise (not
    // configured, empty, or any DB error) serve the bundled seed so the data
    // endpoints are always complete and never return an error.
    async function fromDbOrSeed(
      table: string,
      order: string,
      map: (r: Record<string, unknown>) => unknown,
      seed: unknown
    ): Promise<Response> {
      if (isConfigured(env)) {
        try {
          const rows = await selectAll<Record<string, unknown>>(env, table, `select=*&order=${order}`);
          if (rows.length) return json(rows.map(map));
        } catch {
          // fall through to seed
        }
      }
      return json(seed);
    }

    // Rooms: merge the bundled curated set with any DB rows (community + ingested),
    // deduped by id, so curated rooms always show and community rooms grow the list.
    if (url.pathname === '/v1/rooms') {
      const byId = new Map<string, unknown>();
      for (const r of BOOTSTRAP_ROOMS) byId.set(r.id, r);
      if (isConfigured(env)) {
        try {
          const rows = await selectAll<Record<string, unknown>>(env, 'rooms', 'select=*');
          for (const row of rows) { const m = rowToRoom(row); byId.set(m.id, m); }
        } catch { /* fall back to curated only */ }
      }
      return json([...byId.values()]);
    }

    // Free global discovery via OpenStreetMap (no API key, no cost).
    if (url.pathname === '/v1/rooms/nearby') {
      const lat = parseFloat(url.searchParams.get('lat') || '');
      const lng = parseFloat(url.searchParams.get('lng') || '');
      const radius = Math.min(200000, parseInt(url.searchParams.get('radius') || '60000', 10));
      if (isNaN(lat) || isNaN(lng)) return json({ error: 'lat and lng required' }, 400);
      if (url.searchParams.get('debug') === '1') {
        const q = `[out:json][timeout:25];(node["amenity"="casino"](around:${radius},${lat},${lng});way["amenity"="casino"](around:${radius},${lat},${lng}););out center 60;`;
        try {
          const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json', 'User-Agent': 'PokerEdge/1.0 (+https://pokeredge.app; marklgabriellijr@gmail.com)' }, body: 'data=' + encodeURIComponent(q) });
          const txt = await r.text();
          return json({ status: r.status, len: txt.length, snippet: txt.slice(0, 240) });
        } catch (e) {
          return json({ fetchError: (e as Error).message });
        }
      }
      const results = await nearbyRooms(lat, lng, radius);
      return json(results);
    }

    // Crowdsource: a user submits a room; stored as community data so it grows the
    // shared directory for everyone. The app also keeps it locally for offline use.
    if (url.pathname === '/v1/rooms/submit' && req.method === 'POST') {
      const body = (await req.json().catch(() => null)) as Partial<ApiRoom> | null;
      if (!body || !body.name) return json({ error: 'name required' }, 400);
      const id = body.id || `community-${(body.name + (body.city || '')).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.abs([...(body.name)].reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 7)).toString(36)}`;
      const room: ApiRoom = {
        id, name: body.name, casino: body.casino || body.name, city: body.city || '', state: body.state || '',
        country: body.country || 'USA', region: body.region || 'Community', tableCount: body.tableCount || 0,
        stakesSpread: body.stakesSpread || '', rake: body.rake || { percent: 10, cap: 5, increments: 1, noFlopNoDrop: true, promoDrop: 0, buyInCap: null },
        compPerHour: body.compPerHour || 0, loyalty: body.loyalty || '', hoursOpen: body.hoursOpen || '24/7',
        lat: body.lat ?? null, lng: body.lng ?? null, sourceUrl: body.sourceUrl || '',
        lastVerified: new Date().toISOString().slice(0, 10), notes: body.notes || '',
      };
      if (!isConfigured(env)) return json({ ok: true, stored: false, id, note: 'kept locally; shared directory not configured' });
      try {
        await upsert(env, 'rooms', [roomToRow(room, 'community')]);
        return json({ ok: true, stored: true, id });
      } catch (e) {
        return json({ ok: true, stored: false, id, error: (e as Error).message });
      }
    }

    if (url.pathname === '/v1/series') return fromDbOrSeed('series', 'start_date', rowToSeries, BOOTSTRAP_SERIES);
    if (url.pathname === '/v1/tournaments')
      return fromDbOrSeed('tournaments', 'start_datetime', rowToTournament, BOOTSTRAP_TOURNAMENTS);

    // AI explain (Phase 11): explains engine output in plain language.
    if (url.pathname === '/v1/explain' && req.method === 'POST') {
      const body = (await req.json().catch(() => null)) as ExplainRequest | null;
      if (!body || !body.kind) return json({ error: 'bad request' }, 400);
      const result = await explain(env, body);
      return 'error' in result ? json(result, 'error' in result && result.error === 'AI explain not configured' ? 501 : 502) : json(result);
    }

    // External result sync (Phase 10): SharkScope + Hendon Mob. Returns 501 until
    // the licensed credentials are configured on the Worker.
    if (url.pathname.startsWith('/v1/external/')) {
      if (url.pathname === '/v1/external/online-results' || url.pathname === '/v1/external/player-stats') {
        if (!env.SHARKSCOPE_KEY) return json({ error: 'SharkScope credentials not configured' }, 501);
        // TODO: call SharkScope API with env.SHARKSCOPE_KEY, cache, return normalized rows.
        return json({ error: 'not implemented' }, 501);
      }
      if (url.pathname === '/v1/external/live-record') {
        if (!env.HENDON_KEY) return json({ error: 'Hendon Mob access not configured' }, 501);
        // TODO: call Hendon Mob with env.HENDON_KEY, return normalized rows.
        return json({ error: 'not implemented' }, 501);
      }
      return json({ error: 'not found' }, 404);
    }

    // One-time / on-demand ingestion trigger (guarded). Populates Supabase from
    // the adapters so the DB is the live source. Safe to re-run (idempotent upsert).
    if (url.pathname === '/admin/ingest') {
      if (!env.INGEST_KEY || req.headers.get('x-ingest-key') !== env.INGEST_KEY) {
        return json({ error: 'forbidden' }, 403);
      }
      const r = await runIngestion(env);
      return json({ ok: true, ...r });
    }

    return json({ error: 'not found' }, 404);
  },

  // Cron-triggered ingestion (Section 6).
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      runIngestion(env).then((r) => console.log('Ingestion complete:\n' + r.summary))
    );
  },
};
