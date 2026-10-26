import React from 'react';
import type { QuickPickItem } from '../../types';
import { getAssetPath } from '../../utils/assetPath';

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
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectItem(item)}
            className="flex items-center gap-2.5 sm:gap-3 p-3 rounded-2xl bg-white border border-[#ECEEFE] shadow-lexi-card hover:border-[#C5C9EB] hover:shadow-md transition-all cursor-pointer group active:scale-[0.98] min-w-0 h-full"
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
            <img
              src={getAssetPath(item.iconAsset)}
              alt=""
              aria-hidden="true"
              className="w-10 h-10 rounded-xl object-contain shrink-0 select-none"
            />

            {/* Text Content */}
            <div className="flex-1 min-w-0 overflow-hidden pr-0.5">
              <h3 
                className="text-[13px] sm:text-[13.5px] font-bold text-[#222149] leading-tight truncate group-hover:text-[#232655] tracking-tight"
                title={item.title}
              >
                {item.title}
              </h3>
              <p 
                className="text-[11px] sm:text-[11.5px] font-medium text-[#7D82A8] leading-tight truncate mt-0.5 tracking-tight"
                title={item.subtitle}
              >
                {item.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
