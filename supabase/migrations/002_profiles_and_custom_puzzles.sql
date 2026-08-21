-- 1. Profiles table: unique handles, stats and metadata
create table if not exists profiles (
  username text primary key,
  display_name text,
  bio text default '',
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

-- 2. Custom puzzles created by community members
create table if not exists custom_puzzles (
  id uuid primary key default gen_random_uuid(),
  creator_handle text references profiles(username) on update cascade on delete set null,
  start_film_id integer references films(tmdb_id),
  end_film_id integer references films(tmdb_id),
  title text,
  play_count integer default 0,
  created_at timestamptz not null default now()
);

-- 3. Custom puzzle leaderboard entries
create table if not exists custom_leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  puzzle_id uuid references custom_puzzles(id) on delete cascade,
  handle text not null,
  time_seconds integer not null,
  hop_count integer not null,
  path jsonb not null default '[]',
  submitted_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_custom_puzzles_created_at
  on custom_puzzles (created_at desc);

create index if not exists idx_custom_leaderboard_puzzle_time
  on custom_leaderboard_entries (puzzle_id, time_seconds);

-- Row Level Security & Policies
alter table profiles enable row level security;
create policy "Public read profiles" on profiles for select using (true);
create policy "Public insert profiles" on profiles for insert with check (true);
create policy "Public update profiles" on profiles for update using (true);

alter table custom_puzzles enable row level security;
create policy "Public read custom_puzzles" on custom_puzzles for select using (true);
create policy "Public insert custom_puzzles" on custom_puzzles for insert with check (true);
create policy "Public update custom_puzzles" on custom_puzzles for update using (true);

alter table custom_leaderboard_entries enable row level security;
create policy "Public read custom_leaderboard" on custom_leaderboard_entries for select using (true);
create policy "Public insert custom_leaderboard" on custom_leaderboard_entries for insert with check (true);
