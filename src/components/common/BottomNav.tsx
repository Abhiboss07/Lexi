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
      icon: <Home className="w-[22px] h-[22px] stroke-[1.8] text-[#8E93B8]" />,
      activeIcon: <Home className="w-[22px] h-[22px] stroke-[2.2] text-[#232655] fill-[#232655]/10" />,
    },
    {
      id: 'Explore',
      label: 'Explore',
      icon: <Compass className="w-[22px] h-[22px] stroke-[1.8] text-[#8E93B8]" />,
      activeIcon: <Compass className="w-[22px] h-[22px] stroke-[2.2] text-[#232655] fill-[#232655]/10" />,
    },
    {
      id: 'Practice',
      label: 'Practice',
      icon: <Mic className="w-[22px] h-[22px] stroke-[1.8] text-[#8E93B8]" />,
      activeIcon: <Mic className="w-[22px] h-[22px] stroke-[2.2] text-[#232655] fill-[#232655]/10" />,
    },
    {
      id: 'Progress',
      label: 'Progress',
      icon: <BarChart3 className="w-[22px] h-[22px] stroke-[1.8] text-[#8E93B8]" />,
      activeIcon: <BarChart3 className="w-[22px] h-[22px] stroke-[2.2] text-[#232655] fill-[#232655]/10" />,
    },
  ];

  return (
    <nav 
      className="sticky bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#ECEEFE] py-2 px-6 safe-area-pb"
      aria-label="Main Navigation"
    >
      <div className="flex items-center justify-around max-w-[420px] mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all focus:outline-hidden ${
                isActive
                  ? 'text-[#232655]'
                  : 'text-[#8E93B8] hover:text-[#555982]'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                {isActive ? tab.activeIcon : tab.icon}
              </div>
              <span
                className={`text-[11px] mt-1 tracking-tight ${
                  isActive ? 'font-bold text-[#232655]' : 'font-medium text-[#8E93B8]'
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
