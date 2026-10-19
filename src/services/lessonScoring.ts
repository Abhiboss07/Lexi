import type {
  LessonActivity,
  MultipleChoiceActivity,
  DialogueActivity,
  FillBlankActivity,
  SentenceOrderActivity,
  ListeningActivity,
  PronunciationPromptActivity,
  MatchingActivity,
  WritingPromptActivity,
} from '../types/curriculum';

export type ActivityAnswer = 
  | number 
  | string 
  | string[] 
  | Record<string, string>;

export interface ActivityEvaluation {
  activityId: string;
  isCorrect: boolean;
  scorePercent: number;
  feedbackMessage: string;
  explanation?: string;
  correctAnswerDisplay: string;
}

export interface LessonScoreResult {
  scorePercent: number;
  isPassed: boolean;
  totalActivities: number;
  completedActivities: number;
  correctActivities: number;
  starsEarned: 0 | 1 | 2 | 3;
}

/**
 * Validates a learner's answer for a given activity type.
 */
export function validateActivityAnswer(
  activity: LessonActivity,
  answer: ActivityAnswer | null | undefined
): ActivityEvaluation {
  if (answer === null || answer === undefined) {
    return {
      activityId: activity.id,
      isCorrect: false,
      scorePercent: 0,
      feedbackMessage: 'No answer was provided.',
      correctAnswerDisplay: getCorrectAnswerDisplay(activity),
    };
  }

  switch (activity.kind) {
    case 'multiple-choice':
      return evaluateMultipleChoice(activity, answer);
    case 'dialogue':
      return evaluateDialogue(activity, answer);
    case 'fill-blank':
      return evaluateFillBlank(activity, answer);
    case 'sentence-order':
      return evaluateSentenceOrder(activity, answer);
    case 'listening':
      return evaluateListening(activity, answer);
    case 'pronunciation-prompt':
      return evaluatePronunciation(activity, answer);
    case 'matching':
      return evaluateMatching(activity, answer);
    case 'writing-prompt':
      return evaluateWritingPrompt(activity, answer);
    default:
      return {
        activityId: (activity as LessonActivity).id,
        isCorrect: false,
        scorePercent: 0,
        feedbackMessage: 'Unsupported activity type.',
        correctAnswerDisplay: '',
      };
  }
}

function evaluateMultipleChoice(
  activity: MultipleChoiceActivity,
  answer: ActivityAnswer
): ActivityEvaluation {
  const chosenIndex = typeof answer === 'number' ? answer : parseInt(String(answer), 10);
  const isCorrect = chosenIndex === activity.correctIndex;
  const correctText = activity.options[activity.correctIndex] || '';

  return {
    activityId: activity.id,
    isCorrect,
    scorePercent: isCorrect ? 100 : 0,
    feedbackMessage: isCorrect
      ? 'Correct! Excellent conversational choice.'
      : `Not quite. The best option is: "${correctText}".`,
    explanation: activity.explanation,
    correctAnswerDisplay: correctText,
  };
}

function evaluateDialogue(
  activity: DialogueActivity,
  answer: ActivityAnswer
): ActivityEvaluation {
  // If the dialogue has a comprehension question, check the selected option
  if (activity.comprehensionQuestion) {
    const chosenIndex = typeof answer === 'number' ? answer : parseInt(String(answer), 10);
    const isCorrect = chosenIndex === activity.comprehensionQuestion.correctIndex;
    const correctText = activity.comprehensionQuestion.options[activity.comprehensionQuestion.correctIndex] || '';

    return {
      activityId: activity.id,
      isCorrect,
      scorePercent: isCorrect ? 100 : 0,
      feedbackMessage: isCorrect
        ? 'Great comprehension! You followed the conversation dialogue accurately.'
        : `Take note: "${correctText}" is the intended answer.`,
      correctAnswerDisplay: correctText,
    };
  }

  // Reading/listening to the dialogue without comprehension question
  const isAcknowledged = Boolean(answer);
  return {
    activityId: activity.id,
    isCorrect: isAcknowledged,
    scorePercent: isAcknowledged ? 100 : 0,
    feedbackMessage: 'Dialogue reviewed successfully.',
    correctAnswerDisplay: 'Dialogue completed',
  };
}

