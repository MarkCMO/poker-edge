/**
 * Local equity engine for the Study tab (Section 4.5). Pure on-device compute,
 * no network. This is a study tool, not table assistance.
 *
 * Includes a direct 7-card hand evaluator and a Monte Carlo simulator for
 * hand-vs-hand and hand-vs-range equity.
 */
import { Card, cardId, fullDeck, parseCards, RANKS } from './cards';

// ---- 7-card evaluator ----
// Returns a single comparable integer. Higher is better.
// Encoding: category (0-8) then up to 5 tiebreak ranks in base 16.

function encode(category: number, kickers: number[]): number {
  let v = category;
  for (let i = 0; i < 5; i++) {
    v = v * 16 + (kickers[i] ?? 0);
  }
  return v;
}

/** Best straight high card from a set of present ranks. Handles the wheel. */
function straightHigh(present: boolean[]): number {
  // present indexed by rank 2..14. Ace also plays low for A-5.
  let run = 0;
  // check from 14 down to 2, but include Ace-low by treating rank 1 as Ace
  // Build extended presence with rank 1 = ace low
  const ext: boolean[] = present.slice();
  ext[1] = present[14]; // ace low
  for (let r = 14; r >= 1; r--) {
    if (ext[r]) {
      run += 1;
      if (run >= 5) return r + 4; // high card of the 5-straight
    } else {
      run = 0;
    }
  }
  return 0;
}

export function eval7(cards: Card[]): number {
  const rankCount: number[] = new Array(15).fill(0);
  const suitCount: number[] = [0, 0, 0, 0];
  const present: boolean[] = new Array(15).fill(false);
  const suitRanks: number[][] = [[], [], [], []];

  for (const c of cards) {
    rankCount[c.rank] += 1;
    suitCount[c.suit] += 1;
    present[c.rank] = true;
    suitRanks[c.suit].push(c.rank);
  }

  // Flush suit
  let flushSuit = -1;
  for (let s = 0; s < 4; s++) if (suitCount[s] >= 5) flushSuit = s;

  // Straight flush
  if (flushSuit >= 0) {
    const fp: boolean[] = new Array(15).fill(false);
    for (const r of suitRanks[flushSuit]) fp[r] = true;
    const sfHigh = straightHigh(fp);
    if (sfHigh > 0) return encode(8, [sfHigh]);
  }

  // Group ranks by count
  const quads: number[] = [];
  const trips: number[] = [];
  const pairs: number[] = [];
  const singles: number[] = [];
  for (let r = 14; r >= 2; r--) {
    if (rankCount[r] === 4) quads.push(r);
    else if (rankCount[r] === 3) trips.push(r);
    else if (rankCount[r] === 2) pairs.push(r);
    else if (rankCount[r] === 1) singles.push(r);
  }

  // Quads
  if (quads.length) {
    const kicker = [...trips, ...pairs, ...singles].sort((a, b) => b - a)[0] ?? 0;
    return encode(7, [quads[0], kicker]);
  }

  // Full house
  if (trips.length >= 2) {
    return encode(6, [trips[0], trips[1]]);
  }
  if (trips.length === 1 && pairs.length >= 1) {
    return encode(6, [trips[0], pairs[0]]);
  }

  // Flush
  if (flushSuit >= 0) {
    const top = [...suitRanks[flushSuit]].sort((a, b) => b - a).slice(0, 5);
    return encode(5, top);
  }

  // Straight
  const stHigh = straightHigh(present);
  if (stHigh > 0) return encode(4, [stHigh]);

  // Trips
  if (trips.length === 1) {
    const kickers = singles.slice(0, 2);
    return encode(3, [trips[0], ...kickers]);
  }

  // Two pair
  if (pairs.length >= 2) {
    const kicker = [...pairs.slice(2), ...singles].sort((a, b) => b - a)[0] ?? 0;
    return encode(2, [pairs[0], pairs[1], kicker]);
  }

  // One pair
  if (pairs.length === 1) {
    const kickers = singles.slice(0, 3);
    return encode(1, [pairs[0], ...kickers]);
  }

  // High card
  return encode(0, singles.slice(0, 5));
}

