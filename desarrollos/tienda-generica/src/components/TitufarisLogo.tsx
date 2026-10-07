import React from 'react';
import { Store } from 'lucide-react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  name?: string;
  tagline?: string;
  logoUrl?: string;
}

export const TitufarisLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showTagline = true,
  name = 'Mi Tienda',
  tagline = 'Catálogo Online & POS',
  logoUrl,
}) => {
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  if (logoUrl) {
    return (
      <div className={`flex items-center gap-3 select-none ${className}`}>
        <img
          src={logoUrl}
          alt={name}
          className={`object-contain rounded-lg ${isSmall ? 'h-8' : isLarge ? 'h-14' : 'h-10'}`}
        />
        <div className="flex flex-col justify-center">
          <span className={`font-black tracking-tight text-slate-900 leading-none ${isSmall ? 'text-lg' : isLarge ? 'text-2xl' : 'text-xl'}`}>
            {name}
          </span>
          {showTagline && tagline && (
            <span className={`font-bold tracking-wider text-slate-500 uppercase mt-0.5 ${isSmall ? 'text-[8px]' : 'text-[9.5px]'}`}>
              {tagline}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Modern Gradient Hexagon Store Icon */}
      <div className={`flex items-center justify-center rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/20 shrink-0 ${isSmall ? 'w-8 h-8' : isLarge ? 'w-12 h-12' : 'w-10 h-10'}`}>
        <Store className={isSmall ? 'w-4 h-4' : isLarge ? 'w-6 h-6' : 'w-5 h-5'} />
      </div>

      <div className={`w-[1.5px] bg-slate-200 self-stretch my-0.5 rounded-full ${isSmall ? 'h-6' : 'h-8'}`} />

      {/* Dynamic Typography block */}
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline">
          <span
            className={`font-black tracking-tight text-slate-900 leading-none ${
              isSmall ? 'text-lg' : isLarge ? 'text-2xl' : 'text-xl'
            }`}
          >
            {name}
          </span>
        </div>

        <div className="h-[2px] bg-orange-500 w-full mt-1 mb-0.5 rounded-full" />

        {showTagline && (
          <span
            className={`font-bold tracking-[0.16em] text-slate-500 uppercase ${
              isSmall ? 'text-[7.5px]' : isLarge ? 'text-[10px]' : 'text-[8.5px]'
            }`}
          >
            {tagline}
          </span>
        )}
      </div>
    </div>
  );
};
