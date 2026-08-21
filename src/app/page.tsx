'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
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

  return (
    <main className="flex flex-col items-center justify-center min-h-[70vh] gap-12 text-center py-4 max-w-4xl mx-auto w-full">
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-text-secondary">Loading Today&apos;s Challenge...</p>
        </div>
      ) : puzzle && puzzle.startFilm && puzzle.endFilm ? (
        <div className="flex flex-col items-center gap-10 w-full">
          {/* Header Title Section */}
          <div className="flex flex-col items-center gap-3 max-w-xl">
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
              FILMTRACE
            </h1>

            <p className="text-sm sm:text-base text-text-secondary max-w-md leading-relaxed font-medium">
              Two films. One trail. How fast can you connect them?
            </p>
          </div>

          {/* Connected Films Challenge Card */}
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

            {/* Visual Step-by-Step Chain Flow */}
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

          {/* COMMUNITY PUZZLES SECTION */}
          {communityPuzzles.length > 0 && (
            <div className="flex flex-col gap-4 w-full max-w-2xl text-left">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🧩</span>
                  <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white">
                    Community Puzzles
                  </h2>
                </div>
                <Link href="/create" className="text-xs text-accent hover:underline font-semibold">
                  + Create Your Own
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {communityPuzzles.map((cp) => (
                  <div key={cp.id} className="bg-bg-card border border-border p-4 rounded-[4px] flex flex-col gap-3 justify-between shadow-md hover:border-text-secondary transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-14 relative rounded overflow-hidden bg-bg-secondary border border-border flex-shrink-0">
                        {cp.startFilm?.poster_path ? (
                          <Image src={posterUrl(cp.startFilm.poster_path, 'w92')} alt={cp.startFilm.title} fill className="object-cover" />
                        ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
                      </div>
                      <span className="text-xs font-light text-accent">➔</span>
                      <div className="w-10 h-14 relative rounded overflow-hidden bg-bg-secondary border-2 border-accent flex-shrink-0">
                        {cp.endFilm?.poster_path ? (
                          <Image src={posterUrl(cp.endFilm.poster_path, 'w92')} alt={cp.endFilm.title} fill className="object-cover" />
                        ) : <div className="w-full h-full flex items-center justify-center text-xs">🎬</div>}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-xs text-white truncate">
                          {cp.title || `${cp.startFilm?.title} → ${cp.endFilm?.title}`}
                        </span>
                        {cp.creator_handle && (
                          <span className="text-[10px] text-text-secondary font-mono">
                            by @{cp.creator_handle}
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/game/custom/${cp.id}`}
                      className="w-full py-1.5 bg-bg-secondary hover:bg-accent hover:text-bg-primary text-text-primary text-[11px] font-bold uppercase tracking-wider rounded text-center border border-border transition-colors"
                    >
                      Play Puzzle &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CREATE YOUR OWN CTA BANNER */}
          <div className="bg-gradient-to-r from-[#1c2228] via-[#202830] to-[#1c2228] border border-border p-6 rounded-[4px] w-full max-w-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left shadow-lg">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#40bcf4]">Freeform Studio</span>
              <h3 className="text-base sm:text-lg font-black text-white">Have a tricky movie connection?</h3>
              <p className="text-xs text-text-secondary">Create a custom puzzle with any 2 films and challenge your friends.</p>
            </div>
            <Link
              href="/create"
              className="px-5 py-2.5 bg-accent hover:bg-accent-dim text-bg-primary text-xs font-bold uppercase tracking-wider rounded transition-colors whitespace-nowrap shadow-[0_0_12px_rgba(0,224,84,0.3)]"
            >
              Create Puzzle &rarr;
            </Link>
          </div>

          {/* INLINE "HOW TO PLAY" COMPLETE GUIDE */}
          <div className="flex flex-col gap-6 bg-bg-card p-6 sm:p-8 rounded-[4px] border border-border w-full max-w-2xl text-left shadow-xl">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <span className="text-lg">📖</span>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                How to Play
              </h2>
            </div>

            {/* Objective */}
            <div className="flex flex-col gap-2 bg-bg-secondary p-4 rounded-[4px] border border-border">
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent">The Goal</span>
              <p className="text-xs sm:text-sm text-text-primary leading-relaxed font-medium">
                Connect the <strong className="text-white">Start Film</strong> to the <strong className="text-accent">Target Film</strong> through shared actors, directors, writers, and producers in the fewest clicks and fastest time!
              </p>
            </div>

            {/* 3 Step Walkthrough Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
              <div className="bg-bg-secondary/80 p-3.5 rounded-[4px] border border-border flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-accent/20 text-accent font-mono text-xs font-bold flex items-center justify-center">1</span>
                  <span className="font-bold text-xs uppercase tracking-wider text-white">Pick a Person</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Start on the first movie. Check out its actors, director, or crew and click one to open their page.
                </p>
              </div>

              <div className="bg-bg-secondary/80 p-3.5 rounded-[4px] border border-border flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#ff8000]/20 text-[#ff8000] font-mono text-xs font-bold flex items-center justify-center">2</span>
                  <span className="font-bold text-xs uppercase tracking-wider text-white">Pick a Film</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Browse their filmography and click another film they worked on to jump to that movie&apos;s page.
                </p>
              </div>

              <div className="bg-bg-secondary/80 p-3.5 rounded-[4px] border border-border flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#40bcf4]/20 text-[#40bcf4] font-mono text-xs font-bold flex items-center justify-center">3</span>
                  <span className="font-bold text-xs uppercase tracking-wider text-white">Hit the Target</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Keep chaining until you select the Target Film to complete the puzzle and rank on the Leaderboard!
                </p>
              </div>
            </div>

            {/* Pro Tips & Rules List */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-border/70 text-xs text-text-secondary leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="text-accent font-bold mt-0.5">⚡</span>
                <p>
                  <strong className="text-white">Golden Rule:</strong> The chain must always alternate: <code className="text-accent bg-bg-secondary px-1.5 py-0.5 rounded font-mono text-[11px]">Film &rarr; Person &rarr; Film &rarr; Person</code>.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-[#40bcf4] font-bold mt-0.5">🔍</span>
                <p>
                  <strong className="text-white">Quick Search:</strong> Use the search bar inside the filter tab widget on any page to find specific actors or titles instantly without scrolling.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-[#ff8000] font-bold mt-0.5">⏪</span>
                <p>
                  <strong className="text-white">Rewind:</strong> Hit a dead end? Click any earlier movie in the breadcrumb trail at the top to retrace your steps anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-text-secondary bg-bg-card p-6 rounded-[4px] border border-border">
          Failed to load today&apos;s puzzle. Please refresh.
        </div>
      )}
    </main>
  );
}
