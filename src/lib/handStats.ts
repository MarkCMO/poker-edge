/**
 * Personal hand statistics from the user's logged hands. Answers "what hands
 * have I actually been playing, how have they performed, and from where."
 * Note: logged hands are a biased sample (people log notable hands), so dealt
 * frequencies here describe what you chose to record, not true deal odds - the
 * Odds tool covers true deal probability.
 */
import { listHands } from '../db/hands';
import { parseCards, RANKS } from './cards';

export interface HandClass {
  label: string; // "AA", "AKs", "T9o"
  category: 'pair' | 'suited' | 'offsuit' | 'unknown';
  isPair: boolean;
  isPremium: boolean;
  isBroadway: boolean;
}

export function classifyHole(holeCards: string): HandClass | null {
  const cs = parseCards(holeCards);
  if (cs.length < 2) return null;
  let a = cs[0];
  let b = cs[1];
  if (b.rank > a.rank) {
    const t = a;
    a = b;
    b = t;
  }
  const hi = RANKS[a.rank - 2];
  const lo = RANKS[b.rank - 2];
  if (a.rank === b.rank) {
    return { label: hi + hi, category: 'pair', isPair: true, isPremium: a.rank >= 12, isBroadway: a.rank >= 10 };
  }
  const suited = a.suit === b.suit;
  const label = hi + lo + (suited ? 's' : 'o');
  const premium = label === 'AKs' || label === 'AKo';
  const broadway = a.rank >= 10 && b.rank >= 10;
  return { label, category: suited ? 'suited' : 'offsuit', isPair: false, isPremium: premium, isBroadway: broadway };
}

export interface HandStats {
  total: number;
  classified: number;
  pairs: number;
  pairsPct: number;
  premium: number;
  premiumPct: number;
  suited: number;
  suitedPct: number;
  broadway: number;
  broadwayPct: number;
  net: number;
  winners: number;
  winRate: number;
  byClass: { label: string; count: number; net: number }[];
  byPosition: { position: string; count: number; net: number }[];
}

export function computeHandStats(): HandStats {
  const hands = listHands();
  const total = hands.length;
  let classified = 0;
  let pairs = 0;
  let premium = 0;
  let suited = 0;
  let broadway = 0;
  let net = 0;
  let winners = 0;
  const classMap = new Map<string, { count: number; net: number }>();
  const posMap = new Map<string, { count: number; net: number }>();

  for (const h of hands) {
    net += h.result || 0;
    if ((h.result || 0) > 0) winners++;
    const c = classifyHole(h.holeCards);
    if (c) {
      classified++;
      if (c.isPair) pairs++;
      if (c.isPremium) premium++;
      if (c.category === 'suited') suited++;
      if (c.isBroadway) broadway++;
      const cm = classMap.get(c.label) ?? { count: 0, net: 0 };
      cm.count++;
      cm.net += h.result || 0;
      classMap.set(c.label, cm);
    }
    const pos = h.position || 'Unknown';
    const pm = posMap.get(pos) ?? { count: 0, net: 0 };
    pm.count++;
    pm.net += h.result || 0;
    posMap.set(pos, pm);
  }

  const denom = classified || 1;
  return {
    total,
    classified,
    pairs,
    pairsPct: (pairs / denom) * 100,
    premium,
    premiumPct: (premium / denom) * 100,
    suited,
    suitedPct: (suited / denom) * 100,
    broadway,
    broadwayPct: (broadway / denom) * 100,
    net,
    winners,
    winRate: total ? (winners / total) * 100 : 0,
    byClass: [...classMap.entries()]
      .map(([label, v]) => ({ label, count: v.count, net: v.net }))
      .sort((a, b) => b.count - a.count),
    byPosition: [...posMap.entries()]
      .map(([position, v]) => ({ position, count: v.count, net: v.net }))
      .sort((a, b) => b.count - a.count),
  };
}
