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
      <div className="flex items-center gap-2.5">
        <LexiLogoSymbol size={34} className="hover:scale-105 transition-transform" />
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[24px] sm:text-[26px] font-extrabold tracking-tight text-[#222149]">
              Lexi
            </span>
            {/* Brand Sparkle ✦ */}
            <span className="text-[#646AA4] text-[18px] select-none" aria-hidden="true">
              ✦
            </span>
          </div>
          <p className="text-[12px] font-medium text-[#7D82A8] -mt-0.5 tracking-wide">
            Your English Companion
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2.5">
        {/* Search Button */}
        <button
          onClick={onOpenSearch}
          className="w-10 h-10 rounded-full bg-white border border-[#ECEEFE] flex items-center justify-center text-[#222149] hover:bg-[#F3F4FE] transition-colors shadow-xs focus:outline-hidden focus:ring-2 focus:ring-[#646AA4]"
          aria-label="Search lessons and vocabulary"
        >
          <Search className="w-[18px] h-[18px] stroke-[2.2]" />
        </button>

        {/* Compact Streak Pill */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#ECEEFE] shadow-xs cursor-default select-none"
          title={`Current Streak: ${streakCount} days`}
          aria-label={`Current Streak: ${streakCount} days`}
        >
          <span className="text-[15px]" aria-hidden="true">🔥</span>
          <span className="text-[14px] font-bold text-[#222149]">
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
            className="w-10 h-10 rounded-full object-cover border border-[#ECEEFE] shadow-xs hover:opacity-90 transition-opacity"
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
