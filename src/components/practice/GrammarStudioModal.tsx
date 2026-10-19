import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  RotateCw, 
  ArrowRight, 
  AlertTriangle,
  Award
} from 'lucide-react';
import type { PracticeDifficulty, PracticeSessionLength } from '../../types/practicePreferences';
import { SESSION_LENGTH_MINUTES } from '../../types/practicePreferences';
import { practiceRepository } from '../../db/practiceRepository';

export type GrammarExerciseType = 
  | 'choice' 
  | 'fill' 
  | 'correction' 
  | 'transformation' 
  | 'ordering' 
  | 'writing';

export interface GrammarTopic {
  id: string;
  title: string;
  category: 'tenses' | 'prepositions' | 'articles' | 'agreement' | 'modals';
  level: 'A1' | 'A2' | 'B1' | 'B2';
  rule: string;
  examples: string[];
  exercises: Array<{
    type: GrammarExerciseType;
    prompt: string;
    sentence?: string;
    options?: string[];
    correctAnswer: string | number;
    explanation: string;
    chips?: string[];
    errorPattern: 'tense consistency' | 'articles' | 'prepositions' | 'subject-verb agreement' | 'word order';
  }>;
}

export const GRAMMAR_STUDIO_TOPICS: GrammarTopic[] = [
  {
    id: 'present',
    title: 'Present Simple vs Present Continuous',
    category: 'tenses',
    level: 'A2',
    rule: 'Use Present Simple for regular routines and permanent facts. Use Present Continuous (am/is/are + -ing) for actions happening right now.',
    examples: [
      'Routine: She drinks coffee every morning.',
      'Right now: Look! She is carrying her umbrella.',
    ],
    exercises: [
      {
        type: 'choice',
        prompt: 'Select the correct verb form for the context:',
        sentence: 'Look! She _______ her umbrella because it is raining heavily.',
        options: ['carries', 'is carrying', 'carried'],
        correctAnswer: 1,
        explanation: "Because 'Look!' refers to an action occurring right at this moment, use the Present Continuous: 'is carrying'.",
        errorPattern: 'tense consistency',
      },
      {
        type: 'correction',
        prompt: 'Identify the error in this sentence and select the correct replacement:',
        sentence: 'He is usually walking to work on sunny mornings.',
        options: [
          'Change "walking" to "walks" (regular routine)',
          'Change "sunny" to "sun"',
          'Change "is" to "has"',
        ],
        correctAnswer: 0,
        explanation: "'Usually' indicates a regular routine or habit, requiring the Present Simple: 'He usually walks to work'.",
        errorPattern: 'tense consistency',
      },
      {
        type: 'ordering',
        prompt: 'Arrange the words in the correct order:',
        chips: ['She', 'is', 'studying', 'for', 'her', 'exam', 'right', 'now.'],
        correctAnswer: 'She is studying for her exam right now.',
        explanation: 'Standard English word order for continuous tense: Subject + auxiliary verb (is) + verb-ing + prepositional phrase + time marker.',
        errorPattern: 'word order',
      },
    ],
  },
  {
    id: 'prepositions',
    title: 'Prepositions of Time: In, On, At',
    category: 'prepositions',
    level: 'A1',
    rule: 'Use AT for exact clock times (at 3 PM, at noon). Use ON for specific days and dates (on Monday, on May 4th). Use IN for months, seasons, and years (in July, in 2026, in the morning).',
    examples: [
      'Exact time: The train leaves at 9:15 AM.',
      'Specific day: We meet on Tuesday mornings.',
      'Enclosed period: The festival takes place in October.',
    ],
    exercises: [
      {
        type: 'choice',
        prompt: 'Complete the sentence with the correct preposition:',
        sentence: 'We always have our weekly team meeting _______ Tuesday mornings.',
        options: ['at', 'in', 'on'],
        correctAnswer: 2,
        explanation: "Use 'on' with specific days of the week and dates: 'on Tuesday mornings'.",
        errorPattern: 'prepositions',
      },
      {
        type: 'fill',
        prompt: 'Choose the correct preposition to complete the sentence:',
        sentence: 'The concert starts promptly _______ eight o’clock tonight.',
        options: ['at', 'in', 'on'],
        correctAnswer: 0,
        explanation: "Use 'at' for precise clock times: 'at eight o'clock'.",
        errorPattern: 'prepositions',
      },
      {
        type: 'correction',
        prompt: 'Find and correct the preposition mistake:',
        sentence: 'I was born at 1998 in a small seaside town.',
        options: [
          'Change "at 1998" to "in 1998" (years require "in")',
          'Change "in a" to "on a"',
          'Change "was" to "is"',
        ],
        correctAnswer: 0,
        explanation: "Years, centuries, and long time periods require 'in' ('in 1998'), not 'at'.",
        errorPattern: 'prepositions',
      },
    ],
  },
  {
    id: 'articles',
    title: 'Definite vs Indefinite Articles (A, An, The, Zero)',
    category: 'articles',
    level: 'A2',
    rule: 'Use A/AN when introducing a non-specific singular countable noun for the first time. Use THE when both speaker and listener know which specific noun is being referred to. Use NO article (zero) for general plurals or uncountable nouns.',
    examples: [
      'First mention: I bought a book yesterday.',
      'Known reference: The book was fascinating.',
      'General plural: Cats are curious animals.',
    ],
    exercises: [
      {
        type: 'choice',
        prompt: 'Choose the correct article for this context:',
        sentence: 'Could you pass me _______ salt on the corner of the table?',
        options: ['a', 'the', 'an'],
        correctAnswer: 1,
        explanation: "Because both people can see and know which specific salt container is on the table, use the definite article 'the'.",
        errorPattern: 'articles',
      },
      {
        type: 'correction',
        prompt: 'Identify the article error:',
        sentence: 'She is an university professor teaching literature.',
        options: [
          'Change "an" to "a" ("university" begins with a consonant sound /j/)',
          'Change "literature" to "a literature"',
          'Remove "is"',
        ],
        correctAnswer: 0,
        explanation: "'University' begins with a consonant sound /juː/, so the correct indefinite article is 'a university', not 'an'.",
        errorPattern: 'articles',
      },
    ],
  },
  {
    id: 'agreement',
    title: 'Subject-Verb Agreement & Negation',
    category: 'agreement',
    level: 'A1',
    rule: 'Singular third-person subjects (he, she, it, singular nouns) take verbs ending in -s/es and auxiliary "does/doesn’t". Plural subjects and I/you/we/they take base verbs and "do/don’t".',
    examples: [
      'Positive: He likes classical music.',
      'Negative: He doesn’t like loud concerts.',
      'Question: Does she work here?',
    ],
    exercises: [
      {
        type: 'choice',
        prompt: 'Select the grammatically correct auxiliary verb:',
        sentence: 'My brother _______ know the directions to the library.',
        options: ["doesn't", "don't", 'isn’t'],
        correctAnswer: 0,
        explanation: "'My brother' is third-person singular (he), requiring 'doesn't know', not 'don't know'.",
        errorPattern: 'subject-verb agreement',
      },
      {
        type: 'transformation',
        prompt: 'Transform this sentence into a negative statement:',
        sentence: 'Emily plays the cello every evening.',
        options: [
          "Emily doesn't play the cello every evening.",
          "Emily don't plays the cello every evening.",
          "Emily isn't play the cello every evening.",
        ],
        correctAnswer: 0,
        explanation: "Negative Present Simple for third-person singular: does + not + base form of the verb ('play', without -s).",
        errorPattern: 'subject-verb agreement',
      },
    ],
  },
];

