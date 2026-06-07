/**
 * ICM engine (Phase 7, Section C.3). Malmuth-Harville model for tournament
 * finish-place equity. Pure, on-device. Feeds the tournament advisor: pay-jump
 * pressure, risk premium, and push/fold under ICM.
 */

/**
 * Expected prize money for each stack given a payout structure, using the
 * recursive Harville method (probability of each finishing order weighted by
 * chip share at each step).
 */
export function icmEquities(stacks: number[], payouts: number[]): number[] {
  const n = stacks.length;
  const results = new Array(n).fill(0);
  const places = Math.min(payouts.length, n);
  const total = stacks.reduce((a, b) => a + b, 0);
  if (total <= 0) return results;

  // Recurse over finishing positions. `taken` marks eliminated-into-place seats.
  const taken = new Array(n).fill(false);
  const recurse = (remainingTotal: number, place: number, prob: number) => {
    if (place >= places || prob === 0) return;
    for (let i = 0; i < n; i++) {
      if (taken[i] || stacks[i] <= 0) continue;
      const p = (prob * stacks[i]) / remainingTotal;
      results[i] += p * payouts[place];
      taken[i] = true;
      recurse(remainingTotal - stacks[i], place + 1, p);
      taken[i] = false;
    }
  };
  recurse(total, 0, 1);
  return results;
}

/** Probability each seat finishes 1st (chip-share). */
export function winProbabilities(stacks: number[]): number[] {
  const total = stacks.reduce((a, b) => a + b, 0) || 1;
  return stacks.map((s) => s / total);
}

/**
 * Risk premium for the hero: how much extra raw equity is needed to justify a
 * stack-off, because ICM penalizes busting. Compared to a pure chip-EV game,
 * a positive risk premium means play tighter.
 *
 * Returns the chip-EV breakeven vs the ICM-adjusted breakeven for a hero who
 * risks `riskAmount` chips to win `winAmount` chips against one opponent.
 */
export function riskPremium(
  stacks: number[],
  payouts: number[],
  heroIndex: number,
  riskChips: number
): { chipEvBreakeven: number; icmBreakeven: number; premium: number } {
  const base = icmEquities(stacks, payouts);
  const heroNow = base[heroIndex];

  // Win scenario: hero gains riskChips from the field (approximate: take from
  // the largest other stack), lose scenario: hero busts (stack 0).
  const winStacks = stacks.slice();
  const loseStacks = stacks.slice();
  // pick the largest opponent to model the confrontation
  let opp = -1;
  for (let i = 0; i < stacks.length; i++) {
    if (i === heroIndex) continue;
    if (opp === -1 || stacks[i] > stacks[opp]) opp = i;
  }
  const amt = Math.min(riskChips, opp >= 0 ? stacks[opp] : 0);
  if (opp >= 0) {
    winStacks[heroIndex] += amt;
    winStacks[opp] -= amt;
    loseStacks[heroIndex] -= amt;
    loseStacks[opp] += amt;
  }
  const winEq = icmEquities(winStacks, payouts)[heroIndex];
  const loseEq = icmEquities(loseStacks, payouts)[heroIndex];

  // Equity needed so that p*winEq + (1-p)*loseEq >= heroNow
  const denom = winEq - loseEq;
  const icmBreakeven = denom !== 0 ? (heroNow - loseEq) / denom : 0.5;
  const chipEvBreakeven = 0.5; // symmetric chip race baseline
  return { chipEvBreakeven, icmBreakeven, premium: icmBreakeven - chipEvBreakeven };
}

/** Even chop: split the remaining prize pool by chip stacks (ICM-fair). */
export function icmChop(stacks: number[], payouts: number[]): number[] {
  return icmEquities(stacks, payouts);
}

/** Save-and-play chop: pay each player their ICM equity, leave a set amount to play for. */
export function icmDeal(
  stacks: number[],
  payouts: number[],
  leaveForPlay: number
): { lockedUp: number[]; playingFor: number } {
  const totalPool = payouts.reduce((a, b) => a + b, 0);
  const reduced = scaleDownTopPrizes(payouts, leaveForPlay);
  const locked = icmEquities(stacks, reduced);
  return { lockedUp: locked, playingFor: Math.min(leaveForPlay, totalPool) };
}

function scaleDownTopPrizes(payouts: number[], leaveForPlay: number): number[] {
  // Remove `leaveForPlay` from the prize pool proportionally off the top finishes
  // so the locked-up ICM reflects the reduced guaranteed money.
  const out = payouts.slice();
  let toRemove = leaveForPlay;
  for (let i = 0; i < out.length && toRemove > 0; i++) {
    const take = Math.min(out[i], toRemove / (i + 1));
    out[i] -= take;
    toRemove -= take;
  }
  return out;
}
