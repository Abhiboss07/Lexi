import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Sparkles,
  CheckCircle2,
  Clock,
  Sliders,
  ChevronRight,
  MessageSquare,
  BookOpen,
  PenTool,
  Mic,
  Briefcase,
  Layers,
  Gamepad2,
  Volume2,
  Calendar,
  Flame,
} from 'lucide-react';
import { quickPicksRepository } from '../../db/quickPicksRepository';
import type { ActivityCompletionRecord } from '../../types/quickPicks';

export type ActivityHubKey =
  | 'phrase_builder'
  | 'mini_grammar'
  | 'scenario_challenge'
  | 'idiom_of_day'
  | 'quick_notes'
  | 'daily_word_puzzle'
  | 'describe_and_draw'
  | 'listening_quiz'
  | 'speaking_prompt'
  | 'interview_sprint'
  | 'word_quest'
  | 'sketch_explain'
  | 'daily_challenge';

export interface ExploreActivitiesHubProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchActivity: (activityKey: ActivityHubKey) => void;
  onOpenPreferences?: () => void;
  userId?: string;
  userLevel?: string;
}

interface ActivityItem {
  id: ActivityHubKey;
  title: string;
  category: 'games' | 'vocab' | 'grammar' | 'speaking' | 'creative' | 'career';
  categoryLabel: string;
  duration: string;
  levelBadge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  bgLight: string;
  tag: string;
}

const ACTIVITIES: ActivityItem[] = [
  {
    id: 'phrase_builder',
    title: 'Phrase Builder',
    category: 'games',
    categoryLabel: 'Quick Games',
    duration: '3–5 min',
    levelBadge: 'Adaptive A1–C1',
    description: 'Assemble real conversational sentences token by token with syntax hints and natural word ordering.',
    icon: Layers,
    accentColor: '#3B82F6',
    bgLight: '#EFF6FF',
    tag: 'Sentence Flow',
  },
  {
    id: 'mini_grammar',
    title: 'Mini Grammar Games',
    category: 'grammar',
    categoryLabel: 'Grammar & Writing',
    duration: '3–5 min',
    levelBadge: 'A1–B2',
    description: 'Spot sentence errors, fix irregular tenses, and master prepositions with immediate coach feedback.',
    icon: BookOpen,
    accentColor: '#8B5CF6',
    bgLight: '#F5F3FF',
    tag: 'Error Spotting',
  },
  {
    id: 'scenario_challenge',
    title: 'Real-Life Scenario Challenge',
    category: 'speaking',
    categoryLabel: 'Listening & Speaking',
    duration: '5–8 min',
    levelBadge: 'A2–C1',
    description: 'Handle café orders, travel delays, and team discussions with structured multi-turn dialogue goals.',
    icon: MessageSquare,
    accentColor: '#10B981',
    bgLight: '#ECFDF5',
    tag: 'Roleplay',
  },
  {
    id: 'idiom_of_day',
    title: 'Idiom & Expression of the Day',
    category: 'vocab',
    categoryLabel: 'Vocabulary & Idioms',
    duration: '2–3 min',
    levelBadge: 'All Levels',
    description: 'Learn a daily natural native expression, see it in authentic dialogue, and bookmark for spaced review.',
    icon: Sparkles,
    accentColor: '#F59E0B',
    bgLight: '#FFFBEB',
    tag: 'Natural Slang',
  },
  {
    id: 'daily_word_puzzle',
    title: 'Daily Word Puzzle',
    category: 'games',
    categoryLabel: 'Quick Games',
    duration: '2–4 min',
    levelBadge: 'Word Clues',
    description: 'Guess the missing letters using lexical hints and context sentences to unlock bonus XP once daily.',
    icon: Gamepad2,
    accentColor: '#EC4899',
    bgLight: '#FDF2F8',
    tag: 'Daily Streak',
  },
  {
    id: 'describe_and_draw',
    title: 'Describe & Draw',
    category: 'creative',
    categoryLabel: 'Creative & Visual',
    duration: '5–10 min',
    levelBadge: 'Visual Writing',
    description: 'Sketch a concept on the canvas and write rich English sentences describing colors, shapes, and mood.',
    icon: PenTool,
    accentColor: '#6366F1',
    bgLight: '#EEF2FF',
    tag: 'Creative Writing',
  },
  {
    id: 'listening_quiz',
    title: 'Short Listening Quiz',
    category: 'speaking',
    categoryLabel: 'Listening & Speaking',
    duration: '3–5 min',
    levelBadge: 'Speech Audio',
    description: 'Listen to spoken dialogues at normal or slow speed, test comprehension, and inspect verified transcripts.',
    icon: Volume2,
    accentColor: '#06B6D4',
    bgLight: '#ECFEFF',
    tag: 'Comprehension',
  },
  {
    id: 'speaking_prompt',
    title: 'Speaking Prompt of the Day',
    category: 'speaking',
    categoryLabel: 'Listening & Speaking',
    duration: '3–5 min',
    levelBadge: 'Speech & Text',
    description: 'Record or write your spontaneous response to thoughtful conversation starters with speech feedback.',
    icon: Mic,
    accentColor: '#14B8A6',
    bgLight: '#F0FDFA',
    tag: 'Fluency',
  },
  {
    id: 'interview_sprint',
    title: 'Interview Question Sprint',
    category: 'career',
    categoryLabel: 'Career & Goals',
    duration: '5–10 min',
    levelBadge: 'STAR Method',
    description: 'Draft confident behavioral answers using Situation, Task, Action, and Result structured coaching.',
    icon: Briefcase,
    accentColor: '#4F46E5',
    bgLight: '#EEF2FF',
    tag: 'Professional',
  },
  {
    id: 'quick_notes',
    title: 'Personal Learning Notebook',
    category: 'career',
    categoryLabel: 'Study Tools',
    duration: 'Anytime',
    levelBadge: 'Organized',
    description: 'Save custom grammar rules, tricky pronunciation notes, interview goals, and favorite expressions.',
    icon: BookOpen,
    accentColor: '#545CA6',
    bgLight: '#EFF2FE',
    tag: 'Memory Bank',
  },
  {
    id: 'word_quest',
    title: 'Word Quest Mini Game',
    category: 'games',
    categoryLabel: 'Quick Games',
    duration: '3 min',
    levelBadge: 'Rapid Fire',
    description: 'Beat the clock with rapid-fire vocabulary definition matching and quick word association challenges.',
    icon: Flame,
    accentColor: '#EA580C',
    bgLight: '#FFF7ED',
    tag: 'Speed Run',
  },
  {
    id: 'sketch_explain',
    title: 'Sketch & Explain Canvas',
    category: 'creative',
    categoryLabel: 'Creative & Visual',
    duration: '5 min',
    levelBadge: 'Visual Learning',
    description: 'Draw custom visual mnemonics and connect them to real English terminology and example sentences.',
    icon: PenTool,
    accentColor: '#7C3AED',
    bgLight: '#F5F3FF',
    tag: 'Visual Memory',
  },
  {
    id: 'daily_challenge',
    title: 'Daily Micro-Challenge',
    category: 'career',
    categoryLabel: 'One Small Win',
    duration: '2 min',
    levelBadge: 'Daily Habit',
    description: 'Complete one small actionable English goal every day to build lasting confidence and habit streaks.',
    icon: Calendar,
    accentColor: '#059669',
    bgLight: '#ECFDF5',
    tag: 'Habit Builder',
  },
];

