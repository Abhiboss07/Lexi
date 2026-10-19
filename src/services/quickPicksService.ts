import type {
  DailyChallengePrompt,
  DailyChallengeSubmission,
  WordQuestQuestion,
} from '../types/quickPicks';

export const DAILY_CHALLENGE_PROMPTS: DailyChallengePrompt[] = [
  {
    id: 'dc-sun-reflection',
    dayIndex: 0,
    title: 'Weekly Reflection & Target Goal',
    scenario: 'Reflect on your English practice this week and set one clear goal for the coming days.',
    instructions: 'Write at least 2 complete sentences about what you practiced this week and one English skill you want to focus on next week (e.g. speaking, listening, prepositions).',
    starterPrompt: 'This week, I practiced... Next week, I plan to...',
    cefrLevel: 'A2',
    minWords: 15,
    targetKeywords: ['practice', 'improve', 'week', 'goal'],
    guidanceTips: [
      'Use past tense for this week ("I practiced", "I learned").',
      'Use future intention for next week ("I want to", "I will", "I plan to").',
      'Check that each sentence begins with a capital letter and ends with a period.',
    ],
    exampleResponse: 'This week, I practiced daily café dialogues and vocabulary reviews. Next week, I want to improve my speaking confidence and learn common prepositions.',
  },
  {
    id: 'dc-mon-three-sentences',
    dayIndex: 1,
    title: 'Three Sentences About Your Day',
    scenario: 'Share three clear sentences describing your day, including your morning, afternoon, or plans for tonight.',
    instructions: 'Write three full sentences describing your activities today. Use at least two time markers such as "this morning", "after lunch", or "tonight".',
    starterPrompt: 'This morning, I... Later, I... Tonight, I will...',
    cefrLevel: 'A1',
    minWords: 18,
    targetKeywords: ['morning', 'work', 'today', 'tonight', 'lunch', 'evening'],
    guidanceTips: [
      'Ensure each of the 3 thoughts is a separate, complete sentence.',
      'Check subject-verb agreement (e.g. "I woke up", "I had lunch").',
      'Try to include how you felt (e.g. "productive", "busy", "relaxed").',
    ],
    exampleResponse: 'This morning, I enjoyed a hot cup of coffee before starting work. In the afternoon, I completed an important project report with my team. Tonight, I will relax and read an English short story.',
  },
  {
    id: 'dc-tue-natural-expression',
    dayIndex: 2,
    title: 'Natural Expression Makeover',
    scenario: 'Transform textbook phrases into natural, native-sounding English expressions.',
    instructions: 'Learn the expression "take your time" or "take it easy". Rewrite this textbook sentence into more natural English: "I must do this work slowly and without any stress tonight."',
    starterPrompt: 'Tonight, I will...',
    cefrLevel: 'A2',
    minWords: 10,
    targetKeywords: ['take', 'easy', 'time', 'tonight', 'relax'],
    guidanceTips: [
      '"Take it easy" means to relax and not overwork.',
      '"Take your time" means there is no rush; do it carefully.',
      'Keep your sentence conversational and natural.',
    ],
    exampleResponse: 'Tonight, I am going to take it easy and finish my tasks without rushing.',
  },
  {
    id: 'dc-wed-polite-request',
    dayIndex: 3,
    title: 'Real-Life Situational Request',
    scenario: 'You are at an airport departure gate, and you need to confirm if your flight is on time.',
    instructions: 'Write a polite, 2-sentence dialogue or question to the airport gate agent asking about the status of your flight.',
    starterPrompt: 'Excuse me, could you please...',
    cefrLevel: 'A2',
    minWords: 12,
    targetKeywords: ['excuse', 'could', 'please', 'flight', 'gate', 'time'],
    guidanceTips: [
      'Begin with a polite opener like "Excuse me" or "Pardon me".',
      'Use modal verbs for politeness: "Could you tell me...", "Would you mind checking...".',
      'Include a courteous closing like "Thank you very much".',
    ],
    exampleResponse: 'Excuse me, could you please check if flight 204 to London is boarding on time? Thank you for your help.',
  },
  {
    id: 'dc-thu-connect-two-words',
    dayIndex: 4,
    title: 'Compound Vocabulary in Action',
    scenario: 'Strengthen sentence cohesion by combining two essential vocabulary words in one sentence.',
    instructions: 'Combine the words "confident" and "opportunity" into a single, well-structured compound or complex sentence.',
    starterPrompt: 'With daily practice, I feel confident that...',
    cefrLevel: 'B1',
    minWords: 14,
    targetKeywords: ['confident', 'opportunity'],
    guidanceTips: [
      'Use a connecting word like "because", "so", "when", or "and".',
      '"Confident" is an adjective; "opportunity" is a countable noun (an opportunity / new opportunities).',
      'Ensure clear logic connecting self-assurance with the chance to act.',
    ],
    exampleResponse: 'With consistent practice, I feel confident when a new opportunity arises to speak English at work.',
  },
  {
    id: 'dc-fri-error-correction',
    dayIndex: 5,
    title: 'Sentence Makeover: Common Learner Error',
    scenario: 'A common English learner mistake is saying "I am agree with your opinion."',
    instructions: 'Explain why "I am agree" is incorrect, and write the corrected version along with one follow-up sentence explaining your viewpoint.',
    starterPrompt: 'In English, "agree" is a verb, so we say: "I agree with..."',
    cefrLevel: 'A2',
    minWords: 15,
    targetKeywords: ['agree', 'verb', 'because', 'think'],
    guidanceTips: [
      'Remember: "agree" is a verb, never preceded by "am" in present simple.',
      'Correct form: "I agree with..." or "I completely agree."',
      'Add a second sentence with a supporting reason.',
    ],
    exampleResponse: 'In English, "agree" is a verb, so we say "I agree with your suggestion." I think this new approach will save our team a lot of time.',
  },
  {
    id: 'dc-sat-describe-object',
    dayIndex: 6,
    title: 'Sensory Object Description',
    scenario: 'Vivid descriptions make your English memorable and expressive.',
    instructions: 'Choose an object on your desk (e.g. coffee mug, journal, headphones). Write at least 2 sentences describing its shape, color, texture, and why it is useful to you.',
    starterPrompt: 'On my desk sits my...',
    cefrLevel: 'A2',
    minWords: 16,
    targetKeywords: ['desk', 'useful', 'color', 'ceramic', 'smooth', 'comfortable', 'notebook', 'cup'],
    guidanceTips: [
      'Use at least 3 descriptive adjectives (e.g. "matte", "smooth", "compact", "favorite").',
      'Explain how it assists your daily routine.',
      'Check that singular nouns have appropriate articles ("a", "an", "my").',
    ],
    exampleResponse: 'On my desk sits my ceramic lavender coffee mug with a smooth matte finish. It keeps my morning tea warm and helps me stay energized while studying.',
  },
];

