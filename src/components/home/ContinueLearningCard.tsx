import React from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';

interface ContinueLearningCardProps {
  onContinue: () => void;
  unitLabel?: string;
  lessonTitle?: string;
  description?: string;
  progressPercent?: number;
  nextLessonTitle?: string;
}

export const ContinueLearningCard: React.FC<ContinueLearningCardProps> = ({ 
  onContinue,
  unitLabel = 'Unit 2 • Practical Speaking',
  lessonTitle = 'Everyday Conversations',
  description = 'Practice greetings, polite requests, and casual dialogue in natural settings.',
  progressPercent = 65,
  nextLessonTitle = 'Next: Lesson 3 • At the Bus Stop',
}) => {
  return (
    <section aria-labelledby="continue-learning-heading" className="pt-3 pb-2">
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h2 id="continue-learning-heading" className="text-[19px] sm:text-[20px] font-extrabold tracking-tight text-[#1E224D]">
          Continue Learning
        </h2>
        <span className="text-[11px] sm:text-[11.5px] font-semibold text-[#545CA6] bg-[#ECEFFD] px-2.5 py-1 rounded-full">
          Sample Preview
        </span>
      </div>

      <div className="p-4.5 xs:p-5 sm:p-6 rounded-[22px] bg-white border border-[#ECEEFE] shadow-[0_4px_20px_rgba(35,38,85,0.05)] hover:border-[#C5C9EB] transition-all">
        <div className="flex items-start gap-3.5 sm:gap-4.5">
          {/* Badge Icon */}
          <div className="w-12 h-12 rounded-2xl bg-[#EEF2FD] flex items-center justify-center text-[#2A316E] shrink-0">
            <BookOpen className="w-5.5 h-5.5 stroke-[2]" />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#636C9E]">
                {unitLabel}
              </span>
              <span className="text-[13px] sm:text-[14px] font-bold text-[#1E224D] tracking-tight">
                {progressPercent}%
              </span>
            </div>

            <h3 className="text-[16px] sm:text-[17px] font-bold text-[#1C2046] leading-snug mb-1">
              {lessonTitle}
            </h3>

            <p className="text-[12px] sm:text-[12.5px] text-[#636C9E] leading-relaxed mb-3.5 sm:mb-4">
              {description}
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-[#E5E9F8] h-2 sm:h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#1E224E] h-full rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }} 
                role="progressbar" 
                aria-valuenow={progressPercent} 
                aria-valuemin={0} 
                aria-valuemax={100}
                aria-label={`${lessonTitle} lesson progress: ${progressPercent}%`}
              />
            </div>
          </div>
        </div>

        {/* Action Button & Next Lesson */}
        <div className="mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-[#EDEFF9] flex items-center justify-between gap-2">
          <span className="text-[11.5px] sm:text-[12.5px] text-[#6B73A2] font-medium min-w-0 truncate">
            {nextLessonTitle}
          </span>
          <button
            onClick={onContinue}
            className="inline-flex items-center gap-1.5 px-4 py-2 sm:px-4.5 sm:py-2.5 rounded-full bg-[#1E224E] hover:bg-[#141738] text-white text-[12px] sm:text-[13px] font-bold transition-all shadow-[0_2px_8px_rgba(30,34,78,0.18)] hover:translate-y-[-1px] active:translate-y-[0px] focus:outline-hidden focus:ring-2 focus:ring-[#545CA6] focus:ring-offset-1 shrink-0 cursor-pointer"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </section>
  );
};
