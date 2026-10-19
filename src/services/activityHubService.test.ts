import { describe, it, expect } from 'vitest';
import {
  getPhraseBuilderItems,
  getGrammarGameQuestions,
  evaluateScenarioResponse,
  SCENARIO_CHALLENGES,
  getTodayIdiom,
  getDailyWordPuzzle,
  getListeningQuiz,
  getTodaySpeakingPrompt,
  getInterviewSprintQuestions,
} from './activityHubService';

describe('ActivityHubService Unit Tests', () => {
  it('retrieves Phrase Builder items with topic and difficulty filtering', () => {
    const everyday = getPhraseBuilderItems('everyday', 'easy');
    expect(everyday.length).toBeGreaterThan(0);
    expect(everyday[0].topic).toBe('everyday');
    expect(everyday[0].targetSentence).toBeDefined();
    expect(everyday[0].scrambledWords.length).toBeGreaterThan(0);
  });

  it('retrieves Mini Grammar Games questions according to difficulty', () => {
    const questions = getGrammarGameQuestions('A2', 'easy', 3);
    expect(questions.length).toBe(3);
    expect(questions[0].prompt).toBeDefined();
    expect(questions[0].options.length).toBeGreaterThanOrEqual(4);
    expect(questions[0].correctAnswer).toBeDefined();
  });

  it('evaluates Scenario Challenge transparently against rubric criteria', () => {
    const prompt = SCENARIO_CHALLENGES[0];
    const userText = 'Hello, could I please get a medium iced latte with oat milk instead of dairy, and with half the usual syrup? Thank you!';
    const result = evaluateScenarioResponse(userText, prompt);

    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.wordCount).toBeGreaterThanOrEqual(12);
    expect(result.matchedKeywords.length).toBeGreaterThanOrEqual(2);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.criteriaBreakdown.length).toBe(4);
  });

  it('provides a stable rotating Idiom of the Day for a given date', () => {
    const d1 = new Date('2026-10-19T10:00:00Z');
    const idiom1 = getTodayIdiom(d1);
    const idiom2 = getTodayIdiom(d1);
    expect(idiom1.id).toBe(idiom2.id);
    expect(idiom1.expression).toBeDefined();
    expect(idiom1.practiceQuestion.options.length).toBe(4);
  });

  it('generates a stable Daily Word Puzzle with masked letters and letter bank', () => {
    const d1 = new Date('2026-10-19T10:00:00Z');
    const puzzle = getDailyWordPuzzle(d1);
    expect(puzzle.targetWord).toBeDefined();
    expect(puzzle.maskedPattern).toContain('_');
    expect(puzzle.letterBank.length).toBeGreaterThan(0);
  });

  it('retrieves Listening dialogue, questions, and audio transcript', () => {
    const quiz = getListeningQuiz('medium');
    expect(quiz.title).toBeDefined();
    expect(quiz.audioText).toBeDefined();
    expect(quiz.questions.length).toBeGreaterThanOrEqual(2);
  });

  it('retrieves Speaking prompt with guiding questions and suggested phrases', () => {
    const prompt = getTodaySpeakingPrompt(new Date('2026-10-19'));
    expect(prompt.title).toBeDefined();
    expect(prompt.guidingQuestions.length).toBeGreaterThan(0);
    expect(prompt.suggestedPhrases.length).toBeGreaterThan(0);
  });

  it('retrieves Interview Sprint question with STAR framework tips', () => {
    const sprint = getInterviewSprintQuestions('Product Manager', 'hard');
    expect(sprint.length).toBeGreaterThan(0);
    expect(sprint[0].starFrameworkTip.situation).toBeDefined();
    expect(sprint[0].starFrameworkTip.action).toBeDefined();
  });
});
