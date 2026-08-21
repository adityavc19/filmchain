-- 1. Profiles table: unique handles, stats and metadata
create table if not exists profiles (
  username text primary key,
  display_name text,
  bio text default '',
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  constraint chk_username_len check (length(username) between 3 and 24),
  constraint chk_display_name_len check (length(coalesce(display_name, '')) <= 40),
  constraint chk_bio_len check (length(coalesce(bio, '')) <= 140)
);

-- 2. Custom puzzles created by community members
create table if not exists custom_puzzles (
  id uuid primary key default gen_random_uuid(),
  creator_handle text references profiles(username) on update cascade on delete set null,
  start_film_id integer references films(tmdb_id),
  end_film_id integer references films(tmdb_id),
  title text,
  play_count integer default 0,
  created_at timestamptz not null default now(),
  constraint chk_puzzle_title check (length(coalesce(title, '')) <= 60),
  constraint chk_diff_films check (start_film_id is not null and end_film_id is not null)
);

-- 3. Custom puzzle leaderboard entries
create table if not exists custom_leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  puzzle_id uuid references custom_puzzles(id) on delete cascade,
  handle text not null,
  time_seconds integer not null,
  hop_count integer not null,
  path jsonb not null default '[]',
  submitted_at timestamptz not null default now(),
  constraint chk_custom_lb_time check (time_seconds >= 3),
  constraint chk_custom_lb_hops check (hop_count >= 1),
  constraint chk_custom_lb_handle check (length(handle) between 2 and 24)
);

-- 4. Apply sanity constraints to existing daily leaderboard_entries
alter table leaderboard_entries 
  drop constraint if exists chk_leaderboard_time,
  drop constraint if exists chk_leaderboard_hops,
  drop constraint if exists chk_leaderboard_handle;

alter table leaderboard_entries 
  add constraint chk_leaderboard_time check (time_seconds >= 3),
  add constraint chk_leaderboard_hops check (hop_count >= 1),
  add constraint chk_leaderboard_handle check (length(handle) between 2 and 24);

-- 5. Indexes
create index if not exists idx_custom_puzzles_created_at
  on custom_puzzles (created_at desc);

create index if not exists idx_custom_leaderboard_puzzle_time
  on custom_leaderboard_entries (puzzle_id, time_seconds);

-- 6. Row Level Security & Policies
alter table profiles enable row level security;
drop policy if exists "Public read profiles" on profiles;
drop policy if exists "Public insert profiles" on profiles;
drop policy if exists "Public update profiles" on profiles;

create policy "Public read profiles" on profiles for select using (true);
create policy "Public insert profiles" on profiles for insert with check (
  length(username) between 3 and 24
);
create policy "Public update profiles" on profiles for update using (true) with check (
  length(username) between 3 and 24
);

alter table custom_puzzles enable row level security;
drop policy if exists "Public read custom_puzzles" on custom_puzzles;
drop policy if exists "Public insert custom_puzzles" on custom_puzzles;
drop policy if exists "Public update custom_puzzles" on custom_puzzles;

create policy "Public read custom_puzzles" on custom_puzzles for select using (true);
create policy "Public insert custom_puzzles" on custom_puzzles for insert with check (
  length(coalesce(title, '')) <= 60 and start_film_id is not null and end_film_id is not null
);
create policy "Public update custom_puzzles" on custom_puzzles for update using (true);

alter table custom_leaderboard_entries enable row level security;
drop policy if exists "Public read custom_leaderboard" on custom_leaderboard_entries;
drop policy if exists "Public insert custom_leaderboard" on custom_leaderboard_entries;

create policy "Public read custom_leaderboard" on custom_leaderboard_entries for select using (true);
create policy "Public insert custom_leaderboard" on custom_leaderboard_entries for insert with check (
  time_seconds >= 3 and hop_count >= 1 and length(handle) between 2 and 24
);

-- Update daily leaderboard insert policy with validation checks
drop policy if exists "Insert via API" on leaderboard_entries;
create policy "Insert via API" on leaderboard_entries for insert with check (
  time_seconds >= 3 and hop_count >= 1 and length(handle) between 2 and 24
);
