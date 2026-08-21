'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { posterUrl } from '@/lib/tmdb';
import { getOrCreateHandle } from '@/lib/handle';

interface MovieResult {
  id: number;
  title: string;
  year: number | null;
  poster_path: string | null;
  vote_count?: number;
}

export default function CreatePuzzlePage() {
  const router = useRouter();
  const [handle, setHandle] = useState('');

  // Start & Target film selections
  const [startMovie, setStartMovie] = useState<MovieResult | null>(null);
  const [targetMovie, setTargetMovie] = useState<MovieResult | null>(null);
  const [customTitle, setCustomTitle] = useState('');

  // Search states for Start Film
  const [startQuery, setStartQuery] = useState('');
  const [startResults, setStartResults] = useState<MovieResult[]>([]);
  const [isSearchingStart, setIsSearchingStart] = useState(false);
  const [showStartDropdown, setShowStartDropdown] = useState(false);

  // Search states for Target Film
  const [targetQuery, setTargetQuery] = useState('');
  const [targetResults, setTargetResults] = useState<MovieResult[]>([]);
  const [isSearchingTarget, setIsSearchingTarget] = useState(false);
  const [showTargetDropdown, setShowTargetDropdown] = useState(false);

  // Creation status
  const [isCreating, setIsCreating] = useState(false);
  const [createdPuzzle, setCreatedPuzzle] = useState<{ id: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const startRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHandle(getOrCreateHandle());
  }, []);

  // Debounced search for Start Film
  useEffect(() => {
    if (!startQuery.trim() || startQuery.length < 2) {
      setStartResults([]);
      setShowStartDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingStart(true);
      try {
        const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(startQuery)}`);
        const data = await res.json();
        setStartResults(data.results || []);
        setShowStartDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingStart(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [startQuery]);

  // Debounced search for Target Film
  useEffect(() => {
    if (!targetQuery.trim() || targetQuery.length < 2) {
      setTargetResults([]);
      setShowTargetDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingTarget(true);
      try {
        const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(targetQuery)}`);
        const data = await res.json();
        setTargetResults(data.results || []);
        setShowTargetDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingTarget(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [targetQuery]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (startRef.current && !startRef.current.contains(e.target as Node)) {
        setShowStartDropdown(false);
      }
      if (targetRef.current && !targetRef.current.contains(e.target as Node)) {
        setShowTargetDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleCreatePuzzle() {
    setErrorMsg('');
    if (!startMovie || !targetMovie) {
      setErrorMsg('Please select both a Start Movie and a Target Movie.');
      return;
    }
    if (startMovie.id === targetMovie.id) {
      setErrorMsg('Start Movie and Target Movie cannot be the same!');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/puzzle/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startFilmId: startMovie.id,
          endFilmId: targetMovie.id,
          creatorHandle: handle,
          title: customTitle.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Failed to create custom puzzle');
      } else {
        const fullUrl = `${window.location.origin}/game/custom/${data.id}`;
        setCreatedPuzzle({
          id: data.id,
          url: fullUrl,
        });
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error creating puzzle.');
    } finally {
      setIsCreating(false);
    }
  }

  function copyLink() {
    if (!createdPuzzle) return;
    navigator.clipboard.writeText(createdPuzzle.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col items-center gap-8 max-w-3xl mx-auto w-full py-4 text-center">
      {/* Title */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-widest text-accent bg-accent/10 px-3 py-1 rounded border border-accent/20">
          Studio
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Create a Puzzle
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary max-w-md">
          Pick any two movies to forge your own connection trail and challenge the community.
        </p>
      </div>

      {createdPuzzle ? (
        /* Success Screen */
        <div className="flex flex-col items-center gap-6 bg-bg-card border-2 border-accent p-6 sm:p-8 rounded-[4px] w-full shadow-2xl animate-in zoom-in-95 duration-200 text-left">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <h2 className="text-lg font-black text-white">Puzzle Created Successfully!</h2>
              <p className="text-xs text-text-secondary">Your challenge is live and added to your profile.</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 w-full py-4 bg-bg-secondary/70 rounded border border-border">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">Start</span>
              <div className="w-16 h-24 relative rounded overflow-hidden bg-bg-card border border-border">
                {startMovie?.poster_path ? (
                  <Image src={posterUrl(startMovie.poster_path, 'w185')} alt={startMovie.title} fill className="object-cover" />
                ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
              </div>
              <span className="text-xs font-bold text-white max-w-[100px] truncate">{startMovie?.title}</span>
            </div>

            <span className="text-xl text-text-muted font-light">⟷</span>

            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">End</span>
              <div className="w-16 h-24 relative rounded overflow-hidden bg-bg-card border border-border">
                {targetMovie?.poster_path ? (
                  <Image src={posterUrl(targetMovie.poster_path, 'w185')} alt={targetMovie.title} fill className="object-cover" />
                ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
              </div>
              <span className="text-xs font-bold text-white max-w-[100px] truncate">{targetMovie?.title}</span>
            </div>
          </div>

          {/* Share Link Box */}
          <div className="flex flex-col gap-2 w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Shareable Link</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={createdPuzzle.url}
                className="flex-1 bg-bg-secondary border border-border text-white text-xs px-3 py-2.5 rounded font-mono select-all focus:outline-none"
              />
              <button
                onClick={copyLink}
                className="px-4 py-2.5 bg-white text-bg-primary text-xs font-bold uppercase tracking-wider rounded hover:bg-[#e6e6e6] transition-colors cursor-pointer whitespace-nowrap shadow-sm"
              >
                {copied ? '✓ Copied' : 'Copy Link'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full pt-2">
            <button
              onClick={() => router.push(`/game/custom/${createdPuzzle.id}`)}
              className="flex-1 py-3 bg-white text-bg-primary text-xs font-bold uppercase tracking-wider rounded hover:bg-white/90 transition-colors text-center cursor-pointer"
            >
              Play Puzzle Now &rarr;
            </button>
            <button
              onClick={() => {
                setCreatedPuzzle(null);
                setStartMovie(null);
                setTargetMovie(null);
                setCustomTitle('');
              }}
              className="px-4 py-3 bg-transparent text-text-secondary hover:text-white border border-border rounded text-xs font-semibold transition-colors cursor-pointer"
            >
              Create Another
            </button>
          </div>
        </div>
      ) : (
        /* Create Form */
        <div className="flex flex-col gap-6 bg-bg-card border border-border p-6 sm:p-8 rounded-[4px] w-full shadow-2xl text-left">
          {/* Creator Attribution */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-xs text-text-secondary">
              Creator Handle: <strong className="text-white font-mono">@{handle}</strong>
            </span>
            <Link href={`/profile/${handle}`} className="text-xs text-text-secondary hover:text-white font-medium">
              My Profile &rarr;
            </Link>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded font-medium">
              {errorMsg}
            </div>
          )}

          {/* 2-Movie Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {/* 1. START MOVIE */}
            <div ref={startRef} className="flex flex-col gap-3 relative">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center justify-between">
                <span>1. Start Movie</span>
                {startMovie && (
                  <button
                    onClick={() => { setStartMovie(null); setStartQuery(''); }}
                    className="text-[11px] text-text-secondary hover:text-white cursor-pointer font-normal"
                  >
                    Change
                  </button>
                )}
              </label>

              {startMovie ? (
                /* Selected Start Movie Card */
                <div className="flex items-center gap-3.5 bg-bg-secondary p-3.5 rounded border border-border">
                  <div className="w-14 h-20 relative rounded overflow-hidden bg-bg-card border border-border flex-shrink-0">
                    {startMovie.poster_path ? (
                      <Image src={posterUrl(startMovie.poster_path, 'w185')} alt={startMovie.title} fill className="object-cover" />
                    ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-white truncate">{startMovie.title}</span>
                    {startMovie.year && <span className="text-xs text-text-secondary">{startMovie.year}</span>}
                    <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider mt-1">✓ Selected as Start</span>
                  </div>
                </div>
              ) : (
                /* Search Box */
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search movie title (e.g. Inception)..."
                    value={startQuery}
                    onChange={(e) => setStartQuery(e.target.value)}
                    className="w-full bg-bg-secondary border border-border text-white text-xs px-3.5 py-2.5 rounded focus:outline-none focus:border-text-secondary placeholder:text-text-muted"
                  />
                  {isSearchingStart && (
                    <span className="absolute right-3 top-2.5 text-xs text-text-muted animate-pulse">Searching...</span>
                  )}

                  {/* Dropdown Results */}
                  {showStartDropdown && startResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-bg-secondary border border-border rounded shadow-2xl z-40 max-h-64 overflow-y-auto">
                      {startResults.map((m) => (
                        <div
                          key={`start-search-${m.id}`}
                          onClick={() => {
                            setStartMovie(m);
                            setShowStartDropdown(false);
                          }}
                          className="flex items-center gap-3 p-2.5 hover:bg-bg-hover cursor-pointer border-b border-border/40 last:border-0 transition-colors"
                        >
                          <div className="w-9 h-12 relative rounded overflow-hidden bg-bg-card flex-shrink-0">
                            {m.poster_path ? (
                              <Image src={posterUrl(m.poster_path, 'w92')} alt={m.title} fill className="object-cover" />
                            ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-xs text-white truncate">{m.title}</span>
                            <span className="text-[11px] text-text-secondary">{m.year || 'N/A'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. TARGET MOVIE */}
            <div ref={targetRef} className="flex flex-col gap-3 relative">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center justify-between">
                <span>2. Target Movie (Goal)</span>
                {targetMovie && (
                  <button
                    onClick={() => { setTargetMovie(null); setTargetQuery(''); }}
                    className="text-[11px] text-text-secondary hover:text-white cursor-pointer font-normal"
                  >
                    Change
                  </button>
                )}
              </label>

              {targetMovie ? (
                /* Selected Target Movie Card */
                <div className="flex items-center gap-3.5 bg-bg-secondary p-3.5 rounded border border-border">
                  <div className="w-14 h-20 relative rounded overflow-hidden bg-bg-card border border-border flex-shrink-0">
                    {targetMovie.poster_path ? (
                      <Image src={posterUrl(targetMovie.poster_path, 'w185')} alt={targetMovie.title} fill className="object-cover" />
                    ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-white truncate">{targetMovie.title}</span>
                    {targetMovie.year && <span className="text-xs text-text-secondary">{targetMovie.year}</span>}
                    <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider mt-1">🎯 Goal Target</span>
                  </div>
                </div>
              ) : (
                /* Search Box */
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search target movie (e.g. Oppenheimer)..."
                    value={targetQuery}
                    onChange={(e) => setTargetQuery(e.target.value)}
                    className="w-full bg-bg-secondary border border-border text-white text-xs px-3.5 py-2.5 rounded focus:outline-none focus:border-text-secondary placeholder:text-text-muted"
                  />
                  {isSearchingTarget && (
                    <span className="absolute right-3 top-2.5 text-xs text-text-muted animate-pulse">Searching...</span>
                  )}

                  {/* Dropdown Results */}
                  {showTargetDropdown && targetResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-bg-secondary border border-border rounded shadow-2xl z-40 max-h-64 overflow-y-auto">
                      {targetResults.map((m) => (
                        <div
                          key={`target-search-${m.id}`}
                          onClick={() => {
                            setTargetMovie(m);
                            setShowTargetDropdown(false);
                          }}
                          className="flex items-center gap-3 p-2.5 hover:bg-bg-hover cursor-pointer border-b border-border/40 last:border-0 transition-colors"
                        >
                          <div className="w-9 h-12 relative rounded overflow-hidden bg-bg-card flex-shrink-0">
                            {m.poster_path ? (
                              <Image src={posterUrl(m.poster_path, 'w92')} alt={m.title} fill className="object-cover" />
                            ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-xs text-white truncate">{m.title}</span>
                            <span className="text-[11px] text-text-secondary">{m.year || 'N/A'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Optional Title */}
          <div className="flex flex-col gap-1.5 pt-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Puzzle Title (Optional)
            </label>
            <input
              type="text"
              placeholder={startMovie && targetMovie ? `${startMovie.title} → ${targetMovie.title}` : 'e.g. Nolan Cinematic Trail'}
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="bg-bg-secondary border border-border text-white text-xs px-3.5 py-2.5 rounded focus:outline-none focus:border-text-secondary placeholder:text-text-muted"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleCreatePuzzle}
            disabled={!startMovie || !targetMovie || isCreating}
            className={`w-full py-3.5 rounded-[4px] font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
              startMovie && targetMovie && !isCreating
                ? 'bg-white text-bg-primary hover:bg-[#e6e6e6] shadow-md'
                : 'bg-bg-secondary text-text-muted border border-border cursor-not-allowed'
            }`}
          >
            {isCreating ? 'Publishing Puzzle...' : 'Create & Share Puzzle 🚀'}
          </button>
        </div>
      )}
    </div>
  );
}
