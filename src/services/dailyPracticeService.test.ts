import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getLocalDateString, 
  getDateSeed, 
  DailyPracticeService 
} from './dailyPracticeService';
import { InMemoryVocabularyRepository } from '../db/vocabularyRepository';
import { InMemoryPracticeRepository } from '../db/practiceRepository';

describe('DailyPracticeService', () => {
  let vocabRepo: InMemoryVocabularyRepository;
  let practiceRepo: InMemoryPracticeRepository;
  let service: DailyPracticeService;

  beforeEach(() => {
    vocabRepo = new InMemoryVocabularyRepository();
    practiceRepo = new InMemoryPracticeRepository();
    service = new DailyPracticeService(vocabRepo, practiceRepo);
  });

  it('computes stable, safe local date string in YYYY-MM-DD format', () => {
    const fixedDate = new Date(2026, 9, 19); // Oct 19, 2026
    const str = getLocalDateString(fixedDate);
    expect(str).toBe('2026-10-19');
  });

  it('produces deterministic hash seed from date string', () => {
    const seed1 = getDateSeed('2026-10-19');
    const seed2 = getDateSeed('2026-10-19');
    const seed3 = getDateSeed('2026-10-20');

    expect(seed1).toBe(seed2);
    expect(seed1).not.toBe(seed3);
  });

  it('returns stable recommendations on the same date without random jitter', async () => {
    const date = new Date(2026, 9, 19);
    const options1 = await service.getDailyPracticeOptions('test-user', date);
    const options2 = await service.getDailyPracticeOptions('test-user', date);

    expect(options1).toHaveLength(3);
    expect(options1[0].topicTitle).toBe(options2[0].topicTitle);
    expect(options1[1].topicTitle).toBe(options2[1].topicTitle);
    expect(options1[2].topicTitle).toBe(options2[2].topicTitle);
  });

  it('rotates recommendations deterministically across different calendar dates', async () => {
    const dateA = new Date(2026, 9, 19);
    const dateB = new Date(2026, 9, 21);

    const optionsA = await service.getDailyPracticeOptions('test-user', dateA);
    const optionsB = await service.getDailyPracticeOptions('test-user', dateB);

    expect(optionsA).toHaveLength(3);
    expect(optionsB).toHaveLength(3);
    // At least one category rotated to a new topic
    const hasDifferentTopic = 
      optionsA[0].topicTitle !== optionsB[0].topicTitle ||
      optionsA[1].topicTitle !== optionsB[1].topicTitle ||
      optionsA[2].topicTitle !== optionsB[2].topicTitle;
    expect(hasDifferentTopic).toBe(true);
  });

  it('shows Ready when no cards are due and switches to X Due when cards are due', async () => {
    const testNow = new Date();
    // 1. Initial seeded cards: first 3 are due immediately for initial practice
    const optionsWithInitial = await service.getDailyPracticeOptions('test-user', testNow);
    const vocabInit = optionsWithInitial.find((o) => o.id === 'vocabulary');
    expect(vocabInit?.badgeText).toBe('3 Due');
    expect(vocabInit?.dueCount).toBe(3);

    // 2. Clear cards to test no-due state
    const emptyVocabRepo = new InMemoryVocabularyRepository();
    // Override getDueCards to return []
    emptyVocabRepo.getDueCards = async () => [];
    const emptyService = new DailyPracticeService(emptyVocabRepo, practiceRepo);

    const optionsNoDue = await emptyService.getDailyPracticeOptions('test-user', testNow);
    const vocabNoDue = optionsNoDue.find((o) => o.id === 'vocabulary');
    expect(vocabNoDue?.badgeText).toBe('Ready');
    expect(vocabNoDue?.status).toBe('ready');
  });

  it('persists completion and refreshes on the next day while preserving history', async () => {
    const dateDay1 = new Date(2026, 9, 19);
    const dateDay2 = new Date(2026, 9, 20);

    // Initial Day 1 status
    let options = await service.getDailyPracticeOptions('test-user', dateDay1);
    expect(options.find((o) => o.id === 'listening')?.status).toBe('ready');

    // Record completion on Day 1
    await service.recordDailyCompletion('test-user', 'listening', 90, dateDay1);

    // Recheck Day 1: shows completed and ✓ Done
    options = await service.getDailyPracticeOptions('test-user', dateDay1);
    const listeningDay1 = options.find((o) => o.id === 'listening');
    expect(listeningDay1?.status).toBe('completed');
    expect(listeningDay1?.badgeText).toBe('✓ Done');

    // Check Day 2: fresh recommendation ready, not completed
    const optionsDay2 = await service.getDailyPracticeOptions('test-user', dateDay2);
    const listeningDay2 = optionsDay2.find((o) => o.id === 'listening');
    expect(listeningDay2?.status).toBe('ready');
    expect(listeningDay2?.badgeText).toBe('Ready');

    // Verify history preserved in repository
    const sessions = await practiceRepo.getSessions('test-user', 50);
    expect(sessions.length).toBeGreaterThanOrEqual(1);
    expect(sessions.some((s) => s.activityId === 'daily-listening-2026-10-19')).toBe(true);
  });
});
