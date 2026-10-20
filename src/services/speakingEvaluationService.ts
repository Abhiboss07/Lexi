import type { SpeakingPrompt } from '../data/speakingData';

export interface SpokenEvaluationResult {
  spokenText: string;
  normalizedSpoken: string;
  wordCount: number;
  matchedKeyPhrases: string[];
  missingKeyPhrases: string[];
  missingWords: string[];
  wordOrderScore: number; // 0-100
  sentenceCompleteness: number; // 0-100
  overallScore: number; // 0-100
  isPassing: boolean;
  feedback: string;
  improvementSuggestions: string[];
  evaluationNote: string;
}

// Stop words to exclude when calculating missing content words
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
  'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'as', 'into',
  'like', 'through', 'after', 'over', 'between', 'out', 'against', 'during',
  'without', 'before', 'under', 'around', 'among', 'that', 'this', 'these',
  'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his',
  'her', 'our', 'their', 'me', 'him', 'us', 'them',
]);

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, '') // remove apostrophes for simple match: "can't" -> "cant"
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Pure, deterministic evaluation of spoken or typed learner responses.
 * Strictly adheres to privacy & accuracy safeguards:
 * - Measures linguistic phrase presence, word ordering, and semantic completeness.
 * - Explicitly does NOT claim phoneme-level acoustic scoring.
 */
export function evaluateSpokenResponse(
  spokenText: string,
  prompt: SpeakingPrompt
): SpokenEvaluationResult {
  const normalizedSpoken = normalizeText(spokenText);
  const normalizedModel = normalizeText(prompt.modelResponse);

  if (!normalizedSpoken) {
    return {
      spokenText,
      normalizedSpoken: '',
      wordCount: 0,
      matchedKeyPhrases: [],
      missingKeyPhrases: [...prompt.targetKeyPhrases],
      missingWords: [],
      wordOrderScore: 0,
      sentenceCompleteness: 0,
      overallScore: 0,
      isPassing: false,
      feedback: 'No spoken response detected. Tap the microphone or type your response to practice.',
      improvementSuggestions: ['Press the microphone and speak clearly, or use the text fallback.'],
      evaluationNote: 'Text-based linguistic analysis (SpeechRecognition + grammar matching).',
    };
  }

  const spokenWords = normalizedSpoken.split(' ').filter(Boolean);
  const modelWords = normalizedModel.split(' ').filter(Boolean);
  const wordCount = spokenWords.length;

  // 1. Target Key Phrase Matching
  const matchedKeyPhrases: string[] = [];
  const missingKeyPhrases: string[] = [];

  for (const phrase of prompt.targetKeyPhrases) {
    const normPhrase = normalizeText(phrase);
    if (normalizedSpoken.includes(normPhrase)) {
      matchedKeyPhrases.push(phrase);
    } else {
      // Check partial match (all words present anywhere)
      const phraseTokens = normPhrase.split(' ');
      const allTokensPresent = phraseTokens.every((token) => spokenWords.includes(token));
      if (allTokensPresent) {
        matchedKeyPhrases.push(phrase);
      } else {
        missingKeyPhrases.push(phrase);
      }
    }
  }

  // 2. Missing Content Words
  const spokenSet = new Set(spokenWords);
  const missingWords: string[] = [];
  for (const w of modelWords) {
    if (!STOP_WORDS.has(w) && !spokenSet.has(w) && !missingWords.includes(w)) {
      missingWords.push(w);
    }
  }

  // 3. Word Order / Sequence Alignment Score
  // Checks if the matched content words appear in roughly the same relative sequence
  const sharedContentWords = modelWords.filter(
    (w) => !STOP_WORDS.has(w) && spokenSet.has(w)
  );

  let wordOrderScore = 100;
  if (sharedContentWords.length > 1) {
    let inversions = 0;
    let comparisons = 0;
    for (let i = 0; i < sharedContentWords.length - 1; i++) {
      const idxA = spokenWords.indexOf(sharedContentWords[i]);
      const idxB = spokenWords.indexOf(sharedContentWords[i + 1]);
      if (idxA !== -1 && idxB !== -1) {
        comparisons++;
        if (idxA > idxB) {
          inversions++;
        }
      }
    }
    if (comparisons > 0) {
      wordOrderScore = Math.max(0, Math.round(100 - (inversions / comparisons) * 100));
    }
  }

  // 4. Sentence Completeness & Length Coverage
  const targetWordCount = modelWords.length;
  // A reasonable length is between 60% and 150% of the target model
  const lengthRatio = Math.min(1.2, wordCount / Math.max(1, targetWordCount));
  const phraseCoverageRatio =
    prompt.targetKeyPhrases.length > 0
      ? matchedKeyPhrases.length / prompt.targetKeyPhrases.length
      : 1;

  const sentenceCompleteness = Math.min(
    100,
    Math.round(phraseCoverageRatio * 65 + lengthRatio * 35)
  );

  // 5. Overall Weighted Score
  // 50% phrase coverage + 25% completeness + 25% word order
  const phraseScore = Math.round(phraseCoverageRatio * 100);
  const overallScore = Math.min(
    100,
    Math.max(
      15,
      Math.round(phraseScore * 0.5 + sentenceCompleteness * 0.25 + wordOrderScore * 0.25)
    )
  );

  const isPassing = overallScore >= 70;

  // 6. Actionable, Constructive Feedback
  let feedback = '';
  const improvementSuggestions: string[] = [];

  if (overallScore >= 90) {
    feedback = 'Outstanding delivery! Natural cadence, complete key vocabulary, and accurate phrase structure.';
  } else if (overallScore >= 75) {
    feedback = 'Strong conversational response! Your message is clear and communicates the main goal effectively.';
  } else if (overallScore >= 50) {
    feedback = 'Good start! Your core idea came through, but incorporating more specific target phrases will elevate clarity.';
  } else {
    feedback = 'Keep practicing! Review the model response audio and try weaving in the highlighted key phrases.';
  }

  if (missingKeyPhrases.length > 0) {
    improvementSuggestions.push(`Try including: "${missingKeyPhrases.slice(0, 2).join('", "')}"`);
  }

  if (wordOrderScore < 70) {
    improvementSuggestions.push('Pay attention to word order for natural English conversational rhythm.');
  }

  if (prompt.pronunciationTips) {
    improvementSuggestions.push(`Pronunciation tip: ${prompt.pronunciationTips}`);
  }

  return {
    spokenText,
    normalizedSpoken,
    wordCount,
    matchedKeyPhrases,
    missingKeyPhrases,
    missingWords: missingWords.slice(0, 5),
    wordOrderScore,
    sentenceCompleteness,
    overallScore,
    isPassing,
    feedback,
    improvementSuggestions,
    evaluationNote:
      'Evaluated via client-side transcript matching and keyword recognition. Audio is processed locally by your browser.',
  };
}
