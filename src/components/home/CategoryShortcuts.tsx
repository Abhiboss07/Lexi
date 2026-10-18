import React from 'react';
import { MessageSquare, BookOpen, Lightbulb, FileText, Headphones } from 'lucide-react';
import type { LearningShortcut } from '../../types';

interface CategoryShortcutsProps {
  shortcuts: LearningShortcut[];
  onSelectShortcut: (shortcut: LearningShortcut) => void;
}

export const CategoryShortcuts: React.FC<CategoryShortcutsProps> = ({
  shortcuts,
  onSelectShortcut,
}) => {
  const getIcon = (name: LearningShortcut['iconName']) => {
    switch (name) {
      case 'Conversation':
        return <MessageSquare className="w-5 h-5 text-[#3B3D6B] stroke-[2.2]" />;
      case 'Stories':
        return <BookOpen className="w-5 h-5 text-[#3B3D6B] stroke-[2.2]" />;
      case 'Vocabulary':
        return <Lightbulb className="w-5 h-5 text-[#F5A623] stroke-[2.2]" />;
      case 'Grammar':
        return <FileText className="w-5 h-5 text-[#3B3D6B] stroke-[2.2]" />;
      case 'Listening':
        return <Headphones className="w-5 h-5 text-[#3B3D6B] stroke-[2.2]" />;
    }
  };

  return (
    <section aria-label="Learning Categories" className="py-1">
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
        {shortcuts.map((shortcut) => (
          <button
            key={shortcut.id}
            onClick={() => onSelectShortcut(shortcut)}
            className="flex flex-col items-center gap-2 group focus:outline-hidden"
            aria-label={`${shortcut.title}: ${shortcut.description}`}
          >
            {/* White Rounded Tile */}
            <div className="w-[54px] h-[54px] sm:w-[58px] sm:h-[58px] rounded-2xl bg-white border border-[#ECEEFE] flex items-center justify-center shadow-lexi-card group-hover:border-[#C5C9EB] group-hover:shadow-md group-hover:-translate-y-0.5 transition-all focus-within:ring-2 focus-within:ring-[#646AA4]">
              {getIcon(shortcut.iconName)}
            </div>

            {/* Title Label */}
            <span className="text-[11px] font-semibold text-[#30335F] tracking-tight group-hover:text-[#232655] transition-colors">
              {shortcut.title}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};
