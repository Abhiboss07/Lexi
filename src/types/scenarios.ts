import type { CEFRLevel } from './curriculum';

export interface ScenarioChoice {
  id: string;
  text: string;
  isBest: boolean;
  tone: 'natural' | 'informal' | 'awkward';
  feedback: string;
  scoreDelta: number;
}

export interface ScenarioTurn {
  turnIndex: number;
  partnerSpeech: string;
  partnerNotes?: string;
  options: ScenarioChoice[];
}

export interface ScenarioKeyWord {
  word: string;
  definition: string;
  example: string;
  cefrLevel: CEFRLevel;
}

export interface ScenarioDefinition {
  id: string;
  title: string;
  subtitle: string;
  category: 'Daily Life' | 'Travel' | 'Career' | 'Fun';
  partnerName: string;
  partnerRole: string;
  partnerAvatar: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  description: string;
  sceneSetting: string;
  keyVocabulary: ScenarioKeyWord[];
  turns: ScenarioTurn[];
}

export interface ScenarioSessionResult {
  scenarioId: string;
  score: number;
  naturalnessRating: 'Native-like' | 'Natural & Clear' | 'Developing Fluency';
  feedbackSummary: string;
  savedWordsCount: number;
}
