'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import { PathStep, LeaderboardEntryRow } from '@/lib/supabase';
import { TmdbFilmCredit, TmdbFilm, posterUrl, profileUrl } from '@/lib/tmdb';
import { getOrCreateHandle } from '@/lib/handle';
import Timer from '@/components/Timer';
import Breadcrumb from '@/components/Breadcrumb';
import FilmCard from '@/components/FilmCard';
import PersonCard from '@/components/PersonCard';
import Leaderboard from '@/components/Leaderboard';
import ShareCard from '@/components/ShareCard';
import Link from 'next/link';

interface FilmInfo {
  tmdb_id: number;
  title: string;
  year: number | null;
  poster_path: string | null;
}

interface CurrentMediaDetails {
  id: number;
  title: string;
  year: number | null;
  poster_path: string | null;
  overview?: string | null;
  tagline?: string | null;
  runtime?: number | null;
  genres?: { id: number; name: string }[];
  vote_average?: number | null;
}

interface CurrentPersonDetails {
  id: number;
  name: string;
  profile_path: string | null;
  biography?: string | null;
  known_for?: string | null;
  birthday?: string | null;
  place_of_birth?: string | null;
}

interface GameState {
  phase: 'loading' | 'playing' | 'won';
  puzzleDate: string;
  startFilm: FilmInfo | null;
  targetFilm: FilmInfo | null;
  endFilmId: number;
  path: PathStep[];
  currentView: 'film' | 'person';
  currentId: number;
  currentTitle: string;
  startTime: number | null;
  endTime: number | null;
}

type FilmFilterTab = 'all' | 'cast' | 'crew';
type PersonFilterTab = 'all' | 'movies' | 'tv';

