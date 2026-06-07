/**
 * Flop texture classifier + nearest-cluster runtime (Phase 8, Section D.2).
 * Classifies an actual flop into the nearest curated cluster and returns its
 * strategy with the approximation flag and bet-tree assumptions. Never presents
 * a bucketed answer as an exact solve.
 */
import { parseCards } from './cards';
import { CLUSTERS, SOLVE_META, type ClusterStrategy } from '../data/postflopClusters';

export interface PostflopResult {
  cluster: ClusterStrategy;
  features: {
    paired: boolean;
    suitedness: 'rainbow' | 'two-tone' | 'monotone';
    highCard: number;
    connected: boolean;
  };
  approximationFlag: true;
  assumptions: string;
  betSizingTree: string;
  solverUsed: string;
}

/** Classify a 3-card flop string ("Ah 7c 2d") into a cluster id. */
export function classifyFlop(flopStr: string): string {
  const cards = parseCards(flopStr).slice(0, 3);
  if (cards.length < 3) return 'dry_high';

  const ranks = cards.map((c) => c.rank).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);
  const uniqueSuits = new Set(suits).size;
  const suitedness = uniqueSuits === 1 ? 'monotone' : uniqueSuits === 2 ? 'two-tone' : 'rainbow';
  const paired = ranks[0] === ranks[1] || ranks[1] === ranks[2];
  const highCard = ranks[0];
  // connectedness: small spread among the three ranks suggests straight texture
  const spread = ranks[0] - ranks[2];
  const connected = !paired && spread <= 4;
  const broadwayCount = ranks.filter((r) => r >= 11).length;

  if (suitedness === 'monotone') return 'monotone';
  if (paired) return 'paired';
  if (connected && broadwayCount >= 2) return 'broadway_connected';
  if (connected) return 'connected_wet';
  if (suitedness === 'two-tone') return highCard >= 11 ? 'two_tone_high' : 'two_tone_low';
  return highCard >= 12 ? 'dry_high' : 'dry_low';
}

export function postflopStrategy(flopStr: string): PostflopResult {
  const id = classifyFlop(flopStr);
  const cards = parseCards(flopStr).slice(0, 3);
  const ranks = cards.map((c) => c.rank).sort((a, b) => b - a);
  const uniqueSuits = new Set(cards.map((c) => c.suit)).size;
  return {
    cluster: CLUSTERS[id] ?? CLUSTERS.dry_high,
    features: {
      paired: ranks[0] === ranks[1] || ranks[1] === ranks[2],
      suitedness: uniqueSuits === 1 ? 'monotone' : uniqueSuits === 2 ? 'two-tone' : 'rainbow',
      highCard: ranks[0] ?? 0,
      connected: ranks.length === 3 && ranks[0] - ranks[2] <= 4 && ranks[0] !== ranks[1],
    },
    approximationFlag: true,
    assumptions: SOLVE_META.assumptions,
    betSizingTree: SOLVE_META.betSizingTree,
    solverUsed: SOLVE_META.solverUsed,
  };
}
