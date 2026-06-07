/**
 * Variance, confidence intervals, and risk of ruin for cash-game bankroll
 * planning. Win rate and standard deviation are per hour, in dollars. Risk of
 * ruin uses the standard continuous approximation RoR = e^(-2 * WR * B / sd^2).
 */
export interface VarianceInput {
  winRate: number; // $/hr expected
  stdDev: number; // $/hr standard deviation (typical live NLHE ~ 80-120 for 1/2-2/5)
  hours: number; // projection horizon
  bankroll: number; // current roll in $
}

export interface VarianceResult {
  expected: number;
  sd: number;
  lower95: number;
  upper95: number;
  downswingP05: number; // 5th percentile outcome
  riskOfRuin: number; // 0..1
  breakEvenProb: number; // P(result < 0) over the horizon
}

function normalCdf(z: number): number {
  // Abramowitz-Stegun approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z) / 1;
  const p =
    d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

export function computeVariance(input: VarianceInput): VarianceResult {
  const { winRate, stdDev, hours, bankroll } = input;
  const expected = winRate * hours;
  const sd = stdDev * Math.sqrt(Math.max(0, hours));
  const lower95 = expected - 1.96 * sd;
  const upper95 = expected + 1.96 * sd;
  const downswingP05 = expected - 1.645 * sd;
  const riskOfRuin =
    winRate > 0 && stdDev > 0 ? Math.min(1, Math.exp((-2 * winRate * bankroll) / (stdDev * stdDev))) : 1;
  const breakEvenProb = sd > 0 ? normalCdf((0 - expected) / sd) : expected < 0 ? 1 : 0;
  return { expected, sd, lower95, upper95, downswingP05, riskOfRuin, breakEvenProb };
}

/** Bankroll needed to hold risk of ruin at or below the target. */
export function recommendedBankroll(winRate: number, stdDev: number, targetRoR: number): number {
  if (winRate <= 0 || stdDev <= 0) return Infinity;
  return (stdDev * stdDev * -Math.log(targetRoR)) / (2 * winRate);
}
