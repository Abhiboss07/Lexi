import { db } from '../db';
import { practiceRepository } from '../db/practiceRepository';
import { vocabularyRepository } from '../db/vocabularyRepository';
import { quickPicksRepository } from '../db/quickPicksRepository';
import type { PracticeDay, PracticePreferences } from '../types/practicePreferences';
import type {
  SmartNotification,
  NotificationType,
  NotificationEventRecord,
} from '../types/notifications';

export const NOTIFICATION_DAY_NAMES: PracticeDay[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface SmartNotificationContext {
  userId: string;
  preferences: PracticePreferences;
  user: { currentStreak: number; lastActiveDate: string } | null;
  dueCardsCount: number;
  todayPracticeMinutes: number;
  dailyChallengeCompleted: boolean;
  events: NotificationEventRecord[];
  now: Date;
}

/**
 * Helper to format a Date into YYYY-MM-DD
 */
export function formatNotificationDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Helper to format a Date into HH:mm
 */
export function formatNotificationTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Checks whether the given time falls within the configured quiet hours.
 */
export function isQuietHour(timeStr: string, startStr = '22:00', endStr = '08:00'): boolean {
  if (startStr === endStr) return false;
  if (startStr > endStr) {
    // Overnight (e.g. 22:00 to 08:00)
    return timeStr >= startStr || timeStr < endStr;
  }
  // Daytime quiet period (e.g. 13:00 to 15:00)
  return timeStr >= startStr && timeStr < endStr;
}

/**
 * Pure deterministic calculation of the next smart notification based on context.
 */
export function evaluateSmartNotification(ctx: SmartNotificationContext): SmartNotification | null {
  const { preferences, user, dueCardsCount, todayPracticeMinutes, dailyChallengeCompleted, events, now } = ctx;
  const todayStr = formatNotificationDate(now);
  const timeStr = formatNotificationTime(now);
  const dayName = NOTIFICATION_DAY_NAMES[now.getDay()];

  // 1. In-App notifications enabled?
  if (!preferences.inAppRemindersEnabled) {
    return null;
  }

  // 2. Quiet hours check
  const quietStart = preferences.quietHoursStart || '22:00';
  const quietEnd = preferences.quietHoursEnd || '08:00';
  if (isQuietHour(timeStr, quietStart, quietEnd)) {
    return null;
  }

  const dailyGoal = preferences.dailyGoalMinutes || 15;
  const cats = preferences.notificationCategories;

  // 3. Check frequency limit: if any notification was shown or dismissed in the last 45 minutes, suppress
  const nowMs = now.getTime();
  const recentActivity = events.some((e: NotificationEventRecord) => {
    const eventMs = new Date(e.timestamp).getTime();
    return Math.abs(nowMs - eventMs) < 45 * 60 * 1000;
  });

  if (recentActivity) {
    return null;
  }

  // Has a notification of type X already been shown or dismissed today?
  const hasEventToday = (type: NotificationType): boolean => {
    return events.some((e: NotificationEventRecord) => e.date === todayStr && e.type === type);
  };

  // Candidate 1: Milestone celebration (if goal completed today)
  if (
    todayPracticeMinutes >= dailyGoal &&
    cats.milestones &&
    !hasEventToday('milestone')
  ) {
    return {
      id: `milestone-${todayStr}`,
      type: 'milestone',
      title: 'Daily Goal Achieved! 🌟',
      message: `Awesome work! You completed ${todayPracticeMinutes} practice minutes today, reaching your ${dailyGoal}-minute target.`,
      actionLabel: 'View Insights',
      icon: '🌟',
      destination: { tab: 'Progress' },
      priority: 'high',
      createdAt: now.toISOString(),
    };
  }

  // Check practice days: for reminders, only show if today is a preferred practice day
  const isPreferredDay = preferences.practiceDays.includes(dayName);
  if (!isPreferredDay) {
    return null;
  }

  // Candidate 2: Vocabulary review due
  if (
    dueCardsCount > 0 &&
    cats.vocabulary &&
    !hasEventToday('vocabulary_review')
  ) {
    return {
      id: `vocab-${todayStr}`,
      type: 'vocabulary_review',
      title: 'Vocabulary Due for Review',
      message: `You have ${dueCardsCount} ${dueCardsCount === 1 ? 'word' : 'words'} ready for spaced-repetition review in your deck.`,
      actionLabel: 'Start Review',
      icon: '📚',
      destination: { tab: 'Practice', startReview: true },
      priority: 'high',
      createdAt: now.toISOString(),
    };
  }

  // Candidate 3: Streak reminder (only if daily goal is not yet completed)
  const currentStreak = user?.currentStreak || 0;
  const lastActive = user?.lastActiveDate;
  if (
    currentStreak > 0 &&
    lastActive !== todayStr &&
    todayPracticeMinutes === 0 &&
    cats.streaks &&
    !hasEventToday('streak_reminder')
  ) {
    return {
      id: `streak-${todayStr}`,
      type: 'streak_reminder',
      title: 'Keep Your Streak Alive',
      message: `Your ${currentStreak}-day learning streak is waiting for you 🔥 A 5-minute session keeps it going.`,
      actionLabel: 'Practice Now',
      icon: '🔥',
      destination: { tab: 'Home', studio: 'conversation' },
      priority: 'normal',
      createdAt: now.toISOString(),
    };
  }

  // Candidate 4: Daily challenge available
  if (
    !dailyChallengeCompleted &&
    cats.dailyChallenge &&
    !hasEventToday('daily_challenge')
  ) {
    return {
      id: `challenge-${todayStr}`,
      type: 'daily_challenge',
      title: "Today's Challenge Ready",
      message: 'Test your conversational skills with today’s quick scenario challenge and build confidence.',
      actionLabel: 'Play Challenge',
      icon: '🎯',
      destination: { quickPickModal: 'challenge' },
      priority: 'normal',
      createdAt: now.toISOString(),
    };
  }

  // Candidate 5: Daily goal progress (in-progress)
  if (
    todayPracticeMinutes > 0 &&
    todayPracticeMinutes < dailyGoal &&
    cats.unfinished &&
    !hasEventToday('daily_goal')
  ) {
    const remaining = dailyGoal - todayPracticeMinutes;
    return {
      id: `goal-${todayStr}`,
      type: 'daily_goal',
      title: 'Almost At Your Daily Goal!',
      message: `You've completed ${todayPracticeMinutes} of your ${dailyGoal} practice minutes today (${remaining} min remaining).`,
      actionLabel: 'Continue',
      icon: '⚡',
      destination: { tab: 'Explore' },
      priority: 'low',
      createdAt: now.toISOString(),
    };
  }

  return null;
}

export class NotificationService {
  formatDate = formatNotificationDate;
  formatTime = formatNotificationTime;
  isQuietHour = isQuietHour;
  evaluateNotification = evaluateSmartNotification;

  /**
   * Computes the single most relevant smart notification for the user at the given time.
   * Gathers data from repositories and evaluates cleanly.
   */
  async getNextNotification(
    userId = 'local-learner-1',
    now = new Date()
  ): Promise<SmartNotification | null> {
    const todayStr = formatNotificationDate(now);

    const [prefs, user, events, dueCards, sessions, dailyChallenge] = await Promise.all([
      practiceRepository.getPreferences(userId),
      db.users.get(userId),
      db.notificationEvents.where('userId').equals(userId).toArray() as Promise<NotificationEventRecord[]>,
      vocabularyRepository.getDueCards(userId),
      practiceRepository.getSessions(userId, 30),
      quickPicksRepository.getDailyChallengeSubmission(userId, todayStr),
    ]);

    const todayPracticeMinutes = sessions
      .filter((s: { completedAt: string }) => s.completedAt.startsWith(todayStr))
      .reduce((acc: number, s: { durationMinutes?: number }) => acc + (s.durationMinutes || 0), 0);

    return evaluateSmartNotification({
      userId,
      preferences: prefs,
      user: user ? { currentStreak: user.currentStreak, lastActiveDate: user.lastActiveDate } : null,
      dueCardsCount: dueCards.length,
      todayPracticeMinutes,
      dailyChallengeCompleted: dailyChallenge?.status === 'completed',
      events,
      now,
    });
  }

  /**
   * Records that a notification was presented to the user.
   */
  async recordShown(
    notification: SmartNotification,
    userId = 'local-learner-1',
    now = new Date()
  ): Promise<void> {
    const todayStr = formatNotificationDate(now);
    const record: NotificationEventRecord = {
      id: `${notification.type}-${todayStr}-${now.getTime()}`,
      userId,
      type: notification.type,
      date: todayStr,
      timestamp: now.toISOString(),
      status: 'shown',
    };
    await db.notificationEvents.put(record);
  }

  /**
   * Records that the user dismissed the notification.
   */
  async recordDismissed(
    notification: SmartNotification,
    userId = 'local-learner-1',
    now = new Date()
  ): Promise<void> {
    const todayStr = formatNotificationDate(now);
    const record: NotificationEventRecord = {
      id: `${notification.type}-${todayStr}-dismissed`,
      userId,
      type: notification.type,
      date: todayStr,
      timestamp: now.toISOString(),
      status: 'dismissed',
    };
    await db.notificationEvents.put(record);
  }

  /**
   * Records that the user clicked and acted upon the notification.
   */
  async recordClicked(
    notification: SmartNotification,
    userId = 'local-learner-1',
    now = new Date()
  ): Promise<void> {
    const todayStr = formatNotificationDate(now);
    const record: NotificationEventRecord = {
      id: `${notification.type}-${todayStr}-clicked`,
      userId,
      type: notification.type,
      date: todayStr,
      timestamp: now.toISOString(),
      status: 'clicked',
    };
    await db.notificationEvents.put(record);
  }
}

export const notificationService = new NotificationService();

// Expose notification service handle only during development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).__notificationService = notificationService;
}
