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
    <main className="flex flex-col items-center justify-center min-h-[70vh] gap-10 text-center py-8 max-w-4xl mx-auto w-full">
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-text-secondary">Loading Today&apos;s Puzzle...</p>
        </div>
      ) : puzzle && puzzle.startFilm && puzzle.endFilm ? (
        <div className="flex flex-col items-center gap-10 w-full">
          {/* Header Title Section */}
          <div className="flex flex-col items-center gap-3.5 max-w-xl">
            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
              FILMTRACE
            </h1>

            <p className="text-sm sm:text-base text-text-secondary max-w-md leading-relaxed font-medium">
              Two films. One trail. How fast can you connect them?
            </p>
          </div>

          {/* Connected Films Posters */}
          <div className="flex items-center justify-center gap-5 sm:gap-8">
            {/* Start Film */}
            <div className="flex flex-col items-center gap-2.5">
              <div className="relative w-[132px] h-[198px] rounded-[4px] overflow-hidden bg-bg-secondary border border-border shadow-lg">
                {puzzle.startFilm.poster_path ? (
                  <Image
                    src={posterUrl(puzzle.startFilm.poster_path, 'w342')}
                    alt={puzzle.startFilm.title}
                    fill
                    sizes="132px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-text-muted p-2 font-mono">
                    {puzzle.startFilm.title}
                  </div>
                )}
              </div>
              <span className="font-bold text-sm text-white max-w-[132px] truncate">{puzzle.startFilm.title}</span>
              {puzzle.startFilm.year && (
                <span className="text-xs text-text-secondary">{puzzle.startFilm.year}</span>
              )}
            </div>

            {/* Connecting Dotted Line */}
            <div className="w-8 sm:w-12 h-px bg-border/80 self-center mb-8"></div>

            {/* Target Film */}
            <div className="flex flex-col items-center gap-2.5">
              <div className="relative w-[132px] h-[198px] rounded-[4px] overflow-hidden bg-bg-secondary border-2 border-accent shadow-[0_0_16px_rgba(0,224,84,0.3)]">
                {puzzle.endFilm.poster_path ? (
                  <Image
                    src={posterUrl(puzzle.endFilm.poster_path, 'w342')}
                    alt={puzzle.endFilm.title}
                    fill
                    sizes="132px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-text-muted p-2 font-mono">
                    {puzzle.endFilm.title}
                  </div>
                )}
              </div>
              <span className="font-bold text-sm text-white max-w-[132px] truncate">{puzzle.endFilm.title}</span>
              {puzzle.endFilm.year && (
                <span className="text-xs text-text-secondary">{puzzle.endFilm.year}</span>
              )}
            </div>
          </div>

          {/* Action Area */}
          <div className="flex flex-col items-center gap-3 w-full">
            <button
              onClick={() => router.push(`/game/${puzzle.date}`)}
              className="w-full max-w-[260px] py-3 bg-accent text-bg-primary text-xs sm:text-sm font-bold uppercase tracking-wider rounded-[4px] hover:bg-accent-dim transition-all shadow-[0_0_16px_rgba(0,224,84,0.35)] cursor-pointer"
            >
              Play Today&apos;s Puzzle
            </button>

            <span className="text-[11px] text-text-muted">
              {puzzle.playerCount ? `${puzzle.playerCount.toLocaleString()} solves logged` : 'Be the first to solve today'}
            </span>
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
