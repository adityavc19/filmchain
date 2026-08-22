'use client';
import { useState } from 'react';
import { PathStep } from '@/lib/supabase';

interface ShareCardProps {
  date: string;
  time: number;
  hopCount: number;
  path: PathStep[];
}

export default function ShareCard({ date, time, hopCount, path }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const generateText = () => {
    const dateFormatted = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = formatTime(time);

    // Convert path to emojis
    const pathEmojis = path.map(step => step.type === 'film' ? '🎬' : '👤').join(' › ');

    return `🎬 FILM SPEEDRUN • ${dateFormatted}\n⏱ ${timeStr} · ${hopCount} hops\n${pathEmojis}\nhttps://filmspeedrun.surge.sh`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="w-full py-3 px-5 bg-white text-[#0e1114] hover:bg-white/90 text-xs font-bold uppercase tracking-wider rounded-[4px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
      <span>{copied ? 'Copied to Clipboard!' : 'Share'}</span>
    </button>
  );
}
