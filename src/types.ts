/**
 * Domain types - mirror the data model in the playbook (Section 3).
 * User-private entities live in SQLite (offline-first). Shared reference data
 * (rooms, series, tournaments) is read from the server API and cached locally.
 */

export type GameType =
  | 'NLHE'
  | 'PLO'
  | 'LHE'
  | 'Stud'
  | 'Mixed'
  | 'Tournament'
  | 'Other';

export type SessionFormat = 'cash' | 'tournament' | 'sitngo';

export type Position =
  | 'UTG'
  | 'UTG1'
  | 'MP'
  | 'LJ'
  | 'HJ'
  | 'CO'
  | 'BTN'
  | 'SB'
  | 'BB'
  | 'NA';

export type PlayerType =
  | 'nit'
  | 'tag'
  | 'lag'
  | 'fish'
  | 'maniac'
  | 'calling_station'
  | 'unknown';

export type TxnType =
  | 'deposit'
  | 'withdrawal'
  | 'sessionResult'
  | 'transfer'
  | 'adjustment';

// ---- User-private (SQLite) ----

export interface Session {
  id: string;
  gameType: GameType;
  format: SessionFormat;
  stakes: string; // "1/3", "2/5", "5/10"
  roomId: string | null;
  roomNameCached: string;
  tableNumber: string | null;
  seat: number | null;
  buyIn: number;
  cashOut: number;
  rebuysTotal: number; // sum of rebuys
  tips: number;
  startTime: number; // epoch ms
  endTime: number | null; // epoch ms, null while live
  moodStart: number | null; // 1-5
  moodEnd: number | null; // 1-5
  notes: string;
  tags: string[];
}

export interface SessionComputed extends Session {
  durationMinutes: number;
  // result = cashOut - buyIn - rebuysTotal - tips
  result: number;
  hourlyRate: number;
}

export interface BankrollAccount {
  id: string;
  name: string;
  currency: string;
  createdAt: number;
}

export interface BankrollTxn {
  id: string;
  accountId: string;
  type: TxnType;
  amount: number; // signed: positive credits, negative debits
  date: number;
  linkedSessionId: string | null;
  note: string;
}

export interface PlayerNote {
  id: string;
  displayName: string; // user-assigned label, not a legal name
  physicalDesc: string;
  roomId: string | null;
  roomNameCached: string;
  playerType: PlayerType;
  tendencies: string[];
  rating: number; // 1-5, how much you want them at your table
  lastSeen: number;
  createdAt: number;
}

export interface ShowdownRecord {
  id: string;
  playerNoteId: string;
  holeCards: string; // "AhKd"
  position: Position;
  action: string;
  board: string | null;
  date: number;
}

export interface HandNote {
  id: string;
  sessionId: string;
  holeCards: string;
  position: Position;
  villainIds: string[];
  streetActions: string;
  result: number;
  reviewFlag: boolean;
  selfNote: string;
  date: number;
}

// ---- Shared reference (server API, cached) ----

export interface RakeStructure {
  percent: number; // e.g. 10
  cap: number; // dollar cap
  increments: number; // e.g. 1
  noFlopNoDrop: boolean;
  promoDrop: number; // dead money pulled for jackpots/high-hand, dollars
  buyInCap: number | null; // table buy-in cap for lowest stake
}

export interface Room {
  id: string;
  name: string;
  casino: string;
  city: string;
  state: string;
  country: string;
  region: string; // "LV Strip" | "LV Off-Strip" | "Downtown LV" | "AC" | ...
  tableCount: number;
  stakesSpread: string;
  rake: RakeStructure;
  compPerHour: number; // dollars/hr food or rate credit
  loyalty: string;
  hoursOpen: string;
  lat: number | null;
  lng: number | null;
  sourceUrl: string;
  lastVerified: string; // ISO date
  notes: string;
}

export interface Series {
  id: string;
  name: string;
  organizer: string;
  startDate: string; // ISO
  endDate: string; // ISO
  city: string;
  country: string;
  year: number;
  venueRoomName: string;
  sourceUrl: string;
  lastVerified: string;
  tentative: boolean;
}

export interface Tournament {
  id: string;
  seriesId: string | null;
  name: string;
  roomName: string;
  city: string;
  buyIn: number;
  guarantee: number | null;
  gameType: GameType;
  format: SessionFormat;
  startDateTime: string; // ISO
  lateRegLevel: string;
  structureUrl: string;
  sourceUrl: string;
  status: 'scheduled' | 'running' | 'completed' | 'cancelled';
  lastVerified: string;
  tentative: boolean;
}
