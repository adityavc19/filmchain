import React from 'react';

export type LogoVariant = 'connected-frames' | 'infinity-trail' | 'cinema-nodes' | 'minimal-mark';

interface LogoProps {
  variant?: LogoVariant;
  size?: number;
  className?: string;
  showText?: boolean;
}

export default function Logo({
  variant = 'connected-frames',
  size = 28,
  className = '',
  showText = false,
}: LogoProps) {
  const renderIcon = () => {
    switch (variant) {
      case 'connected-frames':
        // Two minimalist film cell frames linked by a glowing trail node line
        return (
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="ft-grad-1" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00e054" />
                <stop offset="50%" stopColor="#ff8000" />
                <stop offset="100%" stopColor="#40bcf4" />
              </linearGradient>
              <filter id="ft-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#00e054" floodOpacity="0.6" />
              </filter>
            </defs>
            {/* Left Film Frame */}
            <rect x="2" y="5" width="12" height="12" rx="2" stroke="#40bcf4" strokeWidth="1.75" fill="#1c2228" />
            <line x1="2" y1="8" x2="14" y2="8" stroke="#40bcf4" strokeWidth="1" strokeDasharray="1.5 1.5" />
            <line x1="2" y1="14" x2="14" y2="14" stroke="#40bcf4" strokeWidth="1" strokeDasharray="1.5 1.5" />
            
            {/* Right Film Frame */}
            <rect x="18" y="15" width="12" height="12" rx="2" stroke="#00e054" strokeWidth="1.75" fill="#1c2228" />
            <line x1="18" y1="18" x2="30" y2="18" stroke="#00e054" strokeWidth="1" strokeDasharray="1.5 1.5" />
            <line x1="18" y1="24" x2="30" y2="24" stroke="#00e054" strokeWidth="1" strokeDasharray="1.5 1.5" />

            {/* Glowing Trace Trail Line */}
            <path
              d="M 8 11 C 14 11 16 21 24 21"
              stroke="url(#ft-grad-1)"
              strokeWidth="2.2"
              strokeLinecap="round"
              filter="url(#ft-glow)"
            />
            {/* Start & End Nodes */}
            <circle cx="8" cy="11" r="2" fill="#40bcf4" />
            <circle cx="16" cy="16" r="1.5" fill="#ff8000" />
            <circle cx="24" cy="21" r="2" fill="#00e054" />
          </svg>
        );

      case 'infinity-trail':
        // Dual interlocking film reels with a node trail
        return (
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="ft-inf-grad" x1="2" y1="16" x2="30" y2="16" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00e054" />
                <stop offset="50%" stopColor="#ff8000" />
                <stop offset="100%" stopColor="#40bcf4" />
              </linearGradient>
            </defs>
            {/* Left Reel */}
            <circle cx="10" cy="16" r="7.5" stroke="#00e054" strokeWidth="1.75" strokeDasharray="2 1.5" />
            <circle cx="10" cy="16" r="2.5" fill="#00e054" />
            {/* Right Reel */}
            <circle cx="22" cy="16" r="7.5" stroke="#40bcf4" strokeWidth="1.75" strokeDasharray="2 1.5" />
            <circle cx="22" cy="16" r="2.5" fill="#40bcf4" />
            {/* Connecting S-Trail */}
            <path
              d="M 10 16 C 14 10 18 22 22 16"
              stroke="url(#ft-inf-grad)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="16" cy="16" r="1.5" fill="#ff8000" />
          </svg>
        );

      case 'cinema-nodes':
        // 3 signature glowing cinema nodes connected by a sharp vector trail
        return (
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="ft-node-grad" x1="4" y1="26" x2="28" y2="6" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#00e054" />
                <stop offset="50%" stopColor="#ff8000" />
                <stop offset="100%" stopColor="#40bcf4" />
              </linearGradient>
            </defs>
            {/* Background Aperture Ring */}
            <circle cx="16" cy="16" r="13" stroke="#2c3440" strokeWidth="1.5" />
            {/* Vector Path */}
            <polyline
              points="7,22 16,10 25,18"
              stroke="url(#ft-node-grad)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Node Dots */}
            <circle cx="7" cy="22" r="2.5" fill="#00e054" />
            <circle cx="16" cy="10" r="2.5" fill="#ff8000" />
            <circle cx="25" cy="18" r="2.5" fill="#40bcf4" />
          </svg>
        );

      case 'minimal-mark':
      default:
        // Ultra-minimal Letterboxd-inspired 3 connected dots with trace line
        return (
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00e054] shadow-[0_0_8px_rgba(0,224,84,0.6)]"></span>
            <span className="w-1.5 h-0.5 bg-border"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff8000] shadow-[0_0_8px_rgba(255,128,0,0.6)]"></span>
            <span className="w-1.5 h-0.5 bg-border"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#40bcf4] shadow-[0_0_8px_rgba(64,188,244,0.6)]"></span>
          </div>
        );
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {renderIcon()}
      {showText && (
        <span className="font-black tracking-tight text-lg text-white">
          FILMTRACE
        </span>
      )}
    </div>
  );
}
