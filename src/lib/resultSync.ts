/**
 * External result sync (Phase 10, Section F). SharkScope (online MTT/SNG results
 * + opponent stats) and Hendon Mob (live results + player records). The app
 * never holds B2B credentials - it calls our Worker, which holds the licensed
 * keys and enforces their query limits and ToS (Section F.3). Inert until the
 * Worker is configured with credentials; degrades to a clear "not configured".
 */
import Constants from 'expo-constants';

const API_BASE =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? 'https://api.pokeredge.app';

export interface ExternalResult {
  source: 'sharkscope' | 'hendonmob';
  name: string;
  date: string;
  venue: string;
  buyIn: number;
  prize: number;
  position: number | null;
  fetchedAt: number;
}

export interface PlayerStatsExternal {
  opponentId: string;
  source: 'sharkscope' | 'hendonmob';
  vpip: number | null;
  pfr: number | null;
  threeBet: number | null;
  roi: number | null;
  sampleSize: number;
  fetchedAt: number;
}

export interface SyncResponse<T> {
  configured: boolean;
  data: T | null;
  message?: string;
}

async function call<T>(path: string): Promise<SyncResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (res.status === 501) {
      const j = await res.json().catch(() => ({}));
      return { configured: false, data: null, message: j.error ?? 'Not configured' };
    }
    if (!res.ok) return { configured: true, data: null, message: `Error ${res.status}` };
    return { configured: true, data: (await res.json()) as T };
  } catch {
    return { configured: false, data: null, message: 'Network error' };
  }
}

/** Online MTT/SNG results for the user (SharkScope), imported as sessions. */
export function fetchOnlineResults(username: string): Promise<SyncResponse<ExternalResult[]>> {
  return call(`/v1/external/online-results?user=${encodeURIComponent(username)}`);
}

/** Opponent online stats (SharkScope), seeds the villain classifier. */
export function fetchOpponentStats(name: string): Promise<SyncResponse<PlayerStatsExternal>> {
  return call(`/v1/external/player-stats?name=${encodeURIComponent(name)}`);
}

/** Live tournament record for a player (Hendon Mob). */
export function fetchLiveRecord(name: string): Promise<SyncResponse<ExternalResult[]>> {
  return call(`/v1/external/live-record?name=${encodeURIComponent(name)}`);
}
