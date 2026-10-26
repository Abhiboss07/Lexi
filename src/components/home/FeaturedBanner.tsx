import React from 'react';
import { Clock, BarChart2, ArrowRight } from 'lucide-react';
import type { FeaturedActivity } from '../../types';
import { getAssetPath } from '../../utils/assetPath';

interface FeaturedBannerProps {
  activity: FeaturedActivity;
  onLaunch: (activity: FeaturedActivity) => void;
}

export const FeaturedBanner: React.FC<FeaturedBannerProps> = ({ activity, onLaunch }) => {
  return (
    <section aria-labelledby="featured-activity-heading" className="pt-2">
      <div 
        onClick={() => onLaunch(activity)}
        className="relative overflow-hidden rounded-[28px] bg-[#1B1E48] text-white p-5 sm:p-6 shadow-lexi-card cursor-pointer group transition-transform hover:-translate-y-0.5 active:translate-y-0"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onLaunch(activity);
          }
        }}
        aria-label={`${activity.eyebrow}: ${activity.title}. ${activity.description}`}
      >
        {/* Background Image with Ambient Gradient Fade */}
        <div className="absolute inset-0 z-0">
          <img
            src={getAssetPath(activity.imageAsset)}
            alt="Warm café scene with people enjoying coffee and conversation"
            className="w-full h-full object-cover object-right opacity-45 group-hover:opacity-55 transition-opacity group-hover:scale-105 duration-700 ease-out"
          />
          {/* Indigo to Translucent Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1B1E48] via-[#1B1E48]/85 to-transparent" />
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 max-w-[280px]">
          {/* Eyebrow */}
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A8ABDA] block mb-1">
            {activity.eyebrow}
          </span>

          {/* Activity Title */}
          <h2 id="featured-activity-heading" className="text-[20px] font-extrabold tracking-tight text-white mb-1.5">
            {activity.title}
          </h2>

          {/* Description */}
          <p className="text-[12px] font-normal text-[#D2D5F2] leading-[1.4] mb-4">
            {activity.description}
          </p>

          {/* Metadata Badges */}
          <div className="flex items-center gap-2">
            {/* Duration */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-xs border border-white/15 text-[11px] font-medium text-white/90">
              <Clock className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>{activity.durationText}</span>
            </div>

            {/* Difficulty */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-xs border border-white/15 text-[11px] font-medium text-white/90">
              <BarChart2 className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>{activity.difficultyText}</span>
            </div>
          </div>
        </div>

        {/* Circular Action Launch Button */}
        <div className="absolute right-5 bottom-5 z-10">
          <div className="w-11 h-11 rounded-full bg-white group-hover:bg-[#F3F4FE] border border-white/20 flex items-center justify-center text-[#232655] shadow-lg transition-transform group-hover:scale-110 active:scale-95">
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>
      </div>
    </section>
  );
};
