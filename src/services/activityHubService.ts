import type { CEFRLevel } from '../types/curriculum';
import type { PracticeDifficulty } from '../types/practicePreferences';
import { getLocalDateString, getDateSeed } from './dailyPracticeService';

// ==========================================
// A. PHRASE BUILDER
// ==========================================
export type PhraseTopic = 'everyday' | 'travel' | 'workplace' | 'interview';

export interface PhraseBuilderItem {
  id: string;
  topic: PhraseTopic;
  difficulty: PracticeDifficulty;
  cefrLevel: CEFRLevel;
  targetSentence: string;
  scrambledWords: string[];
  explanation: string;
  patternTip: string;
}

export const PHRASE_BUILDER_BANK: PhraseBuilderItem[] = [
  // Everyday
  {
    id: 'pb-everyday-1',
    topic: 'everyday',
    difficulty: 'easy',
    cefrLevel: 'A1',
    targetSentence: 'Could I please have a glass of water?',
    scrambledWords: ['water?', 'have', 'Could', 'glass', 'a', 'I', 'please', 'of'],
    explanation: 'Polite requests start with "Could I please have...", followed by the object and a question mark.',
    patternTip: 'Polite Request: Could I please + verb + noun phrase',
  },
  {
    id: 'pb-everyday-2',
    topic: 'everyday',
    difficulty: 'medium',
    cefrLevel: 'A2',
    targetSentence: 'I usually take a walk in the evening after dinner.',
    scrambledWords: ['after', 'evening', 'take', 'dinner.', 'usually', 'I', 'walk', 'the', 'a', 'in'],
    explanation: 'Frequency adverbs like "usually" appear between the subject and the main verb.',
    patternTip: 'Daily Habit: Subject + frequency adverb + main verb + time marker',
  },
  // Travel
  {
    id: 'pb-travel-1',
    topic: 'travel',
    difficulty: 'easy',
    cefrLevel: 'A1',
    targetSentence: 'Where is the nearest subway station?',
    scrambledWords: ['station?', 'is', 'subway', 'nearest', 'Where', 'the'],
    explanation: 'Ask for locations using "Where is the + superlative adjective + place?"',
    patternTip: 'Directions: Where is + the + adjective + place?',
  },
  {
    id: 'pb-travel-2',
    topic: 'travel',
    difficulty: 'hard',
    cefrLevel: 'B2',
    targetSentence: 'Would you mind checking if our flight has been delayed?',
    scrambledWords: ['flight', 'Would', 'checking', 'mind', 'been', 'our', 'has', 'if', 'you', 'delayed?'],
    explanation: '"Would you mind + verb-ing...?" is an advanced, respectful inquiry structure.',
    patternTip: 'Formal Inquiry: Would you mind + gerund (checking) + embedded clause',
  },
  // Workplace
  {
    id: 'pb-work-1',
    topic: 'workplace',
    difficulty: 'medium',
    cefrLevel: 'B1',
    targetSentence: 'Let us schedule a quick meeting to review the project.',
    scrambledWords: ['meeting', 'schedule', 'the', 'to', 'project.', 'Let', 'a', 'review', 'quick', 'us'],
    explanation: '"Let us schedule..." is a proactive, professional collaborative invitation.',
    patternTip: 'Work Collaboration: Let us + verb + object + infinitive of purpose',
  },
  {
    id: 'pb-work-2',
    topic: 'workplace',
    difficulty: 'hard',
    cefrLevel: 'B2',
    targetSentence: 'We need to align on the core deliverables before Friday.',
    scrambledWords: ['deliverables', 'on', 'align', 'before', 'need', 'the', 'We', 'to', 'core', 'Friday.'],
    explanation: '"Align on" means to achieve mutual consensus regarding business targets.',
    patternTip: 'Professional Alignment: Subject + need to align on + deliverables + deadline',
  },
  // Interview
  {
    id: 'pb-interview-1',
    topic: 'interview',
    difficulty: 'medium',
    cefrLevel: 'B1',
    targetSentence: 'I was responsible for leading a cross-functional team.',
    scrambledWords: ['a', 'responsible', 'leading', 'team.', 'was', 'for', 'cross-functional', 'I'],
    explanation: '"I was responsible for + gerund" clearly frames your past ownership in an interview.',
    patternTip: 'STAR Action: I was responsible for + gerund (-ing)',
  },
  {
    id: 'pb-interview-2',
    topic: 'interview',
    difficulty: 'hard',
    cefrLevel: 'C1',
    targetSentence: 'This initiative resulted in a twenty percent increase in efficiency.',
    scrambledWords: ['initiative', 'in', 'efficiency.', 'percent', 'resulted', 'increase', 'twenty', 'a', 'This', 'in'],
    explanation: '"Resulted in + metric" delivers quantified business impact in behavioral interviews.',
    patternTip: 'STAR Result: Subject + resulted in + quantified metric',
  },
];

