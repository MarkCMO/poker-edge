import { getDb, makeId, parseJsonArray } from './database';
import type { HandNote, Position } from '../types';

interface HandRow {
  id: string;
  sessionId: string;
  holeCards: string;
  position: string;
  villainIds: string;
  streetActions: string;
  result: number;
  reviewFlag: number;
  selfNote: string;
  date: number;
}

function rowToHand(r: HandRow): HandNote {
  return {
    id: r.id,
    sessionId: r.sessionId,
    holeCards: r.holeCards,
    position: r.position as Position,
    villainIds: parseJsonArray(r.villainIds),
    streetActions: r.streetActions,
    result: r.result,
    reviewFlag: r.reviewFlag === 1,
    selfNote: r.selfNote,
    date: r.date,
  };
}

export function listHands(sessionId?: string): HandNote[] {
  const db = getDb();
  const rows = sessionId
    ? db.getAllSync<HandRow>(
        'SELECT * FROM hand_notes WHERE sessionId = ? ORDER BY date DESC',
        [sessionId]
      )
    : db.getAllSync<HandRow>('SELECT * FROM hand_notes ORDER BY date DESC');
  return rows.map(rowToHand);
}

export function listReviewHands(): HandNote[] {
  const db = getDb();
  return db
    .getAllSync<HandRow>('SELECT * FROM hand_notes WHERE reviewFlag = 1 ORDER BY date DESC')
    .map(rowToHand);
}

export function addHand(input: {
  sessionId: string;
  holeCards: string;
  position?: Position;
  villainIds?: string[];
  streetActions?: string;
  result?: number;
  reviewFlag?: boolean;
  selfNote?: string;
}): string {
  const db = getDb();
  const id = makeId('hand-');
  db.runSync(
    `INSERT INTO hand_notes
      (id, sessionId, holeCards, position, villainIds, streetActions, result, reviewFlag, selfNote, date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.sessionId,
      input.holeCards,
      input.position ?? 'NA',
      JSON.stringify(input.villainIds ?? []),
      input.streetActions ?? '',
      input.result ?? 0,
      input.reviewFlag ? 1 : 0,
      input.selfNote ?? '',
      Date.now(),
    ]
  );
  return id;
}

export function toggleReview(id: string, flag: boolean): void {
  getDb().runSync('UPDATE hand_notes SET reviewFlag = ? WHERE id = ?', [flag ? 1 : 0, id]);
}

export function deleteHand(id: string): void {
  getDb().runSync('DELETE FROM hand_notes WHERE id = ?', [id]);
}

// ---- Quiz results (Study trainer accuracy tracking) ----

export function recordQuiz(spotType: string, correct: boolean): void {
  getDb().runSync(
    'INSERT INTO quiz_results (id, spotType, correct, date) VALUES (?, ?, ?, ?)',
    [makeId('qz-'), spotType, correct ? 1 : 0, Date.now()]
  );
}

export function quizAccuracy(): { total: number; correct: number; pct: number } {
  const db = getDb();
  const row = db.getFirstSync<{ total: number; correct: number }>(
    'SELECT COUNT(*) as total, SUM(correct) as correct FROM quiz_results'
  );
  const total = row?.total ?? 0;
  const correct = row?.correct ?? 0;
  return { total, correct, pct: total > 0 ? (correct / total) * 100 : 0 };
}
