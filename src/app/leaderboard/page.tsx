'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LeaderboardEntryRow } from '@/lib/supabase';
import { getOrCreateHandle } from '@/lib/handle';

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntryRow[]>([]);
  const [handle] = useState(() => getOrCreateHandle());
  const [loading, setLoading] = useState(true);
  const [todayDate, setTodayDate] = useState<string>('');

  useEffect(() => {
    fetch('/api/puzzle/today')
      .then(res => res.json())
      .then(puzzleData => {
        const d = puzzleData.date;
        setTodayDate(d);
        return fetch(`/api/leaderboard/${d}`);
      })
      .then(res => res.json())
      .then(data => {
        setEntries(data.entries || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto py-8 text-center">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Leaderboard</h1>
      <p className="text-xs text-text-muted mb-4">Today&apos;s fastest chains</p>

      <div className="flex flex-col gap-0 bg-bg-secondary border border-border rounded-[4px] p-5 w-full shadow-2xl">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase text-text-secondary">
              <th className="py-2.5 px-1.5 text-center w-10">Pos</th>
              <th className="py-2.5 px-1.5 text-left">Player</th>
              <th className="py-2.5 px-1.5 text-right">Time</th>
              <th className="py-2.5 px-1.5 text-right">Clicks</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-text-muted">
                  <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading leaderboard...
                </td>
              </tr>
            ) : entries.length > 0 ? (
              entries.map((entry, idx) => {
                const isYou = entry.handle === handle;
                const rankColors: Record<number, string> = { 1: '#00e054', 2: '#40bcf4', 3: '#ff8000' };
                const rankColor = rankColors[idx + 1] || '#667788';
                const mins = Math.floor(entry.time_seconds / 60);
                const secs = entry.time_seconds % 60;

                return (
                  <tr key={entry.id || idx} className={`border-b border-border/50 ${isYou ? 'bg-accent/10' : ''}`}>
                    <td className="py-2.5 px-1.5 text-center font-mono font-bold" style={{ color: rankColor }}>
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-1.5 text-left font-medium">
                      <span className={isYou ? 'text-accent font-bold' : 'text-white'}>
                        {entry.handle} {isYou ? '(You)' : ''}
                      </span>
                    </td>
                    <td className="py-2.5 px-1.5 text-right font-mono text-text-secondary">
                      {mins}:{String(secs).padStart(2, '0')}
                    </td>
                    <td className="py-2.5 px-1.5 text-right font-mono text-text-secondary">
                      {entry.path ? Math.max(0, entry.path.length - 1) : entry.hop_count * 2}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-text-muted">
                  No scores logged today yet. Be the first to solve!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {todayDate && (
        <Link
          href={`/game/${todayDate}`}
          className="mt-6 w-full max-w-[260px] py-3 bg-accent text-bg-primary text-xs font-bold uppercase tracking-wider rounded-[4px] hover:bg-accent-dim transition-all shadow-[0_0_16px_rgba(0,224,84,0.3)]"
        >
          Play Today&apos;s Puzzle
        </Link>
      )}
    </div>
  );
}
