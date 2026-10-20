export type MistakeCategory = 
  | 'verb-tense'
  | 'preposition'
  | 'article'
  | 'word-order'
  | 'collocation'
  | 'formality'
  | 'subject-verb-agreement';

export interface MistakeOccurrence {
  id: string;
  originalSentence: string;
  correctedSentence: string;
  explanation: string;
  scenarioId: string;
  occurredAt: string; // ISO date
  source: 'rule-based' | 'ai';
}

export interface LearnerMistakeRecord {
  id: string; // e.g. `${userId}_${patternKey}`
  userId: string;
  category: MistakeCategory;
  patternKey: string; // e.g. 'preposition-in-night', 'tense-did-went'
  title: string; // Friendly title, e.g. 'Preposition with Times of Day'
  description: string;
  frequency: number; // Count of occurrences
  occurrences: MistakeOccurrence[];
  lastOccurredAt: string;
  isPersistent: boolean; // true if frequency >= 2
  recommendedPracticeStudio: 'grammar' | 'conversation';
}

export interface TurnFeedback {
  originalSentence: string;
  correctedSentence: string | null; // null if already correct
  naturalAlternative: string;
  grammarExplanation?: string;
  collocationSuggestion?: string;
  formalityGuidance?: string;
  applicationExample: string;
  detectedIssues: Array<{
    category: MistakeCategory;
    patternKey: string;
    issue: string;
    correction: string;
  }>;
  praise?: string; // Highlighting what worked well
  overallPraise?: string;
  isAccurate: boolean;
  score: number; // 0-100 turn score
}

export interface ProgressiveHint {
  level1: string; // Strategy / direction
  level2: string; // Sentence starter / keyword
  level3: string; // Complete model response
}

export interface ConversationTurnStep {
  stepIndex: number;
  expectedGoal: string;
  partnerPrompt: string;
  hint: ProgressiveHint;
  suggestedExpressions: string[];
}

export interface ConversationScenarioDefinition {
  id: string;
  category: 'everyday' | 'travel' | 'hospitality' | 'workplace' | 'opinion';
  categoryLabel: string;
  title: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2';
  levelBadge: string;
  partner: string;
  partnerRole: string;
  partnerBio: string;
  avatarIcon: string;
  starter: string;
  audioAccent: 'en-US' | 'en-GB';
  speechRate: number;
  prompts: string[]; // For backwards-compatibility with quick prompt buttons
  contextDescription: string;
  steps: ConversationTurnStep[];
  vocabularyToLearn: Array<{
    word: string;
    pos: string;
    definition: string;
    example: string;
  }>;
}

export interface ConversationSessionResult {
  scenarioId: string;
  scenarioTitle: string;
  partnerName: string;
  turnsCompleted: number;
  overallScore: number;
  accuracyScore: number;
  fluencyScore: number;
  vocabularyScore: number;
  mistakesRecorded: number;
  newWordsSaved: string[];
  keyStrengths: string[];
  recommendedFollowUp: string;
}
