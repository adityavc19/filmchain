import Image from 'next/image';
import { profileUrl } from '@/lib/tmdb';

interface PersonCardProps {
  tmdbId: number;
  name: string;
  profilePath: string | null;
  role?: string;
  job?: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function PersonCard({
  tmdbId,
  name,
  profilePath,
  role,
  job,
  onClick,
  size = 'sm',
}: PersonCardProps) {
  // If both acting character and crew jobs exist, combine them
  const subtitle = role && job ? `${role} · ${job}` : (job || role);

  return (
    <div
      onClick={onClick}
      className={`group flex flex-col gap-1.5 transition-all select-none w-full ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      {/* Portrait Container */}
      <div
        className="relative w-full aspect-[2/3] rounded-[4px] overflow-hidden bg-bg-card border border-white/10 group-hover:border-accent group-hover:shadow-[0_0_12px_rgba(0,224,84,0.25)] transition-all duration-200"
      >
        {profilePath ? (
          <Image
            src={profileUrl(profilePath, 'w185')}
            alt={name}
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 15vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-bg-secondary text-text-muted text-xs">
            <span className="text-3xl mb-1 opacity-40">👤</span>
            <span className="line-clamp-2 text-[11px]">{name}</span>
          </div>
        )}

        {/* Letterboxd-style hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 text-center pointer-events-none">
          <span className="text-white text-xs font-semibold drop-shadow">Select</span>
        </div>
      </div>

      {/* Meta Text */}
      <div className="flex flex-col text-left">
        <span
          className="font-medium text-text-primary text-xs line-clamp-1 group-hover:text-accent transition-colors leading-tight"
          title={name}
        >
          {name}
        </span>
        {subtitle && (
          <span
            className="text-[11px] text-text-secondary line-clamp-2 leading-tight mt-0.5"
            title={subtitle}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
