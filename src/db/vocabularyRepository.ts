import type { Table } from 'dexie';
import type { Grade } from 'ts-fsrs';
import type {
  VocabularyItem,
  VocabularyCardRecord,
  ReviewLogRecord,
  VocabularyStats,
} from '../types/vocabulary';
import type { CEFRLevel } from '../types/curriculum';
import { db } from './index';
import {
  createVocabularyCard,
  applyCardRating,
  isCardDue,
} from '../services/fsrsScheduler';

export interface IVocabularyRepository {
  getCards(userId: string): Promise<VocabularyCardRecord[]>;
  getCard(cardId: string): Promise<VocabularyCardRecord | undefined>;
  getDueCards(userId: string, asOf?: Date): Promise<VocabularyCardRecord[]>;
  saveCard(card: VocabularyCardRecord): Promise<void>;
  deleteCard(cardId: string): Promise<void>;
  recordReview(
    card: VocabularyCardRecord,
    rating: Grade,
    now?: Date
  ): Promise<{ updatedCard: VocabularyCardRecord; reviewLog: ReviewLogRecord }>;
  getReviewLogs(userId: string, cardId?: string): Promise<ReviewLogRecord[]>;
  addVocabularyFromLesson(
    userId: string,
    lessonId: string,
    items: Array<{
      word: string;
      phoneticIpa?: string;
      partOfSpeech?: string;
      definition: string;
      exampleSentence: string;
    }>,
    lessonTitle?: string,
    level?: CEFRLevel
  ): Promise<VocabularyCardRecord[]>;
  getStats(userId: string): Promise<VocabularyStats>;
  resetDeck(userId: string): Promise<void>;
}

/**
 * Standard starter vocabulary items drawn from foundational A1 lessons.
 */
export const STARTER_VOCABULARY_ITEMS: VocabularyItem[] = [
  {
    id: 'vocab-morning',
    word: 'morning',
    phoneticIpa: '/ˈmɔːrnɪŋ/',
    partOfSpeech: 'noun',
    definition: 'The early part of the day from sunrise until noon.',
    exampleSentence: 'Good morning, how are you today?',
    cefrLevel: 'A1',
    sourceLessonId: 'a1-u1-l1-hello',
    sourceLessonTitle: 'Saying Hello & Goodbye',
    tags: ['greetings', 'basics'],
  },
  {
    id: 'vocab-evening',
    word: 'evening',
    phoneticIpa: '/ˈiːvnɪŋ/',
    partOfSpeech: 'noun',
    definition: 'The period of time at the end of the day, usually between 6 PM and nightfall.',
    exampleSentence: 'Good evening! Welcome to the hotel.',
    cefrLevel: 'A1',
    sourceLessonId: 'a1-u1-l1-hello',
    sourceLessonTitle: 'Saying Hello & Goodbye',
    tags: ['greetings', 'basics'],
  },
  {
    id: 'vocab-confident',
    word: 'confident',
    phoneticIpa: '/ˈkɑːnfɪdənt/',
    partOfSpeech: 'adjective',
    definition: 'Feeling or showing certainty about something or self-assurance.',
    exampleSentence: 'With daily practice, she felt confident speaking English.',
    cefrLevel: 'A2',
    sourceLessonId: 'word-of-the-day',
    sourceLessonTitle: 'Word of the Day',
    tags: ['mindset', 'fluency'],
  },
  {
    id: 'vocab-pleasure',
    word: 'pleasure',
    phoneticIpa: '/ˈpleʒər/',
    partOfSpeech: 'noun',
    definition: 'A feeling of happy satisfaction or enjoyment.',
    exampleSentence: 'It is a pleasure to meet you.',
    cefrLevel: 'A1',
    sourceLessonId: 'a1-u1-l2-introductions',
    sourceLessonTitle: 'Introducing Yourself & Others',
    tags: ['social', 'courtesy'],
  },
  {
    id: 'vocab-colleague',
    word: 'colleague',
    phoneticIpa: '/ˈkɑːliːɡ/',
    partOfSpeech: 'noun',
    definition: 'A person with whom one works in a profession or business.',
    exampleSentence: 'This is my colleague, Sarah from design.',
    cefrLevel: 'A1',
    sourceLessonId: 'a1-u1-l2-introductions',
    sourceLessonTitle: 'Introducing Yourself & Others',
    tags: ['work', 'introductions'],
  },
  {
    id: 'vocab-request',
    word: 'request',
    phoneticIpa: '/rɪˈkwest/',
    partOfSpeech: 'noun',
    definition: 'An act of asking politely or formally for something.',
    exampleSentence: 'She made a polite request for extra water.',
    cefrLevel: 'A1',
    sourceLessonId: 'a1-u2-l2-everyday-conversations',
    sourceLessonTitle: 'Everyday Conversations',
    tags: ['polite', 'communication'],
  },
];

