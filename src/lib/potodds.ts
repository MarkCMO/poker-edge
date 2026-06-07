/**
 * Pot odds, outs-to-equity, and call EV. The core at-the-table math: am I being
 * priced in to call, and do my outs give me enough equity to continue.
 */

/** Pot odds as the share of the final pot you must put in to call. */
export function potOdds(callAmount: number, potBeforeCall: number): { pct: number; ratio: string } {
  if (callAmount <= 0) return { pct: 0, ratio: '0:1' };
  const pct = (callAmount / (potBeforeCall + callAmount)) * 100;
  const r = potBeforeCall / callAmount;
  return { pct, ratio: `${r.toFixed(1)}:1` };
}

/** Equity from outs. Uses exact unseen-card counts (47 after flop, 46 after turn). */
export function equityFromOuts(outs: number, cardsToCome: 1 | 2): number {
  if (outs <= 0) return 0;
  if (cardsToCome === 1) return Math.min(1, outs / 46);
  // two cards: 1 - P(miss turn) * P(miss river)
  const miss = ((47 - outs) / 47) * ((46 - outs) / 46);
  return 1 - miss;
}

/** Rule of 2 and 4 quick estimate. */
export function ruleOfThumb(outs: number, cardsToCome: 1 | 2): number {
  return Math.min(1, (outs * (cardsToCome === 2 ? 4 : 2)) / 100);
}

/** EV of a call given your equity and the pot/bet. Positive = profitable call. */
export function callEv(equity: number, callAmount: number, potBeforeCall: number): number {
  return equity * (potBeforeCall + callAmount) - callAmount;
}

export interface DrawType {
  label: string;
  outs: number;
  note: string;
}

export const COMMON_DRAWS: DrawType[] = [
  { label: 'Flush draw', outs: 9, note: 'Four to a flush.' },
  { label: 'Open-ended straight', outs: 8, note: 'Straight draw open both ends.' },
  { label: 'Flush + gutshot', outs: 12, note: 'Combo draw.' },
  { label: 'Flush + open-ender', outs: 15, note: 'Monster combo draw.' },
  { label: 'Gutshot straight', outs: 4, note: 'Inside straight draw.' },
  { label: 'Two overcards', outs: 6, note: 'Two cards above the board.' },
  { label: 'Set to full/quads', outs: 7, note: 'Improve a set on the turn.' },
  { label: 'Pair to two pair/trips', outs: 5, note: 'Pair improving.' },
  { label: 'One overcard', outs: 3, note: 'One card above the board.' },
  { label: 'Pocket pair to set', outs: 2, note: 'Hit your set.' },
];

export const pct1 = (p: number): string => (p * 100).toFixed(1) + '%';
