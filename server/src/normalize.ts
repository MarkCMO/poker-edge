import type { ApiRoom, ApiSeries, ApiTournament } from './types';

/**
 * Map between the camelCase API/app shape and the snake_case Supabase rows.
 * The app and the API speak the same language (Section 6: the app never knows or
 * cares where a row came from).
 */

type Row = Record<string, unknown>;

const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d);
const num = (v: unknown, d = 0): number => (typeof v === 'number' ? v : d);
const numOrNull = (v: unknown): number | null => (typeof v === 'number' ? v : null);
const bool = (v: unknown): boolean => v === true;

export function rowToRoom(r: Row): ApiRoom {
  const rake = (r.rake ?? {}) as Row;
  return {
    id: str(r.id),
    name: str(r.name),
    casino: str(r.casino),
    city: str(r.city),
    state: str(r.state),
    country: str(r.country, 'USA'),
    region: str(r.region, 'National'),
    tableCount: num(r.table_count),
    stakesSpread: str(r.stakes_spread),
    rake: {
      percent: num(rake.percent, 10),
      cap: num(rake.cap, 5),
      increments: num(rake.increments, 1),
      noFlopNoDrop: bool(rake.noFlopNoDrop),
      promoDrop: num(rake.promoDrop),
      buyInCap: numOrNull(rake.buyInCap),
    },
    compPerHour: num(r.comp_per_hour),
    loyalty: str(r.loyalty),
    hoursOpen: str(r.hours_open, '24/7'),
    lat: numOrNull(r.lat),
    lng: numOrNull(r.lng),
    sourceUrl: str(r.source_url),
    lastVerified: str(r.last_verified),
    notes: str(r.notes),
  };
}

export function roomToRow(a: ApiRoom, source: string): Row {
  return {
    id: a.id,
    name: a.name,
    casino: a.casino,
    city: a.city,
    state: a.state,
    country: a.country,
    region: a.region,
    table_count: a.tableCount,
    stakes_spread: a.stakesSpread,
    rake: a.rake,
    comp_per_hour: a.compPerHour,
    loyalty: a.loyalty,
    hours_open: a.hoursOpen,
    lat: a.lat,
    lng: a.lng,
    source,
    source_url: a.sourceUrl,
    last_verified: a.lastVerified,
    notes: a.notes,
  };
}

export function rowToSeries(r: Row): ApiSeries {
  return {
    id: str(r.id),
    name: str(r.name),
    organizer: str(r.organizer),
    startDate: str(r.start_date),
    endDate: str(r.end_date),
    city: str(r.city),
    country: str(r.country, 'USA'),
    year: num(r.year),
    venueRoomName: str(r.venue_room_name),
    sourceUrl: str(r.source_url),
    lastVerified: str(r.last_verified),
    tentative: bool(r.tentative),
  };
}

export function seriesToRow(a: ApiSeries, source: string): Row {
  return {
    id: a.id,
    name: a.name,
    organizer: a.organizer,
    start_date: a.startDate,
    end_date: a.endDate,
    city: a.city,
    country: a.country,
    year: a.year,
    venue_room_name: a.venueRoomName,
    source,
    source_url: a.sourceUrl,
    last_verified: a.lastVerified,
    tentative: a.tentative,
  };
}

export function rowToTournament(r: Row): ApiTournament {
  return {
    id: str(r.id),
    seriesId: r.series_id ? str(r.series_id) : null,
    name: str(r.name),
    roomName: str(r.room_name),
    city: str(r.city),
    buyIn: num(r.buy_in),
    guarantee: numOrNull(r.guarantee),
    gameType: str(r.game_type, 'NLHE'),
    format: str(r.format, 'tournament'),
    startDateTime: str(r.start_datetime),
    lateRegLevel: str(r.late_reg_level),
    structureUrl: str(r.structure_url),
    sourceUrl: str(r.source_url),
    status: str(r.status, 'scheduled'),
    lastVerified: str(r.last_verified),
    tentative: bool(r.tentative),
  };
}

export function tournamentToRow(a: ApiTournament, source: string): Row {
  return {
    id: a.id,
    series_id: a.seriesId,
    name: a.name,
    room_name: a.roomName,
    city: a.city,
    buy_in: a.buyIn,
    guarantee: a.guarantee,
    game_type: a.gameType,
    format: a.format,
    start_datetime: a.startDateTime,
    late_reg_level: a.lateRegLevel,
    structure_url: a.structureUrl,
    source,
    source_url: a.sourceUrl,
    status: a.status,
    last_verified: a.lastVerified,
    tentative: a.tentative,
  };
}
