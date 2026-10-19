import { describe, it, expect } from 'vitest';
import {
  calculateAchievements,
  validateBackupPayload,
  BADGE_DEFINITIONS,
} from './achievementService';
import type {
  UserProfile,
  CurriculumProgressionState,
  VocabularyStats,
  PracticeSessionRecord,
  LexiBackupPayload,
} from '../types';

describe('achievementService', () => {
  describe('calculateAchievements', () => {
    it('initializes with default definitions and Curious Novice rank when no data is provided', () => {
      const summary = calculateAchievements({});
      expect(summary.totalBadgesCount).toBe(BADGE_DEFINITIONS.length);
      expect(summary.unlockedBadgesCount).toBe(0);
      expect(summary.completionPercent).toBe(0);
      expect(summary.rankTitle).toBe('Curious Novice');
      expect(summary.badges.length).toBe(BADGE_DEFINITIONS.length);
      expect(summary.certificates.length).toBe(3);
    });

    it('correctly evaluates streak badges based on current and longest streak', () => {
      const user: Partial<UserProfile> = {
        id: 'user-1',
        name: 'Alex',
        currentStreak: 7,
        longestStreak: 14,
        lastActiveDate: '2026-10-19',
        cefrLevel: 'A2',
      };

      const summary = calculateAchievements({ user: user as UserProfile });
      
      const streak3 = summary.badges.find((b) => b.id === 'streak-3');
      const streak7 = summary.badges.find((b) => b.id === 'streak-7');
      const streak14 = summary.badges.find((b) => b.id === 'streak-14');
      const streak30 = summary.badges.find((b) => b.id === 'streak-30');

      expect(streak3?.unlocked).toBe(true);
      expect(streak7?.unlocked).toBe(true);
      expect(streak14?.unlocked).toBe(true);
      expect(streak30?.unlocked).toBe(false);
      expect(streak30?.progressPercent).toBe(Math.round((14 / 30) * 100));
    });

    it('correctly evaluates vocabulary and memory cards badges', () => {
      const vocabStats: VocabularyStats = {
        totalCards: 55,
        dueCards: 5,
        newCards: 10,
        learningCards: 15,
        reviewCards: 25,
        relearningCards: 0,
        totalReviews: 25,
      };

      const summary = calculateAchievements({ vocabStats });

      const vocabFirst = summary.badges.find((b) => b.id === 'vocab-first');
      const vocab10 = summary.badges.find((b) => b.id === 'vocab-10');
      const vocab50 = summary.badges.find((b) => b.id === 'vocab-50');
      const vocabMaster = summary.badges.find((b) => b.id === 'vocab-master-10');

      expect(vocabFirst?.unlocked).toBe(true);
      expect(vocab10?.unlocked).toBe(true);
      expect(vocab50?.unlocked).toBe(true);
      expect(vocabMaster?.unlocked).toBe(true);
      expect(vocabFirst?.progressPercent).toBe(100);
    });

    it('evaluates practice studio diversity and high-score achievements', () => {
      const sessions: PracticeSessionRecord[] = [
        {
          id: 's1',
          userId: 'user-1',
          category: 'conversation',
          difficulty: 'medium',
          sessionLength: 'standard',
          durationMinutes: 10,
          completedAt: new Date().toISOString(),
          score: 95,
        },
        {
          id: 's2',
          userId: 'user-1',
          category: 'stories',
          difficulty: 'medium',
          sessionLength: 'standard',
          durationMinutes: 12,
          completedAt: new Date().toISOString(),
          score: 88,
        },
        {
          id: 's3',
          userId: 'user-1',
          category: 'grammar',
          difficulty: 'medium',
          sessionLength: 'standard',
          durationMinutes: 8,
          completedAt: new Date().toISOString(),
          score: 82,
        },
      ];

      const summary = calculateAchievements({ sessions });

      const studioExplorer = summary.badges.find((b) => b.id === 'studio-explorer');
      const studioPolyglot = summary.badges.find((b) => b.id === 'studio-polyglot');
      const studioAce = summary.badges.find((b) => b.id === 'studio-ace');

      // 3 distinct studios completed
      expect(studioExplorer?.unlocked).toBe(true);
      expect(studioPolyglot?.unlocked).toBe(false);
      expect(studioAce?.unlocked).toBe(true); // Score 95% >= 90%
      expect(studioAce?.progressPercent).toBe(100);
    });

    it('progresses rank title according to unlocked milestones count', () => {
      // 0 badges
      expect(calculateAchievements({}).rankTitle).toBe('Curious Novice');

      // 4 badges
      const userStreak7: Partial<UserProfile> = {
        currentStreak: 7,
        longestStreak: 7,
      };
      const vocab10: VocabularyStats = {
        totalCards: 15,
        dueCards: 0,
        newCards: 0,
        learningCards: 5,
        reviewCards: 10,
        relearningCards: 0,
        totalReviews: 10,
      };
      // unlocked: streak-3, streak-7, vocab-first, vocab-10, vocab-master-10 = 5 badges
      const summary5 = calculateAchievements({ user: userStreak7 as UserProfile, vocabStats: vocab10 });
      expect(summary5.unlockedBadgesCount).toBeGreaterThanOrEqual(4);
      expect(summary5.rankTitle).toBe('Motivated Learner');
    });

    it('generates CEFR certificate statuses accurately based on learner curriculum state', () => {
      const curriculum: Partial<CurriculumProgressionState> = {
        userId: 'user-1',
        currentLevel: 'A2',
        completedLessonIds: ['a1-u1-l1', 'a1-u1-l2', 'a1-u2-l1', 'a1-u2-l2', 'a1-u3-l1', 'a1-u3-l2', 'a1-u4-l1', 'a1-u4-l2'],
      };

      const summary = calculateAchievements({ curriculum: curriculum as CurriculumProgressionState });
      
      const certA1 = summary.certificates.find((c) => c.level === 'A1');
      const certA2 = summary.certificates.find((c) => c.level === 'A2');
      const certB1 = summary.certificates.find((c) => c.level === 'B1');

      expect(certA1?.isCompleted).toBe(true);
      expect(certA2?.isCompleted).toBe(false);
      expect(certB1?.isCompleted).toBe(false);
      expect(certA1?.credentialId).toContain('LEXI-CEFR-A1');
    });
  });

  describe('validateBackupPayload', () => {
    it('validates a correct Lexi backup payload', () => {
      const validPayload: LexiBackupPayload = {
        version: 'lexi-backup-v1',
        exportedAt: new Date().toISOString(),
        appName: 'Lexi English Learning',
        userId: 'local-learner-1',
        data: {
          user: {
            id: 'local-learner-1',
            name: 'Learner',
            email: 'learner@lexi.local',
            currentStreak: 7,
            longestStreak: 14,
            lastActiveDate: '2026-10-19',
            cefrLevel: 'A2',
            dailyGoalMinutes: 15,
            avatarUrl: '/assets/default-avatar.svg',
          },
        },
      };

      const res = validateBackupPayload(validPayload);
      expect(res.isValid).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it('rejects null, invalid types, or malformed data', () => {
      expect(validateBackupPayload(null).isValid).toBe(false);
      expect(validateBackupPayload('string').isValid).toBe(false);
      expect(validateBackupPayload({}).isValid).toBe(false);
    });

    it('rejects unsupported backup versions', () => {
      const badVersion = {
        version: 'legacy-v0.5',
        appName: 'Lexi',
        data: {},
      };
      const res = validateBackupPayload(badVersion);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Unsupported backup version');
    });
  });
});
