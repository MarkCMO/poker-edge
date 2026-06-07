/**
 * Postflop strategy clusters (Phase 8, Section D). Curated single-raised-pot
 * c-bet baselines for the in-position preflop aggressor, bucketed by flop
 * texture. This is a CURATED baseline, not solver-precise output - the runtime
 * always labels results with the approximation flag and the bet tree.
 *
 * To replace with real solver data: run the offline solve pipeline (Section D.1)
 * over these texture clusters and overwrite the frequencies, keeping the keys.
 */

export interface ClusterStrategy {
  id: string;
  label: string;
  cbetFreq: number; // % of range to bet
  sizing: string; // recommended sizing
  note: string;
}

export const SOLVE_META = {
  solverUsed: 'Poker Edge curated baseline',
  version: '1.0',
  generatedAt: '2026-06-06',
  assumptions: 'Single-raised pot, heads-up, in-position preflop aggressor, 100bb, rake-unaware.',
  betSizingTree: 'Flop: 33% or 75% pot. Approximation by nearest texture cluster.',
};

export const CLUSTERS: Record<string, ClusterStrategy> = {
  dry_high: { id: 'dry_high', label: 'Dry high (A/K-high, rainbow, disconnected)', cbetFreq: 78, sizing: '33% pot', note: 'Range-bet small. You hold the nut advantage on ace/king-high dry boards.' },
  dry_low: { id: 'dry_low', label: 'Dry low (low, rainbow, disconnected)', cbetFreq: 62, sizing: '33% pot', note: 'C-bet small at a high frequency; few draws are out there to punish you.' },
  paired: { id: 'paired', label: 'Paired board', cbetFreq: 68, sizing: '33% pot', note: 'Bet small often. Paired boards reduce the caller’s strong combos.' },
  two_tone_high: { id: 'two_tone_high', label: 'Two-tone high', cbetFreq: 58, sizing: '33-75% mixed', note: 'Mix sizings. Protect equity against flush draws while keeping a betting range.' },
  two_tone_low: { id: 'two_tone_low', label: 'Two-tone low', cbetFreq: 52, sizing: '33-75% mixed', note: 'Check more than on high boards; the caller connects with more of these.' },
  connected_wet: { id: 'connected_wet', label: 'Connected / wet', cbetFreq: 46, sizing: '75% pot polar', note: 'Bet bigger and more polar; check back a wider middling range.' },
  broadway_connected: { id: 'broadway_connected', label: 'Broadway connected (e.g. KQJ)', cbetFreq: 42, sizing: '75% pot polar', note: 'These hit the caller hard. Check often; bet your strong hands and best draws larger.' },
  monotone: { id: 'monotone', label: 'Monotone', cbetFreq: 38, sizing: '33% pot', note: 'Bet small and infrequently; a made flush or the bare ace of the suit defines the range.' },
};
