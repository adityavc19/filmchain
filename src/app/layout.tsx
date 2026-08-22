import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Film Speedrun: Two films. How fast can you connect them?',
  description: 'Trace the shortest path between two films traversing through the cast & crew. Play daily cinephile challenges and climb the live leaderboard.',
  metadataBase: new URL('https://filmspeedrun.surge.sh'),
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    url: 'https://filmspeedrun.surge.sh',
    title: 'Film Speedrun: Two films. How fast can you connect them?',
    description: 'Trace the shortest path between two films traversing through the cast & crew. Play daily cinephile challenges and climb the live leaderboard.',
    siteName: 'Film Speedrun',
    images: [
      {
        url: 'https://filmspeedrun.surge.sh/og-image-v2.png',
        width: 1200,
        height: 630,
        alt: 'Film Speedrun: Two films. How fast can you connect them?',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Film Speedrun: Two films. How fast can you connect them?',
    description: 'Trace the shortest path between two films traversing through the cast & crew. Play daily cinephile challenges and climb the live leaderboard.',
    images: ['https://filmspeedrun.surge.sh/og-image-v2.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col bg-[#161c22] text-text-primary antialiased`}>
        {/* Top Header Navigation */}
        <Navbar />

        {/* Main Content */}
        <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 box-border">
          {children}
        </div>

        {/* Footer */}
        <footer className="border-t border-[#242c35] bg-[#0e1114] py-6 mt-auto">
          <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-muted">
            <div className="flex items-center gap-3 text-text-secondary flex-wrap justify-center sm:justify-start">
              <span>Made by Aditya</span>

              <span className="text-[#28323e]">|</span>

              {/* Social Profiles (Icon Only) */}
              <div className="flex items-center gap-2">
                <a
                  href="https://x.com/ChasingImpetus"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-[4px] bg-[#182028] hover:bg-[#222c38] text-text-secondary hover:text-white border border-[#28323e] flex items-center justify-center transition-colors"
                  title="X (@ChasingImpetus)"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>

                <a
                  href="https://letterboxd.com/AdityaChauhan/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-[4px] bg-[#182028] hover:bg-[#222c38] text-text-secondary hover:text-[#00e054] border border-[#28323e] flex items-center justify-center transition-colors"
                  title="Letterboxd (@AdityaChauhan)"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="4.5" cy="12" r="3.5"/>
                    <circle cx="12" cy="12" r="3.5"/>
                    <circle cx="19.5" cy="12" r="3.5"/>
                  </svg>
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-text-muted">
              <span>Film data powered by TMDb</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
