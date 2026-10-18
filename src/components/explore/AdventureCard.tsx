import React from 'react';
import { ArrowRight, Plane, ShoppingBag, Briefcase, Coffee, Compass, Utensils } from 'lucide-react';
import type { AdventureScenario } from '../../types';

interface AdventureCardProps {
  scenario: AdventureScenario;
  onSelect: (scenario: AdventureScenario) => void;
}

export const AdventureCard: React.FC<AdventureCardProps> = ({
  scenario,
  onSelect,
}) => {
  const getIcon = () => {
    switch (scenario.iconType) {
      case 'plane':
        return <Plane className="w-5 h-5 text-[#E11D48] stroke-[2.2]" />;
      case 'shopping':
        return <ShoppingBag className="w-5 h-5 text-[#D97706] stroke-[2.2]" />;
      case 'briefcase':
        return <Briefcase className="w-5 h-5 text-[#2563EB] stroke-[2.2]" />;
      case 'coffee':
        return <Coffee className="w-5 h-5 text-[#9333EA] stroke-[2.2]" />;
      case 'utensils':
        return <Utensils className="w-5 h-5 text-[#EA580C] stroke-[2.2]" />;
      default:
        return <Compass className="w-5 h-5 text-[#059669] stroke-[2.2]" />;
    }
  };

  const getGradient = () => {
    switch (scenario.iconType) {
      case 'plane':
        return 'from-[#FFE4E6] to-[#FECDD3] border-[#FDA4AF]/40';
      case 'shopping':
        return 'from-[#FEF3C7] to-[#FDE68A] border-[#FCD34D]/40';
      case 'briefcase':
        return 'from-[#DBEAFE] to-[#BFDBFE] border-[#93C5FD]/40';
      case 'coffee':
        return 'from-[#F3E8FF] to-[#E9D5FF] border-[#D8B4FE]/40';
      case 'utensils':
        return 'from-[#FFEDD5] to-[#FED7AA] border-[#FDBA74]/40';
      default:
        return 'from-[#D1FAE5] to-[#A7F3D0] border-[#6EE7B7]/40';
    }
  };

  return (
    <div
      onClick={() => onSelect(scenario)}
      className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] bg-white border border-[#E4E7F7] p-4 shadow-[0_4px_18px_rgba(35,38,85,0.05)] hover:shadow-[0_8px_24px_rgba(35,38,85,0.08)] transition-all cursor-pointer hover:border-[#D5D9F4] select-none"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(scenario);
        }
      }}
      aria-label={`Open ${scenario.title} scenario, category ${scenario.category}`}
    >
      <div>
        {/* Top Header Row with Icon & Simplified Category Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${getGradient()} border flex items-center justify-center shadow-xs`}>
            {getIcon()}
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EFF1FE] text-[#545CA6] shrink-0 text-center whitespace-nowrap">
            {scenario.badgeLabel}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="text-[15px] xs:text-[16px] font-extrabold text-[#15164B] leading-snug group-hover:text-[#545CA6] transition-colors">
          {scenario.title}
        </h3>
        <p className="text-[11.5px] text-[#6B7094] leading-[1.38] mt-1 line-clamp-2">
          {scenario.subtitle}
        </p>
      </div>

      {/* Bottom Row with Duration and Circular Arrow Action */}
      <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-[#F0F2FC]">
        <span className="text-[11px] font-medium text-[#8E93B8]">
          ⏱ {scenario.duration}
        </span>
        <div className="w-8 h-8 rounded-full bg-[#F0F2FC] group-hover:bg-[#15164B] text-[#15164B] group-hover:text-white flex items-center justify-center transition-all shadow-xs">
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
      </div>
    </div>
  );
};
