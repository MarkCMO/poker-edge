import { getDb, makeId, parseJsonArray, defaultAccountId } from './database';
import type { Session, SessionComputed } from '../types';

interface SessionRow {
  id: string;
  gameType: string;
  format: string;
  stakes: string;
  roomId: string | null;
  roomNameCached: string;
  tableNumber: string | null;
  seat: number | null;
  buyIn: number;
  cashOut: number;
  rebuysTotal: number;
  tips: number;
  startTime: number;
  endTime: number | null;
  moodStart: number | null;
  moodEnd: number | null;
  notes: string;
  tags: string;
}

function rowToSession(r: SessionRow): Session {
  return {
    id: r.id,
    gameType: r.gameType as Session['gameType'],
    format: r.format as Session['format'],
    stakes: r.stakes,
    roomId: r.roomId,
    roomNameCached: r.roomNameCached,
    tableNumber: r.tableNumber,
    seat: r.seat,
    buyIn: r.buyIn,
    cashOut: r.cashOut,
    rebuysTotal: r.rebuysTotal,
    tips: r.tips,
    startTime: r.startTime,
    endTime: r.endTime,
    moodStart: r.moodStart,
    moodEnd: r.moodEnd,
    notes: r.notes,
    tags: parseJsonArray(r.tags),
  };
}

export function computeSession(s: Session): SessionComputed {
  const end = s.endTime ?? Date.now();
  const durationMinutes = Math.max(0, Math.round((end - s.startTime) / 60000));
  const result = s.cashOut - s.buyIn - s.rebuysTotal - s.tips;
  const hours = durationMinutes / 60;
  const hourlyRate = hours > 0 ? result / hours : 0;
  return { ...s, durationMinutes, result, hourlyRate };
}

export interface NewSessionInput {
  gameType: Session['gameType'];
  format: Session['format'];
  stakes: string;
  roomId?: string | null;
  roomNameCached?: string;
  buyIn?: number;
  moodStart?: number | null;
}

/** Start a live session immediately. Fields can be filled in afterward. */
export function startSession(input: NewSessionInput): string {
  const db = getDb();
  const id = makeId('sess-');
  db.runSync(
    `INSERT INTO sessions
      (id, gameType, format, stakes, roomId, roomNameCached, tableNumber, seat,
       buyIn, cashOut, rebuysTotal, tips, startTime, endTime, moodStart, moodEnd, notes, tags)
     VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, 0, 0, 0, ?, NULL, ?, NULL, '', '[]')`,
    [
      id,
      input.gameType,
      input.format,
      input.stakes,
      input.roomId ?? null,
      input.roomNameCached ?? '',
      input.buyIn ?? 0,
      Date.now(),
      input.moodStart ?? null,
    ]
  );
  return id;
}

export interface CompletedSessionInput {
  gameType: Session['gameType'];
  format: Session['format'];
  stakes: string;
  roomId?: string | null;
  roomNameCached?: string;
  buyIn: number;
  rebuysTotal?: number;
  cashOut: number;
  tips?: number;
  startTime: number;
  endTime: number;
  moodEnd?: number | null;
  notes?: string;
  tags?: string[];
}

