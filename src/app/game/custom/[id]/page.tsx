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
  const [personTab, setPersonTab] = useState<'all' | 'movies' | 'tv'>('all');
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
      setPersonTab('all');
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
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-16 relative">
      {/* Sticky HUD */}
      <div className="flex flex-col gap-3.5 bg-bg-card p-4 sm:p-5 rounded-[4px] border border-border sticky top-16 z-30 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
          {targetFilm && (
            <div className="flex items-center gap-4">
              <div
                className="relative rounded-[4px] overflow-hidden flex-shrink-0 bg-bg-secondary border border-border shadow-md"
                style={{ width: '84px', height: '126px' }}
              >
                {targetFilm.poster_path ? (
                  <Image src={posterUrl(targetFilm.poster_path, 'w185')} alt={targetFilm.title} fill sizes="84px" className="object-cover" />
                ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
              </div>
              <div className="flex flex-col text-left gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary block">GOAL</span>
                  {creatorHandle && (
                    <span className="text-[10px] text-accent font-mono">by @{creatorHandle}</span>
                  )}
                </div>
                <span className="font-bold text-white text-base sm:text-lg leading-tight max-w-[200px] truncate">{targetFilm.title}</span>
                {targetFilm.year && <span className="text-text-secondary text-xs">{targetFilm.year}</span>}
              </div>
            </div>
          )}

          <div className="flex items-center gap-14 sm:gap-20">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary block">CLICKS</span>
              <span className="font-mono text-2xl sm:text-3xl font-black text-white leading-tight">{clickCount}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary block">TIME</span>
              <Timer startTime={startTime} endTime={endTime} />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border/70">
          <Breadcrumb path={path} onRewind={onRewindTo} />
        </div>
      </div>

      {phase === 'playing' ? (
        <div className="flex flex-col gap-6">
          {/* Film View */}
          {currentView === 'film' && currentMedia && (
            <>
              <div className="bg-bg-card border border-border rounded-[4px] p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-6 text-left shadow-lg">
                <div className="relative w-20 h-[116px] sm:w-[84px] sm:h-[126px] rounded-[4px] overflow-hidden bg-bg-secondary border border-white/10 flex-shrink-0 self-center sm:self-start">
                  {currentMedia.poster_path ? (
                    <Image src={posterUrl(currentMedia.poster_path, 'w342')} alt={currentMedia.title} fill sizes="84px" className="object-cover" />
                  ) : <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>}
                </div>

                <div className="flex flex-col gap-1.5 min-w-0 justify-center">
                  <div className="flex items-center gap-2 flex-wrap">
                    {currentMedia.year && <span className="text-xs font-semibold text-text-secondary">{currentMedia.year}</span>}
                    {currentMedia.runtime && <span className="text-xs text-text-muted">· {currentMedia.runtime} min</span>}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">{currentMedia.title}</h1>
                  {currentMedia.tagline && <p className="text-xs sm:text-sm italic text-text-secondary">&ldquo;{currentMedia.tagline}&rdquo;</p>}
                  {currentMedia.genres && currentMedia.genres.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap my-0.5">
                      {currentMedia.genres.map(g => (
                        <span key={g.id} className="text-[10px] uppercase font-medium bg-bg-secondary text-text-secondary px-2 py-0.5 rounded border border-border">{g.name}</span>
                      ))}
                    </div>
                  )}
                  {currentMedia.overview && (
                    <p className="text-xs sm:text-sm text-text-primary/90 leading-relaxed line-clamp-3 sm:line-clamp-4 mt-1">{currentMedia.overview}</p>
                  )}
                </div>
              </div>

              {/* Tabs with Search */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-3 px-1">
                <span className="text-base sm:text-lg font-extrabold text-white tracking-tight">Choose next person</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="Search person or role..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-bg-secondary border border-border text-white text-xs rounded-[4px] pl-8 pr-7 py-1.5 focus:outline-none focus:border-accent w-48 sm:w-56 transition-all placeholder:text-text-muted"
                    />
                    <span className="absolute left-2.5 text-text-muted text-xs">🔍</span>
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-2 text-text-muted hover:text-white text-xs cursor-pointer">✕</button>
                    )}
                  </div>
                  <div className="flex items-center gap-1 bg-bg-secondary p-1 rounded-[4px] border border-border">
                    <button onClick={() => setFilmTab('all')} className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${filmTab === 'all' ? 'bg-accent text-bg-primary font-bold' : 'text-text-secondary hover:text-text-primary'}`}>All ({filteredFilmCredits.length})</button>
                    <button onClick={() => setFilmTab('cast')} className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${filmTab === 'cast' ? 'bg-accent text-bg-primary font-bold' : 'text-text-secondary hover:text-text-primary'}`}>Cast ({filteredCast.length})</button>
                    <button onClick={() => setFilmTab('crew')} className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${filmTab === 'crew' ? 'bg-accent text-bg-primary font-bold' : 'text-text-secondary hover:text-text-primary'}`}>Crew ({filteredCrew.length})</button>
                  </div>
                </div>
              </div>

              {/* Cast & Crew Grids */}
              {loadingStep ? (
                <div className="flex items-center justify-center py-16 gap-3">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-text-secondary uppercase tracking-widest">Loading...</span>
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
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
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
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                            {filteredCrew.map(credit => (
                              <PersonCard key={`crew-${credit.id}`} tmdbId={credit.id} name={credit.name} profilePath={credit.profile_path} job={credit.job} onClick={() => onSelectPerson(credit.id, credit.name)} size="sm" />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {filmTab === 'cast' && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                      {filteredCast.map(credit => (
                        <PersonCard key={`cast-${credit.id}`} tmdbId={credit.id} name={credit.name} profilePath={credit.profile_path} role={credit.character} job={credit.job} onClick={() => onSelectPerson(credit.id, credit.name)} size="sm" />
                      ))}
                    </div>
                  )}
                  {filmTab === 'crew' && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                      {filteredCrew.map(credit => (
                        <PersonCard key={`crew-${credit.id}`} tmdbId={credit.id} name={credit.name} profilePath={credit.profile_path} job={credit.job} onClick={() => onSelectPerson(credit.id, credit.name)} size="sm" />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Person View */}
          {currentView === 'person' && currentPerson && (
            <>
              <div className="bg-bg-card border border-border rounded-[4px] p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-6 text-left shadow-lg">
                <div className="relative w-20 h-[116px] sm:w-[84px] sm:h-[126px] rounded-[4px] overflow-hidden bg-bg-secondary border border-white/10 flex-shrink-0 self-center sm:self-start">
                  {currentPerson.profile_path ? (
                    <Image src={profileUrl(currentPerson.profile_path, 'w185')} alt={currentPerson.name} fill sizes="84px" className="object-cover" />
                  ) : <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>}
                </div>
                <div className="flex flex-col gap-1.5 min-w-0 justify-center">
                  <div className="flex items-center gap-2 flex-wrap text-xs text-text-secondary">
                    {currentPerson.known_for && <span>{currentPerson.known_for}</span>}
                    {currentPerson.place_of_birth && <span>· {currentPerson.place_of_birth}</span>}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">{currentPerson.name}</h1>
                  {currentPerson.biography && (
                    <p className="text-xs sm:text-sm text-text-primary/90 leading-relaxed line-clamp-3 sm:line-clamp-4 mt-1">{currentPerson.biography}</p>
                  )}
                </div>
              </div>

              {/* Tabs with Search */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-3 px-1">
                <span className="text-base sm:text-lg font-extrabold text-white tracking-tight">Choose next title</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="Search title or character..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-bg-secondary border border-border text-white text-xs rounded-[4px] pl-8 pr-7 py-1.5 focus:outline-none focus:border-accent w-48 sm:w-56 transition-all placeholder:text-text-muted"
                    />
                    <span className="absolute left-2.5 text-text-muted text-xs">🔍</span>
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-2 text-text-muted hover:text-white text-xs cursor-pointer">✕</button>
                    )}
                  </div>
                  <div className="flex items-center gap-1 bg-bg-secondary p-1 rounded-[4px] border border-border">
                    <button onClick={() => setPersonTab('all')} className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${personTab === 'all' ? 'bg-accent text-bg-primary font-bold' : 'text-text-secondary hover:text-text-primary'}`}>All ({filteredPersonAll.length})</button>
                    <button onClick={() => setPersonTab('movies')} className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${personTab === 'movies' ? 'bg-accent text-bg-primary font-bold' : 'text-text-secondary hover:text-text-primary'}`}>Movies ({filteredPersonMovies.length})</button>
                    {personTvShows.length > 0 && (
                      <button onClick={() => setPersonTab('tv')} className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-[3px] transition-colors cursor-pointer ${personTab === 'tv' ? 'bg-accent text-bg-primary font-bold' : 'text-text-secondary hover:text-text-primary'}`}>TV ({filteredPersonTv.length})</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Filmography Grid */}
              {loadingStep ? (
                <div className="flex items-center justify-center py-16 gap-3">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-text-secondary uppercase tracking-widest">Loading...</span>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                  {(personTab === 'all' ? filteredPersonAll : personTab === 'movies' ? filteredPersonMovies : filteredPersonTv).map(film => (
                    <FilmCard key={`film-${film.id}`} tmdbId={film.id} title={film.title} year={film.release_date ? parseInt(film.release_date.split('-')[0]) : null} posterPath={film.poster_path} character={film.character} isTarget={film.id === targetFilm?.tmdb_id} onClick={() => onSelectFilm(film.id, film.title)} size="sm" />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* Won Screen */
        <div className="flex flex-col items-center gap-7 py-6 w-full animate-in fade-in duration-500">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-accent">Custom Chain Complete</span>
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

          {/* Share Box */}
          <div className="flex flex-col gap-2 w-full max-w-md text-left">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Share Result</span>
            <pre className="bg-bg-secondary border border-border rounded p-3 text-xs text-text-secondary font-mono whitespace-pre-wrap">
              {`FILMTRACE (Custom: ${puzzleTitle})\n${Math.floor(Math.max(1, Math.round(((endTime || 0) - (startTime || 0)) / 1000)) / 60)}:${String(Math.max(1, Math.round(((endTime || 0) - (startTime || 0)) / 1000)) % 60).padStart(2, '0')} * ${clickCount} clicks\n${path.map(p => (p.type === 'film' ? '🎬' : '👤')).join(' > ')}\n${typeof window !== 'undefined' ? window.location.href : ''}`}
            </pre>
            <button
              onClick={copyShare}
              className="w-full py-2 bg-transparent text-accent text-xs font-bold uppercase tracking-wider border border-accent rounded hover:bg-accent/10 transition-colors cursor-pointer"
            >
              {copied ? '✓ Copied Result!' : 'Copy Result'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="px-6 py-2.5 bg-transparent text-text-secondary text-xs font-semibold border border-border rounded hover:text-white transition-all">
              &larr; Daily Puzzle
            </Link>
            <Link href="/create" className="px-6 py-2.5 bg-accent text-bg-primary text-xs font-bold uppercase tracking-wider rounded hover:bg-accent-dim transition-all">
              + Create Puzzle
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
