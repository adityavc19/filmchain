'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Compass, Sparkles, Search, Clapperboard, ArrowRight } from 'lucide-react';
import { posterUrl } from '@/lib/tmdb';

interface FilmInfo {
  tmdb_id: number;
  title: string;
  year: number | null;
  poster_path: string | null;
}

interface CommunityPuzzle {
  id: string;
  creator_handle: string | null;
  title: string | null;
  play_count: number;
  created_at: string;
  start_film_id?: number;
  end_film_id?: number;
  startFilm?: FilmInfo | null;
  endFilm?: FilmInfo | null;
}

export default function CommunityPage() {
  const [puzzles, setPuzzles] = useState<CommunityPuzzle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/puzzle/community')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.puzzles) {
          setPuzzles(data.puzzles);
        }
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  const filtered = puzzles.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const titleMatch = p.title ? p.title.toLowerCase().includes(q) : false;
    const creatorMatch = p.creator_handle ? p.creator_handle.toLowerCase().includes(q) : false;
    const startMatch = p.startFilm?.title ? p.startFilm.title.toLowerCase().includes(q) : false;
    const endMatch = p.endFilm?.title ? p.endFilm.title.toLowerCase().includes(q) : false;
    return titleMatch || creatorMatch || startMatch || endMatch;
  });

  return (
    <main className="flex flex-col gap-8 max-w-5xl mx-auto w-full py-4 text-left">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#28323e] pb-6">
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1c242c] border border-[#28323e] text-[#40bcf4] text-xs font-semibold tracking-wide uppercase w-fit">
            <Compass className="w-3.5 h-3.5" />
            <span>Community Directory</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Community Games
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary max-w-md">
            Explore and play connection trails created by cinephiles around the world.
          </p>
        </div>

        <Link
          href="/create"
          className="px-5 py-2.5 bg-accent hover:bg-accent-dim text-[#0e1114] text-xs font-bold uppercase tracking-wider rounded transition-colors whitespace-nowrap shadow-[0_0_16px_rgba(0,224,84,0.25)] flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>+ Create Game</span>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-[#1c242c] p-3.5 rounded-[4px] border border-[#28323e]">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-text-muted" />
          <input
            type="text"
            placeholder="Search by movie title or creator (@username)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0e1114] border border-[#28323e] text-white text-xs pl-9 pr-8 py-2.5 rounded focus:outline-none focus:border-accent placeholder:text-text-muted"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-text-muted hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="text-xs text-text-muted font-mono">
          Showing {filtered.length} {filtered.length === 1 ? 'game' : 'games'}
        </div>
      </div>

      {/* Games Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-text-secondary uppercase tracking-widest">Loading games...</span>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((cp) => (
            <div
              key={cp.id}
              className="bg-[#1c242c] border border-[#28323e] p-4 rounded-[4px] flex flex-col justify-between gap-4 shadow hover:border-text-secondary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-18 relative rounded overflow-hidden bg-[#222b35] border border-[#28323e] flex-shrink-0">
                  {cp.startFilm?.poster_path ? (
                    <Image src={posterUrl(cp.startFilm.poster_path, 'w185')} alt="" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>
                  )}
                </div>
                <span className="text-xs font-light text-text-muted">➔</span>
                <div className="w-12 h-18 relative rounded overflow-hidden bg-[#222b35] border border-[#28323e] flex-shrink-0">
                  {cp.endFilm?.poster_path ? (
                    <Image src={posterUrl(cp.endFilm.poster_path, 'w185')} alt="" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-xs text-white truncate">
                    {cp.title || `${cp.startFilm?.title} → ${cp.endFilm?.title}`}
                  </span>
                  {cp.creator_handle && (
                    <Link
                      href={`/profile/${cp.creator_handle}`}
                      className="text-[11px] text-text-secondary hover:text-accent font-mono truncate"
                    >
                      by @{cp.creator_handle}
                    </Link>
                  )}
                  {cp.created_at && (
                    <span className="text-[10px] text-text-muted font-mono mt-0.5">
                      {new Date(cp.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <Link
                href={`/game/custom/${cp.id}`}
                className="w-full py-2 bg-[#222b35] hover:bg-accent hover:text-[#0e1114] text-text-primary text-[11px] font-bold uppercase tracking-wider rounded text-center border border-[#28323e] transition-colors flex items-center justify-center gap-1.5"
              >
                <Clapperboard className="w-3.5 h-3.5" />
                <span>Play Challenge</span>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#1c242c] border border-[#28323e] p-12 rounded-[4px] text-center flex flex-col items-center gap-3">
          <span className="text-3xl">🎬</span>
          <h3 className="text-base font-bold text-white">No games found</h3>
          <p className="text-xs text-text-secondary max-w-sm">
            {searchQuery ? `No games matched "${searchQuery}". Try a different title or handle.` : 'No community games created yet.'}
          </p>
          <Link
            href="/create"
            className="mt-2 px-5 py-2 bg-accent text-[#0e1114] text-xs font-bold uppercase tracking-wider rounded hover:bg-accent-dim transition-colors"
          >
            Create the First One
          </Link>
        </div>
      )}

    </main>
  );
}
