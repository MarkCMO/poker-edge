export interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;
  OPS_ALERT_EMAIL?: string;
  RESEND_API_KEY?: string;
  INGEST_KEY?: string;
  // AI explain layer (Phase 11) - Cloudflare Workers AI via REST
  CF_ACCOUNT_ID?: string;
  CF_AI_EMAIL?: string;
  CF_AI_KEY?: string;
  // External result sync (Phase 10) - B2B licensed data
  SHARKSCOPE_KEY?: string;
  HENDON_KEY?: string;
  ENVIRONMENT?: string;
}

// Confidence tiers (Section 6). Never silently overwrite a higher-confidence
// row with a lower-confidence one.
export const CONFIDENCE = {
  official_feed: 4,
  licensed_api: 3,
  structured_page: 2,
  scraped_html: 1,
  seed: 0,
} as const;

export type SourceTier = keyof typeof CONFIDENCE;

// API output shapes - camelCase, matching the iOS app's src/types.ts exactly.
export interface ApiRoom {
  id: string;
  name: string;
  casino: string;
  city: string;
  state: string;
  country: string;
  region: string;
  tableCount: number;
  stakesSpread: string;
  rake: {
    percent: number;
    cap: number;
    increments: number;
    noFlopNoDrop: boolean;
    promoDrop: number;
    buyInCap: number | null;
  };
  compPerHour: number;
  loyalty: string;
  hoursOpen: string;
  lat: number | null;
  lng: number | null;
  sourceUrl: string;
  lastVerified: string;
  notes: string;
}

export interface ApiSeries {
  id: string;
  name: string;
  organizer: string;
  startDate: string;
  endDate: string;
  city: string;
  country: string;
  year: number;
  venueRoomName: string;
  sourceUrl: string;
  lastVerified: string;
  tentative: boolean;
}

export interface ApiTournament {
  id: string;
  seriesId: string | null;
  name: string;
  roomName: string;
  city: string;
  buyIn: number;
  guarantee: number | null;
  gameType: string;
  format: string;
  startDateTime: string;
  lateRegLevel: string;
  structureUrl: string;
  sourceUrl: string;
  status: string;
  lastVerified: string;
  tentative: boolean;
}
