'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { getOrCreateHandle } from '@/lib/handle';

export default function Navbar() {
  const [handle, setHandle] = useState('');

  useEffect(() => {
    setHandle(getOrCreateHandle());
  }, []);

  return (
    <header className="border-b border-border bg-bg-primary/95 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 min-h-[56px] flex items-center justify-between flex-wrap gap-2">
        <Link href="/" className="flex items-center gap-2 group">
          <Logo variant="connected-frames" size={30} />
          <span className="font-black tracking-tight text-lg text-white group-hover:text-accent transition-colors">
            FILMTRACE
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3 text-xs font-semibold">
          <Link href="/" className="px-2.5 py-1 text-text-secondary hover:text-white transition-colors">
            Daily Puzzle
          </Link>
          <Link href="/create" className="px-2.5 py-1 text-text-secondary hover:text-white transition-colors">
            Create Puzzle
          </Link>
          <Link href="/leaderboard" className="px-2.5 py-1 text-text-secondary hover:text-white transition-colors">
            Leaderboard
          </Link>

          {handle && (
            <Link
              href={`/profile/${handle}`}
              className="flex items-center gap-1.5 bg-bg-secondary hover:bg-bg-hover text-white border border-border px-2.5 py-1 rounded-[4px] font-mono text-[11px] transition-colors ml-1"
            >
              <span className="w-2 h-2 rounded-full bg-accent"></span>
              <span>@{handle}</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
