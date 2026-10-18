export interface UserProfile {
  id: string;
  name: string;
  email: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
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
