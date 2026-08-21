'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FilmCard from '@/components/FilmCard';

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
    <main className="flex flex-col items-center justify-center min-h-[75vh] gap-8 text-center py-4">
      {/* Editorial Title */}
      <div className="flex flex-col items-center gap-2 max-w-lg">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#00e054]"></span>
          <span className="w-2 h-2 rounded-full bg-[#ff8000]"></span>
          <span className="w-2 h-2 rounded-full bg-[#40bcf4]"></span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-text-secondary ml-1">
            Daily Movie Connections
          </span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight">
          FILMCHAIN
        </h1>
        <p className="text-sm sm:text-base text-text-secondary">
          Traverse shared cast and crew members to link two films in the fewest hops possible.
        </p>
      </div>

      {/* Main Challenge Board */}
      {loading ? (
        <div className="animate-pulse flex gap-6 items-center p-8 bg-bg-card rounded-[4px] border border-border">
          <div className="w-36 h-52 bg-bg-secondary rounded-[4px]"></div>
          <div className="text-2xl text-text-muted">›</div>
          <div className="w-36 h-52 bg-bg-secondary rounded-[4px]"></div>
        </div>
      ) : puzzle && puzzle.startFilm && puzzle.endFilm ? (
        <div className="flex flex-col items-center gap-6 bg-bg-card p-6 sm:p-8 rounded-[4px] border border-border w-full max-w-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between w-full border-b border-border/80 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              Daily Challenge #{puzzle.date}
            </span>
            <span className="text-[11px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
              {puzzle.minHops ? `Min ${Math.floor(puzzle.minHops / 2)} hops` : 'Ready'}
            </span>
          </div>

          {/* Connected Films Posters */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 w-full py-2">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-bg-secondary px-2 py-0.5 rounded border border-border">
                START
              </span>
              <FilmCard
                tmdbId={puzzle.startFilm.tmdb_id}
                title={puzzle.startFilm.title}
                year={puzzle.startFilm.year}
                posterPath={puzzle.startFilm.poster_path}
                size="md"
              />
            </div>

            <div className="flex flex-col items-center gap-1 text-accent my-auto">
              <span className="text-3xl sm:text-4xl font-light">›</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/30">
                TARGET
              </span>
              <FilmCard
                tmdbId={puzzle.endFilm.tmdb_id}
                title={puzzle.endFilm.title}
                year={puzzle.endFilm.year}
                posterPath={puzzle.endFilm.poster_path}
                size="md"
                isTarget
              />
            </div>
          </div>

          {/* Action Area */}
          <div className="flex flex-col items-center gap-3 w-full border-t border-border/80 pt-5">
            <button
              onClick={() => router.push(`/game/${puzzle.date}`)}
              className="w-full sm:w-64 py-3 bg-accent text-bg-primary text-sm font-bold uppercase tracking-wider rounded-[4px] hover:bg-accent-dim transition-all shadow-[0_0_16px_rgba(0,224,84,0.35)] cursor-pointer"
            >
              Play Today&apos;s Puzzle
            </button>

            <div className="text-[11px] text-text-secondary flex items-center gap-2">
              <span>👥 {puzzle.playerCount} solves logged</span>
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
