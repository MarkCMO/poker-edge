/**
 * Quiz / trainer spots (Section 4.5). Deal a spot, the user picks an action, the
 * app scores against the baseline and explains. Two kinds:
 *   1. Preflop range quizzes generated from the range library.
 *   2. Concept quizzes on hand-vs-player-type strategy.
 * Accuracy is tracked per spot type in quiz_results.
 */
import { RANGE_CHARTS, gridHands } from './ranges';

export interface QuizQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  spotType: string;
}

const ALL_HANDS = gridHands().flat();

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Generate a preflop raise-or-fold question from a random range chart. */
export function makePreflopQuestion(): QuizQuestion {
  const chart = pick(RANGE_CHARTS.filter((c) => c.action.startsWith('Raise') || c.action.startsWith('Open')));
  const hand = pick(ALL_HANDS);
  const inRange = chart.hands.includes(hand);
  const verb = chart.action.includes('shove') ? 'Shove' : 'Raise';
  return {
    prompt: `${chart.label} - ${chart.stackDepth}\nYou are dealt ${formatHand(hand)}. Action folds to you.`,
    options: [verb, 'Fold'],
    correctIndex: inRange ? 0 : 1,
    explanation: inRange
      ? `${formatHand(hand)} is in the ${chart.label} baseline range. ${chart.notes}`
      : `${formatHand(hand)} is a fold from the ${chart.label} baseline range. ${chart.notes}`,
    spotType: `preflop:${chart.id}`,
  };
}

function formatHand(label: string): string {
  if (label.length === 2) return `${label} (pair)`;
  const suited = label.endsWith('s');
  return `${label.slice(0, 2)} ${suited ? 'suited' : 'offsuit'}`;
}

export const CONCEPT_QUESTIONS: QuizQuestion[] = [
  {
    prompt: 'A pure calling station has called you down twice. You have missed your draw on the river with ace high. What do you do?',
    options: ['Fire a big bluff', 'Give up and check-fold', 'Bet small to fold them out'],
    correctIndex: 1,
    explanation: 'You cannot bluff a station off a hand. Stop bluffing and only bet for value. Give up when you have nothing.',
    spotType: 'concept:station-bluff',
  },
  {
    prompt: 'A rock-solid nit who has not played a hand in an hour suddenly 3bets you. You hold AJs. What is the play?',
    options: ['4bet for value', 'Call and see a flop', 'Fold'],
    correctIndex: 2,
    explanation: 'A nit 3bet is the top of their range. AJs is dominated by their value. Fold and steal their blinds later instead.',
    spotType: 'concept:nit-3bet',
  },
  {
    prompt: 'A maniac is raising every pot. You pick up QQ on the button. How do you proceed?',
    options: ['Flat to let them barrel, then trap', 'Make a small raise', 'Fold to avoid variance'],
    correctIndex: 0,
    explanation: 'Against a maniac, let them bet your strong hands for you. Trapping captures more value than building the pot yourself.',
    spotType: 'concept:maniac-trap',
  },
  {
    prompt: 'You flop top pair good kicker against an obvious fish who calls anything. How many streets of value?',
    options: ['One, then pot control', 'Three streets, sized up', 'Check it down'],
    correctIndex: 1,
    explanation: 'Fish pay off. Bet all three streets and size up. Thin value against a station is where your money comes from.',
    spotType: 'concept:fish-value',
  },
  {
    prompt: 'Against a thinking TAG on a board that smashes your perceived range, you have a missed draw. What is best?',
    options: ['Bluff - your range is strong here', 'Give up - they will not fold to a capped range', 'Min-bet for information'],
    correctIndex: 0,
    explanation: 'When the board favors your range and the TAG is capped, a bluff has real fold equity. Do not bluff into uncapped ranges, but attack capped ones.',
    spotType: 'concept:tag-rangebet',
  },
];

export function makeQuestion(): QuizQuestion {
  // Mix preflop and concept questions.
  return Math.random() < 0.6 ? makePreflopQuestion() : pick(CONCEPT_QUESTIONS);
}
