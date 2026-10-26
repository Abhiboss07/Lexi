import { describe, it, expect } from 'vitest';
import { CurriculumValidator } from './curriculumValidator';
import { LEXI_CURRICULUM } from '../data/curriculum';
import type { Curriculum } from '../types/curriculum';

describe('CurriculumValidator', () => {
  it('validates the real Lexi curriculum dataset without fatal schema errors', () => {
    const report = CurriculumValidator.validate(LEXI_CURRICULUM);
    console.log('VALIDATOR STATS:', report.stats);
    console.log('WARNINGS COUNT:', report.warnings.length);
    expect(report.stats.totalLevels).toBe(6);
    expect(report.stats.availableLevels).toBe(4); // A1, A2, B1, B2
    expect(report.stats.activeUnits).toBe(9); // Units 1-9
    expect(report.stats.activeLessons).toBe(25); // 12 + 9 + 3 + 1
    expect(report.stats.totalActivities).toBeGreaterThanOrEqual(60);
    expect(report.errors).toEqual([]);
    expect(report.isValid).toBe(true);
  });

  it('detects missing descriptors on CEFR level metadata', () => {
    const modified: Curriculum = {
      ...LEXI_CURRICULUM,
      levels: {
        ...LEXI_CURRICULUM.levels,
        A1: {
          ...LEXI_CURRICULUM.levels.A1,
          descriptor: '',
        },
      },
    };
    const report = CurriculumValidator.validate(modified);
    expect(report.isValid).toBe(false);
    expect(report.errors.some((e) => e.scope === 'level' && e.id === 'A1' && e.field === 'descriptor')).toBe(true);
  });

  it('detects dangling lesson IDs in units', () => {
    const modified: Curriculum = {
      ...LEXI_CURRICULUM,
      units: {
        ...LEXI_CURRICULUM.units,
        'a1-unit-1': {
          ...LEXI_CURRICULUM.units['a1-unit-1'],
          lessonIds: ['a1-u1-l1-hello', 'non-existent-lesson-xyz'],
        },
      },
    };
    const report = CurriculumValidator.validate(modified);
    expect(report.isValid).toBe(false);
    expect(report.errors.some((e) => e.scope === 'unit' && e.message.includes('non-existent-lesson-xyz'))).toBe(true);
  });

  it('detects out-of-bounds correctIndex in multiple choice activities', () => {
    const originalLesson = LEXI_CURRICULUM.lessons['a1-u1-l1-hello'];
    const modified: Curriculum = {
      ...LEXI_CURRICULUM,
      lessons: {
        ...LEXI_CURRICULUM.lessons,
        'a1-u1-l1-hello': {
          ...originalLesson,
          activities: [
            {
              id: 'test-act-bad-idx',
              kind: 'multiple-choice',
              prompt: 'Choose one:',
              options: ['A', 'B'],
              correctIndex: 5, // out of bounds
            },
          ],
        },
      },
    };
    const report = CurriculumValidator.validate(modified);
    expect(report.isValid).toBe(false);
    expect(report.errors.some((e) => e.scope === 'activity' && e.id === 'test-act-bad-idx')).toBe(true);
  });

  it('detects invalid fill-in-the-blank activities without placeholder', () => {
    const originalLesson = LEXI_CURRICULUM.lessons['a1-u1-l1-hello'];
    const modified: Curriculum = {
      ...LEXI_CURRICULUM,
      lessons: {
        ...LEXI_CURRICULUM.lessons,
        'a1-u1-l1-hello': {
          ...originalLesson,
          activities: [
            {
              id: 'test-act-bad-fb',
              kind: 'fill-blank',
              sentenceWithBlank: 'There is no blank in this sentence.',
              options: ['hello', 'bye'],
              correctOption: 'hello',
            },
          ],
        },
      },
    };
    const report = CurriculumValidator.validate(modified);
    expect(report.isValid).toBe(false);
    expect(report.errors.some((e) => e.scope === 'activity' && e.id === 'test-act-bad-fb')).toBe(true);
  });

  it('detects fill-in-the-blank when correctOption is missing from options array', () => {
    const originalLesson = LEXI_CURRICULUM.lessons['a1-u1-l1-hello'];
    const modified: Curriculum = {
      ...LEXI_CURRICULUM,
      lessons: {
        ...LEXI_CURRICULUM.lessons,
        'a1-u1-l1-hello': {
          ...originalLesson,
          activities: [
            {
              id: 'test-act-fb-missing-opt',
              kind: 'fill-blank',
              sentenceWithBlank: 'Have a _____ day!',
              options: ['great', 'nice'],
              correctOption: 'wonderful', // Not in options
            },
          ],
        },
      },
    };
    const report = CurriculumValidator.validate(modified);
    expect(report.isValid).toBe(false);
    expect(report.errors.some((e) => e.scope === 'activity' && e.id === 'test-act-fb-missing-opt')).toBe(true);
  });
});
