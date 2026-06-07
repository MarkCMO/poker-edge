/**
 * Hand-vs-player-type guidance (Section 4.5). A structured advice matrix keyed
 * on your hand class x the villain type. Study content only - presented as cards
 * and quiz prompts, never as a live "do this now" feed at the table.
 *
 * The teachings encoded here are sound, standard poker strategy.
 */
import type { PlayerType } from '../types';

export type HandClass = 'premium' | 'strong' | 'speculative' | 'marginal' | 'trash';

export const HAND_CLASSES: { id: HandClass; label: string; examples: string }[] = [
  { id: 'premium', label: 'Premium', examples: 'AA, KK, QQ, AK' },
  { id: 'strong', label: 'Strong', examples: 'JJ-99, AQ, AJs, KQs' },
  { id: 'speculative', label: 'Speculative', examples: 'small pairs, suited connectors, suited aces' },
  { id: 'marginal', label: 'Marginal', examples: 'weak broadways, ace-rag offsuit, KJo' },
  { id: 'trash', label: 'Trash', examples: 'offsuit gappers, unconnected low cards' },
];

export const VILLAIN_TYPES: { id: PlayerType; label: string; read: string }[] = [
  {
    id: 'nit',
    label: 'Nit',
    read: 'Their raises, and especially their 3bets, are strong. They overfold. Steal their blinds relentlessly and do not pay them off when they wake up.',
  },
  {
    id: 'tag',
    label: 'TAG',
    read: 'Tight-aggressive thinking player. Balance, mix your lines, use position, and avoid bluffing into capped ranges.',
  },
  {
    id: 'lag',
    label: 'LAG',
    read: 'Loose-aggressive thinking player. Let them barrel into your strong hands, do not get out of line, and pick spots in position.',
  },
  {
    id: 'calling_station',
    label: 'Station / Fish',
    read: 'They call too much and never fold. Stop bluffing. Bet your value thin and relentlessly, widen value, narrow bluffs to near zero.',
  },
  {
    id: 'maniac',
    label: 'Maniac',
    read: 'Hyper-aggressive, wide range. Tighten up, let them bet your strong hands for you, trap, and call down lighter than usual.',
  },
  {
    id: 'fish',
    label: 'Fish',
    read: 'Recreational, makes fundamental errors. Value bet relentlessly, avoid fancy bluffs, and isolate them in position.',
  },
  {
    id: 'unknown',
    label: 'Unknown',
    read: 'No read yet. Play a solid default, watch their showdowns, and build a profile.',
  },
];

// matrix[handClass][villainType] -> advice
type Matrix = Record<HandClass, Partial<Record<PlayerType, string>>>;

export const ADVICE: Matrix = {
  premium: {
    nit: 'Raise and re-raise for value, but slow down if a true nit 4bets - that range is often just KK+ and AK. Stack off, but read the very biggest action.',
    tag: 'Three-bet and four-bet for value. Build the pot. They can find folds, so charge their strong but second-best holdings.',
    lag: 'Let them hang themselves. Re-raise for value and call down. Their wide aggression pays off your premiums.',
    calling_station: 'Pure value. Bet big on every street. They will call with far worse. Do not get cute - just extract.',
    fish: 'Bet for value relentlessly across all three streets. Size up. They pay off top pair, so they will pay off your premiums.',
    maniac: 'Trap and induce. Flat to let them barrel, then raise. Stack off light - their range is enormous.',
  },
  strong: {
    nit: 'Open and isolate, but respect 3bets - fold many of these to a nit re-raise. Steal their blinds with them.',
    tag: 'Standard value opens. Be ready to fold to heavy aggression on bad runouts. Do not overplay one pair.',
    lag: 'Call down more than you think. Their bluffs are frequent. Avoid bloating the pot out of position.',
    calling_station: 'Value bet thin and often. Three streets of value with top pair good kicker is fine. Do not bluff.',
    fish: 'Isolate and value bet. Top pair is gold against a fish - bet it for three streets.',
    maniac: 'Let them bet. Check-call or trap rather than building the pot yourself. Reassess on scary boards.',
  },
  speculative: {
    nit: 'Great implied odds - set-mine and play suited connectors cheaply. Stack them when you hit because their value range is face-up.',
    tag: 'Play in position, realize equity, and fold when you miss. Do not pay big bets without a real hand or draw.',
    lag: 'Position and pot control. These hands flop well enough to float and take pots away on later streets.',
    calling_station: 'Play for the nuts. Set-mine and chase strong draws, but stop bluffing - you only win at showdown.',
    fish: 'Cheap to see flops, big payoff when you hit. Set-mine aggressively and value bet your made hands.',
    maniac: 'Speculative hands lose value here - you rarely get to realize equity cheaply. Tighten and trap with the top of your range instead.',
  },
  marginal: {
    nit: 'Steal their blinds with these, but fold to resistance. No showdown value against a face-up strong range.',
    tag: 'Mostly fold or use as occasional position steals. These hands get dominated and cost you.',
    lag: 'Fold most of these. You will be put to tough decisions out of position with a weak holding.',
    calling_station: 'Fold unless you flop big. You cannot bluff them and these hands rarely make the best hand.',
    fish: 'Playable in position to flop a pair and value-bet, but do not overcommit. Fold to real aggression.',
    maniac: 'Fold. You do not want a marginal hand facing relentless aggression. Wait for a hand that can call down.',
  },
  trash: {
    nit: 'Fold preflop. Only a blind steal in late position is defensible, and give up when called.',
    tag: 'Fold. Nothing here is worth a battle against a thinking player.',
    lag: 'Fold. Do not get drawn into a war with a hand that cannot continue.',
    calling_station: 'Fold. You cannot bluff a station and trash hands do not make value.',
    fish: 'Fold. Save these chips for a spot where you have an edge.',
    maniac: 'Fold and wait. The maniac will give you a better spot soon with a real hand.',
  },
};

export function adviceFor(hand: HandClass, villain: PlayerType): string {
  return ADVICE[hand][villain] ?? 'Play a solid default and watch their next showdown to refine your read.';
}