export default function GamePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = use(params);
  const [handle] = useState(() => getOrCreateHandle());

  const [state, setState] = useState<GameState>({
    phase: 'loading',
    puzzleDate: date,
    startFilm: null,
    targetFilm: null,
    endFilmId: 0,
    path: [],
    currentView: 'film',
    currentId: 0,
    currentTitle: '',
    startTime: null,
    endTime: null,
  });

  const [filmCredits, setFilmCredits] = useState<TmdbFilmCredit[]>([]);
  const [personMovies, setPersonMovies] = useState<TmdbFilm[]>([]);
  const [personTvShows, setPersonTvShows] = useState<TmdbFilm[]>([]);
  const [currentMedia, setCurrentMedia] = useState<CurrentMediaDetails | null>(null);
  const [currentPerson, setCurrentPerson] = useState<CurrentPersonDetails | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryRow[]>([]);
  const [filmTab, setFilmTab] = useState<FilmFilterTab>('all');
  const [personTab, setPersonTab] = useState<PersonFilterTab>('all');
  const [loadingStep, setLoadingStep] = useState(false);

  const fetchFilmCredits = async (id: number): Promise<TmdbFilmCredit[]> => {
    setLoadingStep(true);
    try {
      let res = await fetch(`/api/film/${id}`);
      let data = await res.json();

      if (!res.ok || !data.cast_crew) {
        await new Promise(r => setTimeout(r, 400));
        res = await fetch(`/api/film/${id}`);
        data = await res.json();
      }

      setFilmCredits(data.cast_crew || []);
      setCurrentMedia({
        id: data.tmdb_id,
        title: data.title,
        year: data.year,
        poster_path: data.poster_path,
        overview: data.overview,
        tagline: data.tagline,
        runtime: data.runtime,
        genres: data.genres,
        vote_average: data.vote_average,
      });
      setState(s => ({ ...s, currentView: 'film', currentId: id, currentTitle: data.title || '' }));
      setFilmTab('all');
      return data.cast_crew || [];
    } catch (err) {
      console.error('Error fetching film credits:', err);
      return [];
    } finally {
      setLoadingStep(false);
    }
  };

  const fetchPersonCredits = async (id: number) => {
    setLoadingStep(true);
    try {
      let res = await fetch(`/api/person/${id}`);
      let data = await res.json();

      if (!res.ok || !data.filmography) {
        await new Promise(r => setTimeout(r, 400));
        res = await fetch(`/api/person/${id}`);
        data = await res.json();
      }

      setPersonMovies(data.filmography || []);
      setPersonTvShows(data.tv_credits || []);
      setCurrentPerson({
        id: data.tmdb_id,
        name: data.name,
        profile_path: data.profile_path,
        biography: data.biography,
        known_for: data.known_for,
        birthday: data.birthday,
        place_of_birth: data.place_of_birth,
      });
      setState(s => ({ ...s, currentView: 'person', currentId: id }));
      setPersonTab('all');
    } catch (err) {
      console.error('Error fetching person credits:', err);
    } finally {
      setLoadingStep(false);
    }
  };

  const fetchLeaderboard = async () => {
    const res = await fetch(`/api/leaderboard/${date}`);
    const data = await res.json();
    setLeaderboard(data.entries || []);
  };

  // Initialize game
  useEffect(() => {
    fetch('/api/puzzle/today')
      .then(res => res.json())
      .then(async (data) => {
        if (data.error) {
          console.error(data.error);
          return;
        }
        const startPath: PathStep[] = [
          { type: 'film', id: data.startFilm.tmdb_id, name: data.startFilm.title },
        ];
        setState(s => ({
          ...s,
          startFilm: data.startFilm,
          targetFilm: data.endFilm,
          endFilmId: data.endFilmId,
          currentId: data.startFilm.tmdb_id,
          currentTitle: data.startFilm.title,
          path: startPath,
        }));
        await fetchFilmCredits(data.startFilm.tmdb_id);
        setState(s => ({ ...s, phase: 'playing', startTime: Date.now() }));
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const onSelectPerson = (personId: number, name: string) => {
    const newPath: PathStep[] = [...state.path, { type: 'person', id: personId, name }];
    setState(s => ({ ...s, path: newPath }));
    fetchPersonCredits(personId);
  };

  const onSelectFilm = async (filmId: number, title: string) => {
    const newPath: PathStep[] = [...state.path, { type: 'film', id: filmId, name: title }];

    if (filmId === state.endFilmId) {
      // Won!
      const endTime = Date.now();
      const elapsed = Math.max(1, Math.round((endTime - (state.startTime || endTime)) / 1000));
      const hops = Math.floor(newPath.length / 2);

      setState(s => ({
        ...s,
        path: newPath,
        phase: 'won',
        endTime,
      }));

      // Submit to leaderboard
      try {
        await fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            puzzle_date: date,
            handle,
            time_seconds: elapsed,
            hop_count: hops,
            path: newPath,
          }),
        });
        await fetchLeaderboard();
      } catch (err) {
        console.error('Failed to submit score:', err);
      }
    } else {
      setState(s => ({ ...s, path: newPath }));
      fetchFilmCredits(filmId);
    }
  };

  // Deduplicate and aggregate cast & crew lists
  const castMap = new Map<number, TmdbFilmCredit>();
  const crewMap = new Map<number, TmdbFilmCredit>();

  for (const c of filmCredits) {
    if (c.role === 'cast' || c.character) {
      if (!castMap.has(c.id)) {
        castMap.set(c.id, { ...c });
      }
    }
    if (c.role === 'crew' || c.job) {
      if (!crewMap.has(c.id)) {
        crewMap.set(c.id, { ...c });
      } else {
        const existing = crewMap.get(c.id)!;
        if (c.job && existing.job && !existing.job.includes(c.job)) {
          existing.job = `${existing.job}, ${c.job}`;
        } else if (c.job && !existing.job) {
          existing.job = c.job;
        }
      }
    }
  }

  const castList = Array.from(castMap.values());
  const crewList = Array.from(crewMap.values());

  const currentHops = Math.max(0, Math.floor((state.path.length - 1) / 2));
  const totalClicks = Math.max(0, state.path.length - 1);

  if (state.phase === 'loading') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-widest text-text-secondary">Loading Challenge...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-16 relative">
      {/* Sticky Game Status HUD */}
      <div className="flex flex-col gap-3.5 bg-bg-card p-4 sm:p-5 rounded-[4px] border border-border sticky top-16 z-30 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
          {/* Target Film Goal */}
          {state.targetFilm && (
            <div className="flex items-center gap-3.5">
              <div
                className="relative rounded-[4px] overflow-hidden flex-shrink-0 bg-bg-secondary border border-border shadow-md"
                style={{ width: '72px', height: '108px' }}
              >
                {state.targetFilm.poster_path ? (
                  <Image
                    src={posterUrl(state.targetFilm.poster_path, 'w185')}
                    alt={state.targetFilm.title}
                    fill
                    sizes="72px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">🎬</div>
                )}
              </div>
              <div className="flex flex-col text-left gap-1">
                <div className="flex items-center">
                  <span className="text-[10px] font-medium text-text-secondary bg-bg-secondary px-2 py-0.5 rounded border border-border">
                    Goal
                  </span>
                </div>
                <span className="font-bold text-white text-base sm:text-lg leading-tight">
                  {state.targetFilm.title}
                </span>
                {state.targetFilm.year && (
                  <span className="text-text-secondary text-xs">{state.targetFilm.year}</span>
                )}
              </div>
            </div>
          )}

          {/* Right Metrics: Clicks & Timer (No Container) */}
          <div className="flex items-center gap-6 sm:gap-8">
            {/* Clicks Counter */}
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary block">CLICKS</span>
              <span className="font-mono text-2xl sm:text-3xl font-black text-white leading-tight">
                {totalClicks}
              </span>
            </div>

            {/* Running Clock */}
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary block">TIME</span>
              <Timer startTime={state.startTime} endTime={state.endTime} />
            </div>
          </div>
        </div>

        {/* Trail Breadcrumb [ X > Y > Z .. ] */}
        <div className="pt-2 border-t border-border/70">
          <Breadcrumb path={state.path} />
        </div>
      </div>

      {state.phase === 'playing' ? (
        <div className="flex flex-col gap-6">
          {/* Current Node Showcase Banner (Movie Synopsis / Person Bio) */}
          {state.currentView === 'film' && currentMedia ? (
            <div className="bg-bg-card border border-border rounded-[4px] p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-6 text-left shadow-lg">
              {/* Poster Thumbnail */}
              <div className="relative w-28 h-40 sm:w-32 sm:h-48 rounded-[4px] overflow-hidden bg-bg-secondary border border-white/10 flex-shrink-0 self-center sm:self-start">
                {currentMedia.poster_path ? (
                  <Image
                    src={posterUrl(currentMedia.poster_path, 'w342')}
                    alt={currentMedia.title}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🎬</div>
                )}
              </div>

              {/* Movie Metadata & Plot Overview */}
              <div className="flex flex-col gap-2 min-w-0 justify-center">
                <div className="flex items-center gap-2 flex-wrap">
                  {currentMedia.year && (
                    <span className="text-xs font-semibold text-text-secondary">
                      {currentMedia.year}
                    </span>
                  )}
                  {currentMedia.runtime && (
                    <span className="text-xs text-text-muted">
                      · {currentMedia.runtime} min
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {currentMedia.title}
                </h1>

                {currentMedia.tagline && (
                  <p className="text-xs sm:text-sm italic text-text-secondary font-medium">
                    &ldquo;{currentMedia.tagline}&rdquo;
                  </p>
                )}

                {/* Genre Tags */}
                {currentMedia.genres && currentMedia.genres.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap my-0.5">
                    {currentMedia.genres.map(g => (
                      <span key={g.id} className="text-[10px] uppercase font-medium bg-bg-secondary text-text-secondary px-2 py-0.5 rounded border border-border">
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Plot Description */}
                {currentMedia.overview && (
                  <p className="text-xs sm:text-sm text-text-primary/90 leading-relaxed line-clamp-3 sm:line-clamp-4 mt-1">
                    {currentMedia.overview}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Person Bio Showcase Banner */
            state.currentView === 'person' && currentPerson && (
              <div className="bg-bg-card border border-border rounded-[4px] p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-6 text-left shadow-lg">
                {/* Person Headshot */}
                <div className="relative w-28 h-40 sm:w-32 sm:h-48 rounded-[4px] overflow-hidden bg-bg-secondary border border-white/10 flex-shrink-0 self-center sm:self-start">
                  {currentPerson.profile_path ? (
                    <Image
                      src={profileUrl(currentPerson.profile_path, 'w185')}
                      alt={currentPerson.name}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                  )}
                </div>

                {/* Person Info & Bio */}
                <div className="flex flex-col gap-2 min-w-0 justify-center">
                  <div className="flex items-center gap-2 flex-wrap">
                    {currentPerson.known_for && (
                      <span className="text-xs font-semibold text-text-secondary">
                        Known for {currentPerson.known_for}
                      </span>
                    )}
                    {currentPerson.place_of_birth && (
                      <span className="text-xs text-text-muted truncate max-w-xs">
                        · {currentPerson.place_of_birth}
                      </span>
                    )}
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {currentPerson.name}
                  </h1>

                  {/* Biography */}
                  {currentPerson.biography ? (
                    <p className="text-xs sm:text-sm text-text-primary/90 leading-relaxed line-clamp-3 sm:line-clamp-4 mt-1">
                      {currentPerson.biography}
                    </p>
                  ) : (
                    <p className="text-xs text-text-muted mt-1">
                      Explore filmography and television credits below to continue your chain.
                    </p>
                  )}
                </div>
              </div>
            )
          )}

          {/* Sub-Tabs: Filter Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary font-medium">
                {state.currentView === 'film' ? 'Choose next person' : 'Choose next title'}
              </span>
              {loadingStep && (
                <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin ml-1" />
              )}
            </div>

            {/* Sub-Tabs: Cast vs Crew (Film View) */}
            {state.currentView === 'film' ? (
              <div className="flex items-center gap-1 bg-bg-secondary p-1 rounded-[4px] border border-border self-start sm:self-auto">
                <button
                  onClick={() => setFilmTab('all')}
                  className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${
                    filmTab === 'all'
                      ? 'bg-accent text-bg-primary font-bold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  All ({filmCredits.length})
                </button>
                <button
                  onClick={() => setFilmTab('cast')}
                  className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${
                    filmTab === 'cast'
                      ? 'bg-accent text-bg-primary font-bold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Cast ({castList.length})
                </button>
                <button
                  onClick={() => setFilmTab('crew')}
                  className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${
                    filmTab === 'crew'
                      ? 'bg-accent text-bg-primary font-bold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Crew ({crewList.length})
                </button>
              </div>
            ) : (
              /* Sub-Tabs: Movies vs TV Shows (Person View) */
              <div className="flex items-center gap-1 bg-bg-secondary p-1 rounded-[4px] border border-border self-start sm:self-auto">
                <button
                  onClick={() => setPersonTab('all')}
                  className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${
                    personTab === 'all'
                      ? 'bg-accent text-bg-primary font-bold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  All ({personMovies.length + personTvShows.length})
                </button>
                <button
                  onClick={() => setPersonTab('movies')}
                  className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${
                    personTab === 'movies'
                      ? 'bg-accent text-bg-primary font-bold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Movies ({personMovies.length})
                </button>
                {personTvShows.length > 0 && (
                  <button
                    onClick={() => setPersonTab('tv')}
                    className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${
                      personTab === 'tv'
                        ? 'bg-accent text-bg-primary font-bold'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    TV Shows ({personTvShows.length})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Film View: Cast and Crew Portrait Grids */}
          {state.currentView === 'film' ? (
            <div className="flex flex-col gap-6">
              {/* "All" view: split sections */}
              {filmTab === 'all' && (
                <>
                  {castList.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 border-b border-border/60 pb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                          Cast / Actors
                        </span>
                        <span className="text-[11px] text-text-muted">({castList.length})</span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                        {castList.map((credit) => (
                          <PersonCard
                            key={`cast-${credit.id}`}
                            tmdbId={credit.id}
                            name={credit.name}
                            profilePath={credit.profile_path}
                            role={credit.character}
                            job={credit.job}
                            onClick={() => onSelectPerson(credit.id, credit.name)}
                            size="sm"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {crewList.length > 0 && (
                    <div className="flex flex-col gap-3 mt-2">
                      <div className="flex items-center gap-2 border-b border-border/60 pb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                          Crew (Director, Producer, Writer)
                        </span>
                        <span className="text-[11px] text-text-muted">({crewList.length})</span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                        {crewList.map((credit) => (
                          <PersonCard
                            key={`crew-${credit.id}`}
                            tmdbId={credit.id}
                            name={credit.name}
                            profilePath={credit.profile_path}
                            job={credit.job}
                            onClick={() => onSelectPerson(credit.id, credit.name)}
                            size="sm"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* "Cast" tab */}
              {filmTab === 'cast' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                  {castList.map((credit) => (
                    <PersonCard
                      key={`cast-tab-${credit.id}`}
                      tmdbId={credit.id}
                      name={credit.name}
                      profilePath={credit.profile_path}
                      role={credit.character}
                      job={credit.job}
                      onClick={() => onSelectPerson(credit.id, credit.name)}
                      size="sm"
                    />
                  ))}
                </div>
              )}

              {/* "Crew" tab */}
              {filmTab === 'crew' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                  {crewList.map((credit) => (
                    <PersonCard
                      key={`crew-tab-${credit.id}`}
                      tmdbId={credit.id}
                      name={credit.name}
                      profilePath={credit.profile_path}
                      job={credit.job}
                      onClick={() => onSelectPerson(credit.id, credit.name)}
                      size="sm"
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Person View: Movies and TV Shows Split */
            <div className="flex flex-col gap-6">
              {/* "All" tab: Separate Movies and TV sections */}
              {personTab === 'all' && (
                <>
                  {/* Feature Films Section */}
                  {personMovies.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 border-b border-border/60 pb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                          Feature Films
                        </span>
                        <span className="text-[11px] text-text-muted">({personMovies.length})</span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                        {personMovies.map((film) => (
                          <FilmCard
                            key={`movie-${film.id}`}
                            tmdbId={film.id}
                            title={film.title}
                            year={film.release_date ? parseInt(film.release_date.split('-')[0]) : null}
                            posterPath={film.poster_path}
                            character={film.character}
                            isTarget={film.id === state.endFilmId}
                            onClick={() => onSelectFilm(film.id, film.title)}
                            size="sm"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TV Shows Section */}
                  {personTvShows.length > 0 && (
                    <div className="flex flex-col gap-3 mt-4">
                      <div className="flex items-center gap-2 border-b border-border/60 pb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#40bcf4]">
                          Television & Series
                        </span>
                        <span className="text-[11px] text-text-muted">({personTvShows.length})</span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                        {personTvShows.map((tv) => (
                          <FilmCard
                            key={`tv-${tv.id}`}
                            tmdbId={tv.id}
                            title={tv.title}
                            year={tv.release_date ? parseInt(tv.release_date.split('-')[0]) : null}
                            posterPath={tv.poster_path}
                            character={tv.character}
                            isTarget={tv.id === state.endFilmId}
                            onClick={() => onSelectFilm(tv.id, tv.title)}
                            size="sm"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* "Movies" only tab */}
              {personTab === 'movies' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                  {personMovies.map((film) => (
                    <FilmCard
                      key={`movie-tab-${film.id}`}
                      tmdbId={film.id}
                      title={film.title}
                      year={film.release_date ? parseInt(film.release_date.split('-')[0]) : null}
                      posterPath={film.poster_path}
                      character={film.character}
                      isTarget={film.id === state.endFilmId}
                      onClick={() => onSelectFilm(film.id, film.title)}
                      size="sm"
                    />
                  ))}
                </div>
              )}

              {/* "TV Shows" only tab */}
              {personTab === 'tv' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                  {personTvShows.map((tv) => (
                    <FilmCard
                      key={`tv-tab-${tv.id}`}
                      tmdbId={tv.id}
                      title={tv.title}
                      year={tv.release_date ? parseInt(tv.release_date.split('-')[0]) : null}
                      posterPath={tv.poster_path}
                      character={tv.character}
                      isTarget={tv.id === state.endFilmId}
                      onClick={() => onSelectFilm(tv.id, tv.title)}
                      size="sm"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Won State */
        <div className="flex flex-col items-center gap-8 mt-4 animate-in fade-in duration-500">
          <div className="text-center flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full bg-[#00e054]"></span>
              <span className="w-3 h-3 rounded-full bg-[#ff8000]"></span>
              <span className="w-3 h-3 rounded-full bg-[#40bcf4]"></span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white">PUZZLE SOLVED</h1>
            <p className="text-sm sm:text-base text-text-secondary">
              Connected <span className="text-white font-semibold">{state.startFilm?.title}</span> to{' '}
              <span className="text-white font-semibold">{state.targetFilm?.title}</span> in{' '}
              <span className="text-accent font-bold">{Math.floor(state.path.length / 2)} hops</span>!
            </p>
          </div>

          <div className="w-full max-w-md">
            <ShareCard
              date={state.puzzleDate}
              time={Math.max(1, Math.round(((state.endTime || 0) - (state.startTime || 0)) / 1000))}
              hopCount={Math.floor(state.path.length / 2)}
              path={state.path}
            />
          </div>

          <div className="w-full max-w-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wider text-text-secondary mb-3 text-left">
              Today&apos;s Leaderboard
            </h3>
            <Leaderboard entries={leaderboard} currentHandle={handle} />
          </div>

          <Link
            href="/"
            className="px-6 py-2.5 bg-bg-secondary text-text-primary text-xs font-bold uppercase tracking-wider rounded-[4px] border border-border hover:bg-bg-hover hover:border-accent/40 transition-all"
          >
            ← Back to Home
          </Link>
        </div>
      )}
    </div>
  );
}
