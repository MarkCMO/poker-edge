import type { Env } from './types';
import { selectAll, isConfigured } from './db';
import { rowToRoom, rowToSeries, rowToTournament } from './normalize';
import { runIngestion } from './adapters';
import { BOOTSTRAP_ROOMS, BOOTSTRAP_SERIES, BOOTSTRAP_TOURNAMENTS } from './seed';
import { explain, type ExplainRequest } from './ai';

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

    if (url.pathname === '/v1/rooms') return fromDbOrSeed('rooms', 'region', rowToRoom, BOOTSTRAP_ROOMS);
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
