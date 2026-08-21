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

interface SelectedPersonData {
  id: number;
  name: string;
  movies: TmdbFilm[];
  tvShows: TmdbFilm[];
}

interface GameState {
  phase: 'loading' | 'playing' | 'won';
  puzzleDate: string;
  startFilm: FilmInfo | null;
  targetFilm: FilmInfo | null;
  endFilmId: number;
  path: PathStep[];
  currentFilmId: number;
  clickCount: number;
  startTime: number | null;
  endTime: number | null;
}

type FilmFilterTab = 'all' | 'cast' | 'crew';

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
    currentFilmId: 0,
    clickCount: 0,
    startTime: null,
    endTime: null,
  });

  const [filmCredits, setFilmCredits] = useState<TmdbFilmCredit[]>([]);
  const [currentMedia, setCurrentMedia] = useState<CurrentMediaDetails | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<SelectedPersonData | null>(null);
  const [loadingPersonFilms, setLoadingPersonFilms] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryRow[]>([]);
  const [filmTab, setFilmTab] = useState<FilmFilterTab>('all');
  const [copied, setCopied] = useState(false);

  const fetchFilmCredits = async (id: number): Promise<TmdbFilmCredit[]> => {
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
      setSelectedPerson(null);
      setFilmTab('all');
      return data.cast_crew || [];
    } catch (err) {
      console.error('Error fetching film credits:', err);
      return [];
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
          currentFilmId: data.startFilm.tmdb_id,
          clickCount: 0,
          path: startPath,
        }));
        await fetchFilmCredits(data.startFilm.tmdb_id);
        setState(s => ({ ...s, phase: 'playing', startTime: Date.now() }));
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const onSelectPerson = async (personId: number, name: string) => {
    if (selectedPerson && selectedPerson.id === personId) {
      // Toggle off if clicked again
      onCancelPerson();
      return;
    }

    setLoadingPersonFilms(true);
    const newPath: PathStep[] = [...state.path, { type: 'person', id: personId, name }];
    setState(s => ({ ...s, path: newPath, clickCount: s.clickCount + 1 }));

    try {
      let res = await fetch(`/api/person/${personId}`);
      let data = await res.json();

      if (!res.ok || !data.filmography) {
        await new Promise(r => setTimeout(r, 400));
        res = await fetch(`/api/person/${personId}`);
        data = await res.json();
      }

      setSelectedPerson({
        id: personId,
        name: data.name || name,
        movies: data.filmography || [],
        tvShows: data.tv_credits || [],
      });
    } catch (err) {
      console.error('Error fetching person credits:', err);
    } finally {
      setLoadingPersonFilms(false);
    }
  };

  const onCancelPerson = () => {
    if (state.path.length > 0 && state.path[state.path.length - 1].type === 'person') {
      setState(s => ({ ...s, path: s.path.slice(0, -1) }));
    }
    setSelectedPerson(null);
  };

  const onSelectFilm = async (filmId: number, title: string) => {
    const newPath: PathStep[] = [...state.path, { type: 'film', id: filmId, name: title }];
    const newClickCount = state.clickCount + 1;

    if (filmId === state.endFilmId) {
      // Won!
      const endTime = Date.now();
      const elapsed = Math.max(1, Math.round((endTime - (state.startTime || endTime)) / 1000));
      const hops = Math.floor(newPath.length / 2);

      setState(s => ({
        ...s,
        path: newPath,
        currentFilmId: filmId,
        clickCount: newClickCount,
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
      setState(s => ({ ...s, path: newPath, currentFilmId: filmId, clickCount: newClickCount }));
      fetchFilmCredits(filmId);
    }
  };

  const onRewindTo = (index: number) => {
    const truncatedPath = state.path.slice(0, index + 1);
    const targetNode = truncatedPath[truncatedPath.length - 1];
    if (targetNode && targetNode.type === 'film') {
      setState(s => ({ ...s, path: truncatedPath, currentFilmId: targetNode.id }));
      setSelectedPerson(null);
      fetchFilmCredits(targetNode.id);
    }
  };

  const copyShareResult = () => {
    const elapsedSec = Math.max(1, Math.round(((state.endTime || 0) - (state.startTime || 0)) / 1000));
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const emojiPath = state.path.map(p => (p.type === 'film' ? '🎬' : '👤')).join(' > ');
    const shareText = `FILMCHAIN\n${timeStr} * ${state.clickCount} clicks\n${emojiPath}\nhttps://filmchain.app`;

    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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

  // Filter available films for selected person (exclude already visited films in the current path)
  const visitedFilmIds = state.path.filter(p => p.type === 'film').map(p => p.id);
  const personAvailableFilms = selectedPerson
    ? [...selectedPerson.movies, ...selectedPerson.tvShows].filter(f => !visitedFilmIds.includes(f.id))
    : [];

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
                style={{ width: '56px', height: '84px' }}
              >
                {state.targetFilm.poster_path ? (
                  <Image
                    src={posterUrl(state.targetFilm.poster_path, 'w185')}
                    alt={state.targetFilm.title}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-text-muted">🎬</div>
                )}
              </div>
              <div className="flex flex-col text-left gap-1">
                <div className="flex items-center">
                  <span className="text-[10px] font-semibold text-text-secondary bg-bg-secondary px-2 py-0.5 rounded border border-border">
                    Goal
                  </span>
                </div>
                <span className="font-bold text-white text-sm sm:text-base leading-tight">
                  {state.targetFilm.title}
                </span>
                {state.targetFilm.year && (
                  <span className="text-text-secondary text-xs">{state.targetFilm.year}</span>
                )}
              </div>
            </div>
          )}

          {/* Right Metrics: Clicks & Timer */}
          <div className="flex items-center gap-6 sm:gap-8">
            {/* Clicks Counter */}
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary block">CLICKS</span>
              <span className="font-mono text-2xl sm:text-3xl font-black text-white leading-tight">
                {state.clickCount}
              </span>
            </div>

            {/* Running Clock */}
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary block">TIME</span>
              <Timer startTime={state.startTime} endTime={state.endTime} />
            </div>
          </div>
        </div>

        {/* Trail Breadcrumb with Rewind Support */}
        <div className="pt-2 border-t border-border/70">
          <Breadcrumb path={state.path} onRewind={onRewindTo} />
        </div>
      </div>

      {state.phase === 'playing' ? (
        <div className="flex flex-col gap-6">
          {/* Current Movie Showcase Banner */}
          {currentMedia && (
            <div className="bg-bg-card border border-border rounded-[4px] p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-6 text-left shadow-lg">
              {/* Poster */}
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

              {/* Metadata & Plot Overview */}
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
          )}

          {/* Sub-Tabs: Filter Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3 px-1">
            <span className="text-base sm:text-lg font-extrabold text-white tracking-tight">
              Choose next person
            </span>

            {/* Sub-Tabs: Cast vs Crew */}
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
          </div>

          {/* Cast and Crew Portrait Grids */}
          <div className="flex flex-col gap-6">
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

          {/* Interactive Selected Person Film Picker Panel (from FilmChain.dc.html) */}
          {selectedPerson && (
            <div className="flex flex-col gap-3 bg-bg-secondary border border-border rounded-[4px] p-4 sm:p-5 mt-2 shadow-xl animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <span className="text-xs sm:text-sm font-bold text-white">
                  Choose next film &mdash; <span className="text-accent">{selectedPerson.name}</span>
                </span>
                <button
                  onClick={onCancelPerson}
                  className="text-xs font-semibold text-text-secondary hover:text-white cursor-pointer transition-colors"
                >
                  Cancel &times;
                </button>
              </div>

              {loadingPersonFilms ? (
                <div className="flex items-center gap-2 py-6 justify-center">
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-text-secondary">Loading filmography...</span>
                </div>
              ) : personAvailableFilms.length === 0 ? (
                <p className="text-xs text-text-muted py-2">
                  No new films found for this person &mdash; try someone else.
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 pt-1">
                  {personAvailableFilms.map((film) => (
                    <FilmCard
                      key={`person-film-${film.id}`}
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
            </div>
          )}
        </div>
      ) : (
        /* Results / Won Screen (matching FilmChain.dc.html) */
        <div className="flex flex-col items-center gap-7 py-6 w-full animate-in fade-in duration-500">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">
              Chain Complete
            </span>

            <div className="flex items-center gap-3.5 my-1">
              <div className="w-16 h-24 rounded-[4px] overflow-hidden bg-bg-secondary border border-border relative">
                {state.startFilm?.poster_path ? (
                  <Image src={posterUrl(state.startFilm.poster_path, 'w185')} alt={state.startFilm.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>
                )}
              </div>
              <span className="text-2xl text-text-muted font-light">&rarr;</span>
              <div className="w-16 h-24 rounded-[4px] overflow-hidden bg-bg-secondary border border-border relative">
                {state.targetFilm?.poster_path ? (
                  <Image src={posterUrl(state.targetFilm.poster_path, 'w185')} alt={state.targetFilm.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>
                )}
              </div>
            </div>

            <h2 className="text-base sm:text-lg font-semibold text-text-secondary">
              {state.startFilm?.title} to {state.targetFilm?.title}
            </h2>
          </div>

          {/* Result Stats Box */}
          <div className="flex flex-col gap-2.5 bg-bg-card border border-border rounded-[4px] p-6 w-full max-w-md shadow-2xl">
            <span className="text-[11px] font-bold uppercase tracking-widest text-text-secondary text-left">
              Your Result
            </span>
            <div className="flex items-center justify-around py-3">
              <div className="text-center">
                <span className="text-[11px] font-bold uppercase tracking-widest text-text-secondary block mb-1">
                  Time
                </span>
                <span className="font-mono text-3xl sm:text-4xl font-extrabold text-white">
                  {Math.floor(Math.max(1, Math.round(((state.endTime || 0) - (state.startTime || 0)) / 1000)) / 60)}:
                  {String(Math.max(1, Math.round(((state.endTime || 0) - (state.startTime || 0)) / 1000)) % 60).padStart(2, '0')}
                </span>
              </div>
              <div className="w-px h-10 bg-border"></div>
              <div className="text-center">
                <span className="text-[11px] font-bold uppercase tracking-widest text-text-secondary block mb-1">
                  Clicks
                </span>
                <span className="font-mono text-3xl sm:text-4xl font-extrabold text-accent">
                  {state.clickCount}
                </span>
              </div>
            </div>
          </div>

          {/* Leaderboard Section */}
          <div className="flex flex-col gap-3 bg-bg-secondary border border-border rounded-[4px] p-5 w-full max-w-md">
            <div className="flex flex-col text-left gap-0.5">
              <span className="text-sm font-extrabold text-white">Leaderboard</span>
              <span className="text-[11px] text-text-muted">Today&apos;s fastest chains</span>
            </div>

            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase text-text-secondary">
                  <th className="py-2 px-1.5 text-center w-9">Pos</th>
                  <th className="py-2 px-1.5 text-left">Player</th>
                  <th className="py-2 px-1.5 text-right">Time</th>
                  <th className="py-2 px-1.5 text-right">Clicks</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.length > 0 ? (
                  leaderboard.slice(0, 10).map((entry, idx) => {
                    const isYou = entry.handle === handle;
                    const rankColors: Record<number, string> = { 1: '#00e054', 2: '#40bcf4', 3: '#ff8000' };
                    const rankColor = rankColors[idx + 1] || '#667788';
                    const mins = Math.floor(entry.time_seconds / 60);
                    const secs = entry.time_seconds % 60;

                    return (
                      <tr key={entry.id || idx} className={`border-b border-border/50 ${isYou ? 'bg-accent/10' : ''}`}>
                        <td className="py-2 px-1.5 text-center font-mono font-bold" style={{ color: rankColor }}>
                          {idx + 1}
                        </td>
                        <td className="py-2 px-1.5 text-left font-medium">
                          <span className={isYou ? 'text-accent font-bold' : 'text-white'}>
                            {entry.handle} {isYou ? '(You)' : ''}
                          </span>
                        </td>
                        <td className="py-2 px-1.5 text-right font-mono text-text-secondary">
                          {mins}:{String(secs).padStart(2, '0')}
                        </td>
                        <td className="py-2 px-1.5 text-right font-mono text-text-secondary">
                          {entry.path ? Math.max(0, entry.path.length - 1) : entry.hop_count * 2}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-text-muted">
                      No other scores logged today yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Share Section */}
          <div className="flex flex-col gap-2 w-full max-w-md text-left">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Share
            </span>
            <pre className="bg-bg-secondary border border-border rounded-[4px] p-3 text-xs text-text-secondary font-mono whitespace-pre-wrap">
              {`FILMTRACE\n${Math.floor(Math.max(1, Math.round(((state.endTime || 0) - (state.startTime || 0)) / 1000)) / 60)}:${String(Math.max(1, Math.round(((state.endTime || 0) - (state.startTime || 0)) / 1000)) % 60).padStart(2, '0')} * ${state.clickCount} clicks\n${state.path.map(p => (p.type === 'film' ? '🎬' : '👤')).join(' > ')}\nhttps://filmtrace.app`}
            </pre>
            <button
              onClick={copyShareResult}
              className="w-full py-2 bg-transparent text-accent text-xs font-bold uppercase tracking-wider border border-accent rounded-[4px] hover:bg-accent/10 transition-colors cursor-pointer"
            >
              {copied ? 'Copied!' : 'Copy Result'}
            </button>
          </div>

          <Link
            href="/"
            className="px-8 py-2.5 bg-transparent text-text-secondary text-xs font-semibold border border-border rounded-[4px] hover:text-white hover:border-text-secondary transition-all"
          >
            &larr; Back to Home
          </Link>
        </div>
      )}
    </div>
  );
}