function evaluateFillBlank(
  activity: FillBlankActivity,
  answer: ActivityAnswer
): ActivityEvaluation {
  const chosenWord = String(answer).trim().toLowerCase();
  const correctWord = activity.correctOption.trim().toLowerCase();
  const isCorrect = chosenWord === correctWord;

  return {
    activityId: activity.id,
    isCorrect,
    scorePercent: isCorrect ? 100 : 0,
    feedbackMessage: isCorrect
      ? 'Spot on! The sentence is grammatically and contextually sound.'
      : `The missing word was "${activity.correctOption}".`,
    explanation: activity.targetGrammarPoint,
    correctAnswerDisplay: activity.correctOption,
  };
}

function evaluateSentenceOrder(
  activity: SentenceOrderActivity,
  answer: ActivityAnswer
): ActivityEvaluation {
  const userSentence = Array.isArray(answer) 
    ? answer.join(' ').trim() 
    : String(answer).trim();

  // Normalize punctuation and spacing
  const normalize = (s: string) => s.toLowerCase().replace(/[\s\t]+/g, ' ').trim();
  const isCorrect = normalize(userSentence) === normalize(activity.correctSentence);

  return {
    activityId: activity.id,
    isCorrect,
    scorePercent: isCorrect ? 100 : 0,
    feedbackMessage: isCorrect
      ? 'Well structured! Your sentence ordering is completely natural.'
      : `The natural sentence is: "${activity.correctSentence}".`,
    correctAnswerDisplay: activity.correctSentence,
  };
}

function evaluateListening(
  activity: ListeningActivity,
  answer: ActivityAnswer
): ActivityEvaluation {
  const chosenIndex = typeof answer === 'number' ? answer : parseInt(String(answer), 10);
  const isCorrect = chosenIndex === activity.correctIndex;
  const correctText = activity.options[activity.correctIndex] || '';

  return {
    activityId: activity.id,
    isCorrect,
    scorePercent: isCorrect ? 100 : 0,
    feedbackMessage: isCorrect
      ? 'Great listening ear! You captured the spoken phrase precisely.'
      : `Listen closely: "${correctText}" was stated in the audio.`,
    correctAnswerDisplay: correctText,
  };
}

function evaluatePronunciation(
  activity: PronunciationPromptActivity,
  answer: ActivityAnswer
): ActivityEvaluation {
  // Practice confirmation (learner rehearses phrase)
  const isConfirmed = Boolean(answer);
  return {
    activityId: activity.id,
    isCorrect: isConfirmed,
    scorePercent: isConfirmed ? 100 : 0,
    feedbackMessage: 'Pronunciation practice completed! Focus on natural vowel rhythm.',
    explanation: `Target IPA: ${activity.phoneticIpa}`,
    correctAnswerDisplay: activity.targetPhrase,
  };
}

function evaluateMatching(
  activity: MatchingActivity,
  answer: ActivityAnswer
): ActivityEvaluation {
  if (typeof answer !== 'object' || answer === null || Array.isArray(answer)) {
    return {
      activityId: activity.id,
      isCorrect: false,
      scorePercent: 0,
      feedbackMessage: 'Please match all pairs.',
      correctAnswerDisplay: activity.pairs.map((p) => `${p.left} ↔ ${p.right}`).join(', '),
    };
  }

  const userPairs = answer as Record<string, string>;
  let correctMatches = 0;
  const totalPairs = activity.pairs.length;

  for (const pair of activity.pairs) {
    if (userPairs[pair.left] === pair.right) {
      correctMatches++;
    }
  }

  const scorePercent = totalPairs > 0 ? Math.round((correctMatches / totalPairs) * 100) : 0;
  const isCorrect = correctMatches === totalPairs;

  return {
    activityId: activity.id,
    isCorrect,
    scorePercent,
    feedbackMessage: isCorrect
      ? `All ${totalPairs} pairs matched perfectly!`
      : `You matched ${correctMatches} of ${totalPairs} pairs correctly.`,
    correctAnswerDisplay: activity.pairs.map((p) => `${p.left} ↔ ${p.right}`).join(', '),
  };
}

