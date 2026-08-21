'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { getOrCreateHandle } from '@/lib/handle';
import { Clapperboard, Plus, Trophy, User } from 'lucide-react';

export default function Navbar() {
  const [handle, setHandle] = useState('');

  useEffect(() => {
    setHandle(getOrCreateHandle());
  }, []);

  return (
    <header className="border-b border-[#2c3440] bg-[#14181c] sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 min-h-[56px] flex items-center justify-between flex-wrap gap-2">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Logo variant="connected-frames" size={26} />
          <span className="font-black tracking-tight text-lg text-white group-hover:text-accent transition-colors">
            FILMTRACE
          </span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-5 text-xs font-medium">
          <Link 
            href="/" 
            className="flex items-center gap-1.5 py-1 text-text-secondary hover:text-white transition-colors"
          >
            <Clapperboard className="w-3.5 h-3.5" />
            <span>Daily Puzzle</span>
          </Link>
          <Link 
            href="/create" 
            className="flex items-center gap-1.5 py-1 text-text-secondary hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-accent" />
            <span>Create Game</span>
          </Link>
          <Link 
            href="/leaderboard" 
            className="flex items-center gap-1.5 py-1 text-text-secondary hover:text-white transition-colors"
          >
            <Trophy className="w-3.5 h-3.5 text-[#ff8000]" />
            <span>Leaderboard</span>
          </Link>

          {handle && (
            <Link
              href={`/profile/${handle}`}
              className="flex items-center gap-2 py-1 pl-2 pr-2.5 rounded-full bg-[#1e262f] hover:bg-[#2c3440] text-text-secondary hover:text-white border border-[#2c3440] transition-colors ml-1"
            >
              <div className="w-5 h-5 rounded-full bg-[#2c3440] text-accent flex items-center justify-center text-[10px] font-bold">
                <User className="w-3 h-3" />
              </div>
              <span className="font-mono text-[11px] text-white">@{handle}</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
