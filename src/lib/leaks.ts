/**
 * Leak detection (Phase 9, Section E.2). Aggregates per-hand flags into
 * frequencies, compares them to solver-informed baselines, and ranks the
 * exploitable deviations by estimated EV cost. Each leak maps to a drill.
 */
import type { ParsedHand } from './handHistory';

export interface StatSummary {
  hands: number;
  vpip: number; // %
  pfr: number;
  threeBet: number;
  foldToThreeBet: number;
  cbet: number;
  foldToCbet: number;
  wtsd: number; // went to showdown %
  wsd: number; // won at showdown %
}

export interface LeakReport {
  stat: string;
  label: string;
  userValue: number;
  baselineValue: number;
  deviation: number; // signed, percentage points
  evCostEst: number; // estimated bb/100 cost (heuristic)
  drillRef: string;
  note: string;
}

const pct = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0);

export function computeStats(hands: ParsedHand[]): StatSummary {
  const n = hands.length;
  const facedThreeBet = hands.filter((h) => h.facedThreeBet).length;
  const couldCbet = hands.filter((h) => h.couldCbet).length;
  const facedCbet = hands.filter((h) => h.facedCbet).length;
  const sawFlop = hands.filter((h) => h.sawFlop).length;
  const wtsd = hands.filter((h) => h.wentToShowdown).length;
  // opportunities to 3bet ~ hands where hero was not the opener and faced a raise: approximate with all hands
  return {
    hands: n,
    vpip: pct(hands.filter((h) => h.vpip).length, n),
    pfr: pct(hands.filter((h) => h.pfr).length, n),
    threeBet: pct(hands.filter((h) => h.threeBet).length, n),
    foldToThreeBet: pct(hands.filter((h) => h.foldedToThreeBet).length, facedThreeBet),
    cbet: pct(hands.filter((h) => h.cbetFlop).length, couldCbet),
    foldToCbet: pct(hands.filter((h) => h.foldedToCbet).length, facedCbet),
    wtsd: pct(wtsd, sawFlop),
    wsd: pct(hands.filter((h) => h.wonAtShowdown).length, wtsd),
  };
}

interface Baseline {
  stat: keyof StatSummary;
  label: string;
  target: number;
  low: number;
  high: number;
  weight: number; // bb/100 cost per point of deviation beyond the band
  drillRef: string;
  highNote: string; // when user value is too high
  lowNote: string; // when too low
  minSample: number;
}

// Solver-informed 6-max cash baselines (rake-unaware; advise tighter in high rake).
const BASELINES: Baseline[] = [
  { stat: 'vpip', label: 'VPIP', target: 24, low: 21, high: 28, weight: 0.6, drillRef: 'preflop_open', minSample: 200,
    highNote: 'You play too many hands. Tighten your opening and calling ranges.', lowNote: 'You play too few hands. You can profitably open wider, especially in late position.' },
  { stat: 'pfr', label: 'PFR', target: 19, low: 16, high: 23, weight: 0.6, drillRef: 'preflop_open', minSample: 200,
    highNote: 'You raise a very wide range. Make sure it is not too loose out of position.', lowNote: 'You are too passive preflop. Raise more and limp less.' },
  { stat: 'threeBet', label: '3-bet %', target: 8, low: 6, high: 11, weight: 0.8, drillRef: 'three_bet', minSample: 200,
    highNote: 'Your 3-bet frequency is high. Confirm you have the value to back it up.', lowNote: 'You 3-bet too little. Add light 3-bets in position to pressure opens.' },
  { stat: 'foldToThreeBet', label: 'Fold to 3-bet', target: 52, low: 45, high: 60, weight: 1.1, drillRef: 'fold_to_3bet', minSample: 60,
    highNote: 'You overfold to 3-bets. This is exploitable; defend more by calling and 4-betting.', lowNote: 'You call 3-bets too wide. Fold your weakest opens out of position.' },
  { stat: 'cbet', label: 'C-bet flop', target: 55, low: 45, high: 68, weight: 0.7, drillRef: 'cbet', minSample: 80,
    highNote: 'You c-bet too often. Check back more on boards that favor the caller.', lowNote: 'You c-bet too little. Take down more pots as the preflop aggressor on good boards.' },
  { stat: 'foldToCbet', label: 'Fold to c-bet', target: 45, low: 38, high: 55, weight: 1.0, drillRef: 'fold_to_cbet', minSample: 80,
    highNote: 'You fold to c-bets too much. Float and check-raise more to fight back.', lowNote: 'You call c-bets too wide. Give up your weakest hands.' },
  { stat: 'wtsd', label: 'Went to showdown', target: 27, low: 23, high: 32, weight: 0.5, drillRef: 'showdown', minSample: 100,
    highNote: 'You go to showdown too often. Fold more on the river with bluff-catchers.', lowNote: 'You reach showdown too rarely. You may be folding winners on the river.' },
];

export function detectLeaks(hands: ParsedHand[]): LeakReport[] {
  const s = computeStats(hands);
  const leaks: LeakReport[] = [];
  for (const b of BASELINES) {
    const val = s[b.stat] as number;
    // skip if not enough sample for this stat (proxy: total hands)
    if (s.hands < b.minSample) continue;
    let deviation = 0;
    let note = '';
    if (val > b.high) { deviation = val - b.high; note = b.highNote; }
    else if (val < b.low) { deviation = val - b.low; note = b.lowNote; }
    else continue; // within healthy band
    const evCostEst = Math.abs(deviation) * b.weight;
    leaks.push({
      stat: b.stat, label: b.label, userValue: Math.round(val * 10) / 10,
      baselineValue: b.target, deviation: Math.round(deviation * 10) / 10,
      evCostEst: Math.round(evCostEst * 10) / 10, drillRef: b.drillRef, note,
    });
  }
  return leaks.sort((a, b) => b.evCostEst - a.evCostEst);
}
