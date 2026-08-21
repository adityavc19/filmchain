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
  Trophy, 
  Zap, 
  Brain, 
  Compass, 
  Share2, 
  Users, 
  Clock, 
  HelpCircle 
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

  // Pre-game brief modal/stage state
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
    <main className="flex flex-col items-center gap-16 py-6 max-w-5xl mx-auto w-full text-left">
      
      {/* 1. HERO SECTION (Editorial Cinephile Design) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center pt-4 pb-8 w-full border-b border-border/60">
        
        {/* Left Column: Headline & Value Proposition */}
        <div className="lg:col-span-7 flex flex-col gap-6 items-start">
          
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7c3aed]/15 border border-[#7c3aed]/30 text-[#c4b5fd] text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" />
            <span>A Game for Cinephiles</span>
          </div>

          {/* Editorial Serif Headline */}
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal text-white tracking-tight leading-[1.12]">
            Two films. One trail. <br />
            <span className="italic font-serif text-accent">How fast</span> can you connect them?
          </h1>

          {/* Subtext */}
          <p className="text-base sm:text-lg text-text-secondary font-normal leading-relaxed max-w-xl">
            Every actor, director, and crew member is a link. Filmtrace hands you two movies and challenges you to trace the shortest path between them through the people who made them.
          </p>

          {/* CTA Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2 w-full sm:w-auto">
            <button
              onClick={() => setShowBrief(true)}
              className="flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-[4px] bg-[#00e054] hover:bg-[#00b042] text-bg-primary font-bold text-sm uppercase tracking-wider transition-all shadow-[0_0_24px_rgba(0,224,84,0.3)] cursor-pointer"
            >
              <Clapperboard className="w-4 h-4" />
              <span>Play Today&apos;s Trail</span>
            </button>

            <a
              href="#how-it-works"
              className="flex items-center justify-center gap-1.5 px-5 py-3.5 text-text-secondary hover:text-white font-medium text-sm transition-colors cursor-pointer"
            >
              <span>See how it works</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Daily Teaser Strip (Mystery - Unrevealed Pair) */}
          {puzzle && (
            <div className="flex items-center gap-3 pt-3 text-xs text-text-muted">
              <span className="flex items-center gap-1.5 text-text-secondary font-mono">
                <Clock className="w-3.5 h-3.5 text-accent" />
                Daily Challenge #{puzzle.date}
              </span>
              <span>&middot;</span>
              <span className="flex items-center gap-1.5 text-text-secondary">
                <Users className="w-3.5 h-3.5 text-[#40bcf4]" />
                {puzzle.playerCount ? `${puzzle.playerCount.toLocaleString()} solvers` : 'Live now'}
              </span>
            </div>
          )}
        </div>

        {/* Right Column: Visual Trail Illustration Graphic */}
        <div className="lg:col-span-5 flex items-center justify-center relative">
          <div className="w-full max-w-md bg-gradient-to-b from-[#1c2228] to-[#14181c] border border-border/80 rounded-[8px] p-6 shadow-2xl relative overflow-hidden">
            
            {/* Ambient Backlight */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#00e054]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#7c3aed]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col gap-5 relative z-10">
              
              {/* Graphic Header */}
              <div className="flex items-center justify-between text-[11px] font-mono text-text-muted border-b border-border pb-2">
                <span>CHAIN PREVIEW</span>
                <span className="text-accent font-semibold">MIN HOPS: 2</span>
              </div>

              {/* Graphic Flow Layout */}
              <div className="flex items-center justify-between gap-3">
                {/* Film Card 1 */}
                <div className="flex flex-col items-center gap-1.5 w-24">
                  <div className="w-20 h-28 rounded-[4px] bg-[#202830] border border-border flex flex-col items-center justify-center p-2 text-center shadow-lg relative group">
                    <Film className="w-6 h-6 text-text-muted mb-1" />
                    <span className="text-[10px] font-bold text-white leading-tight">Film A</span>
                    <span className="text-[9px] text-text-muted font-mono">Start</span>
                  </div>
                </div>

                {/* Animated Chain Node Connection */}
                <div className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="flex items-center w-full justify-center relative">
                    <div className="h-[2px] bg-gradient-to-r from-border via-accent to-border w-full absolute top-1/2 -translate-y-1/2 z-0" />
                    
                    <div className="flex items-center gap-1.5 relative z-10 bg-[#1c2228] px-1">
                      <div className="px-2 py-0.5 rounded-full bg-[#202830] border border-accent/40 text-[9px] font-semibold text-accent flex items-center gap-1 shadow">
                        <span>Actor</span>
                      </div>
                      <div className="px-2 py-0.5 rounded-full bg-[#202830] border border-[#ff8000]/40 text-[9px] font-semibold text-[#ff8000] flex items-center gap-1 shadow">
                        <span>Director</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-text-muted font-mono">Shared Cast & Crew</span>
                </div>

                {/* Film Card 2 */}
                <div className="flex flex-col items-center gap-1.5 w-24">
                  <div className="w-20 h-28 rounded-[4px] bg-[#202830] border-2 border-accent flex flex-col items-center justify-center p-2 text-center shadow-[0_0_16px_rgba(0,224,84,0.25)] relative">
                    <div className="absolute -top-2 -right-1 bg-accent text-bg-primary text-[8px] font-black uppercase px-1 rounded">
                      Goal
                    </div>
                    <Film className="w-6 h-6 text-accent mb-1" />
                    <span className="text-[10px] font-bold text-white leading-tight">Film B</span>
                    <span className="text-[9px] text-accent font-mono">Target</span>
                  </div>
                </div>
              </div>

              {/* Pro Tip Callout */}
              <div className="bg-[#14181c] p-3 rounded border border-border text-[11px] text-text-secondary leading-relaxed flex items-start gap-2">
                <Brain className="w-4 h-4 text-[#a78bfa] flex-shrink-0 mt-0.5" />
                <span>
                  Connect through filmography in alternating hops: <strong className="text-white">Film &rarr; Person &rarr; Film</strong>.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHY COMPETE / CINEPHILE DESIRE SECTION */}
      <section className="flex flex-col gap-8 w-full">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#40bcf4]">
            Why Play Filmtrace
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Put your cinema knowledge to the ultimate test
          </h2>
          <p className="text-sm text-text-secondary max-w-xl">
            Forget basic movie trivia. Filmtrace challenges your mental map of Hollywood, world cinema, and cast lineages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
          {/* Pillar 1 */}
          <div className="bg-bg-card border border-border p-6 rounded-[6px] flex flex-col gap-3 shadow-lg hover:border-text-secondary transition-all">
            <div className="w-10 h-10 rounded-[4px] bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Mental Map of Cinema</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Connect blockbusters, cult classics, and arthouse cinema through shared cinematographers, writers, and ensemble casts.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-bg-card border border-border p-6 rounded-[6px] flex flex-col gap-3 shadow-lg hover:border-text-secondary transition-all">
            <div className="w-10 h-10 rounded-[4px] bg-[#ff8000]/15 border border-[#ff8000]/30 flex items-center justify-center text-[#ff8000]">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Speed & Fewest Clicks</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Find the most direct cinematic shortcut. Compete on the daily global leaderboard for fastest time and minimum hops.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-bg-card border border-border p-6 rounded-[6px] flex flex-col gap-3 shadow-lg hover:border-text-secondary transition-all">
            <div className="w-10 h-10 rounded-[4px] bg-[#7c3aed]/15 border border-[#7c3aed]/30 flex items-center justify-center text-[#c4b5fd]">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Forge Custom Challenges</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Got a diabolical connection? Create custom puzzles with any two films and challenge your cinephile circle with shareable links.
            </p>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (Explainer Walkthrough) */}
      <section id="how-it-works" className="flex flex-col gap-8 w-full pt-4 border-t border-border/60 scroll-mt-20">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-accent">
            Game Mechanics
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            How to Play in 3 Simple Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
          <div className="bg-bg-secondary p-5 rounded-[4px] border border-border flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-accent/20 text-accent font-mono text-xs font-bold flex items-center justify-center">1</span>
              <span className="font-bold text-sm text-white">Pick a Person</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Start on the opening film. Inspect the cast and key crew members (directors, writers, producers) and select one.
            </p>
          </div>

          <div className="bg-bg-secondary p-5 rounded-[4px] border border-border flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-[#ff8000]/20 text-[#ff8000] font-mono text-xs font-bold flex items-center justify-center">2</span>
              <span className="font-bold text-sm text-white">Jump to Another Film</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Browse their full filmography and select another title to transition to that movie&apos;s page.
            </p>
          </div>

          <div className="bg-bg-secondary p-5 rounded-[4px] border border-border flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-[#40bcf4]/20 text-[#40bcf4] font-mono text-xs font-bold flex items-center justify-center">3</span>
              <span className="font-bold text-sm text-white">Hit the Target</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Continue chaining until you select the Target Film to complete the trail and secure your rank!
            </p>
          </div>
        </div>
      </section>

      {/* 4. COMMUNITY PUZZLES SECTION */}
      {communityPuzzles.length > 0 && (
        <section className="flex flex-col gap-6 w-full pt-4 border-t border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Compass className="w-5 h-5 text-[#40bcf4]" />
              <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-white">
                Community Challenges
              </h2>
            </div>
            <Link href="/create" className="text-xs text-accent hover:underline font-semibold flex items-center gap-1">
              <span>+ Create Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {communityPuzzles.map((cp) => (
              <div key={cp.id} className="bg-bg-card border border-border p-4 rounded-[4px] flex flex-col justify-between gap-4 shadow-md hover:border-text-secondary transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-16 relative rounded overflow-hidden bg-bg-secondary border border-border flex-shrink-0">
                    {cp.startFilm?.poster_path ? (
                      <Image src={posterUrl(cp.startFilm.poster_path, 'w185')} alt="" fill className="object-cover" />
                    ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
                  </div>
                  <span className="text-xs font-light text-accent">➔</span>
                  <div className="w-11 h-16 relative rounded overflow-hidden bg-bg-secondary border-2 border-accent flex-shrink-0">
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
                  className="w-full py-2 bg-bg-secondary hover:bg-accent hover:text-bg-primary text-text-primary text-[11px] font-bold uppercase tracking-wider rounded text-center border border-border transition-colors flex items-center justify-center gap-1.5"
                >
                  <Clapperboard className="w-3.5 h-3.5" />
                  <span>Play Challenge</span>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. CREATE PUZZLE STUDIO CALLOUT BANNER */}
      <section className="w-full">
        <div className="bg-gradient-to-r from-[#1c2228] via-[#202830] to-[#1c2228] border border-border p-6 sm:p-8 rounded-[6px] w-full flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-[#a78bfa]">
              Creator Studio
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Know a film connection that will stump your friends?
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary max-w-lg">
              Pick any two movies from TMDb to generate your own playable puzzle and custom leaderboard.
            </p>
          </div>
          <Link
            href="/create"
            className="px-6 py-3.5 bg-accent hover:bg-accent-dim text-bg-primary text-xs font-bold uppercase tracking-wider rounded transition-colors whitespace-nowrap shadow-[0_0_16px_rgba(0,224,84,0.3)] flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create a Puzzle</span>
          </Link>
        </div>
      </section>

      {/* DEDICATED PRE-GAME BRIEF MODAL / STAGE (Reveals pair & starts timer only on START) */}
      {showBrief && puzzle && (
        <div 
          onClick={() => setShowBrief(false)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-bg-card border-2 border-accent p-6 sm:p-8 rounded-[6px] max-w-lg w-full flex flex-col gap-6 shadow-2xl text-left animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Clapperboard className="w-5 h-5 text-accent" />
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  Daily Challenge Brief
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
            <div className="flex items-center justify-center gap-6 py-3 bg-bg-secondary rounded-[4px] border border-border">
              {/* Start Movie */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary bg-bg-card px-2 py-0.5 rounded border border-border">
                  START
                </span>
                <div className="w-16 h-24 relative rounded overflow-hidden bg-bg-card border border-border">
                  {puzzle.startFilm.poster_path ? (
                    <Image src={posterUrl(puzzle.startFilm.poster_path, 'w185')} alt={puzzle.startFilm.title} fill className="object-cover" />
                  ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
                </div>
                <span className="text-xs font-bold text-white max-w-[110px] truncate text-center">{puzzle.startFilm.title}</span>
                <span className="text-[10px] text-text-secondary font-mono">{puzzle.startFilm.year}</span>
              </div>

              <div className="flex flex-col items-center gap-1 text-accent font-light">
                <span className="text-2xl">⟷</span>
                <span className="text-[9px] font-mono uppercase font-bold text-text-muted">Connect</span>
              </div>

              {/* Target Movie */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/30">
                  TARGET
                </span>
                <div className="w-16 h-24 relative rounded overflow-hidden bg-bg-card border-2 border-accent shadow-[0_0_12px_rgba(0,224,84,0.3)]">
                  {puzzle.endFilm.poster_path ? (
                    <Image src={posterUrl(puzzle.endFilm.poster_path, 'w185')} alt={puzzle.endFilm.title} fill className="object-cover" />
                  ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
                </div>
                <span className="text-xs font-bold text-white max-w-[110px] truncate text-center">{puzzle.endFilm.title}</span>
                <span className="text-[10px] text-text-secondary font-mono">{puzzle.endFilm.year}</span>
              </div>
            </div>

            {/* Mission Instructions */}
            <div className="flex flex-col gap-2 text-xs text-text-secondary bg-[#14181c] p-3.5 rounded border border-border leading-relaxed">
              <p>
                🎯 <strong className="text-white">Objective:</strong> Navigate from <strong className="text-white">{puzzle.startFilm.title}</strong> to <strong className="text-accent">{puzzle.endFilm.title}</strong> in the fewest clicks and fastest time.
              </p>
              <p>
                ⏱️ <strong className="text-white">Timer Notice:</strong> The official timer will start as soon as you press <strong>START GAME</strong> below.
              </p>
            </div>

            {/* Launch Action */}
            <button
              onClick={handleStartGame}
              className="w-full py-4 bg-accent hover:bg-accent-dim text-bg-primary font-black text-sm uppercase tracking-wider rounded-[4px] transition-all shadow-[0_0_20px_rgba(0,224,84,0.4)] cursor-pointer flex items-center justify-center gap-2"
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
