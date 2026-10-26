import type {
  LessonMasteryRecord,
  MasteryStatus,
  UnitMasteryReport,
} from '../types/assessment';
import type {
  CEFRLevel,
  CurriculumProgressionState,
  LessonProgressRecord,
} from '../types/curriculum';
import { LEXI_CURRICULUM, getLessonsForUnit, getUnitsForLevel } from '../data/curriculum';

export interface MasteryEvaluationCriteria {
  minPassingScorePercent: number; // e.g. 70% to mark completed
  minMasteryScorePercent: number; // e.g. 80%
  requiredConsistentAttempts: number; // e.g. 2 attempts >= 80% or 1 high checkpoint >= 95%
  maxErraticVarianceThreshold: number; // detects rapid guessing
}

export const DEFAULT_MASTERY_CRITERIA: MasteryEvaluationCriteria = {
  minPassingScorePercent: 70,
  minMasteryScorePercent: 80,
  requiredConsistentAttempts: 2,
  maxErraticVarianceThreshold: 55, // Jump from 35% to 95% indicates potential rapid guessing
};

/**
 * Pure, deterministic evaluation of a single lesson's mastery status.
 * Strictly distinguishes lesson completion from verified mastery.
 */
export function evaluateLessonMastery(
  lessonId: string,
  record?: LessonProgressRecord,
  criteria: MasteryEvaluationCriteria = DEFAULT_MASTERY_CRITERIA
): LessonMasteryRecord {
  if (!record || record.attempts === 0) {
    return {
      lessonId,
      status: 'not_started',
      attemptsCount: 0,
      bestScorePercent: 0,
      recentScorePercent: 0,
      demonstratedConsistency: false,
      revisionRecommended: false,
      lastAssessedAt: new Date().toISOString(),
    };
  }

  const attemptsCount = record.attempts || 1;
  const score = record.scorePercent || 0;

  let status: MasteryStatus = 'in_progress';
  let demonstratedConsistency = false;
  let revisionRecommended = false;
  let recommendedRevisionTopic: string | undefined;

  // Demonstrated consistency: either multiple high attempts OR high single score >= 95%
  if (score >= criteria.minMasteryScorePercent) {
    if (attemptsCount >= criteria.requiredConsistentAttempts || score >= 95) {
      status = 'mastered';
      demonstratedConsistency = true;
    } else {
      // First high score: proficient, but another attempt or checkpoint needed for permanent mastery
      status = 'proficient';
    }
  } else if (score >= criteria.minPassingScorePercent) {
    status = 'proficient';
    revisionRecommended = true;
    recommendedRevisionTopic = 'Practice key phrases to advance from proficient to mastered';
  } else {
    status = 'in_progress';
    revisionRecommended = true;
    recommendedRevisionTopic = 'Review vocabulary and grammar concepts before retrying';
  }

  return {
    lessonId,
    status,
    attemptsCount,
    bestScorePercent: score,
    recentScorePercent: score,
    demonstratedConsistency,
    revisionRecommended,
    recommendedRevisionTopic,
    lastAssessedAt: record.completedAt || new Date().toISOString(),
  };
}

/**
 * Calculates unit-level mastery report across all lessons in a unit.
 */
export function evaluateUnitMastery(
  unitId: string,
  state: CurriculumProgressionState,
  criteria: MasteryEvaluationCriteria = DEFAULT_MASTERY_CRITERIA
): UnitMasteryReport {
  const unit = LEXI_CURRICULUM.units[unitId];
  const unitLessons = getLessonsForUnit(unitId);
  const totalLessons = unitLessons.length;

  if (!unit || totalLessons === 0) {
    return {
      unitId,
      title: unit?.title || 'Unknown Unit',
      level: (unit?.level || 'A1') as CEFRLevel,
      totalLessons: 0,
      masteredLessonsCount: 0,
      unitMasteryPercent: 0,
      isUnitMastered: false,
      lessons: {},
    };
  }

  const lessonMasteryRecords: Record<string, LessonMasteryRecord> = {};
  let masteredCount = 0;

  for (const lesson of unitLessons) {
    const record = state.lessonRecords[lesson.id];
    const mastery = evaluateLessonMastery(lesson.id, record, criteria);
    lessonMasteryRecords[lesson.id] = mastery;

    if (mastery.status === 'mastered') {
      masteredCount++;
    }
  }

  const unitMasteryPercent = totalLessons > 0 ? Math.round((masteredCount / totalLessons) * 100) : 0;
  // Unit is mastered when at least 75% of its lessons have demonstrated verified mastery
  const isUnitMastered = unitMasteryPercent >= 75;

  return {
    unitId,
    title: unit.title,
    level: unit.level,
    totalLessons,
    masteredLessonsCount: masteredCount,
    unitMasteryPercent,
    isUnitMastered,
    lessons: lessonMasteryRecords,
  };
}

/**
 * Evaluates whether a learner is eligible for a Lexi internal curriculum milestone certificate.
 * Strictly distinguishes internal learning milestones from accredited qualifications.
 */
export function evaluateMilestoneCertificateEligibility(
  targetLevel: CEFRLevel,
  state: CurriculumProgressionState,
  criteria: MasteryEvaluationCriteria = DEFAULT_MASTERY_CRITERIA
): {
  eligible: boolean;
  masteredUnitsCount: number;
  totalUnitsInLevel: number;
  unitMasteryPercent: number;
  unmasteredUnits: string[];
  disclaimer: string;
} {
  const unitsInLevel = getUnitsForLevel(targetLevel);
  const totalUnitsInLevel = unitsInLevel.length;

  if (totalUnitsInLevel === 0) {
    return {
      eligible: false,
      masteredUnitsCount: 0,
      totalUnitsInLevel: 0,
      unitMasteryPercent: 0,
      unmasteredUnits: [],
      disclaimer:
        'Lexi Internal Curriculum Milestone — Verifies completion and demonstrated mastery of Lexi’s CEFR-aligned syllabus. An internal learning milestone, not an accredited examination diploma (IELTS/TOEFL/Cambridge).',
    };
  }

  const unmasteredUnits: string[] = [];
  let masteredUnitsCount = 0;

  for (const unit of unitsInLevel) {
    const report = evaluateUnitMastery(unit.id, state, criteria);
    if (report.isUnitMastered) {
      masteredUnitsCount++;
    } else {
      unmasteredUnits.push(unit.title);
    }
  }

  const unitMasteryPercent = Math.round((masteredUnitsCount / totalUnitsInLevel) * 100);
  const eligible = unitMasteryPercent >= 75;

  return {
    eligible,
    masteredUnitsCount,
    totalUnitsInLevel,
    unitMasteryPercent,
    unmasteredUnits,
    disclaimer:
      'Lexi Internal Curriculum Milestone — Verifies completion and demonstrated mastery of Lexi’s CEFR-aligned syllabus. An internal learning milestone, not an accredited examination diploma (IELTS/TOEFL/Cambridge).',
  };
}
