import type { Env } from './types';

/**
 * AI study/explanation layer (Phase 11, Section G). The model does NOT invent
 * strategy. It explains the structured output of our own engines (equity / ICM /
 * nearest-solve / leaks) in plain language, constrained to never contradict the
 * numbers. Runs on Cloudflare Workers AI via REST; key stays server-side.
 */

const MODEL = '@cf/meta/llama-3.1-8b-instruct';

const SYSTEM = [
  'You are a poker study assistant for serious live players.',
  'You explain the provided solver/equity/ICM output in clear, plain language.',
  'Hard rules:',
  '- Never state a frequency, equity, or action that contradicts the numbers given.',
  '- Always restate the assumptions provided (bet tree, stack depth, rake-unaware).',
  '- This is study away from the table, never real-time assistance for live play.',
  '- Be concise: under 180 words. No hype. Use hyphens, never em or en dashes.',
].join('\n');

export interface ExplainRequest {
  kind: 'equity' | 'postflop' | 'icm' | 'leak';
  numbers: unknown; // structured engine output
  assumptions?: string;
  question?: string;
}

export async function explain(env: Env, body: ExplainRequest): Promise<{ explanation: string } | { error: string }> {
  if (!env.CF_ACCOUNT_ID || !env.CF_AI_EMAIL || !env.CF_AI_KEY) {
    return { error: 'AI explain not configured' };
  }
  const user = [
    `Kind: ${body.kind}`,
    body.assumptions ? `Assumptions: ${body.assumptions}` : '',
    `Engine output (do not contradict these numbers):`,
    JSON.stringify(body.numbers),
    body.question ? `User question: ${body.question}` : 'Explain this spot and the recommended approach.',
  ].filter(Boolean).join('\n');

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/ai/run/${MODEL}`,
      {
        method: 'POST',
        headers: {
          'X-Auth-Email': env.CF_AI_EMAIL,
          'X-Auth-Key': env.CF_AI_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SYSTEM },
            { role: 'user', content: user },
          ],
          max_tokens: 400,
        }),
      }
    );
    const j = (await res.json()) as { result?: { response?: string }; errors?: unknown };
    const text = j.result?.response;
    if (!text) return { error: 'No explanation returned' };
    return { explanation: text.trim() };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
