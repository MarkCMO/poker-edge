import { getDb, makeId } from './database';
import type { BankrollAccount, BankrollTxn, TxnType } from '../types';

interface AccountRow {
  id: string;
  name: string;
  currency: string;
  createdAt: number;
}

interface TxnRow {
  id: string;
  accountId: string;
  type: string;
  amount: number;
  date: number;
  linkedSessionId: string | null;
  note: string;
}

export function listAccounts(): BankrollAccount[] {
  const db = getDb();
  return db.getAllSync<AccountRow>(
    'SELECT * FROM bankroll_accounts ORDER BY createdAt ASC'
  );
}

export function createAccount(name: string, currency = 'USD'): string {
  const db = getDb();
  const id = makeId('acct-');
  db.runSync(
    'INSERT INTO bankroll_accounts (id, name, currency, createdAt) VALUES (?, ?, ?, ?)',
    [id, name, currency, Date.now()]
  );
  return id;
}

export function accountBalance(accountId: string): number {
  const db = getDb();
  const row = db.getFirstSync<{ total: number | null }>(
    'SELECT SUM(amount) as total FROM bankroll_txns WHERE accountId = ?',
    [accountId]
  );
  return row?.total ?? 0;
}

export function totalBankroll(): number {
  const db = getDb();
  const row = db.getFirstSync<{ total: number | null }>(
    'SELECT SUM(amount) as total FROM bankroll_txns'
  );
  return row?.total ?? 0;
}

export function addTxn(input: {
  accountId: string;
  type: TxnType;
  amount: number;
  note?: string;
  date?: number;
  linkedSessionId?: string | null;
}): string {
  const db = getDb();
  const id = makeId('txn-');
  db.runSync(
    `INSERT INTO bankroll_txns (id, accountId, type, amount, date, linkedSessionId, note)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.accountId,
      input.type,
      input.amount,
      input.date ?? Date.now(),
      input.linkedSessionId ?? null,
      input.note ?? '',
    ]
  );
  return id;
}

export function listTxns(accountId?: string): BankrollTxn[] {
  const db = getDb();
  const rows = accountId
    ? db.getAllSync<TxnRow>(
        'SELECT * FROM bankroll_txns WHERE accountId = ? ORDER BY date DESC',
        [accountId]
      )
    : db.getAllSync<TxnRow>('SELECT * FROM bankroll_txns ORDER BY date DESC');
  return rows.map((r) => ({ ...r, type: r.type as TxnType }));
}

export function deleteTxn(id: string): void {
  getDb().runSync('DELETE FROM bankroll_txns WHERE id = ?', [id]);
}

/** Running bankroll series for the line chart, oldest first. */
export function bankrollSeries(): { date: number; balance: number }[] {
  const txns = [...listTxns()].sort((a, b) => a.date - b.date);
  let running = 0;
  return txns.map((t) => {
    running += t.amount;
    return { date: t.date, balance: running };
  });
}
