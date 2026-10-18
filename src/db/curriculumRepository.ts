import type { Table } from 'dexie';
import type {
  CEFRLevel,
  CurriculumProgressionState,
} from '../types/curriculum';
import { LEXI_CURRICULUM } from '../data/curriculum';
import {
  initializeLearnerProgress,
  completeLessonProgress,
} from '../services/progressionEngine';
import { db } from './index';

export interface ICurriculumRepository {
  getLearnerProgress(userId: string): Promise<CurriculumProgressionState>;
  saveLearnerProgress(state: CurriculumProgressionState): Promise<void>;
  recordLessonCompletion(
    userId: string,
    lessonId: string,
    scorePercent: number
  ): Promise<CurriculumProgressionState>;
  setLearnerLevel(userId: string, level: CEFRLevel): Promise<void>;
}

export class DexieCurriculumRepository implements ICurriculumRepository {
  private get table(): Table<CurriculumProgressionState, string> {
    return db.curriculumProgress;
  }

  async getLearnerProgress(userId: string): Promise<CurriculumProgressionState> {
    const record = await this.table.get(userId);
    if (record) {
      return record;
    }

    // Default beginner state starting at A1 (matching approved Lexi sample path)
    const initial = initializeLearnerProgress(userId, 'A1', 'self-selected');
    
    // Seed with Unit 1 completed and Unit 2 in progress so Continue Learning shows real data
    // (a1-u1-l1, a1-u1-l2, a1-u1-l3, a1-u1-l4 completed, a1-u2-l1, a1-u2-l2 completed, next is a1-u2-l3)
    let seededState = initial;
    seededState = completeLessonProgress('a1-u1-l1-hello', 100, seededState, LEXI_CURRICULUM);
    seededState = completeLessonProgress('a1-u1-l2-introductions', 95, seededState, LEXI_CURRICULUM);
    seededState = completeLessonProgress('a1-u1-l3-courtesies', 100, seededState, LEXI_CURRICULUM);
    seededState = completeLessonProgress('a1-u1-l4-checkins', 90, seededState, LEXI_CURRICULUM);
    seededState = completeLessonProgress('a1-u2-l1-time', 85, seededState, LEXI_CURRICULUM);
    seededState = completeLessonProgress('a1-u2-l2-everyday-conversations', 90, seededState, LEXI_CURRICULUM);

    await this.table.put(seededState);
    return seededState;
  }

  async saveLearnerProgress(state: CurriculumProgressionState): Promise<void> {
    await this.table.put(state);
  }

  async recordLessonCompletion(
    userId: string,
    lessonId: string,
    scorePercent: number
  ): Promise<CurriculumProgressionState> {
    const current = await this.getLearnerProgress(userId);
    const updated = completeLessonProgress(lessonId, scorePercent, current, LEXI_CURRICULUM);
    await this.table.put(updated);
    return updated;
  }

  async setLearnerLevel(userId: string, level: CEFRLevel): Promise<void> {
    const current = await this.getLearnerProgress(userId);
    const updated: CurriculumProgressionState = {
      ...current,
      currentLevel: level,
      updatedAt: new Date().toISOString(),
    };
    await this.table.put(updated);
  }
}

export class InMemoryCurriculumRepository implements ICurriculumRepository {
  private store: Map<string, CurriculumProgressionState> = new Map();

  async getLearnerProgress(userId: string): Promise<CurriculumProgressionState> {
    const existing = this.store.get(userId);
    if (existing) {
      return existing;
    }

    const initial = initializeLearnerProgress(userId, 'A1', 'self-selected');
    let seededState = initial;
    seededState = completeLessonProgress('a1-u1-l1-hello', 100, seededState, LEXI_CURRICULUM);
    seededState = completeLessonProgress('a1-u1-l2-introductions', 95, seededState, LEXI_CURRICULUM);
    seededState = completeLessonProgress('a1-u1-l3-courtesies', 100, seededState, LEXI_CURRICULUM);
    seededState = completeLessonProgress('a1-u1-l4-checkins', 90, seededState, LEXI_CURRICULUM);
    seededState = completeLessonProgress('a1-u2-l1-time', 85, seededState, LEXI_CURRICULUM);
    seededState = completeLessonProgress('a1-u2-l2-everyday-conversations', 90, seededState, LEXI_CURRICULUM);

    this.store.set(userId, seededState);
    return seededState;
  }

  async saveLearnerProgress(state: CurriculumProgressionState): Promise<void> {
    this.store.set(state.userId, state);
  }

  async recordLessonCompletion(
    userId: string,
    lessonId: string,
    scorePercent: number
  ): Promise<CurriculumProgressionState> {
    const current = await this.getLearnerProgress(userId);
    const updated = completeLessonProgress(lessonId, scorePercent, current, LEXI_CURRICULUM);
    this.store.set(userId, updated);
    return updated;
  }

  async setLearnerLevel(userId: string, level: CEFRLevel): Promise<void> {
    const current = await this.getLearnerProgress(userId);
    const updated: CurriculumProgressionState = {
      ...current,
      currentLevel: level,
      updatedAt: new Date().toISOString(),
    };
    this.store.set(userId, updated);
  }

  clear(): void {
    this.store.clear();
  }
}

export function createCurriculumRepository(): ICurriculumRepository {
  if (typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined') {
    try {
      return new DexieCurriculumRepository();
    } catch {
      return new InMemoryCurriculumRepository();
    }
  }
  return new InMemoryCurriculumRepository();
}

export const curriculumRepository: ICurriculumRepository = createCurriculumRepository();
