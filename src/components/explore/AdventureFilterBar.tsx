import React from 'react';
import type { AdventureCategory } from '../../types';

interface AdventureFilterBarProps {
  categories: AdventureCategory[];
  activeCategory: AdventureCategory;
  onSelectCategory: (category: AdventureCategory) => void;
}

export const AdventureFilterBar: React.FC<AdventureFilterBarProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
}) => {
  return (
    <div 
      className="flex items-center gap-1.5 xs:gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1"
      role="group"
      aria-label="Filter learning adventures by category"
    >
      {categories.map((cat) => {
        const isActive = activeCategory === cat;
        return (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`px-3.5 py-1.5 xs:px-4 xs:py-2 rounded-full text-[12px] xs:text-[12.5px] font-bold whitespace-nowrap transition-all cursor-pointer ${
              isActive
                ? 'bg-[#15164B] text-white shadow-[0_3px_10px_rgba(21,22,75,0.2)]'
                : 'bg-[#EFF1FE] text-[#4E5388] hover:bg-[#E4E7F9] hover:text-[#15164B]'
            }`}
            aria-pressed={isActive}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
};
