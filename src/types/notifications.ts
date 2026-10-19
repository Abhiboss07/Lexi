import type { PracticeCategoryKey } from '../components/practice/PracticeCategoryNav';
import type { ActivityHubKey } from '../components/quickpicks/ExploreActivitiesHub';

export type NotificationType =
  | 'streak_reminder'
  | 'vocabulary_review'
  | 'unfinished_activity'
  | 'daily_goal'
  | 'daily_challenge'
  | 'milestone';

export type NotificationPriority = 'low' | 'normal' | 'high';

export interface NotificationDestination {
  tab?: 'Home' | 'Explore' | 'Practice' | 'Progress';
  studio?: PracticeCategoryKey;
  quickPickModal?: 'quest' | 'notes' | 'sketch' | 'challenge';
  hubActivity?: ActivityHubKey;
  lessonId?: string;
  startReview?: boolean;
}

export interface SmartNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string; // emoji or identifier
  actionLabel: string;
  destination: NotificationDestination;
  priority: NotificationPriority;
  createdAt: string;
  expiresAt?: string;
}

export interface NotificationCategoryPreferences {
  streaks: boolean;
  vocabulary: boolean;
  unfinished: boolean;
  dailyChallenge: boolean;
  milestones: boolean;
}

export const DEFAULT_NOTIFICATION_CATEGORIES: NotificationCategoryPreferences = {
  streaks: true,
  vocabulary: true,
  unfinished: true,
  dailyChallenge: true,
  milestones: true,
};

export interface NotificationEventRecord {
  id: string;
  userId: string;
  type: NotificationType;
  date: string; // YYYY-MM-DD
  timestamp: string;
  status: 'shown' | 'dismissed' | 'clicked';
}
