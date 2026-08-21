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
import confetti from 'canvas-confetti';

function triggerCelebration() {
  if (typeof window === 'undefined') return;
  // Center blast
  confetti({
    particleCount: 80,
    spread: 80,
    origin: { y: 0.6 },
    zIndex: 9999,
    colors: ['#ffffff', '#f5c518', '#40bcf4', '#ff8000', '#00e054']
  });

  // Dynamic side cannons for 1.5 seconds
  const end = Date.now() + 1500;
  const timer = setInterval(() => {
    if (Date.now() > end) {
      return clearInterval(timer);
    }
    confetti({
      particleCount: 25,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      zIndex: 9999,
      colors: ['#ffffff', '#f5c518', '#40bcf4', '#ff8000', '#00e054']
    });
    confetti({
      particleCount: 25,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      zIndex: 9999,
      colors: ['#ffffff', '#f5c518', '#40bcf4', '#ff8000', '#00e054']
    });
  }, 200);
}

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
  currentView: 'film' | 'person';
  puzzleDate: string;
  startFilm: FilmInfo | null;
  targetFilm: FilmInfo | null;
  endFilmId: number;
  path: PathStep[];
  currentId: number;
  clickCount: number;
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
    currentView: 'film',
    puzzleDate: date,
    startFilm: null,
    targetFilm: null,
    endFilmId: 0,
    path: [],
    currentId: 0,
    clickCount: 0,
    startTime: null,
    endTime: null,
  });

  const [loadingStep, setLoadingStep] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filmCredits, setFilmCredits] = useState<TmdbFilmCredit[]>([]);
  const [currentMedia, setCurrentMedia] = useState<CurrentMediaDetails | null>(null);
  const [currentPerson, setCurrentPerson] = useState<CurrentPersonDetails | null>(null);
  const [personMovies, setPersonMovies] = useState<TmdbFilm[]>([]);
  const [personTvShows, setPersonTvShows] = useState<TmdbFilm[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryRow[]>([]);
  const [filmTab, setFilmTab] = useState<FilmFilterTab>('all');
  const [personTab, setPersonTab] = useState<PersonFilterTab>('movies');
  const [copied, setCopied] = useState(false);

  const fetchFilmCredits = async (id: number): Promise<TmdbFilmCredit[]> => {
    setLoadingStep(true);
    setSearchQuery('');
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
      setState(s => ({ ...s, currentView: 'film', currentId: id }));
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
    setSearchQuery('');
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
      setPersonTab('movies');
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
          currentView: 'film',
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
    const newPath: PathStep[] = [...state.path, { type: 'person', id: personId, name }];
    setState(s => ({ ...s, path: newPath, clickCount: s.clickCount + 1 }));
    await fetchPersonCredits(personId);
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
        currentId: filmId,
        clickCount: newClickCount,
        phase: 'won',
        endTime,
      }));

      triggerCelebration();

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
      setState(s => ({ ...s, path: newPath, currentId: filmId, clickCount: newClickCount }));
      await fetchFilmCredits(filmId);
    }
  };

  const onRewindTo = async (index: number) => {
    const truncatedPath = state.path.slice(0, index + 1);
    const targetNode = truncatedPath[truncatedPath.length - 1];
    if (targetNode) {
      setState(s => ({ ...s, path: truncatedPath, currentId: targetNode.id }));
      if (targetNode.type === 'film') {
        await fetchFilmCredits(targetNode.id);
      } else {
        await fetchPersonCredits(targetNode.id);
      }
    }
  };

  const copyShareResult = () => {
    const elapsedSec = Math.max(1, Math.round(((state.endTime || 0) - (state.startTime || 0)) / 1000));
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const emojiPath = state.path.map(p => (p.type === 'film' ? '🎬' : '👤')).join(' > ');
    const shareText = `FILMTRACE\n${timeStr} * ${state.clickCount} clicks\n${emojiPath}\nhttps://filmtrace.app`;

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

  const allCastList = Array.from(castMap.values());
  const allCrewList = Array.from(crewMap.values());

  // Real-time Search Filtering
  const q = searchQuery.toLowerCase().trim();

  const filteredCast = allCastList.filter(c =>
    !q || c.name.toLowerCase().includes(q) || (c.character && c.character.toLowerCase().includes(q)) || (c.job && c.job.toLowerCase().includes(q))
  );

  const filteredCrew = allCrewList.filter(c =>
    !q || c.name.toLowerCase().includes(q) || (c.job && c.job.toLowerCase().includes(q))
  );

  const filteredFilmCredits = filmCredits.filter(c =>
    !q || c.name.toLowerCase().includes(q) || (c.character && c.character.toLowerCase().includes(q)) || (c.job && c.job.toLowerCase().includes(q))
  );

  const allPersonTitles = [...personMovies, ...personTvShows];
  const filteredPersonAll = allPersonTitles.filter(f =>
    !q || f.title.toLowerCase().includes(q) || (f.character && f.character.toLowerCase().includes(q)) || (f.release_date && f.release_date.includes(q))
  );
  const filteredPersonMovies = personMovies.filter(f =>
    !q || f.title.toLowerCase().includes(q) || (f.character && f.character.toLowerCase().includes(q)) || (f.release_date && f.release_date.includes(q))
  );
  const filteredPersonTv = personTvShows.filter(f =>
    !q || f.title.toLowerCase().includes(q) || (f.character && f.character.toLowerCase().includes(q)) || (f.release_date && f.release_date.includes(q))
  );

  if (state.phase === 'loading') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-widest text-text-secondary">Loading Challenge...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto w-full pb-16 relative">
      {/* Compact Sticky Game Status HUD */}
      <div className="flex flex-col gap-2.5 bg-bg-card/95 p-3 sm:p-3.5 rounded-[4px] border border-border sticky top-14 z-30 shadow-xl backdrop-blur-md">
        <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
          {/* Target Film Goal (Top-aligned, compact poster) */}
          {state.targetFilm && (
            <div className="flex items-start gap-3.5">
              <div
                className="w-16 h-24 sm:w-18 sm:h-26 relative rounded overflow-hidden flex-shrink-0 bg-bg-secondary border border-border shadow-md"
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
                  <div className="w-full h-full flex items-center justify-center text-xs text-text-muted">🎬</div>
                )}
              </div>
              <div className="flex flex-col text-left justify-start">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#00e054]">
                  GOAL
                </span>
                <span className="font-bold text-white text-sm sm:text-base leading-tight max-w-[170px] sm:max-w-[260px] truncate mt-0.5">
                  {state.targetFilm.title}
                </span>
                {state.targetFilm.year && (
                  <span className="text-text-secondary text-[11px] font-mono mt-0.5">{state.targetFilm.year}</span>
                )}
              </div>
            </div>
          )}

          {/* Right Metrics: Clicks & Timer (Top-aligned labels) */}
          <div className="flex items-start gap-8 sm:gap-14">
            {/* Clicks Counter */}
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary leading-tight">CLICKS</span>
              <span className="font-mono text-2xl sm:text-3xl font-black text-white leading-tight mt-0.5">
                {state.clickCount}
              </span>
            </div>

            {/* Running Clock */}
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary leading-tight">TIME</span>
              <div className="mt-0.5">
                <Timer startTime={state.startTime} endTime={state.endTime} />
              </div>
            </div>
          </div>
        </div>

        {/* Trail Breadcrumb with Rewind Support */}
        <div className="pt-2 border-t border-border/70 overflow-x-auto hide-scrollbar">
          <Breadcrumb path={state.path} onRewind={onRewindTo} />
        </div>
      </div>

      {state.phase === 'playing' ? (
        <div className="flex flex-col gap-5">
          {/* VIEW: UNIFIED FILM CARD & CAST/CREW CONTAINER */}
          {state.currentView === 'film' && currentMedia && (
            <div className="bg-bg-card border border-border rounded-[6px] shadow-2xl overflow-hidden flex flex-col">
              {/* Film Header Banner (50% shorter thumbnail, title & year only) */}
              <div className="p-3 sm:p-4 bg-gradient-to-b from-bg-secondary/40 to-bg-card border-b border-border flex items-center gap-3.5 text-left">
                <div className="relative w-11 h-15 sm:w-12 sm:h-18 rounded-[4px] overflow-hidden bg-bg-secondary border border-border flex-shrink-0 shadow">
                  {currentMedia.poster_path ? (
                    <Image
                      src={posterUrl(currentMedia.poster_path, 'w185')}
                      alt={currentMedia.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>
                  )}
                </div>

                {/* Title and Year only */}
                <div className="flex flex-col min-w-0 justify-center">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight truncate">
                      {currentMedia.title}
                    </h1>
                    {currentMedia.year && (
                      <span className="text-xs font-mono text-text-secondary font-medium">({currentMedia.year})</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Integrated Cast & Crew Section */}
              <div className="p-4 sm:p-6 flex flex-col gap-5">
                {/* Filter Navigation Bar with Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-white">
                      Choose next person
                    </span>
                    <span className="text-xs text-text-muted font-mono">({filteredFilmCredits.length})</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Search Input */}
                    <div className="relative flex items-center flex-1 sm:flex-none">
                      <input
                        type="text"
                        placeholder="Search person or role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-bg-primary border border-border text-white text-xs rounded pl-8 pr-7 py-1.5 focus:outline-none focus:border-text-secondary w-full sm:w-52 transition-all placeholder:text-text-muted"
                      />
                      <span className="absolute left-2.5 text-text-muted text-xs">🔍</span>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2 text-text-muted hover:text-white text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-1 bg-bg-primary p-1 rounded border border-border">
                      <button
                        onClick={() => setFilmTab('all')}
                        className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer ${
                          filmTab === 'all'
                            ? 'bg-white text-[#0e1114]'
                            : 'text-text-secondary hover:text-white'
                        }`}
                      >
                        All ({filteredFilmCredits.length})
                      </button>
                      <button
                        onClick={() => setFilmTab('cast')}
                        className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer ${
                          filmTab === 'cast'
                            ? 'bg-white text-[#0e1114]'
                            : 'text-text-secondary hover:text-white'
                        }`}
                      >
                        Cast ({filteredCast.length})
                      </button>
                      <button
                        onClick={() => setFilmTab('crew')}
                        className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer ${
                          filmTab === 'crew'
                            ? 'bg-white text-[#0e1114]'
                            : 'text-text-secondary hover:text-white'
                        }`}
                      >
                        Crew ({filteredCrew.length})
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cast and Crew Portrait Grids */}
                {loadingStep ? (
                  <div className="flex items-center justify-center py-16 gap-3">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-text-secondary uppercase tracking-widest">Loading cast & crew...</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {filmTab === 'all' && (
                      <>
                        {filteredCast.length > 0 && (
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 border-b border-border/60 pb-1.5">
                              <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                                Cast / Actors
                              </span>
                              <span className="text-[11px] text-text-muted">({filteredCast.length})</span>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                              {filteredCast.map((credit) => (
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

                        {filteredCrew.length > 0 && (
                          <div className="flex flex-col gap-3 mt-2">
                            <div className="flex items-center gap-2 border-b border-border/60 pb-1.5">
                              <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                                Crew
                              </span>
                              <span className="text-[11px] text-text-muted">({filteredCrew.length})</span>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                              {filteredCrew.map((credit) => (
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

                        {filteredCast.length === 0 && filteredCrew.length === 0 && (
                          <p className="text-xs text-text-muted py-8 text-center">
                            No cast or crew found matching &ldquo;{searchQuery}&rdquo;
                          </p>
                        )}
                      </>
                    )}

                    {filmTab === 'cast' && (
                      filteredCast.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                          {filteredCast.map((credit) => (
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
                      ) : (
                        <p className="text-xs text-text-muted py-8 text-center">
                          No cast members found matching &ldquo;{searchQuery}&rdquo;
                        </p>
                      )
                    )}

                    {filmTab === 'crew' && (
                      filteredCrew.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                          {filteredCrew.map((credit) => (
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
                      ) : (
                        <p className="text-xs text-text-muted py-8 text-center">
                          No crew members found matching &ldquo;{searchQuery}&rdquo;
                        </p>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: UNIFIED PERSON CARD & FILMOGRAPHY CONTAINER */}
          {state.currentView === 'person' && currentPerson && (
            <div className="bg-bg-card border border-border rounded-[6px] shadow-2xl overflow-hidden flex flex-col">
              {/* Person Header Banner (Clean name & tags, no bulky bio) */}
              <div className="p-4 sm:p-6 bg-gradient-to-b from-bg-secondary/50 to-bg-card border-b border-border flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-left">
                <div className="relative w-20 h-28 sm:w-24 sm:h-36 rounded-[4px] overflow-hidden bg-bg-secondary border border-border flex-shrink-0 shadow-lg">
                  {currentPerson.profile_path ? (
                    <Image
                      src={profileUrl(currentPerson.profile_path, 'w185')}
                      alt={currentPerson.name}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 min-w-0 justify-center flex-1">
                  <div className="flex items-center gap-2 text-xs text-text-secondary flex-wrap">
                    {currentPerson.known_for && <span className="font-bold text-white">{currentPerson.known_for}</span>}
                    {currentPerson.place_of_birth && <span className="text-text-muted">· {currentPerson.place_of_birth}</span>}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                    {currentPerson.name}
                  </h1>

                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-bg-secondary text-text-secondary px-2.5 py-0.5 rounded border border-border">
                      Filmography
                    </span>
                  </div>
                </div>
              </div>

              {/* Integrated Filmography Section */}
              <div className="p-4 sm:p-6 flex flex-col gap-5">
                {/* Sub-Header & Filmography Tabs with Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-white">
                      Choose next title
                    </span>
                    <span className="text-xs text-text-muted font-mono">({filteredPersonAll.length})</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Search Input */}
                    <div className="relative flex items-center flex-1 sm:flex-none">
                      <input
                        type="text"
                        placeholder="Search title or character..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-bg-primary border border-border text-white text-xs rounded pl-8 pr-7 py-1.5 focus:outline-none focus:border-text-secondary w-full sm:w-52 transition-all placeholder:text-text-muted"
                      />
                      <span className="absolute left-2.5 text-text-muted text-xs">🔍</span>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2 text-text-muted hover:text-white text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-1 bg-bg-primary p-1 rounded border border-border">
                      <button
                        onClick={() => setPersonTab('all')}
                        className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer ${
                          personTab === 'all'
                            ? 'bg-white text-[#0e1114]'
                            : 'text-text-secondary hover:text-white'
                        }`}
                      >
                        All ({filteredPersonAll.length})
                      </button>
                      <button
                        onClick={() => setPersonTab('movies')}
                        className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer ${
                          personTab === 'movies'
                            ? 'bg-white text-[#0e1114]'
                            : 'text-text-secondary hover:text-white'
                        }`}
                      >
                        Movies ({filteredPersonMovies.length})
                      </button>
                      {personTvShows.length > 0 && (
                        <button
                          onClick={() => setPersonTab('tv')}
                          className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer ${
                            personTab === 'tv'
                              ? 'bg-white text-[#0e1114]'
                              : 'text-text-secondary hover:text-white'
                          }`}
                        >
                          TV Shows ({filteredPersonTv.length})
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Filmography Grid */}
                {loadingStep ? (
                  <div className="flex items-center justify-center py-16 gap-3">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-text-secondary uppercase tracking-widest">Loading titles...</span>
                  </div>
                ) : (
                  <>
                    {(personTab === 'all'
                      ? filteredPersonAll
                      : personTab === 'movies'
                      ? filteredPersonMovies
                      : filteredPersonTv
                    ).length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                        {(personTab === 'all'
                          ? filteredPersonAll
                          : personTab === 'movies'
                          ? filteredPersonMovies
                          : filteredPersonTv
                        ).map((film) => (
                          <FilmCard
                            key={`film-${film.id}`}
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
                    ) : (
                      <p className="text-xs text-text-muted py-8 text-center">
                        No titles found matching &ldquo;{searchQuery}&rdquo;
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Results / Won Screen */
        <div className="flex flex-col items-center gap-7 py-6 w-full animate-in fade-in duration-500">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">
              Challenge Completed
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
                    const rankColors: Record<number, string> = { 1: '#f5c518', 2: '#c0c0c0', 3: '#cd7f32' };
                    const rankColor = rankColors[idx + 1] || '#667788';
                    const mins = Math.floor(entry.time_seconds / 60);
                    const secs = entry.time_seconds % 60;

                    return (
                      <tr key={entry.id || idx} className={`border-b border-border/50 ${isYou ? 'bg-white/10' : ''}`}>
                        <td className="py-2 px-1.5 text-center font-mono font-bold" style={{ color: rankColor }}>
                          {idx + 1}
                        </td>
                        <td className="py-2 px-1.5 text-left font-medium">
                          <span className={isYou ? 'text-white font-bold' : 'text-text-primary'}>
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mt-1">
            <button
              onClick={copyShareResult}
              className="w-full sm:flex-1 py-3 px-5 bg-white text-[#0e1114] hover:bg-white/90 text-xs font-bold uppercase tracking-wider rounded-[4px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
              <span>{copied ? 'Copied to Clipboard!' : 'Share'}</span>
            </button>
            <Link
              href="/"
              className="w-full sm:w-auto py-3 px-6 bg-transparent text-text-secondary text-xs font-semibold border border-border rounded-[4px] hover:text-white hover:border-text-secondary transition-all text-center"
            >
              &larr; Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