type CategoryFilter = 'all' | 'games' | 'vocab' | 'grammar' | 'speaking' | 'creative' | 'career';

export const ExploreActivitiesHub: React.FC<ExploreActivitiesHubProps> = ({
  isOpen,
  onClose,
  onLaunchActivity,
  onOpenPreferences,
  userId = 'local-learner-1',
  userLevel = 'A2',
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [completions, setCompletions] = useState<ActivityCompletionRecord[]>([]);

  useEffect(() => {
    if (isOpen) {
      quickPicksRepository.getAllActivityCompletions(userId).then(setCompletions).catch(console.error);
    }
  }, [isOpen, userId]);

  // Set of completed activity IDs today
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const completedTodayIds = useMemo(() => {
    const set = new Set<string>();
    for (const record of completions) {
      if (record.date === todayStr) {
        set.add(record.activityId);
      }
    }
    return set;
  }, [completions, todayStr]);

  const filteredActivities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ACTIVITIES.filter((act) => {
      if (activeCategory !== 'all' && act.category !== activeCategory) {
        return false;
      }
      if (q) {
        const matchesTitle = act.title.toLowerCase().includes(q);
        const matchesDesc = act.description.toLowerCase().includes(q);
        const matchesTag = act.tag.toLowerCase().includes(q);
        const matchesCat = act.categoryLabel.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesTag && !matchesCat) {
          return false;
        }
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#15164B]/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="explore-hub-title"
    >
      <div className="bg-[#FAF9FE] w-full max-w-2xl rounded-[32px] border border-[#E2E6FD] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-4 sm:p-6 bg-white border-b border-[#ECEEFE] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#EFF2FE] border border-[#D5D8EE] flex items-center justify-center text-[#545CA6]">
              <Sparkles className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="explore-hub-title" className="text-[18px] sm:text-[20px] font-black text-[#15164B] tracking-tight">
                  Explore Learning Activities
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#545CA6] bg-[#ECEFFD] px-2 py-0.5 rounded-full">
                  Level {userLevel}
                </span>
              </div>
              <p className="text-[12px] font-medium text-[#7D82A8]">
                Bite-sized games, real-life challenges, and interactive skill builders
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenPreferences && (
              <button
                onClick={onOpenPreferences}
                className="w-9 h-9 rounded-full bg-[#F0F2FE] hover:bg-[#E2E6FD] text-[#545CA6] flex items-center justify-center transition-colors cursor-pointer"
                title="Learning Preferences & Adaptive Coach"
                aria-label="Open learning preferences"
              >
                <Sliders className="w-4 h-4 stroke-[2.2]" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#F0F2FE] hover:bg-[#E2E6FD] text-[#545CA6] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Back to Home"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Controls: Search & Category Filter Pills */}
        <div className="p-4 sm:px-6 bg-[#F5F6FE] border-b border-[#ECEEFE] space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-[#8E93B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activities, skills, games, or topics..."
              className="w-full pl-10 pr-4 py-2.5 bg-white rounded-full border border-[#DCE0F7] text-[13px] text-[#15164B] placeholder-[#8E93B8] focus:border-[#545CA6] focus:ring-2 focus:ring-[#545CA6]/20 shadow-xs transition-all outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[11px] font-bold text-[#8E93B8] hover:text-[#15164B] absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11.5px] font-bold">
            {(
              [
                { id: 'all', label: `All (${ACTIVITIES.length})` },
                { id: 'games', label: 'Quick Games' },
                { id: 'vocab', label: 'Vocabulary' },
                { id: 'grammar', label: 'Grammar' },
                { id: 'speaking', label: 'Listening & Speaking' },
                { id: 'creative', label: 'Creative & Visual' },
                { id: 'career', label: 'Career & Goals' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-[#15164B] text-white shadow-xs'
                    : 'bg-white border border-[#E2E6FD] text-[#5B618E] hover:bg-[#EFF2FE]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Activities Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {filteredActivities.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#ECEEFE] space-y-2">
              <p className="text-[14px] font-bold text-[#15164B]">No matching activities found</p>
              <p className="text-[12px] text-[#7D82A8]">Try clearing your search query or switching categories.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="mt-2 px-4 py-2 bg-[#15164B] text-white rounded-xl text-[12px] font-bold cursor-pointer"
              >
                Show All Activities
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredActivities.map((act) => {
                const IconComponent = act.icon;
                const isCompleted = completedTodayIds.has(act.id);

                return (
                  <div
                    key={act.id}
                    className="bg-white rounded-2xl border border-[#E2E6FD] hover:border-[#CBD1FA] p-4 flex flex-col justify-between transition-all hover:shadow-md group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: act.bgLight, color: act.accentColor }}
                          >
                            <IconComponent className="w-4 h-4 stroke-[2.2]" />
                          </div>
                          <span className="text-[11px] font-bold text-[#5B618E]">{act.tag}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] text-[10.5px] font-bold border border-[#A7F3D0]">
                              <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                              <span>Done</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#7D82A8] bg-[#F4F5FD] px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" />
                              <span>{act.duration}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-[14px] font-black text-[#15164B] tracking-tight group-hover:text-[#3B428A] transition-colors mb-1">
                        {act.title}
                      </h3>
                      <p className="text-[12px] text-[#6E739F] leading-snug font-medium mb-3">
                        {act.description}
                      </p>
                    </div>

                    {/* Bottom CTA Row */}
                    <div className="pt-2 border-t border-[#F0F2FD] flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#8E93B8]">{act.levelBadge}</span>
                      <button
                        onClick={() => {
                          onLaunchActivity(act.id);
                        }}
                        aria-label={`Start ${act.title}`}
                        className="px-3.5 py-1.5 rounded-xl bg-[#15164B] hover:bg-[#232655] text-white text-[12px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs group-hover:scale-[1.02]"
                      >
                        <span>Start</span>
                        <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:px-6 bg-white border-t border-[#ECEEFE] flex items-center justify-between text-[11.5px] text-[#7D82A8] font-medium shrink-0">
          <span>{ACTIVITIES.length} practice modules available</span>
          <button
            onClick={onClose}
            className="font-bold text-[#15164B] hover:underline cursor-pointer"
          >
            Close Hub
          </button>
        </div>
      </div>
    </div>
  );
};
