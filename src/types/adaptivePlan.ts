import type { CEFRLevel, CurriculumLesson } from './curriculum';
import type { PracticeDifficulty, PracticeSessionLength } from './practicePreferences';
import type { PracticeCategoryKey } from '../components/practice/PracticeCategoryNav';

export type SkillDiagnosticStatus = 
  | 'strength' 
  | 'proficient' 
  | 'needs_reinforcement' 
  | 'insufficient_evidence';

export interface SkillPerformanceDiagnostic {
  category: PracticeCategoryKey;
  label: string;
  score: number | null;
  sessionCount: number;
  status: SkillDiagnosticStatus;
  trend: 'improving' | 'steady' | 'declining' | 'baseline';
  lastPracticedAt: string | null;
  insight: string;
}

export interface AdaptiveLearnerProfile {
  userId: string;
  calculatedAt: string;
  // CEFR & Preferences
  currentLevel: CEFRLevel;
  preferredDifficulty: PracticeDifficulty;
  sessionLength: PracticeSessionLength;
  dailyGoalMinutes: number;
  // Vocabulary & Spaced Repetition (FSRS)
  totalVocabCards: number;
  dueVocabCards: number;
  overdueVocabCards: number;
  retentionRate: number | null;
  // Curriculum Progression
  completedLessonsCount: number;
  totalLessonsInLevel: number;
  levelProgressPercent: number;
  nextLesson: CurriculumLesson | null;
  averageLessonScore: number | null;
  // Overall Practice & Performance
  totalSessionsCount: number;
  recentAverageScore: number | null;
  performanceTrend: 'improving' | 'steady' | 'declining' | 'baseline';
  // Scenario & Real-World Roleplay
  scenariosCompletedCount: number;
  scenarioAverageScore: number | null;
  // Diagnostics
  skills: Record<PracticeCategoryKey, SkillPerformanceDiagnostic>;
  strongestArea: { category: PracticeCategoryKey; label: string; score: number } | null;
  weakestArea: { category: PracticeCategoryKey; label: string; score: number } | null;
  hasSufficientEvidence: boolean;
  // Consistency
  currentStreak: number;
  longestStreak: number;
  todayMinutes: number;
  dailyGoalPercent: number;
  isReturningAfterBreak: boolean;
}

export type PlanItemType =
  | 'vocabulary_review'
  | 'curriculum_lesson'
  | 'weakness_reinforcement'
  | 'scenario_roleplay'
  | 'daily_challenge'
  | 'refresher_practice';

export interface PlanActionPayload {
  type: 'review' | 'lesson' | 'scenario' | 'studio' | 'challenge';
  targetId: string;
  category?: PracticeCategoryKey;
}

export interface DailyStudyPlanItem {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  type: PlanItemType;
  category: PracticeCategoryKey;
  estimatedMinutes: number;
  cefrLevel: CEFRLevel;
  reason: string;
  isPriority: boolean;
  isCompleted: boolean;
  completedAt?: string;
  action: PlanActionPayload;
}

export interface DailyStudyPlanRecord {
  id: string; // e.g. "plan-local-learner-1-2026-10-20"
  userId: string;
  date: string; // "YYYY-MM-DD"
  generatedAt: string;
  updatedAt: string;
  targetMinutes: number;
  estimatedTotalMinutes: number;
  completedMinutes: number;
  headlineSummary: string;
  primaryReason: string;
  adaptationNotice: string;
  items: DailyStudyPlanItem[];
}
