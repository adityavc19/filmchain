'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PathStep } from '@/lib/supabase';
import { TmdbFilmCredit, TmdbFilm, posterUrl, profileUrl } from '@/lib/tmdb';
import { getOrCreateHandle } from '@/lib/handle';
import Timer from '@/components/Timer';
import Breadcrumb from '@/components/Breadcrumb';
import FilmCard from '@/components/FilmCard';
import PersonCard from '@/components/PersonCard';
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

interface CustomLeaderboardEntry {
  id: string;
  handle: string;
  time_seconds: number;
  hop_count: number;
  path: PathStep[];
  submitted_at: string;
}

export default function CustomGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [handle] = useState(() => getOrCreateHandle());

  const [puzzleTitle, setPuzzleTitle] = useState('');
  const [creatorHandle, setCreatorHandle] = useState<string | null>(null);
  const [startFilm, setStartFilm] = useState<FilmInfo | null>(null);
  const [targetFilm, setTargetFilm] = useState<FilmInfo | null>(null);
  const [phase, setPhase] = useState<'loading' | 'playing' | 'won'>('loading');
  const [currentView, setCurrentView] = useState<'film' | 'person'>('film');
  const [path, setPath] = useState<PathStep[]>([]);
  const [clickCount, setClickCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);

  const [loadingStep, setLoadingStep] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filmCredits, setFilmCredits] = useState<TmdbFilmCredit[]>([]);
  const [currentMedia, setCurrentMedia] = useState<CurrentMediaDetails | null>(null);
  const [currentPerson, setCurrentPerson] = useState<CurrentPersonDetails | null>(null);
  const [personMovies, setPersonMovies] = useState<TmdbFilm[]>([]);
  const [personTvShows, setPersonTvShows] = useState<TmdbFilm[]>([]);
  const [leaderboard, setLeaderboard] = useState<CustomLeaderboardEntry[]>([]);
  const [filmTab, setFilmTab] = useState<'all' | 'cast' | 'crew'>('all');
  const [personTab, setPersonTab] = useState<'all' | 'movies' | 'tv'>('movies');
  const [copied, setCopied] = useState(false);

  const fetchFilmCredits = async (filmId: number) => {
    setLoadingStep(true);
    setSearchQuery('');
    try {
      const res = await fetch(`/api/film/${filmId}`);
      const data = await res.json();
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
      setCurrentView('film');
      setFilmTab('all');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStep(false);
    }
  };

  const fetchPersonCredits = async (personId: number) => {
    setLoadingStep(true);
    setSearchQuery('');
    try {
      const res = await fetch(`/api/person/${personId}`);
      const data = await res.json();
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
      setCurrentView('person');
      setPersonTab('movies');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStep(false);
    }
  };

  // Load custom puzzle
  useEffect(() => {
    fetch(`/api/puzzle/custom?id=${id}`)
      .then(res => res.json())
      .then(async data => {
        if (data.error) {
          console.error(data.error);
          return;
        }
        setPuzzleTitle(data.title || `${data.startFilm.title} → ${data.endFilm.title}`);
        setCreatorHandle(data.creator_handle);
        setStartFilm(data.startFilm);
        setTargetFilm(data.endFilm);
        setLeaderboard(data.leaderboard || []);

        const initialPath: PathStep[] = [
          { type: 'film', id: data.startFilm.tmdb_id, name: data.startFilm.title },
        ];
        setPath(initialPath);
        setClickCount(0);
        await fetchFilmCredits(data.startFilm.tmdb_id);
        setPhase('playing');
        setStartTime(Date.now());
      })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSelectPerson = async (personId: number, name: string) => {
    const newPath: PathStep[] = [...path, { type: 'person', id: personId, name }];
    setPath(newPath);
    setClickCount(c => c + 1);
    await fetchPersonCredits(personId);
  };

  const onSelectFilm = async (filmId: number, title: string) => {
    const newPath: PathStep[] = [...path, { type: 'film', id: filmId, name: title }];
    const newClicks = clickCount + 1;
    setClickCount(newClicks);

    if (targetFilm && filmId === targetFilm.tmdb_id) {
      const end = Date.now();
      setEndTime(end);
      setPath(newPath);
      setPhase('won');

      triggerCelebration();

      const elapsed = Math.max(1, Math.round((end - (startTime || end)) / 1000));
      const hops = Math.floor(newPath.length / 2);

      // Submit score
      try {
        await fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            puzzle_date: id, // custom puzzle identifier
            handle,
            time_seconds: elapsed,
            hop_count: hops,
            path: newPath,
          }),
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      setPath(newPath);
      await fetchFilmCredits(filmId);
    }
  };

  const onRewindTo = async (index: number) => {
    const truncated = path.slice(0, index + 1);
    const node = truncated[truncated.length - 1];
    if (node) {
      setPath(truncated);
      if (node.type === 'film') {
        await fetchFilmCredits(node.id);
      } else {
        await fetchPersonCredits(node.id);
      }
    }
  };

  const copyShare = () => {
    const elapsedSec = Math.max(1, Math.round(((endTime || 0) - (startTime || 0)) / 1000));
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const emojiPath = path.map(p => (p.type === 'film' ? '🎬' : '👤')).join(' > ');
    const text = `FILMTRACE (Custom: ${puzzleTitle})\n${timeStr} * ${clickCount} clicks\n${emojiPath}\n${window.location.href}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const q = searchQuery.toLowerCase().trim();
  const castList = filmCredits.filter(c => c.role === 'cast');
  const crewList = filmCredits.filter(c => c.role === 'crew' || c.job);

  const filteredCast = castList.filter(c =>
    !q || c.name.toLowerCase().includes(q) || (c.character && c.character.toLowerCase().includes(q)) || (c.job && c.job.toLowerCase().includes(q))
  );
  const filteredCrew = crewList.filter(c =>
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

  if (phase === 'loading') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-widest text-text-secondary">Loading Custom Puzzle...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 max-w-5xl mx-auto w-full pb-16 relative">
      {/* Compact Sticky Game Status HUD */}
      <div className="flex flex-col gap-2.5 bg-bg-card/95 p-3 sm:p-3.5 rounded-[4px] border border-border sticky top-14 z-30 shadow-xl backdrop-blur-md">
        <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
          {targetFilm && (
            <div className="flex items-start gap-3.5">
              <div
                className="w-20 h-28 sm:w-24 sm:h-34 relative rounded-[4px] overflow-hidden flex-shrink-0 bg-bg-secondary border-2 border-border shadow-lg"
              >
                {targetFilm.poster_path ? (
                  <Image src={posterUrl(targetFilm.poster_path, 'w342')} alt={targetFilm.title} fill sizes="96px" className="object-cover" />
                ) : <div className="w-full h-full flex items-center justify-center text-xs text-text-muted">🎬</div>}
              </div>
              <div className="flex flex-col text-left justify-start pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#00e054]">GOAL</span>
                  {creatorHandle && (
                    <span className="text-[10px] text-text-muted font-mono">by @{creatorHandle}</span>
                  )}
                </div>
                <span className="font-bold text-white text-sm sm:text-base leading-tight max-w-[170px] sm:max-w-[260px] truncate mt-0.5">{targetFilm.title}</span>
                {targetFilm.year && <span className="text-text-secondary text-[11px] font-mono mt-0.5">{targetFilm.year}</span>}
                <p className="text-[11px] text-text-secondary leading-snug mt-1 max-w-[180px] sm:max-w-[280px]">
                  Reach this movie through connected cast &amp; crew
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-8 sm:gap-14 pt-0.5">
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary leading-tight">CLICKS</span>
              <span className="font-mono text-2xl sm:text-3xl font-black text-white leading-tight mt-0.5">{clickCount}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary leading-tight">TIME</span>
              <div className="mt-0.5">
                <Timer startTime={startTime} endTime={endTime} />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border/70 overflow-x-auto hide-scrollbar">
          <Breadcrumb path={path} onRewind={onRewindTo} />
        </div>
      </div>

      {phase === 'playing' ? (
        <div className="flex flex-col gap-5">
          {/* VIEW: UNIFIED FILM CARD & CAST/CREW CONTAINER */}
          {currentView === 'film' && currentMedia && (
            <div className="bg-bg-card border border-border rounded-[6px] shadow-2xl overflow-hidden flex flex-col">
              {/* Film Header Banner (Hierarchy #2: Similar size to individual grid cards) */}
              <div className="p-3 sm:p-4 bg-gradient-to-b from-bg-secondary/40 to-bg-card border-b border-border flex items-start gap-3.5 text-left">
                <div className="relative w-14 h-20 sm:w-16 sm:h-24 rounded-[4px] overflow-hidden bg-bg-secondary border border-border flex-shrink-0 shadow">
                  {currentMedia.poster_path ? (
                    <Image src={posterUrl(currentMedia.poster_path, 'w185')} alt={currentMedia.title} fill sizes="64px" className="object-cover" />
                  ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
                </div>

                <div className="flex flex-col min-w-0 justify-start pt-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight truncate">{currentMedia.title}</h1>
                    {currentMedia.year && <span className="text-xs font-mono text-text-secondary font-medium">({currentMedia.year})</span>}
                  </div>
                </div>
              </div>

              {/* Integrated Cast & Crew Section */}
              <div className="p-4 sm:p-6 flex flex-col gap-5">
                {/* Filter Bar Stacked */}
                <div className="flex flex-col gap-3 border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-white">Choose next person</span>
                    <span className="text-xs text-text-muted font-mono">({filteredFilmCredits.length})</span>
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full">
                    <div className="relative flex items-center flex-1 sm:max-w-xs">
                      <input
                        type="text"
                        placeholder="Search person or role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-bg-primary border border-border text-white text-xs rounded pl-8 pr-7 py-1.5 focus:outline-none focus:border-text-secondary w-full transition-all placeholder:text-text-muted"
                      />
                      <span className="absolute left-2.5 text-text-muted text-xs">🔍</span>
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-2 text-text-muted hover:text-white text-xs cursor-pointer">✕</button>
                      )}
                    </div>
                    <div className="flex items-center gap-1 bg-bg-primary p-1 rounded border border-border">
                      <button onClick={() => setFilmTab('all')} className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer ${filmTab === 'all' ? 'bg-white text-[#0e1114]' : 'text-text-secondary hover:text-white'}`}>All ({filteredFilmCredits.length})</button>
                      <button onClick={() => setFilmTab('cast')} className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer ${filmTab === 'cast' ? 'bg-white text-[#0e1114]' : 'text-text-secondary hover:text-white'}`}>Cast ({filteredCast.length})</button>
                      <button onClick={() => setFilmTab('crew')} className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer ${filmTab === 'crew' ? 'bg-white text-[#0e1114]' : 'text-text-secondary hover:text-white'}`}>Crew ({filteredCrew.length})</button>
                    </div>
                  </div>
                </div>

                {/* Cast & Crew Grids */}
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
                              <span className="text-xs font-bold uppercase tracking-wider text-text-primary">Cast / Actors</span>
                              <span className="text-[11px] text-text-muted">({filteredCast.length})</span>
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 sm:gap-3">
                              {filteredCast.map(credit => (
                                <PersonCard key={`cast-${credit.id}`} tmdbId={credit.id} name={credit.name} profilePath={credit.profile_path} role={credit.character} job={credit.job} onClick={() => onSelectPerson(credit.id, credit.name)} size="sm" />
                              ))}
                            </div>
                          </div>
                        )}
                        {filteredCrew.length > 0 && (
                          <div className="flex flex-col gap-3 mt-2">
                            <div className="flex items-center gap-2 border-b border-border/60 pb-1.5">
                              <span className="text-xs font-bold uppercase tracking-wider text-text-primary">Crew</span>
                              <span className="text-[11px] text-text-muted">({filteredCrew.length})</span>
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 sm:gap-3">
                              {filteredCrew.map(credit => (
                                <PersonCard key={`crew-${credit.id}`} tmdbId={credit.id} name={credit.name} profilePath={credit.profile_path} job={credit.job} onClick={() => onSelectPerson(credit.id, credit.name)} size="sm" />
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {filmTab === 'cast' && (
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 sm:gap-3">
                        {filteredCast.map(credit => (
                          <PersonCard key={`cast-${credit.id}`} tmdbId={credit.id} name={credit.name} profilePath={credit.profile_path} role={credit.character} job={credit.job} onClick={() => onSelectPerson(credit.id, credit.name)} size="sm" />
                        ))}
                      </div>
                    )}
                    {filmTab === 'crew' && (
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 sm:gap-3">
                        {filteredCrew.map(credit => (
                          <PersonCard key={`crew-${credit.id}`} tmdbId={credit.id} name={credit.name} profilePath={credit.profile_path} job={credit.job} onClick={() => onSelectPerson(credit.id, credit.name)} size="sm" />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: UNIFIED PERSON CARD & FILMOGRAPHY CONTAINER */}
          {currentView === 'person' && currentPerson && (
            <div className="bg-bg-card border border-border rounded-[6px] shadow-2xl overflow-hidden flex flex-col">
              {/* Person Header Banner (Hierarchy #2: Similar size to individual grid cards) */}
              <div className="p-3 sm:p-4 bg-gradient-to-b from-bg-secondary/40 to-bg-card border-b border-border flex items-start gap-3.5 text-left">
                <div className="relative w-14 h-20 sm:w-16 sm:h-24 rounded-[4px] overflow-hidden bg-bg-secondary border border-border flex-shrink-0 shadow">
                  {currentPerson.profile_path ? (
                    <Image src={profileUrl(currentPerson.profile_path, 'w185')} alt={currentPerson.name} fill sizes="64px" className="object-cover" />
                  ) : <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>}
                </div>
                <div className="flex flex-col min-w-0 justify-start pt-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight truncate">{currentPerson.name}</h1>
                    {currentPerson.known_for && <span className="text-xs font-mono text-text-secondary font-medium">({currentPerson.known_for})</span>}
                  </div>
                </div>
              </div>

              {/* Tabs with Search Stacked */}
              <div className="p-4 sm:p-6 flex flex-col gap-5">
                <div className="flex flex-col gap-3 border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-white">Choose next title</span>
                    <span className="text-xs text-text-muted font-mono">({filteredPersonAll.length})</span>
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full">
                    <div className="relative flex items-center flex-1 sm:max-w-xs">
                      <input
                        type="text"
                        placeholder="Search title or character..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-bg-primary border border-border text-white text-xs rounded pl-8 pr-7 py-1.5 focus:outline-none focus:border-text-secondary w-full transition-all placeholder:text-text-muted"
                      />
                      <span className="absolute left-2.5 text-text-muted text-xs">🔍</span>
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-2 text-text-muted hover:text-white text-xs cursor-pointer">✕</button>
                      )}
                    </div>
                    <div className="flex items-center gap-1 bg-bg-primary p-1 rounded border border-border">
                      <button onClick={() => setPersonTab('all')} className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer ${personTab === 'all' ? 'bg-white text-[#0e1114]' : 'text-text-secondary hover:text-white'}`}>All ({filteredPersonAll.length})</button>
                      <button onClick={() => setPersonTab('movies')} className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer ${personTab === 'movies' ? 'bg-white text-[#0e1114]' : 'text-text-secondary hover:text-white'}`}>Movies ({filteredPersonMovies.length})</button>
                      {personTvShows.length > 0 && (
                        <button onClick={() => setPersonTab('tv')} className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer ${personTab === 'tv' ? 'bg-white text-[#0e1114]' : 'text-text-secondary hover:text-white'}`}>TV ({filteredPersonTv.length})</button>
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
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-2 sm:gap-3">
                    {(personTab === 'all' ? filteredPersonAll : personTab === 'movies' ? filteredPersonMovies : filteredPersonTv).map(film => (
                      <FilmCard key={`film-${film.id}`} tmdbId={film.id} title={film.title} year={film.release_date ? parseInt(film.release_date.split('-')[0]) : null} posterPath={film.poster_path} character={film.character} isTarget={film.id === targetFilm?.tmdb_id} onClick={() => onSelectFilm(film.id, film.title)} size="sm" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Won Screen */
        <div className="flex flex-col items-center gap-7 py-6 w-full animate-in fade-in duration-500">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">Challenge Completed</span>
            <div className="flex items-center gap-3.5 my-1">
              <div className="w-16 h-24 rounded overflow-hidden bg-bg-secondary border border-border relative">
                {startFilm?.poster_path && <Image src={posterUrl(startFilm.poster_path, 'w185')} alt={startFilm.title} fill className="object-cover" />}
              </div>
              <span className="text-2xl text-text-muted font-light">&rarr;</span>
              <div className="w-16 h-24 rounded overflow-hidden bg-bg-secondary border-2 border-accent relative">
                {targetFilm?.poster_path && <Image src={posterUrl(targetFilm.poster_path, 'w185')} alt={targetFilm.title} fill className="object-cover" />}
              </div>
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-text-secondary">{startFilm?.title} to {targetFilm?.title}</h2>
          </div>

          <div className="flex flex-col gap-2.5 bg-bg-card border border-border rounded p-6 w-full max-w-md shadow-2xl">
            <span className="text-[11px] font-bold uppercase tracking-widest text-text-secondary text-left">Your Result</span>
            <div className="flex items-center justify-around py-3">
              <div className="text-center">
                <span className="text-[11px] font-bold uppercase tracking-widest text-text-secondary block mb-1">Time</span>
                <span className="font-mono text-3xl sm:text-4xl font-extrabold text-white">
                  {Math.floor(Math.max(1, Math.round(((endTime || 0) - (startTime || 0)) / 1000)) / 60)}:
                  {String(Math.max(1, Math.round(((endTime || 0) - (startTime || 0)) / 1000)) % 60).padStart(2, '0')}
                </span>
              </div>
              <div className="w-px h-10 bg-border"></div>
              <div className="text-center">
                <span className="text-[11px] font-bold uppercase tracking-widest text-text-secondary block mb-1">Clicks</span>
                <span className="font-mono text-3xl sm:text-4xl font-extrabold text-accent">{clickCount}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mt-1">
            <button
              onClick={copyShare}
              className="w-full sm:flex-1 py-3 px-5 bg-white text-[#0e1114] hover:bg-white/90 text-xs font-bold uppercase tracking-wider rounded-[4px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
              <span>{copied ? 'Copied to Clipboard!' : 'Share'}</span>
            </button>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link href="/" className="flex-1 sm:flex-initial py-3 px-5 bg-transparent text-text-secondary text-xs font-semibold border border-border rounded hover:text-white transition-all text-center">
                &larr; Home
              </Link>
              <Link href="/create" className="flex-1 sm:flex-initial py-3 px-5 bg-[#1c242c] text-white text-xs font-semibold border border-border rounded hover:border-white transition-all text-center">
                + Create
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
