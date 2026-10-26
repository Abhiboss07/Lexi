import type { AssessmentQuestion } from '../types/assessment';

/**
 * Validated CEFR Assessment Questions Dataset
 * Multi-skill coverage: Grammar, Vocabulary, Reading Comprehension, Listening Comprehension
 * Structured into Stage 1 (Core Calibration) and Stage 2 (Adaptive Extensions: A1 Foundational, A2 Consolidating, B1/B2 Advanced)
 */

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  // ==========================================
  // STAGE 1: CORE CALIBRATION (A1 / A2)
  // ==========================================

  // 1. Grammar - Present Simple & Subject-Verb Agreement (A1)
  {
    id: 'stage1-gram-1',
    skill: 'grammar',
    cefrLevel: 'A1',
    stage: 1,
    prompt: 'Choose the correct word to complete the sentence:\n"Sarah _______ coffee every morning before work."',
    options: ['drink', 'drinks', 'drinking', 'is drink'],
    correctIndex: 1,
    explanation: 'In the present simple with third-person singular subjects ("Sarah" / "she"), we add "-s" to the base verb ("drinks").',
    focusArea: 'Present Simple Subject-Verb Agreement',
  },

  // 2. Grammar - Past Simple Irregular Verbs (A2)
  {
    id: 'stage1-gram-2',
    skill: 'grammar',
    cefrLevel: 'A2',
    stage: 1,
    prompt: 'Choose the correct past tense form:\n"Last Saturday, we _______ an exciting football match at the stadium."',
    options: ['saw', 'see', 'have seen', 'seen'],
    correctIndex: 0,
    explanation: '"Last Saturday" indicates a finished past time requiring the simple past form "saw". "Have seen" is present perfect and cannot be used with specific past time markers.',
    focusArea: 'Past Simple with Definite Past Time',
  },

  // 3. Vocabulary - Daily Life & Public Services (A1)
  {
    id: 'stage1-vocab-1',
    skill: 'vocabulary',
    cefrLevel: 'A1',
    stage: 1,
    prompt: 'Select the correct word:\n"You can buy medicine and personal healthcare items at a _______."',
    options: ['bakery', 'pharmacy', 'library', 'museum'],
    correctIndex: 1,
    explanation: 'A pharmacy (or chemist) is a shop where medicine and healthcare products are dispensed and sold.',
    focusArea: 'Everyday Public Places & Services',
  },

  // 4. Vocabulary - Essential Collocations (A2)
  {
    id: 'stage1-vocab-2',
    skill: 'vocabulary',
    cefrLevel: 'A2',
    stage: 1,
    prompt: 'Select the verb that correctly completes the collocation:\n"Don\'t worry if you _______ a mistake; it\'s part of learning."',
    options: ['do', 'make', 'create', 'build'],
    correctIndex: 1,
    explanation: 'In English, we say "make a mistake" (collocation), not "do a mistake".',
    focusArea: 'Make vs Do Collocations',
  },

  // 5. Reading Comprehension - Practical Notice (A1)
  {
    id: 'stage1-read-1',
    skill: 'reading',
    cefrLevel: 'A1',
    stage: 1,
    contextPassage:
      'LIBRARY HOURS NOTICE\nMonday – Thursday: 9:00 AM – 8:00 PM\nFriday – Saturday: 10:00 AM – 5:00 PM\nSunday: CLOSED\n\nBooks can be returned in the outside drop-box 24/7.',
    prompt: 'According to the notice, what time does the library close on Friday?',
    options: ['8:00 PM', '5:00 PM', '9:00 AM', 'It is closed all day'],
    correctIndex: 1,
    explanation: 'The notice clearly states that Friday – Saturday hours are 10:00 AM – 5:00 PM.',
    focusArea: 'Locating Direct Information in Public Notices',
  },

  // 6. Reading Comprehension - Email Invitation (A2)
  {
    id: 'stage1-read-2',
    skill: 'reading',
    cefrLevel: 'A2',
    stage: 1,
    contextPassage:
      'Hi Liam,\n\nAre you free this Thursday evening? A few of us from the marketing team are meeting at the Riverside Café around 6:30 PM to celebrate Maya’s promotion.\n\nWe’re ordering pizza to share, but please bring your own dessert if you want something sweet. Let me know by Wednesday so I can reserve a large table!\n\nBest,\nElena',
    prompt: 'What should Liam do if he wants dessert?',
    options: [
      'Order pizza first',
      'Pay Elena by Wednesday',
      'Bring his own sweet food',
      'Reserve a table at the café',
    ],
    correctIndex: 2,
    explanation: 'Elena writes: "please bring your own dessert if you want something sweet."',
    focusArea: 'Understanding Specific Practical Conditions in Emails',
  },

  // 7. Listening Comprehension - Train Delay Announcement (A1)
  {
    id: 'stage1-list-1',
    skill: 'listening',
    cefrLevel: 'A1',
    stage: 1,
    audioScript:
      'Attention all passengers on Platform 2. The 11:15 regional train to Brighton is delayed by 10 minutes due to heavy rain. Please stand behind the yellow line.',
    prompt: 'Why is the 11:15 train to Brighton delayed?',
    options: ['Heavy rain', 'Signal maintenance', 'Luggage inspection', 'Staff shortage'],
    correctIndex: 0,
    explanation: 'The announcement clearly mentions the train is delayed "due to heavy rain".',
    focusArea: 'Extracting Direct Key Facts from Public Audio',
  },

  // 8. Listening Comprehension - Café Customer Request (A2)
  {
    id: 'stage1-list-2',
    skill: 'listening',
    cefrLevel: 'A2',
    stage: 1,
    audioScript:
      'Hi there! Could I please get a medium oat milk latte with two brown sugars to go? And could you warm up a blueberry muffin as well?',
    prompt: 'What type of milk did the customer order in their latte?',
    options: ['Whole milk', 'Almond milk', 'Oat milk', 'Soy milk'],
    correctIndex: 2,
    explanation: 'The customer explicitly requested a "medium oat milk latte".',
    focusArea: 'Understanding Specific Preferences in Conversational Audio',
  },

  // ==========================================
  // STAGE 2: ADVANCED EXTENSION (B1 / B2)
  // Triggered when Stage 1 score >= 75%
  // ==========================================

  // 9. Grammar - Present Perfect with For/Since (B1)
  {
    id: 'stage2-high-gram-1',
    skill: 'grammar',
    cefrLevel: 'B1',
    stage: 2,
    prompt: 'Choose the correct verb form:\n"Julian and I _______ close friends since our first semester at university."',
    options: ['are', 'were', 'have been', 'had been'],
    correctIndex: 2,
    explanation: '"Since" marks the beginning of an ongoing situation from the past extending into the present, which requires the Present Perfect ("have been").',
    focusArea: 'Present Perfect for Continuing States',
  },

  // 10. Grammar - Third Conditional & Regret (B2)
  {
    id: 'stage2-high-gram-2',
    skill: 'grammar',
    cefrLevel: 'B2',
    stage: 2,
    prompt: 'Choose the correct grammatical completion:\n"If the weather forecast _______ more accurate, we would never have embarked on the hiking trail."',
    options: ['was', 'were', 'had been', 'would be'],
    correctIndex: 2,
    explanation: 'In the third conditional (hypothetical past), the if-clause uses the past perfect ("had been") and the main clause uses "would have + past participle".',
    focusArea: 'Third Conditional Construction',
  },

  // 11. Vocabulary - Contextual Precision & Register (B1)
  {
    id: 'stage2-high-vocab-1',
    skill: 'vocabulary',
    cefrLevel: 'B1',
    stage: 2,
    prompt: 'Select the most appropriate word:\n"The project manager decided to _______ the launch date until all security audits were signed off."',
    options: ['postpone', 'cancel', 'expire', 'abandon'],
    correctIndex: 0,
    explanation: '"Postpone" means to delay an event to a later time. The context indicates a planned delay until conditions are met, not permanent cancellation or abandonment.',
    focusArea: 'Precise Contextual Vocabulary in Professional Settings',
  },

  // 12. Vocabulary - Idiomatic Fluency & Nuance (B2)
  {
    id: 'stage2-high-vocab-2',
    skill: 'vocabulary',
    cefrLevel: 'B2',
    stage: 2,
    prompt: 'Choose the idiom that means to accept the unpleasant consequences of one\'s actions:\n"After failing to submit the quarterly audit, the director had to _______ in front of the board."',
    options: [
      'face the music',
      'beat around the bush',
      'hit the nail on the head',
      'spill the beans',
    ],
    correctIndex: 0,
    explanation: '"To face the music" is a common idiomatic expression meaning to confront the unpleasant results or criticism of one\'s actions.',
    focusArea: 'Idiomatic Expressions and Figurative Language',
  },

  // 13. Reading Comprehension - Workplace Policy Editorial (B1/B2)
  {
    id: 'stage2-high-read-1',
    skill: 'reading',
    cefrLevel: 'B2',
    stage: 2,
    contextPassage:
      'While hybrid working models have undeniably offered unprecedented autonomy, recent cross-sector surveys reveal an emergent drawback: asynchronous fatigue. When team members operate across divergent schedules without established communication covenants, the expectation of round-the-clock responsiveness subtly creeps in. Paradoxically, flexibility can lead to heightened cognitive load unless organizations enforce explicit boundaries between availability and collaborative synthesis.',
    prompt: 'According to the passage, what paradox is associated with asynchronous hybrid work?',
    options: [
      'Workers earn less despite working longer hours.',
      'Flexibility can increase mental burden without established communication boundaries.',
      'Employees spend too much time traveling between physical offices.',
      'Technological automation eliminates the need for human team members.',
    ],
    correctIndex: 1,
    explanation: 'The passage argues that paradoxically, flexibility can increase cognitive load (mental fatigue) unless explicit availability boundaries are maintained.',
    focusArea: 'Analyzing Complex Synthesized Arguments & Inferences',
  },

  // 14. Listening Comprehension - Engineering Standup Update (B2)
  {
    id: 'stage2-high-list-1',
    skill: 'listening',
    cefrLevel: 'B2',
    stage: 2,
    audioScript:
      'Morning everyone. Quick update on the checkout pipeline refactor: benchmark testing revealed that caching query results reduced API latency by 45 percent, but created a data consistency bottleneck in high-concurrency payment gateways. To prevent race conditions, we are implementing a distributed lock mechanism before pushing to the staging environment this afternoon.',
    prompt: 'What unexpected technical challenge arose from the 45% latency reduction?',
    options: [
      'The servers completely crashed during peak hours.',
      'Data consistency bottlenecks in high-concurrency payment gateways.',
      'The team ran out of database storage capacity.',
      'Payment gateways were deprecated by third-party vendors.',
    ],
    correctIndex: 1,
    explanation: 'The speaker states: "caching query results reduced API latency by 45 percent, but created a data consistency bottleneck in high-concurrency payment gateways."',
    focusArea: 'Understanding Technical Reasoning and Cause-Effect Relationships',
  },

  // ==========================================
  // STAGE 2: FOUNDATIONAL A1 DIAGNOSTIC
  // Triggered when Stage 1 score < 50%
  // ==========================================

  // 15. Grammar - Verb "To Be" (A1)
  {
    id: 'stage2-low-gram-1',
    skill: 'grammar',
    cefrLevel: 'A1',
    stage: 2,
    prompt: 'Choose the correct word to complete the sentence:\n"They _______ students from Canada."',
    options: ['is', 'are', 'am', 'be'],
    correctIndex: 1,
    explanation: 'With plural pronoun "they", the correct present form of the verb "to be" is "are".',
    focusArea: 'Verb "To Be" Pronoun Agreement',
  },

  // 16. Vocabulary - Basic Numbers & Time (A1)
  {
    id: 'stage2-low-vocab-1',
    skill: 'vocabulary',
    cefrLevel: 'A1',
    stage: 2,
    prompt: 'Select the correct phrase for the time "7:45":',
    options: ['Quarter past seven', 'Quarter to eight', 'Half past seven', 'Seven forty-fifteen'],
    correctIndex: 1,
    explanation: '7:45 means 15 minutes before 8:00, which in English is commonly expressed as "a quarter to eight".',
    focusArea: 'Time Expressions and Numbers',
  },

  // 17. Reading - Short Shopping Receipt (A1)
  {
    id: 'stage2-low-read-1',
    skill: 'reading',
    cefrLevel: 'A1',
    stage: 2,
    contextPassage:
      'CITY GROCERY\n1x Milk ......... $2.50\n2x Apples ....... $3.00\n1x Bread ........ $2.00\nTOTAL: $7.50\nPaid with Cash: $10.00\nChange: $2.50',
    prompt: 'How much did the bread cost?',
    options: ['$2.00', '$2.50', '$3.00', '$7.50'],
    correctIndex: 0,
    explanation: 'The receipt lists "1x Bread ......... $2.00".',
    focusArea: 'Locating Numeric Data in Everyday Receipts',
  },

  // 18. Listening - Simple Greeting & Name (A1)
  {
    id: 'stage2-low-list-1',
    skill: 'listening',
    cefrLevel: 'A1',
    stage: 2,
    audioScript: 'Hello! My name is David, and I am your English teacher for the semester. Nice to meet you all.',
    prompt: 'What is the teacher\'s name?',
    options: ['Daniel', 'David', 'Derek', 'Dylan'],
    correctIndex: 1,
    explanation: 'The speaker introduces himself: "My name is David".',
    focusArea: 'Recognizing Names and Introductions in Spoken English',
  },

  // ==========================================
  // STAGE 2: MID-TIER A2 CONSOLIDATING
  // Triggered when Stage 1 score is 50% - 74%
  // ==========================================

  // 19. Grammar - Comparative Adjectives (A2)
  {
    id: 'stage2-mid-gram-1',
    skill: 'grammar',
    cefrLevel: 'A2',
    stage: 2,
    prompt: 'Choose the correct comparative form:\n"Traveling by train is usually _______ than driving during rush hour."',
    options: ['more fast', 'faster', 'fastest', 'more faster'],
    correctIndex: 1,
    explanation: 'For short one-syllable adjectives like "fast", the comparative form adds "-er" ("faster").',
    focusArea: 'Comparative Adjectives Structure',
  },

  // 20. Vocabulary - Transport & Direction Phrases (A2)
  {
    id: 'stage2-mid-vocab-1',
    skill: 'vocabulary',
    cefrLevel: 'A2',
    stage: 2,
    prompt: 'Select the correct preposition:\n"Go straight ahead and turn right _______ the second traffic lights."',
    options: ['at', 'on', 'in', 'to'],
    correctIndex: 0,
    explanation: 'We use the preposition "at" to specify exact locations and turning points ("at the traffic lights", "at the corner").',
    focusArea: 'Prepositions of Direction and Position',
  },

  // 21. Reading - Hotel Confirmation Details (A2)
  {
    id: 'stage2-mid-read-1',
    skill: 'reading',
    cefrLevel: 'A2',
    stage: 2,
    contextPassage:
      'RESERVATION SUMMARY\nGuest: Lucas Silva\nCheck-in: 3:00 PM (Oct 24)\nCheck-out: 11:00 AM (Oct 27)\nRoom: Deluxe Queen, Non-smoking\nNote: Complimentary Wi-Fi is included in all rooms. Parking is available for an additional $15 per day.',
    prompt: 'What is free for hotel guests according to the summary?',
    options: ['Daily parking', 'Deluxe room upgrade', 'Wi-Fi internet access', 'Breakfast'],
    correctIndex: 2,
    explanation: 'The reservation summary states: "Complimentary Wi-Fi is included in all rooms." Complimentary means free of charge.',
    focusArea: 'Understanding Included Amenities and Surcharges',
  },

  // 22. Listening - Doctor\'s Medication Instructions (A2)
  {
    id: 'stage2-mid-list-1',
    skill: 'listening',
    cefrLevel: 'A2',
    stage: 2,
    audioScript:
      'Please take two capsules with water twice a day after your meals, once in the morning and once in the evening, for five days.',
    prompt: 'How many times per day should the patient take the capsules?',
    options: ['Once a day', 'Twice a day', 'Three times a day', 'Only when in pain'],
    correctIndex: 1,
    explanation: 'The instruction states: "Please take two capsules with water twice a day after your meals".',
    focusArea: 'Following Medical Dosage and Frequency Instructions',
  },
];

