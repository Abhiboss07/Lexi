import React from 'react';
import { Search } from 'lucide-react';
import { LexiLogoSymbol } from '../common/LexiLogo';

interface LexiHeaderProps {
  streakCount: number;
  avatarUrl: string;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
}

export const LexiHeader: React.FC<LexiHeaderProps> = ({
  streakCount,
  avatarUrl,
  onOpenSearch,
  onOpenProfile,
}) => {
  return (
    <header className="flex items-center justify-between pt-3 pb-4 px-1" role="banner">
      {/* Brand Identity */}
      <div className="flex items-center gap-2 xs:gap-2.5 shrink-0">
        <LexiLogoSymbol size={52} className="w-[48px] h-[48px] xs:w-[50px] xs:h-[50px] sm:w-[52px] sm:h-[52px] hover:scale-105 transition-transform" />
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[28px] xs:text-[29.5px] sm:text-[31px] font-extrabold tracking-tight text-[#222149] leading-tight">
              Lexi
            </span>
            {/* Brand Sparkle ✦ */}
            <span className="text-[#646AA4] text-[20px] xs:text-[21px] sm:text-[22px] select-none" aria-hidden="true">
              ✦
            </span>
          </div>
          <p className="text-[12px] xs:text-[12.5px] sm:text-[13px] font-medium text-[#7D82A8] -mt-0.5 tracking-wide">
            Your English Companion
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2.5 shrink-0">
        {/* Search Button */}
        <button
          onClick={onOpenSearch}
          className="w-9 h-9 xs:w-10 xs:h-10 rounded-full bg-white border border-[#ECEEFE] flex items-center justify-center text-[#222149] hover:bg-[#F3F4FE] transition-colors shadow-xs focus:outline-hidden focus:ring-2 focus:ring-[#646AA4]"
          aria-label="Search lessons and vocabulary"
        >
          <Search className="w-[18px] h-[18px] stroke-[2.2]" />
        </button>

        {/* Compact Streak Pill */}
        <div
          className="flex items-center gap-1.5 px-2 xs:px-2.5 sm:px-3 py-1.5 rounded-full bg-white border border-[#ECEEFE] shadow-xs cursor-default select-none"
          title={`Current Streak: ${streakCount} days`}
          aria-label={`Current Streak: ${streakCount} days`}
        >
          <span className="text-[14px] xs:text-[15px]" aria-hidden="true">🔥</span>
          <span className="text-[13.5px] xs:text-[14px] font-bold text-[#222149]">
            {streakCount}
          </span>
        </div>

        {/* User Profile Avatar */}
        <button
          onClick={onOpenProfile}
          className="relative rounded-full focus:outline-hidden focus:ring-2 focus:ring-[#646AA4]"
          aria-label="User profile settings"
        >
          <img
            src={avatarUrl}
            alt="Profile Avatar"
            className="w-9 h-9 xs:w-10 xs:h-10 rounded-full object-cover border border-[#ECEEFE] shadow-xs hover:opacity-90 transition-opacity"
            onError={(e) => {
              // Fallback to vector SVG if needed
              (e.target as HTMLImageElement).src = '/assets/default-avatar.svg';
            }}
          />
        </button>
      </div>
    </header>
  );
};
