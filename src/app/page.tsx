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
  Clock,
  User,
  Target,
  Zap,
  Trophy
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
  start_film_id?: number;
  end_film_id?: number;
  startFilm?: FilmInfo | null;
  endFilm?: FilmInfo | null;
}

export default function Home() {
  const router = useRouter();
  const [puzzle, setPuzzle] = useState<TodayPuzzle | null>(null);
  const [communityPuzzles, setCommunityPuzzles] = useState<CommunityPuzzle[]>([]);
  const [loading, setLoading] = useState(true);

  // Pre-game brief modal states
  const [showDailyBrief, setShowDailyBrief] = useState(false);
  const [selectedCommunityPuzzle, setSelectedCommunityPuzzle] = useState<CommunityPuzzle | null>(null);

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

  function handleStartDailyGame() {
    if (!puzzle) return;
    router.push(`/game/${puzzle.date}`);
  }

  function handleStartCommunityGame() {
    if (!selectedCommunityPuzzle) return;
    router.push(`/game/custom/${selectedCommunityPuzzle.id}`);
  }

  return (
    <div className="flex flex-col w-full">
      {/* DYNAMIC MOTION STRIP — MINIMAL OFF-WHITE RIBBON */}
      <div className="w-full bg-[#f4f4f2] text-[#0e1114] border-y border-[#dcded8] py-1.5 overflow-hidden select-none -mx-4 sm:-mx-6 mb-6 shadow-sm">
        <div className="motion-ticker flex items-center">
          {/* Loop 1 */}
          <div className="flex items-center">
            {[
              { icon: '🍿', text: 'May the Force be with you.' },
              { icon: '🚂', text: 'Bade bade deshon mein aisi choti choti baatein hoti rehti hain, Senorita.' },
              { icon: '🎬', text: "Here's looking at you, kid." },
              { icon: '🕶️', text: 'Don ko pakadna mushkil hi nahi, namumkin hai.' },
              { icon: '🪐', text: 'Do not go gentle into that good night.' },
              { icon: '💫', text: 'Picture abhi baaki hai mere dost!' },
              { icon: '⚡', text: "You're a wizard, Harry." },
              { icon: '👑', text: 'Mogambo khush hua.' },
              { icon: '🚗', text: "Roads? Where we're going, we don't need roads." },
              { icon: '🍫', text: 'Life is like a box of chocolates.' },
              { icon: '🚪', text: "Here's Johnny!" },
              { icon: '🌌', text: 'To infinity and beyond!' },
            ].map((q, idx) => (
              <div key={`reel1-${idx}`} className="flex items-center gap-2 px-5 whitespace-nowrap">
                <span className="text-xs">{q.icon}</span>
                <span className="text-[11px] font-semibold text-[#1a202c] tracking-tight">
                  &ldquo;{q.text}&rdquo;
                </span>
                <span className="text-[#a0aec0] font-bold text-xs ml-4 select-none">•</span>
              </div>
            ))}
          </div>

          {/* Loop 2 (Duplicate for seamless continuous loop) */}
          <div className="flex items-center">
            {[
              { icon: '🍿', text: 'May the Force be with you.' },
              { icon: '🚂', text: 'Bade bade deshon mein aisi choti choti baatein hoti rehti hain, Senorita.' },
              { icon: '🎬', text: "Here's looking at you, kid." },
              { icon: '🕶️', text: 'Don ko pakadna mushkil hi nahi, namumkin hai.' },
              { icon: '🪐', text: 'Do not go gentle into that good night.' },
              { icon: '💫', text: 'Picture abhi baaki hai mere dost!' },
              { icon: '⚡', text: "You're a wizard, Harry." },
              { icon: '👑', text: 'Mogambo khush hua.' },
              { icon: '🚗', text: "Roads? Where we're going, we don't need roads." },
              { icon: '🍫', text: 'Life is like a box of chocolates.' },
              { icon: '🚪', text: "Here's Johnny!" },
              { icon: '🌌', text: 'To infinity and beyond!' },
            ].map((q, idx) => (
              <div key={`reel2-${idx}`} className="flex items-center gap-2 px-5 whitespace-nowrap">
                <span className="text-xs">{q.icon}</span>
                <span className="text-[11px] font-semibold text-[#1a202c] tracking-tight">
                  &ldquo;{q.text}&rdquo;
                </span>
                <span className="text-[#a0aec0] font-bold text-xs ml-4 select-none">•</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="flex flex-col items-center gap-12 max-w-5xl mx-auto w-full text-left">
        
        {/* 1. HERO SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center pt-2 pb-6 w-full border-b border-[#28323e]">
          
          {/* Left Column: Title & Action */}
          <div className="lg:col-span-6 flex flex-col gap-4 items-start">
            
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1c242c] border border-[#28323e] text-[#9ab0c2] text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-text-secondary" />
              <span>A Game for Cinephiles</span>
            </div>

            {/* Clean 2-Line Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08]">
              <span className="text-[#00e054]">Two films.</span> <br />
              <span className="text-[#9ab0c2]">How fast can you connect them?</span>
            </h1>

            {/* Clean Concise Subtitle */}
            <p className="mt-4 sm:mt-5 text-sm sm:text-base text-text-secondary font-normal leading-relaxed max-w-md">
              Trace the shortest path between two films traversing through the cast &amp; crew
            </p>

            {/* Primary Action Button (Clean Solid White) */}
            <div className="pt-2 w-full sm:w-auto">
              <button
                onClick={() => setShowDailyBrief(true)}
                className="flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-[4px] bg-white hover:bg-[#e6e6e6] text-[#0e1114] font-black text-sm uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                <Clapperboard className="w-4 h-4" />
                <span>Play Today&apos;s Challenge</span>
              </button>
            </div>

            {/* Daily Teaser Strip with Dynamic Count */}
            {puzzle && (
              <div className="flex items-center gap-1.5 pt-1 text-xs text-text-secondary">
                <Users className="w-3.5 h-3.5 text-[#40bcf4]" />
                <span>{(puzzle.playerCount || 0)} {(puzzle.playerCount || 0) === 1 ? 'game' : 'games'} played today</span>
              </div>
            )}
          </div>

          {/* Right Column: Enhanced Cinematic "How It Works" Visual */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <div className="w-full bg-[#1c242c] border border-[#2e3a47] rounded-[8px] p-6 sm:p-7 shadow-2xl flex flex-col gap-5">
              
              {/* Widget Header */}
              <div className="flex flex-col gap-1 border-b border-[#28323e] pb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#40bcf4]" />
                  <span className="text-xs font-black uppercase tracking-wider text-white">How To Connect</span>
                </div>
                <p className="text-xs text-text-secondary">
                  Hop from film to cast/crew and trace the connection trail.
                </p>
              </div>

              {/* Clean 4-Node Flow with uncropped 2:3 aspect ratio posters */}
              <div className="flex items-center justify-between gap-1.5 sm:gap-2.5 py-1">
                
                {/* 1. Start Film (Dil Chahta Hai - Uncropped 2:3) */}
                <div className="flex flex-col items-center gap-1.5 w-[22%] sm:w-26">
                  <div className="w-full aspect-[2/3] rounded-[6px] bg-[#222b35] border border-[#3b4856] overflow-hidden shadow-md relative">
                    <Image src="/dil_chahta_hai.jpg" alt="Dil Chahta Hai" fill className="object-cover object-top" />
                  </div>
                  <span className="text-[11px] font-bold text-white text-center truncate max-w-full leading-tight">Dil Chahta Hai</span>
                </div>

                <span className="text-text-muted text-xs sm:text-sm font-bold opacity-60">➔</span>

                {/* 2. Actor / Crew */}
                <div className="flex flex-col items-center gap-1.5 w-[18%] sm:w-22">
                  <div className="w-full aspect-[2/3] rounded-[6px] bg-gradient-to-b from-[#222b35] to-[#182028] border border-[#2e3a47] flex flex-col items-center justify-center text-white shadow-sm gap-2 p-1.5">
                    <Users className="w-6 h-6 sm:w-7 sm:h-7 opacity-75 text-text-secondary" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-text-secondary text-center leading-tight">Cast / Crew</span>
                  </div>
                </div>

                <span className="text-text-muted text-xs sm:text-sm font-bold opacity-60">➔</span>

                {/* 3. Next Film */}
                <div className="flex flex-col items-center gap-1.5 w-[18%] sm:w-22">
                  <div className="w-full aspect-[2/3] rounded-[6px] bg-gradient-to-b from-[#222b35] to-[#182028] border border-[#2e3a47] flex flex-col items-center justify-center text-white shadow-sm gap-2 p-1.5">
                    <Film className="w-6 h-6 sm:w-7 sm:h-7 opacity-75 text-text-secondary" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-text-secondary text-center leading-tight">Next Film</span>
                  </div>
                </div>

                <span className="text-text-muted text-xs sm:text-sm font-mono tracking-widest opacity-60">···</span>

                {/* 4. End Film (Oppenheimer - Glowing Green Border) */}
                <div className="flex flex-col items-center gap-1.5 w-[22%] sm:w-26">
                  <div className="w-full aspect-[2/3] rounded-[6px] bg-[#222b35] border-2 border-[#00e054] overflow-hidden shadow-[0_0_18px_rgba(0,224,84,0.35)] relative">
                    <Image src="/oppenheimer.jpg" alt="Oppenheimer" fill className="object-cover object-top" />
                  </div>
                  <span className="text-[11px] font-bold text-[#00e054] text-center truncate max-w-full leading-tight">Oppenheimer</span>
                </div>

              </div>

              {/* Bottom Quick Feature Strip */}
              <div className="pt-3 border-t border-[#28323e]/60 flex items-center justify-between text-[11px] text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#40bcf4]" />
                  <span>Fastest time & fewest clicks win</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-[#ff8000]" />
                  <span>Live daily rankings</span>
                </span>
              </div>

            </div>
          </div>
        </section>

      {/* 2. COMMUNITY CHALLENGES (Single Clean CTA at bottom) */}
      {communityPuzzles.length > 0 && (
        <section className="flex flex-col gap-4 w-full">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#40bcf4]" />
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wider text-white">
              Community Challenges
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {communityPuzzles.slice(0, 3).map((cp) => (
              <div key={cp.id} className="bg-[#1c242c] border border-[#28323e] p-4 rounded-[6px] flex flex-col items-center justify-between gap-3.5 shadow hover:border-text-secondary transition-colors text-center">
                {/* Two Covers */}
                <div className="flex items-center justify-center gap-3 w-full py-1">
                  <div className="w-14 h-20 sm:w-16 sm:h-24 relative rounded-[4px] overflow-hidden bg-[#222b35] border border-[#28323e] flex-shrink-0 shadow-md">
                    {cp.startFilm?.poster_path ? (
                      <Image src={posterUrl(cp.startFilm.poster_path, 'w185')} alt="" fill className="object-cover" />
                    ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
                  </div>
                  <span className="text-sm font-bold text-text-muted">➔</span>
                  <div className="w-14 h-20 sm:w-16 sm:h-24 relative rounded-[4px] overflow-hidden bg-[#222b35] border border-[#28323e] flex-shrink-0 shadow-md">
                    {cp.endFilm?.poster_path ? (
                      <Image src={posterUrl(cp.endFilm.poster_path, 'w185')} alt="" fill className="object-cover" />
                    ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
                  </div>
                </div>

                {/* Subtitle: Made by creator name */}
                <div className="flex items-center justify-center text-xs text-text-secondary font-mono">
                  <span>made by <strong className="text-white font-medium">@{cp.creator_handle || 'cinephile'}</strong></span>
                </div>

                <button
                  onClick={() => setSelectedCommunityPuzzle(cp)}
                  className="w-full py-2 bg-[#222b35] hover:bg-[#2c3744] text-white text-[11px] font-bold uppercase tracking-wider rounded-[4px] text-center border border-[#28323e] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Clapperboard className="w-3.5 h-3.5 text-text-secondary" />
                  <span>Play Challenge</span>
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-1">
            <Link
              href="/community"
              className="text-xs font-bold text-text-secondary hover:text-white uppercase tracking-wider transition-colors inline-flex items-center gap-1.5 cursor-pointer group"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </section>
      )}

      {/* 3. CREATE STUDIO CALLOUT */}
      <section className="w-full">
        <div className="bg-[#1c242c] border border-[#28323e] p-5 sm:p-6 rounded-[4px] w-full flex flex-col sm:flex-row items-center justify-between gap-5 shadow">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#a855f7]">
              Creator Studio
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Have a tricky film connection in mind?
            </h3>
            <p className="text-xs text-text-secondary max-w-lg">
              Pick any two movies to generate your own playable challenge and custom leaderboard.
            </p>
          </div>
          <Link
            href="/create"
            className="px-5 py-2.5 bg-white hover:bg-[#e6e6e6] text-[#0e1114] text-xs font-bold uppercase tracking-wider rounded transition-colors whitespace-nowrap shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create a Game</span>
          </Link>
        </div>
      </section>

      {/* 4. TODAY'S CHALLENGE PRE-GAME BRIEF MODAL */}
      {showDailyBrief && puzzle && (
        <div 
          onClick={() => setShowDailyBrief(false)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1c242c] border border-[#28323e] p-6 sm:p-8 rounded-[4px] max-w-lg w-full flex flex-col gap-6 shadow-2xl text-left animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-[#28323e] pb-3">
              <div className="flex items-center gap-2">
                <Clapperboard className="w-5 h-5 text-white" />
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  Today&apos;s Challenge
                </h2>
              </div>
              <button 
                onClick={() => setShowDailyBrief(false)}
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
                <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-[#222b35] px-2 py-0.5 rounded border border-[#28323e]">
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

            {/* Mission Instructions (Icon-based bullets, no dividers) */}
            <div className="flex flex-col gap-3 text-xs text-text-secondary bg-[#0e1114] p-4 rounded border border-[#28323e] leading-relaxed">
              <div className="flex items-start gap-2.5">
                <Target className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                <span>Connect <strong className="text-white">{puzzle.startFilm.title}</strong> to <strong className="text-white">{puzzle.endFilm.title}</strong>.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-[#40bcf4] flex-shrink-0 mt-0.5" />
                <span>Compete by doing it in the fastest time and with the fewest clicks.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-text-secondary flex-shrink-0 mt-0.5" />
                <span>Timer begins when you click <strong className="text-white">START GAME</strong>.</span>
              </div>
            </div>

            {/* Launch Action (Clean Solid White) */}
            <button
              onClick={handleStartDailyGame}
              className="w-full py-3.5 bg-white hover:bg-[#e6e6e6] text-[#0e1114] font-black text-sm uppercase tracking-wider rounded-[4px] transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              <span>START GAME</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      {/* 5. COMMUNITY CHALLENGE PRE-GAME BRIEF MODAL */}
      {selectedCommunityPuzzle && (
        <div 
          onClick={() => setSelectedCommunityPuzzle(null)}
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
                  {selectedCommunityPuzzle.title || 'Community Challenge'}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedCommunityPuzzle(null)}
                className="text-text-muted hover:text-white text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Creator Badge */}
            {selectedCommunityPuzzle.creator_handle && (
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <User className="w-3.5 h-3.5 text-text-secondary" />
                <span>Created by <strong className="text-white font-mono">@{selectedCommunityPuzzle.creator_handle}</strong></span>
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
                  {selectedCommunityPuzzle.startFilm?.poster_path ? (
                    <Image src={posterUrl(selectedCommunityPuzzle.startFilm.poster_path, 'w185')} alt={selectedCommunityPuzzle.startFilm.title || ''} fill className="object-cover" />
                  ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
                </div>
                <span className="text-xs font-bold text-white max-w-[110px] truncate text-center">
                  {selectedCommunityPuzzle.startFilm?.title || 'Start Movie'}
                </span>
                {selectedCommunityPuzzle.startFilm?.year && (
                  <span className="text-[10px] text-text-secondary font-mono">{selectedCommunityPuzzle.startFilm.year}</span>
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
                  {selectedCommunityPuzzle.endFilm?.poster_path ? (
                    <Image src={posterUrl(selectedCommunityPuzzle.endFilm.poster_path, 'w185')} alt={selectedCommunityPuzzle.endFilm.title || ''} fill className="object-cover" />
                  ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
                </div>
                <span className="text-xs font-bold text-white max-w-[110px] truncate text-center">
                  {selectedCommunityPuzzle.endFilm?.title || 'End Movie'}
                </span>
                {selectedCommunityPuzzle.endFilm?.year && (
                  <span className="text-[10px] text-text-secondary font-mono">{selectedCommunityPuzzle.endFilm.year}</span>
                )}
              </div>
            </div>

            {/* Mission Instructions (Icon-based bullets, no dividers) */}
            <div className="flex flex-col gap-3 text-xs text-text-secondary bg-[#0e1114] p-4 rounded border border-[#28323e] leading-relaxed">
              <div className="flex items-start gap-2.5">
                <Target className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                <span>Connect <strong className="text-white">{selectedCommunityPuzzle.startFilm?.title}</strong> to <strong className="text-white">{selectedCommunityPuzzle.endFilm?.title}</strong>.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Zap className="w-4 h-4 text-[#40bcf4] flex-shrink-0 mt-0.5" />
                <span>Compete by doing it in the fastest time and with the fewest clicks.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-text-secondary flex-shrink-0 mt-0.5" />
                <span>Timer begins when you click <strong className="text-white">START GAME</strong>.</span>
              </div>
            </div>

            {/* Launch Action (Clean Solid White) */}
            <button
              onClick={handleStartCommunityGame}
              className="w-full py-3.5 bg-white hover:bg-[#e6e6e6] text-[#0e1114] font-black text-sm uppercase tracking-wider rounded-[4px] transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              <span>START GAME</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}

      </main>
    </div>
  );
}
