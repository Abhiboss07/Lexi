import React from 'react';
import { 
  MessageCircle, 
  BookOpen, 
  Sparkles, 
  FileText, 
  Headphones, 
  ChevronRight,
  Mic,
} from 'lucide-react';

export type PracticeCategoryKey = 'conversation' | 'speaking' | 'stories' | 'vocabulary' | 'grammar' | 'listening' | 'interview';

export interface PracticeCategoryNavProps {
  activeCategory?: PracticeCategoryKey;
  onSelectCategory: (category: PracticeCategoryKey) => void;
  dueVocabularyCount?: number;
}

export const PRACTICE_CATEGORIES: Array<{
  key: PracticeCategoryKey;
  title: string;
  badge: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  description: string;
}> = [
  {
    key: 'conversation',
    title: 'Conversation',
    badge: 'AI Partner',
    badgeColor: 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]',
    icon: MessageCircle,
    iconBg: 'bg-[#EFF6FF]',
    iconColor: 'text-[#2563EB]',
    description: 'Natural dialogues, instant feedback & confidence',
  },
  {
    key: 'speaking',
    title: 'Speaking',
    badge: 'Fluency Coach',
    badgeColor: 'bg-[#FFE4E6] text-[#E11D48] border-[#FECDD3]',
    icon: Mic,
    iconBg: 'bg-[#FFE4E6]',
    iconColor: 'text-[#E11D48]',
    description: 'Pronunciation models, rhythm & phrase-by-phrase practice',
  },
  {
    key: 'listening',
    title: 'Listening',
    badge: 'Audio Studio',
    badgeColor: 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]',
    icon: Headphones,
    iconBg: 'bg-[#F5F3FF]',
    iconColor: 'text-[#7C3AED]',
    description: 'CEFR audio dialogues, key phrases & comprehension checks',
  },
  {
    key: 'stories',
    title: 'Stories',
    badge: 'Interactive',
    badgeColor: 'bg-[#FDF4FF] text-[#C026D3] border-[#F5D0FE]',
    icon: BookOpen,
    iconBg: 'bg-[#FDF4FF]',
    iconColor: 'text-[#C026D3]',
    description: 'Read level-graded stories, listen & test comprehension',
  },
  {
    key: 'vocabulary',
    title: 'Vocabulary',
    badge: 'FSRS Deck',
    badgeColor: 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]',
    icon: Sparkles,
    iconBg: 'bg-[#ECFDF5]',
    iconColor: 'text-[#059669]',
    description: 'Smart spaced repetition & memory retention curves',
  },
  {
    key: 'grammar',
    title: 'Grammar',
    badge: 'Mastery',
    badgeColor: 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]',
    icon: FileText,
    iconBg: 'bg-[#FFFBEB]',
    iconColor: 'text-[#D97706]',
    description: 'Tenses, sentence transformations & error correction',
  },
];

export const PracticeCategoryNav: React.FC<PracticeCategoryNavProps> = ({
  onSelectCategory,
  dueVocabularyCount = 0,
}) => {
  return (
    <section aria-label="Practice Categories" className="space-y-2.5">
      <div className="flex items-center justify-between px-0.5">
        <h2 className="text-[15px] font-black text-[#15164B] tracking-tight">
          Explore Practice Studios
        </h2>
        <span className="text-[11px] font-bold text-[#6B7094] uppercase tracking-wider">
          5 Skill Hubs
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {PRACTICE_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isVocab = cat.key === 'vocabulary';

          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => onSelectCategory(cat.key)}
              className="w-full text-left p-3.5 rounded-2xl bg-white border border-[#ECEEFE] hover:border-[#CCD1F0] shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 group focus:outline-hidden focus:ring-2 focus:ring-[#545CA6] focus:ring-offset-1"
              aria-label={`Open ${cat.title} Studio: ${cat.description}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-11 h-11 rounded-2xl ${cat.iconBg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}
                >
                  <Icon className={`w-5 h-5 ${cat.iconColor}`} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[14px] font-extrabold text-[#1C2046] tracking-tight group-hover:text-[#545CA6] transition-colors">
                      {cat.title}
                    </span>
                    <span
                      className={`text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${cat.badgeColor}`}
                    >
                      {isVocab && dueVocabularyCount > 0
                        ? `${dueVocabularyCount} Due`
                        : cat.badge}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-[#6B7094] truncate font-medium mt-0.5">
                    {cat.description}
                  </p>
                </div>
              </div>

              <div className="w-7 h-7 rounded-full bg-[#F4F5FD] group-hover:bg-[#ECEFFD] flex items-center justify-center text-[#545CA6] shrink-0 transition-colors">
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
