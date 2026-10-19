import React from 'react';

export interface LexiLogoProps {
  variant?: 'symbol' | 'full' | 'splash';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
}

export const LexiLogoSymbol: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Primary Lexi Gradient */}
        <linearGradient id="lexi-grad-primary" x1="8" y1="8" x2="38" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4338CA" />
          <stop offset="60%" stopColor="#232655" />
          <stop offset="100%" stopColor="#1E1C44" />
        </linearGradient>

        {/* Accent Soft Lavender Loop */}
        <linearGradient id="lexi-grad-accent" x1="16" y1="12" x2="38" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#646AA4" />
        </linearGradient>

        {/* Warm Sparkle Glow */}
        <linearGradient id="lexi-spark-grad" x1="33" y1="6" x2="41" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF8A65" />
          <stop offset="100%" stopColor="#FF6243" />
        </linearGradient>

        {/* Soft Drop Shadow Filter for Depth */}
        <filter id="lexi-glow" x="0" y="0" width="48" height="48" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#232655" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Outer rounded speech & learning tile base */}
      <rect
        x="4"
        y="4"
        width="40"
        height="40"
        rx="12"
        fill="#F0F2FE"
        stroke="#E0E3FA"
        strokeWidth="1.5"
      />

      {/* Modern stylized 'L' speech flow loop */}
      <g filter="url(#lexi-glow)">
        {/* Vertical stem of the L representing structured dialogue */}
        <path
          d="M15 13C15 11.8954 15.8954 11 17 11H19C20.1046 11 21 11.8954 21 13V27.5C21 28.3284 21.6716 29 22.5 29H32C33.1046 29 34 29.8954 34 31C34 32.1046 33.1046 33 32 33H19C16.7909 33 15 31.2091 15 29V13Z"
          fill="url(#lexi-grad-primary)"
        />

        {/* Interlocking dialogue bubble loop forming the warm upper curve of learning */}
        <path
          d="M23 15.5C23 14.1193 24.1193 13 25.5 13H28.5C31.5376 13 34 15.4624 34 18.5C34 21.5376 31.5376 24 28.5 24H25.5C24.1193 24 23 22.8807 23 21.5V15.5Z"
          fill="url(#lexi-grad-accent)"
          fillOpacity="0.9"
        />

        {/* Small speech tail notch */}
        <path
          d="M24 24L21.5 26.5V23.5L24 24Z"
          fill="url(#lexi-grad-accent)"
        />
      </g>

      {/* Lexi 4-point Sparkle ✦ at top-right representing enlightenment & mastery */}
      <path
        d="M37 6C37 9 39.5 11 42 11C39.5 11 37 13 37 16C37 13 34.5 11 32 11C34.5 11 37 9 37 6Z"
        fill="url(#lexi-spark-grad)"
      />
    </svg>
  );
};

export const LexiLogo: React.FC<LexiLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  showSubtitle = true,
}) => {
  const pixelSizes = {
    sm: 24,
    md: 34,
    lg: 44,
    xl: 64,
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl',
  };

  const iconPx = pixelSizes[size];

  if (variant === 'symbol') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <LexiLogoSymbol size={iconPx} />
      </div>
    );
  }

  if (variant === 'splash') {
    return (
      <div className={`flex flex-col items-center justify-center text-center ${className}`}>
        <div className="relative mb-4">
          <LexiLogoSymbol size={80} className="drop-shadow-lg" />
          <div className="absolute -inset-2 bg-gradient-to-r from-[#646AA4]/20 to-[#818CF8]/20 rounded-2xl blur-md -z-10" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-4xl font-extrabold tracking-tight text-[#222149]">
            Lexi
          </span>
          <span className="text-[#FF6243] text-2xl font-bold select-none" aria-hidden="true">
            ✦
          </span>
        </div>
        {showSubtitle && (
          <p className="text-sm font-medium text-[#646AA4] mt-1 tracking-wider uppercase">
            Your English Companion
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LexiLogoSymbol size={iconPx} />
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className={`${titleSizes[size]} font-extrabold tracking-tight text-[#222149] leading-tight`}>
            Lexi
          </span>
          <span className="text-[#646AA4] text-sm select-none" aria-hidden="true">
            ✦
          </span>
        </div>
        {showSubtitle && (
          <p className="text-[11px] font-medium text-[#7D82A8] -mt-0.5 tracking-wide leading-none">
            Your English Companion
          </p>
        )}
      </div>
    </div>
  );
};
