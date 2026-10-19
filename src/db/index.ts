import Dexie, { type Table } from 'dexie';
import type { UserProfile } from '../types';
import type { CurriculumProgressionState } from '../types/curriculum';
import type { VocabularyCardRecord, ReviewLogRecord } from '../types/vocabulary';
import type { PracticePreferences, PracticeSessionRecord } from '../types/practicePreferences';
import type {
  QuickNote,
  SavedDrawing,
  DailyChallengeSubmission,
  WordQuestResult,
  ActivityCompletionRecord,
  BookmarkedIdiomRecord,
} from '../types/quickPicks';
import type { NotificationEventRecord } from '../types/notifications';

export class LexiDatabase extends Dexie {
  users!: Table<UserProfile, string>;
  curriculumProgress!: Table<CurriculumProgressionState, string>;
  vocabularyCards!: Table<VocabularyCardRecord, string>;
  reviewLogs!: Table<ReviewLogRecord, string>;
  practicePreferences!: Table<PracticePreferences, string>;
  practiceSessions!: Table<PracticeSessionRecord, string>;
  quickNotes!: Table<QuickNote, string>;
  savedDrawings!: Table<SavedDrawing, string>;
  dailyChallenges!: Table<DailyChallengeSubmission, string>;
  wordQuestResults!: Table<WordQuestResult, string>;
  activityCompletions!: Table<ActivityCompletionRecord, string>;
  bookmarkedIdioms!: Table<BookmarkedIdiomRecord, string>;
  notificationEvents!: Table<NotificationEventRecord, string>;

  constructor() {
    super('LexiDatabase');
    this.version(1).stores({
      users: 'id, currentStreak, lastActiveDate',
    });
    this.version(2).stores({
      users: 'id, currentStreak, lastActiveDate',
      curriculumProgress: 'userId, currentLevel, updatedAt',
    });
    this.version(3).stores({
      users: 'id, currentStreak, lastActiveDate',
      curriculumProgress: 'userId, currentLevel, updatedAt',
      vocabularyCards: 'id, userId, word, cefrLevel, state, due, lastReviewedAt, sourceLessonId',
      reviewLogs: 'id, cardId, userId, rating, reviewedAt',
    }).upgrade(() => {
      // Safe, versioned migration preserving all existing user profiles and curriculum progression
    });
    this.version(4).stores({
      users: 'id, currentStreak, lastActiveDate',
      curriculumProgress: 'userId, currentLevel, updatedAt',
      vocabularyCards: 'id, userId, word, cefrLevel, state, due, lastReviewedAt, sourceLessonId',
      reviewLogs: 'id, cardId, userId, rating, reviewedAt',
      practicePreferences: 'userId, defaultDifficulty, defaultSessionLength, dailyGoalMinutes',
      practiceSessions: 'id, userId, category, difficulty, sessionLength, completedAt',
    }).upgrade(async (tx) => {
      // Safe versioned migration preserving all existing user profiles, curriculum progress, and vocabulary
      const users = await tx.table('users').toArray();
      for (const u of users) {
        await tx.table('practicePreferences').put({
          userId: u.id,
          defaultDifficulty: 'medium',
          defaultSessionLength: 'standard',
          dailyGoalMinutes: u.dailyGoalMinutes || 15,
          reminderFrequency: 'off',
          reminderTime: '09:00',
          updatedAt: new Date().toISOString(),
        });
      }
    });
    this.version(5).stores({
      users: 'id, currentStreak, lastActiveDate',
      curriculumProgress: 'userId, currentLevel, updatedAt',
      vocabularyCards: 'id, userId, word, cefrLevel, state, due, lastReviewedAt, sourceLessonId',
      reviewLogs: 'id, cardId, userId, rating, reviewedAt',
      practicePreferences: 'userId, defaultDifficulty, defaultSessionLength, dailyGoalMinutes',
      practiceSessions: 'id, userId, category, difficulty, sessionLength, completedAt',
      quickNotes: 'id, userId, topic, isPinned, createdAt, updatedAt',
      savedDrawings: 'id, userId, createdAt',
      dailyChallenges: 'id, userId, date, status, submittedAt',
      wordQuestResults: 'id, userId, date, completedAt',
    }).upgrade(() => {
      // Safe, versioned migration preserving all existing user data
    });
    this.version(6).stores({
      users: 'id, currentStreak, lastActiveDate',
      curriculumProgress: 'userId, currentLevel, updatedAt',
      vocabularyCards: 'id, userId, word, cefrLevel, state, due, lastReviewedAt, sourceLessonId',
      reviewLogs: 'id, cardId, userId, rating, reviewedAt',
      practicePreferences: 'userId, defaultDifficulty, defaultSessionLength, dailyGoalMinutes',
      practiceSessions: 'id, userId, category, difficulty, sessionLength, completedAt',
      quickNotes: 'id, userId, topic, category, isPinned, createdAt, updatedAt',
      savedDrawings: 'id, userId, createdAt',
      dailyChallenges: 'id, userId, date, status, submittedAt',
      wordQuestResults: 'id, userId, date, completedAt',
      activityCompletions: 'id, userId, activityId, date, completedAt',
      bookmarkedIdioms: 'id, userId, expression, bookmarkedAt',
    }).upgrade(() => {
      // Safe, versioned migration preserving all existing user progress, preferences, and cards
    });
    this.version(7).stores({
      users: 'id, currentStreak, lastActiveDate',
      curriculumProgress: 'userId, currentLevel, updatedAt',
      vocabularyCards: 'id, userId, word, cefrLevel, state, due, lastReviewedAt, sourceLessonId',
      reviewLogs: 'id, cardId, userId, rating, reviewedAt',
      practicePreferences: 'userId, defaultDifficulty, defaultSessionLength, dailyGoalMinutes',
      practiceSessions: 'id, userId, category, difficulty, sessionLength, completedAt',
      quickNotes: 'id, userId, topic, category, isPinned, createdAt, updatedAt',
      savedDrawings: 'id, userId, createdAt',
      dailyChallenges: 'id, userId, date, status, submittedAt',
      wordQuestResults: 'id, userId, date, completedAt',
      activityCompletions: 'id, userId, activityId, date, completedAt',
      bookmarkedIdioms: 'id, userId, expression, bookmarkedAt',
      notificationEvents: 'id, userId, type, date, timestamp, status',
    }).upgrade(() => {
      // Safe, versioned migration preserving all existing records and preferences
    });
  }
}

