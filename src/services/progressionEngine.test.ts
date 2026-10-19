import { describe, it, expect } from 'vitest';
import { LEXI_CURRICULUM } from '../data/curriculum';
import {
  validateCurriculumIntegrity,
  initializeLearnerProgress,
  isLessonUnlocked,
  getNextRecommendedLesson,
  completeLessonProgress,
  calculateUnitProgress,
} from './progressionEngine';
import type { Curriculum } from '../types/curriculum';

describe('Lexi CEFR Curriculum Architecture & Integrity', () => {
  it('validates the complete curriculum graph with zero structural defects', () => {
    const report = validateCurriculumIntegrity(LEXI_CURRICULUM);
    expect(report.isValid).toBe(true);
    expect(report.duplicateUnitIds).toEqual([]);
    expect(report.duplicateLessonIds).toEqual([]);
    expect(report.orphanedLessons).toEqual([]);
    expect(report.missingPrerequisites).toEqual([]);
    expect(report.circularPrerequisites).toEqual([]);
    expect(report.invalidLevelReferences).toEqual([]);
    expect(report.emptyUnits).toEqual([]);
  });

  it('contains complete metadata for all 6 CEFR levels (A1 to C2)', () => {
    const levels = Object.keys(LEXI_CURRICULUM.levels);
    expect(levels).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

    expect(LEXI_CURRICULUM.levels.A1.status).toBe('available');
    expect(LEXI_CURRICULUM.levels.A2.status).toBe('available');
    expect(LEXI_CURRICULUM.levels.B1.status).toBe('planned');
    expect(LEXI_CURRICULUM.levels.C2.status).toBe('planned');
  });

  it('detects circular prerequisite dependencies in a malformed curriculum', () => {
    const malformedCurriculum: Curriculum = {
      levels: LEXI_CURRICULUM.levels,
      units: {
        'test-unit': {
          id: 'test-unit',
          level: 'A1',
          unitNumber: 99,
          title: 'Loop Unit',
          subtitle: 'Test',
          description: 'Testing cycles',
          theme: 'Test',
          prerequisites: [],
          lessonIds: ['lesson-a', 'lesson-b'],
          status: 'active',
        },
      },
      lessons: {
        'lesson-a': {
          id: 'lesson-a',
          unitId: 'test-unit',
          level: 'A1',
          order: 1,
          title: 'Lesson A',
          subtitle: 'Prereq is B',
          description: 'Loop test',
          estimatedMinutes: 5,
          primarySkill: 'conversation',
          secondarySkills: [],
          objectives: [{ id: 'obj-a', description: 'Test', skill: 'conversation' }],
          prerequisites: ['lesson-b'], // Cycle: A depends on B
          activities: [],
          completionCriteria: { minScorePercent: 80, requireAllActivities: true },
          status: 'active',
        },
        'lesson-b': {
          id: 'lesson-b',
          unitId: 'test-unit',
          level: 'A1',
          order: 2,
          title: 'Lesson B',
          subtitle: 'Prereq is A',
          description: 'Loop test',
          estimatedMinutes: 5,
          primarySkill: 'conversation',
          secondarySkills: [],
          objectives: [{ id: 'obj-b', description: 'Test', skill: 'conversation' }],
          prerequisites: ['lesson-a'], // Cycle: B depends on A
          activities: [],
          completionCriteria: { minScorePercent: 80, requireAllActivities: true },
          status: 'active',
        },
      },
    };

    const report = validateCurriculumIntegrity(malformedCurriculum);
    expect(report.isValid).toBe(false);
    expect(report.circularPrerequisites.length).toBeGreaterThan(0);
  });
});

