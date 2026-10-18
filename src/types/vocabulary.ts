import type { Card, ReviewLog } from 'ts-fsrs';
import type { CEFRLevel } from './curriculum';

export type VocabularyCardState = 'new' | 'learning' | 'review' | 'relearning';

export interface VocabularyItem {
  id: string; // Deterministic stable ID (e.g., 'vocab-morning')
  word: string;
  definition: string;
  exampleSentence: string;
  cefrLevel: CEFRLevel;
  sourceLessonId: string;
  sourceLessonTitle?: string;
  phoneticIpa?: string;
  partOfSpeech?: 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'phrase' | string;
  translation?: string;
  tags?: string[];
}

export interface VocabularyCardRecord {
  id: string; // matches VocabularyItem.id
  userId: string;
  item: VocabularyItem;
  // Serialized or native FSRS Card object
  fsrsCard: Card;
  state: VocabularyCardState;
  due: string; // ISO 8601 string for indexed storage & queries
  lastReviewedAt?: string;
  reps: number;
  lapses: number;
  addedAt: string;
}

export interface ReviewLogRecord {
  id: string; // UUID or timestamp slug
  cardId: string;
  userId: string;
  rating: number; // 1: Again, 2: Hard, 3: Good, 4: Easy
  fsrsLog: ReviewLog;
  reviewedAt: string;
  scheduledDays: number;
  elapsedDays: number;
}

export interface VocabularyStats {
  totalCards: number;
  dueCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  relearningCards: number;
  totalReviews: number;
}
