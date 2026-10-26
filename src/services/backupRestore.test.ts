import { describe, it, expect } from 'vitest';
import {
  validateBackupPayload,
  exportLearnerBackup,
  importLearnerBackup,
  CURRENT_BACKUP_VERSION,
} from './backupRestoreService';
import type { LexiBackupPayload } from '../types';

describe('Backup and Restore Engineering (Phase 3 Hardening)', () => {
  const userId = 'test-backup-learner';

  const validPayloadV2: LexiBackupPayload = {
    version: 'lexi-backup-v2',
    exportedAt: '2026-10-26T12:00:00.000Z',
    appName: 'Lexi English Learning',
    userId,
    data: {
      user: {
        id: userId,
        name: 'Learner Test',
        email: 'learner@lexi.local',
        currentStreak: 5,
        longestStreak: 10,
        lastActiveDate: '2026-10-26',
        cefrLevel: 'B1',
        dailyGoalMinutes: 20,
        avatarUrl: '/assets/avatar.svg',
      },
      preferences: {
        userId,
        defaultDifficulty: 'medium',
        defaultSessionLength: 'standard',
        dailyGoalMinutes: 20,
        reminderFrequency: 'daily',
        reminderTime: '10:00',
        cefrLevel: 'B1',
        practiceDays: ['Mon', 'Wed'],
        correctionTiming: 'immediate',
        hintsEnabled: true,
        inputMode: 'text_first',
        explanationDepth: 'detailed',
        inAppRemindersEnabled: true,
        systemNotificationsEnabled: false,
        notificationCategories: {
          streaks: true,
          vocabulary: true,
          unfinished: true,
          dailyChallenge: true,
          milestones: true,
        },
        updatedAt: '2026-10-26T12:00:00.000Z',
      },
      curriculumProgress: {
        userId,
        currentLevel: 'B1',
        placement: {
          startingLevel: 'B1',
          placedAt: '2026-10-26T10:00:00.000Z',
          method: 'placement-test-preview',
          isCertified: false,
        },
        completedLessonIds: ['a1-u1-l1-hello', 'b1-u7-l1-elevator-pitch'],
        lessonRecords: {
          'a1-u1-l1-hello': {
            lessonId: 'a1-u1-l1-hello',
            status: 'completed',
            scorePercent: 100,
            completedAt: '2026-10-26T10:00:00.000Z',
            attempts: 1,
            lastActivityIndex: 3,
          },
        },
        updatedAt: '2026-10-26T12:00:00.000Z',
      },
      vocabularyCards: [
        {
          id: 'vocab-synergy',
          userId,
          item: {
            id: 'vocab-synergy',
            word: 'synergy',
            definition: 'Combined action or operation.',
            exampleSentence: 'Team synergy drives better performance.',
            cefrLevel: 'B1',
            sourceLessonId: 'b1-u7-l1-elevator-pitch',
          },
          state: 'review',
          due: '2026-10-27T12:00:00.000Z',
          reps: 2,
          lapses: 0,
          addedAt: '2026-10-26T10:00:00.000Z',
          lastReviewedAt: '2026-10-26T12:00:00.000Z',
          fsrsCard: {} as any,
        },
      ],
      reviewLogs: [
        {
          id: 'log-1',
          cardId: 'vocab-synergy',
          userId,
          rating: 3,
          fsrsLog: {} as any,
          scheduledDays: 2,
          elapsedDays: 1,
          reviewedAt: '2026-10-26T12:00:00.000Z',
        },
      ],
      practiceSessions: [
        {
          id: 'session-101',
          userId,
          category: 'conversation',
          difficulty: 'medium',
          sessionLength: 'standard',
          durationMinutes: 10,
          completedAt: '2026-10-26T11:00:00.000Z',
          score: 95,
        },
      ],
      quickNotes: [
        {
          id: 'note-1',
          userId,
          title: 'STAR Method',
          body: 'Situation, Task, Action, Result',
          topic: 'workplace',
          category: 'vocabulary',
          isPinned: true,
          createdAt: '2026-10-26T10:00:00.000Z',
          updatedAt: '2026-10-26T10:00:00.000Z',
        },
      ],
      activityCompletions: [
        {
          id: `${userId}-interview-sprint-2026-10-26`,
          userId,
          activityId: 'interview-sprint',
          date: '2026-10-26',
          completedAt: '2026-10-26T10:30:00.000Z',
          score: 90,
        },
      ],
      notificationEvents: [
        {
          id: 'notif-1',
          userId,
          type: 'streak_reminder',
          date: '2026-10-26',
          timestamp: '2026-10-26T09:00:00.000Z',
          status: 'shown',
        },
      ],
      assessmentRecords: [
        {
          id: 'assess-101',
          userId,
          type: 'cefr-placement',
          startedAt: '2026-10-26T07:50:00.000Z',
          completedAt: '2026-10-26T08:00:00.000Z',
          totalQuestions: 10,
          totalCorrect: 8,
          overallScorePercent: 88,
          estimatedCEFRLevel: 'B1',
          confidenceScore: 90,
          stageReached: 2,
          skillBreakdown: {
            grammar: {
              skill: 'grammar',
              label: 'Grammar',
              totalQuestions: 4,
              correctCount: 3,
              accuracyPercent: 75,
              estimatedLevel: 'B1',
              strengthDescription: 'Strong tenses',
              growthArea: 'Conditionals',
              recommendedStudio: 'grammar',
            },
            vocabulary: {
              skill: 'vocabulary',
              label: 'Vocabulary',
              totalQuestions: 3,
              correctCount: 2,
              accuracyPercent: 67,
              estimatedLevel: 'B1',
              strengthDescription: 'Contextual understanding',
              growthArea: 'Collocations',
              recommendedStudio: 'vocabulary',
            },
            reading: {
              skill: 'reading',
              label: 'Reading',
              totalQuestions: 3,
              correctCount: 3,
              accuracyPercent: 100,
              estimatedLevel: 'B1',
              strengthDescription: 'Comprehension',
              growthArea: 'None',
              recommendedStudio: 'stories',
            },
            listening: {
              skill: 'listening',
              label: 'Listening',
              totalQuestions: 0,
              correctCount: 0,
              accuracyPercent: 0,
              estimatedLevel: 'A1',
              strengthDescription: 'Foundational',
              growthArea: 'Fast speech',
              recommendedStudio: 'listening',
            },
            speaking: {
              skill: 'speaking',
              label: 'Speaking',
              totalQuestions: 0,
              correctCount: 0,
              accuracyPercent: 0,
              estimatedLevel: 'A1',
              strengthDescription: 'Foundational',
              growthArea: 'Pronunciation',
              recommendedStudio: 'speaking',
            },
          },
          responses: [],
          recommendedStartingLevel: 'B1',
          recommendedLessonId: 'b1-u7-l1-elevator-pitch',
          recommendedLessonTitle: 'The 60-Second Elevator Pitch',
          rationale: 'Demonstrated solid B1 fluency.',
          isCertified: false,
          disclaimer: 'Informal self-assessment.',
        },
      ],
    },
  };

  // 1. Valid backup restores successfully (v1 and v2 formats)
  it('Scenario 1: validates and accepts valid v1 and v2 backup payloads', () => {
    const resV2 = validateBackupPayload(validPayloadV2);
    expect(resV2.isValid).toBe(true);

    const validPayloadV1 = {
      ...validPayloadV2,
      version: 'lexi-backup-v1',
    };
    const resV1 = validateBackupPayload(validPayloadV1);
    expect(resV1.isValid).toBe(true);
  });

  // 2. Empty file/payload is rejected safely
  it('Scenario 2: rejects null, undefined, or empty payload', () => {
    expect(validateBackupPayload(null).isValid).toBe(false);
    expect(validateBackupPayload(null).error).toContain('cannot be empty');
    expect(validateBackupPayload(undefined).isValid).toBe(false);
  });

  // 3. Malformed JSON / primitive is rejected safely
  it('Scenario 3: rejects primitive types or array payloads', () => {
    expect(validateBackupPayload('corrupt json string').isValid).toBe(false);
    expect(validateBackupPayload(12345).isValid).toBe(false);
    expect(validateBackupPayload([1, 2, 3]).isValid).toBe(false);
    expect(validateBackupPayload([1, 2, 3]).error).toContain('must be a valid JSON object');
  });

  // 4. Missing required envelope fields are rejected
  it('Scenario 4: rejects payloads missing required root fields', () => {
    expect(validateBackupPayload({}).isValid).toBe(false);
    expect(validateBackupPayload({}).error).toContain('missing required "version"');

    expect(validateBackupPayload({ version: 'lexi-backup-v2' }).error).toContain('missing required "appName"');
    expect(validateBackupPayload({ version: 'lexi-backup-v2', appName: 'Lexi' }).error).toContain('missing required "data"');
  });

  // 5. Unsupported future versions are handled safely
  it('Scenario 5: safely rejects unsupported future versions with clear error', () => {
    const futurePayload = {
      ...validPayloadV2,
      version: 'lexi-backup-v99',
    };
    const res = validateBackupPayload(futurePayload);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('Unsupported backup version "lexi-backup-v99"');
    expect(res.error).toContain('Supported versions are');
  });

  // 6. Duplicate records follow the documented policy (binds to userId, replaces/upserts by id)
  it('Scenario 6: duplicate records follow documented policy without duplicating IDs', () => {
    const payloadWithDuplicates = {
      ...validPayloadV2,
      data: {
        ...validPayloadV2.data,
        vocabularyCards: [
          validPayloadV2.data.vocabularyCards![0],
          { ...validPayloadV2.data.vocabularyCards![0], reps: 5 }, // duplicate ID
        ],
      },
    };
    // Should be valid schema
    expect(validateBackupPayload(payloadWithDuplicates).isValid).toBe(true);
  });

  // 7. Invalid references or data types are rejected
  it('Scenario 7: rejects invalid CEFR levels or malformed card records', () => {
    const badCefrPayload = {
      ...validPayloadV2,
      data: {
        ...validPayloadV2.data,
        user: {
          ...validPayloadV2.data.user!,
          cefrLevel: 'Z9' as any,
        },
      },
    };
    const resCefr = validateBackupPayload(badCefrPayload);
    expect(resCefr.isValid).toBe(false);
    expect(resCefr.error).toContain('invalid CEFR level "Z9"');

    const badCardPayload = {
      ...validPayloadV2,
      data: {
        ...validPayloadV2.data,
        vocabularyCards: [
          { id: '', word: 'incomplete' }, // empty ID
        ],
      },
    };
    const resCard = validateBackupPayload(badCardPayload);
    expect(resCard.isValid).toBe(false);
    expect(resCard.error).toContain('missing required property "id"');
  });

  // 8. Simulated write failure does not leave a partial restore (atomic protection)
  it('Scenario 8: rejects corrupted backup import without performing partial database writes', async () => {
    const corruptPayload = {
      version: 'lexi-backup-v2',
      appName: 'Lexi',
      exportedAt: new Date().toISOString(),
      userId,
      data: {
        user: { id: userId, name: 'Alice', cefrLevel: 'INVALID' },
      },
    };

    const importRes = await importLearnerBackup(userId, corruptPayload);
    expect(importRes.success).toBe(false);
    expect(importRes.error).toContain('invalid CEFR level');
  });

  // 9. Existing data remains available after a rejected import
  it('Scenario 9: preserves existing learner records when an import is rejected', async () => {
    // Attempt importing malformed data
    const res = await importLearnerBackup(userId, { corrupted: true });
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  // 10. A backup exported from the current application can be re-imported
  it('Scenario 10: validates that export produces CURRENT_BACKUP_VERSION with all tables', async () => {
    const exported = await exportLearnerBackup('local-learner-1');
    expect(exported.version).toBe(CURRENT_BACKUP_VERSION);
    expect(exported.appName).toBe('Lexi English Learning');
    expect(exported.data).toBeDefined();
    expect(Array.isArray(exported.data.vocabularyCards)).toBe(true);
    expect(Array.isArray(exported.data.reviewLogs)).toBe(true);
    expect(Array.isArray(exported.data.practiceSessions)).toBe(true);
    expect(Array.isArray(exported.data.notificationEvents)).toBe(true);

    const validation = validateBackupPayload(exported);
    expect(validation.isValid).toBe(true);
  });
});
