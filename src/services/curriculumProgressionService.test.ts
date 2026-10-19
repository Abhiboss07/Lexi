import { describe, it, expect } from 'vitest';
import { calculateCurriculumSummary } from './curriculumProgressionService';
import type { CurriculumProgressionState } from '../types/curriculum';

describe('curriculumProgressionService', () => {
  const mockInitialProgress: CurriculumProgressionState = {
    userId: 'test-user',
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
  };

  it('calculates initial curriculum summary starting at Unit 1 Lesson 1', () => {
    const summary = calculateCurriculumSummary(mockInitialProgress);
    expect(summary.currentLevel).toBe('A1');
    expect(summary.currentUnit.id).toBe('a1-unit-1');
    expect(summary.nextLesson.id).toBe('a1-u1-l1-hello');
    expect(summary.completedInUnitCount).toBe(0);
    expect(summary.unitProgressPercent).toBe(0);
  });

  it('progresses to next lesson in unit when prior lessons are completed', () => {
    const progressWithCompletions: CurriculumProgressionState = {
      ...mockInitialProgress,
      completedLessonIds: ['a1-u1-l1-hello', 'a1-u1-l2-introductions'],
    };

    const summary = calculateCurriculumSummary(progressWithCompletions);
    expect(summary.currentUnit.id).toBe('a1-unit-1');
    expect(summary.nextLesson.id).toBe('a1-u1-l3-courtesies');
    expect(summary.completedInUnitCount).toBe(2);
    expect(summary.totalLessonsInUnit).toBe(4);
    expect(summary.unitProgressPercent).toBe(50);
  });

  it('automatically advances to Unit 2 when all Unit 1 lessons are completed', () => {
    const unit1Finished: CurriculumProgressionState = {
      ...mockInitialProgress,
      completedLessonIds: [
        'a1-u1-l1-hello',
        'a1-u1-l2-introductions',
        'a1-u1-l3-courtesies',
        'a1-u1-l4-checkins',
      ],
    };

    const summary = calculateCurriculumSummary(unit1Finished);
    expect(summary.currentUnit.id).toBe('a1-unit-2');
    expect(summary.nextLesson.id).toBe('a1-u2-l1-time');
    expect(summary.completedInUnitCount).toBe(0);
    expect(summary.unitProgressPercent).toBe(0);
  });

  it('calculates summary for higher levels when levelOverride is provided', () => {
    const summary = calculateCurriculumSummary(mockInitialProgress, 'A2');
    expect(summary.currentLevel).toBe('A2');
    expect(summary.currentUnit.id).toBe('a2-unit-4');
    expect(summary.nextLesson.id).toBe('a2-u4-l1-directions');
  });
});