describe('Learner Placement & Progression Rules Engine', () => {
  it('initializes a beginner learner at A1 with uncertified disclaimer', () => {
    const state = initializeLearnerProgress('test-learner-1', 'A1', 'self-selected');
    expect(state.userId).toBe('test-learner-1');
    expect(state.currentLevel).toBe('A1');
    expect(state.placement.startingLevel).toBe('A1');
    expect(state.placement.method).toBe('self-selected');
    expect(state.placement.isCertified).toBe(false);
    expect(state.completedLessonIds).toEqual([]);
  });

  it('determines lesson availability based on prerequisites', () => {
    const state = initializeLearnerProgress('test-learner-2', 'A1');

    // First lesson of A1 Unit 1 has no prerequisites: must be unlocked
    expect(isLessonUnlocked('a1-u1-l1-hello', state, LEXI_CURRICULUM)).toBe(true);

    // Second lesson requires lesson 1: must be locked initially
    expect(isLessonUnlocked('a1-u1-l2-introductions', state, LEXI_CURRICULUM)).toBe(false);

    // Unit 2 lessons require Unit 1: must be locked initially
    expect(isLessonUnlocked('a1-u2-l1-time', state, LEXI_CURRICULUM)).toBe(false);
  });

  it('unlocks subsequent lessons upon passing score (>= 80%)', () => {
    let state = initializeLearnerProgress('test-learner-3', 'A1');

    // Attempt with failing score (60% < 80%)
    state = completeLessonProgress('a1-u1-l1-hello', 60, state, LEXI_CURRICULUM);
    expect(state.completedLessonIds).not.toContain('a1-u1-l1-hello');
    expect(isLessonUnlocked('a1-u1-l2-introductions', state, LEXI_CURRICULUM)).toBe(false);

    // Re-attempt with passing score (85% >= 80%)
    state = completeLessonProgress('a1-u1-l1-hello', 85, state, LEXI_CURRICULUM);
    expect(state.completedLessonIds).toContain('a1-u1-l1-hello');
    expect(isLessonUnlocked('a1-u1-l2-introductions', state, LEXI_CURRICULUM)).toBe(true);
  });

  it('identifies the next recommended lesson in sequence', () => {
    let state = initializeLearnerProgress('test-learner-4', 'A1');

    // New learner should be recommended the first lesson
    let next = getNextRecommendedLesson(state, LEXI_CURRICULUM);
    expect(next?.id).toBe('a1-u1-l1-hello');

    // Complete lesson 1
    state = completeLessonProgress('a1-u1-l1-hello', 90, state, LEXI_CURRICULUM);
    next = getNextRecommendedLesson(state, LEXI_CURRICULUM);
    expect(next?.id).toBe('a1-u1-l2-introductions');

    // Complete all lessons in Unit 1
    state = completeLessonProgress('a1-u1-l2-introductions', 90, state, LEXI_CURRICULUM);
    state = completeLessonProgress('a1-u1-l3-courtesies', 95, state, LEXI_CURRICULUM);
    state = completeLessonProgress('a1-u1-l4-checkins', 90, state, LEXI_CURRICULUM);

    // Unit 1 complete -> Next recommendation should advance to Unit 2 Lesson 1
    next = getNextRecommendedLesson(state, LEXI_CURRICULUM);
    expect(next?.id).toBe('a1-u2-l1-time');
  });

  it('accurately computes unit progress percentage and completion status', () => {
    let state = initializeLearnerProgress('test-learner-5', 'A1');

    let unit1Prog = calculateUnitProgress('a1-unit-1', state, LEXI_CURRICULUM);
    expect(unit1Prog.totalLessonCount).toBe(4);
    expect(unit1Prog.completedLessonCount).toBe(0);
    expect(unit1Prog.percentComplete).toBe(0);
    expect(unit1Prog.isCompleted).toBe(false);

    state = completeLessonProgress('a1-u1-l1-hello', 100, state, LEXI_CURRICULUM);
    state = completeLessonProgress('a1-u1-l2-introductions', 100, state, LEXI_CURRICULUM);

    unit1Prog = calculateUnitProgress('a1-unit-1', state, LEXI_CURRICULUM);
    expect(unit1Prog.completedLessonCount).toBe(2);
    expect(unit1Prog.percentComplete).toBe(50);
    expect(unit1Prog.isCompleted).toBe(false);

    state = completeLessonProgress('a1-u1-l3-courtesies', 100, state, LEXI_CURRICULUM);
    state = completeLessonProgress('a1-u1-l4-checkins', 100, state, LEXI_CURRICULUM);

    unit1Prog = calculateUnitProgress('a1-unit-1', state, LEXI_CURRICULUM);
    expect(unit1Prog.completedLessonCount).toBe(4);
    expect(unit1Prog.percentComplete).toBe(100);
    expect(unit1Prog.isCompleted).toBe(true);
  });
});
