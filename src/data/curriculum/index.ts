import type { Curriculum, CEFRLevel, CurriculumUnit, CurriculumLesson } from '../../types/curriculum';
import { CEFR_LEVELS_META } from './levels';
import { A1_UNITS, A1_LESSONS } from './a1Content';
import { A2_UNITS, A2_LESSONS } from './a2Content';
import { FUTURE_UNITS, FUTURE_LESSONS } from './futureLevels';

export * from './levels';
export * from './a1Content';
export * from './a2Content';
export * from './futureLevels';

export const LEXI_CURRICULUM: Curriculum = {
  levels: CEFR_LEVELS_META,
  units: {
    ...A1_UNITS,
    ...A2_UNITS,
    ...FUTURE_UNITS,
  },
  lessons: {
    ...A1_LESSONS,
    ...A2_LESSONS,
    ...FUTURE_LESSONS,
  },
};

/**
 * Accessor Helpers
 */
export function getCurriculumUnit(unitId: string): CurriculumUnit | undefined {
  return LEXI_CURRICULUM.units[unitId];
}

export function getCurriculumLesson(lessonId: string): CurriculumLesson | undefined {
  return LEXI_CURRICULUM.lessons[lessonId];
}

export function getLessonsForUnit(unitId: string): CurriculumLesson[] {
  const unit = LEXI_CURRICULUM.units[unitId];
  if (!unit) return [];
  return unit.lessonIds
    .map((id) => LEXI_CURRICULUM.lessons[id])
    .filter((lesson): lesson is CurriculumLesson => Boolean(lesson));
}

export function getUnitsForLevel(level: CEFRLevel): CurriculumUnit[] {
  return Object.values(LEXI_CURRICULUM.units)
    .filter((unit) => unit.level === level)
    .sort((a, b) => a.unitNumber - b.unitNumber);
}

export function getAllLessonsForLevel(level: CEFRLevel): CurriculumLesson[] {
  return Object.values(LEXI_CURRICULUM.lessons)
    .filter((lesson) => lesson.level === level)
    .sort((a, b) => a.order - b.order);
}
