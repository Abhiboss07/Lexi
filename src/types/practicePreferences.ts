import type { CEFRLevel } from './curriculum';
import {
  type NotificationCategoryPreferences,
  DEFAULT_NOTIFICATION_CATEGORIES,
} from './notifications';

export type PracticeDifficulty = 'easy' | 'medium' | 'hard';
export type PracticeSessionLength = 'quick' | 'standard' | 'extended';
export type ReminderFrequency = 'off' | 'daily' | 'weekdays';
export type CorrectionTiming = 'immediate' | 'end_of_session';
export type ExplanationDepth = 'gentle' | 'detailed';
export type InputModePreference = 'text_first' | 'voice_first';
export type PracticeDay = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export const ALL_PRACTICE_DAYS: PracticeDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const VALID_DAILY_GOALS = [5, 10, 15, 20, 30] as const;
export type DailyGoalOption = typeof VALID_DAILY_GOALS[number];

export interface PracticePreferences {
  userId: string;
  cefrLevel: CEFRLevel;
  defaultDifficulty: PracticeDifficulty;
  defaultSessionLength: PracticeSessionLength;
  dailyGoalMinutes: number;
  correctionTiming: CorrectionTiming;
  explanationDepth: ExplanationDepth;
  hintsEnabled: boolean;
  inputMode: InputModePreference;
  practiceDays: PracticeDay[];
  reminderFrequency: ReminderFrequency;
  reminderTime?: string;
  inAppRemindersEnabled: boolean;
  systemNotificationsEnabled: boolean;
  notificationCategories: NotificationCategoryPreferences;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  updatedAt?: string;
}

export interface PracticeSessionConfig {
  difficulty: PracticeDifficulty;
  sessionLength: PracticeSessionLength;
  isOverride?: boolean;
}

export interface PracticeSessionRecord {
  id: string;
  userId: string;
  category: string;
  activityId?: string;
  difficulty: PracticeDifficulty;
  sessionLength: PracticeSessionLength;
  durationMinutes: number;
  completedAt: string;
  score?: number;
  notes?: string;
}

export const SESSION_LENGTH_MINUTES: Record<PracticeSessionLength, number> = {
  quick: 5,
  standard: 10,
  extended: 15,
};

export const SESSION_LENGTH_RANGES: Record<PracticeSessionLength, { label: string; range: string; targetQuestions: number }> = {
  quick: {
    label: 'Quick',
    range: '3–5 min',
    targetQuestions: 4,
  },
  standard: {
    label: 'Standard',
    range: '8–10 min',
    targetQuestions: 8,
  },
  extended: {
    label: 'Extended',
    range: '15–20 min',
    targetQuestions: 14,
  },
};

export const DIFFICULTY_DESCRIPTIONS: Record<PracticeDifficulty, { label: string; description: string; speechRate: number }> = {
  easy: {
    label: 'Easy',
    description: 'Slower speech (0.8x), simpler vocabulary, shorter prompts, and additional hints.',
    speechRate: 0.8,
  },
  medium: {
    label: 'Medium',
    description: 'Balanced challenge, normal hints, natural speech (1.0x), and balanced sentence complexity.',
    speechRate: 1.0,
  },
  hard: {
    label: 'Hard',
    description: 'More complex vocabulary, fewer hints, longer responses, authentic audio (1.15x), and demanding exercises.',
    speechRate: 1.15,
  },
};

export const CEFR_LEVEL_DESCRIPTIONS: Record<string, { name: string; tag: string; description: string }> = {
  A1: {
    name: 'A1 — Beginner',
    tag: 'Beginner',
    description: 'Basic everyday greetings, simple questions, and foundational vocabulary.',
  },
  A2: {
    name: 'A2 — Elementary',
    tag: 'Elementary',
    description: 'Everyday conversations, practical routines, simple stories, and personal background.',
  },
  B1: {
    name: 'B1 — Intermediate',
    tag: 'Intermediate',
    description: 'Expressing opinions, travel situations, connecting ideas, and work communication.',
  },
  B2: {
    name: 'B2 — Upper Intermediate',
    tag: 'Upper Intermediate',
    description: 'Nuanced discussion, complex arguments, idiomatic language, and professional interviews.',
  },
  C1: {
    name: 'C1 — Advanced',
    tag: 'Advanced',
    description: 'Spontaneous fluency, subtle register shifts, sophisticated reasoning, and complex texts.',
  },
};

