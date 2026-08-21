import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

import Logo from '@/components/Logo';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Filmtrace — Two films. One trail. How fast can you connect them?',
  description: 'Two films. One trail. How fast can you connect them?',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col bg-bg-primary text-text-primary antialiased`}>
        {/* Top Header Navigation */}
        <header className="border-b border-border bg-bg-primary/95 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 min-h-[56px] flex items-center justify-between flex-wrap gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <Logo variant="connected-frames" size={30} />
              <span className="font-black tracking-tight text-lg text-white group-hover:text-accent transition-colors">
                FILMTRACE
              </span>
            </Link>

            <nav className="flex items-center gap-3 sm:gap-4 text-xs font-semibold">
              <Link href="/" className="px-3 py-1 text-text-secondary hover:text-white transition-colors">
                Daily Puzzle
              </Link>
              <Link href="/leaderboard" className="px-3 py-1 text-text-secondary hover:text-white transition-colors">
                Leaderboard
              </Link>
              <span className="px-3 py-1 text-text-muted flex items-center gap-1.5 cursor-default">
                Freeform <span className="text-[9px] bg-bg-secondary border border-border px-1.5 py-0.5 rounded font-mono">SOON</span>
              </span>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 box-border">
          {children}
        </div>

        {/* Footer */}
        <footer className="border-t border-border bg-bg-secondary py-6 mt-auto">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-secondary">Filmtrace</span> — Two films. One trail. How fast can you connect them?
            </div>
            <div>Film data powered by TMDb</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
