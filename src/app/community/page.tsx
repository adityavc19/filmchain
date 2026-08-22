'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Compass, Sparkles, Search, Clapperboard, User, ArrowRight } from 'lucide-react';
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
  const router = useRouter();
  const [puzzles, setPuzzles] = useState<CommunityPuzzle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPuzzle, setSelectedPuzzle] = useState<CommunityPuzzle | null>(null);

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

  function handleStartCommunityGame() {
    if (!selectedPuzzle) return;
    router.push(`/game/custom/${selectedPuzzle.id}`);
  }

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
          className="px-5 py-2.5 bg-[#00c030] hover:bg-[#00e054] text-white text-xs font-black uppercase tracking-wider rounded transition-all whitespace-nowrap shadow-md flex items-center gap-1.5 cursor-pointer active:scale-[0.99]"
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
            className="w-full bg-[#0e1114] border border-[#28323e] text-white text-xs pl-9 pr-8 py-2.5 rounded focus:outline-none focus:border-text-secondary placeholder:text-text-muted"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-text-muted hover:text-white text-xs cursor-pointer"
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
          <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-text-secondary uppercase tracking-widest">Loading games...</span>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((cp) => (
            <div
              key={cp.id}
              className="bg-[#1c242c] border border-[#28323e] p-4 rounded-[6px] flex flex-col items-center justify-between gap-3.5 shadow hover:border-text-secondary transition-colors text-center"
            >
              {/* Two Covers */}
              <div className="flex items-center justify-center gap-3 w-full py-1">
                <div className="w-14 h-20 sm:w-16 sm:h-24 relative rounded-[4px] overflow-hidden bg-[#222b35] border border-[#28323e] flex-shrink-0 shadow-md">
                  {cp.startFilm?.poster_path ? (
                    <Image src={posterUrl(cp.startFilm.poster_path, 'w185')} alt="" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>
                  )}
                </div>
                <span className="text-sm font-bold text-text-muted">➔</span>
                <div className="w-14 h-20 sm:w-16 sm:h-24 relative rounded-[4px] overflow-hidden bg-[#222b35] border border-[#28323e] flex-shrink-0 shadow-md">
                  {cp.endFilm?.poster_path ? (
                    <Image src={posterUrl(cp.endFilm.poster_path, 'w185')} alt="" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>
                  )}
                </div>
              </div>

              {/* Subtitle: Made by creator name */}
              <div className="flex items-center justify-center text-xs text-text-secondary font-mono">
                <span>
                  made by{' '}
                  {cp.creator_handle ? (
                    <Link
                      href={`/profile/${cp.creator_handle}`}
                      className="text-white hover:underline font-medium"
                    >
                      @{cp.creator_handle}
                    </Link>
                  ) : (
                    <span className="text-white font-medium">@cinephile</span>
                  )}
                </span>
              </div>

              <button
                onClick={() => setSelectedPuzzle(cp)}
                className="w-[70%] py-2 bg-[#00c030] hover:bg-[#00e054] text-white text-[11px] font-black uppercase tracking-wider rounded-[4px] text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.99]"
              >
                <Clapperboard className="w-3.5 h-3.5" />
                <span>Play Challenge</span>
              </button>
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
            className="mt-2 px-5 py-2 bg-white text-[#0e1114] text-xs font-bold uppercase tracking-wider rounded hover:bg-[#e6e6e6] transition-colors"
          >
            Create the First One
          </Link>
        </div>
      )}

      {/* COMMUNITY CHALLENGE PRE-GAME BRIEF MODAL */}
      {selectedPuzzle && (
        <div 
          onClick={() => setSelectedPuzzle(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1c242c] border border-[#28323e] p-6 sm:p-8 rounded-[4px] max-w-lg w-full flex flex-col gap-6 shadow-2xl text-left animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-[#28323e] pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#40bcf4]" />
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  {selectedPuzzle.title || 'Community Challenge'}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedPuzzle(null)}
                className="text-text-muted hover:text-white text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Creator Badge */}
            {selectedPuzzle.creator_handle && (
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <User className="w-3.5 h-3.5 text-text-secondary" />
                <span>Created by <strong className="text-white font-mono">@{selectedPuzzle.creator_handle}</strong></span>
              </div>
            )}

            {/* Revealed Movie Pair */}
            <div className="flex items-center justify-center gap-6 py-4 bg-[#0e1114] rounded-[4px] border border-[#28323e]">
              {/* Start Movie */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary bg-[#222b35] px-2 py-0.5 rounded border border-[#28323e]">
                  START
                </span>
                <div className="w-16 h-24 relative rounded overflow-hidden bg-[#222b35] border border-[#28323e]">
                  {selectedPuzzle.startFilm?.poster_path ? (
                    <Image src={posterUrl(selectedPuzzle.startFilm.poster_path, 'w185')} alt={selectedPuzzle.startFilm.title || ''} fill className="object-cover" />
                  ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
                </div>
                <span className="text-xs font-bold text-white max-w-[110px] truncate text-center">
                  {selectedPuzzle.startFilm?.title || 'Start Movie'}
                </span>
                {selectedPuzzle.startFilm?.year && (
                  <span className="text-[10px] text-text-secondary font-mono">{selectedPuzzle.startFilm.year}</span>
                )}
              </div>

              <div className="flex flex-col items-center gap-1 text-text-muted font-light">
                <span className="text-xl">⟷</span>
                <span className="text-[9px] font-mono uppercase font-bold text-text-muted">Connect</span>
              </div>

              {/* End Movie */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-[#222b35] px-2 py-0.5 rounded border border-[#28323e]">
                  END
                </span>
                <div className="w-16 h-24 relative rounded overflow-hidden bg-[#222b35] border border-[#28323e]">
                  {selectedPuzzle.endFilm?.poster_path ? (
                    <Image src={posterUrl(selectedPuzzle.endFilm.poster_path, 'w185')} alt={selectedPuzzle.endFilm.title || ''} fill className="object-cover" />
                  ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
                </div>
                <span className="text-xs font-bold text-white max-w-[110px] truncate text-center">
                  {selectedPuzzle.endFilm?.title || 'End Movie'}
                </span>
                {selectedPuzzle.endFilm?.year && (
                  <span className="text-[10px] text-text-secondary font-mono">{selectedPuzzle.endFilm.year}</span>
                )}
              </div>
            </div>

            {/* Mission Instructions */}
            <div className="flex flex-col gap-2 text-xs text-text-secondary bg-[#0e1114] p-3.5 rounded border border-[#28323e] leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="text-white font-bold">1.</span>
                <span>Connect <strong className="text-white">{selectedPuzzle.startFilm?.title}</strong> to <strong className="text-white">{selectedPuzzle.endFilm?.title}</strong>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#40bcf4] font-bold">2.</span>
                <span>Compete by doing it in the fastest time and with the fewest clicks.</span>
              </div>
              <div className="flex items-start gap-2 text-text-muted text-[11px] pt-1 border-t border-[#28323e]/50">
                <span className="text-text-muted font-bold">3.</span>
                <span>Timer begins when you click <strong>START GAME</strong>.</span>
              </div>
            </div>

            {/* Launch Action (Letterboxd Green Style) */}
            <button
              onClick={handleStartCommunityGame}
              className="w-full py-3.5 bg-[#00c030] hover:bg-[#00e054] text-white font-black text-sm uppercase tracking-wider rounded-[4px] transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <span>START GAME</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
