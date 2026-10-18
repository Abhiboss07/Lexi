import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { QuickPickItem } from '../../types';

interface QuickPicksProps {
  items: QuickPickItem[];
  onSelectItem: (item: QuickPickItem) => void;
  onSeeAll: () => void;
}

export const QuickPicks: React.FC<QuickPicksProps> = ({
  items,
  onSelectItem,
  onSeeAll,
}) => {
  return (
    <section aria-labelledby="quick-picks-heading" className="pt-2 pb-1">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h2 id="quick-picks-heading" className="text-[19px] font-extrabold tracking-tight text-[#222149]">
          Quick Picks
        </h2>
        <button
          onClick={onSeeAll}
          className="text-[13px] font-semibold text-[#646AA4] hover:text-[#232655] transition-colors focus:outline-hidden focus:underline"
        >
          See All
        </button>
      </div>

      {/* 2-Column Responsive Grid */}
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectItem(item)}
            className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#ECEEFE] shadow-lexi-card hover:border-[#C5C9EB] hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectItem(item);
              }
            }}
            aria-label={`${item.title}: ${item.subtitle}`}
          >
            {/* Visual Icon / Artwork */}
            <div className="flex items-center gap-2.5">
              <img
                src={item.iconAsset}
                alt=""
                aria-hidden="true"
                className="w-10 h-10 rounded-xl object-contain shrink-0"
              />
              <div className="min-w-0">
                <h3 className="text-[13px] font-bold text-[#222149] leading-tight truncate group-hover:text-[#232655]">
                  {item.title}
                </h3>
                <p className="text-[11px] font-medium text-[#7D82A8] leading-tight truncate mt-0.5">
                  {item.subtitle}
                </p>
              </div>
            </div>

            {/* Circular Arrow Button */}
            <div className="w-6 h-6 rounded-full bg-[#F0F2FD] group-hover:bg-[#232655] group-hover:text-white flex items-center justify-center text-[#646AA4] shrink-0 ml-1 transition-colors">
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