export class DexieVocabularyRepository implements IVocabularyRepository {
  private get cardsTable(): Table<VocabularyCardRecord, string> {
    return db.vocabularyCards;
  }

  private get logsTable(): Table<ReviewLogRecord, string> {
    return db.reviewLogs;
  }

  private seedingPromise: Promise<VocabularyCardRecord[]> | null = null;

  async getCards(userId: string): Promise<VocabularyCardRecord[]> {
    if (this.seedingPromise) {
      return this.seedingPromise;
    }

    const existing = await this.cardsTable.where('userId').equals(userId).toArray();
    if (existing.length > 0) {
      return existing;
    }

    this.seedingPromise = (async () => {
      try {
        const check = await this.cardsTable.where('userId').equals(userId).toArray();
        if (check.length > 0) return check;

        // Auto-seed with curated starter vocabulary from the initial lessons atomically
        const seeded: VocabularyCardRecord[] = [];
        const now = new Date();

        for (let i = 0; i < STARTER_VOCABULARY_ITEMS.length; i++) {
          const item = STARTER_VOCABULARY_ITEMS[i];
          const card = createVocabularyCard(item, userId, now);
          
          // Make the first 3 cards due immediately to let learner practice right away
          if (i < 3) {
            card.due = new Date(now.getTime() - 1000 * 60 * (i + 1)).toISOString();
          } else {
            // Schedule others 1-2 days out
            card.due = new Date(now.getTime() + 1000 * 60 * 60 * 24 * (i - 2)).toISOString();
            card.state = 'learning';
            card.reps = 1;
          }

          seeded.push(card);
        }

        await this.cardsTable.bulkPut(seeded);
        return seeded;
      } finally {
        this.seedingPromise = null;
      }
    })();

    return this.seedingPromise;
  }

  async getCard(cardId: string): Promise<VocabularyCardRecord | undefined> {
    return this.cardsTable.get(cardId);
  }

  async getDueCards(userId: string, asOf: Date = new Date()): Promise<VocabularyCardRecord[]> {
    const all = await this.getCards(userId);
    return all.filter((c) => isCardDue(c, asOf));
  }

  async saveCard(card: VocabularyCardRecord): Promise<void> {
    await this.cardsTable.put(card);
  }

  async deleteCard(cardId: string): Promise<void> {
    await this.cardsTable.delete(cardId);
  }

  async recordReview(
    card: VocabularyCardRecord,
    rating: Grade,
    now: Date = new Date()
  ): Promise<{ updatedCard: VocabularyCardRecord; reviewLog: ReviewLogRecord }> {
    const { updatedCard, reviewLog } = applyCardRating(card, rating, now);
    await this.cardsTable.put(updatedCard);
    await this.logsTable.put(reviewLog);
    return { updatedCard, reviewLog };
  }

  async getReviewLogs(userId: string, cardId?: string): Promise<ReviewLogRecord[]> {
    if (cardId) {
      return this.logsTable.where('cardId').equals(cardId).toArray();
    }
    return this.logsTable.where('userId').equals(userId).toArray();
  }

