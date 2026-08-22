import https from 'node:https';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export interface TmdbCastMember {
  id: number;
  name: string;
  profile_path: string | null;
  order: number;
  character?: string;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  profile_path: string | null;
  department: string;
  job: string;
}

export interface TmdbFilmCredit {
  id: number;
  name: string;
  profile_path: string | null;
  order: number;
  role: 'cast' | 'crew';
  job?: string;
  character?: string;
}

export interface TmdbFilm {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  vote_count: number;
  popularity: number;
  character?: string;
  media_type?: 'movie' | 'tv';
  episode_count?: number;
}

export interface TmdbMovieDetails {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  vote_count: number;
  overview?: string;
  tagline?: string;
  runtime?: number;
  genres?: { id: number; name: string }[];
  vote_average?: number;
}

export interface TmdbPersonDetails {
  id: number;
  name: string;
  profile_path: string | null;
  biography?: string;
  known_for_department?: string;
  birthday?: string;
  place_of_birth?: string;
}

export const VALID_CREW_JOBS = ['Director', 'Screenplay', 'Story', 'Writer', 'Producer', 'Executive Producer', 'Creator'];
export const MAX_CAST_ORDER = 12;

export class TmdbHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'TmdbHttpError';
    this.status = status;
  }
}

function httpsGetJson<T = any>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'FilmChain/1.0',
        'Accept': 'application/json',
      },
    }, (res) => {
      if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
        res.resume(); // consume response data to free memory
        return reject(new TmdbHttpError(res.statusCode, `TMDb API HTTP error: ${res.statusCode} ${res.statusMessage}`));
      }

      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          resolve(parsed);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

const serverTmdbCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour TTL

async function tmdbFetch<T = any>(path: string, retries = 3): Promise<T> {
  const now = Date.now();
  const cached = serverTmdbCache.get(path);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data as T;
  }

  const apiKey = process.env.TMDB_API_KEY || '81d2e74ce1c54d587d152b68d900b8c8';
  const separator = path.includes('?') ? '&' : '?';
  const url = `${TMDB_BASE}${path}${separator}api_key=${apiKey}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const data = await httpsGetJson<T>(url);
      serverTmdbCache.set(path, { data, timestamp: now });
      return data;
    } catch (err: any) {
      if (err instanceof TmdbHttpError && err.status === 404) {
        throw err;
      }
      if (attempt === retries - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
    }
  }

  throw new Error(`Failed to fetch ${path} after ${retries} attempts`);
}

export async function fetchMovieCredits(movieId: number): Promise<{ cast: TmdbCastMember[]; crew: TmdbCrewMember[] }> {
  return tmdbFetch(`/movie/${movieId}/credits`);
}

export async function fetchPersonMovieCredits(personId: number): Promise<{ cast: TmdbFilm[]; crew: TmdbFilm[] }> {
  return tmdbFetch(`/person/${personId}/movie_credits`);
}

export async function fetchPersonTvCredits(personId: number): Promise<{ cast: any[]; crew: any[] }> {
  return tmdbFetch(`/person/${personId}/tv_credits`);
}

export async function fetchMovieDetails(movieId: number): Promise<TmdbMovieDetails> {
  return tmdbFetch(`/movie/${movieId}`);
}

export async function fetchTvCredits(tvId: number): Promise<{ cast: TmdbCastMember[]; crew: TmdbCrewMember[] }> {
  return tmdbFetch(`/tv/${tvId}/credits`);
}

export async function fetchTvDetails(tvId: number): Promise<TmdbMovieDetails> {
  const data = await tmdbFetch(`/tv/${tvId}`);
  return {
    id: data.id,
    title: data.name || data.original_name,
    release_date: data.first_air_date || '',
    poster_path: data.poster_path,
    vote_count: data.vote_count || 0,
    overview: data.overview,
    tagline: data.tagline,
    genres: data.genres,
    vote_average: data.vote_average,
  };
}

export async function fetchPersonDetails(personId: number): Promise<TmdbPersonDetails> {
  return tmdbFetch(`/person/${personId}`);
}

export async function searchMovies(query: string): Promise<TmdbMovieDetails[]> {
  const data = await tmdbFetch<{ results: TmdbMovieDetails[] }>(`/search/movie?query=${encodeURIComponent(query)}`);
  return data.results;
}

export async function fetchPopularMovies(page: number): Promise<TmdbMovieDetails[]> {
  const data = await tmdbFetch<{ results: TmdbMovieDetails[] }>(`/discover/movie?sort_by=vote_count.desc&vote_count.gte=5000&page=${page}`);
  return data.results;
}

export function posterUrl(path: string | null, size: 'w92' | 'w185' | 'w342' | 'w500' = 'w342'): string {
  if (!path) return '/placeholder-poster.png';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function profileUrl(path: string | null, size: 'w185' | 'w342' = 'w185'): string {
  if (!path) return '/placeholder-profile.png';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function filterCredits(cast: TmdbCastMember[], crew: TmdbCrewMember[]): TmdbFilmCredit[] {
  const map = new Map<number, TmdbFilmCredit>();

  // 1. Process Cast
  for (const c of (cast || [])) {
    if (c && c.id && c.order < MAX_CAST_ORDER) {
      map.set(c.id, {
        id: c.id,
        name: c.name,
        profile_path: c.profile_path,
        order: c.order,
        role: 'cast',
        character: c.character || undefined,
      });
    }
  }

  // 2. Process Crew and Aggregate Multiple Jobs
  const jobPriority: Record<string, number> = {
    'Director': 1,
    'Screenplay': 2,
    'Writer': 3,
    'Story': 4,
    'Creator': 5,
    'Producer': 6,
    'Executive Producer': 7,
  };

  for (const c of (crew || [])) {
    if (c && c.id && VALID_CREW_JOBS.includes(c.job)) {
      if (map.has(c.id)) {
        const existing = map.get(c.id)!;
        const currentJobs = existing.job ? existing.job.split(', ') : [];
        if (!currentJobs.includes(c.job)) {
          currentJobs.push(c.job);
          currentJobs.sort((a, b) => (jobPriority[a] || 99) - (jobPriority[b] || 99));
          existing.job = currentJobs.join(', ');
        }
      } else {
        map.set(c.id, {
          id: c.id,
          name: c.name,
          profile_path: c.profile_path,
          order: MAX_CAST_ORDER + map.size,
          role: 'crew',
          job: c.job,
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.order - b.order);
}
