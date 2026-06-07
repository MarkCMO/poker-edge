/**
 * AI explain client (Phase 11). Posts engine output to the Worker, which runs
 * the constrained model. Study only - never live assistance.
 */
import Constants from 'expo-constants';

const API_BASE =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? 'https://api.pokeredge.app';

export interface ExplainInput {
  kind: 'equity' | 'postflop' | 'icm' | 'leak';
  numbers: unknown;
  assumptions?: string;
  question?: string;
}

export async function explainSpot(
  input: ExplainInput
): Promise<{ explanation?: string; error?: string; notConfigured?: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/v1/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (res.status === 501) return { notConfigured: true, error: 'AI explanations are not enabled yet.' };
    const j = await res.json();
    if (!res.ok) return { error: j.error ?? `Error ${res.status}` };
    return { explanation: j.explanation };
  } catch {
    return { error: 'Network error. Try again with a connection.' };
  }
}
