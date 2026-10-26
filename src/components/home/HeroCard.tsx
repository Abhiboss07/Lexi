import React from 'react';
import { ArrowRight } from 'lucide-react';
import { getAssetPath } from '../../utils/assetPath';

interface HeroCardProps {
  onStartLearning: () => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({ onStartLearning }) => {
  return (
    <section 
      className="relative overflow-hidden rounded-[32px] border border-[#E4E7F7] p-4 xs:p-4.5 sm:p-5 shadow-[0_10px_30px_rgba(35,38,85,0.06)]"
      style={{
        background: 'radial-gradient(ellipse 65% 60% at 76% 52%, #E2DCFD 0%, #EBE6FD 30%, rgba(246, 245, 254, 0.5) 65%, transparent 100%), linear-gradient(135deg, #FFFFFF 0%, #FAF9FE 38%, #EFF1FD 100%)',
      }}
      aria-labelledby="hero-heading"
    >
      <div className="relative flex flex-row items-center justify-between gap-1 xs:gap-2 sm:gap-3">
        {/* Left Editorial Copy Layer (higher z-index, strictly above artwork) */}
        <div className="relative z-10 flex-1 min-w-0 pr-0.5 sm:pr-1">
          {/* Eyebrow (Single horizontal line matching updated reference) */}
          <div className="text-[10px] xs:text-[10.5px] sm:text-[11.5px] font-bold uppercase tracking-[0.18em] text-[#5B618E] leading-tight mb-2 sm:mb-2.5 whitespace-nowrap">
            A BRIGHTER YOU
          </div>

          {/* Prominent Headline with balanced flow and comfortable line height */}
          <h1 id="hero-heading" className="text-[25px] xs:text-[28px] sm:text-[32px] font-extrabold leading-[1.16] tracking-tight">
            <span className="text-[#15164B] block">Learn English</span>
            <span className="text-[#545CA6] block mt-0.5">Your Way</span>
          </h1>

          {/* Supporting Copy with balanced rhythm and natural line wrapping */}
          <p className="text-[11.5px] xs:text-[12.5px] sm:text-[13px] font-medium text-[#52577F] leading-[1.5] mt-2.5 sm:mt-3 max-w-[240px] xs:max-w-[270px]">
            Real conversations. Fun stories. Useful skills for a confident you.
          </p>

          {/* Primary CTA Button */}
          <div className="relative z-20 mt-3.5 sm:mt-4">
            <button
              onClick={onStartLearning}
              className="inline-flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-2.5 px-4 py-2 xs:px-4.5 xs:py-2.5 sm:px-5 sm:py-2.5 rounded-full bg-[#15164B] hover:bg-[#0E1038] text-white text-[12px] xs:text-[12.5px] sm:text-[13.5px] font-bold whitespace-nowrap transition-all shadow-[0_4px_16px_rgba(21,22,75,0.22)] hover:translate-y-[-1px] active:translate-y-[0px] focus:outline-hidden focus:ring-2 focus:ring-[#545CA6] focus:ring-offset-2 shrink-0 cursor-pointer"
              aria-label="Start Learning English"
            >
              <span className="whitespace-nowrap">Start Learning</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] shrink-0" />
            </button>
          </div>

          {/* Carousel Indicators (4 indicators matching reference) */}
          <div className="flex items-center gap-1.5 mt-3 sm:mt-3.5" aria-label="Slide 1 of 4 active">
            <div className="w-5 xs:w-5.5 h-1.5 rounded-full bg-[#525BA4]" aria-current="true" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#DFE3F7]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#DFE3F7]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#DFE3F7]" />
          </div>
        </div>

        {/* Right 3D Character Illustration Layer (Enlarged 10-15%, z-0, pointer-events-none) */}
        <div className="relative z-0 shrink-0 -mr-1 xs:-mr-2 -ml-2 xs:-ml-3 min-[390px]:-ml-4 sm:-ml-5 w-[128px] xs:w-[165px] min-[390px]:w-[185px] sm:w-[202px] flex items-center justify-end self-center pointer-events-none">
          <img
            src={getAssetPath('/assets/hero-student-cat.png')}
            alt="Student sitting comfortably reading an English book with a sleeping kitten"
            className="w-full h-auto object-contain drop-shadow-sm select-none"
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
};
