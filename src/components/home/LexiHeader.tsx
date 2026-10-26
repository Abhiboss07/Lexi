import React from 'react';
import { Search } from 'lucide-react';
import { LexiLogoSymbol } from '../common/LexiLogo';
import { getAssetPath } from '../../utils/assetPath';

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
    <header className="flex items-center justify-between pt-3 pb-4 px-0.5 sm:px-1 gap-2 min-w-0" role="banner">
      {/* Brand Identity */}
      <div className="flex items-center gap-1.5 xs:gap-2.5 min-w-0">
        <LexiLogoSymbol size={52} className="w-[40px] h-[40px] xs:w-[48px] xs:h-[48px] sm:w-[52px] sm:h-[52px] hover:scale-105 transition-transform shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[25px] xs:text-[28px] sm:text-[31px] font-extrabold tracking-tight text-[#222149] leading-tight">
              Lexi
            </span>
            {/* Brand Sparkle ✦ */}
            <span className="text-[#646AA4] text-[18px] xs:text-[20px] sm:text-[22px] select-none" aria-hidden="true">
              ✦
            </span>
          </div>
          <p className="hidden min-[380px]:block text-[12px] xs:text-[12.5px] sm:text-[13px] font-semibold text-[#484E77] -mt-0.5 tracking-wide truncate">
            Your English Companion
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1 xs:gap-2 shrink-0">
        {/* Search Button */}
        <button
          onClick={onOpenSearch}
          className="w-9 h-9 xs:w-10 xs:h-10 rounded-full bg-white border border-[#ECEEFE] flex items-center justify-center text-[#15164B] hover:bg-[#F3F4FE] transition-colors shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#545CA6]"
          aria-label="Search lessons and vocabulary"
        >
          <Search className="w-4 h-4 xs:w-[18px] xs:h-[18px] stroke-[2.2]" />
        </button>

        {/* Compact Streak Pill */}
        <div
          className="flex items-center gap-1 xs:gap-1.5 px-2 py-1 xs:px-2.5 xs:py-1.5 rounded-full bg-white border border-[#ECEEFE] shadow-xs cursor-default select-none"
          title={`Current Streak: ${streakCount} days`}
          aria-label={`Current Streak: ${streakCount} days`}
        >
          <span className="text-[13px] xs:text-[15px]" aria-hidden="true">🔥</span>
          <span className="text-[12.5px] xs:text-[14px] font-bold text-[#15164B]">
            {streakCount}
          </span>
        </div>

        {/* User Profile Avatar */}
        <button
          onClick={onOpenProfile}
          className="relative rounded-full focus-visible:ring-2 focus-visible:ring-[#545CA6] cursor-pointer"
          aria-label="User profile settings"
        >
          <img
            src={getAssetPath(avatarUrl)}
            alt="Profile Avatar"
            className="w-9 h-9 xs:w-10 xs:h-10 rounded-full object-cover border border-[#ECEEFE] shadow-xs hover:opacity-90 transition-opacity"
            onError={(e) => {
              // Fallback to vector SVG if needed
              (e.target as HTMLImageElement).src = getAssetPath('/assets/default-avatar.svg');
            }}
          />
        </button>
      </div>
    </header>
  );
};
