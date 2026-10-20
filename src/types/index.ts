import type { CEFRLevel } from './curriculum';

export * from './curriculum';
export * from './vocabulary';
export * from './practicePreferences';
export * from './dailyPractice';
export * from './achievements';
export * from './quickPicks';
export * from './scenarios';
export * from './adaptivePlan';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  cefrLevel: CEFRLevel;
  dailyGoalMinutes: number;
  avatarUrl: string;
}

export interface LearningShortcut {
  id: string;
  title: string;
  iconName: 'Conversation' | 'Stories' | 'Vocabulary' | 'Grammar' | 'Listening';
  badgeColor?: string;
  description: string;
}

export interface QuickPickItem {
  id: string;
  title: string;
  subtitle: string;
  iconAsset: string;
  badgeText?: string;
  routeId: string;
}

export interface FeaturedActivity {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  durationText: string;
  difficultyText: string;
  imageAsset: string;
}

export type NavigationTab = 'Home' | 'Explore' | 'Practice' | 'Progress';

export type AdventureCategory = 'All' | 'Daily Life' | 'Travel' | 'Career' | 'Fun';

export interface AdventureScenario {
  id: string;
  title: string;
  subtitle: string;
  category: Exclude<AdventureCategory, 'All'>;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  badgeLabel: string;
  description: string;
  iconType: 'plane' | 'shopping' | 'briefcase' | 'coffee' | 'compass' | 'utensils';
  samplePrompt?: string;
}

export interface JourneyCurriculumUnit {
  unitNumber: number;
  unitLabel: string;
  title: string;
  subtitle: string;
  description: string;
  progressPercent: number;
  totalLessons: number;
  completedLessons: number;
  nextLessonTitle: string;
}

export interface PopularModule {
  id: string;
  title: string;
  subtitle: string;
  category: 'Stories' | 'Speaking' | 'Conversation' | 'Grammar' | 'Vocabulary';
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
  description: string;
  iconName: 'book-open' | 'mic' | 'message-circle' | 'sparkles' | 'compass';
}
