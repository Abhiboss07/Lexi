/**
 * Lexi CEFR Curriculum Architecture Data Models
 * Defines proficiency levels, units, lessons, learning objectives,
 * multi-modal activity schemas, prerequisites, and learner progression.
 */

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type SkillFocus = 
  | 'conversation' 
  | 'vocabulary' 
  | 'grammar' 
  | 'listening' 
  | 'reading' 
  | 'writing' 
  | 'pronunciation';

export interface CEFRLevelMeta {
  code: CEFRLevel;
  name: string;
  badgeTitle: string;
  descriptor: string;
  communicativeScope: string;
  listeningSpeakingGoals: string[];
  readingWritingGoals: string[];
  vocabularyThemes: string[];
  grammarConcepts: string[];
  prerequisites: CEFRLevel[];
  status: 'available' | 'planned';
}

export interface LearningObjective {
  id: string;
  description: string;
  skill: SkillFocus;
}

export interface CurriculumVocabularyRef {
  word: string;
  phoneticIpa: string;
  partOfSpeech: string;
  definition: string;
  exampleSentence: string;
}

export interface CurriculumGrammarRef {
  topic: string;
  ruleSummary: string;
  exampleSentences: string[];
}

export interface LessonCompletionCriteria {
  minScorePercent: number;
  requireAllActivities: boolean;
}

/**
 * Multi-Modal Activity Types (Discriminated Union)
 */
export type ActivityKind = 
  | 'multiple-choice'
  | 'dialogue'
  | 'fill-blank'
  | 'sentence-order'
  | 'listening'
  | 'pronunciation-prompt'
  | 'matching'
  | 'writing-prompt';

export interface BaseActivity {
  id: string;
  kind: ActivityKind;
  prompt?: string;
  instructions?: string;
  hint?: string;
}

export interface MultipleChoiceActivity extends BaseActivity {
  kind: 'multiple-choice';
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  audioPrompt?: string;
}

export interface DialogueTurn {
  speaker: string;
  text: string;
  translation?: string;
  audioSpeed?: number;
}

export interface DialogueActivity extends BaseActivity {
  kind: 'dialogue';
  scenarioContext: string;
  turns: DialogueTurn[];
  comprehensionQuestion?: {
    question: string;
    options: string[];
    correctIndex: number;
  };
}

export interface FillBlankActivity extends BaseActivity {
  kind: 'fill-blank';
  sentenceWithBlank: string;
  options: string[];
  correctOption: string;
  targetGrammarPoint?: string;
}

export interface SentenceOrderActivity extends BaseActivity {
  kind: 'sentence-order';
  scrambledWords: string[];
  correctSentence: string;
}

export interface ListeningActivity extends BaseActivity {
  kind: 'listening';
  audioTranscript: string;
  question: string;
  options: string[];
  correctIndex: number;
  playbackSpeed: number;
}

export interface PronunciationPromptActivity extends BaseActivity {
  kind: 'pronunciation-prompt';
  targetPhrase: string;
  phoneticIpa: string;
  focusPhonemes?: string[];
  audioReferenceUrl?: string;
}

export interface MatchingPair {
  left: string;
  right: string;
}

export interface MatchingActivity extends BaseActivity {
  kind: 'matching';
  pairs: MatchingPair[];
}

export interface WritingPromptActivity extends BaseActivity {
  kind: 'writing-prompt';
  context: string;
  sampleResponse: string;
  keywordsToInclude: string[];
  minWords: number;
}

export type LessonActivity =
  | MultipleChoiceActivity
  | DialogueActivity
  | FillBlankActivity
  | SentenceOrderActivity
  | ListeningActivity
  | PronunciationPromptActivity
  | MatchingActivity
  | WritingPromptActivity;

/**
 * Structured Curriculum Hierarchy
 */
export interface CurriculumLesson {
  id: string;
  unitId: string;
  level: CEFRLevel;
  order: number;
  title: string;
  subtitle: string;
  description: string;
  estimatedMinutes: number;
  primarySkill: SkillFocus;
  secondarySkills: SkillFocus[];
  objectives: LearningObjective[];
  prerequisites: string[]; // List of lesson IDs required before unlocking
  activities: LessonActivity[];
  vocabulary?: CurriculumVocabularyRef[];
  grammar?: CurriculumGrammarRef[];
  completionCriteria: LessonCompletionCriteria;
  status: 'active' | 'planned';
}

export interface CurriculumUnit {
  id: string;
  level: CEFRLevel;
  unitNumber: number;
  title: string;
  subtitle: string;
  description: string;
  theme: string;
  prerequisites: string[]; // Unit IDs or Lesson IDs required
  lessonIds: string[];
  status: 'active' | 'planned';
}

export interface Curriculum {
  levels: Record<CEFRLevel, CEFRLevelMeta>;
  units: Record<string, CurriculumUnit>;
  lessons: Record<string, CurriculumLesson>;
}

/**
 * Learner Placement & Progression State
 */
export type PlacementMethod = 
  | 'self-selected'
  | 'onboarding-preference'
  | 'placement-test-preview';

export interface LearnerPlacement {
  startingLevel: CEFRLevel;
  method: PlacementMethod;
  placedAt: string;
  isCertified: false; // Explicit disclaimer: self-selected / uncertified
}

export interface LessonProgressRecord {
  lessonId: string;
  status: 'locked' | 'available' | 'in-progress' | 'completed';
  scorePercent: number;
  completedAt?: string;
  attempts: number;
  lastActivityIndex: number;
}

export interface UnitProgressSummary {
  unitId: string;
  unitNumber: number;
  title: string;
  completedLessonCount: number;
  totalLessonCount: number;
  percentComplete: number;
  isCompleted: boolean;
}

export interface CurriculumProgressionState {
  userId: string;
  currentLevel: CEFRLevel;
  placement: LearnerPlacement;
  completedLessonIds: string[];
  lessonRecords: Record<string, LessonProgressRecord>;
  lastStudiedLessonId?: string;
  updatedAt: string;
}

export interface CurriculumValidationReport {
  isValid: boolean;
  duplicateUnitIds: string[];
  duplicateLessonIds: string[];
  orphanedLessons: string[]; // Lessons referencing non-existent units
  missingPrerequisites: { lessonId: string; missingPrereqId: string }[];
  circularPrerequisites: string[][]; // Cycles detected in lesson dependency graph
  invalidLevelReferences: string[];
  emptyUnits: string[];
}
