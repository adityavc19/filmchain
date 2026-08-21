import { LeaderboardEntryRow } from '@/lib/supabase';

interface LeaderboardProps {
  entries: LeaderboardEntryRow[];
  currentHandle?: string;
}

export default function Leaderboard({ entries, currentHandle }: LeaderboardProps) {
  return (
    <div className="w-full bg-bg-card rounded-[4px] border border-border overflow-hidden shadow-xl">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-bg-secondary border-b border-border text-text-secondary uppercase tracking-wider text-[10px] font-semibold">
            <th className="py-3 px-4 w-12 text-center">Pos</th>
            <th className="py-3 px-4">Player</th>
            <th className="py-3 px-4 text-right">Time</th>
            <th className="py-3 px-4 text-right">Hops</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {entries.slice(0, 20).map((entry, index) => {
            const rank = index + 1;
            const isCurrent = entry.handle === currentHandle;

            let rankBadge = "text-text-muted";
            if (rank === 1) rankBadge = "text-[#f5c518] font-bold";
            else if (rank === 2) rankBadge = "text-[#c0c0c0] font-bold";
            else if (rank === 3) rankBadge = "text-[#cd7f32] font-bold";

            const minutes = Math.floor(entry.time_seconds / 60);
            const seconds = (entry.time_seconds % 60).toFixed(1);

            return (
              <tr
                key={entry.id || index}
                className={`hover:bg-bg-hover transition-colors ${
                  isCurrent ? 'bg-white/10' : ''
                }`}
              >
                <td className={`py-3 px-4 text-center font-mono ${rankBadge}`}>
                  {rank === 1 ? '★ 1' : rank}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`font-semibold ${
                      isCurrent ? 'text-white' : 'text-text-primary'
                    }`}
                  >
                    {entry.handle}
                  </span>
                  {isCurrent && (
                    <span className="ml-2 text-[9px] uppercase font-bold text-white bg-white/10 px-1.5 py-0.5 rounded border border-white/20">
                      You
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right font-mono text-text-secondary">
                  {minutes > 0 ? `${minutes}m ` : ''}{seconds}s
                </td>
                <td className="py-3 px-4 text-right font-mono text-text-secondary">
                  {entry.hop_count}
                </td>
              </tr>
            );
          })}
          {entries.length === 0 && (
            <tr>
              <td colSpan={4} className="py-8 text-center text-text-muted">
                No solvers yet today. Be the first to log a path!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
