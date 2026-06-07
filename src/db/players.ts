import { getDb, makeId, parseJsonArray } from './database';
import type { PlayerNote, PlayerType, ShowdownRecord, Position } from '../types';

interface PlayerRow {
  id: string;
  displayName: string;
  physicalDesc: string;
  roomId: string | null;
  roomNameCached: string;
  playerType: string;
  tendencies: string;
  rating: number;
  lastSeen: number;
  createdAt: number;
}

interface ShowdownRow {
  id: string;
  playerNoteId: string;
  holeCards: string;
  position: string;
  action: string;
  board: string | null;
  date: number;
}

function rowToPlayer(r: PlayerRow): PlayerNote {
  return {
    id: r.id,
    displayName: r.displayName,
    physicalDesc: r.physicalDesc,
    roomId: r.roomId,
    roomNameCached: r.roomNameCached,
    playerType: r.playerType as PlayerType,
    tendencies: parseJsonArray(r.tendencies),
    rating: r.rating,
    lastSeen: r.lastSeen,
    createdAt: r.createdAt,
  };
}

export function listPlayers(): PlayerNote[] {
  const db = getDb();
  return db
    .getAllSync<PlayerRow>('SELECT * FROM player_notes ORDER BY lastSeen DESC')
    .map(rowToPlayer);
}

export function getPlayer(id: string): PlayerNote | null {
  const db = getDb();
  const row = db.getFirstSync<PlayerRow>('SELECT * FROM player_notes WHERE id = ?', [id]);
  return row ? rowToPlayer(row) : null;
}

export function addPlayer(input: {
  displayName: string;
  physicalDesc?: string;
  roomId?: string | null;
  roomNameCached?: string;
  playerType?: PlayerType;
  rating?: number;
}): string {
  const db = getDb();
  const id = makeId('plr-');
  const now = Date.now();
  db.runSync(
    `INSERT INTO player_notes
      (id, displayName, physicalDesc, roomId, roomNameCached, playerType, tendencies, rating, lastSeen, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, '[]', ?, ?, ?)`,
    [
      id,
      input.displayName,
      input.physicalDesc ?? '',
      input.roomId ?? null,
      input.roomNameCached ?? '',
      input.playerType ?? 'unknown',
      input.rating ?? 3,
      now,
      now,
    ]
  );
  return id;
}

export function updatePlayer(id: string, patch: Partial<PlayerNote>): void {
  const db = getDb();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  const set = (col: string, val: string | number | null) => {
    fields.push(`${col} = ?`);
    values.push(val);
  };
  if (patch.displayName !== undefined) set('displayName', patch.displayName);
  if (patch.physicalDesc !== undefined) set('physicalDesc', patch.physicalDesc);
  if (patch.roomId !== undefined) set('roomId', patch.roomId);
  if (patch.roomNameCached !== undefined) set('roomNameCached', patch.roomNameCached);
  if (patch.playerType !== undefined) set('playerType', patch.playerType);
  if (patch.tendencies !== undefined) set('tendencies', JSON.stringify(patch.tendencies));
  if (patch.rating !== undefined) set('rating', patch.rating);
  if (patch.lastSeen !== undefined) set('lastSeen', patch.lastSeen);
  if (fields.length === 0) return;
  values.push(id);
  db.runSync(`UPDATE player_notes SET ${fields.join(', ')} WHERE id = ?`, values);
}

export function touchPlayer(id: string): void {
  getDb().runSync('UPDATE player_notes SET lastSeen = ? WHERE id = ?', [Date.now(), id]);
}

export function deletePlayer(id: string): void {
  const db = getDb();
  db.runSync('DELETE FROM showdown_records WHERE playerNoteId = ?', [id]);
  db.runSync('DELETE FROM player_notes WHERE id = ?', [id]);
}

// ---- Showdown records ----

export function listShowdowns(playerNoteId: string): ShowdownRecord[] {
  const db = getDb();
  return db
    .getAllSync<ShowdownRow>(
      'SELECT * FROM showdown_records WHERE playerNoteId = ? ORDER BY date DESC',
      [playerNoteId]
    )
    .map((r) => ({ ...r, position: r.position as Position }));
}

export function addShowdown(input: {
  playerNoteId: string;
  holeCards: string;
  position?: Position;
  action?: string;
  board?: string | null;
}): string {
  const db = getDb();
  const id = makeId('sd-');
  db.runSync(
    `INSERT INTO showdown_records (id, playerNoteId, holeCards, position, action, board, date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.playerNoteId,
      input.holeCards,
      input.position ?? 'NA',
      input.action ?? '',
      input.board ?? null,
      Date.now(),
    ]
  );
  touchPlayer(input.playerNoteId);
  return id;
}

export function deleteShowdown(id: string): void {
  getDb().runSync('DELETE FROM showdown_records WHERE id = ?', [id]);
}
