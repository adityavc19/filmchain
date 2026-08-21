import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Filmtrace — Two films. How do you connect them?',
  description: 'Connect movies through shared actors, directors, and crew. Play daily challenges and compete on the live leaderboard.',
  metadataBase: new URL('https://filmtrace.surge.sh'),
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
    url: 'https://filmtrace.surge.sh',
    title: 'Filmtrace — Two films. How do you connect them?',
    description: 'Connect movies through shared actors, directors, and crew. Play daily challenges and compete on the live leaderboard.',
    siteName: 'Filmtrace',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Filmtrace — Two films. How do you connect them?',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Filmtrace — Two films. How do you connect them?',
    description: 'Connect movies through shared actors, directors, and crew. Play daily challenges and compete on the live leaderboard.',
    images: ['/og-image.png'],
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
        <footer className="border-t border-[#242c35] bg-[#0e1114] py-7 mt-auto">
          <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-muted">
            <div className="flex items-center gap-3 text-text-secondary flex-wrap justify-center sm:justify-start">
              <span>Made with passion and late-night cinema by</span>
              <a 
                href="https://github.com/adityavc19" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-bold text-white hover:text-[#40bcf4] underline underline-offset-2 transition-colors"
              >
                Aditya
              </a>

              <span className="text-[#28323e]">|</span>

              {/* Social Profiles */}
              <div className="flex items-center gap-2.5">
                <a
                  href="https://x.com/ChasingImpetus"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2 py-1 bg-[#182028] hover:bg-[#222c38] text-text-secondary hover:text-white border border-[#28323e] rounded-[4px] transition-all font-medium text-[11px]"
                  title="Follow on X / Twitter (@ChasingImpetus)"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  <span>@ChasingImpetus</span>
                </a>

                <a
                  href="https://www.instagram.com/chasingimpetus/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2 py-1 bg-[#182028] hover:bg-[#222c38] text-text-secondary hover:text-[#e1306c] border border-[#28323e] rounded-[4px] transition-all font-medium text-[11px]"
                  title="Follow on Instagram (@chasingimpetus)"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  <span>@chasingimpetus</span>
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
