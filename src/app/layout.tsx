import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FilmChain — Movie Connections Game',
  description: 'Connect movies through shared cast and crew members.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col bg-bg-primary text-text-primary antialiased`}>
        {/* Letterboxd-inspired Nav Bar */}
        <header className="border-b border-border bg-bg-secondary/90 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              {/* Iconic 3 circles */}
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00e054] shadow-[0_0_8px_rgba(0,224,84,0.6)]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff8000] shadow-[0_0_8px_rgba(255,128,0,0.6)]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#40bcf4] shadow-[0_0_8px_rgba(64,188,244,0.6)]"></span>
              </div>
              <span className="font-bold tracking-tight text-lg text-text-primary group-hover:text-accent transition-colors">
                FILMCHAIN
              </span>
            </Link>

            <nav className="flex items-center gap-5 text-xs font-semibold uppercase tracking-wider text-text-secondary">
              <Link href="/" className="hover:text-text-primary transition-colors">Daily Puzzle</Link>
              <Link href="/game/freeform" className="hover:text-text-primary transition-colors">Freeform</Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </div>

        {/* Footer */}
        <footer className="border-t border-border bg-bg-secondary py-6 mt-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-secondary">FilmChain</span> — Inspired by film connections
            </div>
            <div>Film data powered by TMDb</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