/**
 * Returns initial calibration questions for Stage 1.
 */
export function getStage1CalibrationQuestions(): AssessmentQuestion[] {
  return ASSESSMENT_QUESTIONS.filter((q) => q.stage === 1);
}

/**
 * Selects Stage 2 adaptive branch questions based on Stage 1 accuracy.
 * - Score >= 75%: High branch (B1/B2 challenge)
 * - Score < 50%: Foundational branch (A1 core diagnostic)
 * - Score 50%-74%: Mid branch (A2 consolidation)
 */
export function getStage2AdaptiveQuestions(stage1AccuracyPercent: number): AssessmentQuestion[] {
  if (stage1AccuracyPercent >= 75) {
    return ASSESSMENT_QUESTIONS.filter((q) => q.stage === 2 && q.id.startsWith('stage2-high'));
  }
  if (stage1AccuracyPercent < 50) {
    return ASSESSMENT_QUESTIONS.filter((q) => q.stage === 2 && q.id.startsWith('stage2-low'));
  }
  return ASSESSMENT_QUESTIONS.filter((q) => q.stage === 2 && q.id.startsWith('stage2-mid'));
}

/**
 * Skill-specific assessment questions for focused diagnostic checks.
 */
export function getQuestionsForSkill(skill: 'grammar' | 'vocabulary' | 'reading' | 'listening'): AssessmentQuestion[] {
  return ASSESSMENT_QUESTIONS.filter((q) => q.skill === skill);
}
