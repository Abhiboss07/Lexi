import React from 'react';
import { Home, Compass, Mic, BarChart3 } from 'lucide-react';
import type { NavigationTab } from '../../types';

interface BottomNavProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs: { id: NavigationTab; label: string; icon: React.ReactNode; activeIcon: React.ReactNode }[] = [
    {
      id: 'Home',
      label: 'Home',
      icon: <Home className="w-[22px] h-[22px] stroke-[1.8] text-[#484E77]" aria-hidden="true" />,
      activeIcon: <Home className="w-[22px] h-[22px] stroke-[2.2] text-[#232655] fill-[#232655]/10" aria-hidden="true" />,
    },
    {
      id: 'Explore',
      label: 'Explore',
      icon: <Compass className="w-[22px] h-[22px] stroke-[1.8] text-[#484E77]" aria-hidden="true" />,
      activeIcon: <Compass className="w-[22px] h-[22px] stroke-[2.2] text-[#232655] fill-[#232655]/10" aria-hidden="true" />,
    },
    {
      id: 'Practice',
      label: 'Practice',
      icon: <Mic className="w-[22px] h-[22px] stroke-[1.8] text-[#484E77]" aria-hidden="true" />,
      activeIcon: <Mic className="w-[22px] h-[22px] stroke-[2.2] text-[#232655] fill-[#232655]/10" aria-hidden="true" />,
    },
    {
      id: 'Progress',
      label: 'Progress',
      icon: <BarChart3 className="w-[22px] h-[22px] stroke-[1.8] text-[#484E77]" aria-hidden="true" />,
      activeIcon: <BarChart3 className="w-[22px] h-[22px] stroke-[2.2] text-[#232655] fill-[#232655]/10" aria-hidden="true" />,
    },
  ];

  return (
    <nav 
      className="fixed sm:sticky bottom-0 left-0 right-0 max-w-[430px] mx-auto z-40 bg-white/95 backdrop-blur-md border-t border-[#ECEEFE] py-1.5 px-4 sm:px-6 safe-area-pb shadow-[0_-2px_10px_rgba(35,38,85,0.03)]"
      aria-label="Main Navigation"
    >
      <div className="flex items-center justify-around max-w-[420px] mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[52px] min-h-[48px] py-1 px-2.5 rounded-xl transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-[#545CA6] focus-visible:outline-none ${
                isActive
                  ? 'text-[#232655]'
                  : 'text-[#484E77] hover:text-[#232655]'
              }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.label}
            >
              <div className="relative">
                {isActive ? tab.activeIcon : tab.icon}
              </div>
              <span
                className={`text-[11.5px] mt-0.5 tracking-tight ${
                  isActive ? 'font-bold text-[#232655]' : 'font-semibold text-[#484E77]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
