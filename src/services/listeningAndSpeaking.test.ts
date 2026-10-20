import { describe, it, expect, beforeEach } from 'vitest';
import { LISTENING_SCENARIOS } from '../data/listeningData';
import { SPEAKING_PROMPTS } from '../data/speakingData';
import { evaluateSpokenResponse } from './speakingEvaluationService';
import {
  AdaptiveLearningService,
  InMemoryAdaptiveStorage,
} from './adaptiveLearningService';
import { InMemoryPracticeRepository } from '../db/practiceRepository';
import { InMemoryCurriculumRepository } from '../db/curriculumRepository';
import { InMemoryVocabularyRepository } from '../db/vocabularyRepository';
import { InMemoryQuickPicksRepository } from '../db/quickPicksRepository';
import { getLocalDateString } from './dailyPracticeService';

describe('Listening and Speaking Intelligence System', () => {
  const TEST_USER = 'test-speech-learner';

  let practiceRepo: InMemoryPracticeRepository;
  let curriculumRepo: InMemoryCurriculumRepository;
  let vocabRepo: InMemoryVocabularyRepository;
  let quickPicksRepo: InMemoryQuickPicksRepository;
  let storage: InMemoryAdaptiveStorage;
  let adaptiveService: AdaptiveLearningService;

  beforeEach(async () => {
    practiceRepo = new InMemoryPracticeRepository();
    curriculumRepo = new InMemoryCurriculumRepository();
    vocabRepo = new InMemoryVocabularyRepository();
    quickPicksRepo = new InMemoryQuickPicksRepository();
    storage = new InMemoryAdaptiveStorage();

    adaptiveService = new AdaptiveLearningService(
      practiceRepo,
      curriculumRepo,
      vocabRepo,
      quickPicksRepo,
      storage
    );

    await storage.users.set(TEST_USER, {
      id: TEST_USER,
      name: 'Speech Learner',
      email: 'speech@lexi.local',
      currentStreak: 4,
      longestStreak: 7,
      lastActiveDate: getLocalDateString(),
      cefrLevel: 'A2',
      dailyGoalMinutes: 15,
      avatarUrl: '/assets/default-avatar.svg',
    });

    await practiceRepo.savePreferences(TEST_USER, {
      defaultDifficulty: 'medium',
      defaultSessionLength: 'standard',
      dailyGoalMinutes: 15,
      reminderFrequency: 'off',
      cefrLevel: 'A2',
      practiceDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      hintsEnabled: true,
      updatedAt: new Date().toISOString(),
    });
  });

  describe('Listening Scenarios Data Integrity', () => {
    it('contains valid CEFR tiered listening scenarios from A1 to B2', () => {
      expect(LISTENING_SCENARIOS.length).toBeGreaterThanOrEqual(4);

      const levels = LISTENING_SCENARIOS.map((s) => s.cefrLevel);
      expect(levels).toContain('A1');
      expect(levels).toContain('A2');
      expect(levels).toContain('B1');
      expect(levels).toContain('B2');
    });

    it('ensures every listening scenario has phrases, valid multiple choice, and explanation', () => {
      for (const scenario of LISTENING_SCENARIOS) {
        expect(scenario.id).toBeTruthy();
        expect(scenario.title).toBeTruthy();
        expect(scenario.dialogueText.length).toBeGreaterThan(20);
        expect(scenario.options.length).toBeGreaterThanOrEqual(3);
        expect(scenario.correctIndex).toBeGreaterThanOrEqual(0);
        expect(scenario.correctIndex).toBeLessThan(scenario.options.length);
        expect(scenario.explanation).toBeTruthy();
        expect(scenario.phrases.length).toBeGreaterThanOrEqual(2);
        expect(scenario.dictationSentence).toBeTruthy();
      }
    });

    it('ensures short answer questions have valid accepted answers and explanation', () => {
      const scenariosWithShortAnswer = LISTENING_SCENARIOS.filter((s) => s.shortAnswer);
      expect(scenariosWithShortAnswer.length).toBeGreaterThan(0);

      for (const s of scenariosWithShortAnswer) {
        expect(s.shortAnswer!.question).toBeTruthy();
        expect(s.shortAnswer!.acceptedAnswers.length).toBeGreaterThan(0);
        expect(s.shortAnswer!.explanation).toBeTruthy();
        expect(s.shortAnswer!.sampleAnswer).toBeTruthy();
      }
    });
  });

  describe('Speaking Prompts Data Integrity', () => {
    it('contains valid CEFR tiered speaking prompts from A1 to B2', () => {
      expect(SPEAKING_PROMPTS.length).toBeGreaterThanOrEqual(4);

      const levels = SPEAKING_PROMPTS.map((p) => p.cefrLevel);
      expect(levels).toContain('A1');
      expect(levels).toContain('A2');
      expect(levels).toContain('B1');
      expect(levels).toContain('B2');
    });

    it('ensures every speaking prompt has model response, key phrases, and tips', () => {
      for (const prompt of SPEAKING_PROMPTS) {
        expect(prompt.id).toBeTruthy();
        expect(prompt.prompt).toBeTruthy();
        expect(prompt.modelResponse.length).toBeGreaterThan(15);
        expect(prompt.targetKeyPhrases.length).toBeGreaterThanOrEqual(2);
        expect(prompt.pronunciationTips).toBeTruthy();
        expect(prompt.sampleHints.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Speaking Evaluation & Privacy Safeguards', () => {
    const prompt = SPEAKING_PROMPTS.find((p) => p.id === 'sp-order-coffee')!;

    it('does not claim phoneme accuracy and explains local analysis', () => {
      const evalResult = evaluateSpokenResponse('Could I please have an oat milk latte to go?', prompt);
      expect(evalResult.evaluationNote).toContain('locally');
      expect(evalResult.evaluationNote).not.toContain('phoneme');
    });

    it('rewards accurate target key phrases and appropriate sentence length', () => {
      const targetSpoken = 'Could I please have a medium oat milk latte to go? How much is that?';
      const evalResult = evaluateSpokenResponse(targetSpoken, prompt);

      expect(evalResult.overallScore).toBeGreaterThanOrEqual(90);
      expect(evalResult.isPassing).toBe(true);
      expect(evalResult.missingKeyPhrases).toEqual([]);
    });

    it('allows retry without penalty resetting attempts', () => {
      const firstAttempt = evaluateSpokenResponse('I want coffee.', prompt);
      expect(firstAttempt.isPassing).toBe(false);

      // Subsequent complete attempt
      const retriedAttempt = evaluateSpokenResponse(
        'Could I please have an oat milk latte to go?',
        prompt
      );
      expect(retriedAttempt.overallScore).toBeGreaterThan(70);
      expect(retriedAttempt.isPassing).toBe(true);
    });

    it('evaluates typed alternative identically to recognized speech', () => {
      const text = 'Could I please have a medium oat milk latte to go?';
      const spokenRes = evaluateSpokenResponse(text, prompt);
      const typedRes = evaluateSpokenResponse(text, prompt);

      expect(spokenRes.overallScore).toBe(typedRes.overallScore);
      expect(spokenRes.matchedKeyPhrases).toEqual(typedRes.matchedKeyPhrases);
      expect(spokenRes.wordOrderScore).toEqual(typedRes.wordOrderScore);
    });
  });

  describe('Session Persistence & Adaptive Profile Integration', () => {
    it('persists a completed listening session in repository', async () => {
      const session = await practiceRepo.recordSession({
        userId: TEST_USER,
        category: 'listening',
        activityId: 'daily-listening-2026-10-20',
        difficulty: 'medium',
        sessionLength: 'standard',
        durationMinutes: 10,
        score: 92,
        notes: 'Listening Studio: Train Platform. Accuracy: 92%.',
      });

      expect(session.id).toBeTruthy();
      const sessions = await practiceRepo.getSessions(TEST_USER);
      expect(sessions.some((s) => s.category === 'listening')).toBe(true);
    });

    it('persists a completed speaking session in repository', async () => {
      const session = await practiceRepo.recordSession({
        userId: TEST_USER,
        category: 'speaking',
        activityId: 'daily-speaking-2026-10-20',
        difficulty: 'medium',
        sessionLength: 'standard',
        durationMinutes: 10,
        score: 88,
        notes: 'Speaking Studio: Ordering a Warm Drink. Score: 88%.',
      });

      expect(session.id).toBeTruthy();
      const sessions = await practiceRepo.getSessions(TEST_USER);
      expect(sessions.some((s) => s.category === 'speaking')).toBe(true);
    });

    it('does not diagnose listening or speaking weakness based on a single session', async () => {
      // 1 low session in listening
      await practiceRepo.recordSession({
        userId: TEST_USER,
        category: 'listening',
        difficulty: 'medium',
        sessionLength: 'standard',
        durationMinutes: 10,
        score: 55,
      });

      const profile = await adaptiveService.buildAdaptiveProfile(TEST_USER);
      expect(profile.skills.listening.status).toBe('insufficient_evidence');
      expect(profile.weakestArea).toBeNull();
    });

    it('diagnoses listening weakness when >= 2 low sessions exist and adapts daily plan', async () => {
      // 2 low sessions in listening
      await practiceRepo.recordSession({
        userId: TEST_USER,
        category: 'listening',
        difficulty: 'medium',
        sessionLength: 'standard',
        durationMinutes: 10,
        score: 55,
      });
      await practiceRepo.recordSession({
        userId: TEST_USER,
        category: 'listening',
        difficulty: 'medium',
        sessionLength: 'standard',
        durationMinutes: 10,
        score: 60,
      });

      const profile = await adaptiveService.buildAdaptiveProfile(TEST_USER);
      expect(profile.skills.listening.status).toBe('needs_reinforcement');
      expect(profile.weakestArea?.category).toBe('listening');

      // Check daily study plan response
      const plan = await adaptiveService.getDailyStudyPlan(TEST_USER);
      const targetedItem = plan.items.find(
        (it) => it.type === 'weakness_reinforcement' && it.category === 'listening'
      );
      expect(targetedItem).toBeDefined();
      expect(targetedItem?.action.category).toBe('listening');
    });

    it('diagnoses speaking weakness when >= 2 low sessions exist and targets speaking drill', async () => {
      // 2 low sessions in speaking
      await practiceRepo.recordSession({
        userId: TEST_USER,
        category: 'speaking',
        activityId: 'daily-speaking-1',
        difficulty: 'medium',
        sessionLength: 'standard',
        durationMinutes: 10,
        score: 58,
        notes: 'Speaking & Pronunciation practice',
      });
      await practiceRepo.recordSession({
        userId: TEST_USER,
        category: 'speaking',
        activityId: 'daily-speaking-2',
        difficulty: 'medium',
        sessionLength: 'standard',
        durationMinutes: 10,
        score: 62,
        notes: 'Speaking & Pronunciation practice',
      });

      const profile = await adaptiveService.buildAdaptiveProfile(TEST_USER);
      expect(profile.skills.speaking.status).toBe('needs_reinforcement');
      expect(profile.weakestArea?.category).toBe('speaking');

      const plan = await adaptiveService.getDailyStudyPlan(TEST_USER);
      const speakingDrill = plan.items.find(
        (it) => it.type === 'weakness_reinforcement' && it.category === 'speaking'
      );
      expect(speakingDrill).toBeDefined();
    });
  });
});
