import { SCENARIO_DEFINITIONS } from '../data/scenariosData';
import type {
  ScenarioDefinition,
  ScenarioTurn,
  ScenarioChoice,
  ScenarioKeyWord,
  ScenarioSessionResult,
} from '../types/scenarios';
import type { PracticeDifficulty, PracticeSessionLength } from '../types/practicePreferences';
import { vocabularyRepository } from '../db/vocabularyRepository';
import { practiceRepository } from '../db/practiceRepository';

export class ScenarioSimulationService {
  /**
   * Returns all available scenario simulations.
   */
  getAllScenarios(): ScenarioDefinition[] {
    return Object.values(SCENARIO_DEFINITIONS);
  }

  /**
   * Retrieves a scenario by its unique identifier.
   */
  getScenarioById(id: string): ScenarioDefinition | undefined {
    return SCENARIO_DEFINITIONS[id];
  }

  /**
   * Finds the selected choice for a given turn.
   */
  evaluateTurnChoice(turn: ScenarioTurn, choiceId: string): ScenarioChoice | undefined {
    return turn.options.find((opt) => opt.id === choiceId);
  }

  /**
   * Computes qualitative rating and friendly feedback summary from the total score.
   */
  calculateSessionRating(score: number): {
    rating: 'Native-like' | 'Natural & Clear' | 'Developing Fluency';
    summary: string;
  } {
    if (score >= 90) {
      return {
        rating: 'Native-like',
        summary: 'Exceptional communication! Your responses showed natural phrasing, polite tone, and native-level situational awareness.',
      };
    }
    if (score >= 70) {
      return {
        rating: 'Natural & Clear',
        summary: 'Great conversational flow! You handled the situation smoothly and were easily understood with only minor phrasing polish needed.',
      };
    }
    return {
      rating: 'Developing Fluency',
      summary: 'Good effort! You conveyed your meaning, though some expressions sounded slightly abrupt or awkward for this context. Keep practicing!',
    };
  }

  /**
   * Saves completed scenario session to practice history and optionally saves key vocabulary
   * items into the user's FSRS spaced-repetition memory deck.
   */
  async saveScenarioSession({
    userId,
    scenarioId,
    score,
    wordsToSave = [],
    difficulty = 'medium',
    sessionLength = 'standard',
    durationMinutes = 6,
  }: {
    userId: string;
    scenarioId: string;
    score: number;
    wordsToSave?: ScenarioKeyWord[];
    difficulty?: PracticeDifficulty;
    sessionLength?: PracticeSessionLength;
    durationMinutes?: number;
  }): Promise<ScenarioSessionResult> {
    const scenario = this.getScenarioById(scenarioId);
    const { rating, summary } = this.calculateSessionRating(score);

    let savedCount = 0;
    if (wordsToSave.length > 0 && scenario) {
      const savedCards = await vocabularyRepository.addVocabularyFromLesson(
        userId,
        `scenario-${scenarioId}`,
        wordsToSave.map((w) => ({
          word: w.word,
          definition: w.definition,
          exampleSentence: w.example,
        })),
        scenario.title,
        wordsToSave[0]?.cefrLevel || 'A2'
      );
      savedCount = savedCards.length;
    }

    try {
      await practiceRepository.recordSession({
        userId,
        category: 'Scenario Simulation',
        activityId: scenarioId,
        difficulty,
        sessionLength,
        durationMinutes,
        score,
        notes: `Completed "${scenario?.title || scenarioId}" scenario simulation with ${rating} (${score}%).`,
      });
    } catch {
      // In offline or non-IndexedDB environments, gracefully continue
    }

    return {
      scenarioId,
      score,
      naturalnessRating: rating,
      feedbackSummary: summary,
      savedWordsCount: savedCount,
    };
  }
}

export const scenarioSimulationService = new ScenarioSimulationService();
