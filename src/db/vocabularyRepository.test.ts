import { describe, it, expect, beforeEach } from 'vitest';
import { Rating } from 'ts-fsrs';
import {
  InMemoryVocabularyRepository,
  STARTER_VOCABULARY_ITEMS,
} from './vocabularyRepository';

describe('VocabularyRepository (InMemory)', () => {
  let repo: InMemoryVocabularyRepository;
  const userId = 'test-learner-1';

  beforeEach(() => {
    repo = new InMemoryVocabularyRepository();
  });

  it('auto-seeds starter vocabulary on initial card retrieval', async () => {
    const cards = await repo.getCards(userId);
    expect(cards.length).toBe(STARTER_VOCABULARY_ITEMS.length);
    expect(cards[0].item.word).toBe('morning');
    expect(cards[1].item.word).toBe('evening');

    // First 3 cards are seeded as due immediately for early learner practice
    const dueCards = await repo.getDueCards(userId, new Date());
    expect(dueCards.length).toBe(3);
  });

  it('records reviews and persists review logs', async () => {
    const cards = await repo.getCards(userId);
    const cardToReview = cards[0];

    const now = new Date('2026-10-19T11:00:00Z');
    const { updatedCard, reviewLog } = await repo.recordReview(
      cardToReview,
      Rating.Good,
      now
    );

    expect(updatedCard.reps).toBe(1);
    expect(updatedCard.lastReviewedAt).toBe(now.toISOString());
    expect(reviewLog.cardId).toBe(cardToReview.id);
    expect(reviewLog.rating).toBe(Rating.Good);

    // Verify logs can be fetched
    const logs = await repo.getReviewLogs(userId, cardToReview.id);
    expect(logs.length).toBe(1);
    expect(logs[0].rating).toBe(Rating.Good);
  });

  it('safely adds vocabulary from completed lessons without creating duplicates', async () => {
    await repo.getCards(userId); // triggers starter seeding

    const lessonItems = [
      {
        word: 'morning', // already seeded
        definition: 'Existing word',
        exampleSentence: 'Good morning!',
      },
      {
        word: 'croissant', // new word
        phoneticIpa: '/kwɑːˈsɑːŋ/',
        partOfSpeech: 'noun',
        definition: 'A French crescent-shaped roll made of flaky pastry.',
        exampleSentence: 'I ordered a warm butter croissant with my coffee.',
      },
    ];

    const added = await repo.addVocabularyFromLesson(
      userId,
      'a1-u3-l2-bakery',
      lessonItems,
      'Morning Bakery',
      'A1'
    );

    // Only 'croissant' should have been added because 'morning' is already present
    expect(added.length).toBe(1);
    expect(added[0].item.word).toBe('croissant');
    expect(added[0].id).toBe('vocab-croissant');
    expect(added[0].item.sourceLessonTitle).toBe('Morning Bakery');

    const totalCards = await repo.getCards(userId);
    expect(totalCards.length).toBe(STARTER_VOCABULARY_ITEMS.length + 1);
  });

  it('aggregates deck statistics accurately', async () => {
    const statsInitial = await repo.getStats(userId);
    expect(statsInitial.totalCards).toBe(STARTER_VOCABULARY_ITEMS.length);
    expect(statsInitial.dueCards).toBe(3);
    expect(statsInitial.totalReviews).toBe(0);

    const dueCards = await repo.getDueCards(userId);
    await repo.recordReview(dueCards[0], Rating.Good);

    const statsAfter = await repo.getStats(userId);
    expect(statsAfter.totalReviews).toBe(1);
    expect(statsAfter.dueCards).toBe(2);
  });

  it('supports deleting individual vocabulary cards', async () => {
    const cards = await repo.getCards(userId);
    const cardId = cards[0].id;

    await repo.deleteCard(cardId);
    const fetched = await repo.getCard(cardId);
    expect(fetched).toBeUndefined();
  });
});