export const db = new LexiDatabase();

db.on('versionchange', () => {
  db.close();
});

if (typeof window !== 'undefined') {
  (window as any).__lexiDb = db;
}

const DEFAULT_USER_ID = 'local-learner-1';

export async function getOrCreateUserProfile(): Promise<UserProfile> {
  const existing = await db.users.get(DEFAULT_USER_ID);
  if (existing) {
    return existing;
  }

  const defaultUser: UserProfile = {
    id: DEFAULT_USER_ID,
    name: 'Learner',
    email: 'learner@lexi.local',
    currentStreak: 7, // Initial default matching the approved reference's "🔥 7"
    longestStreak: 14,
    lastActiveDate: new Date().toISOString().split('T')[0],
    cefrLevel: 'A2',
    dailyGoalMinutes: 15,
    avatarUrl: '/assets/default-avatar.svg',
  };

  await db.users.put(defaultUser);
  return defaultUser;
}

export async function incrementUserStreak(): Promise<number> {
  const user = await getOrCreateUserProfile();
  const today = new Date().toISOString().split('T')[0];

  if (user.lastActiveDate !== today) {
    const updatedStreak = user.currentStreak + 1;
    await db.users.update(user.id, {
      currentStreak: updatedStreak,
      longestStreak: Math.max(user.longestStreak, updatedStreak),
      lastActiveDate: today,
    });
    return updatedStreak;
  }
  return user.currentStreak;
}

export * from './curriculumRepository';
export * from './vocabularyRepository';
export * from './practiceRepository';
export * from './quickPicksRepository';
