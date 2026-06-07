/**
 * Offline-first local store (Section 5 of the playbook).
 * Casinos kill cell signal, so the entire session/bankroll/notes loop runs
 * against on-device SQLite with zero network dependency.
 *
 * Uses the synchronous expo-sqlite API for predictable, blocking writes at the
 * table - no await races while a grinder is mid-hand.
 */
import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('pokeredge.db');
  }
  return _db;
}

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY NOT NULL,
  gameType TEXT NOT NULL,
  format TEXT NOT NULL,
  stakes TEXT NOT NULL,
  roomId TEXT,
  roomNameCached TEXT NOT NULL DEFAULT '',
  tableNumber TEXT,
  seat INTEGER,
  buyIn REAL NOT NULL DEFAULT 0,
  cashOut REAL NOT NULL DEFAULT 0,
  rebuysTotal REAL NOT NULL DEFAULT 0,
  tips REAL NOT NULL DEFAULT 0,
  startTime INTEGER NOT NULL,
  endTime INTEGER,
  moodStart INTEGER,
  moodEnd INTEGER,
  notes TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS bankroll_accounts (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS bankroll_txns (
  id TEXT PRIMARY KEY NOT NULL,
  accountId TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  date INTEGER NOT NULL,
  linkedSessionId TEXT,
  note TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS player_notes (
  id TEXT PRIMARY KEY NOT NULL,
  displayName TEXT NOT NULL,
  physicalDesc TEXT NOT NULL DEFAULT '',
  roomId TEXT,
  roomNameCached TEXT NOT NULL DEFAULT '',
  playerType TEXT NOT NULL DEFAULT 'unknown',
  tendencies TEXT NOT NULL DEFAULT '[]',
  rating INTEGER NOT NULL DEFAULT 3,
  lastSeen INTEGER NOT NULL,
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS showdown_records (
  id TEXT PRIMARY KEY NOT NULL,
  playerNoteId TEXT NOT NULL,
  holeCards TEXT NOT NULL,
  position TEXT NOT NULL DEFAULT 'NA',
  action TEXT NOT NULL DEFAULT '',
  board TEXT,
  date INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS hand_notes (
  id TEXT PRIMARY KEY NOT NULL,
  sessionId TEXT NOT NULL,
  holeCards TEXT NOT NULL,
  position TEXT NOT NULL DEFAULT 'NA',
  villainIds TEXT NOT NULL DEFAULT '[]',
  streetActions TEXT NOT NULL DEFAULT '',
  result REAL NOT NULL DEFAULT 0,
  reviewFlag INTEGER NOT NULL DEFAULT 0,
  selfNote TEXT NOT NULL DEFAULT '',
  date INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id TEXT PRIMARY KEY NOT NULL,
  spotType TEXT NOT NULL,
  correct INTEGER NOT NULL,
  date INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_rooms (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  casino TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'USA',
  region TEXT NOT NULL DEFAULT 'Community',
  tableCount INTEGER NOT NULL DEFAULT 0,
  stakesSpread TEXT NOT NULL DEFAULT '',
  rake TEXT NOT NULL DEFAULT '{}',
  compPerHour REAL NOT NULL DEFAULT 0,
  loyalty TEXT NOT NULL DEFAULT '',
  hoursOpen TEXT NOT NULL DEFAULT '24/7',
  lat REAL,
  lng REAL,
  notes TEXT NOT NULL DEFAULT '',
  createdAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS study_drills (
  id TEXT PRIMARY KEY NOT NULL,
  drillRef TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  easeFactor REAL NOT NULL DEFAULT 2.5,
  intervalDays REAL NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  lastSeen INTEGER,
  nextDue INTEGER NOT NULL,
  createdAt INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_start ON sessions(startTime);
CREATE INDEX IF NOT EXISTS idx_txns_account ON bankroll_txns(accountId, date);
CREATE INDEX IF NOT EXISTS idx_showdown_player ON showdown_records(playerNoteId, date);
CREATE INDEX IF NOT EXISTS idx_hands_session ON hand_notes(sessionId, date);
CREATE INDEX IF NOT EXISTS idx_drills_due ON study_drills(nextDue);
`;

let _initialized = false;

/** Idempotent. Safe to call on every app launch. */
export function initDb(): void {
  if (_initialized) return;
  const db = getDb();
  db.execSync(SCHEMA);

  // Seed a default bankroll account on first launch so the user has somewhere
  // for session results to land without setup friction.
  const count = db.getFirstSync<{ c: number }>(
    'SELECT COUNT(*) as c FROM bankroll_accounts'
  );
  if (count && count.c === 0) {
    db.runSync(
      'INSERT INTO bankroll_accounts (id, name, currency, createdAt) VALUES (?, ?, ?, ?)',
      [defaultAccountId(), 'Live cash', 'USD', Date.now()]
    );
  }
  _initialized = true;
}

export function defaultAccountId(): string {
  return 'acct-live-cash';
}

/** Compact id without external deps. */
export function makeId(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}${time}${rand}`;
}

export function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/** Wipe all user data - used by the "delete my data" flow (Section 10). */
export function wipeAllData(): void {
  const db = getDb();
  db.execSync(`
    DELETE FROM sessions;
    DELETE FROM bankroll_txns;
    DELETE FROM bankroll_accounts;
    DELETE FROM player_notes;
    DELETE FROM showdown_records;
    DELETE FROM hand_notes;
    DELETE FROM quiz_results;
    DELETE FROM study_drills;
    DELETE FROM user_rooms;
  `);
  _initialized = false;
  initDb();
}
