import { describe, it, expect } from 'vitest';
import {
  validateActivityAnswer,
  calculateLessonScore,
  type ActivityEvaluation,
} from './lessonScoring';
import type {
  MultipleChoiceActivity,
  DialogueActivity,
  FillBlankActivity,
  SentenceOrderActivity,
  ListeningActivity,
  PronunciationPromptActivity,
  MatchingActivity,
  WritingPromptActivity,
} from '../types/curriculum';

describe('lessonScoring Service', () => {
  describe('validateActivityAnswer', () => {
    it('handles null or undefined answers gracefully', () => {
      const activity: MultipleChoiceActivity = {
        id: 'act-mc-1',
        kind: 'multiple-choice',
        prompt: 'Choose the correct greeting',
        options: ['Good morning', 'Good night', 'Goodbye'],
        correctIndex: 0,
      };

      const resultNull = validateActivityAnswer(activity, null);
      expect(resultNull.isCorrect).toBe(false);
      expect(resultNull.scorePercent).toBe(0);
      expect(resultNull.feedbackMessage).toContain('No answer was provided');

      const resultUndefined = validateActivityAnswer(activity, undefined);
      expect(resultUndefined.isCorrect).toBe(false);
      expect(resultUndefined.scorePercent).toBe(0);
    });

    it('evaluates multiple-choice correctly and incorrectly', () => {
      const activity: MultipleChoiceActivity = {
        id: 'act-mc-1',
        kind: 'multiple-choice',
        prompt: 'Select the best phrase',
        options: ['How are you?', 'Where are you?', 'Who are you?'],
        correctIndex: 0,
        explanation: 'Standard polite check-in.',
      };

      // Correct
      const evalCorrect = validateActivityAnswer(activity, 0);
      expect(evalCorrect.isCorrect).toBe(true);
      expect(evalCorrect.scorePercent).toBe(100);
      expect(evalCorrect.explanation).toBe('Standard polite check-in.');

      // String index representation
      const evalString = validateActivityAnswer(activity, '0');
      expect(evalString.isCorrect).toBe(true);

      // Incorrect
      const evalIncorrect = validateActivityAnswer(activity, 2);
      expect(evalIncorrect.isCorrect).toBe(false);
      expect(evalIncorrect.scorePercent).toBe(0);
      expect(evalIncorrect.correctAnswerDisplay).toBe('How are you?');
    });

    it('evaluates dialogue with and without comprehension question', () => {
      const dialogWithComp: DialogueActivity = {
        id: 'act-dlg-1',
        kind: 'dialogue',
        prompt: 'Listen to the café interaction',
        scenarioContext: 'At the counter',
        turns: [
          { speaker: 'Barista', text: 'What can I get for you?' },
          { speaker: 'You', text: 'A latte please.' },
        ],
        comprehensionQuestion: {
          question: 'What did the customer order?',
          options: ['Latte', 'Tea', 'Water'],
          correctIndex: 0,
        },
      };

      expect(validateActivityAnswer(dialogWithComp, 0).isCorrect).toBe(true);
      expect(validateActivityAnswer(dialogWithComp, 1).isCorrect).toBe(false);

      const dialogNoComp: DialogueActivity = {
        id: 'act-dlg-2',
        kind: 'dialogue',
        prompt: 'Listen to the greeting',
        scenarioContext: 'Hallway',
        turns: [{ speaker: 'Friend', text: 'Hi!' }],
      };

      expect(validateActivityAnswer(dialogNoComp, 'acknowledged').isCorrect).toBe(true);
    });

    it('evaluates fill-blank with case and whitespace trimming', () => {
      const activity: FillBlankActivity = {
        id: 'act-fb-1',
        kind: 'fill-blank',
        prompt: 'Fill in the blank with the appropriate container',
        sentenceWithBlank: 'I would like a ___ of coffee.',
        options: ['cup', 'glass', 'bowl'],
        correctOption: 'cup',
        targetGrammarPoint: 'Containers and food collocations',
      };

      expect(validateActivityAnswer(activity, 'cup').isCorrect).toBe(true);
      expect(validateActivityAnswer(activity, '  CUP  ').isCorrect).toBe(true);
      expect(validateActivityAnswer(activity, 'glass').isCorrect).toBe(false);
      expect(validateActivityAnswer(activity, 'glass').correctAnswerDisplay).toBe('cup');
    });

    it('evaluates sentence-order with spacing and punctuation normalization', () => {
      const activity: SentenceOrderActivity = {
        id: 'act-so-1',
        kind: 'sentence-order',
        prompt: 'Reorder the words to form a polite request',
        scrambledWords: ['please', 'I', 'a', 'latte', 'have', 'Could'],
        correctSentence: 'Could I have a latte please',
      };

      // Passed as array
      const fromArray = validateActivityAnswer(activity, ['Could', 'I', 'have', 'a', 'latte', 'please']);
      expect(fromArray.isCorrect).toBe(true);
      expect(fromArray.scorePercent).toBe(100);

      // Passed as string with extra spaces
      const fromString = validateActivityAnswer(activity, '  could  i  have a  latte  please  ');
      expect(fromString.isCorrect).toBe(true);

      // Incorrect
      const incorrect = validateActivityAnswer(activity, 'I could please have a latte');
      expect(incorrect.isCorrect).toBe(false);
      expect(incorrect.scorePercent).toBe(0);
    });

    it('evaluates listening activity with spoken audio fallback', () => {
      const activity: ListeningActivity = {
        id: 'act-list-1',
        kind: 'listening',
        prompt: 'Listen to the train announcement',
        audioTranscript: 'The train arrives at platform four.',
        question: 'Where does the train arrive?',
        options: ['Platform four', 'Platform two', 'Platform seven'],
        correctIndex: 0,
        playbackSpeed: 1,
      };

      expect(validateActivityAnswer(activity, 0).isCorrect).toBe(true);
      expect(validateActivityAnswer(activity, 1).isCorrect).toBe(false);
    });

    it('evaluates pronunciation prompt confirmation', () => {
      const activity: PronunciationPromptActivity = {
        id: 'act-pron-1',
        kind: 'pronunciation-prompt',
        targetPhrase: 'Good afternoon',
        phoneticIpa: '/ɡʊd ˌæftərˈnuːn/',
        prompt: 'Practice saying the greeting naturally',
      };

      const result = validateActivityAnswer(activity, 'confirmed');
      expect(result.isCorrect).toBe(true);
      expect(result.explanation).toContain('/ɡʊd ˌæftərˈnuːn/');
    });

    it('evaluates matching with partial credit and full credit', () => {
      const activity: MatchingActivity = {
        id: 'act-match-1',
        kind: 'matching',
        prompt: 'Match English greetings with time of day',
        pairs: [
          { left: 'Good morning', right: 'Before 12:00 PM' },
          { left: 'Good afternoon', right: '12:00 PM to 6:00 PM' },
          { left: 'Good evening', right: 'After 6:00 PM' },
          { left: 'Good night', right: 'When going to sleep' },
        ],
      };

      // 100% match
      const fullMatch = validateActivityAnswer(activity, {
        'Good morning': 'Before 12:00 PM',
        'Good afternoon': '12:00 PM to 6:00 PM',
        'Good evening': 'After 6:00 PM',
        'Good night': 'When going to sleep',
      });
      expect(fullMatch.isCorrect).toBe(true);
      expect(fullMatch.scorePercent).toBe(100);

      // 2 of 4 matched (50% partial credit)
      const partialMatch = validateActivityAnswer(activity, {
        'Good morning': 'Before 12:00 PM',
        'Good afternoon': 'Before 12:00 PM', // wrong
        'Good evening': 'After 6:00 PM',
        'Good night': '12:00 PM to 6:00 PM', // wrong
      });
      expect(partialMatch.isCorrect).toBe(false);
      expect(partialMatch.scorePercent).toBe(50);
      expect(partialMatch.feedbackMessage).toContain('2 of 4 pairs');

      // Invalid input type
      const invalidType = validateActivityAnswer(activity, 'not an object');
      expect(invalidType.isCorrect).toBe(false);
      expect(invalidType.scorePercent).toBe(0);
    });

    it('evaluates writing-prompt with minimum word count and keyword coverage', () => {
      const activity: WritingPromptActivity = {
        id: 'act-write-1',
        kind: 'writing-prompt',
        context: 'Workplace greeting email',
        prompt: 'Write a short greeting email to your team',
        minWords: 6,
        keywordsToInclude: ['morning', 'team', 'meeting'],
        sampleResponse: 'Good morning team! See you at our meeting today.',
      };

      // Too short
      const tooShort = validateActivityAnswer(activity, 'Good morning team');
      expect(tooShort.isCorrect).toBe(false);
      expect(tooShort.scorePercent).toBeLessThan(50);
      expect(tooShort.feedbackMessage).toContain('Please write at least 6 words');

      // Sufficient words, all keywords included
      const perfect = validateActivityAnswer(
        activity,
        'Good morning team! We will have a great project meeting today.'
      );
      expect(perfect.isCorrect).toBe(true);
      expect(perfect.scorePercent).toBe(100);

      // Sufficient words, but missing some keywords (partial score >= 50)
      const missingKeywords = validateActivityAnswer(
        activity,
        'Hello everyone! I hope you all had a wonderful weekend and are ready to work.'
      );
      expect(missingKeywords.scorePercent).toBe(50);
      expect(missingKeywords.isCorrect).toBe(false);
    });
  });

  describe('calculateLessonScore', () => {
    it('returns zero metrics when total activities is 0 or negative', () => {
      const score = calculateLessonScore({}, 0);
      expect(score.scorePercent).toBe(0);
      expect(score.isPassed).toBe(false);
      expect(score.starsEarned).toBe(0);
    });

    it('awards 3 stars for 100% score', () => {
      const evaluations: Record<string, ActivityEvaluation> = {
        'act-1': {
          activityId: 'act-1',
          isCorrect: true,
          scorePercent: 100,
          feedbackMessage: 'Great',
          correctAnswerDisplay: 'A',
        },
        'act-2': {
          activityId: 'act-2',
          isCorrect: true,
          scorePercent: 100,
          feedbackMessage: 'Great',
          correctAnswerDisplay: 'B',
        },
      };

      const score = calculateLessonScore(evaluations, 2);
      expect(score.scorePercent).toBe(100);
      expect(score.isPassed).toBe(true);
      expect(score.starsEarned).toBe(3);
      expect(score.correctActivities).toBe(2);
    });

    it('awards 2 stars for 90% - 99% score', () => {
      const evaluations: Record<string, ActivityEvaluation> = {
        'act-1': {
          activityId: 'act-1',
          isCorrect: true,
          scorePercent: 100,
          feedbackMessage: 'Great',
          correctAnswerDisplay: 'A',
        },
        'act-2': {
          activityId: 'act-2',
          isCorrect: true,
          scorePercent: 80,
          feedbackMessage: 'Partial',
          correctAnswerDisplay: 'B',
        },
      };

      const score = calculateLessonScore(evaluations, 2);
      expect(score.scorePercent).toBe(90);
      expect(score.isPassed).toBe(true);
      expect(score.starsEarned).toBe(2);
    });

    it('awards 1 star for 80% - 89% score', () => {
      const evaluations: Record<string, ActivityEvaluation> = {
        'act-1': {
          activityId: 'act-1',
          isCorrect: true,
          scorePercent: 100,
          feedbackMessage: 'Great',
          correctAnswerDisplay: 'A',
        },
        'act-2': {
          activityId: 'act-2',
          isCorrect: false,
          scorePercent: 60,
          feedbackMessage: 'Partial',
          correctAnswerDisplay: 'B',
        },
      };

      const score = calculateLessonScore(evaluations, 2);
      expect(score.scorePercent).toBe(80);
      expect(score.isPassed).toBe(true);
      expect(score.starsEarned).toBe(1);
    });

    it('fails when score is below 80% threshold', () => {
      const evaluations: Record<string, ActivityEvaluation> = {
        'act-1': {
          activityId: 'act-1',
          isCorrect: true,
          scorePercent: 100,
          feedbackMessage: 'Great',
          correctAnswerDisplay: 'A',
        },
        'act-2': {
          activityId: 'act-2',
          isCorrect: false,
          scorePercent: 50,
          feedbackMessage: 'Incorrect',
          correctAnswerDisplay: 'B',
        },
      };

      const score = calculateLessonScore(evaluations, 2);
      expect(score.scorePercent).toBe(75);
      expect(score.isPassed).toBe(false);
      expect(score.starsEarned).toBe(0);
    });

    it('counts unattempted activities as zero toward total score', () => {
      const evaluations: Record<string, ActivityEvaluation> = {
        'act-1': {
          activityId: 'act-1',
          isCorrect: true,
          scorePercent: 100,
          feedbackMessage: 'Great',
          correctAnswerDisplay: 'A',
        },
      };

      // 1 completed out of 4 total
      const score = calculateLessonScore(evaluations, 4);
      expect(score.scorePercent).toBe(25);
      expect(score.completedActivities).toBe(1);
      expect(score.isPassed).toBe(false);
      expect(score.starsEarned).toBe(0);
    });
  });
});
