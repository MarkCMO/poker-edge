/**
 * Preflop range library (Section 4.5). Solver-derived baselines for study only.
 * These are teaching defaults, not a live solver and not table assistance.
 *
 * Hands are referenced by their canonical 13x13 grid label: pairs ("AA"),
 * suited ("AKs"), offsuit ("AKo").
 */

export const GRID_RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

/** Build the 13x13 grid of canonical hand labels (suited upper-right). */
export function gridHands(): string[][] {
  const grid: string[][] = [];
  for (let i = 0; i < 13; i++) {
    const row: string[] = [];
    for (let j = 0; j < 13; j++) {
      if (i === j) row.push(GRID_RANKS[i] + GRID_RANKS[i]);
      else if (j > i) row.push(GRID_RANKS[i] + GRID_RANKS[j] + 's');
      else row.push(GRID_RANKS[j] + GRID_RANKS[i] + 'o');
    }
    grid.push(row);
  }
  return grid;
}

export interface RangeChart {
  id: string;
  label: string;
  format: 'cash' | 'tournament';
  stackDepth: string;
  action: string;
  notes: string;
  hands: string[]; // canonical labels in the range
}

export const RANGE_CHARTS: RangeChart[] = [
  {
    id: 'cash-utg-rfi',
    label: 'UTG open',
    format: 'cash',
    stackDepth: '100bb (6-max)',
    action: 'Raise first in',
    notes: 'Tightest opening position. Out of position to most of the table postflop.',
    hands: [
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
      'AKs', 'AQs', 'AJs', 'ATs', 'A5s', 'A4s',
      'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s', '98s',
      'AKo', 'AQo', 'AJo', 'KQo',
    ],
  },
  {
    id: 'cash-mp-rfi',
    label: 'MP open',
    format: 'cash',
    stackDepth: '100bb (6-max)',
    action: 'Raise first in',
    notes: 'Slightly wider than UTG. Still respect the players left to act.',
    hands: [
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33',
      'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A5s', 'A4s', 'A3s',
      'KQs', 'KJs', 'KTs', 'K9s', 'QJs', 'QTs', 'Q9s', 'JTs', 'J9s', 'T9s', '98s', '87s',
      'AKo', 'AQo', 'AJo', 'ATo', 'KQo', 'KJo',
    ],
  },
  {
    id: 'cash-co-rfi',
    label: 'CO open',
    format: 'cash',
    stackDepth: '100bb (6-max)',
    action: 'Raise first in',
    notes: 'Position pays. Open wide and apply pressure to the blinds.',
    hands: [
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
      'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
      'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'QJs', 'QTs', 'Q9s', 'JTs', 'J9s', 'T9s', 'T8s',
      '98s', '87s', '76s', '65s', '54s',
      'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'KQo', 'KJo', 'KTo', 'QJo', 'QTo', 'JTo',
    ],
  },
  {
    id: 'cash-btn-rfi',
    label: 'Button open',
    format: 'cash',
    stackDepth: '100bb (6-max)',
    action: 'Raise first in',
    notes: 'Widest opening range. You will be in position on every street.',
    hands: [
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
      'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
      'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
      'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'JTs', 'J9s', 'J8s', 'J7s',
      'T9s', 'T8s', 'T7s', '98s', '97s', '87s', '86s', '76s', '75s', '65s', '54s', '43s',
      'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A5o',
      'KQo', 'KJo', 'KTo', 'K9o', 'QJo', 'QTo', 'Q9o', 'JTo', 'J9o', 'T9o', '98o',
    ],
  },
  {
    id: 'cash-sb-rfi',
    label: 'Small blind open',
    format: 'cash',
    stackDepth: '100bb (6-max)',
    action: 'Raise first in (vs BB)',
    notes: 'Raise-or-fold heads up to the big blind. Limping invites trouble out of position.',
    hands: [
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
      'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
      'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'QJs', 'QTs', 'Q9s', 'JTs', 'J9s', 'T9s', '98s', '87s', '76s', '65s',
      'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'KQo', 'KJo', 'KTo', 'QJo', 'QTo', 'JTo',
    ],
  },
  {
    id: 'cash-bb-3bet-vs-btn',
    label: 'BB 3bet vs Button',
    format: 'cash',
    stackDepth: '100bb (6-max)',
    action: '3bet vs a Button open',
    notes: 'A polarized 3bet: premium value plus suited-wheel and suited-broadway bluffs you can barrel.',
    hands: [
      'AA', 'KK', 'QQ', 'JJ', 'TT',
      'AKs', 'AQs', 'AJs', 'A5s', 'A4s', 'A3s',
      'KQs', 'KJs', 'QJs', 'JTs', 'T9s', '76s', '65s',
      'AKo', 'AQo',
    ],
  },
  {
    id: 'mtt-btn-shove-15bb',
    label: 'Button shove (15bb)',
    format: 'tournament',
    stackDepth: '15bb',
    action: 'Open-shove (push/fold)',
    notes: 'Short-stack ICM. From the button you can jam a wide range against two blinds.',
    hands: [
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
      'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
      'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'QJs', 'QTs', 'Q9s', 'JTs', 'J9s', 'T9s', '98s', '87s', '76s',
      'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'KQo', 'KJo', 'KTo', 'QJo', 'QTo', 'JTo',
    ],
  },
  {
    id: 'mtt-sb-shove-15bb',
    label: 'Small blind shove (15bb)',
    format: 'tournament',
    stackDepth: '15bb',
    action: 'Open-shove (push/fold)',
    notes: 'Heads up to the big blind. Jam wide but a touch tighter than the button.',
    hands: [
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
      'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
      'KQs', 'KJs', 'KTs', 'K9s', 'QJs', 'QTs', 'JTs', 'J9s', 'T9s', '98s', '87s',
      'AKo', 'AQo', 'AJo', 'ATo', 'KQo', 'KJo', 'QJo',
    ],
  },
];
