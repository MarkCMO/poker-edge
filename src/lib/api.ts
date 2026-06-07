/**
 * Reference-data client (Section 6). The iOS app NEVER scrapes - it reads only
 * from our own API, which is fed by the server-side ingestion layer. This keeps
 * the binary store-safe and resilient to source-site changes.
 *
 * Offline-first: try the network, fall back to the last cached payload, and fall
 * back again to the bundled seed so the Rooms and Schedule tabs always render
 * something with a freshness timestamp (Section 5).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { Room, Series, Tournament } from '../types';
import { SEED_ROOMS } from '../data/seedRooms';
import { SEED_SERIES, SEED_TOURNAMENTS } from '../data/seedSchedule';

const API_BASE =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? 'https://api.pokeredge.app';

export type DataSource = 'live' | 'cache' | 'seed';

export interface Fetched<T> {
  data: T;
  source: DataSource;
  lastFetched: number | null;
}

async function loadCache<T>(key: string): Promise<{ data: T; ts: number } | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function saveCache<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // best-effort cache; never block the UI on a write failure
  }
}

async function fetchWithFallback<T>(
  path: string,
  cacheKey: string,
  seed: T
): Promise<Fetched<T>> {
  // 1. Try the live API with a short timeout (casino signal is flaky).
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = (await res.json()) as T;
      await saveCache(cacheKey, data);
      return { data, source: 'live', lastFetched: Date.now() };
    }
  } catch {
    // fall through to cache / seed
  }

  // 2. Last good cached payload.
  const cached = await loadCache<T>(cacheKey);
  if (cached) {
    return { data: cached.data, source: 'cache', lastFetched: cached.ts };
  }

  // 3. Bundled seed.
  return { data: seed, source: 'seed', lastFetched: null };
}

export function getRooms(): Promise<Fetched<Room[]>> {
  return fetchWithFallback<Room[]>('/v1/rooms', 'cache:rooms', SEED_ROOMS);
}

export function getSeries(): Promise<Fetched<Series[]>> {
  return fetchWithFallback<Series[]>('/v1/series', 'cache:series', SEED_SERIES);
}

export function getTournaments(): Promise<Fetched<Tournament[]>> {
  return fetchWithFallback<Tournament[]>('/v1/tournaments', 'cache:tournaments', SEED_TOURNAMENTS);
}

export function sourceLabel(source: DataSource, lastFetched: number | null): string {
  if (source === 'live') return 'Live data';
  if (source === 'cache' && lastFetched) {
    const days = Math.floor((Date.now() - lastFetched) / 86400000);
    return days <= 0 ? 'Cached today' : `Cached ${days}d ago`;
  }
  return 'Bundled data (offline)';
}
