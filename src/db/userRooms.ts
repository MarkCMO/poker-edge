/**
 * User-added rooms (stored on-device). Users can add any poker room - their own
 * local card room, a venue they found via nearby search, etc. These work offline
 * and appear in the Rooms directory and the session room picker. They are also
 * submitted to the shared community directory (best-effort) so the global list
 * grows for everyone, at zero cost.
 */
import { getDb, makeId } from './database';
import type { Room, RakeStructure } from '../types';

interface UserRoomRow {
  id: string;
  name: string;
  casino: string;
  city: string;
  state: string;
  country: string;
  region: string;
  tableCount: number;
  stakesSpread: string;
  rake: string;
  compPerHour: number;
  loyalty: string;
  hoursOpen: string;
  lat: number | null;
  lng: number | null;
  notes: string;
  createdAt: number;
}

function parseRake(s: string): RakeStructure {
  try {
    const r = JSON.parse(s);
    return {
      percent: Number(r.percent) || 10,
      cap: Number(r.cap) || 5,
      increments: Number(r.increments) || 1,
      noFlopNoDrop: r.noFlopNoDrop !== false,
      promoDrop: Number(r.promoDrop) || 0,
      buyInCap: r.buyInCap == null ? null : Number(r.buyInCap),
    };
  } catch {
    return { percent: 10, cap: 5, increments: 1, noFlopNoDrop: true, promoDrop: 0, buyInCap: null };
  }
}

function rowToRoom(r: UserRoomRow): Room {
  return {
    id: r.id,
    name: r.name,
    casino: r.casino,
    source: 'user',
    city: r.city,
    state: r.state,
    country: r.country,
    region: r.region,
    tableCount: r.tableCount,
    stakesSpread: r.stakesSpread,
    rake: parseRake(r.rake),
    compPerHour: r.compPerHour,
    loyalty: r.loyalty,
    hoursOpen: r.hoursOpen,
    lat: r.lat,
    lng: r.lng,
    sourceUrl: '',
    lastVerified: new Date(r.createdAt).toISOString().slice(0, 10),
    notes: r.notes,
  };
}

export function listUserRooms(): Room[] {
  return getDb()
    .getAllSync<UserRoomRow>('SELECT * FROM user_rooms ORDER BY createdAt DESC')
    .map(rowToRoom);
}

export function getUserRoom(id: string): Room | null {
  const r = getDb().getFirstSync<UserRoomRow>('SELECT * FROM user_rooms WHERE id = ?', [id]);
  return r ? rowToRoom(r) : null;
}

export interface NewUserRoom {
  name: string;
  casino?: string;
  city?: string;
  state?: string;
  country?: string;
  region?: string;
  tableCount?: number;
  stakesSpread?: string;
  rake?: RakeStructure;
  compPerHour?: number;
  loyalty?: string;
  hoursOpen?: string;
  lat?: number | null;
  lng?: number | null;
  notes?: string;
}

export function addUserRoom(input: NewUserRoom): string {
  const db = getDb();
  const id = makeId('room-user-');
  const rake = input.rake ?? { percent: 10, cap: 5, increments: 1, noFlopNoDrop: true, promoDrop: 0, buyInCap: null };
  db.runSync(
    `INSERT INTO user_rooms (id,name,casino,city,state,country,region,tableCount,stakesSpread,rake,compPerHour,loyalty,hoursOpen,lat,lng,notes,createdAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      input.name,
      input.casino ?? input.name,
      input.city ?? '',
      input.state ?? '',
      input.country ?? 'USA',
      input.region ?? 'Community',
      input.tableCount ?? 0,
      input.stakesSpread ?? '',
      JSON.stringify(rake),
      input.compPerHour ?? 0,
      input.loyalty ?? '',
      input.hoursOpen ?? '24/7',
      input.lat ?? null,
      input.lng ?? null,
      input.notes ?? '',
      Date.now(),
    ]
  );
  return id;
}

export function deleteUserRoom(id: string): void {
  getDb().runSync('DELETE FROM user_rooms WHERE id = ?', [id]);
}
