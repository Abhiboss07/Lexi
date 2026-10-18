import React from 'react';
import { ArrowRight } from 'lucide-react';

interface HeroCardProps {
  onStartLearning: () => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({ onStartLearning }) => {
  return (
    <section 
      className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#FFFFFF] via-[#F8F9FE] to-[#EFF2FE] border border-[#ECEEFE] p-4.5 sm:p-5 shadow-lexi-card"
      aria-labelledby="hero-heading"
    >
      <div className="flex flex-row items-center justify-between gap-1.5 sm:gap-3">
        {/* Left Editorial Copy */}
        <div className="z-10 flex-1 min-w-[160px] max-w-[210px] sm:max-w-[250px]">
          {/* Eyebrow */}
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] text-[#7D82A8] block mb-1">
            A BRIGHTER YOU
          </span>

          {/* Prominent Two-Line Headline */}
          <h1 id="hero-heading" className="text-[24px] sm:text-[28px] font-extrabold leading-[1.12] tracking-tight">
            <span className="text-[#222149] block">Learn English</span>
            <span className="text-[#646AA4] block mt-0.5">Your Way</span>
          </h1>

          {/* Supporting Copy */}
          <p className="text-[11.5px] sm:text-[13px] font-normal text-[#6B7094] leading-[1.4] mt-2 max-w-[200px] sm:max-w-[240px]">
            Real conversations. Fun stories. Useful skills. A more confident you.
          </p>

          {/* Primary CTA Button */}
          <div className="mt-3.5">
            <button
              onClick={onStartLearning}
              className="inline-flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[#232655] hover:bg-[#181A3C] text-white text-[13px] sm:text-[14px] font-semibold transition-all shadow-lexi-btn hover:translate-y-[-1px] active:translate-y-[0px] focus:outline-hidden focus:ring-2 focus:ring-[#646AA4] focus:ring-offset-2"
              aria-label="Start Learning English"
            >
              <span>Start Learning</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Carousel Indicators (4 indicators) */}
          <div className="flex items-center gap-1.5 mt-3.5" aria-label="Slide 1 of 4 active">
            <div className="w-4 h-1.5 rounded-full bg-[#646AA4]" aria-current="true" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#DCE0F5]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#DCE0F5]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#DCE0F5]" />
          </div>
        </div>

        {/* Right 3D Character Illustration */}
        <div className="shrink-0 -mr-2 sm:-mr-1 w-[150px] sm:w-[175px] md:w-[195px] flex justify-end">
          <img
            src="/assets/hero-student-cat.png"
            alt="Student sitting comfortably reading an English book with a sleeping kitten"
            className="w-full h-auto object-contain pointer-events-none drop-shadow-sm select-none"
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
};