interface GrammarStudioModalProps {
  userId?: string;
  initialDifficulty?: PracticeDifficulty;
  initialSessionLength?: PracticeSessionLength;
  onClose: () => void;
  onNavigateToExplore?: () => void;
}

export const GrammarStudioModal: React.FC<GrammarStudioModalProps> = ({
  userId = 'local-learner-1',
  initialDifficulty = 'medium',
  initialSessionLength = 'standard',
  onClose,
  onNavigateToExplore: _onNavigateToExplore,
}) => {
  const [sessionDifficulty, setSessionDifficulty] = useState<PracticeDifficulty>(initialDifficulty);
  const [sessionLength, setSessionLength] = useState<PracticeSessionLength>(initialSessionLength);
  const [activeTopic, setActiveTopic] = useState<GrammarTopic>(GRAMMAR_STUDIO_TOPICS[0]);
  const [exerciseIndex, setExerciseIndex] = useState(0);

  // Exercise interaction states
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);

  // Chips ordering state
  const [orderedChips, setOrderedChips] = useState<string[]>([]);
  const [availableChips, setAvailableChips] = useState<string[]>([]);

  // Free-form writing state
  const [freeformInput, setFreeformInput] = useState('');
  const [freeformFeedback, setFreeformFeedback] = useState<{
    passed: boolean;
    issue?: string;
    correctedVersion: string;
    ruleInsight: string;
  } | null>(null);

  // Session score and error pattern tracking
  const [correctCount, setCorrectCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [recordedErrors, setRecordedErrors] = useState<string[]>([]);
  const [isSessionFinished, setIsSessionFinished] = useState(false);

  const currentExercise = activeTopic.exercises[exerciseIndex] || activeTopic.exercises[0];

  useEffect(() => {
    setSelectedOption(null);
    setIsChecked(false);
    setOrderedChips([]);
    const ex = activeTopic.exercises[exerciseIndex] || activeTopic.exercises[0];
    if (ex?.chips) {
      setAvailableChips([...ex.chips].sort(() => 0.5 - Math.random()));
    } else {
      setAvailableChips([]);
    }
    setFreeformInput('');
    setFreeformFeedback(null);
  }, [exerciseIndex, activeTopic]);

  const handleSwitchTopic = (topic: GrammarTopic) => {
    setActiveTopic(topic);
    setExerciseIndex(0);
  };

  // Chips helper
  const handleAddChip = (chip: string, idx: number) => {
    setOrderedChips((prev) => [...prev, chip]);
    setAvailableChips((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveChip = (chip: string, idx: number) => {
    setOrderedChips((prev) => prev.filter((_, i) => i !== idx));
    setAvailableChips((prev) => [...prev, chip]);
  };

  // Check answer for standard exercises
  const handleVerifyAnswer = () => {
    setIsChecked(true);
    let isCorrect = false;

    if (currentExercise.type === 'ordering') {
      const sentenceAttempt = orderedChips.join(' ');
      isCorrect = sentenceAttempt === currentExercise.correctAnswer;
    } else {
      isCorrect = selectedOption === currentExercise.correctAnswer;
    }

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setErrorCount((prev) => prev + 1);
      setRecordedErrors((prev) => [...prev, currentExercise.errorPattern]);
    }
  };

  // AI Free-form sentence evaluator
  const handleAnalyzeWriting = () => {
    const text = freeformInput.trim();
    if (!text) return;

    let passed = true;
    let issue = '';
    let corrected = text;

    // Intelligent heuristic grammar checks
    if (activeTopic.id === 'present') {
      if (text.toLowerCase().includes('he are') || text.toLowerCase().includes('she are')) {
        passed = false;
        issue = 'Subject-verb agreement mismatch with third-person singular.';
        corrected = text.replace(/he are/i, 'he is').replace(/she are/i, 'she is');
      } else if (text.toLowerCase().includes('is usually walk')) {
        passed = false;
        issue = 'Confusing Present Continuous with routine Present Simple.';
        corrected = text.replace(/is usually walk/i, 'usually walks');
      }
    } else if (activeTopic.id === 'prepositions') {
      if (text.toLowerCase().includes('at tuesday') || text.toLowerCase().includes('in tuesday')) {
        passed = false;
        issue = 'Incorrect preposition with days of the week.';
        corrected = text.replace(/at tuesday/i, 'on Tuesday').replace(/in tuesday/i, 'on Tuesday');
      }
    }

    if (!passed) {
      setErrorCount((prev) => prev + 1);
      setRecordedErrors((prev) => [...prev, activeTopic.category]);
    } else {
      setCorrectCount((prev) => prev + 1);
    }

    setFreeformFeedback({
      passed,
      issue: issue || undefined,
      correctedVersion: corrected.charAt(0).toUpperCase() + corrected.slice(1) + (corrected.endsWith('.') ? '' : '.'),
      ruleInsight: `Rule check: ${activeTopic.rule}`,
    });
  };

  // Move to next exercise or finish
  const handleNextExercise = () => {
    if (exerciseIndex + 1 < activeTopic.exercises.length) {
      setExerciseIndex((prev) => prev + 1);
    } else {
      finishGrammarSession();
    }
  };

  const finishGrammarSession = async () => {
    setIsSessionFinished(true);
    const total = correctCount + errorCount || 1;
    const scorePercent = Math.round((correctCount / total) * 100);

    try {
      await practiceRepository.recordSession({
        userId,
        category: 'grammar',
        activityId: `grammar-${activeTopic.id}`,
        difficulty: sessionDifficulty,
        sessionLength,
        durationMinutes: SESSION_LENGTH_MINUTES[sessionLength],
        score: scorePercent,
        notes: `Completed ${activeTopic.title}. Accuracy: ${scorePercent}%. Errors tracked: ${recordedErrors.join(', ') || 'None'}.`,
      });
    } catch (err) {
      console.warn('Failed to record grammar session:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Grammar Practice Studio — Key Rules & Diagnostic Practice"
    >
      <div className="relative w-full max-w-[560px] bg-white rounded-3xl shadow-2xl border border-[#D5D8EE] flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <header className="p-4 bg-white border-b border-[#ECEEFE] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D97706]">
                Grammar Studio
              </span>
              <h1 id="grammar-modal-title" className="text-[15px] font-black text-[#1C2046] leading-none">
                Key Rules & Diagnostic Practice
              </h1>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] text-[#222149] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close grammar studio"
          >
            <X className="w-4.5 h-4.5 stroke-[2.2]" />
          </button>
        </header>

        {/* Level & Duration Controls Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#F0F2FD] border-b border-[#E2E6FA] text-[11px] shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-[#545CA6] uppercase tracking-wider text-[10px]">Level:</span>
            {(['easy', 'medium', 'hard'] as PracticeDifficulty[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSessionDifficulty(lvl)}
                className={`px-2 py-0.5 rounded-md font-extrabold capitalize transition-all cursor-pointer text-[10.5px] ${
                  sessionDifficulty === lvl
                    ? 'bg-[#15164B] text-white shadow-xs'
                    : 'bg-white text-[#6B7094] border border-[#ECEEFE] hover:bg-[#F9F9FE]'
                }`}
                aria-label={`Select ${lvl} difficulty`}
              >
                {lvl}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-[#545CA6] uppercase tracking-wider text-[10px]">Time:</span>
            {(['quick', 'standard', 'extended'] as PracticeSessionLength[]).map((len) => (
              <button
                key={len}
                type="button"
                onClick={() => setSessionLength(len)}
                className={`px-2 py-0.5 rounded-md font-extrabold capitalize transition-all cursor-pointer text-[10.5px] ${
                  sessionLength === len
                    ? 'bg-[#545CA6] text-white shadow-xs'
                    : 'bg-white text-[#6B7094] border border-[#ECEEFE] hover:bg-[#F9F9FE]'
                }`}
              >
                {SESSION_LENGTH_MINUTES[len]}m
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!isSessionFinished ? (
            <>
              {/* Easy Mode Guided Clue */}
              {sessionDifficulty === 'easy' && (
                <div className="px-3.5 py-2 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[11.5px] text-[#92400E] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-[#D97706]" />
                  <span>Easy mode hint: Notice time cues in the sentence like "Look!" or "Tuesday mornings".</span>
                </div>
              )}

              {/* Topic Pills */}
              <div className="space-y-1">
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#8E93B8] block">
                  Select Grammar Topic
                </span>
                <div className="flex flex-wrap gap-1.5 py-0.5">
                  {GRAMMAR_STUDIO_TOPICS.map((top) => (
                    <button
                      key={top.id}
                      type="button"
                      onClick={() => handleSwitchTopic(top)}
                      className={`px-3 py-1.5 rounded-full text-[11.5px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                        activeTopic.id === top.id
                          ? 'bg-[#15164B] text-white shadow-xs'
                          : 'bg-white text-[#6B7094] border border-[#ECEEFE] hover:bg-[#F9F9FE]'
                      }`}
                    >
                      {top.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Core Grammar Rule Card */}
              <div className="p-4 rounded-3xl bg-white border border-[#ECEEFE] shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#545CA6] bg-[#ECEFFD] px-2.5 py-0.5 rounded-full">
                    Core Grammar Rule
                  </span>
                  <span className="text-[11px] font-bold text-[#8E93B8]">
                    CEFR {activeTopic.level}
                  </span>
                </div>
                <h3 className="text-[15px] font-extrabold text-[#15164B]">
                  {activeTopic.title}
                </h3>
                <p className="text-[13px] text-[#52577F] leading-relaxed">
                  {activeTopic.rule}
                </p>

                {/* Examples */}
                <div className="pt-2 border-t border-[#ECEEFE] space-y-1">
                  <span className="text-[11px] font-extrabold uppercase text-[#8E93B8] block">Examples:</span>
                  {activeTopic.examples.map((ex, i) => (
                    <p key={i} className="text-[12px] font-medium text-[#15164B] italic">
                      • {ex}
                    </p>
                  ))}
                </div>
              </div>

              {/* Diagnostic Exercise Card */}
              <div className="p-4 rounded-3xl bg-[#FAF9FE] border border-[#DEE3FA] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11.5px] font-extrabold text-[#15164B]">
                    Exercise {exerciseIndex + 1} of {activeTopic.exercises.length}: {currentExercise.prompt}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E93B8]">
                    {currentExercise.type}
                  </span>
                </div>

                {/* Sentence Prompt */}
                {currentExercise.sentence && (
                  <div className="p-3.5 rounded-2xl bg-white border border-[#D5D8EE] text-[14px] font-bold text-[#15164B] leading-relaxed">
                    {currentExercise.sentence}
                  </div>
                )}

                {/* Exercise Type 1: Multiple Choice / Fill / Transformation / Correction */}
                {currentExercise.options && (
                  <div className="space-y-2">
                    {currentExercise.options.map((opt, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrect = idx === currentExercise.correctAnswer;
                      let btnStyle = 'bg-white border-[#ECEEFE] text-[#15164B] hover:border-[#545CA6]';

                      if (isChecked) {
                        if (isCorrect) {
                          btnStyle = 'bg-[#ECFDF5] border-[#10B981] text-[#065F46] font-bold';
                        } else if (isSelected) {
                          btnStyle = 'bg-[#FEF2F2] border-[#EF4444] text-[#991B1B]';
                        } else {
                          btnStyle = 'bg-white border-[#ECEEFE] text-[#8E93B8] opacity-60';
                        }
                      } else if (isSelected) {
                        btnStyle = 'bg-[#15164B] text-white border-[#15164B] shadow-xs';
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => !isChecked && setSelectedOption(idx)}
                          disabled={isChecked}
                          className={`w-full p-3 rounded-2xl border text-left text-[13px] font-medium transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isChecked && isCorrect && <CheckCircle2 className="w-4 h-4 text-[#10B981]" />}
                          {isChecked && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-[#EF4444]" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Exercise Type 2: Sentence Ordering Chips */}
                {currentExercise.type === 'ordering' && currentExercise.chips && (
                  <div className="space-y-3">
                    {/* Ordered chips area */}
                    <div className="min-h-[50px] p-3 rounded-2xl bg-white border-2 border-dashed border-[#C5C9EB] flex flex-wrap gap-1.5 items-center">
                      {orderedChips.length === 0 ? (
                        <span className="text-[12px] text-[#8E93B8] italic">
                          Tap chips below to assemble the sentence...
                        </span>
                      ) : (
                        orderedChips.map((chip, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => !isChecked && handleRemoveChip(chip, idx)}
                            disabled={isChecked}
                            className="px-2.5 py-1 rounded-lg bg-[#15164B] text-white text-[12px] font-bold cursor-pointer"
                          >
                            {chip}
                          </button>
                        ))
                      )}
                    </div>

                    {/* Available chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {availableChips.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => !isChecked && handleAddChip(chip, idx)}
                          disabled={isChecked}
                          className="px-2.5 py-1 rounded-lg bg-white border border-[#D5D8EE] text-[#15164B] text-[12px] font-bold hover:border-[#545CA6] cursor-pointer shadow-xs"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exercise Type 3: Free-form Writing */}
                {currentExercise.type === 'writing' && (
                  <div className="space-y-3">
                    <textarea
                      value={freeformInput}
                      onChange={(e) => setFreeformInput(e.target.value)}
                      placeholder="Write your sentence here according to the rule..."
                      rows={3}
                      className="w-full p-3 rounded-2xl border border-[#D5D8EE] text-[13px] text-[#15164B] focus:border-[#545CA6] outline-hidden leading-relaxed shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAnalyzeWriting}
                      disabled={!freeformInput.trim()}
                      className="w-full py-2.5 rounded-full bg-[#15164B] hover:bg-[#0E1038] text-white text-[13px] font-bold disabled:opacity-50 cursor-pointer shadow-xs transition-all"
                    >
                      Analyze Sentence
                    </button>
                    {freeformFeedback && (
                      <div className={`p-3 rounded-2xl border text-[12px] space-y-1 ${freeformFeedback.passed ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]' : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'}`}>
                        <span className="font-extrabold block">{freeformFeedback.passed ? '✓ Correct Grammar' : '⚠ Grammatical Issue Detected'}</span>
                        {freeformFeedback.issue && <p>{freeformFeedback.issue}</p>}
                        <p className="font-medium italic">Corrected: "{freeformFeedback.correctedVersion}"</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Exercise Actions */}
                {!isChecked ? (
                  <button
                    type="button"
                    onClick={handleVerifyAnswer}
                    disabled={selectedOption === null && orderedChips.length === 0}
                    className="w-full py-2.5 rounded-full bg-[#15164B] hover:bg-[#0E1038] text-white text-[13px] font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    Check Answer
                  </button>
                ) : (
                  <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                    <div className="p-3 rounded-2xl bg-white border border-[#DEE3FA] text-[12px] space-y-1">
                      <span className="font-extrabold text-[#15164B] block">
                        Grammar Explanation:
                      </span>
                      <p className="text-[#52577F] leading-relaxed">
                        {currentExercise.explanation}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleNextExercise}
                      className="w-full py-2.5 rounded-full bg-[#545CA6] hover:bg-[#434B8F] text-white text-[13px] font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>{exerciseIndex + 1 < activeTopic.exercises.length ? 'Next Exercise' : 'Finish Topic'}</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.4]" />
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* SCORECARD & ERROR PATTERNS REPORT */
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center space-y-1.5 pt-2">
                <div className="w-12 h-12 rounded-2xl bg-[#FFFBEB] text-[#D97706] flex items-center justify-center mx-auto shadow-xs">
                  <Award className="w-6 h-6 stroke-[2.4]" />
                </div>
                <h3 className="text-[19px] font-black text-[#15164B]">
                  Grammar Practice Complete!
                </h3>
                <p className="text-[12px] text-[#6B7094] max-w-[340px] mx-auto">
                  Diagnostic evaluation of grammar rules and recurring error patterns.
                </p>
              </div>

              {/* Score metrics */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-2xl bg-white border border-[#DEE3FA] text-center shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase text-[#8E93B8] block">Accuracy</span>
                  <span className="text-[18px] font-black text-[#15164B]">
                    {Math.round((correctCount / (correctCount + errorCount || 1)) * 100)}%
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-center shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase text-[#059669] block">Mastered</span>
                  <span className="text-[18px] font-black text-[#059669]">{correctCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-center shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase text-[#DC2626] block">To Review</span>
                  <span className="text-[18px] font-black text-[#DC2626]">{errorCount}</span>
                </div>
              </div>

              {/* Tracked Recurring Mistakes */}
              <div className="p-4 rounded-2xl bg-white border border-[#ECEEFE] space-y-2">
                <div className="flex items-center gap-1.5 text-[12.5px] font-extrabold text-[#15164B]">
                  <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                  <span>Grammar Error Pattern Analysis:</span>
                </div>
                {recordedErrors.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(new Set(recordedErrors)).map((pat, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] text-[11.5px] font-bold capitalize"
                      >
                        {pat}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-[#059669] font-medium">
                    ✓ Clean score! No repeated grammar errors detected in this session.
                  </p>
                )}
              </div>

              {/* Recommended Next Step */}
              <div className="p-4 rounded-2xl bg-[#FAF9FE] border border-[#DEE3FA] space-y-2 text-[12px] text-[#52577F]">
                <span className="font-extrabold text-[#15164B] block text-[12.5px]">
                  Targeted Next Step:
                </span>
                <p>
                  Practice using <strong className="text-[#15164B]">{activeTopic.title}</strong> in open dialogue inside Conversation Studio, or review related vocabulary phrases in your Vocabulary Notebook.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="p-4 bg-white border-t border-[#ECEEFE] flex items-center justify-between shrink-0">
          {!isSessionFinished ? (
            <>
              <button
                type="button"
                onClick={finishGrammarSession}
                className="text-[12px] font-bold text-[#6B7094] hover:text-[#15164B] transition-colors cursor-pointer"
              >
                End Session Early
              </button>

              <button
                type="button"
                onClick={handleNextExercise}
                className="px-4 py-2 rounded-full bg-[#15164B] hover:bg-[#0E1038] text-white text-[12px] font-bold transition-all shadow-xs cursor-pointer"
              >
                Skip
              </button>
            </>
          ) : (
            <div className="flex items-center justify-end w-full gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsSessionFinished(false);
                  setExerciseIndex(0);
                  setCorrectCount(0);
                  setErrorCount(0);
                }}
                className="px-3.5 py-1.5 rounded-full border border-[#D5D8EE] text-[#15164B] text-[12px] font-bold hover:bg-[#F0F2FD] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Retry Topic</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-1.5 rounded-full bg-[#15164B] text-white text-[12px] font-bold hover:bg-[#0E1038] transition-all cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
};
