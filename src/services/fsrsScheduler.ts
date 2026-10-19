import {
  fsrs,
  createEmptyCard,
  Rating,
  State,
  type Card,
  type ReviewLog,
  type Grade,
} from 'ts-fsrs';
import type {
  VocabularyItem,
  VocabularyCardRecord,
  ReviewLogRecord,
  VocabularyCardState,
} from '../types/vocabulary';

/**
 * FSRS Scheduler Service
 *
 * Configures the Free Spaced Repetition Scheduler (FSRS) using ts-fsrs v4.4.0.
 * Default target retention is 90% (0.9), adhering to modern spaced-repetition science.
 */
export const FSRS_INSTANCE = fsrs({
  request_retention: 0.9,
  maximum_interval: 36500,
  enable_fuzz: false, // deterministic intervals for predictable learner experience and automated tests
});

/**
 * Maps ts-fsrs numeric state enum to human-readable VocabularyCardState.
 */
export function mapFSRSState(state: State): VocabularyCardState {
  switch (state) {
    case State.New:
      return 'new';
    case State.Learning:
      return 'learning';
    case State.Review:
      return 'review';
    case State.Relearning:
      return 'relearning';
    default:
      return 'learning';
  }
}

/**
 * Formats time until next due review into a compact learner-friendly badge.
 */
export function formatIntervalPreview(fromDate: Date, targetDate: Date): string {
  const diffMs = targetDate.getTime() - fromDate.getTime();
  if (diffMs <= 0) return 'Immediate';

  const diffMins = Math.round(diffMs / (1000 * 60));
  if (diffMins < 60) {
    return `${Math.max(1, diffMins)}m`;
  }

  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 30) {
    return `${diffDays}d`;
  }

  const diffMonths = (diffDays / 30).toFixed(1);
  return `${diffMonths}mo`;
}

/**
 * Creates a new learning card for a vocabulary item.
 */
export function createVocabularyCard(
  item: VocabularyItem,
  userId: string,
  now: Date = new Date()
): VocabularyCardRecord {
  const emptyCard: Card = createEmptyCard(now);

  return {
    id: item.id,
    userId,
    item,
    fsrsCard: emptyCard,
    state: 'new',
    due: emptyCard.due.toISOString(),
    reps: 0,
    lapses: 0,
    addedAt: now.toISOString(),
  };
}

export interface RatingOptionPreview {
  rating: Grade;
  label: 'Again' | 'Hard' | 'Good' | 'Easy';
  intervalText: string;
  nextDue: Date;
  nextState: VocabularyCardState;
  colorClass: string;
}

/**
 * Computes scheduled next due times and state transitions for all 4 rating buttons.
 */
export function getRatingPreviews(
  cardRecord: VocabularyCardRecord,
  now: Date = new Date()
): RatingOptionPreview[] {
  // Ensure fsrsCard due & last_review are Date objects for ts-fsrs
  const baseCard: Card = {
    ...cardRecord.fsrsCard,
    due: new Date(cardRecord.fsrsCard.due),
    last_review: cardRecord.fsrsCard.last_review
      ? new Date(cardRecord.fsrsCard.last_review)
      : undefined,
  };

  const repeatResult = FSRS_INSTANCE.repeat(baseCard, now);

  const configs: Array<{
    rating: Grade;
    label: 'Again' | 'Hard' | 'Good' | 'Easy';
    colorClass: string;
  }> = [
    { rating: Rating.Again, label: 'Again', colorClass: 'border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEF2F2]' },
    { rating: Rating.Hard, label: 'Hard', colorClass: 'border-[#FDBA74] text-[#EA580C] hover:bg-[#FFF7ED]' },
    { rating: Rating.Good, label: 'Good', colorClass: 'border-[#93C5FD] text-[#2563EB] hover:bg-[#EFF6FF]' },
    { rating: Rating.Easy, label: 'Easy', colorClass: 'border-[#86EFAC] text-[#16A34A] hover:bg-[#F0FDF4]' },
  ];

  return configs.map(({ rating, label, colorClass }) => {
    const item = repeatResult[rating];
    const nextDue = item.card.due;
    return {
      rating,
      label,
      intervalText: formatIntervalPreview(now, nextDue),
      nextDue,
      nextState: mapFSRSState(item.card.state),
      colorClass,
    };
  });
}

/**
 * Applies a learner's rating (Again, Hard, Good, Easy) to a vocabulary card,
 * updating stability, difficulty, repetitions, lapses, and next due date.
 */
export function applyCardRating(
  cardRecord: VocabularyCardRecord,
  rating: Grade,
  now: Date = new Date()
): { updatedCard: VocabularyCardRecord; reviewLog: ReviewLogRecord } {
  const baseCard: Card = {
    ...cardRecord.fsrsCard,
    due: new Date(cardRecord.fsrsCard.due),
    last_review: cardRecord.fsrsCard.last_review
      ? new Date(cardRecord.fsrsCard.last_review)
      : undefined,
  };

  const repeatResult = FSRS_INSTANCE.repeat(baseCard, now);
  const selected = repeatResult[rating];

  const updatedFSRSCard = selected.card;
  const rawLog: ReviewLog = selected.log;

  const nextState = mapFSRSState(updatedFSRSCard.state);

  const updatedCard: VocabularyCardRecord = {
    ...cardRecord,
    fsrsCard: updatedFSRSCard,
    state: nextState,
    due: updatedFSRSCard.due.toISOString(),
    lastReviewedAt: now.toISOString(),
    reps: updatedFSRSCard.reps,
    lapses: updatedFSRSCard.lapses,
  };

  const reviewLog: ReviewLogRecord = {
    id: `log-${cardRecord.id}-${now.getTime()}`,
    cardId: cardRecord.id,
    userId: cardRecord.userId,
    rating,
    fsrsLog: rawLog,
    reviewedAt: now.toISOString(),
    scheduledDays: updatedFSRSCard.scheduled_days,
    elapsedDays: updatedFSRSCard.elapsed_days,
  };

  return { updatedCard, reviewLog };
}

/**
 * Checks if a card is currently due for review.
 */
export function isCardDue(card: VocabularyCardRecord, asOf: Date = new Date()): boolean {
  return new Date(card.due).getTime() <= asOf.getTime();
}
