/**
 * Poker dealt-hand probabilities and expectations. Pure combinatorics over the
 * C(52,2) = 1326 possible starting hands. Answers questions like "odds of being
 * dealt AA next," "how many hands until a pocket pair," and "chance of a premium
 * in the next orbit."
 */
export const TOTAL_STARTING_HANDS = 1326;

export interface DealtOdd {
  label: string;
  combos: number;
  note: string;
}

// combos: pair = 6, specific suited = 4, specific offsuit = 12, any = 16
export const DEALT_ODDS: DealtOdd[] = [
  { label: 'Pocket aces (AA)', combos: 6, note: 'A specific pocket pair.' },
  { label: 'Aces or kings (AA/KK)', combos: 12, note: 'Either of the top two pairs.' },
  { label: 'Any pocket pair', combos: 78, note: '13 ranks x 6 combos.' },
  { label: 'A premium pair (QQ+)', combos: 18, note: 'AA, KK, or QQ.' },
  { label: 'Ace-king (AK, any)', combos: 16, note: 'Suited or offsuit.' },
  { label: 'Ace-king suited (AKs)', combos: 4, note: 'The specific suited combo.' },
  { label: 'A premium hand (QQ+ or AK)', combos: 34, note: 'AA, KK, QQ, or AK.' },
  { label: 'Any ace', combos: 198, note: 'At least one ace in your hand.' },
  { label: 'Suited connectors (54s-JTs)', combos: 28, note: '7 connectors x 4 suits.' },
  { label: 'Any two broadway (T+)', combos: 140, note: 'Both cards ten or higher.' },
];

export const prob = (combos: number): number => combos / TOTAL_STARTING_HANDS;
export const oneIn = (combos: number): number => TOTAL_STARTING_HANDS / combos;

/** Probability of being dealt the hand at least once over n hands. */
export const atLeastOnce = (combos: number, n: number): number =>
  1 - Math.pow(1 - prob(combos), n);

/** Average number of hands you wait to see it (geometric mean). */
export const expectedHandsUntil = (combos: number): number => Math.round(oneIn(combos));

export const pct = (p: number): string => (p * 100 < 0.1 ? (p * 100).toFixed(2) : (p * 100).toFixed(1)) + '%';