export function getPhraseBuilderItems(topic?: PhraseTopic, difficulty?: PracticeDifficulty): PhraseBuilderItem[] {
  let filtered = [...PHRASE_BUILDER_BANK];
  if (topic) {
    filtered = filtered.filter((i) => i.topic === topic);
  }
  if (difficulty) {
    const diffMatches = filtered.filter((i) => i.difficulty === difficulty);
    if (diffMatches.length > 0) filtered = diffMatches;
  }
  return filtered;
}

// ==========================================
// B. MINI GRAMMAR GAMES
// ==========================================
export type GrammarGameMode = 'find_error' | 'tense_choice' | 'sentence_repair' | 'preposition';

export interface GrammarGameQuestion {
  id: string;
  mode: GrammarGameMode;
  cefrLevel: CEFRLevel;
  difficulty: PracticeDifficulty;
  prompt: string;
  sentence?: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  ruleTopic: string;
}

export const GRAMMAR_GAMES_BANK: GrammarGameQuestion[] = [
  // Find Error
  {
    id: 'gg-err-1',
    mode: 'find_error',
    cefrLevel: 'A2',
    difficulty: 'easy',
    prompt: 'Tap the INCORRECT word in the sentence:',
    sentence: 'She do not like waking up early on Sundays.',
    options: ['do', 'not', 'waking', 'early'],
    correctAnswer: 'do',
    explanation: 'With third-person singular (she/he/it), use "does not", not "do not".',
    ruleTopic: 'Subject-Verb Agreement',
  },
  {
    id: 'gg-err-2',
    mode: 'find_error',
    cefrLevel: 'B1',
    difficulty: 'medium',
    prompt: 'Identify the grammatically incorrect word:',
    sentence: 'Although it rained heavily, but we still enjoyed our walking tour.',
    options: ['Although', 'rained', 'but', 'enjoyed'],
    correctAnswer: 'but',
    explanation: 'Do not pair "Although" and "but" in the same clause; "Although" is already the subordinating conjunction.',
    ruleTopic: 'Conjunction Redundancy',
  },
  // Tense Choice
  {
    id: 'gg-tense-1',
    mode: 'tense_choice',
    cefrLevel: 'A2',
    difficulty: 'easy',
    prompt: 'Choose the correct verb form for this past experience:',
    sentence: 'Last summer, we ______ to Paris for our anniversary.',
    options: ['travelled', 'travel', 'are travelling', 'have travelled'],
    correctAnswer: 'travelled',
    explanation: 'A specific finished past time marker ("Last summer") requires Simple Past ("travelled").',
    ruleTopic: 'Past Simple vs Present Perfect',
  },
  {
    id: 'gg-tense-2',
    mode: 'tense_choice',
    cefrLevel: 'B2',
    difficulty: 'hard',
    prompt: 'Select the appropriate future perfect construction:',
    sentence: 'By the time the client arrives, we ______ the design presentation.',
    options: ['will have completed', 'complete', 'will complete', 'are completing'],
    correctAnswer: 'will have completed',
    explanation: '"By the time + present event" indicates an action that will finish before that moment: Future Perfect ("will have completed").',
    ruleTopic: 'Future Perfect Tense',
  },
  // Prepositions
  {
    id: 'gg-prep-1',
    mode: 'preposition',
    cefrLevel: 'A1',
    difficulty: 'easy',
    prompt: 'Fill in the correct preposition of time:',
    sentence: 'Our team standup starts exactly ______ 9:30 AM.',
    options: ['at', 'on', 'in', 'to'],
    correctAnswer: 'at',
    explanation: 'Use "at" with clock times (at 9:30, at noon, at midnight). Use "on" for days and "in" for months/years.',
    ruleTopic: 'Prepositions of Time',
  },
  {
    id: 'gg-prep-2',
    mode: 'preposition',
    cefrLevel: 'B1',
    difficulty: 'medium',
    prompt: 'Complete with the natural preposition:',
    sentence: 'She is deeply interested ______ international sustainable architecture.',
    options: ['in', 'at', 'with', 'for'],
    correctAnswer: 'in',
    explanation: 'The adjective "interested" takes the dependent preposition "in" ("interested in something").',
    ruleTopic: 'Dependent Prepositions',
  },
  // Sentence Repair
  {
    id: 'gg-rep-1',
    mode: 'sentence_repair',
    cefrLevel: 'A2',
    difficulty: 'medium',
    prompt: 'Choose the repaired, natural sentence:',
    sentence: 'Faulty: "I look forward to hear from you soon."',
    options: [
      'I look forward to hearing from you soon.',
      'I look forward hear from you soon.',
      'I look forwarding to hear you soon.',
      'I look forward to heard from you soon.',
    ],
    correctAnswer: 'I look forward to hearing from you soon.',
    explanation: 'In "look forward to", "to" is a preposition, followed by a gerund ("hearing").',
    ruleTopic: 'Phrasal Verb Gerunds',
  },
];

