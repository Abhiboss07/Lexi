import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Headphones, Mic, Check } from 'lucide-react';
import type { DailyPracticeOption } from '../../types/dailyPractice';
import { dailyPracticeService } from '../../services/dailyPracticeService';

export type { DailyPracticeOption };

interface DailyPracticeRowProps {
  userId?: string;
  onSelectOption: (option: DailyPracticeOption) => void;
  refreshTrigger?: number;
}

export const DailyPracticeRow: React.FC<DailyPracticeRowProps> = ({ 
  userId = 'local-learner-1',
  onSelectOption,
  refreshTrigger = 0,
}) => {
  const [options, setOptions] = useState<DailyPracticeOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadDailyOptions = useCallback(async () => {
    try {
      setIsLoading(true);
      const daily = await dailyPracticeService.getDailyPracticeOptions(userId);
      setOptions(daily);
    } catch (err) {
      console.warn('Failed to load daily practice options:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDailyOptions();
  }, [loadDailyOptions, refreshTrigger]);

  const getIcon = (id: string) => {
    switch (id) {
      case 'vocabulary':
        return <BookOpen className="w-5 h-5 stroke-[2] text-[#232655]" />;
      case 'listening':
        return <Headphones className="w-5 h-5 stroke-[2] text-[#232655]" />;
      case 'speaking':
        return <Mic className="w-5 h-5 stroke-[2] text-[#232655]" />;
      default:
        return <BookOpen className="w-5 h-5 stroke-[2] text-[#232655]" />;
    }
  };

  return (
    <section aria-labelledby="daily-practice-heading" className="pt-2 pb-2">
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <h2 id="daily-practice-heading" className="text-[19px] font-extrabold tracking-tight text-[#222149]">
          Daily Practice
        </h2>
        <span className="text-[12px] font-medium text-[#7D82A8]">
          3-min sessions
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {isLoading && options.length === 0 ? (
          // Skeletons
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-3 rounded-2xl bg-white border border-[#ECEEFE] flex flex-col items-center justify-center animate-pulse min-h-[96px]"
            >
              <div className="w-10 h-10 rounded-xl bg-[#EEF1FE] mb-2" />
              <div className="w-14 h-3 bg-[#EEF1FE] rounded-full mb-1" />
              <div className="w-10 h-2.5 bg-[#EEF1FE] rounded-full" />
            </div>
          ))
        ) : (
          options.map((opt) => {
            const isCompleted = opt.status === 'completed';
            const isDue = Boolean(opt.dueCount && opt.dueCount > 0);

            return (
              <button
                key={opt.id}
                onClick={() => onSelectOption(opt)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl bg-white border shadow-lexi-card hover:shadow-md transition-all active:scale-[0.98] text-center focus:outline-hidden focus:ring-2 focus:ring-[#646AA4] focus:ring-offset-1 group cursor-pointer ${
                  isCompleted 
                    ? 'border-[#A7F3D0] hover:border-[#34D399]' 
                    : 'border-[#ECEEFE] hover:border-[#CCD1F0]'
                }`}
                role="button"
                aria-label={`${opt.title} Practice: ${opt.badgeText}`}
              >
                <div 
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors mb-2 ${
                    isCompleted 
                      ? 'bg-[#ECFDF5] text-[#059669]' 
                      : 'bg-[#EEF1FE] group-hover:bg-[#E2E6FD]'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[2.5] text-[#059669]" />
                  ) : (
                    getIcon(opt.id)
                  )}
                </div>
                <span className="text-[13px] font-bold text-[#222149] tracking-tight group-hover:text-[#232655]">
                  {opt.title}
                </span>
                <span 
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
                    isCompleted
                      ? 'text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0]'
                      : isDue
                      ? 'text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA]'
                      : 'text-[#8E93B8] bg-[#F4F6FE]'
                  }`}
                >
                  {opt.badgeText}
                </span>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
};
