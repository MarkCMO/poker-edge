import type { Env, ApiRoom, ApiSeries, ApiTournament, SourceTier } from './types';
import { CONFIDENCE } from './types';
import { selectAll, upsert, isConfigured } from './db';
import { roomToRow, seriesToRow, tournamentToRow } from './normalize';
import { BOOTSTRAP_ROOMS, BOOTSTRAP_SERIES, BOOTSTRAP_TOURNAMENTS } from './seed';

export interface IngestResult {
  rooms: ApiRoom[];
  series: ApiSeries[];
  tournaments: ApiTournament[];
  source: SourceTier;
}

export interface Adapter {
  name: string;
  run: (env: Env) => Promise<IngestResult>;
}

const empty = (source: SourceTier): IngestResult => ({ rooms: [], series: [], tournaments: [], source });

/**
 * Bootstrap adapter - seeds Supabase from the bundled dataset on first run so
 * the API is never empty. Lowest confidence; every other adapter overrides it.
 */
const bootstrapAdapter: Adapter = {
  name: 'bootstrap',
  run: async () => ({
    rooms: BOOTSTRAP_ROOMS,
    series: BOOTSTRAP_SERIES,
    tournaments: BOOTSTRAP_TOURNAMENTS,
    source: 'seed',
  }),
};

/**
 * WSOP adapter. PREFERRED PATH: structured schedule pages at wsop.com.
 * Pull series + every bracelet/circuit event, buy-in, dates, venue.
 * Cadence: daily during a series, weekly otherwise.
 * TODO: implement the fetch + parse against the current wsop.com markup, with
 * polite rate limits and caching. Respect ToS. Tier: structured_page.
 */
const wsopAdapter: Adapter = {
  name: 'wsop',
  run: async () => empty('structured_page'),
};

/**
 * WPT adapter. wpt.com / WPT Global schedule pages. Season stops, championship
 * events, buy-ins, guarantees, venues. Tier: structured_page.
 */
const wptAdapter: Adapter = {
  name: 'wpt',
  run: async () => empty('structured_page'),
};

/**
 * Hendon Mob adapter. pokerdb.thehendonmob.com festival schedules + results.
 * Best for the global series calendar and historical leaderboards.
 * PREFERRED PATH: licensing. Tier: licensed_api once a deal is in place.
 */
const hendonMobAdapter: Adapter = {
  name: 'hendonmob',
  run: async () => empty('licensed_api'),
};

/**
 * PokerAtlas adapter. The richest single source for rooms + dailies + live
 * waitlists nationwide. PURSUE A DATA-LICENSING DEAL / TableCaptain partnership
 * rather than scraping (highest-value business step). Tier: licensed_api.
 */
const pokerAtlasAdapter: Adapter = {
  name: 'pokeratlas',
  run: async () => empty('licensed_api'),
};

/**
 * Per-room calendars. Many venues (Borgata, Wynn, Bellagio, Aria, Venetian,
 * Seminole Hard Rock) expose iCal/JSON event calendars - prefer those over HTML.
 * Tier: structured_page.
 */
const perRoomAdapter: Adapter = {
  name: 'per-room',
  run: async () => empty('structured_page'),
};

export const ADAPTERS: Adapter[] = [
  bootstrapAdapter,
  wsopAdapter,
  wptAdapter,
  hendonMobAdapter,
  pokerAtlasAdapter,
  perRoomAdapter,
];

async function alertOps(env: Env, subject: string, body: string): Promise<void> {
  if (!env.RESEND_API_KEY || !env.OPS_ALERT_EMAIL) return;
  // Transactional ops alert - skips the bulk validation waterfall by design.
  const to = env.OPS_ALERT_EMAIL.split(',')[0].trim();
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Poker Edge Ingestion <ops@pokeredge.app>', to, subject, text: body }),
  }).catch(() => {});
}

/**
 * Run all adapters. One dead source must never blank the app: failures are
 * caught, logged, and alerted; the last-good data stays in place. Confidence
 * tiers prevent a low-confidence scrape from clobbering a verified row.
 */
export async function runIngestion(env: Env): Promise<{ summary: string }> {
  if (!isConfigured(env)) {
    return { summary: 'Supabase not configured; skipping ingestion.' };
  }

  // Existing source tiers, so we never downgrade a verified row.
  const existingRooms = await selectAll<{ id: string; source: string }>(env, 'rooms', 'select=id,source').catch(() => []);
  const existingTourneys = await selectAll<{ id: string; source: string }>(env, 'tournaments', 'select=id,source').catch(() => []);
  const roomTier = new Map(existingRooms.map((r) => [r.id, CONFIDENCE[(r.source as SourceTier)] ?? 0]));
  const tourneyTier = new Map(existingTourneys.map((t) => [t.id, CONFIDENCE[(t.source as SourceTier)] ?? 0]));

  const lines: string[] = [];

  for (const adapter of ADAPTERS) {
    try {
      const res = await adapter.run(env);
      const tier = CONFIDENCE[res.source];

      const rooms = res.rooms.filter((r) => tier >= (roomTier.get(r.id) ?? -1));
      const tourneys = res.tournaments.filter((t) => tier >= (tourneyTier.get(t.id) ?? -1));

      await upsert(env, 'rooms', rooms.map((r) => roomToRow(r, res.source)));
      await upsert(env, 'series', res.series.map((s) => seriesToRow(s, res.source)));
      await upsert(env, 'tournaments', tourneys.map((t) => tournamentToRow(t, res.source)));

      rooms.forEach((r) => roomTier.set(r.id, tier));
      tourneys.forEach((t) => tourneyTier.set(t.id, tier));

      lines.push(`${adapter.name}: ${rooms.length} rooms, ${res.series.length} series, ${tourneys.length} tournaments`);
    } catch (err) {
      const msg = `Adapter ${adapter.name} failed: ${(err as Error).message}`;
      lines.push(msg);
      await alertOps(env, `Poker Edge ingestion: ${adapter.name} failed`, msg);
    }
  }

  return { summary: lines.join('\n') };
}
