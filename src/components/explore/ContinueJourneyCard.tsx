import React from 'react';
import { ArrowRight, BookMarked, ChevronRight } from 'lucide-react';
import type { JourneyCurriculumUnit } from '../../types';

interface ContinueJourneyCardProps {
  unit: JourneyCurriculumUnit;
  onContinue: () => void;
  onSeeAll?: () => void;
}

export const ContinueJourneyCard: React.FC<ContinueJourneyCardProps> = ({
  unit,
  onContinue,
  onSeeAll,
}) => {
  // Circular progress calculation
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (unit.progressPercent / 100) * circumference;

  return (
    <section aria-labelledby="journey-heading" className="space-y-2">
      {/* Section Header */}
      <div className="flex items-center justify-between px-0.5">
        <h2 id="journey-heading" className="text-[17px] xs:text-[18px] font-extrabold text-[#15164B]">
          Continue Your Journey
        </h2>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="inline-flex items-center gap-0.5 text-[12px] xs:text-[12.5px] font-semibold text-[#545CA6] hover:text-[#15164B] transition-colors"
          >
            <span>See All</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* Curriculum Progress Card */}
      <div 
        onClick={onContinue}
        className="group relative overflow-hidden rounded-[26px] bg-white border border-[#E4E7F7] p-4 xs:p-4.5 shadow-[0_4px_20px_rgba(35,38,85,0.05)] hover:shadow-[0_8px_25px_rgba(35,38,85,0.08)] transition-all cursor-pointer hover:border-[#D5D9F4]"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onContinue();
          }
        }}
        aria-label={`Continue ${unit.title}, ${unit.unitLabel}. Progress: ${unit.progressPercent} percent.`}
      >
        <div className="flex items-center justify-between gap-3 xs:gap-4">
          {/* Left Decorative Monogram / Book Badge */}
          <div className="shrink-0 w-11 h-11 xs:w-12 xs:h-12 rounded-2xl bg-[#EFF1FE] border border-[#E2E4F8] flex flex-col items-center justify-center text-[#545CA6] shadow-xs">
            <BookMarked className="w-5 h-5 xs:w-5.5 xs:h-5.5 stroke-[2.2]" />
            <span className="text-[9px] font-bold tracking-wider uppercase text-[#7D82A8] -mt-0.5">Aa</span>
          </div>

          {/* Center Content */}
          <div className="flex-1 min-w-0 pr-1">
            <span className="text-[9.5px] xs:text-[10px] font-bold uppercase tracking-[0.16em] text-[#7D82A8] block">
              {unit.unitLabel}
            </span>
            <h3 className="text-[15px] xs:text-[16px] font-extrabold text-[#15164B] leading-tight truncate mt-0.5">
              {unit.title}
            </h3>
            <p className="text-[11px] xs:text-[11.5px] text-[#6B7094] leading-[1.3] truncate mt-0.5">
              {unit.subtitle}
            </p>

            {/* Action Pill CTA */}
            <div className="mt-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 xs:px-3.5 xs:py-1.5 rounded-full bg-[#15164B] group-hover:bg-[#0E1038] text-white text-[11px] xs:text-[11.5px] font-bold whitespace-nowrap shadow-xs transition-colors">
                <span>Continue</span>
                <ArrowRight className="w-3 h-3 stroke-[2.5]" />
              </span>
            </div>
          </div>

          {/* Right Circular Progress Ring */}
          <div className="shrink-0 flex flex-col items-center justify-center pl-1">
            <div className="relative w-14 h-14 xs:w-15 xs:h-15 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 56 56" aria-hidden="true">
                {/* Track Circle */}
                <circle
                  cx="28"
                  cy="28"
                  r={radius}
                  stroke="#E4E7F7"
                  strokeWidth="4.5"
                  fill="transparent"
                />
                {/* Progress Circle */}
                <circle
                  cx="28"
                  cy="28"
                  r={radius}
                  stroke="#15164B"
                  strokeWidth="4.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              {/* Centered Percentage */}
              <div className="absolute inset-0 flex items-center justify-center text-[12px] xs:text-[13px] font-extrabold text-[#15164B]">
                {unit.progressPercent}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
