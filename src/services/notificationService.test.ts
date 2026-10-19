import { describe, it, expect } from 'vitest';
import {
  evaluateSmartNotification,
  isQuietHour,
  formatNotificationDate,
  formatNotificationTime,
  type SmartNotificationContext,
} from './notificationService';
import type { PracticePreferences } from '../types/practicePreferences';

describe('NotificationService — Smart Context-Aware Notifications', () => {
  const basePreferences: PracticePreferences = {
    userId: 'test-user',
    cefrLevel: 'A2',
    defaultDifficulty: 'medium',
    defaultSessionLength: 'standard',
    dailyGoalMinutes: 15,
    correctionTiming: 'immediate',
    explanationDepth: 'gentle',
    hintsEnabled: true,
    inputMode: 'text_first',
    practiceDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], // Mon-Fri
    reminderFrequency: 'daily',
    reminderTime: '10:00',
    inAppRemindersEnabled: true,
    systemNotificationsEnabled: false,
    notificationCategories: {
      streaks: true,
      vocabulary: true,
      unfinished: true,
      dailyChallenge: true,
      milestones: true,
    },
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  };

  const createBaseContext = (overrides?: Partial<SmartNotificationContext>): SmartNotificationContext => ({
    userId: 'test-user',
    preferences: { ...basePreferences },
    user: {
      currentStreak: 7,
      lastActiveDate: '2026-10-18', // Yesterday
    },
    dueCardsCount: 0,
    todayPracticeMinutes: 0,
    dailyChallengeCompleted: false,
    events: [],
    now: new Date('2026-10-19T11:00:00'), // Monday 11:00 AM
    ...overrides,
  });

  it('correctly detects quiet hours across midnight boundary', () => {
    expect(isQuietHour('22:30', '22:00', '08:00')).toBe(true);
    expect(isQuietHour('03:15', '22:00', '08:00')).toBe(true);
    expect(isQuietHour('07:59', '22:00', '08:00')).toBe(true);
    expect(isQuietHour('08:00', '22:00', '08:00')).toBe(false);
    expect(isQuietHour('14:00', '22:00', '08:00')).toBe(false);
    expect(isQuietHour('21:59', '22:00', '08:00')).toBe(false);
  });

  it('formats dates and times consistently', () => {
    const d = new Date('2026-10-19T15:45:00');
    expect(formatNotificationDate(d)).toBe('2026-10-19');
    expect(formatNotificationTime(d)).toBe('15:45');
  });

  it('suppresses notifications when in-app reminders are disabled', () => {
    const ctx = createBaseContext({
      preferences: { ...basePreferences, inAppRemindersEnabled: false },
    });
    const result = evaluateSmartNotification(ctx);
    expect(result).toBeNull();
  });

  it('suppresses notifications during quiet hours', () => {
    const ctx = createBaseContext({
      now: new Date('2026-10-19T23:15:00'), // 11:15 PM
    });
    const result = evaluateSmartNotification(ctx);
    expect(result).toBeNull();
  });

  it('suppresses reminders on non-preferred practice days', () => {
    const ctx = createBaseContext({
      now: new Date('2026-10-18T14:00:00'), // Sunday (not in Mon-Fri)
    });
    const result = evaluateSmartNotification(ctx);
    expect(result).toBeNull();
  });

  it('evaluates milestone celebration when daily practice target is met', () => {
    const ctx = createBaseContext({
      todayPracticeMinutes: 18, // >= 15 min daily goal
      now: new Date('2026-10-19T14:00:00'),
    });
    const result = evaluateSmartNotification(ctx);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('milestone');
    expect(result?.title).toContain('Daily Goal Achieved');
    expect(result?.destination.tab).toBe('Progress');
  });

  it('evaluates vocabulary review due before streak reminder', () => {
    const ctx = createBaseContext({
      dueCardsCount: 4,
      now: new Date('2026-10-19T10:00:00'),
    });
    const result = evaluateSmartNotification(ctx);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('vocabulary_review');
    expect(result?.message).toContain('4 words ready for spaced-repetition review');
    expect(result?.destination.startReview).toBe(true);
  });

  it('evaluates streak reminder when learner has not practiced today', () => {
    const ctx = createBaseContext({
      dueCardsCount: 0,
      todayPracticeMinutes: 0,
      now: new Date('2026-10-19T10:00:00'),
    });
    const result = evaluateSmartNotification(ctx);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('streak_reminder');
    expect(result?.message).toContain('7-day learning streak');
    expect(result?.destination.tab).toBe('Home');
  });

  it('evaluates daily challenge when streak is already satisfied', () => {
    const ctx = createBaseContext({
      dueCardsCount: 0,
      user: { currentStreak: 7, lastActiveDate: '2026-10-19' }, // Already practiced today
      dailyChallengeCompleted: false,
      now: new Date('2026-10-19T10:00:00'),
    });
    const result = evaluateSmartNotification(ctx);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('daily_challenge');
    expect(result?.actionLabel).toBe('Play Challenge');
  });

  it('evaluates daily goal progress when session is partially completed', () => {
    const ctx = createBaseContext({
      dueCardsCount: 0,
      user: { currentStreak: 7, lastActiveDate: '2026-10-19' },
      dailyChallengeCompleted: true, // challenge done
      todayPracticeMinutes: 8, // partially towards 15 min goal
      now: new Date('2026-10-19T10:00:00'),
    });
    const result = evaluateSmartNotification(ctx);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('daily_goal');
    expect(result?.message).toContain('8 of your 15 practice minutes');
  });

  it('enforces frequency limit when a notification was shown in the last 45 minutes', () => {
    const now = new Date('2026-10-19T11:00:00');
    const ctx = createBaseContext({
      now,
      events: [
        {
          id: 'prev-event',
          userId: 'test-user',
          type: 'streak_reminder',
          date: '2026-10-19',
          timestamp: new Date('2026-10-19T10:40:00').toISOString(), // 20 min ago
          status: 'shown',
        },
      ],
    });
    const result = evaluateSmartNotification(ctx);
    expect(result).toBeNull();
  });

  it('respects disabled category preferences', () => {
    const ctx = createBaseContext({
      dueCardsCount: 5,
      preferences: {
        ...basePreferences,
        notificationCategories: {
          ...basePreferences.notificationCategories,
          vocabulary: false, // Disabled
        },
      },
    });
    const result = evaluateSmartNotification(ctx);
    // Should skip vocabulary and fall back to streak reminder
    expect(result?.type).toBe('streak_reminder');
  });
});
