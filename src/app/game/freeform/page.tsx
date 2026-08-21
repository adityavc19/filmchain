import Link from 'next/link';

export default function CreatePuzzlePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 min-h-[60vh]">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Create Puzzle</h1>
      <p className="text-sm sm:text-base text-text-secondary max-w-md">
        Set custom starting and target films to challenge friends with your own movie trails.
      </p>
      
      <div className="bg-bg-card border border-border p-6 sm:p-8 rounded-[4px] shadow-lg my-4">
        <span className="bg-accent/20 text-accent px-4 py-2 rounded font-bold uppercase tracking-widest text-xs border border-accent/30">
          Coming Soon
        </span>
      </div>
      
      <Link href="/" className="text-xs text-text-muted hover:text-white transition-colors flex items-center gap-2">
        <span>←</span> Back to Today&apos;s Puzzle
      </Link>
    </div>
  );
}
