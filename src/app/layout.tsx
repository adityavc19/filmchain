import type { Metadata } from 'next';
import { Inter, Newsreader } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const newsreader = Newsreader({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-newsreader' });

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
      <body className={`${inter.className} ${newsreader.variable} min-h-screen flex flex-col bg-bg-primary text-text-primary antialiased`}>
        {/* Top Header Navigation */}
        <Navbar />

        {/* Main Content */}
        <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 box-border">
          {children}
        </div>

        {/* Footer */}
        <footer className="border-t border-[#2c3440] bg-[#14181c] py-6 mt-auto">
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-text-secondary">Filmtrace</span> &mdash; Two films. One trail.
            </div>
            <div className="flex items-center gap-1.5 text-text-secondary">
              <span>Made with ❤️ and too many movie rewatches by</span>
              <a 
                href="https://github.com/adityavc19" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-bold text-white hover:text-accent underline underline-offset-2 transition-colors"
              >
                Aditya
              </a>
            </div>
            <div className="text-[11px] text-text-muted">Film data powered by TMDb</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