function evaluateWritingPrompt(
  activity: WritingPromptActivity,
  answer: ActivityAnswer
): ActivityEvaluation {
  const text = String(answer).trim();
  const words = text.length > 0 ? text.split(/\s+/) : [];
  const wordCount = words.length;

  if (wordCount < activity.minWords) {
    return {
      activityId: activity.id,
      isCorrect: false,
      scorePercent: Math.round((wordCount / activity.minWords) * 50),
      feedbackMessage: `Please write at least ${activity.minWords} words (currently ${wordCount}).`,
      correctAnswerDisplay: `Sample: "${activity.sampleResponse}"`,
    };
  }

  // Check required keywords
  let foundKeywords = 0;
  const lowerText = text.toLowerCase();
  for (const kw of activity.keywordsToInclude) {
    if (lowerText.includes(kw.toLowerCase())) {
      foundKeywords++;
    }
  }

  const keywordRatio = activity.keywordsToInclude.length > 0
    ? foundKeywords / activity.keywordsToInclude.length
    : 1;

  const scorePercent = Math.min(100, Math.round(50 + keywordRatio * 50));
  const isCorrect = scorePercent >= 80;

  return {
    activityId: activity.id,
    isCorrect,
    scorePercent,
    feedbackMessage: isCorrect
      ? 'Expressive writing! You used the key vocabulary in appropriate context.'
      : `Good effort! Try to incorporate more key vocabulary: ${activity.keywordsToInclude.join(', ')}.`,
    correctAnswerDisplay: `Sample response: "${activity.sampleResponse}"`,
  };
}

function getCorrectAnswerDisplay(activity: LessonActivity): string {
  switch (activity.kind) {
    case 'multiple-choice':
      return activity.options[activity.correctIndex] || '';
    case 'fill-blank':
      return activity.correctOption;
    case 'sentence-order':
      return activity.correctSentence;
    case 'listening':
      return activity.options[activity.correctIndex] || '';
    case 'pronunciation-prompt':
      return activity.targetPhrase;
    case 'matching':
      return activity.pairs.map((p) => `${p.left} ↔ ${p.right}`).join(', ');
    case 'writing-prompt':
      return activity.sampleResponse;
    case 'dialogue':
      return activity.comprehensionQuestion
        ? activity.comprehensionQuestion.options[activity.comprehensionQuestion.correctIndex] || ''
        : 'Dialogue reviewed';
    default:
      return '';
  }
}

/**
 * Calculates aggregate lesson score from evaluations across all activities.
 */
export function calculateLessonScore(
  evaluations: Record<string, ActivityEvaluation>,
  totalActivities: number
): LessonScoreResult {
  if (totalActivities <= 0) {
    return {
      scorePercent: 0,
      isPassed: false,
      totalActivities: 0,
      completedActivities: 0,
      correctActivities: 0,
      starsEarned: 0,
    };
  }

  const evalList = Object.values(evaluations);
  const completedActivities = evalList.length;
  const correctActivities = evalList.filter((e) => e.isCorrect).length;

  const sumScores = evalList.reduce((acc, curr) => acc + curr.scorePercent, 0);
  // Unattempted activities count as 0
  const scorePercent = Math.round(sumScores / totalActivities);

  const isPassed = scorePercent >= 80;

  let starsEarned: 0 | 1 | 2 | 3 = 0;
  if (scorePercent >= 100) {
    starsEarned = 3;
  } else if (scorePercent >= 90) {
    starsEarned = 2;
  } else if (scorePercent >= 80) {
    starsEarned = 1;
  }

  return {
    scorePercent,
    isPassed,
    totalActivities,
    completedActivities,
    correctActivities,
    starsEarned,
  };
}