/** Add a past (already finished) session manually, for backfilling history. */
export function addCompletedSession(input: CompletedSessionInput): string {
  const db = getDb();
  const id = makeId('sess-');
  db.runSync(
    `INSERT INTO sessions
      (id, gameType, format, stakes, roomId, roomNameCached, tableNumber, seat,
       buyIn, cashOut, rebuysTotal, tips, startTime, endTime, moodStart, moodEnd, notes, tags)
     VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
    [
      id,
      input.gameType,
      input.format,
      input.stakes,
      input.roomId ?? null,
      input.roomNameCached ?? '',
      input.buyIn,
      input.cashOut,
      input.rebuysTotal ?? 0,
      input.tips ?? 0,
      input.startTime,
      input.endTime,
      input.moodEnd ?? null,
      input.notes ?? '',
      JSON.stringify(input.tags ?? []),
    ]
  );
  return id;
}

export function getSession(id: string): SessionComputed | null {
  const db = getDb();
  const row = db.getFirstSync<SessionRow>('SELECT * FROM sessions WHERE id = ?', [id]);
  return row ? computeSession(rowToSession(row)) : null;
}

export function getActiveSession(): SessionComputed | null {
  const db = getDb();
  const row = db.getFirstSync<SessionRow>(
    'SELECT * FROM sessions WHERE endTime IS NULL ORDER BY startTime DESC LIMIT 1'
  );
  return row ? computeSession(rowToSession(row)) : null;
}

export function listSessions(): SessionComputed[] {
  const db = getDb();
  const rows = db.getAllSync<SessionRow>(
    'SELECT * FROM sessions ORDER BY startTime DESC'
  );
  return rows.map((r) => computeSession(rowToSession(r)));
}

export function listCompletedSessions(): SessionComputed[] {
  return listSessions().filter((s) => s.endTime !== null);
}

export function updateSession(id: string, patch: Partial<Session>): void {
  const db = getDb();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  const set = (col: string, val: string | number | null) => {
    fields.push(`${col} = ?`);
    values.push(val);
  };
  if (patch.gameType !== undefined) set('gameType', patch.gameType);
  if (patch.format !== undefined) set('format', patch.format);
  if (patch.stakes !== undefined) set('stakes', patch.stakes);
  if (patch.roomId !== undefined) set('roomId', patch.roomId);
  if (patch.roomNameCached !== undefined) set('roomNameCached', patch.roomNameCached);
  if (patch.tableNumber !== undefined) set('tableNumber', patch.tableNumber);
  if (patch.seat !== undefined) set('seat', patch.seat);
  if (patch.buyIn !== undefined) set('buyIn', patch.buyIn);
  if (patch.cashOut !== undefined) set('cashOut', patch.cashOut);
  if (patch.rebuysTotal !== undefined) set('rebuysTotal', patch.rebuysTotal);
  if (patch.tips !== undefined) set('tips', patch.tips);
  if (patch.startTime !== undefined) set('startTime', patch.startTime);
  if (patch.endTime !== undefined) set('endTime', patch.endTime);
  if (patch.moodStart !== undefined) set('moodStart', patch.moodStart);
  if (patch.moodEnd !== undefined) set('moodEnd', patch.moodEnd);
  if (patch.notes !== undefined) set('notes', patch.notes);
  if (patch.tags !== undefined) set('tags', JSON.stringify(patch.tags));
  if (fields.length === 0) return;
  values.push(id);
  db.runSync(`UPDATE sessions SET ${fields.join(', ')} WHERE id = ?`, values);
}

/** Add a rebuy to the active session. */
export function addRebuy(id: string, amount: number): void {
  const db = getDb();
  db.runSync('UPDATE sessions SET rebuysTotal = rebuysTotal + ? WHERE id = ?', [
    amount,
    id,
  ]);
}

/**
 * End a session. Writes the cash-out, stamps endTime, and posts the net result
 * to the linked bankroll account as a single sessionResult transaction.
 */
export function endSession(
  id: string,
  cashOut: number,
  opts?: { moodEnd?: number | null; accountId?: string }
): SessionComputed | null {
  const db = getDb();
  const now = Date.now();
  db.runSync(
    'UPDATE sessions SET cashOut = ?, endTime = ?, moodEnd = ? WHERE id = ?',
    [cashOut, now, opts?.moodEnd ?? null, id]
  );
  const session = getSession(id);
  if (session) {
    db.runSync(
      `INSERT INTO bankroll_txns (id, accountId, type, amount, date, linkedSessionId, note)
       VALUES (?, ?, 'sessionResult', ?, ?, ?, ?)`,
      [
        makeId('txn-'),
        opts?.accountId ?? defaultAccountId(),
        session.result,
        now,
        id,
        `${session.roomNameCached || 'Session'} ${session.stakes}`.trim(),
      ]
    );
  }
  return session;
}

export function deleteSession(id: string): void {
  const db = getDb();
  db.runSync('DELETE FROM bankroll_txns WHERE linkedSessionId = ?', [id]);
  db.runSync('DELETE FROM hand_notes WHERE sessionId = ?', [id]);
  db.runSync('DELETE FROM sessions WHERE id = ?', [id]);
}
