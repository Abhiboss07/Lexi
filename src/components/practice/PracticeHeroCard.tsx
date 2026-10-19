import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface PracticeHeroCardProps {
  onStartRecommendedPractice: () => void;
  dueReviewsCount: number;
}

export const PracticeHeroCard: React.FC<PracticeHeroCardProps> = ({
  onStartRecommendedPractice,
  dueReviewsCount,
}) => {
  return (
    <section
      className="relative overflow-hidden rounded-[32px] border border-[#E4E7F7] p-4 xs:p-4.5 sm:p-5 shadow-[0_10px_30px_rgba(35,38,85,0.06)]"
      style={{
        background:
          'radial-gradient(ellipse 65% 60% at 76% 52%, #E2DCFD 0%, #EBE6FD 30%, rgba(246, 245, 254, 0.5) 65%, transparent 100%), linear-gradient(135deg, #FFFFFF 0%, #FAF9FE 38%, #EFF1FD 100%)',
      }}
      aria-labelledby="practice-hero-heading"
      role="region"
    >
      <div className="relative flex flex-row items-center justify-between gap-1 xs:gap-2 sm:gap-3">
        {/* Left Editorial Copy Layer */}
        <div className="relative z-10 flex-1 min-w-0 pr-0.5 sm:pr-1">
          {/* Eyebrow */}
          <div className="flex items-center gap-1.5 text-[10px] xs:text-[10.5px] sm:text-[11.5px] font-bold uppercase tracking-[0.18em] text-[#5B618E] leading-tight mb-2 sm:mb-2.5 whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 text-[#545CA6]" />
            <span>YOUR PRACTICE STUDIO</span>
          </div>

          {/* Three-Line Headline */}
          <h2
            id="practice-hero-heading"
            className="text-[25px] xs:text-[28px] sm:text-[32px] font-extrabold leading-[1.06] tracking-tight"
          >
            <span className="text-[#15164B] block">Practice</span>
            <span className="text-[#15164B] block">Every Day</span>
            <span className="text-[#545CA6] block mt-0.5">Grow Stronger</span>
          </h2>

          {/* Supporting Copy */}
          <div className="text-[11px] xs:text-[12px] sm:text-[13px] font-medium text-[#52577F] leading-[1.38] mt-2.5 sm:mt-3">
            <span className="block">Real conversation topics.</span>
            <span className="block">Interactive short stories.</span>
            <span className="block">FSRS spaced repetition.</span>
            <span className="block">Confidence in every sentence.</span>
          </div>

          {/* Primary CTA Button */}
          <div className="relative z-20 mt-3.5 sm:mt-4">
            <button
              type="button"
              onClick={onStartRecommendedPractice}
              className="inline-flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-2.5 px-3 py-1.5 xs:px-4 xs:py-2.5 sm:px-5 sm:py-2.5 rounded-full bg-[#15164B] hover:bg-[#0E1038] text-white text-[11.5px] xs:text-[12.5px] sm:text-[13.5px] font-bold whitespace-nowrap transition-all shadow-[0_4px_16px_rgba(21,22,75,0.22)] hover:translate-y-[-1px] active:translate-y-[0px] focus:outline-hidden focus:ring-2 focus:ring-[#545CA6] focus:ring-offset-2 shrink-0 cursor-pointer"
              aria-label={dueReviewsCount > 0 ? `Review Due Words (${dueReviewsCount})` : 'Start Practice Session'}
            >
              <span className="whitespace-nowrap">
                {dueReviewsCount > 0 ? `Review Due Words (${dueReviewsCount})` : 'Start Practice Session'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] shrink-0" />
            </button>
          </div>
        </div>

        {/* Right 3D Character Illustration */}
        <div className="relative shrink-0 w-[125px] xs:w-[145px] sm:w-[170px] self-end flex items-end justify-center pointer-events-none select-none">
          <img
            src="/assets/practice-hero-character.png"
            alt="3D digital illustration of a student wearing headphones practicing English at a study desk with tablet and notebook"
            className="w-full h-auto max-h-[190px] xs:max-h-[215px] sm:max-h-[235px] object-contain transition-transform duration-300"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
};
