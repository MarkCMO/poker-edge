-- Poker Edge shared reference data (Section 3). Written ONLY by the ingestion
-- layer; the iOS app reads it through the API. User-private data (sessions,
-- bankroll, notes) never lives here - it stays on-device in SQLite.

create table if not exists rooms (
  id text primary key,
  name text not null,
  casino text not null default '',
  city text not null default '',
  state text not null default '',
  country text not null default 'USA',
  region text not null default 'National',
  table_count int not null default 0,
  stakes_spread text not null default '',
  rake jsonb not null default '{}'::jsonb,
  comp_per_hour numeric not null default 0,
  loyalty text not null default '',
  hours_open text not null default '24/7',
  lat double precision,
  lng double precision,
  source text not null default 'seed',          -- official_feed | licensed_api | structured_page | scraped_html | seed
  source_url text not null default '',
  last_verified date,
  notes text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists series (
  id text primary key,
  name text not null,
  organizer text not null default '',
  start_date date,
  end_date date,
  city text not null default '',
  country text not null default 'USA',
  year int,
  venue_room_name text not null default '',
  source text not null default 'seed',
  source_url text not null default '',
  last_verified date,
  tentative boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists tournaments (
  id text primary key,
  series_id text references series(id) on delete set null,
  name text not null,
  room_name text not null default '',
  city text not null default '',
  buy_in numeric not null default 0,
  guarantee numeric,
  game_type text not null default 'NLHE',
  format text not null default 'tournament',
  start_datetime timestamptz,
  late_reg_level text not null default '',
  structure_url text not null default '',
  source text not null default 'seed',
  source_url text not null default '',
  status text not null default 'scheduled',      -- scheduled | running | completed | cancelled
  last_verified date,
  tentative boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Versioned rake history so the app can show "rake changed on date X" (Section 4.4).
create table if not exists rake_snapshots (
  id bigint generated always as identity primary key,
  room_id text references rooms(id) on delete cascade,
  stakes text not null default '',
  percent numeric,
  cap numeric,
  increments numeric,
  captured_date date not null default current_date,
  source text not null default 'seed'
);

-- Diff log for schedule/rake changes - powers "schedule updated" alerts.
create table if not exists ingest_diffs (
  id bigint generated always as identity primary key,
  entity_type text not null,   -- room | series | tournament
  entity_id text not null,
  field text not null,
  old_value text,
  new_value text,
  source text not null default '',
  created_at timestamptz not null default now()
);

-- Canonical room alias registry: venues rename and merge constantly.
-- e.g. "Bally's Las Vegas" -> "room-horseshoe". This table is gold.
create table if not exists room_aliases (
  alias text primary key,
  room_id text references rooms(id) on delete cascade
);

create index if not exists idx_tournaments_start on tournaments(start_datetime);
create index if not exists idx_tournaments_series on tournaments(series_id);
create index if not exists idx_rooms_region on rooms(region);

-- The app uses the anon key for reads only; writes use the service role from
-- the Worker. Enable RLS and allow anon SELECT on the reference tables.
alter table rooms enable row level security;
alter table series enable row level security;
alter table tournaments enable row level security;

drop policy if exists "public read rooms" on rooms;
drop policy if exists "public read series" on series;
drop policy if exists "public read tournaments" on tournaments;
create policy "public read rooms" on rooms for select using (true);
create policy "public read series" on series for select using (true);
create policy "public read tournaments" on tournaments for select using (true);
