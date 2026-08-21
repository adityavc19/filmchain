import { PathStep } from '@/lib/supabase';

interface BreadcrumbProps {
  path: PathStep[];
}

export default function Breadcrumb({ path }: BreadcrumbProps) {
  return (
    <div className="w-full overflow-x-auto pb-1 hide-scrollbar">
      <div className="flex items-center gap-1.5 whitespace-nowrap min-w-max text-xs">
        {path.map((step, index) => {
          const isLast = index === path.length - 1;
          const isFilm = step.type === 'film';

          return (
            <div key={`${step.id}-${index}`} className="flex items-center gap-1.5">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border font-medium transition-all ${
                  isLast
                    ? 'bg-transparent border-accent text-accent font-semibold'
                    : 'bg-bg-secondary border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="text-[11px] opacity-70 font-mono">#{index + 1}</span>
                <span>{isFilm ? '🎬' : '👤'}</span>
                <span className="max-w-[150px] truncate" title={step.name}>
                  {step.name}
                </span>
              </div>

              {!isLast && (
                <span className="text-text-muted text-xs font-bold px-0.5">›</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
