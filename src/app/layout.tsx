import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Filmtrace — Connect the dots between films',
  description: 'Connect movies through shared actors, directors, and crew.',
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
          <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
            <div className="flex items-center gap-1.5 text-text-secondary">
              <span>Made with passion and late-night cinema by</span>
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
