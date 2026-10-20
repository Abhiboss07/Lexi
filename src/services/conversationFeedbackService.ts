import type { TurnFeedback, MistakeCategory } from '../types/conversationCoach';

interface MistakePatternRule {
  category: MistakeCategory;
  patternKey: string;
  regex: RegExp;
  correctionTemplate: string | ((match: RegExpExecArray, input: string) => string);
  explanation: string;
  formalityTip?: string;
  collocationTip?: string;
  example: string;
}

const MISTAKE_RULES: MistakePatternRule[] = [
  // 1. "in night" -> "at night"
  {
    category: 'preposition',
    patternKey: 'preposition-in-night',
    regex: /\bin\s+night\b/i,
    correctionTemplate: 'at night',
    explanation: "In English, we say 'at night', whereas we use 'in the morning', 'in the afternoon', and 'in the evening'.",
    collocationTip: "Collocation: 'at night' (exception to the 'in the...' time pattern).",
    example: "I usually study English at night after work.",
  },
  // 2. "arrive to" -> "arrive at / in"
  {
    category: 'preposition',
    patternKey: 'preposition-arrive-to',
    regex: /\barrive(?:d|s)?\s+to\b/i,
    correctionTemplate: (match) => {
      const isPast = match[0].toLowerCase().includes('d');
      return isPast ? 'arrived at' : 'arrive at';
    },
    explanation: "We say 'arrive at' (for specific buildings or locations) or 'arrive in' (for cities and countries), not 'arrive to'.",
    collocationTip: "Collocation: 'arrive at the station' / 'arrive in London'.",
    example: "We arrived at the airport two hours before departure.",
  },
  // 3. "interested for" -> "interested in"
  {
    category: 'preposition',
    patternKey: 'preposition-interested-for',
    regex: /\binterested\s+for\b/i,
    correctionTemplate: 'interested in',
    explanation: "The adjective 'interested' is always paired with the preposition 'in'.",
    collocationTip: "Dependent preposition: 'interested in + noun / gerund'.",
    example: "I am interested in learning more about the product design role.",
  },
  // 4. "married with" -> "married to"
  {
    category: 'preposition',
    patternKey: 'preposition-married-with',
    regex: /\bmarried\s+with\b/i,
    correctionTemplate: 'married to',
    explanation: "In English, a person is 'married to' someone, not 'married with'.",
    collocationTip: "Collocation: 'married to someone'.",
    example: "She is married to a software engineer.",
  },
  // 5. "did went" / "didn't went" -> "did go" / "didn't go"
  {
    category: 'verb-tense',
    patternKey: 'tense-did-went',
    regex: /\b(did(?:n't|\s+not)?)\s+went\b/i,
    correctionTemplate: (match) => `${match[1]} go`,
    explanation: "After the auxiliary 'did' or 'didn't', always use the base form of the verb (bare infinitive: 'go'), not the past tense ('went').",
    example: "I didn't go to the office yesterday because I was working remotely.",
  },
  // 6. "I have see" / "I have saw" -> "I have seen"
  {
    category: 'verb-tense',
    patternKey: 'tense-have-see',
    regex: /\b(have|has|had)\s+(?:see|saw)\b/i,
    correctionTemplate: (match) => `${match[1]} seen`,
    explanation: "The present perfect tense requires 'have/has' followed by the past participle ('seen').",
    example: "I have seen that project documentation already.",
  },
  // 7. "I am agree" -> "I agree"
  {
    category: 'verb-tense',
    patternKey: 'tense-am-agree',
    regex: /\b(i\s+am\s+agree|he\s+is\s+agree|she\s+is\s+agree|we\s+are\s+agree|they\s+are\s+agree)\b/i,
    correctionTemplate: (match) => {
      const lower = match[0].toLowerCase();
      if (lower.startsWith('i')) return 'I agree';
      if (lower.startsWith('he')) return 'he agrees';
      if (lower.startsWith('she')) return 'she agrees';
      if (lower.startsWith('we')) return 'we agree';
      return 'they agree';
    },
    explanation: "'Agree' is already a verb in English. Do not combine it with the verb 'to be' ('am/is/are').",
    example: "I agree with your suggestion regarding the sprint timeline.",
  },
  // 8. "make a question" -> "ask a question"
  {
    category: 'collocation',
    patternKey: 'collocation-make-question',
    regex: /\bmake\s+(?:a\s+)?question\b/i,
    correctionTemplate: 'ask a question',
    explanation: "In English, we 'ask' a question, we do not 'make' a question.",
    collocationTip: "Common pairing: 'ask a question' / 'raise a query'.",
    example: "May I ask a quick question about the menu?",
  },
  // 9. "explain me" -> "explain to me"
  {
    category: 'collocation',
    patternKey: 'collocation-explain-me',
    regex: /\bexplain\s+me\b/i,
    correctionTemplate: 'explain to me',
    explanation: "The verb 'explain' cannot take a direct personal object. We say 'explain something to someone' or 'explain to me'.",
    collocationTip: "Pattern: 'explain (something) to me'.",
    example: "Could you explain the directions to me once more?",
  },
  // 10. "make shopping" -> "do the shopping" or "go shopping"
  {
    category: 'collocation',
    patternKey: 'collocation-make-shopping',
    regex: /\bmake\s+shopping\b/i,
    correctionTemplate: 'go shopping',
    explanation: "We say 'go shopping' (for leisure or clothes) or 'do the shopping' (for routine groceries), not 'make shopping'.",
    example: "I usually go shopping for fresh produce on Saturday mornings.",
  },
  // 11. Missing article before countable container/portion: "cup of", "bottle of", "slice of"
  {
    category: 'article',
    patternKey: 'article-missing-cup',
    regex: /\b(want|like|order|have|get)\s+(cup|bottle|slice|piece|glass)\s+of\b/i,
    correctionTemplate: (match) => `${match[1]} a ${match[2]} of`,
    explanation: "Singular countable nouns such as 'cup', 'bottle', or 'glass' require an article ('a' or 'the') before them.",
    example: "Could I get a cup of black coffee, please?",
  },
  // 12. Formality: Blunt "Give me..." in customer service context
  {
    category: 'formality',
    patternKey: 'formality-blunt-give-me',
    regex: /^(?:give\s+me|i\s+want)\b/i,
    correctionTemplate: 'Could I please have',
    explanation: "In English service encounters (cafés, hotels, restaurants), starting with 'Give me...' or 'I want...' sounds rather blunt. Native speakers usually prefer 'Could I please have...', 'I would like...', or 'May I get...'.",
    formalityTip: "Politeness booster: 'Could I please have...' or 'I'd like...'",
    example: "Could I please have a medium latte to go?",
  },
];

/**
 * Natural conversational alternative suggestions when the learner's response is already grammatically fine.
 */
function getNaturalAlternative(input: string, cefrLevel: string): string {
  const lower = input.toLowerCase().trim();

  // Café / Food
  if (lower.includes('iced latte') || lower.includes('latte') || lower.includes('coffee')) {
    if (!lower.includes('could i please')) {
      return "Could I please get a medium oat milk latte to go?";
    }
    return "I'd love a medium iced latte with oat milk, and could you make that to go?";
  }
  if (lower.includes('pastry') || lower.includes('croissant')) {
    return "What freshly baked pastries would you recommend today?";
  }
  if (lower.includes('how much') || lower.includes('cost')) {
    return "Could you tell me what the total comes to?";
  }

  // Directions
  if (lower.includes('direction') || lower.includes('station') || lower.includes('where')) {
    return "Excuse me, could you point me in the direction of Covent Garden station?";
  }

  // Workplace
  if (lower.includes('nice to meet you') || lower.includes('started this week')) {
    return "It's a pleasure to connect! I just joined the product team this week and I'm really excited to collaborate.";
  }
  if (lower.includes('yesterday') && lower.includes('today')) {
    return "Yesterday I wrapped up the authentication tests; today my main focus is implementing payment confirmation.";
  }

  // Opinions
  if (lower.includes('remote work') || lower.includes('opinion')) {
    return "From my perspective, remote work empowers focused execution, while intentional in-person touchpoints nurture team cohesion.";
  }

  if (cefrLevel === 'B1' || cefrLevel === 'B2') {
    return `To elevate the phrasing further: "I was wondering if we might ${input.replace(/^i\s+/i, '')}"`;
  }

  return `Polite, natural phrasing: "Could I please ${input.replace(/^(can i|i want to|give me)\s+/i, '')}?"`;
}

/**
 * Evaluates learner's conversational turn with fine-grained linguistic analysis.
 * Preserves dialect validity, praises correct phrasing, and prevents overcorrection.
 */
export function evaluateLearnerTurn(
  rawInput: string,
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' = 'A2'
): TurnFeedback {
  const input = rawInput.trim();
  if (!input) {
    return {
      originalSentence: '',
      correctedSentence: null,
      naturalAlternative: "Could I please get started with that?",
      applicationExample: "Could I please get an oat milk latte to go?",
      detectedIssues: [],
      isAccurate: false,
      score: 0,
      praise: undefined,
    };
  }

  let workingSentence = input;
  const detectedIssues: TurnFeedback['detectedIssues'] = [];
  let grammarExplanation: string | undefined;
  let collocationSuggestion: string | undefined;
  let formalityGuidance: string | undefined;
  let applicationExample = '';

  for (const rule of MISTAKE_RULES) {
    const match = rule.regex.exec(workingSentence);
    if (match) {
      const replacement =
        typeof rule.correctionTemplate === 'function'
          ? rule.correctionTemplate(match, workingSentence)
          : rule.correctionTemplate;

      workingSentence = workingSentence.replace(rule.regex, replacement);

      detectedIssues.push({
        category: rule.category,
        patternKey: rule.patternKey,
        issue: match[0],
        correction: replacement,
      });

      if (!grammarExplanation && (rule.category === 'verb-tense' || rule.category === 'preposition' || rule.category === 'article')) {
        grammarExplanation = rule.explanation;
      }
      if (!collocationSuggestion && (rule.collocationTip || rule.category === 'collocation')) {
        collocationSuggestion = rule.collocationTip || rule.explanation;
      }
      if (!formalityGuidance && (rule.formalityTip || rule.category === 'formality')) {
        formalityGuidance = rule.formalityTip || rule.explanation;
      }
      if (!applicationExample) {
        applicationExample = rule.example;
      }
    }
  }

  // Capitalize first letter of corrected sentence if changed
  if (workingSentence !== input) {
    workingSentence = workingSentence.charAt(0).toUpperCase() + workingSentence.slice(1);
    if (!workingSentence.endsWith('.') && !workingSentence.endsWith('?') && !workingSentence.endsWith('!')) {
      workingSentence += '.';
    }
  }

  const isAccurate = detectedIssues.length === 0;
  const correctedSentence = isAccurate ? null : workingSentence;
  const naturalAlternative = getNaturalAlternative(input, cefrLevel);
  if (!applicationExample) {
    applicationExample = naturalAlternative;
  }

  // Compute conversational accuracy score
  let score = 92;
  if (!isAccurate) {
    score = Math.max(65, 92 - (detectedIssues.length * 12));
  } else {
    // Bonus for polite markers or advanced phrasing
    const lower = input.toLowerCase();
    if (lower.includes('could i please') || lower.includes('would you mind') || lower.includes('from my perspective')) {
      score = 98;
    } else if (lower.includes('please') || lower.includes('thank you') || lower.includes('thanks')) {
      score = 95;
    }
  }

  // Specific praise for what worked well
  let praise: string | undefined;
  const lower = input.toLowerCase();
  if (isAccurate) {
    if (lower.includes('could i please') || lower.includes('would like')) {
      praise = "Excellent polite phrasing! The conditional 'could I' sets a courteous, natural tone.";
    } else if (lower.includes('in my experience') || lower.includes('from my perspective')) {
      praise = "Superb discourse marker! Stating your opinion with nuance enriches conversational flow.";
    } else if (lower.includes('to go') || lower.includes('takeaway')) {
      praise = "Very natural native collocation for food service orders.";
    } else if (lower.includes('nice to meet you') || lower.includes('pleasure')) {
      praise = "Warm and engaging introduction! Perfect social cadence.";
    } else {
      praise = "Your sentence is clear, grammatically sound, and fits the situation naturally.";
    }
  }

  return {
    originalSentence: input,
    correctedSentence,
    naturalAlternative,
    grammarExplanation,
    collocationSuggestion,
    formalityGuidance,
    applicationExample,
    detectedIssues,
    praise,
    isAccurate,
    score,
  };
}