export const HAND_CATEGORIES = [
  'High card',
  'Pair',
  'Two pair',
  'Three of a kind',
  'Straight',
  'Flush',
  'Full house',
  'Four of a kind',
  'Straight flush',
];

export function categoryOf(score: number): string {
  // category is the leading digits: score / 16^5
  const cat = Math.floor(score / 16 ** 5);
  return HAND_CATEGORIES[cat] ?? 'High card';
}

// ---- Monte Carlo ----

export interface EquityInput {
  hero: Card[]; // 2 cards
  villainCombos: Card[][]; // each entry is a 2-card combo; range = many
  board?: Card[]; // 0-5 known cards
  iterations?: number;
}

export interface EquityResult {
  win: number;
  tie: number;
  lose: number;
  equity: number; // 0-1
  samples: number;
  ci95: number; // +/- 95% confidence interval on equity (0 when exact)
  exact: boolean; // true when fully enumerated
}

function shuffleInPlace(arr: Card[], upTo: number): void {
  // Fisher-Yates partial shuffle for the first `upTo` slots.
  for (let i = 0; i < upTo; i++) {
    const j = i + Math.floor(Math.random() * (arr.length - i));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
}

export function simulate(input: EquityInput): EquityResult {
  const iterations = input.iterations ?? 12000;
  const hero = input.hero;
  const board = input.board ?? [];
  const range = input.villainCombos;
  if (hero.length !== 2 || range.length === 0) {
    return { win: 0, tie: 0, lose: 0, equity: 0, samples: 0, ci95: 0, exact: false };
  }

  // Exact enumeration when the space is small: a single villain combo and at
  // most 2 board cards left to come (turn/river or river). Otherwise Monte Carlo.
  if (range.length === 1) {
    const need = 5 - board.length;
    if (need <= 2) return enumerateExact(hero, range[0], board);
  }

  const used = new Set<number>();
  for (const c of hero) used.add(cardId(c));
  for (const c of board) used.add(cardId(c));

  let win = 0;
  let tie = 0;
  let lose = 0;
  let samples = 0;

  const baseDeck = fullDeck().filter((c) => !used.has(cardId(c)));

  for (let it = 0; it < iterations; it++) {
    // Sample a villain combo not conflicting with hero/board.
    let villain: Card[] | null = null;
    for (let attempt = 0; attempt < 12; attempt++) {
      const combo = range[Math.floor(Math.random() * range.length)];
      if (!used.has(cardId(combo[0])) && !used.has(cardId(combo[1])) &&
          cardId(combo[0]) !== cardId(combo[1])) {
        villain = combo;
        break;
      }
    }
    if (!villain) continue;

    const vIds = new Set([cardId(villain[0]), cardId(villain[1])]);
    const deck = baseDeck.filter((c) => !vIds.has(cardId(c)));
    const need = 5 - board.length;
    shuffleInPlace(deck, need);
    const runout = deck.slice(0, need);

    const fullBoard = [...board, ...runout];
    const heroScore = eval7([...hero, ...fullBoard]);
    const villScore = eval7([...villain, ...fullBoard]);

    if (heroScore > villScore) win += 1;
    else if (heroScore < villScore) lose += 1;
    else tie += 1;
    samples += 1;
  }

  const equity = samples > 0 ? (win + tie / 2) / samples : 0;
  const ci95 = samples > 0 ? 1.96 * Math.sqrt((equity * (1 - equity)) / samples) : 0;
  return { win, tie, lose, equity, samples, ci95, exact: false };
}

/** Exact enumeration of all remaining runouts (hero vs one villain combo). */
function enumerateExact(hero: Card[], villain: Card[], board: Card[]): EquityResult {
  const used = new Set<number>([...hero, ...villain, ...board].map(cardId));
  const deck = fullDeck().filter((c) => !used.has(cardId(c)));
  const need = 5 - board.length;
  let win = 0, tie = 0, lose = 0, samples = 0;

  const evalOne = (extra: Card[]) => {
    const full = [...board, ...extra];
    const h = eval7([...hero, ...full]);
    const v = eval7([...villain, ...full]);
    if (h > v) win++; else if (h < v) lose++; else tie++;
    samples++;
  };

  if (need === 0) evalOne([]);
  else if (need === 1) for (const c of deck) evalOne([c]);
  else for (let i = 0; i < deck.length; i++) for (let j = i + 1; j < deck.length; j++) evalOne([deck[i], deck[j]]);

  const equity = samples > 0 ? (win + tie / 2) / samples : 0;
  return { win, tie, lose, equity, samples, ci95: 0, exact: true };
}

/**
 * Multiway equity: hero vs N opponents each holding a random hand. Answers
 * "with hand X, what are my odds of winning when Y players see the flop?"
 */
export function simulateMultiway(
  hero: Card[],
  numOpponents: number,
  board: Card[] = [],
  iterations = 8000
): EquityResult {
  if (hero.length !== 2 || numOpponents < 1) {
    return { win: 0, tie: 0, lose: 0, equity: 0, samples: 0, ci95: 0, exact: false };
  }
  const used = new Set<number>([...hero, ...board].map(cardId));
  const baseDeck = fullDeck().filter((c) => !used.has(cardId(c)));
  let win = 0, tie = 0, lose = 0, samples = 0;

  for (let it = 0; it < iterations; it++) {
    const deck = baseDeck.slice();
    // deal opponents (2 each) then the remaining board
    const needBoard = 5 - board.length;
    const draw = numOpponents * 2 + needBoard;
    if (draw > deck.length) break;
    shuffleInPlace(deck, draw);
    let k = 0;
    const opps: Card[][] = [];
    for (let o = 0; o < numOpponents; o++) opps.push([deck[k++], deck[k++]]);
    const runout = deck.slice(k, k + needBoard);
    const fullBoard = [...board, ...runout];
    const heroScore = eval7([...hero, ...fullBoard]);
    let best = heroScore, ties = 0, beaten = false;
    for (const o of opps) {
      const s = eval7([...o, ...fullBoard]);
      if (s > heroScore) { beaten = true; break; }
      if (s === heroScore) ties++;
      if (s > best) best = s;
    }
    if (beaten) lose++;
    else if (ties > 0) tie++;
    else win++;
    samples++;
  }
  const equity = samples > 0 ? (win + tie / 2) / samples : 0;
  const ci95 = samples > 0 ? 1.96 * Math.sqrt((equity * (1 - equity)) / samples) : 0;
  return { win, tie, lose, equity, samples, ci95, exact: false };
}

// ---- Range expansion ----
// Parse "AA, AKs, KQo, TT+, ATs+" into concrete 2-card combos.

function comboFor(r1: number, r2: number, kind: 'pair' | 's' | 'o' | 'both'): Card[][] {
  const out: Card[][] = [];
  if (kind === 'pair') {
    for (let a = 0; a < 4; a++)
      for (let b = a + 1; b < 4; b++) out.push([{ rank: r1, suit: a }, { rank: r1, suit: b }]);
    return out;
  }
  const hi = Math.max(r1, r2);
  const lo = Math.min(r1, r2);
  if (kind === 's' || kind === 'both') {
    for (let s = 0; s < 4; s++) out.push([{ rank: hi, suit: s }, { rank: lo, suit: s }]);
  }
  if (kind === 'o' || kind === 'both') {
    for (let a = 0; a < 4; a++)
      for (let b = 0; b < 4; b++)
        if (a !== b) out.push([{ rank: hi, suit: a }, { rank: lo, suit: b }]);
  }
  return out;
}

interface ParsedHand {
  isPair: boolean;
  hi: number;
  lo: number;
  kind: 'pair' | 's' | 'o' | 'both';
}

function parseHandToken(body: string): ParsedHand | null {
  const r1 = RANKS.indexOf(body[0]?.toUpperCase()) + 2;
  const r2 = RANKS.indexOf(body[1]?.toUpperCase()) + 2;
  if (r1 < 2) return null;
  if (body.length >= 2 && body[0]?.toUpperCase() === body[1]?.toUpperCase()) {
    return { isPair: true, hi: r1, lo: r1, kind: 'pair' };
  }
  if (r2 < 2) return null;
  const suited = body[2]?.toLowerCase() === 's';
  const offsuit = body[2]?.toLowerCase() === 'o';
  return {
    isPair: false,
    hi: Math.max(r1, r2),
    lo: Math.min(r1, r2),
    kind: suited ? 's' : offsuit ? 'o' : 'both',
  };
}

export function expandRange(rangeStr: string): Card[][] {
  const tokens = rangeStr.split(',').map((t) => t.trim()).filter(Boolean);
  const seen = new Set<string>();
  const out: Card[][] = [];
  const push = (combos: Card[][]) => {
    for (const c of combos) {
      const key = [c[0], c[1]].map((x) => x.rank * 4 + x.suit).sort((a, b) => a - b).join('-');
      if (!seen.has(key)) { seen.add(key); out.push(c); }
    }
  };

  for (const raw of tokens) {
    const tok = raw.replace(/\s/g, '');

    // Dash range: "AA-QQ", "A5s-A2s", "76s-54s"
    if (tok.includes('-')) {
      const [aStr, bStr] = tok.split('-');
      const a = parseHandToken(aStr);
      const b = parseHandToken(bStr);
      if (!a || !b) continue;
      if (a.isPair && b.isPair) {
        const lo = Math.min(a.hi, b.hi), hi = Math.max(a.hi, b.hi);
        for (let r = lo; r <= hi; r++) push(comboFor(r, r, 'pair'));
      } else if (!a.isPair && !b.isPair && a.kind === b.kind) {
        if (a.hi === b.hi) {
          const lo = Math.min(a.lo, b.lo), hi = Math.max(a.lo, b.lo);
          for (let r = lo; r <= hi; r++) push(comboFor(a.hi, r, a.kind));
        } else if (a.hi - a.lo === b.hi - b.lo) {
          const gap = a.hi - a.lo;
          const lo = Math.min(a.hi, b.hi), hi = Math.max(a.hi, b.hi);
          for (let r = lo; r <= hi; r++) push(comboFor(r, r - gap, a.kind));
        } else {
          push(comboFor(a.hi, a.lo, a.kind));
          push(comboFor(b.hi, b.lo, b.kind));
        }
      }
      continue;
    }

    // Plus and single tokens
    const plus = tok.endsWith('+');
    const body = plus ? tok.slice(0, -1) : tok;
    const p = parseHandToken(body);
    if (!p) continue;

    if (p.isPair) {
      if (plus) for (let r = p.hi; r <= 14; r++) push(comboFor(r, r, 'pair'));
      else push(comboFor(p.hi, p.hi, 'pair'));
    } else if (plus) {
      for (let r = p.lo; r < p.hi; r++) push(comboFor(p.hi, r, p.kind));
    } else {
      push(comboFor(p.hi, p.lo, p.kind));
    }
  }
  return out;
}

/** Convenience: build a range of N random combos for a "vs random hand". */
export function randomRange(): Card[][] {
  const deck = fullDeck();
  const out: Card[][] = [];
  for (let i = 0; i < deck.length; i++)
    for (let j = i + 1; j < deck.length; j++) out.push([deck[i], deck[j]]);
  return out;
}

export function parseHand(str: string): Card[] {
  return parseCards(str).slice(0, 2);
}
