import type {
  Curriculum,
  CurriculumLesson,
  CurriculumProgressionState,
  CurriculumValidationReport,
  LessonProgressRecord,
  UnitProgressSummary,
  CEFRLevel,
  PlacementMethod,
} from '../types/curriculum';

/**
 * Initializes a default learner progress state for a beginner starting at A1.
 */
export function initializeLearnerProgress(
  userId: string,
  startingLevel: CEFRLevel = 'A1',
  method: PlacementMethod = 'self-selected'
): CurriculumProgressionState {
  return {
    userId,
    currentLevel: startingLevel,
    placement: {
      startingLevel,
      method,
      placedAt: new Date().toISOString(),
      isCertified: false, // Strict disclaimer: self-selected/unaccredited
    },
    completedLessonIds: [],
    lessonRecords: {},
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Checks whether a given lesson is unlocked and available to study based on prerequisites.
 */
export function isLessonUnlocked(
  lessonId: string,
  state: CurriculumProgressionState,
  curriculum: Curriculum
): boolean {
  const lesson = curriculum.lessons[lessonId];
  if (!lesson) return false;

  // If lesson is already completed or in-progress, it is unlocked
  const record = state.lessonRecords[lessonId];
  if (record && (record.status === 'completed' || record.status === 'in-progress')) {
    return true;
  }

  // Check parent unit prerequisites
  const unit = curriculum.units[lesson.unitId];
  if (unit && unit.prerequisites.length > 0) {
    const unitsComplete = unit.prerequisites.every((prereqUnitId) => {
      const pUnit = curriculum.units[prereqUnitId];
      if (!pUnit) return false;
      return pUnit.lessonIds.every((lid) => state.completedLessonIds.includes(lid));
    });
    if (!unitsComplete) {
      return false;
    }
  }

  // Check lesson prerequisites
  if (!lesson.prerequisites || lesson.prerequisites.length === 0) {
    return true;
  }

  return lesson.prerequisites.every((prereqId) => 
    state.completedLessonIds.includes(prereqId)
  );
}

/**
 * Calculates the progress summary for a specific unit.
 */
export function calculateUnitProgress(
  unitId: string,
  state: CurriculumProgressionState,
  curriculum: Curriculum
): UnitProgressSummary {
  const unit = curriculum.units[unitId];
  if (!unit) {
    return {
      unitId,
      unitNumber: 0,
      title: 'Unknown Unit',
      completedLessonCount: 0,
      totalLessonCount: 0,
      percentComplete: 0,
      isCompleted: false,
    };
  }

  const totalLessons = unit.lessonIds.length;
  if (totalLessons === 0) {
    return {
      unitId,
      unitNumber: unit.unitNumber,
      title: unit.title,
      completedLessonCount: 0,
      totalLessonCount: 0,
      percentComplete: 0,
      isCompleted: false,
    };
  }

  const completedCount = unit.lessonIds.filter((id) =>
    state.completedLessonIds.includes(id)
  ).length;

  const percent = Math.round((completedCount / totalLessons) * 100);

  return {
    unitId,
    unitNumber: unit.unitNumber,
    title: unit.title,
    completedLessonCount: completedCount,
    totalLessonCount: totalLessons,
    percentComplete: percent,
    isCompleted: completedCount === totalLessons,
  };
}

/**
 * Identifies the next recommended lesson for the learner.
 * Finds the earliest unlocked and incomplete lesson in the curriculum.
 */
export function getNextRecommendedLesson(
  state: CurriculumProgressionState,
  curriculum: Curriculum
): CurriculumLesson | null {
  // Sort all units by unit number
  const unitsInLevel = Object.values(curriculum.units)
    .filter((u) => u.level === state.currentLevel && u.status === 'active')
    .sort((a, b) => a.unitNumber - b.unitNumber);

  for (const unit of unitsInLevel) {
    const lessonsInUnit = unit.lessonIds
      .map((id) => curriculum.lessons[id])
      .filter((lesson): lesson is CurriculumLesson => Boolean(lesson) && lesson.status === 'active')
      .sort((a, b) => a.order - b.order);

    for (const lesson of lessonsInUnit) {
      const isCompleted = state.completedLessonIds.includes(lesson.id);
      if (!isCompleted && isLessonUnlocked(lesson.id, state, curriculum)) {
        return lesson;
      }
    }
  }

  // If all active lessons in current level are completed, check if next CEFR level exists
  const levelOrder: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const currentIndex = levelOrder.indexOf(state.currentLevel);
  if (currentIndex < levelOrder.length - 1) {
    const nextLevel = levelOrder[currentIndex + 1];
    const nextLevelUnits = Object.values(curriculum.units)
      .filter((u) => u.level === nextLevel && u.status === 'active')
      .sort((a, b) => a.unitNumber - b.unitNumber);

    for (const unit of nextLevelUnits) {
      const lessons = unit.lessonIds
        .map((id) => curriculum.lessons[id])
        .filter((l): l is CurriculumLesson => Boolean(l) && l.status === 'active')
        .sort((a, b) => a.order - b.order);

      for (const lesson of lessons) {
        if (!state.completedLessonIds.includes(lesson.id) && isLessonUnlocked(lesson.id, state, curriculum)) {
          return lesson;
        }
      }
    }
  }

  return null;
}

/**
 * Marks a lesson as completed, recording scores and updating progression.
 */
export function completeLessonProgress(
  lessonId: string,
  scorePercent: number,
  state: CurriculumProgressionState,
  curriculum: Curriculum
): CurriculumProgressionState {
  const lesson = curriculum.lessons[lessonId];
  if (!lesson) return state;

  const passed = scorePercent >= lesson.completionCriteria.minScorePercent;
  const existingRecord = state.lessonRecords[lessonId];

  const updatedRecord: LessonProgressRecord = {
    lessonId,
    status: passed ? 'completed' : 'in-progress',
    scorePercent: Math.max(scorePercent, existingRecord?.scorePercent || 0),
    completedAt: passed ? new Date().toISOString() : existingRecord?.completedAt,
    attempts: (existingRecord?.attempts || 0) + 1,
    lastActivityIndex: lesson.activities.length - 1,
  };

  const updatedCompletedIds = passed && !state.completedLessonIds.includes(lessonId)
    ? [...state.completedLessonIds, lessonId]
    : state.completedLessonIds;

  return {
    ...state,
    completedLessonIds: updatedCompletedIds,
    lessonRecords: {
      ...state.lessonRecords,
      [lessonId]: updatedRecord,
    },
    lastStudiedLessonId: lessonId,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Performs deep deterministic validation on a curriculum graph.
 * Ensures referential integrity and checks for circular dependencies (DAG cycle detection).
 */
export function validateCurriculumIntegrity(curriculum: Curriculum): CurriculumValidationReport {
  const duplicateUnitIds: string[] = [];
  const duplicateLessonIds: string[] = [];
  const orphanedLessons: string[] = [];
  const missingPrerequisites: { lessonId: string; missingPrereqId: string }[] = [];
  const circularPrerequisites: string[][] = [];
  const invalidLevelReferences: string[] = [];
  const emptyUnits: string[] = [];

  const validLevels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  // Check units
  const seenUnitIds = new Set<string>();
  for (const unit of Object.values(curriculum.units)) {
    if (seenUnitIds.has(unit.id)) {
      duplicateUnitIds.push(unit.id);
    }
    seenUnitIds.add(unit.id);

    if (!validLevels.includes(unit.level)) {
      invalidLevelReferences.push(`Unit ${unit.id} has invalid level ${unit.level}`);
    }

    if (unit.status === 'active' && (!unit.lessonIds || unit.lessonIds.length === 0)) {
      emptyUnits.push(unit.id);
    }
  }

  // Check lessons
  const seenLessonIds = new Set<string>();
  for (const lesson of Object.values(curriculum.lessons)) {
    if (seenLessonIds.has(lesson.id)) {
      duplicateLessonIds.push(lesson.id);
    }
    seenLessonIds.add(lesson.id);

    if (!curriculum.units[lesson.unitId]) {
      orphanedLessons.push(lesson.id);
    }

    if (!validLevels.includes(lesson.level)) {
      invalidLevelReferences.push(`Lesson ${lesson.id} has invalid level ${lesson.level}`);
    }

    for (const prereqId of lesson.prerequisites) {
      if (!curriculum.lessons[prereqId]) {
        missingPrerequisites.push({ lessonId: lesson.id, missingPrereqId: prereqId });
      }
    }
  }

  // DAG Cycle Detection using Depth-First Search with recursion stack tracking
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function detectCycle(currentId: string, path: string[]): boolean {
    visited.add(currentId);
    recursionStack.add(currentId);
    path.push(currentId);

    const lesson = curriculum.lessons[currentId];
    if (lesson && lesson.prerequisites) {
      for (const neighborId of lesson.prerequisites) {
        if (!visited.has(neighborId)) {
          if (detectCycle(neighborId, [...path])) {
            return true;
          }
        } else if (recursionStack.has(neighborId)) {
          circularPrerequisites.push([...path, neighborId]);
          return true;
        }
      }
    }

    recursionStack.delete(currentId);
    return false;
  }

  for (const lessonId of Object.keys(curriculum.lessons)) {
    if (!visited.has(lessonId)) {
      detectCycle(lessonId, []);
    }
  }

  const isValid = 
    duplicateUnitIds.length === 0 &&
    duplicateLessonIds.length === 0 &&
    orphanedLessons.length === 0 &&
    missingPrerequisites.length === 0 &&
    circularPrerequisites.length === 0 &&
    invalidLevelReferences.length === 0 &&
    emptyUnits.length === 0;

  return {
    isValid,
    duplicateUnitIds,
    duplicateLessonIds,
    orphanedLessons,
    missingPrerequisites,
    circularPrerequisites,
    invalidLevelReferences,
    emptyUnits,
  };
}
