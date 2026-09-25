import React from 'react';

interface TitufarisLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const TitufarisLogo: React.FC<TitufarisLogoProps> = ({
  className = '',
  size = 'md',
  showTagline = true,
}) => {
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  const iconSize = isSmall ? 32 : isLarge ? 48 : 38;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Exact Isometric 3D Logo Mark based on the user's official uploaded logo */}
      <svg
        width={iconSize}
        height={iconSize * 0.9}
        viewBox="0 0 100 90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-xs"
      >
        {/* Dark Blue Base Pedestal with 3 Orange Dots */}
        <path
          d="M36 44 L36 78 L50 86 L64 78 L64 44 Z"
          fill="#1E293B"
        />
        {/* Left shaded face of pedestal */}
        <path
          d="M36 44 L36 78 L50 86 L50 52 Z"
          fill="#0F172A"
        />
        {/* Three orange vertical accent dots */}
        <circle cx="50" cy="58" r="2.5" fill="#F97316" />
        <circle cx="50" cy="67" r="2.5" fill="#F97316" />
        <circle cx="50" cy="76" r="2.5" fill="#F97316" />

        {/* Orange Tabletop Platform (Commercial Shelf / Display) */}
        {/* Front-left edge thickness */}
        <path
          d="M8 29 L50 52 L50 56 L8 33 Z"
          fill="#D97706"
        />
        {/* Front-right edge thickness */}
        <path
          d="M50 52 L92 29 L92 33 L50 56 Z"
          fill="#C2410C"
        />
        {/* Top diamond surface in vibrant orange */}
        <path
          d="M50 8 L92 29 L50 52 L8 29 Z"
          fill="#F97316"
        />
      </svg>

      {/* Subtle vertical divider matching brand guidelines */}
      <div className={`w-[1.5px] bg-slate-200 self-stretch my-0.5 rounded-full ${isSmall ? 'h-6' : 'h-8'}`} />

      {/* Typography block */}
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline">
          <span
            className={`font-black tracking-tight text-slate-900 leading-none ${
              isSmall ? 'text-lg' : isLarge ? 'text-2xl' : 'text-xl'
            }`}
          >
            Titufaris
          </span>
        </div>

        {/* Brand underline in orange */}
        <div className="h-[2px] bg-orange-500 w-full mt-1 mb-0.5 rounded-full" />

        {showTagline && (
          <span
            className={`font-bold tracking-[0.18em] text-slate-600 uppercase ${
              isSmall ? 'text-[7.5px]' : isLarge ? 'text-[10px]' : 'text-[8.5px]'
            }`}
          >
            Equipamiento Comercial & Layout
          </span>
        )}
      </div>
    </div>
  );
};
