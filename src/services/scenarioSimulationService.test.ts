import { describe, it, expect, beforeEach, vi } from 'vitest';
import { scenarioSimulationService } from './scenarioSimulationService';
import { SCENARIO_DEFINITIONS } from '../data/scenariosData';
import { vocabularyRepository } from '../db/vocabularyRepository';
import { practiceRepository } from '../db/practiceRepository';

vi.mock('../db/vocabularyRepository', () => ({
  vocabularyRepository: {
    addVocabularyFromLesson: vi.fn().mockResolvedValue([
      { id: 'card-1', word: 'cappuccino' },
      { id: 'card-2', word: 'dairy-free' },
    ]),
  },
}));

vi.mock('../db/practiceRepository', () => ({
  practiceRepository: {
    recordSession: vi.fn().mockResolvedValue({
      id: 'session-123',
      userId: 'test-user',
      category: 'Scenario Simulation',
      completedAt: new Date().toISOString(),
    }),
  },
}));

describe('ScenarioSimulationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retrieves all 7 scenarios', () => {
    const scenarios = scenarioSimulationService.getAllScenarios();
    expect(scenarios.length).toBe(7);
    expect(scenarios.map((s) => s.id)).toContain('cafe-conversation');
    expect(scenarios.map((s) => s.id)).toContain('at-the-airport');
    expect(scenarios.map((s) => s.id)).toContain('job-interview');
  });

  it('retrieves a specific scenario by id', () => {
    const cafe = scenarioSimulationService.getScenarioById('cafe-conversation');
    expect(cafe).toBeDefined();
    expect(cafe?.title).toBe('Café Conversation');
    expect(cafe?.turns.length).toBeGreaterThanOrEqual(3);
  });

  it('returns undefined for non-existent scenario', () => {
    const nonExistent = scenarioSimulationService.getScenarioById('space-station');
    expect(nonExistent).toBeUndefined();
  });

  it('evaluates turn choices accurately', () => {
    const cafe = SCENARIO_DEFINITIONS['cafe-conversation'];
    const turn = cafe.turns[0];
    const bestChoice = scenarioSimulationService.evaluateTurnChoice(turn, 'cafe-t0-opt1');
    expect(bestChoice).toBeDefined();
    expect(bestChoice?.isBest).toBe(true);
    expect(bestChoice?.tone).toBe('natural');

    const awkwardChoice = scenarioSimulationService.evaluateTurnChoice(turn, 'cafe-t0-opt2');
    expect(awkwardChoice).toBeDefined();
    expect(awkwardChoice?.isBest).toBe(false);
    expect(awkwardChoice?.tone).toBe('awkward');
  });

  it('calculates ratings based on score tiers', () => {
    const high = scenarioSimulationService.calculateSessionRating(95);
    expect(high.rating).toBe('Native-like');

    const mid = scenarioSimulationService.calculateSessionRating(75);
    expect(mid.rating).toBe('Natural & Clear');

    const low = scenarioSimulationService.calculateSessionRating(55);
    expect(low.rating).toBe('Developing Fluency');
  });

  it('persists session and vocabulary cards into FSRS deck', async () => {
    const cafe = SCENARIO_DEFINITIONS['cafe-conversation'];
    const result = await scenarioSimulationService.saveScenarioSession({
      userId: 'user-456',
      scenarioId: 'cafe-conversation',
      score: 92,
      wordsToSave: cafe.keyVocabulary,
    });

    expect(result.scenarioId).toBe('cafe-conversation');
    expect(result.score).toBe(92);
    expect(result.naturalnessRating).toBe('Native-like');
    expect(result.savedWordsCount).toBe(2);

    expect(vocabularyRepository.addVocabularyFromLesson).toHaveBeenCalledWith(
      'user-456',
      'scenario-cafe-conversation',
      expect.any(Array),
      'Café Conversation',
      'A1'
    );

    expect(practiceRepository.recordSession).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-456',
        category: 'Scenario Simulation',
        activityId: 'cafe-conversation',
        score: 92,
      })
    );
  });
});