/**
 * Deterministically retrieves today's challenge based on local date
 */
export function getTodayChallenge(date: Date = new Date()): DailyChallengePrompt {
  const dayIndex = date.getDay(); // 0 is Sunday, 6 is Saturday
  return DAILY_CHALLENGE_PROMPTS.find((p) => p.dayIndex === dayIndex) || DAILY_CHALLENGE_PROMPTS[1];
}

/**
 * Evaluates learner response deterministically with rule-based heuristics
 */
export function evaluateDailyChallenge(
  prompt: DailyChallengePrompt,
  userText: string
): DailyChallengeSubmission['feedback'] & { score: number } {
  const clean = userText.trim();
  const words = clean ? clean.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  const strengths: string[] = [];
  const improvements: string[] = [];
  const grammarNotes: string[] = [];
  const vocabularyUsed: string[] = [];

  let baseScore = 60;

  // 1. Word Count check
  if (wordCount >= prompt.minWords) {
    baseScore += 15;
    strengths.push(`Great length! Met the minimum goal with ${wordCount} words (target: ${prompt.minWords}+).`);
  } else {
    improvements.push(`Try to expand your answer: you wrote ${wordCount} words, but the challenge recommends at least ${prompt.minWords} words.`);
  }

  // 2. Target keywords check
  if (prompt.targetKeywords && prompt.targetKeywords.length > 0) {
    const lower = clean.toLowerCase();
    const matched = prompt.targetKeywords.filter((kw) => lower.includes(kw.toLowerCase()));
    if (matched.length > 0) {
      baseScore += Math.min(15, matched.length * 8);
      vocabularyUsed.push(...matched);
      strengths.push(`Successfully incorporated key theme words: "${matched.join('", "')}".`);
    } else {
      improvements.push(`Consider using suggested vocabulary like: "${prompt.targetKeywords.slice(0, 3).join(', ')}".`);
    }
  }

  // 3. Sentence Structure & Punctuation
  const sentenceCount = (clean.match(/[.!?]+/g) || []).length;
  if (sentenceCount >= 2) {
    baseScore += 5;
    strengths.push(`Well-structured with ${sentenceCount} distinct sentences and proper end punctuation.`);
  } else {
    improvements.push('Separate your ideas into distinct sentences using periods (.), question marks (?), or exclamation marks (!).');
  }

  // 4. Common Error Checks
  const lower = clean.toLowerCase();
  if (lower.includes('i am agree') || lower.includes('i\'m agree')) {
    grammarNotes.push('Grammar note: Say "I agree" instead of "I am agree" ("agree" is a verb).');
    baseScore = Math.max(50, baseScore - 10);
  }
  if (/\bi\s+[a-z]/.test(clean)) {
    grammarNotes.push('Capitalization: Always capitalize the singular pronoun "I".');
  }

  // Capitalization of first word
  if (clean.length > 0 && clean[0] === clean[0].toUpperCase() && /[A-Z]/.test(clean[0])) {
    baseScore += 5;
  }

  const finalScore = Math.min(100, Math.max(50, baseScore));

  return {
    score: finalScore,
    strengths,
    improvements,
    grammarNotes,
    vocabularyUsed,
  };
}

/**
 * Word Quest Question Bank
 */
