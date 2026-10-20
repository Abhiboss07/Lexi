import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateLearnerTurn } from './conversationFeedbackService';
import { 
  conversationCoachAIService, 
  generateLocalPartnerReply,
  type ConversationTurnContext,
} from './aiProviderService';
import { 
  MistakeTrackingService, 
  InMemoryMistakeStorage 
} from './mistakeTrackingService';
import { CONVERSATION_SCENARIOS_DATA } from '../data/conversationScenariosData';
import { 
  AdaptiveLearningService, 
  InMemoryAdaptiveStorage 
} from './adaptiveLearningService';
import { InMemoryPracticeRepository } from '../db/practiceRepository';
import { InMemoryCurriculumRepository } from '../db/curriculumRepository';
import { InMemoryVocabularyRepository } from '../db/vocabularyRepository';
import { InMemoryQuickPicksRepository } from '../db/quickPicksRepository';

describe('AI Conversation Coach & Personalized Linguistic Feedback', () => {
  describe('evaluateLearnerTurn (Linguistic Analysis)', () => {
    it('corrects preposition mistakes such as "in night" to "at night"', () => {
      const feedback = evaluateLearnerTurn('I like to study in night after dinner.');
      expect(feedback.isAccurate).toBe(false);
      expect(feedback.correctedSentence).toContain('at night');
      expect(feedback.detectedIssues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'preposition',
            patternKey: 'preposition-in-night',
          }),
        ])
      );
      expect(feedback.grammarExplanation).toContain("'at night'");
    });

    it('corrects "arrive to" to "arrive at / in"', () => {
      const feedback = evaluateLearnerTurn('We arrived to the hotel very late.');
      expect(feedback.isAccurate).toBe(false);
      expect(feedback.correctedSentence).toContain('arrived at');
      expect(feedback.detectedIssues[0].category).toBe('preposition');
    });

    it('corrects double past tense after auxiliary did: "didn\'t went" -> "didn\'t go"', () => {
      const feedback = evaluateLearnerTurn("I didn't went to the office today.");
      expect(feedback.isAccurate).toBe(false);
      expect(feedback.correctedSentence).toContain("didn't go");
      expect(feedback.detectedIssues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: 'verb-tense',
            patternKey: 'tense-did-went',
          }),
        ])
      );
    });

    it('corrects "I am agree" to "I agree"', () => {
      const feedback = evaluateLearnerTurn('I am agree with your perspective on remote work.');
      expect(feedback.isAccurate).toBe(false);
      expect(feedback.correctedSentence).toContain('I agree');
      expect(feedback.grammarExplanation).toContain("'Agree' is already a verb");
    });

    it('corrects collocation "make a question" to "ask a question"', () => {
      const feedback = evaluateLearnerTurn('Could I make a question about the menu?');
      expect(feedback.isAccurate).toBe(false);
      expect(feedback.correctedSentence).toContain('ask a question');
      expect(feedback.collocationSuggestion).toContain('ask a question');
    });

    it('provides formality guidance for blunt customer service orders', () => {
      const feedback = evaluateLearnerTurn('Give me an iced latte and a pastry.');
      expect(feedback.isAccurate).toBe(false);
      expect(feedback.correctedSentence).toContain('Could I please have');
      expect(feedback.formalityGuidance).toContain('Politeness booster');
    });

    it('does NOT overcorrect valid informal phrasing or dialect variations (e.g. "oat milk latte to go, please")', () => {
      const feedback = evaluateLearnerTurn('Could I please get an oat milk latte to go?');
      expect(feedback.isAccurate).toBe(true);
      expect(feedback.correctedSentence).toBeNull();
      expect(feedback.score).toBeGreaterThanOrEqual(95);
      expect(feedback.praise).toContain('polite');
    });

    it('praises nuanced conversational opinion discourse markers', () => {
      const feedback = evaluateLearnerTurn('From my perspective, hybrid schedules offer the best flexibility.');
      expect(feedback.isAccurate).toBe(true);
      expect(feedback.praise).toContain('discourse marker');
      expect(feedback.score).toBe(98);
    });
  });

  describe('Local Conversational Partner Generator & AI Abstraction', () => {
    const cafeScenario = CONVERSATION_SCENARIOS_DATA.find((s) => s.id === 'cafe')!;

    it('generates context-aware reply for turn 0 acknowledging the specific drink ordered', () => {
      const context: ConversationTurnContext = {
        scenario: cafeScenario,
        turnIndex: 0,
        userMessage: 'Could I please get an iced oat milk latte?',
        chatHistory: [{ sender: 'ai', text: cafeScenario.starter }],
      };
      const reply = generateLocalPartnerReply(context);
      expect(reply).toContain('iced oat milk latte');
      expect(reply).toContain('regular or large');
    });

    it('generates context-aware reply for turn 1 acknowledging size and offering pastries', () => {
      const context: ConversationTurnContext = {
        scenario: cafeScenario,
        turnIndex: 1,
        userMessage: "Regular and iced, please. What pastries do you have fresh today?",
        chatHistory: [
          { sender: 'ai', text: cafeScenario.starter },
          { sender: 'user', text: 'Iced oat milk latte please' },
        ],
      };
      const reply = generateLocalPartnerReply(context);
      expect(reply).toMatch(/croissant|scone|pastry/i);
      expect(reply).toContain('£');
    });

    it('falls back seamlessly to local engine when offline or no API key is provided', async () => {
      const context: ConversationTurnContext = {
        scenario: cafeScenario,
        turnIndex: 0,
        userMessage: 'Hello, I would like a cappuccino to go.',
        chatHistory: [{ sender: 'ai', text: cafeScenario.starter }],
      };

      const result = await conversationCoachAIService.processTurn(context);
      expect(result.providerType).toBe('local-engine');
      expect(result.statusNote).toContain('Local Linguistic Engine');
      expect(result.partnerReply).toContain('cappuccino');
      expect(result.feedback.isAccurate).toBe(true);
    });
  });

  describe('MistakeTrackingService (Evidence-Based Tracking)', () => {
    let storage: InMemoryMistakeStorage;
    let service: MistakeTrackingService;

    beforeEach(() => {
      storage = new InMemoryMistakeStorage();
      service = new MistakeTrackingService(storage);
    });

    it('does NOT diagnose persistent weakness from a single mistake occurrence', async () => {
      const feedback = evaluateLearnerTurn('I study in night.');
      const recorded = await service.recordTurnMistakes('user-1', 'cafe', feedback, 'rule-based');
      
      expect(recorded.length).toBe(1);
      expect(recorded[0].frequency).toBe(1);
      expect(recorded[0].isPersistent).toBe(false);

      const persistent = await service.getPersistentMistakes('user-1');
      expect(persistent.length).toBe(0);
    });

    it('flags mistake as persistent once it reaches 2 occurrences', async () => {
      const feedback1 = evaluateLearnerTurn('I study in night.');
      await service.recordTurnMistakes('user-1', 'cafe', feedback1, 'rule-based');

      const feedback2 = evaluateLearnerTurn('He arrived in night at the station.');
      const updated = await service.recordTurnMistakes('user-1', 'travel', feedback2, 'rule-based');

      expect(updated[0].frequency).toBe(2);
      expect(updated[0].isPersistent).toBe(true);

      const persistent = await service.getPersistentMistakes('user-1');
      expect(persistent.length).toBe(1);
      expect(persistent[0].patternKey).toBe('preposition-in-night');
      expect(persistent[0].occurrences.length).toBe(2);
    });

    it('resolves mistake record when learner resolves it in practice', async () => {
      const feedback = evaluateLearnerTurn('I study in night.');
      await service.recordTurnMistakes('user-1', 'cafe', feedback);
      await service.recordTurnMistakes('user-1', 'hotel', feedback);

      expect((await service.getPersistentMistakes('user-1')).length).toBe(1);

      await service.resolveMistake('user-1', 'preposition-in-night');
      expect((await service.getAllMistakes('user-1')).length).toBe(0);
    });
  });

  describe('Integration with Today\'s Adaptive Study Plan', () => {
    let adaptiveStorage: InMemoryAdaptiveStorage;
    let practiceRepo: InMemoryPracticeRepository;
    let curriculumRepo: InMemoryCurriculumRepository;
    let vocabRepo: InMemoryVocabularyRepository;
    let quickPicksRepo: InMemoryQuickPicksRepository;
    let adaptiveService: AdaptiveLearningService;

    beforeEach(() => {
      adaptiveStorage = new InMemoryAdaptiveStorage();
      practiceRepo = new InMemoryPracticeRepository();
      curriculumRepo = new InMemoryCurriculumRepository();
      vocabRepo = new InMemoryVocabularyRepository();
      quickPicksRepo = new InMemoryQuickPicksRepository();

      adaptiveService = new AdaptiveLearningService(
        practiceRepo,
        curriculumRepo,
        vocabRepo,
        quickPicksRepo,
        adaptiveStorage
      );
    });

    it('generates an adaptive study plan with conversational roleplay and vocabulary prioritization', async () => {
      const plan = await adaptiveService.getDailyStudyPlan('user-test-1');
      expect(plan).toBeDefined();
      expect(plan.items.length).toBeGreaterThanOrEqual(1);
      expect(plan.estimatedTotalMinutes).toBeGreaterThan(0);
    });
  });
});
