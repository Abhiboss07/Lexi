/**
 * Quick Picks Complementary Features Data Models
 * - Word Quest (Mini Language Game)
 * - Quick Notes (Personal Learning Notebook)
 * - Sketch & Explain (Visual Learning Canvas)
 * - Daily Challenge (One Small Win)
 */

export type NoteCategory = 'vocabulary' | 'grammar' | 'pronunciation' | 'interview' | 'goals' | 'general';

export interface QuickNote {
  id: string;
  userId: string;
  title: string;
  body: string;
  exampleSentence?: string;
  newWords?: string;
  topic: 'general' | 'vocabulary' | 'grammar' | 'idiom' | 'pronunciation' | 'workplace';
  category?: NoteCategory;
  linkedVocabWord?: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedDrawing {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  explanation: string;
  dataUrl: string; // Base64 PNG data from canvas
  labels: string[];
  createdAt: string;
  updatedAt: string;
}

export type WordQuestMode = 'choice' | 'match' | 'find_error' | 'rapid_phrase';

export interface WordQuestQuestion {
  id: string;
  mode: WordQuestMode;
  prompt: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  pairs?: Array<{ word: string; meaning: string }>; // For match mode
  sentenceWithBlank?: string;
  highlightedSentence?: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2';
}

export interface WordQuestResult {
  id: string;
  userId: string;
  date: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
  mode: WordQuestMode;
  completedAt: string;
}

export interface DailyChallengePrompt {
  id: string;
  dayIndex: number; // 0 to 6 (Sun to Sat)
  title: string;
  scenario: string;
  instructions: string;
  starterPrompt: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2';
  minWords: number;
  targetKeywords: string[];
  guidanceTips: string[];
  exampleResponse: string;
}

export interface DailyChallengeSubmission {
  id: string; // challenge-${dateStr}
  userId: string;
  date: string; // YYYY-MM-DD
  challengeId: string;
  promptTitle: string;
  userResponse: string;
  status: 'completed' | 'in_progress';
  score: number;
  wordCount: number;
  feedback: {
    strengths: string[];
    improvements: string[];
    grammarNotes: string[];
    vocabularyUsed: string[];
  };
  submittedAt: string;
}

export interface ActivityCompletionRecord {
  id: string; // `${userId}-${activityId}-${date}`
  userId: string;
  activityId: string;
  date: string; // YYYY-MM-DD
  score?: number;
  completedAt: string;
}

export interface BookmarkedIdiomRecord {
  id: string; // `${userId}-${expression}`
  userId: string;
  expression: string;
  meaning: string;
  example: string;
  bookmarkedAt: string;
}
