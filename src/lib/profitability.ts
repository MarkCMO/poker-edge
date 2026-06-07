/**
 * Room structural EV score (Section 7) - objective, defensible, explainable.
 * This is NOT "guaranteed profit" and NOT a softest-games claim. It scores how
 * player-friendly a room's rake and comp STRUCTURE is. Tapping the score in the
 * UI shows this exact breakdown.
 *
 * The separate "personal room score" (the user's realized hourly at each room)
 * lives in analytics.ts and is private to them.
 */
import type { Room } from '../types';

export interface ScoreLine {
  label: string;
  delta: number;
}

export interface StructuralScore {
  score: number; // 0-100 clamped
  lines: ScoreLine[];
}

const BASELINE_CAP = 5; // standard Las Vegas $5 cap

export function structuralEv(room: Room): StructuralScore {
  const r = room.rake;
  const lines: ScoreLine[] = [];
  let score = 100;

  // Rake cap above the $5 baseline is the single biggest EV drag.
  if (r.cap > BASELINE_CAP) {
    const over = r.cap - BASELINE_CAP;
    const delta = -Math.min(30, over * 6);
    lines.push({ label: `Rake cap $${r.cap} (above $${BASELINE_CAP} baseline)`, delta });
    score += delta;
  } else {
    lines.push({ label: `Rake cap $${r.cap} at or below baseline`, delta: 0 });
  }

  // Promo / jackpot drop is dead money pulled off every pot.
  if (r.promoDrop > 0) {
    const delta = -Math.min(25, 10 + r.promoDrop * 3);
    lines.push({ label: `Promo / jackpot drop $${r.promoDrop} (dead money)`, delta });
    score += delta;
  } else {
    lines.push({ label: 'No promo / jackpot drop', delta: 6 });
    score += 6;
  }

  // No flop, no drop protects you on folded pots.
  if (r.noFlopNoDrop) {
    lines.push({ label: 'No flop, no drop', delta: 4 });
    score += 4;
  } else {
    lines.push({ label: 'Rake taken even with no flop', delta: -6 });
    score += -6;
  }

  // Per-hour comp credit offsets rake.
  if (room.compPerHour > 0) {
    const delta = Math.min(9, Math.round(room.compPerHour * 3));
    lines.push({ label: `Comp $${room.compPerHour}/hr`, delta });
    score += delta;
  }

  // Buy-in cap - higher lets skill and stack depth matter.
  if (r.buyInCap != null) {
    if (r.buyInCap >= 1000) {
      lines.push({ label: `Deep buy-in cap $${r.buyInCap}`, delta: 8 });
      score += 8;
    } else if (r.buyInCap >= 500) {
      lines.push({ label: `Buy-in cap $${r.buyInCap}`, delta: 4 });
      score += 4;
    } else {
      lines.push({ label: `Shallow buy-in cap $${r.buyInCap}`, delta: -8 });
      score += -8;
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, lines };
}

export function scoreBand(score: number): { label: string; tone: 'win' | 'warn' | 'loss' } {
  if (score >= 80) return { label: 'Strong', tone: 'win' };
  if (score >= 60) return { label: 'Fair', tone: 'warn' };
  return { label: 'Heavy', tone: 'loss' };
}
