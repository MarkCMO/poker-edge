# Poker Edge API and ingestion layer

Cloudflare Worker + Supabase. This is the fat server from the playbook (Section
6). It serves normalized reference data to the iOS app and runs the ingestion
adapters on a cron. The iOS app reads only these endpoints and never scrapes.

## Endpoints
- `GET /` - health, reports whether Supabase is configured
- `GET /v1/rooms` - room directory (camelCase, matches the app's types)
- `GET /v1/series` - tournament series
- `GET /v1/tournaments` - tournaments

If Supabase is not configured the data endpoints return 503 by design; the app
falls back to its bundled seed, so this is a safe state.

## Setup
1. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.
2. Configure the Worker secrets:
   ```powershell
   wrangler secret put SUPABASE_URL
   wrangler secret put SUPABASE_SERVICE_KEY
   wrangler secret put OPS_ALERT_EMAIL      # optional, for failure alerts
   wrangler secret put RESEND_API_KEY       # optional, for failure alerts
   ```
   Locally, copy `.env.example` to `.dev.vars` (gitignored) for `wrangler dev`.
3. Deploy:
   ```powershell
   npm install
   npm run typecheck
   npm run deploy
   ```
4. Point the app at it: set `extra.apiBaseUrl` in the app's `app.json` to the
   deployed Worker URL (default is `https://api.pokeredge.app`).

## Ingestion (Section 6)
`src/adapters.ts` defines the adapter pattern and orchestrator:
- One adapter per source, all emitting the same normalized shape.
- Confidence tiers (official_feed > licensed_api > structured_page >
  scraped_html > seed). A lower-confidence source never overwrites a verified row.
- Each adapter is wrapped in try/catch; a dead source is logged and alerted and
  never blanks the app.
- The `bootstrap` adapter seeds Supabase from `src/seed.ts` so the API is never
  empty. The `wsop`, `wpt`, `hendonmob`, `pokeratlas`, and `per-room` adapters
  are scaffolded with the architecture and documented next steps; implement the
  fetch + parse against current sources, preferring official feeds and licensed
  APIs over scraping. PokerAtlas / Hendon Mob licensing is the highest-value
  business step.

Run ingestion manually in dev:
```powershell
wrangler dev --test-scheduled
# then hit http://localhost:8787/__scheduled
```

The cron schedule is set in `wrangler.toml` (daily 09:00 UTC).

## Tables
See `supabase/schema.sql`: rooms, series, tournaments, rake_snapshots (versioned
rake history), ingest_diffs (change log for "schedule updated" alerts), and
room_aliases (canonical venue alias registry - venues rename and merge often).
