import React from 'react';
import { BookOpen, Mic, MessageCircle, ChevronRight, ArrowRight } from 'lucide-react';
import type { PopularModule } from '../../types';

interface PopularModulesSectionProps {
  modules: PopularModule[];
  onSelectModule: (module: PopularModule) => void;
  onSeeAll?: () => void;
}

export const PopularModulesSection: React.FC<PopularModulesSectionProps> = ({
  modules,
  onSelectModule,
  onSeeAll,
}) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'book-open':
        return <BookOpen className="w-4 h-4 text-[#4338CA] stroke-[2.2]" />;
      case 'mic':
        return <Mic className="w-4 h-4 text-[#D97706] stroke-[2.2]" />;
      default:
        return <MessageCircle className="w-4 h-4 text-[#059669] stroke-[2.2]" />;
    }
  };

  const getGradient = (name: string) => {
    switch (name) {
      case 'book-open':
        return 'from-[#EEF2FF] to-[#E0E7FF] border-[#C7D2FE]';
      case 'mic':
        return 'from-[#FEF3C7] to-[#FDE68A] border-[#FCD34D]';
      default:
        return 'from-[#D1FAE5] to-[#A7F3D0] border-[#6EE7B7]';
    }
  };

  return (
    <section aria-labelledby="popular-heading" className="space-y-2">
      {/* Section Header */}
      <div className="flex items-center justify-between px-0.5">
        <h2 id="popular-heading" className="text-[17px] xs:text-[18px] font-extrabold text-[#15164B]">
          Popular with Learners
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

      {/* Module Cards Grid / List */}
      <div className="space-y-2.5">
        {modules.map((m) => (
          <div
            key={m.id}
            onClick={() => onSelectModule(m)}
            className="group relative flex items-center justify-between gap-3 overflow-hidden rounded-[20px] bg-white border border-[#E4E7F7] p-3 xs:p-3.5 shadow-[0_3px_12px_rgba(35,38,85,0.04)] hover:shadow-[0_6px_20px_rgba(35,38,85,0.07)] transition-all cursor-pointer hover:border-[#D5D9F4]"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectModule(m);
              }
            }}
            aria-label={`Open ${m.title}, category ${m.category}`}
          >
            {/* Left Icon Badge */}
            <div className={`shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br ${getGradient(m.iconName)} border flex items-center justify-center shadow-xs`}>
              {getIcon(m.iconName)}
            </div>

            {/* Center Info */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-2">
                <h3 className="text-[13.5px] xs:text-[14px] font-extrabold text-[#15164B] truncate group-hover:text-[#545CA6] transition-colors">
                  {m.title}
                </h3>
              </div>
              <p className="text-[11px] xs:text-[11.5px] text-[#6B7094] truncate mt-0.5">
                {m.subtitle}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D82A8]">
                  ⏱ {m.duration}
                </span>
                <span className="text-[10px] text-[#CBD5E1]">•</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#545CA6]">
                  {m.difficulty}
                </span>
              </div>
            </div>

            {/* Right Action Arrow */}
            <div className="shrink-0 w-7 h-7 rounded-full bg-[#F0F2FC] group-hover:bg-[#15164B] text-[#15164B] group-hover:text-white flex items-center justify-center transition-all shadow-xs">
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
