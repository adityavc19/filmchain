'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { getOrCreateHandle } from '@/lib/handle';
import { Compass, Plus, Trophy, User } from 'lucide-react';

export default function Navbar() {
  const [handle, setHandle] = useState('');

  useEffect(() => {
    setHandle(getOrCreateHandle());
  }, []);

  return (
    <header className="border-b border-[#242c35] bg-[#0e1114] sticky top-0 z-50 shadow-md">
      <div className="max-w-5xl mx-auto px-4 min-h-[56px] flex items-center justify-between flex-wrap gap-2">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Logo variant="connected-frames" size={26} />
          <span className="font-black tracking-tight text-lg text-white group-hover:text-[#9ab0c2] transition-colors">
            FILMTRACE
          </span>
        </Link>

        <nav className="flex items-center gap-3 sm:gap-5 text-xs font-medium">
          <Link 
            href="/community" 
            className="flex items-center gap-1.5 py-1 text-text-secondary hover:text-white transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-[#40bcf4]" />
            <span>Community</span>
          </Link>
          <Link 
            href="/create" 
            className="flex items-center gap-1.5 py-1 text-text-secondary hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-text-secondary" />
            <span>Create</span>
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
              title={`Profile (@${handle})`}
              className="w-8 h-8 rounded-full bg-[#1c242c] hover:bg-[#28323e] text-text-secondary hover:text-white border border-[#28323e] flex items-center justify-center transition-colors ml-1"
            >
              <User className="w-4 h-4 text-text-secondary" />
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
