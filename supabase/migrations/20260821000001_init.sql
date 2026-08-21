-- films: cached TMDb movie data
create table if not exists films (
  tmdb_id    integer primary key,
  title      text not null,
  year       integer,
  poster_path text,
  cast_crew  jsonb not null default '[]',
  fetched_at timestamptz not null default now()
);

-- people: cached person filmography
create table if not exists people (
  tmdb_id      integer primary key,
  name         text not null,
  profile_path text,
  filmography  jsonb not null default '[]',
  fetched_at   timestamptz not null default now()
);

-- daily puzzles
create table if not exists daily_puzzles (
  date          date primary key,
  start_film_id integer references films(tmdb_id),
  end_film_id   integer references films(tmdb_id),
  min_hops      integer not null,
  created_at    timestamptz not null default now()
);

-- leaderboard
create table if not exists leaderboard_entries (
  id           uuid primary key default gen_random_uuid(),
  puzzle_date  date references daily_puzzles(date),
  handle       text not null,
  time_seconds integer not null,
  hop_count    integer not null,
  path         jsonb not null default '[]',
  submitted_at timestamptz not null default now()
);

create index if not exists idx_leaderboard_date_time
  on leaderboard_entries (puzzle_date, time_seconds);

-- Row-level security: enable RLS but allow public read for leaderboard
alter table leaderboard_entries enable row level security;
create policy "Public read" on leaderboard_entries for select using (true);
create policy "Insert via API" on leaderboard_entries for insert with check (true);

alter table films enable row level security;
create policy "Public read films" on films for select using (true);
create policy "Service insert films" on films for insert with check (true);
create policy "Service update films" on films for update using (true);

alter table people enable row level security;
create policy "Public read people" on people for select using (true);
create policy "Service insert people" on people for insert with check (true);
create policy "Service update people" on people for update using (true);

alter table daily_puzzles enable row level security;
create policy "Public read puzzles" on daily_puzzles for select using (true);
create policy "Service insert puzzles" on daily_puzzles for insert with check (true);
