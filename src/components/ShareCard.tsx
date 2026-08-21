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

    return `🎬 FILMCHAIN — ${dateFormatted}\n⏱ ${timeStr} · ${hopCount} hops\n${pathEmojis}\nhttps://filmchain.app`;
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
    <div className="flex flex-col items-center gap-4 p-5 bg-bg-card rounded-[4px] border border-border w-full shadow-lg">
      <div className="w-full text-left">
        <span className="text-[11px] font-bold uppercase tracking-wider text-accent block mb-2">Share Score</span>
        <pre className="bg-bg-secondary p-3.5 rounded-[4px] border border-border text-xs text-text-secondary font-mono whitespace-pre-wrap leading-relaxed select-all">
          {generateText()}
        </pre>
      </div>

      <button
        onClick={handleCopy}
        className="w-full py-2.5 bg-accent text-bg-primary text-xs font-bold uppercase tracking-wider rounded-[4px] hover:bg-accent-dim transition-all shadow-[0_0_12px_rgba(0,224,84,0.3)] cursor-pointer"
      >
        {copied ? '✓ Copied to Clipboard!' : 'Copy Result'}
      </button>
    </div>
  );
}
