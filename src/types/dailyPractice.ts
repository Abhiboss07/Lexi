export type DailyPracticeCategory = 'vocabulary' | 'listening' | 'speaking';

export type DailyPracticeStatus = 'ready' | 'in-progress' | 'completed';

export interface DailyPracticeOption {
  id: DailyPracticeCategory;
  title: string;
  badgeText: string;
  status: DailyPracticeStatus;
  topicTitle: string;
  description: string;
  dueCount?: number;
  durationMinutes: number;
}