  async addVocabularyFromLesson(
    userId: string,
    lessonId: string,
    items: Array<{
      word: string;
      phoneticIpa?: string;
      partOfSpeech?: string;
      definition: string;
      exampleSentence: string;
    }>,
    lessonTitle?: string,
    level: CEFRLevel = 'A1'
  ): Promise<VocabularyCardRecord[]> {
    const added: VocabularyCardRecord[] = [];
    const now = new Date();

    for (const item of items) {
      const stableId = `vocab-${item.word.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const existing = await this.cardsTable.get(stableId);
      if (existing) {
        continue; // preserve existing FSRS intervals if word already in notebook
      }

      const vocabItem: VocabularyItem = {
        id: stableId,
        word: item.word,
        phoneticIpa: item.phoneticIpa,
        partOfSpeech: item.partOfSpeech,
        definition: item.definition,
        exampleSentence: item.exampleSentence,
        cefrLevel: level,
        sourceLessonId: lessonId,
        sourceLessonTitle: lessonTitle,
      };

      const newCard = createVocabularyCard(vocabItem, userId, now);
      await this.cardsTable.put(newCard);
      added.push(newCard);
    }

    return added;
  }

  async getStats(userId: string): Promise<VocabularyStats> {
    const cards = await this.getCards(userId);
    const logs = await this.getReviewLogs(userId);
    const now = new Date();

    return {
      totalCards: cards.length,
      dueCards: cards.filter((c) => isCardDue(c, now)).length,
      newCards: cards.filter((c) => c.state === 'new').length,
      learningCards: cards.filter((c) => c.state === 'learning').length,
      reviewCards: cards.filter((c) => c.state === 'review').length,
      relearningCards: cards.filter((c) => c.state === 'relearning').length,
      totalReviews: logs.length,
    };
  }

  async resetDeck(userId: string): Promise<void> {
    const cards = await this.cardsTable.where('userId').equals(userId).toArray();
    for (const card of cards) {
      await this.cardsTable.delete(card.id);
    }
  }
}

export class InMemoryVocabularyRepository implements IVocabularyRepository {
  private cards: Map<string, VocabularyCardRecord> = new Map();
  private logs: Map<string, ReviewLogRecord> = new Map();

  async getCards(userId: string): Promise<VocabularyCardRecord[]> {
    const userCards = Array.from(this.cards.values()).filter((c) => c.userId === userId);
    if (userCards.length > 0) return userCards;

    const seeded: VocabularyCardRecord[] = [];
    const now = new Date();
    for (let i = 0; i < STARTER_VOCABULARY_ITEMS.length; i++) {
      const item = STARTER_VOCABULARY_ITEMS[i];
      const card = createVocabularyCard(item, userId, now);
      if (i < 3) {
        card.due = new Date(now.getTime() - 1000 * 60 * (i + 1)).toISOString();
      } else {
        card.due = new Date(now.getTime() + 1000 * 60 * 60 * 24 * (i - 2)).toISOString();
        card.state = 'learning';
        card.reps = 1;
      }
      this.cards.set(card.id, card);
      seeded.push(card);
    }
    return seeded;
  }

  async getCard(cardId: string): Promise<VocabularyCardRecord | undefined> {
    return this.cards.get(cardId);
  }

  async getDueCards(userId: string, asOf: Date = new Date()): Promise<VocabularyCardRecord[]> {
    const all = await this.getCards(userId);
    return all.filter((c) => isCardDue(c, asOf));
  }

  async saveCard(card: VocabularyCardRecord): Promise<void> {
    this.cards.set(card.id, card);
  }

  async deleteCard(cardId: string): Promise<void> {
    this.cards.delete(cardId);
  }

  async recordReview(
    card: VocabularyCardRecord,
    rating: Grade,
    now: Date = new Date()
  ): Promise<{ updatedCard: VocabularyCardRecord; reviewLog: ReviewLogRecord }> {
    const { updatedCard, reviewLog } = applyCardRating(card, rating, now);
    this.cards.set(updatedCard.id, updatedCard);
    this.logs.set(reviewLog.id, reviewLog);
    return { updatedCard, reviewLog };
  }

  async getReviewLogs(userId: string, cardId?: string): Promise<ReviewLogRecord[]> {
    return Array.from(this.logs.values()).filter((l) => {
      if (cardId) return l.cardId === cardId && l.userId === userId;
      return l.userId === userId;
    });
  }

  async addVocabularyFromLesson(
    userId: string,
    lessonId: string,
    items: Array<{
      word: string;
      phoneticIpa?: string;
      partOfSpeech?: string;
      definition: string;
      exampleSentence: string;
    }>,
    lessonTitle?: string,
    level: CEFRLevel = 'A1'
  ): Promise<VocabularyCardRecord[]> {
    const added: VocabularyCardRecord[] = [];
    const now = new Date();

    for (const item of items) {
      const stableId = `vocab-${item.word.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      if (this.cards.has(stableId)) continue;

      const vocabItem: VocabularyItem = {
        id: stableId,
        word: item.word,
        phoneticIpa: item.phoneticIpa,
        partOfSpeech: item.partOfSpeech,
        definition: item.definition,
        exampleSentence: item.exampleSentence,
        cefrLevel: level,
        sourceLessonId: lessonId,
        sourceLessonTitle: lessonTitle,
      };

      const newCard = createVocabularyCard(vocabItem, userId, now);
      this.cards.set(newCard.id, newCard);
      added.push(newCard);
    }
    return added;
  }

  async getStats(userId: string): Promise<VocabularyStats> {
    const cards = await this.getCards(userId);
    const logs = await this.getReviewLogs(userId);
    const now = new Date();

    return {
      totalCards: cards.length,
      dueCards: cards.filter((c) => isCardDue(c, now)).length,
      newCards: cards.filter((c) => c.state === 'new').length,
      learningCards: cards.filter((c) => c.state === 'learning').length,
      reviewCards: cards.filter((c) => c.state === 'review').length,
      relearningCards: cards.filter((c) => c.state === 'relearning').length,
      totalReviews: logs.length,
    };
  }

  async resetDeck(userId: string): Promise<void> {
    for (const [id, card] of this.cards.entries()) {
      if (card.userId === userId) {
        this.cards.delete(id);
      }
    }
    for (const [id, log] of this.logs.entries()) {
      if (log.userId === userId) {
        this.logs.delete(id);
      }
    }
  }
}

/**
 * Factory supporting browser IndexedDB / Dexie with Node / jsdom test fallback.
 */
export function createVocabularyRepository(): IVocabularyRepository {
  if (typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB) {
    return new DexieVocabularyRepository();
  }
  return new InMemoryVocabularyRepository();
}

export const vocabularyRepository = createVocabularyRepository();
