'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Film, 
  Clapperboard, 
  Sparkles, 
  ArrowRight, 
  Compass, 
  Users, 
  Clock 
} from 'lucide-react';
import { posterUrl } from '@/lib/tmdb';

interface FilmInfo {
  tmdb_id: number;
  title: string;
  year: number | null;
  poster_path: string | null;
}

interface TodayPuzzle {
  date: string;
  startFilm: FilmInfo;
  endFilm: FilmInfo;
  minHops: number;
  playerCount: number;
}

interface CommunityPuzzle {
  id: string;
  creator_handle: string | null;
  title: string | null;
  play_count: number;
  created_at: string;
  startFilm?: FilmInfo | null;
  endFilm?: FilmInfo | null;
}

export default function Home() {
  const router = useRouter();
  const [puzzle, setPuzzle] = useState<TodayPuzzle | null>(null);
  const [communityPuzzles, setCommunityPuzzles] = useState<CommunityPuzzle[]>([]);
  const [loading, setLoading] = useState(true);

  // Pre-game brief modal state
  const [showBrief, setShowBrief] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/puzzle/today').then(r => r.json()).catch(() => null),
      fetch('/api/puzzle/community').then(r => r.json()).catch(() => ({ puzzles: [] })),
    ]).then(([todayData, commData]) => {
      if (todayData && !todayData.error) {
        setPuzzle(todayData);
      }
      if (commData && commData.puzzles) {
        setCommunityPuzzles(commData.puzzles);
      }
      setLoading(false);
    });
  }, []);

  function handleStartGame() {
    if (!puzzle) return;
    router.push(`/game/${puzzle.date}`);
  }

  return (
    <main className="flex flex-col items-center gap-12 py-4 max-w-5xl mx-auto w-full text-left">
      
      {/* 1. HERO SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center pt-2 pb-6 w-full border-b border-[#28323e]">
        
        {/* Left Column: Title & Action */}
        <div className="lg:col-span-6 flex flex-col gap-4 items-start">
          
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1c242c] border border-[#28323e] text-[#9ab0c2] text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>A Game for Cinephiles</span>
          </div>

          {/* Clean 2-Line Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08]">
            Two films. <br />
            <span className="text-accent">How do you connect them?</span>
          </h1>

          {/* Clean Concise Subtitle */}
          <p className="text-sm sm:text-base text-text-secondary font-normal leading-relaxed max-w-md">
            Trace the shortest path through shared actors, directors, and writers.
          </p>

          {/* Primary Action Button */}
          <div className="pt-2 w-full sm:w-auto">
            <button
              onClick={() => setShowBrief(true)}
              className="flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-[4px] bg-white hover:bg-[#e6e6e6] text-[#0e1114] font-black text-sm uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              <Clapperboard className="w-4 h-4" />
              <span>Play Today&apos;s Puzzle</span>
            </button>
          </div>

          {/* Daily Teaser Strip with Dynamic Count */}
          {puzzle && (
            <div className="flex items-center gap-3 pt-1 text-xs text-text-muted">
              <span className="flex items-center gap-1.5 text-text-secondary font-mono">
                <Clock className="w-3.5 h-3.5 text-accent" />
                Daily Challenge #{puzzle.date}
              </span>
              <span>&middot;</span>
              <span className="flex items-center gap-1.5 text-text-secondary">
                <Users className="w-3.5 h-3.5 text-[#40bcf4]" />
                {52 + (puzzle.playerCount || 0)} games played today
              </span>
            </div>
          )}
        </div>

        {/* Right Column: Clean Minimalist Icon-Based "How It Works" Visual */}
        <div className="lg:col-span-6 flex items-center justify-center">
          <div className="w-full bg-[#1c242c] border border-[#28323e] rounded-[6px] p-5 shadow-xl">
            <div className="flex flex-col gap-4">
              
              {/* Widget Header */}
              <div className="flex items-center justify-between text-[11px] font-mono uppercase text-text-muted border-b border-[#28323e] pb-2">
                <span>HOW IT WORKS</span>
                <Clock className="w-3.5 h-3.5 text-text-secondary" />
              </div>

              {/* Clean Icon Flow (Film -> Actor -> Film -> ... -> End) */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 py-3">
                {/* 1. Start Film */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-14 rounded bg-[#222b35] border border-[#28323e] flex items-center justify-center text-white shadow-sm">
                    <Film className="w-5 h-5 text-text-secondary" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Film</span>
                </div>

                <span className="text-text-muted text-xs">&rarr;</span>

                {/* 2. Actor / Crew */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-14 rounded bg-[#222b35] border border-[#28323e] flex items-center justify-center text-white shadow-sm">
                    <Users className="w-5 h-5 text-text-secondary" />
                  </div>
                  <span className="text-[10px] font-medium text-text-secondary">Cast / Crew</span>
                </div>

                <span className="text-text-muted text-xs">&rarr;</span>

                {/* 3. Next Film */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-14 rounded bg-[#222b35] border border-[#28323e] flex items-center justify-center text-white shadow-sm">
                    <Film className="w-5 h-5 text-text-secondary" />
                  </div>
                  <span className="text-[10px] font-medium text-text-secondary">Film</span>
                </div>

                <span className="text-text-muted text-sm font-mono tracking-widest px-1">&middot;&middot;&middot;</span>

                {/* 4. End Film */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-14 rounded bg-[#222b35] border border-accent/50 flex items-center justify-center text-accent shadow-sm">
                    <Film className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent">End</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 2. COMMUNITY CHALLENGES */}
      {communityPuzzles.length > 0 && (
        <section className="flex flex-col gap-4 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#40bcf4]" />
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white">
                Community Challenges
              </h2>
            </div>
            <Link href="/create" className="text-xs text-accent hover:underline font-semibold flex items-center gap-1">
              <span>+ Create Game</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {communityPuzzles.map((cp) => (
              <div key={cp.id} className="bg-[#1c242c] border border-[#28323e] p-4 rounded-[4px] flex flex-col justify-between gap-4 shadow hover:border-text-secondary transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-16 relative rounded overflow-hidden bg-[#222b35] border border-[#28323e] flex-shrink-0">
                    {cp.startFilm?.poster_path ? (
                      <Image src={posterUrl(cp.startFilm.poster_path, 'w185')} alt="" fill className="object-cover" />
                    ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
                  </div>
                  <span className="text-xs font-light text-text-muted">➔</span>
                  <div className="w-11 h-16 relative rounded overflow-hidden bg-[#222b35] border border-[#28323e] flex-shrink-0">
                    {cp.endFilm?.poster_path ? (
                      <Image src={posterUrl(cp.endFilm.poster_path, 'w185')} alt="" fill className="object-cover" />
                    ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-xs text-white truncate">
                      {cp.title || `${cp.startFilm?.title} → ${cp.endFilm?.title}`}
                    </span>
                    {cp.creator_handle && (
                      <span className="text-[11px] text-text-secondary font-mono">
                        by @{cp.creator_handle}
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
        </section>
      )}

      {/* 3. CREATE PUZZLE STUDIO CALLOUT */}
      <section className="w-full">
        <div className="bg-[#1c242c] border border-[#28323e] p-5 sm:p-6 rounded-[4px] w-full flex flex-col sm:flex-row items-center justify-between gap-5 shadow">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#a78bfa]">
              Creator Studio
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Have a tricky film connection in mind?
            </h3>
            <p className="text-xs text-text-secondary max-w-lg">
              Pick any two movies to generate your own playable puzzle and custom leaderboard.
            </p>
          </div>
          <Link
            href="/create"
            className="px-5 py-2.5 bg-accent hover:bg-accent-dim text-[#0e1114] text-xs font-bold uppercase tracking-wider rounded transition-colors whitespace-nowrap shadow-[0_0_16px_rgba(0,224,84,0.25)] flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create a Game</span>
          </Link>
        </div>
      </section>

      {/* DEDICATED PRE-GAME BRIEF MODAL */}
      {showBrief && puzzle && (
        <div 
          onClick={() => setShowBrief(false)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1c242c] border border-[#28323e] p-6 sm:p-8 rounded-[4px] max-w-lg w-full flex flex-col gap-6 shadow-2xl text-left animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-[#28323e] pb-3">
              <div className="flex items-center gap-2">
                <Clapperboard className="w-5 h-5 text-accent" />
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  Today&apos;s Challenge
                </h2>
              </div>
              <button 
                onClick={() => setShowBrief(false)}
                className="text-text-muted hover:text-white text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Revealed Movie Pair */}
            <div className="flex items-center justify-center gap-6 py-4 bg-[#0e1114] rounded-[4px] border border-[#28323e]">
              {/* Start Movie */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary bg-[#222b35] px-2 py-0.5 rounded border border-[#28323e]">
                  START
                </span>
                <div className="w-16 h-24 relative rounded overflow-hidden bg-[#222b35] border border-[#28323e]">
                  {puzzle.startFilm.poster_path ? (
                    <Image src={posterUrl(puzzle.startFilm.poster_path, 'w185')} alt={puzzle.startFilm.title} fill className="object-cover" />
                  ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
                </div>
                <span className="text-xs font-bold text-white max-w-[110px] truncate text-center">{puzzle.startFilm.title}</span>
                <span className="text-[10px] text-text-secondary font-mono">{puzzle.startFilm.year}</span>
              </div>

              <div className="flex flex-col items-center gap-1 text-text-muted font-light">
                <span className="text-xl">⟷</span>
                <span className="text-[9px] font-mono uppercase font-bold text-text-muted">Connect</span>
              </div>

              {/* End Movie */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-[#222b35] px-2 py-0.5 rounded border border-[#28323e]">
                  END
                </span>
                <div className="w-16 h-24 relative rounded overflow-hidden bg-[#222b35] border border-[#28323e]">
                  {puzzle.endFilm.poster_path ? (
                    <Image src={posterUrl(puzzle.endFilm.poster_path, 'w185')} alt={puzzle.endFilm.title} fill className="object-cover" />
                  ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
                </div>
                <span className="text-xs font-bold text-white max-w-[110px] truncate text-center">{puzzle.endFilm.title}</span>
                <span className="text-[10px] text-text-secondary font-mono">{puzzle.endFilm.year}</span>
              </div>
            </div>

            {/* Mission Instructions */}
            <div className="flex flex-col gap-2 text-xs text-text-secondary bg-[#0e1114] p-3.5 rounded border border-[#28323e] leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="text-accent font-bold">1.</span>
                <span>Connect <strong className="text-white">{puzzle.startFilm.title}</strong> to <strong className="text-accent">{puzzle.endFilm.title}</strong>.</span>
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

            {/* Launch Action */}
            <button
              onClick={handleStartGame}
              className="w-full py-3.5 bg-accent hover:bg-accent-dim text-[#0e1114] font-black text-sm uppercase tracking-wider rounded-[4px] transition-all shadow-[0_0_20px_rgba(0,224,84,0.3)] cursor-pointer flex items-center justify-center gap-2"
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