export function getGrammarGameQuestions(
  _cefrLevel: CEFRLevel = 'A2',
  difficulty: PracticeDifficulty = 'medium',
  count: number = 4
): GrammarGameQuestion[] {
  let matched = GRAMMAR_GAMES_BANK.filter((q) => q.difficulty === difficulty);
  if (matched.length < count) {
    matched = [...GRAMMAR_GAMES_BANK];
  }
  return matched.slice(0, count);
}

// ==========================================
// C. REAL-LIFE SCENARIO CHALLENGE
// ==========================================
export interface ScenarioChallengePrompt {
  id: string;
  title: string;
  setting: string;
  situation: string;
  goal: string;
  starterPrompt: string;
  recommendedKeywords: string[];
  evaluationCriteria: string[];
  cefrLevel: CEFRLevel;
  difficulty: PracticeDifficulty;
  sampleModelResponse: string;
}

export const SCENARIO_CHALLENGES: ScenarioChallengePrompt[] = [
  {
    id: 'sc-cafe-special',
    title: 'Ordering with Dietary Preference',
    setting: 'A busy artisan coffee shop in London',
    situation: 'You want an iced latte, but you are lactose-intolerant and want less sugar.',
    goal: 'Order your drink politely, specify oat or almond milk, and ask for half-sweet syrup.',
    starterPrompt: 'Hello, could I please get...',
    recommendedKeywords: ['oat milk', 'iced latte', 'less sweet', 'please', 'could I'],
    evaluationCriteria: [
      'Politeness & Greeting (15 pts)',
      'Clear dietary specification (milk choice & sweetness) (35 pts)',
      'Natural conversational phrasing (25 pts)',
      'Grammar & sentence completeness (25 pts)',
    ],
    cefrLevel: 'A2',
    difficulty: 'easy',
    sampleModelResponse: 'Hi there! Could I please get a medium iced latte with oat milk instead of dairy, and with only half the usual syrup? Thank you!',
  },
  {
    id: 'sc-directions-transit',
    title: 'Asking for Subway Directions',
    setting: 'A bustling train terminal station in New York',
    situation: 'You cannot find the platform for the Uptown express train and your battery is low.',
    goal: 'Approach a station assistant politely, explain where you are trying to go, and ask for the quickest platform route.',
    starterPrompt: 'Excuse me, could you point me towards...',
    recommendedKeywords: ['excuse me', 'platform', 'uptown', 'train', 'quickest way'],
    evaluationCriteria: [
      'Courteous opener (15 pts)',
      'Direct explanation of destination (35 pts)',
      'Clarity of request (25 pts)',
      'Grammar & polite closing (25 pts)',
    ],
    cefrLevel: 'A2',
    difficulty: 'medium',
    sampleModelResponse: 'Excuse me, could you please point me towards the Uptown express platform? I need to catch the train to Central Park and want to be sure I am on the right track. Thank you!',
  },
  {
    id: 'sc-workplace-delay',
    title: 'Explaining a Project Deadline Delay',
    setting: 'Team Slack or Zoom sync with project lead',
    situation: 'A vendor provided API documentation late, meaning your deliverables will be delayed by one business day.',
    goal: 'Communicate the delay professionally, state the reason calmly, give the revised timeline, and offer a mitigation step.',
    starterPrompt: 'Hi team, I wanted to provide a quick update regarding...',
    recommendedKeywords: ['update', 'deliverable', 'delay', 'timeline', 'tomorrow', 'resolve'],
    evaluationCriteria: [
      'Professional tone without defensive language (25 pts)',
      'Clear explanation of cause and impact (30 pts)',
      'Actionable revised deadline (25 pts)',
      'Constructive proactive next step (20 pts)',
    ],
    cefrLevel: 'B2',
    difficulty: 'hard',
    sampleModelResponse: 'Hi team, I wanted to share a quick update on the integration milestone. Because we received the third-party API specs late this morning, we need until tomorrow at 3 PM to complete validation. I will share a test build first thing tomorrow.',
  },
];

