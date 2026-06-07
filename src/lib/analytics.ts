/**
 * Session analytics (Section 4.2) computed from the user's OWN logged results -
 * never generic data. Powers the "most profitable room/game for YOU" metric and
 * the welfare trend signals (Section 4.6).
 */
import type { SessionComputed } from '../types';

const LIVE_HANDS_PER_HOUR = 30; // standard estimate for live full-ring

export function bigBlindOf(stakes: string): number {
  // "1/3" -> 3, "2/5" -> 5, "5/10" -> 10
  const parts = stakes.split('/').map((p) => parseFloat(p.replace(/[^0-9.]/g, '')));
  const bb = parts[1];
  return Number.isFinite(bb) && bb > 0 ? bb : parts[0] || 1;
}

export interface Aggregate {
  key: string;
  sessions: number;
  hours: number;
  net: number;
  hourly: number;
}

function aggregate(sessions: SessionComputed[], keyOf: (s: SessionComputed) => string): Aggregate[] {
  const map = new Map<string, Aggregate>();
  for (const s of sessions) {
    const key = keyOf(s);
    const a = map.get(key) ?? { key, sessions: 0, hours: 0, net: 0, hourly: 0 };
    a.sessions += 1;
    a.hours += s.durationMinutes / 60;
    a.net += s.result;
    map.set(key, a);
  }
  const out = [...map.values()];
  for (const a of out) a.hourly = a.hours > 0 ? a.net / a.hours : 0;
  return out.sort((x, y) => y.net - x.net);
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function byRoom(s: SessionComputed[]): Aggregate[] {
  return aggregate(s, (x) => x.roomNameCached || 'Unspecified room');
}

export function byStakes(s: SessionComputed[]): Aggregate[] {
  return aggregate(s, (x) => x.stakes || 'Unspecified');
}

export function byGame(s: SessionComputed[]): Aggregate[] {
  return aggregate(s, (x) => x.gameType);
}

export function byDayOfWeek(s: SessionComputed[]): Aggregate[] {
  return aggregate(s, (x) => DAY_NAMES[new Date(x.startTime).getDay()]);
}

export function byTimeOfDay(s: SessionComputed[]): Aggregate[] {
  return aggregate(s, (x) => {
    const h = new Date(x.startTime).getHours();
    if (h < 6) return 'Late night';
    if (h < 12) return 'Morning';
    if (h < 18) return 'Afternoon';
    return 'Evening';
  });
}

export interface Totals {
  sessions: number;
  hours: number;
  net: number;
  hourly: number;
  winRate: number; // % of sessions in profit
  bestSession: number;
  worstSession: number;
  bb100Cash: number; // estimated, cash sessions only
  roiTournament: number; // % across tournament/sitngo
}

export function totals(sessions: SessionComputed[]): Totals {
  const done = sessions.filter((s) => s.endTime !== null);
  const net = done.reduce((a, s) => a + s.result, 0);
  const hours = done.reduce((a, s) => a + s.durationMinutes / 60, 0);
  const wins = done.filter((s) => s.result > 0).length;
  const best = done.reduce((m, s) => Math.max(m, s.result), 0);
  const worst = done.reduce((m, s) => Math.min(m, s.result), 0);

  // bb/100 estimate for cash sessions
  const cash = done.filter((s) => s.format === 'cash');
  let bbWon = 0;
  let estHands = 0;
  for (const s of cash) {
    const bb = bigBlindOf(s.stakes);
    bbWon += bb > 0 ? s.result / bb : 0;
    estHands += (s.durationMinutes / 60) * LIVE_HANDS_PER_HOUR;
  }
  const bb100 = estHands > 0 ? (bbWon / estHands) * 100 : 0;

  // ROI for tournaments
  const mtt = done.filter((s) => s.format === 'tournament' || s.format === 'sitngo');
  const invested = mtt.reduce((a, s) => a + s.buyIn + s.rebuysTotal, 0);
  const returned = mtt.reduce((a, s) => a + s.cashOut, 0);
  const roi = invested > 0 ? ((returned - invested) / invested) * 100 : 0;

  return {
    sessions: done.length,
    hours,
    net,
    hourly: hours > 0 ? net / hours : 0,
    winRate: done.length > 0 ? (wins / done.length) * 100 : 0,
    bestSession: best,
    worstSession: worst,
    bb100Cash: bb100,
    roiTournament: roi,
  };
}

/**
 * Welfare signal (Section 4.6): does the user bleed money after a fatigue
 * threshold? Buckets each session's result by its length and reports averages.
 */
export function fatigueTrend(
  sessions: SessionComputed[],
  thresholdHours = 6
): { underAvg: number; overAvg: number; overCount: number; bleeds: boolean } {
  const done = sessions.filter((s) => s.endTime !== null);
  const under = done.filter((s) => s.durationMinutes / 60 < thresholdHours);
  const over = done.filter((s) => s.durationMinutes / 60 >= thresholdHours);
  const avg = (arr: SessionComputed[]) =>
    arr.length ? arr.reduce((a, s) => a + s.result, 0) / arr.length : 0;
  const overAvg = avg(over);
  return {
    underAvg: avg(under),
    overAvg,
    overCount: over.length,
    bleeds: over.length >= 5 && overAvg < 0,
  };
}

/** Longest break-even-or-worse stretch and deepest drawdown, in dollars. */
export function variance(sessions: SessionComputed[]): {
  maxDrawdown: number;
  longestBreakEvenSessions: number;
} {
  const done = [...sessions]
    .filter((s) => s.endTime !== null)
    .sort((a, b) => a.startTime - b.startTime);
  let peak = 0;
  let running = 0;
  let maxDd = 0;
  let curStretch = 0;
  let longest = 0;
  for (const s of done) {
    running += s.result;
    peak = Math.max(peak, running);
    maxDd = Math.max(maxDd, peak - running);
    if (s.result <= 0) {
      curStretch += 1;
      longest = Math.max(longest, curStretch);
    } else {
      curStretch = 0;
    }
  }
  return { maxDrawdown: maxDd, longestBreakEvenSessions: longest };
}
