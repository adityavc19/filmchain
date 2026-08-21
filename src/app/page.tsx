'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
  endFilmId: number;
  minHops: number;
  playerCount: number;
}

export default function Home() {
  const router = useRouter();
  const [puzzle, setPuzzle] = useState<TodayPuzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  useEffect(() => {
    fetch('/api/puzzle/today')
      .then((res) => res.json())
      .then((data) => {
        setPuzzle(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-[70vh] gap-10 text-center py-6 max-w-4xl mx-auto w-full">
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-text-secondary">Loading Today&apos;s Puzzle...</p>
        </div>
      ) : puzzle && puzzle.startFilm && puzzle.endFilm ? (
        <div className="flex flex-col items-center gap-8 w-full">
          {/* Header Title Section */}
          <div className="flex flex-col items-center gap-3 max-w-xl">
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
              FILMTRACE
            </h1>

            <p className="text-sm sm:text-base text-text-secondary max-w-md leading-relaxed font-medium">
              Two films. One trail. How fast can you connect them?
            </p>

            {/* How to play trigger button */}
            <button
              onClick={() => setShowHowToPlay(true)}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-white transition-colors mt-1 bg-bg-secondary px-3 py-1.5 rounded-[4px] border border-border cursor-pointer"
            >
              <span className="text-accent font-bold">?</span> How to play
            </button>
          </div>

          {/* Connected Films Cards */}
          <div className="flex flex-col items-center gap-4 bg-bg-card p-6 sm:p-8 rounded-[4px] border border-border w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between w-full border-b border-border/80 pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                Daily Challenge &middot; {new Date(puzzle.date + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
              </span>
              <span className="text-[11px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                {puzzle.minHops ? `Min ${Math.floor(puzzle.minHops / 2)} hops` : 'Ready'}
              </span>
            </div>

            {/* Two Films Posters with Connect Indicator */}
            <div className="flex items-center justify-center gap-6 sm:gap-10 w-full py-2">
              {/* Start Film */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary bg-bg-secondary px-2.5 py-0.5 rounded border border-border">
                  START
                </span>
                <div className="relative w-[120px] h-[180px] sm:w-[136px] sm:h-[204px] rounded-[4px] overflow-hidden bg-bg-secondary border border-border shadow-lg">
                  {puzzle.startFilm.poster_path ? (
                    <Image
                      src={posterUrl(puzzle.startFilm.poster_path, 'w342')}
                      alt={puzzle.startFilm.title}
                      fill
                      sizes="136px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-text-muted p-2 font-mono">
                      {puzzle.startFilm.title}
                    </div>
                  )}
                </div>
                <span className="font-bold text-xs sm:text-sm text-white max-w-[136px] truncate">{puzzle.startFilm.title}</span>
                {puzzle.startFilm.year && (
                  <span className="text-[11px] text-text-secondary">{puzzle.startFilm.year}</span>
                )}
              </div>

              {/* Connecting Path Arrow & Label */}
              <div className="flex flex-col items-center gap-1.5 text-text-muted my-auto">
                <span className="text-xl sm:text-2xl font-light text-accent">⟷</span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted text-center max-w-[90px] leading-tight">
                  Connect these two
                </span>
              </div>

              {/* Target Film */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent bg-accent/10 px-2.5 py-0.5 rounded border border-accent/30">
                  TARGET
                </span>
                <div className="relative w-[120px] h-[180px] sm:w-[136px] sm:h-[204px] rounded-[4px] overflow-hidden bg-bg-secondary border-2 border-accent shadow-[0_0_18px_rgba(0,224,84,0.35)]">
                  {puzzle.endFilm.poster_path ? (
                    <Image
                      src={posterUrl(puzzle.endFilm.poster_path, 'w342')}
                      alt={puzzle.endFilm.title}
                      fill
                      sizes="136px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-text-muted p-2 font-mono">
                      {puzzle.endFilm.title}
                    </div>
                  )}
                </div>
                <span className="font-bold text-xs sm:text-sm text-white max-w-[136px] truncate">{puzzle.endFilm.title}</span>
                {puzzle.endFilm.year && (
                  <span className="text-[11px] text-text-secondary">{puzzle.endFilm.year}</span>
                )}
              </div>
            </div>

            {/* Visual Step-by-Step Chain Flow (Inspired by screenshot) */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap py-2 px-3 bg-bg-secondary/70 rounded-[4px] border border-border/70 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-bg-card border border-border text-text-secondary font-semibold">Start</span>
              <span className="text-text-muted">&rarr;</span>
              <span className="px-2 py-0.5 rounded bg-bg-card border border-border text-white">🎬 Movie</span>
              <span className="text-text-muted">&rarr;</span>
              <span className="px-2 py-0.5 rounded bg-bg-card border border-border text-accent font-semibold">👤 Person</span>
              <span className="text-text-muted">&rarr;</span>
              <span className="px-2 py-0.5 rounded bg-bg-card border border-border text-white">🎬 Movie</span>
              <span className="text-text-muted">&rarr;</span>
              <span className="px-2 py-0.5 rounded bg-accent text-bg-primary font-bold">🎯 Target</span>
            </div>

            {/* Action Area */}
            <div className="flex flex-col items-center gap-3 w-full border-t border-border/80 pt-4 mt-1">
              <button
                onClick={() => router.push(`/game/${puzzle.date}`)}
                className="w-full sm:w-72 py-3.5 bg-accent text-bg-primary text-xs sm:text-sm font-black uppercase tracking-wider rounded-[4px] hover:bg-accent-dim transition-all shadow-[0_0_18px_rgba(0,224,84,0.4)] cursor-pointer"
              >
                Play Today&apos;s Puzzle &nbsp;🎬
              </button>

              <span className="text-[11px] text-text-muted">
                {puzzle.playerCount ? `👥 ${puzzle.playerCount.toLocaleString()} solves logged today` : 'Be the first to solve today'}
              </span>
            </div>
          </div>

          {/* 3-Step How It Works Explainer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl text-left">
            <div className="bg-bg-secondary p-4 rounded-[4px] border border-border flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-accent/10 border border-accent/30 text-accent font-mono text-xs font-bold flex items-center justify-center">1</span>
                <span className="font-bold text-xs uppercase tracking-wider text-white">Inspect Credits</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                You start on the first movie. Check out its actors, directors, writers, and producers.
              </p>
            </div>

            <div className="bg-bg-secondary p-4 rounded-[4px] border border-border flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#ff8000]/10 border border-[#ff8000]/30 text-[#ff8000] font-mono text-xs font-bold flex items-center justify-center">2</span>
                <span className="font-bold text-xs uppercase tracking-wider text-white">Hop Through People</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Click any person to view their filmography, then select a connecting film to jump to.
              </p>
            </div>

            <div className="bg-bg-secondary p-4 rounded-[4px] border border-border flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#40bcf4]/10 border border-[#40bcf4]/30 text-[#40bcf4] font-mono text-xs font-bold flex items-center justify-center">3</span>
                <span className="font-bold text-xs uppercase tracking-wider text-white">Reach the Target</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Keep following the trail until you hit the Target Movie in the fewest clicks and fastest time!
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-text-secondary bg-bg-card p-6 rounded-[4px] border border-border">
          Failed to load today&apos;s puzzle. Please refresh.
        </div>
      )}

      {/* How To Play Modal */}
      {showHowToPlay && (
        <div
          onClick={() => setShowHowToPlay(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-bg-card border border-border rounded-[4px] p-6 sm:p-8 max-w-lg w-full text-left flex flex-col gap-5 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-black text-white">How to Play Filmtrace</h2>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="text-text-muted hover:text-white text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 text-xs sm:text-sm text-text-secondary leading-relaxed">
              <p>
                <strong className="text-white">Objective:</strong> Navigate from the <span className="text-white font-semibold">Start Movie</span> to the <span className="text-accent font-semibold">Target Movie</span> by clicking through shared actors and filmmakers.
              </p>

              <div className="bg-bg-secondary p-3.5 rounded-[4px] border border-border flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent">The Golden Rule</span>
                <p className="text-xs text-white">
                  You must alternate between <strong>Films</strong> and <strong>People</strong>:
                </p>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-text-secondary flex-wrap">
                  <span>🎬 Film</span> &rarr; <span>👤 Person</span> &rarr; <span>🎬 Film</span> &rarr; <span>👤 Person</span> &rarr; <span>🎯 Target</span>
                </div>
              </div>

              <ul className="list-disc pl-5 space-y-2">
                <li>Click any actor, director, or crew member in the cast/crew list.</li>
                <li>Browse their filmography and select a film that brings you closer to the target.</li>
                <li>Use the <strong>Search</strong> option in the tab bar to quickly find specific names or titles.</li>
                <li>Click any earlier film in the <strong>Breadcrumb trail</strong> at the top to rewind if you hit a dead end.</li>
              </ul>
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-2.5 bg-accent text-bg-primary text-xs font-bold uppercase tracking-wider rounded-[4px] hover:bg-accent-dim transition-colors cursor-pointer mt-1"
            >
              Got It &middot; Let&apos;s Play
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
