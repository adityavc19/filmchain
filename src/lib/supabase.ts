import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TmdbFilmCredit, TmdbFilm } from './tmdb';

export interface FilmRow {
  tmdb_id: number;
  title: string;
  year: number | null;
  poster_path: string | null;
  cast_crew: TmdbFilmCredit[];
  fetched_at: string;
}

export interface PersonRow {
  tmdb_id: number;
  name: string;
  profile_path: string | null;
  filmography: TmdbFilm[];
  fetched_at: string;
}

export interface DailyPuzzleRow {
  date: string;
  start_film_id: number;
  end_film_id: number;
  min_hops: number;
  created_at: string;
}

export interface LeaderboardEntryRow {
  id: string;
  puzzle_date: string;
  handle: string;
  time_seconds: number;
  hop_count: number;
  path: PathStep[];
  submitted_at: string;
}

export interface ProfileRow {
  username: string;
  display_name?: string | null;
  bio?: string | null;
  created_at: string;
  last_active_at: string;
}

export interface CustomPuzzleRow {
  id: string;
  creator_handle: string | null;
  start_film_id: number;
  end_film_id: number;
  title: string | null;
  play_count: number;
  created_at: string;
  startFilm?: {
    tmdb_id: number;
    title: string;
    year: number | null;
    poster_path: string | null;
  };
  endFilm?: {
    tmdb_id: number;
    title: string;
    year: number | null;
    poster_path: string | null;
  };
}

export interface CustomLeaderboardEntryRow {
  id: string;
  puzzle_id: string;
  handle: string;
  time_seconds: number;
  hop_count: number;
  path: PathStep[];
  submitted_at: string;
}

export interface PathStep {
  type: 'film' | 'person';
  id: number;
  name: string;
  poster_path?: string | null;
  profile_path?: string | null;
  subtitle?: string | null;
}

// Browser-side client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabaseClient = supabaseUrl
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as SupabaseClient);

// Server-side admin client (lazy singleton)
let _adminClient: SupabaseClient | null = null;

function getAdminClient(): SupabaseClient {
  if (_adminClient) return _adminClient;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || !supabaseUrl) {
    throw new Error('Supabase env vars are not set (SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL)');
  }
  _adminClient = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return _adminClient;
}

// Export as a proxy so callers can do `supabaseAdmin.from(...)` directly
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getAdminClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