export const WORD_QUEST_QUESTIONS: WordQuestQuestion[] = [
  // Choice Mode
  {
    id: 'wq-1',
    mode: 'choice',
    prompt: 'She felt very ______ before her first job interview because she prepared well.',
    options: ['confident', 'confused', 'dangerous', 'crowded'],
    correctAnswer: 'confident',
    explanation: '"Confident" means feeling sure of oneself and having self-assurance.',
    sentenceWithBlank: 'She felt very [_____] before her first job interview.',
    cefrLevel: 'A2',
  },
  {
    id: 'wq-2',
    mode: 'choice',
    prompt: 'Could I please make a ______ for extra towels at the hotel desk?',
    options: ['request', 'mistake', 'traffic', 'journey'],
    correctAnswer: 'request',
    explanation: 'A "request" is an act of politely asking for something.',
    sentenceWithBlank: 'Could I please make a [_____] for extra towels?',
    cefrLevel: 'A1',
  },
  {
    id: 'wq-3',
    mode: 'choice',
    prompt: 'This is my ______, Sarah. We work together on the design team.',
    options: ['colleague', 'stranger', 'passenger', 'tourist'],
    correctAnswer: 'colleague',
    explanation: 'A "colleague" is someone with whom you work in a business or profession.',
    sentenceWithBlank: 'This is my [_____], Sarah. We work together.',
    cefrLevel: 'A1',
  },
  {
    id: 'wq-4',
    mode: 'choice',
    prompt: 'It was a true ______ meeting you today. Let us keep in touch!',
    options: ['pleasure', 'problem', 'delay', 'schedule'],
    correctAnswer: 'pleasure',
    explanation: '"It was a pleasure" is a standard polite expression when parting after meeting someone.',
    sentenceWithBlank: 'It was a true [_____] meeting you today.',
    cefrLevel: 'A1',
  },

  // Match Mode
  {
    id: 'wq-match-1',
    mode: 'match',
    prompt: 'Match each English word to its correct meaning:',
    correctAnswer: 'matched_all',
    explanation: 'Great job matching all three vocabulary pairs!',
    pairs: [
      { word: 'confident', meaning: 'Self-assured and certain' },
      { word: 'colleague', meaning: 'A coworker in a profession' },
      { word: 'request', meaning: 'A polite ask for something' },
    ],
    cefrLevel: 'A2',
  },
  {
    id: 'wq-match-2',
    mode: 'match',
    prompt: 'Match the workplace terms to their definitions:',
    correctAnswer: 'matched_all',
    explanation: 'Excellent precision with workplace vocabulary!',
    pairs: [
      { word: 'deadline', meaning: 'The latest time to finish a task' },
      { word: 'agenda', meaning: 'A list of items for a meeting' },
      { word: 'feedback', meaning: 'Helpful advice on performance' },
    ],
    cefrLevel: 'B1',
  },

  // Find Error Mode
  {
    id: 'wq-err-1',
    mode: 'find_error',
    prompt: 'Spot the INCORRECT word in the sentence below:',
    highlightedSentence: 'I am agree with your opinion about the project schedule.',
    options: ['am', 'agree', 'with', 'opinion'],
    correctAnswer: 'am',
    explanation: 'Remove "am". In English, "agree" is a verb, so say "I agree with your opinion."',
    cefrLevel: 'A2',
  },
  {
    id: 'wq-err-2',
    mode: 'find_error',
    prompt: 'Spot the INCORRECT word in this question:',
    highlightedSentence: 'Where did you went yesterday afternoon after the meeting?',
    options: ['Where', 'did', 'went', 'afternoon'],
    correctAnswer: 'went',
    explanation: 'After the auxiliary "did", use the base form of the verb: "Where did you go...?"',
    cefrLevel: 'A2',
  },

  // Rapid Phrase Completion
  {
    id: 'wq-phrase-1',
    mode: 'rapid_phrase',
    prompt: 'Complete the friendly morning greeting:',
    sentenceWithBlank: 'Good morning! How are you ______ today?',
    options: ['doing', 'making', 'taking', 'having'],
    correctAnswer: 'doing',
    explanation: '"How are you doing?" is a natural conversational greeting.',
    cefrLevel: 'A1',
  },
  {
    id: 'wq-phrase-2',
    mode: 'rapid_phrase',
    prompt: 'Complete the polite café order:',
    sentenceWithBlank: 'I would ______ a cup of green tea, please.',
    options: ['like', 'want', 'prefer', 'wish'],
    correctAnswer: 'like',
    explanation: '"I would like..." is the standard polite request in restaurants and cafés.',
    cefrLevel: 'A1',
  },
];

/**
 * Retrieves a randomized or date-seeded set of Word Quest questions
 */
export function getWordQuestQuestions(
  count: number = 4,
  dateSeed: number = new Date().getDate()
): WordQuestQuestion[] {
  // Rotate starting offset deterministically by dateSeed
  const offset = dateSeed % WORD_QUEST_QUESTIONS.length;
  const rotated = [
    ...WORD_QUEST_QUESTIONS.slice(offset),
    ...WORD_QUEST_QUESTIONS.slice(0, offset),
  ];
  return rotated.slice(0, count);
}
