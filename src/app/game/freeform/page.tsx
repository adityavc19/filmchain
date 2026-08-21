import Link from 'next/link';

export default function FreeformPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 min-h-[60vh]">
      <h1 className="text-4xl font-bold text-accent">Freeform Mode</h1>
      <p className="text-xl text-text-secondary max-w-md">
        Set your own starting and ending films to challenge yourself or friends.
      </p>
      
      <div className="bg-bg-card border border-border p-8 rounded-xl shadow-lg my-8">
        <span className="bg-accent/20 text-accent px-4 py-2 rounded-full font-bold uppercase tracking-widest text-sm">
          Coming Soon
        </span>
      </div>
      
      <Link href="/" className="text-text-muted hover:text-text-primary transition-colors flex items-center gap-2">
        <span>←</span> Back to Today's Puzzle
      </Link>
    </div>
  );
}
