import type { CEFRLevel, CurriculumLesson, CurriculumUnit, CurriculumProgressionState } from '../types/curriculum';
import { LEXI_CURRICULUM, getCurriculumUnit, getLessonsForUnit, getUnitsForLevel } from '../data/curriculum';
import { curriculumRepository } from '../db/curriculumRepository';

export interface CurriculumDisplaySummary {
  currentLevel: CEFRLevel;
  currentUnit: CurriculumUnit;
  currentUnitLabel: string;
  nextLesson: CurriculumLesson;
  completedLessonsCount: number;
  totalLessonsInUnit: number;
  completedInUnitCount: number;
  unitProgressPercent: number;
  totalLessonsInLevel: number;
  completedInLevelCount: number;
  levelProgressPercent: number;
}

/**
 * Calculates current unit, next lesson, and percentage progress from progression state.
 */
export function calculateCurriculumSummary(
  progression: CurriculumProgressionState,
  levelOverride?: CEFRLevel
): CurriculumDisplaySummary {
  const level: CEFRLevel = levelOverride || progression.currentLevel || 'A1';
  const unitsForLevel = getUnitsForLevel(level);

  // Fallback default unit if level has no units
  const defaultUnit = unitsForLevel[0] || Object.values(LEXI_CURRICULUM.units)[0];

  // Find the first uncompleted lesson across the units of this level
  let activeUnit: CurriculumUnit = defaultUnit;
  let nextLessonToStudy: CurriculumLesson | undefined;

  for (const unit of unitsForLevel) {
    const unitLessons = getLessonsForUnit(unit.id);
    const uncompleted = unitLessons.find((l) => !progression.completedLessonIds.includes(l.id));
    if (uncompleted) {
      activeUnit = unit;
      nextLessonToStudy = uncompleted;
      break;
    }
  }

  // If all lessons in the level are completed, point to the last lesson or first lesson
  if (!nextLessonToStudy) {
    const allLessons = unitsForLevel.flatMap((u) => getLessonsForUnit(u.id));
    nextLessonToStudy = allLessons[allLessons.length - 1] || Object.values(LEXI_CURRICULUM.lessons)[0];
    const unitOfLesson = getCurriculumUnit(nextLessonToStudy.unitId);
    if (unitOfLesson) {
      activeUnit = unitOfLesson;
    }
  }

  const unitLessons = getLessonsForUnit(activeUnit.id);
  const totalInUnit = Math.max(1, unitLessons.length);
  const completedInUnit = unitLessons.filter((l) => progression.completedLessonIds.includes(l.id)).length;
  const unitPercent = Math.min(100, Math.round((completedInUnit / totalInUnit) * 100));

  const allLessonsInLevel = unitsForLevel.flatMap((u) => getLessonsForUnit(u.id));
  const totalInLevel = Math.max(1, allLessonsInLevel.length);
  const completedInLevel = allLessonsInLevel.filter((l) => progression.completedLessonIds.includes(l.id)).length;
  const levelPercent = Math.min(100, Math.round((completedInLevel / totalInLevel) * 100));

  return {
    currentLevel: level,
    currentUnit: activeUnit,
    currentUnitLabel: `Unit ${activeUnit.unitNumber} • ${activeUnit.title}`,
    nextLesson: nextLessonToStudy,
    completedLessonsCount: progression.completedLessonIds.length,
    totalLessonsInUnit: totalInUnit,
    completedInUnitCount: completedInUnit,
    unitProgressPercent: unitPercent,
    totalLessonsInLevel: totalInLevel,
    completedInLevelCount: completedInLevel,
    levelProgressPercent: levelPercent,
  };
}

export class CurriculumProgressionService {
  async getSummary(userId: string, levelOverride?: CEFRLevel): Promise<CurriculumDisplaySummary> {
    const progress = await curriculumRepository.getLearnerProgress(userId);
    return calculateCurriculumSummary(progress, levelOverride);
  }
}

export const curriculumProgressionService = new CurriculumProgressionService();
