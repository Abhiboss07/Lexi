import { describe, it, expect } from 'vitest';
import { Rating, State } from 'ts-fsrs';
import {
  createVocabularyCard,
  mapFSRSState,
  formatIntervalPreview,
  getRatingPreviews,
  applyCardRating,
  isCardDue,
} from './fsrsScheduler';
import type { VocabularyItem, VocabularyCardRecord } from '../types/vocabulary';

describe('FSRS Scheduler Service', () => {
  const sampleItem: VocabularyItem = {
    id: 'vocab-morning',
    word: 'morning',
    definition: 'The early part of the day from sunrise until noon.',
    exampleSentence: 'Good morning, how are you today?',
    cefrLevel: 'A1',
    sourceLessonId: 'a1-u1-l1-hello',
    phoneticIpa: '/ˈmɔːrnɪŋ/',
    partOfSpeech: 'noun',
  };

  it('creates an initial new card with 0 reps and 0 lapses', () => {
    const now = new Date('2026-10-19T10:00:00Z');
    const card = createVocabularyCard(sampleItem, 'user-1', now);

    expect(card.id).toBe('vocab-morning');
    expect(card.userId).toBe('user-1');
    expect(card.state).toBe('new');
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(0);
    expect(card.item.word).toBe('morning');
    expect(card.item.cefrLevel).toBe('A1');
    expect(new Date(card.due).getTime()).toBeLessThanOrEqual(now.getTime());
  });

  it('maps FSRS state enum to human-readable strings', () => {
    expect(mapFSRSState(State.New)).toBe('new');
    expect(mapFSRSState(State.Learning)).toBe('learning');
    expect(mapFSRSState(State.Review)).toBe('review');
    expect(mapFSRSState(State.Relearning)).toBe('relearning');
  });

  it('formats interval preview strings accurately', () => {
    const base = new Date('2026-10-19T12:00:00Z');
    expect(formatIntervalPreview(base, new Date('2026-10-19T12:05:00Z'))).toBe('5m');
    expect(formatIntervalPreview(base, new Date('2026-10-19T15:00:00Z'))).toBe('3h');
    expect(formatIntervalPreview(base, new Date('2026-10-22T12:00:00Z'))).toBe('3d');
    expect(formatIntervalPreview(base, new Date('2026-11-19T12:00:00Z'))).toBe('1.0mo');
    expect(formatIntervalPreview(base, new Date('2026-10-19T11:59:00Z'))).toBe('Immediate');
  });

  it('computes 4 rating previews (Again, Hard, Good, Easy) for a card', () => {
    const now = new Date('2026-10-19T10:00:00Z');
    const card = createVocabularyCard(sampleItem, 'user-1', now);

    const previews = getRatingPreviews(card, now);
    expect(previews).toHaveLength(4);

    const labels = previews.map((p) => p.label);
    expect(labels).toEqual(['Again', 'Hard', 'Good', 'Easy']);

    const again = previews.find((p) => p.label === 'Again')!;
    const good = previews.find((p) => p.label === 'Good')!;
    const easy = previews.find((p) => p.label === 'Easy')!;

    expect(again.rating).toBe(Rating.Again);
    expect(good.rating).toBe(Rating.Good);
    expect(easy.rating).toBe(Rating.Easy);

    // Again interval should be shorter than or equal to Good, and Good <= Easy
    expect(again.nextDue.getTime()).toBeLessThanOrEqual(good.nextDue.getTime());
    expect(good.nextDue.getTime()).toBeLessThanOrEqual(easy.nextDue.getTime());
  });

  it('applies ratings and updates card reps, stability, and creates review log', () => {
    const now = new Date('2026-10-19T10:00:00Z');
    const card = createVocabularyCard(sampleItem, 'user-1', now);

    // Rate "Good"
    const { updatedCard, reviewLog } = applyCardRating(card, Rating.Good, now);

    expect(updatedCard.reps).toBe(1);
    expect(updatedCard.lastReviewedAt).toBe(now.toISOString());
    expect(reviewLog.cardId).toBe('vocab-morning');
    expect(reviewLog.rating).toBe(Rating.Good);
    expect(reviewLog.userId).toBe('user-1');

    // Due date of updated card should be in the future
    expect(new Date(updatedCard.due).getTime()).toBeGreaterThan(now.getTime());
  });

  it('handles lapse and reset when rating "Again" on a review card', () => {
    const now = new Date('2026-10-19T10:00:00Z');
    let card = createVocabularyCard(sampleItem, 'user-1', now);

    // Initial review Easy transitions card to 'review' state
    const review1 = applyCardRating(card, Rating.Easy, now);
    card = review1.updatedCard;
    expect(card.state).toBe('review');

    // Second review later with "Again" causes lapse and relearning state
    const later = new Date(card.due);
    const review2 = applyCardRating(card, Rating.Again, later);

    expect(review2.updatedCard.lapses).toBe(1);
    expect(review2.updatedCard.reps).toBe(2);
    expect(review2.updatedCard.state).toBe('relearning');
    expect(review2.reviewLog.rating).toBe(Rating.Again);
  });

  it('determines card due status correctly', () => {
    const now = new Date('2026-10-19T10:00:00Z');
    const pastCard: VocabularyCardRecord = {
      ...createVocabularyCard(sampleItem, 'user-1', now),
      due: '2026-10-19T09:00:00Z',
    };
    expect(isCardDue(pastCard, now)).toBe(true);

    const futureCard: VocabularyCardRecord = {
      ...createVocabularyCard(sampleItem, 'user-1', now),
      due: '2026-10-20T10:00:00Z',
    };
    expect(isCardDue(futureCard, now)).toBe(false);
  });
});
