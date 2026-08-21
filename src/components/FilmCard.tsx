import Image from 'next/image';
import { posterUrl } from '@/lib/tmdb';

interface FilmCardProps {
  tmdbId: number;
  title: string;
  year?: number | null;
  posterPath: string | null;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  character?: string;
  isTarget?: boolean;
}

export default function FilmCard({
  tmdbId,
  title,
  year,
  posterPath,
  onClick,
  size = 'md',
  character,
  isTarget,
}: FilmCardProps) {
  return (
    <div
      onClick={onClick}
      className={`group flex flex-col gap-1.5 transition-all select-none w-full ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      {/* Poster Container with exact 2:3 movie poster aspect ratio */}
      <div
        className={`relative w-full aspect-[2/3] rounded-[4px] overflow-hidden bg-bg-card border transition-all duration-200 ${
          isTarget
            ? 'border-accent ring-2 ring-accent/50 shadow-[0_0_16px_rgba(0,224,84,0.4)]'
            : 'border-white/10 group-hover:border-accent group-hover:shadow-[0_0_12px_rgba(0,224,84,0.25)]'
        }`}
      >
        {posterPath ? (
          <Image
            src={posterUrl(posterPath, size === 'lg' ? 'w500' : 'w342')}
            alt={title}
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 15vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-bg-secondary text-text-muted text-xs">
            <span className="text-2xl mb-1 opacity-50">🎬</span>
            <span className="line-clamp-2">{title}</span>
          </div>
        )}

        {/* Target Badge */}
        {isTarget && (
          <div className="absolute top-1.5 right-1.5 bg-accent text-bg-primary text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow">
            TARGET
          </div>
        )}

        {/* Letterboxd-style hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center pointer-events-none">
          <span className="text-white text-xs font-semibold drop-shadow">Select Film</span>
        </div>
      </div>

      {/* Meta Text */}
      <div className="flex flex-col text-left">
        <span
          className="font-medium text-text-primary text-xs line-clamp-1 group-hover:text-accent transition-colors leading-tight"
          title={title}
        >
          {title}
        </span>
        <div className="flex items-center justify-between text-[11px] text-text-secondary mt-0.5">
          {year && <span>{year}</span>}
          {character && <span className="truncate max-w-[80px] text-text-muted text-[10px]" title={character}>{character}</span>}
        </div>
      </div>
    </div>
  );
}