export const DEFAULT_PRACTICE_PREFERENCES: Omit<PracticePreferences, 'userId'> = {
  cefrLevel: 'A2',
  defaultDifficulty: 'medium',
  defaultSessionLength: 'standard',
  dailyGoalMinutes: 15,
  correctionTiming: 'immediate',
  explanationDepth: 'gentle',
  hintsEnabled: true,
  inputMode: 'text_first',
  practiceDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  reminderFrequency: 'off',
  reminderTime: '09:00',
  inAppRemindersEnabled: true,
  systemNotificationsEnabled: false,
  notificationCategories: { ...DEFAULT_NOTIFICATION_CATEGORIES },
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

/**
 * Validates and sanitizes preference records loaded from storage.
 * Gracefully falls back to sensible defaults for missing or corrupted keys.
 */
export function validatePracticePreferences(
  input: unknown,
  userId: string = 'local-learner-1',
  fallbackCefr: CEFRLevel = 'A2'
): PracticePreferences {
  if (!input || typeof input !== 'object') {
    return {
      userId,
      ...DEFAULT_PRACTICE_PREFERENCES,
      cefrLevel: fallbackCefr,
      updatedAt: new Date().toISOString(),
    };
  }

  const obj = input as Record<string, unknown>;

  const validDifficulties: PracticeDifficulty[] = ['easy', 'medium', 'hard'];
  const difficulty: PracticeDifficulty = validDifficulties.includes(obj.defaultDifficulty as PracticeDifficulty)
    ? (obj.defaultDifficulty as PracticeDifficulty)
    : 'medium';

  const validLengths: PracticeSessionLength[] = ['quick', 'standard', 'extended'];
  const sessionLength: PracticeSessionLength = validLengths.includes(obj.defaultSessionLength as PracticeSessionLength)
    ? (obj.defaultSessionLength as PracticeSessionLength)
    : 'standard';

  const validGoals = [5, 10, 15, 20, 30];
  const goalNum = Number(obj.dailyGoalMinutes);
  const dailyGoalMinutes = validGoals.includes(goalNum) ? goalNum : 15;

  const validReminders: ReminderFrequency[] = ['off', 'daily', 'weekdays'];
  const reminderFrequency: ReminderFrequency = validReminders.includes(obj.reminderFrequency as ReminderFrequency)
    ? (obj.reminderFrequency as ReminderFrequency)
    : 'off';

  const validCefr: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const cefrLevel: CEFRLevel = validCefr.includes(obj.cefrLevel as CEFRLevel)
    ? (obj.cefrLevel as CEFRLevel)
    : fallbackCefr;

  const correctionTiming: CorrectionTiming = obj.correctionTiming === 'end_of_session' ? 'end_of_session' : 'immediate';
  const explanationDepth: ExplanationDepth = obj.explanationDepth === 'detailed' ? 'detailed' : 'gentle';
  const hintsEnabled = typeof obj.hintsEnabled === 'boolean' ? obj.hintsEnabled : true;
  const inputMode: InputModePreference = obj.inputMode === 'voice_first' ? 'voice_first' : 'text_first';

  let practiceDays: PracticeDay[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  if (Array.isArray(obj.practiceDays) && obj.practiceDays.length > 0) {
    const filtered = obj.practiceDays.filter((d): d is PracticeDay => ALL_PRACTICE_DAYS.includes(d as PracticeDay));
    if (filtered.length > 0) {
      practiceDays = filtered;
    }
  }

  const reminderTime = typeof obj.reminderTime === 'string' && /^\d{2}:\d{2}$/.test(obj.reminderTime)
    ? obj.reminderTime
    : '09:00';

  const inAppRemindersEnabled = typeof obj.inAppRemindersEnabled === 'boolean' ? obj.inAppRemindersEnabled : true;
  const systemNotificationsEnabled = typeof obj.systemNotificationsEnabled === 'boolean' ? obj.systemNotificationsEnabled : false;

  const rawCats = (obj.notificationCategories as Record<string, unknown>) || {};
  const notificationCategories: NotificationCategoryPreferences = {
    streaks: typeof rawCats.streaks === 'boolean' ? rawCats.streaks : true,
    vocabulary: typeof rawCats.vocabulary === 'boolean' ? rawCats.vocabulary : true,
    unfinished: typeof rawCats.unfinished === 'boolean' ? rawCats.unfinished : true,
    dailyChallenge: typeof rawCats.dailyChallenge === 'boolean' ? rawCats.dailyChallenge : true,
    milestones: typeof rawCats.milestones === 'boolean' ? rawCats.milestones : true,
  };

  const quietHoursStart = typeof obj.quietHoursStart === 'string' && /^\d{2}:\d{2}$/.test(obj.quietHoursStart)
    ? obj.quietHoursStart
    : '22:00';
  const quietHoursEnd = typeof obj.quietHoursEnd === 'string' && /^\d{2}:\d{2}$/.test(obj.quietHoursEnd)
    ? obj.quietHoursEnd
    : '08:00';

  return {
    userId,
    cefrLevel,
    defaultDifficulty: difficulty,
    defaultSessionLength: sessionLength,
    dailyGoalMinutes,
    correctionTiming,
    explanationDepth,
    hintsEnabled,
    inputMode,
    practiceDays,
    reminderFrequency,
    reminderTime,
    inAppRemindersEnabled,
    systemNotificationsEnabled,
    notificationCategories,
    quietHoursStart,
    quietHoursEnd,
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : new Date().toISOString(),
  };
}