export interface ScenarioEvaluationResult {
  score: number;
  wordCount: number;
  matchedKeywords: string[];
  strengths: string[];
  feedbackNotes: string[];
  criteriaBreakdown: Array<{ criterion: string; awarded: number; max: number }>;
}

export function evaluateScenarioResponse(
  userText: string,
  prompt: ScenarioChallengePrompt
): ScenarioEvaluationResult {
  const clean = userText.trim();
  const words = clean ? clean.split(/\s+/) : [];
  const lower = clean.toLowerCase();

  const matchedKeywords = prompt.recommendedKeywords.filter((kw) => lower.includes(kw.toLowerCase()));
  const strengths: string[] = [];
  const feedbackNotes: string[] = [];

  let wordCountScore = 0;
  if (words.length >= 12) {
    wordCountScore = 25;
    strengths.push(`Good response length (${words.length} words) providing sufficient context.`);
  } else if (words.length >= 6) {
    wordCountScore = 15;
    feedbackNotes.push(`Try to add detail: your response has ${words.length} words; aim for 12+ words to practice communicative fullness.`);
  } else {
    wordCountScore = 8;
    feedbackNotes.push('Response is too brief. Try writing complete sentences.');
  }

  let keywordScore = 0;
  if (matchedKeywords.length >= 3) {
    keywordScore = 30;
    strengths.push(`Excellent use of scenario vocabulary: "${matchedKeywords.join('", "')}".`);
  } else if (matchedKeywords.length >= 1) {
    keywordScore = 18;
    strengths.push(`Included relevant terms: "${matchedKeywords.join('", "')}".`);
    feedbackNotes.push(`Consider also incorporating: "${prompt.recommendedKeywords.filter(k => !matchedKeywords.includes(k)).slice(0, 2).join('", "')}".`);
  } else {
    keywordScore = 10;
    feedbackNotes.push(`Try using recommended expressions like "${prompt.recommendedKeywords.slice(0, 3).join(', ')}".`);
  }

  // Politeness check
  let politenessScore = 0;
  const politeTokens = ['please', 'could', 'would', 'thank', 'excuse me', 'pardon', 'hello', 'hi'];
  const hasPolite = politeTokens.some((t) => lower.includes(t));
  if (hasPolite) {
    politenessScore = 20;
    strengths.push('Polite and natural interpersonal framing.');
  } else {
    politenessScore = 10;
    feedbackNotes.push('Include polite markers such as "could you please" or "thank you".');
  }

  // Punctuation & sentence completion
  let structureScore = 0;
  const sentenceCount = (clean.match(/[.!?]+/g) || []).length;
  if (sentenceCount >= 1 && clean.length > 0 && clean[0] === clean[0].toUpperCase()) {
    structureScore = 25;
    strengths.push('Proper capitalization and ending punctuation.');
  } else {
    structureScore = 15;
    feedbackNotes.push('Ensure your sentence starts with a capital letter and ends with appropriate punctuation.');
  }

  const totalScore = Math.min(100, Math.max(40, wordCountScore + keywordScore + politenessScore + structureScore));

  const criteriaBreakdown = [
    { criterion: 'Length & Detail', awarded: wordCountScore, max: 25 },
    { criterion: 'Target Vocabulary', awarded: keywordScore, max: 30 },
    { criterion: 'Politeness & Tone', awarded: politenessScore, max: 20 },
    { criterion: 'Structure & Mechanics', awarded: structureScore, max: 25 },
  ];

  return {
    score: totalScore,
    wordCount: words.length,
    matchedKeywords,
    strengths,
    feedbackNotes,
    criteriaBreakdown,
  };
}

