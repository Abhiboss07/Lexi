import { describe, it, expect, beforeEach } from 'vitest';
import {
  AdaptiveLearningService,
  InMemoryAdaptiveStorage,
} from './adaptiveLearningService';
import { InMemoryPracticeRepository } from '../db/practiceRepository';
import { InMemoryCurriculumRepository } from '../db/curriculumRepository';
import { InMemoryVocabularyRepository } from '../db/vocabularyRepository';
import { InMemoryQuickPicksRepository } from '../db/quickPicksRepository';
import { getLocalDateString } from './dailyPracticeService';
import type { PracticeSessionRecord } from '../types/practicePreferences';

describe('adaptiveLearningService', () => {
  const TEST_USER = 'test-adaptive-learner';

  let practiceRepo: InMemoryPracticeRepository;
  let curriculumRepo: InMemoryCurriculumRepository;
  let vocabRepo: InMemoryVocabularyRepository;
  let quickPicksRepo: InMemoryQuickPicksRepository;
  let storage: InMemoryAdaptiveStorage;
  let service: AdaptiveLearningService;

  beforeEach(async () => {
    practiceRepo = new InMemoryPracticeRepository();
    curriculumRepo = new InMemoryCurriculumRepository();
    vocabRepo = new InMemoryVocabularyRepository();
    quickPicksRepo = new InMemoryQuickPicksRepository();
    storage = new InMemoryAdaptiveStorage();

    service = new AdaptiveLearningService(
      practiceRepo,
      curriculumRepo,
      vocabRepo,
      quickPicksRepo,
      storage
    );

    // Default user profile
    await storage.users.set(TEST_USER, {
      id: TEST_USER,
      name: 'Test Learner',
      email: 'test@lexi.local',
      currentStreak: 3,
      longestStreak: 5,
      lastActiveDate: getLocalDateString(),
      cefrLevel: 'A1',
      dailyGoalMinutes: 15,
      avatarUrl: '/assets/default-avatar.svg',
    });

    await practiceRepo.savePreferences(TEST_USER, {
      defaultDifficulty: 'medium',
      defaultSessionLength: 'standard',
      dailyGoalMinutes: 15,
      reminderFrequency: 'off',
      reminderTime: '09:00',
      cefrLevel: 'A1',
      practiceDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      hintsEnabled: true,
      updatedAt: new Date().toISOString(),
    });

    await curriculumRepo.saveLearnerProgress({
      userId: TEST_USER,
      currentLevel: 'A1',
      placement: {
        startingLevel: 'A1',
        method: 'self-selected',
        placedAt: new Date().toISOString(),
        isCertified: false,
      },
      completedLessonIds: [],
      lessonRecords: {},
      updatedAt: new Date().toISOString(),
    });
  });

  it('builds an accurate profile for a new learner with no history', async () => {
    const profile = await service.buildAdaptiveProfile(TEST_USER);

    expect(profile.userId).toBe(TEST_USER);
    expect(profile.currentLevel).toBe('A1');
    expect(profile.totalSessionsCount).toBe(0);
    expect(profile.recentAverageScore).toBeNull();
    expect(profile.performanceTrend).toBe('baseline');
    expect(profile.hasSufficientEvidence).toBe(false);
    expect(profile.strongestArea).toBeNull();
    expect(profile.weakestArea).toBeNull();
    expect(profile.dueVocabCards).toBeGreaterThanOrEqual(0);

    // Skills should report insufficient_evidence
    expect(profile.skills.grammar.status).toBe('insufficient_evidence');
    expect(profile.skills.grammar.score).toBeNull();
  });

  it('distinguishes a single session from genuine weak performance (insufficient evidence)', async () => {
    // Add only 1 low-score session in grammar
    const session: PracticeSessionRecord = {
      id: 'sess-1',
      userId: TEST_USER,
      category: 'grammar',
      difficulty: 'medium',
      sessionLength: 'quick',
      durationMinutes: 4,
      completedAt: new Date().toISOString(),
      score: 55,
    };
    await practiceRepo.recordSession(session);

    const profile = await service.buildAdaptiveProfile(TEST_USER);

    // With only 1 session, status MUST be insufficient_evidence, not needs_reinforcement!
    expect(profile.skills.grammar.sessionCount).toBe(1);
    expect(profile.skills.grammar.status).toBe('insufficient_evidence');
    expect(profile.weakestArea).toBeNull(); // No premature conclusions!
    expect(profile.hasSufficientEvidence).toBe(false);
  });

  it('accurately identifies weak area after meeting evidence threshold (>= 2 sessions)', async () => {
    const now = new Date().toISOString();
    await practiceRepo.recordSession({
      id: 'sess-g1',
      userId: TEST_USER,
      category: 'grammar',
      difficulty: 'medium',
      sessionLength: 'quick',
      durationMinutes: 4,
      completedAt: now,
      score: 60,
    });
    await practiceRepo.recordSession({
      id: 'sess-g2',
      userId: TEST_USER,
      category: 'grammar',
      difficulty: 'medium',
      sessionLength: 'quick',
      durationMinutes: 5,
      completedAt: now,
      score: 65,
    });
    await practiceRepo.recordSession({
      id: 'sess-c1',
      userId: TEST_USER,
      category: 'conversation',
      difficulty: 'medium',
      sessionLength: 'quick',
      durationMinutes: 5,
      completedAt: now,
      score: 90,
    });
    await practiceRepo.recordSession({
      id: 'sess-c2',
      userId: TEST_USER,
      category: 'conversation',
      difficulty: 'medium',
      sessionLength: 'quick',
      durationMinutes: 5,
      completedAt: now,
      score: 95,
    });

    const profile = await service.buildAdaptiveProfile(TEST_USER);

    expect(profile.hasSufficientEvidence).toBe(true);
    expect(profile.skills.grammar.status).toBe('needs_reinforcement');
    expect(profile.skills.grammar.score).toBe(63); // (60 + 65) / 2
    expect(profile.weakestArea?.category).toBe('grammar');

    expect(profile.skills.conversation.status).toBe('strength');
    expect(profile.skills.conversation.score).toBe(93); // (90 + 95) / 2
    expect(profile.strongestArea?.category).toBe('conversation');
  });

  it('prioritizes overdue FSRS vocabulary reviews as item #1 in daily plan', async () => {
    // Add 2 due vocabulary cards with overdue dates
    const pastDate = '2026-10-15T00:00:00.000Z';
    await vocabRepo.saveCard({
      id: 'card-1',
      userId: TEST_USER,
      item: {
        id: 'card-1',
        word: 'cappuccino',
        translation: 'cappuccino',
        definition: 'Espresso coffee with steamed milk foam',
        cefrLevel: 'A1',
        sourceLessonId: 'a1-u1-l1-hello',
        exampleSentence: 'I would like a cappuccino.',
      },
      fsrsCard: {} as any,
      state: 'review',
      due: pastDate,
      reps: 2,
      lapses: 0,
      addedAt: pastDate,
    });
    await vocabRepo.saveCard({
      id: 'card-2',
      userId: TEST_USER,
      item: {
        id: 'card-2',
        word: 'croissant',
        translation: 'croissant',
        definition: 'Flaky crescent-shaped pastry',
        cefrLevel: 'A1',
        sourceLessonId: 'a1-u1-l1-hello',
        exampleSentence: 'One fresh croissant please.',
      },
      fsrsCard: {} as any,
      state: 'review',
      due: pastDate,
      reps: 2,
      lapses: 0,
      addedAt: pastDate,
    });

    const plan = await service.getDailyStudyPlan(TEST_USER);

    expect(plan.items.length).toBeGreaterThanOrEqual(1);
    expect(plan.items[0].type).toBe('vocabulary_review');
    expect(plan.items[0].isPriority).toBe(true);
    expect(plan.items[0].title).toContain('Spaced Vocabulary Review');
    expect(plan.headlineSummary).toContain('Due');
  });

  it('respects configured daily goal time budgets', async () => {
    // 1. Quick learner (5 minutes)
    await practiceRepo.savePreferences(TEST_USER, { dailyGoalMinutes: 5 });
    const quickPlan = await service.getDailyStudyPlan(TEST_USER, new Date('2026-10-21'));
    expect(quickPlan.items.length).toBeLessThanOrEqual(2);
    expect(quickPlan.estimatedTotalMinutes).toBeLessThanOrEqual(14);

    // 2. Standard learner (15 minutes)
    await practiceRepo.savePreferences(TEST_USER, { dailyGoalMinutes: 15 });
    const standardPlan = await service.getDailyStudyPlan(TEST_USER, new Date('2026-10-22'));
    expect(standardPlan.items.length).toBe(3);
    expect(standardPlan.estimatedTotalMinutes).toBeGreaterThanOrEqual(12);
    expect(standardPlan.estimatedTotalMinutes).toBeLessThanOrEqual(20);
  });

  it('prevents duplicate plans for the same user and day', async () => {
    const today = new Date();
    const planA = await service.getDailyStudyPlan(TEST_USER, today);
    const planB = await service.getDailyStudyPlan(TEST_USER, today);

    expect(planA.id).toBe(planB.id);
    expect(planA.generatedAt).toBe(planB.generatedAt);
    expect(planA.items.length).toBe(planB.items.length);
  });

  it('marks items completed and reconciles without losing existing plan items', async () => {
    const plan = await service.getDailyStudyPlan(TEST_USER);
    const firstItem = plan.items[0];

    expect(firstItem.isCompleted).toBe(false);

    // Mark completed
    const updated = await service.markItemComplete(TEST_USER, firstItem.id);
    expect(updated).not.toBeNull();
    expect(updated!.items[0].isCompleted).toBe(true);
    expect(updated!.completedMinutes).toBe(firstItem.estimatedMinutes);

    // Re-fetch plan
    const fetched = await service.getDailyStudyPlan(TEST_USER);
    expect(fetched.items[0].isCompleted).toBe(true);
  });

  it('recalculates plan without losing already completed work', async () => {
    const plan = await service.getDailyStudyPlan(TEST_USER);
    const firstItem = plan.items[0];
    await service.markItemComplete(TEST_USER, firstItem.id);

    // Recalculate plan
    const recalculated = await service.recalculatePlan(TEST_USER);
    const matchingItem = recalculated.items.find(
      (it) => it.id === firstItem.id || it.type === firstItem.type
    );

    expect(matchingItem).toBeDefined();
    expect(matchingItem!.isCompleted).toBe(true);
    expect(recalculated.completedMinutes).toBeGreaterThan(0);
  });
});
