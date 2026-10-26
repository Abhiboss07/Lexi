import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryPracticeRepository } from '../db/practiceRepository';
import { InMemoryCurriculumRepository } from '../db/curriculumRepository';
import { InMemoryVocabularyRepository, STARTER_VOCABULARY_ITEMS } from '../db/vocabularyRepository';
import { DailyPracticeService } from './dailyPracticeService';

describe('Database Integrity and Deduplication Engineering (Phase 2)', () => {
  let practiceRepo: InMemoryPracticeRepository;
  let curriculumRepo: InMemoryCurriculumRepository;
  let vocabRepo: InMemoryVocabularyRepository;
  let dailyService: DailyPracticeService;
  const userId = 'integrity-learner-1';

  beforeEach(() => {
    practiceRepo = new InMemoryPracticeRepository();
    curriculumRepo = new InMemoryCurriculumRepository();
    vocabRepo = new InMemoryVocabularyRepository();
    dailyService = new DailyPracticeService(vocabRepo, practiceRepo);
  });

  it('prevents duplicate practice session records when repeating the same activity on the same day', async () => {
    const today = '2026-10-26T10:00:00.000Z';
    const activityId = 'daily-listening-2026-10-26';

    // 1st completion
    const first = await practiceRepo.recordSession({
      userId,
      category: 'listening',
      activityId,
      difficulty: 'medium',
      sessionLength: 'quick',
      durationMinutes: 3,
      score: 80,
      completedAt: today,
    });

    // 2nd completion of same activity on same day (e.g. learner retries to get higher score)
    const second = await practiceRepo.recordSession({
      userId,
      category: 'listening',
      activityId,
      difficulty: 'medium',
      sessionLength: 'quick',
      durationMinutes: 4,
      score: 95,
      completedAt: '2026-10-26T10:05:00.000Z',
    });

    // Verify record was updated in-place rather than creating a duplicate
    expect(second.id).toBe(first.id);
    expect(second.score).toBe(95); // highest score preserved
    expect(second.durationMinutes).toBe(4);

    const allSessions = await practiceRepo.getSessions(userId, 50);
    const matching = allSessions.filter((s) => s.activityId === activityId);
    expect(matching.length).toBe(1); // Exactly 1 session!
  });

  it('creates separate sessions when activityId or dates differ', async () => {
    await practiceRepo.recordSession({
      userId,
      category: 'speaking',
      activityId: 'daily-speaking-2026-10-26',
      difficulty: 'medium',
      sessionLength: 'quick',
      durationMinutes: 3,
      score: 90,
      completedAt: '2026-10-26T10:00:00.000Z',
    });

    await practiceRepo.recordSession({
      userId,
      category: 'speaking',
      activityId: 'daily-speaking-2026-10-27', // different day
      difficulty: 'medium',
      sessionLength: 'quick',
      durationMinutes: 3,
      score: 92,
      completedAt: '2026-10-27T10:00:00.000Z',
    });

    const allSessions = await practiceRepo.getSessions(userId, 50);
    expect(allSessions.length).toBe(2);
  });

  it('is completely idempotent when recordDailyCompletion is called multiple times', async () => {
    const targetDate = new Date('2026-10-26T14:00:00.000Z');

    await dailyService.recordDailyCompletion(userId, 'listening', 85, targetDate);
    await dailyService.recordDailyCompletion(userId, 'listening', 95, targetDate);

    const sessions = await practiceRepo.getSessions(userId, 10);
    const listeningSessions = sessions.filter((s) => s.activityId === 'daily-listening-2026-10-26');

    expect(listeningSessions.length).toBe(1);
    expect(listeningSessions[0].score).toBe(95);
  });

  it('preserves curriculum lesson progression integrity and avoids duplicate completed IDs', async () => {
    const lessonId = 'a1-u2-l3-bus-stop';

    // First completion
    const state1 = await curriculumRepo.recordLessonCompletion(userId, lessonId, 85);
    expect(state1.completedLessonIds.filter((id) => id === lessonId).length).toBe(1);
    expect(state1.lessonRecords[lessonId].attempts).toBe(1);

    // Second completion with higher score
    const state2 = await curriculumRepo.recordLessonCompletion(userId, lessonId, 100);
    expect(state2.completedLessonIds.filter((id) => id === lessonId).length).toBe(1);
    expect(state2.lessonRecords[lessonId].scorePercent).toBe(100);
    expect(state2.lessonRecords[lessonId].attempts).toBe(2);
  });

  it('prevents duplicate vocabulary card creation on lesson completion', async () => {
    await vocabRepo.getCards(userId); // seed starter deck

    const items = [
      {
        word: 'morning', // already seeded in starter deck
        definition: 'Early part of the day',
        exampleSentence: 'Good morning!',
      },
      {
        word: 'departure',
        phoneticIpa: '/dɪˈpɑːrtʃər/',
        partOfSpeech: 'noun',
        definition: 'The act of leaving a place.',
        exampleSentence: 'The train departure was on time.',
      },
    ];

    // Add first time
    const added1 = await vocabRepo.addVocabularyFromLesson(userId, 'a2-u4-l2-airport-transit', items, 'Transit', 'A2');
    expect(added1.length).toBe(1);
    expect(added1[0].item.word).toBe('departure');

    // Add second time (retry or re-review lesson)
    const added2 = await vocabRepo.addVocabularyFromLesson(userId, 'a2-u4-l2-airport-transit', items, 'Transit', 'A2');
    expect(added2.length).toBe(0); // Deduplicated!

    const totalCards = await vocabRepo.getCards(userId);
    expect(totalCards.length).toBe(STARTER_VOCABULARY_ITEMS.length + 1);
  });
});
