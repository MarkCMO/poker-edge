import type { Env } from './types';

/**
 * Thin Supabase REST client. The Worker uses the service-role key (server-only).
 * The iOS app never touches Supabase directly - it only reads our /v1 endpoints.
 */

export function isConfigured(env: Env): boolean {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY);
}

function headers(env: Env, extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: env.SUPABASE_SERVICE_KEY ?? '',
    Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY ?? ''}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

export async function selectAll<T>(env: Env, table: string, query = 'select=*'): Promise<T[]> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: headers(env),
  });
  if (!res.ok) throw new Error(`Supabase select ${table} failed: ${res.status}`);
  return (await res.json()) as T[];
}

/** Upsert with conflict resolution on primary key (merge-duplicates). */
export async function upsert<T extends object>(env: Env, table: string, rows: T[]): Promise<void> {
  if (rows.length === 0) return;
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: headers(env, { Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase upsert ${table} failed: ${res.status} ${body}`);
  }
}
