import type { CEFRLevel } from './curriculum';
import type { PracticeCategoryKey } from '../components/practice/PracticeCategoryNav';

export type AssessmentType =
  | 'cefr-placement'
  | 'skill-grammar'
  | 'skill-vocabulary'
  | 'skill-reading'
  | 'skill-listening';

export type AssessmentSkill = 'grammar' | 'vocabulary' | 'reading' | 'listening' | 'speaking';

export interface AssessmentQuestion {
  id: string;
  skill: AssessmentSkill;
  cefrLevel: CEFRLevel;
  stage: 1 | 2; // Stage 1 = Core Calibration, Stage 2 = Adaptive Branching
  prompt: string;
  contextPassage?: string; // For reading comprehension
  audioScript?: string; // For listening comprehension
  options: string[];
  correctIndex: number;
  explanation: string;
  focusArea: string; // e.g., 'Present Simple vs Continuous', 'Time Prepositions', 'Collocations'
}

export interface LearnerQuestionResponse {
  questionId: string;
  skill: AssessmentSkill;
  cefrLevel: CEFRLevel;
  selectedIndex: number;
  isCorrect: boolean;
  timeSpentMs?: number;
  answeredAt: string;
}

export interface SkillScoreSummary {
  skill: AssessmentSkill;
  label: string;
  totalQuestions: number;
  correctCount: number;
  accuracyPercent: number;
  estimatedLevel: CEFRLevel;
  strengthDescription: string;
  growthArea: string;
  recommendedStudio: PracticeCategoryKey;
}

export interface AssessmentResult {
  id: string;
  userId: string;
  type: AssessmentType;
  startedAt: string;
  completedAt: string;
  totalQuestions: number;
  totalCorrect: number;
  overallScorePercent: number;
  estimatedCEFRLevel: CEFRLevel;
  confidenceScore: number; // 0-100%
  stageReached: 1 | 2;
  skillBreakdown: Record<AssessmentSkill, SkillScoreSummary>;
  responses: LearnerQuestionResponse[];
  recommendedStartingLevel: CEFRLevel;
  recommendedLessonId: string;
  recommendedLessonTitle: string;
  rationale: string;
  isCertified: false; // Explicit disclaimer: uncertified informal placement
  disclaimer: string;
}

export interface ActiveAssessmentDraft {
  id: string;
  userId: string;
  type: AssessmentType;
  startedAt: string;
  stage: 1 | 2;
  questionIds: string[];
  currentIndex: number;
  responses: Record<string, LearnerQuestionResponse>;
  completed: boolean;
}

export type MasteryStatus = 'not_started' | 'in_progress' | 'proficient' | 'mastered';

export interface LessonMasteryRecord {
  lessonId: string;
  status: MasteryStatus;
  attemptsCount: number;
  bestScorePercent: number;
  recentScorePercent: number;
  demonstratedConsistency: boolean; // At least 2 attempts >= 80% or 1 verified checkpoint >= 90%
  revisionRecommended: boolean;
  recommendedRevisionTopic?: string;
  lastAssessedAt: string;
}

export interface UnitMasteryReport {
  unitId: string;
  title: string;
  level: CEFRLevel;
  totalLessons: number;
  masteredLessonsCount: number;
  unitMasteryPercent: number;
  isUnitMastered: boolean;
  lessons: Record<string, LessonMasteryRecord>;
}