// ==========================================
// D. IDIOM & PHRASE OF THE DAY
// ==========================================
export interface DailyIdiom {
  id: string;
  dayIndex: number;
  expression: string;
  meaning: string;
  example: string;
  originOrContext: string;
  practiceQuestion: {
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export const DAILY_IDIOMS: DailyIdiom[] = [
  {
    id: 'idiom-0-silver-lining',
    dayIndex: 0,
    expression: 'Every cloud has a silver lining',
    meaning: 'Every difficult or sad situation has a comforting or more hopeful side.',
    example: 'Even though our flight was cancelled, the silver lining was getting an extra day to explore Rome.',
    originOrContext: 'Originates from John Milton’s poem Comus (1634), describing light behind dark clouds.',
    practiceQuestion: {
      prompt: 'When would you use "every cloud has a silver lining"?',
      options: [
        'When comforting a friend after an unexpected setback',
        'When complaining about stormy weather',
        'When celebrating a guaranteed victory',
        'When scheduling a flight departure',
      ],
      correctIndex: 0,
      explanation: 'Use this idiom to encourage someone by highlighting an unexpected positive benefit in a difficult situation.',
    },
  },
  {
    id: 'idiom-1-hit-nail',
    dayIndex: 1,
    expression: 'Hit the nail on the head',
    meaning: 'Describe exactly what is causing a situation or problem with pinpoint precision.',
    example: 'Sophie hit the nail on the head when she noticed our communication bottleneck.',
    originOrContext: 'Carpentry metaphor dating back to the 16th century: striking the nail dead center.',
    practiceQuestion: {
      prompt: 'What does it mean if someone "hits the nail on the head"?',
      options: [
        'They are exactly right about the core issue',
        'They made a painful mistake',
        'They finished building a physical product',
        'They argued aggressively with a coworker',
      ],
      correctIndex: 0,
      explanation: '"Hit the nail on the head" means being 100% accurate or precisely identifying the truth.',
    },
  },
  {
    id: 'idiom-2-touch-wood',
    dayIndex: 2,
    expression: 'Knock on wood / Touch wood',
    meaning: 'Spoken to avert bad luck after expressing confidence that good fortune will continue.',
    example: 'Our team hasn’t missed a sprint deadline this year, knock on wood!',
    originOrContext: 'Pagan folklore where touching trees invoked protective woodland spirits.',
    practiceQuestion: {
      prompt: 'Why do English speakers say "knock on wood"?',
      options: [
        'To hope their current good fortune does not change',
        'To ask someone to open a door',
        'To show irritation with loud noise',
        'To test if a desk is real timber',
      ],
      correctIndex: 0,
      explanation: 'People say it superstitiously to avoid jinxing good luck.',
    },
  },
  {
    id: 'idiom-3-ball-court',
    dayIndex: 3,
    expression: 'The ball is in your court',
    meaning: 'It is now your turn or responsibility to make a decision or take the next step.',
    example: 'We sent our contract proposal yesterday; now the ball is in their court.',
    originOrContext: 'Tennis metaphor: when the ball is hit over the net into your court, you must play it.',
    practiceQuestion: {
      prompt: 'If a client says "the ball is in your court", what do they mean?',
      options: [
        'They are waiting for your next response or action',
        'They are inviting you to a sports match',
        'They rejected your proposal permanently',
        'They want to sign the papers immediately',
      ],
      correctIndex: 0,
      explanation: 'It indicates that the decision or initiative has been handed to you.',
    },
  },
  {
    id: 'idiom-4-break-ice',
    dayIndex: 4,
    expression: 'Break the ice',
    meaning: 'Make people feel relaxed and comfortable at the start of a conversation or meeting.',
    example: 'The trainer told a funny travel story to break the ice with the new trainees.',
    originOrContext: 'Icebreaker ships clearing paths for commerce in frozen winter harbours.',
    practiceQuestion: {
      prompt: 'What is an "icebreaker" activity in an English workshop?',
      options: [
        'A warm-up exercise to help people get to know each other',
        'A severe disciplinary test',
        'An outdoor winter sports exercise',
        'A technical presentation about logistics',
      ],
      correctIndex: 0,
      explanation: 'An icebreaker helps new acquaintances relax and begin communicating naturally.',
    },
  },
  {
    id: 'idiom-5-piece-cake',
    dayIndex: 5,
    expression: 'A piece of cake',
    meaning: 'Something very easy or effortless to accomplish.',
    example: 'Once you learn the regular verb rules, the grammar quiz is a piece of cake.',
    originOrContext: '19th century American expression celebrating pleasant, straightforward contests.',
    practiceQuestion: {
      prompt: 'If someone tells you an exam was "a piece of cake", they mean:',
      options: [
        'The exam was delightfully simple and easy',
        'The exam was about food and cooking',
        'The exam was terribly exhausting',
        'They were served snacks during the test',
      ],
      correctIndex: 0,
      explanation: '"A piece of cake" denotes an uncomplicated, easily accomplished task.',
    },
  },
  {
    id: 'idiom-6-back-drawing-board',
    dayIndex: 6,
    expression: 'Back to the drawing board',
    meaning: 'Start planning a project again from the beginning because the previous attempt failed.',
    example: 'Our initial marketing campaign didn’t gain traction, so it is back to the drawing board.',
    originOrContext: 'Peter Arno cartoon caption in The New Yorker (1941) showing an engineer walking away from a crashed airplane design.',
    practiceQuestion: {
      prompt: 'When would an engineering team go "back to the drawing board"?',
      options: [
        'When a prototype fails testing and requires a fresh design',
        'When they are celebrating a production release',
        'When they are drawing blueprints for fun',
        'When hiring a new graphic artist',
      ],
      correctIndex: 0,
      explanation: 'It signifies redesigning a strategy or idea from square one following a setback.',
    },
  },
];

export function getTodayIdiom(targetDate: Date = new Date()): DailyIdiom {
  const dateStr = getLocalDateString(targetDate);
  const seed = getDateSeed(dateStr);
  const index = seed % DAILY_IDIOMS.length;
  return DAILY_IDIOMS[index];
}

// ==========================================
// F. DAILY WORD PUZZLE
// ==========================================
export interface DailyWordPuzzle {
  id: string;
  dateStr: string;
  targetWord: string;
  clue: string;
  exampleContext: string;
  maskedPattern: string; // e.g. "C _ N F _ D _ N T"
  letterBank: string[]; // Shuffled letters including solution + 2 decoys
  cefrLevel: CEFRLevel;
  definition: string;
}

export const PUZZLE_WORDS_BANK = [
  { word: 'CONFIDENT', clue: 'Feeling sure about yourself and your speaking abilities.', cefr: 'A2' as CEFRLevel, def: 'Having self-assurance and certainty in your skills.' },
  { word: 'COLLEAGUE', clue: 'A person you work with in an office or company.', cefr: 'A1' as CEFRLevel, def: 'A coworker in a professional work environment.' },
  { word: 'PLEASURE', clue: 'A feeling of happy satisfaction: "It is a ______ to meet you."', cefr: 'A1' as CEFRLevel, def: 'Enjoyment, satisfaction, or polite hospitality.' },
  { word: 'SCHEDULE', clue: 'A plan of when events, flights, or meetings will happen.', cefr: 'A2' as CEFRLevel, def: 'A timetable of planned activities.' },
  { word: 'ACCURACY', clue: 'The quality of being correct, exact, and free from errors.', cefr: 'B1' as CEFRLevel, def: 'Precision and correctness in communication.' },
  { word: 'DEADLINE', clue: 'The latest date or time by which a project must be submitted.', cefr: 'B1' as CEFRLevel, def: 'A strict time limit for task completion.' },
  { word: 'GREETING', clue: 'A welcoming expression when meeting someone: "Good morning!"', cefr: 'A1' as CEFRLevel, def: 'A polite word or sign of welcome.' },
];

export function getDailyWordPuzzle(targetDate: Date = new Date()): DailyWordPuzzle {
  const dateStr = getLocalDateString(targetDate);
  const seed = getDateSeed(dateStr);
  const item = PUZZLE_WORDS_BANK[seed % PUZZLE_WORDS_BANK.length];

  // Mask some characters deterministically
  const word = item.word.toUpperCase();
  const maskedChars = word.split('').map((char, i) => {
    // Reveal first and some middle letters
    if (i === 0 || i === word.length - 1 || (i % 3 === 0)) return char;
    return '_';
  });

  // Letters needed + 2 decoy letters
  const decoys = ['X', 'Z', 'Q', 'K', 'W', 'V'];
  const decoy = decoys[seed % decoys.length];
  const allLetters = [...word.split(''), decoy].sort(() => 0.5 - Math.random());

  return {
    id: `puzzle-${dateStr}`,
    dateStr,
    targetWord: word,
    clue: item.clue,
    exampleContext: `Remember: with consistent English practice, mastery becomes second nature.`,
    maskedPattern: maskedChars.join(' '),
    letterBank: Array.from(new Set(allLetters)),
    cefrLevel: item.cefr,
    definition: item.def,
  };
}

// ==========================================
// H. SHORT LISTENING QUIZ
// ==========================================
export interface ListeningDialogue {
  id: string;
  title: string;
  audioText: string;
  speaker: string;
  transcript: string;
  questions: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
  cefrLevel: CEFRLevel;
  difficulty: PracticeDifficulty;
}

export const LISTENING_QUIZ_BANK: ListeningDialogue[] = [
  {
    id: 'lq-bakery-1',
    title: 'Morning Bakery Order',
    speaker: 'Bakery Assistant',
    audioText: 'Good morning! Welcome to St. Jude Bakery. Today our sourdough loaves and almond croissants are fresh out of the oven. What can I get started for you?',
    transcript: 'Good morning! Welcome to St. Jude Bakery. Today our sourdough loaves and almond croissants are fresh out of the oven. What can I get started for you?',
    questions: [
      {
        question: 'Which bakery items were specifically highlighted as fresh out of the oven?',
        options: ['Sourdough loaves and almond croissants', 'Blueberry muffins and bagels', 'Bagels and rye toast', 'Apple tarts and donuts'],
        correctIndex: 0,
        explanation: 'The assistant explicitly noted sourdough loaves and almond croissants.',
      },
      {
        question: 'What is the tone and intention of the speaker?',
        options: ['Welcoming and ready to take the customer order', 'Rushed and complaining about baking hours', 'Warning customers about item shortages', 'Strictly refusing custom orders'],
        correctIndex: 0,
        explanation: 'The greeting is warm and polite ("Good morning! Welcome... What can I get started for you?").',
      },
    ],
    cefrLevel: 'A2',
    difficulty: 'easy',
  },
  {
    id: 'lq-hotel-2',
    title: 'Hotel Check-in & Breakfast Times',
    speaker: 'Front Desk Receptionist',
    audioText: 'Good evening, Mr. Chen. Your deluxe room on the fifth floor is ready. Complimentary buffet breakfast is served on the mezzanine floor from 7:00 to 10:30 AM. Here is your digital keycard.',
    transcript: 'Good evening, Mr. Chen. Your deluxe room on the fifth floor is ready. Complimentary buffet breakfast is served on the mezzanine floor from 7:00 to 10:30 AM. Here is your digital keycard.',
    questions: [
      {
        question: 'What time does the complimentary breakfast service end?',
        options: ['10:30 AM', '11:00 AM', '9:30 AM', '8:00 AM'],
        correctIndex: 0,
        explanation: 'The receptionist clearly states breakfast is served from 7:00 to 10:30 AM.',
      },
      {
        question: 'Where is the guest room located?',
        options: ['Fifth floor', 'Mezzanine floor', 'Ground floor', 'Second floor'],
        correctIndex: 0,
        explanation: '"Your deluxe room on the fifth floor is ready."',
      },
    ],
    cefrLevel: 'B1',
    difficulty: 'medium',
  },
];

export function getListeningQuiz(difficulty: PracticeDifficulty = 'medium'): ListeningDialogue {
  const match = LISTENING_QUIZ_BANK.find((q) => q.difficulty === difficulty);
  return match || LISTENING_QUIZ_BANK[0];
}

// ==========================================
// I. SPEAKING PROMPT OF THE DAY
// ==========================================
export interface SpeakingPrompt {
  id: string;
  dateStr: string;
  title: string;
  promptDescription: string;
  starterPhrase: string;
  guidingQuestions: string[];
  suggestedPhrases: string[];
  cefrLevel: CEFRLevel;
}

export const SPEAKING_PROMPTS_BANK: SpeakingPrompt[] = [
  {
    id: 'sp-daily-habits',
    dateStr: '',
    title: 'Describe Your Ideal Weekend Morning',
    promptDescription: 'Speak or write 3 to 5 sentences describing what a peaceful, productive Saturday morning looks like for you.',
    starterPhrase: 'On my ideal weekend morning, I usually...',
    guidingQuestions: [
      'What time do you wake up?',
      'What do you like to drink or eat first?',
      'Do you prefer quiet indoor reading, exercise, or spending time with family?',
    ],
    suggestedPhrases: ['wake up without an alarm', 'enjoy a peaceful cup of coffee', 'take my time', 'head outdoors for a brisk walk'],
    cefrLevel: 'A2',
  },
  {
    id: 'sp-learning-journey',
    dateStr: '',
    title: 'Why You Are Learning English',
    promptDescription: 'Share your personal motivation for learning English and what fluency will enable you to do.',
    starterPhrase: 'I am learning English because...',
    guidingQuestions: [
      'Is your goal career growth, international travel, or making friends?',
      'Which English skill are you most excited to improve?',
      'How do you feel when you communicate successfully?',
    ],
    suggestedPhrases: ['connect with people globally', 'expand my career opportunities', 'express my ideas with confidence', 'step outside my comfort zone'],
    cefrLevel: 'B1',
  },
];

export function getTodaySpeakingPrompt(targetDate: Date = new Date()): SpeakingPrompt {
  const dateStr = getLocalDateString(targetDate);
  const seed = getDateSeed(dateStr);
  const prompt = SPEAKING_PROMPTS_BANK[seed % SPEAKING_PROMPTS_BANK.length];
  return { ...prompt, dateStr };
}

// ==========================================
// J. INTERVIEW QUESTION SPRINT
// ==========================================
export interface InterviewSprintQuestion {
  id: string;
  role: 'Software Engineer' | 'Product Manager' | 'Customer Success' | 'General Professional';
  question: string;
  starFrameworkTip: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  keyVocabulary: string[];
  cefrLevel: CEFRLevel;
  difficulty: PracticeDifficulty;
}

export const INTERVIEW_SPRINT_BANK: InterviewSprintQuestion[] = [
  {
    id: 'is-general-1',
    role: 'General Professional',
    question: 'Tell me about a time when you had to adapt quickly to an unexpected change.',
    starFrameworkTip: {
      situation: 'Briefly set the context (e.g. sudden scope shift or team departure).',
      task: 'Define your specific responsibility in managing the transition.',
      action: 'Detail the concrete steps you initiated to keep progress moving.',
      result: 'Quantify or highlight the positive outcome and what you learned.',
    },
    keyVocabulary: ['adapted', 'pivoted', 'prioritized', 'collaborated', 'delivered'],
    cefrLevel: 'B1',
    difficulty: 'medium',
  },
  {
    id: 'is-pm-1',
    role: 'Product Manager',
    question: 'How do you handle disagreement with senior engineering stakeholders on a product feature deadline?',
    starFrameworkTip: {
      situation: 'Describe an instance of divergent priorities between product and tech.',
      task: 'Your goal was aligning on a feasible scope without sacrificing reliability.',
      action: 'How did you facilitate data-driven tradeoffs and listen to engineering constraints?',
      result: 'What was the shared agreement reached and how did the project perform?',
    },
    keyVocabulary: ['stakeholder alignment', 'tradeoff analysis', 'consensus', 'scope adjustment', 'milestone'],
    cefrLevel: 'B2',
    difficulty: 'hard',
  },
  {
    id: 'is-eng-1',
    role: 'Software Engineer',
    question: 'Describe a complex technical bug you diagnosed under tight time pressure.',
    starFrameworkTip: {
      situation: 'Context: production issue, customer-facing latency, or build break.',
      task: 'What was your role in identifying root cause vs applying emergency patch?',
      action: 'Tools, profiling logs, reproduction steps, and architectural fix.',
      result: 'Reduced error rate, restored uptime, and prevented regression with tests.',
    },
    keyVocabulary: ['root cause', 'profiling', 'reproduction', 'mitigation', 'regression test', 'latency'],
    cefrLevel: 'B2',
    difficulty: 'hard',
  },
];

export function getInterviewSprintQuestions(
  role: InterviewSprintQuestion['role'] = 'General Professional',
  _difficulty: PracticeDifficulty = 'medium'
): InterviewSprintQuestion[] {
  const roleMatches = INTERVIEW_SPRINT_BANK.filter((q) => q.role === role);
  if (roleMatches.length > 0) return roleMatches;
  return INTERVIEW_SPRINT_BANK;
}
