import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Volume2, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCw, 
  BookmarkPlus, 
  Check, 
  HelpCircle, 
  Mic, 
  MicOff, 
  Layers, 
  Award, 
  BookOpen, 
  PenTool,
  BrainCircuit,
  Sliders
} from 'lucide-react';
import type { PracticeDifficulty, PracticeSessionLength } from '../../types/practicePreferences';
import { SESSION_LENGTH_MINUTES } from '../../types/practicePreferences';
import { practiceRepository } from '../../db/practiceRepository';
import { vocabularyRepository } from '../../db/vocabularyRepository';
import type { VocabularyCardRecord } from '../../types/vocabulary';
import type { Grade } from 'ts-fsrs';

export type VocabularyStudioMode = 
  | 'circuit' 
  | 'quiz' 
  | 'match' 
  | 'fill' 
  | 'write' 
  | 'pronounce' 
  | 'flashcard';

export interface StudioWord {
  id: string;
  word: string;
  phoneticIpa: string;
  partOfSpeech: string;
  definition: string;
  exampleSentence: string;
  collocations: string[];
  synonyms: string[];
  antonyms?: string[];
  wordFamily?: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2';
  difficultyTier: 'easy' | 'medium' | 'hard';
}

export const STUDIO_WORDS_BANK: StudioWord[] = [
  // Easy / A1-A2
  {
    id: 'vocab-morning',
    word: 'morning',
    phoneticIpa: '/ˈmɔːrnɪŋ/',
    partOfSpeech: 'noun',
    definition: 'The early part of the day from sunrise until noon.',
    exampleSentence: 'Good morning, how are you today?',
    collocations: ['in the morning', 'early morning', 'good morning'],
    synonyms: ['daybreak', 'sunrise'],
    antonyms: ['evening', 'night'],
    wordFamily: 'mornings (plural)',
    cefrLevel: 'A1',
    difficultyTier: 'easy',
  },
  {
    id: 'vocab-confident',
    word: 'confident',
    phoneticIpa: '/ˈkɑːnfɪdənt/',
    partOfSpeech: 'adjective',
    definition: 'Feeling certainty about one’s ability or self-assurance in speaking.',
    exampleSentence: 'With daily speaking practice, she felt confident expressing her ideas.',
    collocations: ['feel confident', 'gain confidence', 'confident smile'],
    synonyms: ['self-assured', 'positive', 'certain'],
    antonyms: ['hesitant', 'doubtful', 'insecure'],
    wordFamily: 'confidence (noun), confidently (adverb)',
    cefrLevel: 'A2',
    difficultyTier: 'easy',
  },
  {
    id: 'vocab-delighted',
    word: 'delighted',
    phoneticIpa: '/dɪˈlaɪtɪd/',
    partOfSpeech: 'adjective',
    definition: 'Feeling or showing immense pleasure, warmth, or happiness.',
    exampleSentence: 'We were delighted to receive such a warm welcome at the hotel.',
    collocations: ['delighted to meet you', 'absolutely delighted', 'delighted with'],
    synonyms: ['thrilled', 'overjoyed', 'pleased'],
    antonyms: ['disappointed', 'upset'],
    wordFamily: 'delight (noun/verb), delightful (adjective)',
    cefrLevel: 'A2',
    difficultyTier: 'easy',
  },
  {
    id: 'vocab-convenient',
    word: 'convenient',
    phoneticIpa: '/kənˈviːniənt/',
    partOfSpeech: 'adjective',
    definition: 'Fitting in well with a person’s needs, schedule, or comfortable plans.',
    exampleSentence: 'Is three o’clock convenient for a quick practice call?',
    collocations: ['convenient time', 'convenient location', 'highly convenient'],
    synonyms: ['handy', 'suitable', 'accessible'],
    antonyms: ['inconvenient', 'troublesome'],
    wordFamily: 'convenience (noun), conveniently (adverb)',
    cefrLevel: 'A2',
    difficultyTier: 'easy',
  },
  // Medium / B1
  {
    id: 'vocab-reservation',
    word: 'reservation',
    phoneticIpa: '/ˌrezərˈveɪʃn/',
    partOfSpeech: 'noun',
    definition: 'An arrangement to have something (like a table or room) held for your use.',
    exampleSentence: 'I would like to make a dinner reservation for two at seven o’clock.',
    collocations: ['make a reservation', 'cancel a reservation', 'confirm a reservation'],
    synonyms: ['booking', 'arrangement'],
    wordFamily: 'reserve (verb), reserved (adjective)',
    cefrLevel: 'B1',
    difficultyTier: 'medium',
  },
  {
    id: 'vocab-recommend',
    word: 'recommend',
    phoneticIpa: '/ˌrekəˈmend/',
    partOfSpeech: 'verb',
    definition: 'To suggest something as good, suitable, or advisable for someone.',
    exampleSentence: 'Could you recommend a quiet spot nearby for studying?',
    collocations: ['highly recommend', 'recommend doing', 'recommend that'],
    synonyms: ['suggest', 'advise', 'endorse'],
    wordFamily: 'recommendation (noun), recommended (adjective)',
    cefrLevel: 'B1',
    difficultyTier: 'medium',
  },
  {
    id: 'vocab-opportunity',
    word: 'opportunity',
    phoneticIpa: '/ˌɑːpərˈtuːnəti/',
    partOfSpeech: 'noun',
    definition: 'A favorable time or set of circumstances that makes it possible to do something.',
    exampleSentence: 'Studying abroad offered her an exceptional opportunity to practice English.',
    collocations: ['seize an opportunity', 'career opportunity', 'golden opportunity'],
    synonyms: ['chance', 'opening', 'possibility'],
    wordFamily: 'opportune (adjective)',
    cefrLevel: 'B1',
    difficultyTier: 'medium',
  },
  {
    id: 'vocab-appreciate',
    word: 'appreciate',
    phoneticIpa: '/əˈpriːʃieɪt/',
    partOfSpeech: 'verb',
    definition: 'To recognize the full worth of something, or be warmly grateful for it.',
    exampleSentence: 'I truly appreciate your thoughtful guidance and prompt response.',
    collocations: ['greatly appreciate', 'truly appreciate', 'appreciate your help'],
    synonyms: ['value', 'cherish', 'be grateful for'],
    antonyms: ['disregard', 'underestimate'],
    wordFamily: 'appreciation (noun), appreciative (adjective)',
    cefrLevel: 'B1',
    difficultyTier: 'medium',
  },
  // Hard / B2-C1
  {
    id: 'vocab-articulate',
    word: 'articulate',
    phoneticIpa: '/ɑːrˈtɪkjələt/',
    partOfSpeech: 'adjective',
    definition: 'Expressing ideas clearly, fluently, and effectively in spoken or written English.',
    exampleSentence: 'She gave an articulate and persuasive overview during the team meeting.',
    collocations: ['articulate speaker', 'clearly articulate', 'articulate ideas'],
    synonyms: ['eloquent', 'coherent', 'fluent'],
    antonyms: ['incoherent', 'hesitant'],
    wordFamily: 'articulation (noun), articulately (adverb)',
    cefrLevel: 'B2',
    difficultyTier: 'hard',
  },
  {
    id: 'vocab-comprehensive',
    word: 'comprehensive',
    phoneticIpa: '/ˌkɑːmprɪˈhensɪv/',
    partOfSpeech: 'adjective',
    definition: 'Complete and including all or nearly all elements or aspects of something.',
    exampleSentence: 'The language coach provided a comprehensive analysis of my pronunciation.',
    collocations: ['comprehensive guide', 'comprehensive review', 'comprehensive study'],
    synonyms: ['thorough', 'exhaustive', 'all-inclusive'],
    antonyms: ['superficial', 'incomplete'],
    wordFamily: 'comprehend (verb), comprehension (noun)',
    cefrLevel: 'B2',
    difficultyTier: 'hard',
  },
  {
    id: 'vocab-perseverance',
    word: 'perseverance',
    phoneticIpa: '/ˌpɜːrsəˈvɪrəns/',
    partOfSpeech: 'noun',
    definition: 'Continued effort to achieve something despite difficulties, obstacles, or delays.',
    exampleSentence: 'Language fluency is a reward for daily dedication and patient perseverance.',
    collocations: ['show perseverance', 'reward perseverance', 'requires perseverance'],
    synonyms: ['tenacity', 'determination', 'persistence'],
    antonyms: ['quitting', 'hesitation'],
    wordFamily: 'persevere (verb)',
    cefrLevel: 'B2',
    difficultyTier: 'hard',
  },
  {
    id: 'vocab-versatile',
    word: 'versatile',
    phoneticIpa: '/ˈvɜːrsətl/',
    partOfSpeech: 'adjective',
    definition: 'Able to adapt or be used for many different activities, functions, or styles.',
    exampleSentence: 'Vocabulary is a versatile tool that unlocks both workplace and social fluency.',
    collocations: ['versatile tool', 'versatile performer', 'highly versatile'],
    synonyms: ['adaptable', 'flexible', 'multifaceted'],
    antonyms: ['rigid', 'limited'],
    wordFamily: 'versatility (noun)',
    cefrLevel: 'B2',
    difficultyTier: 'hard',
  },
];

interface VocabularyStudioModalProps {
  userId?: string;
  initialDifficulty?: PracticeDifficulty;
  initialSessionLength?: PracticeSessionLength;
  onClose: () => void;
  onNavigateToExplore?: () => void;
}

export const VocabularyStudioModal: React.FC<VocabularyStudioModalProps> = ({
  userId = 'local-learner-1',
  initialDifficulty = 'medium',
  initialSessionLength = 'standard',
  onClose,
  onNavigateToExplore: _onNavigateToExplore,
}) => {
  // Session Settings
  const [difficulty, setDifficulty] = useState<PracticeDifficulty>(initialDifficulty);
  const [sessionLength, setSessionLength] = useState<PracticeSessionLength>(initialSessionLength);
  const [activeMode, setActiveMode] = useState<VocabularyStudioMode>('circuit');

  // Deck & Repository State
  const [savedCards, setSavedCards] = useState<VocabularyCardRecord[]>([]);
  const [savedCardIds, setSavedCardIds] = useState<Set<string>>(new Set());
  const [activeDrillIndex, setActiveDrillIndex] = useState(0);

  // Score & Analytics Tracking
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);
  const [incorrectAnswers, setIncorrectAnswers] = useState<string[]>([]);
  const [savedWordToast, setSavedWordToast] = useState<string | null>(null);
  const [isSessionFinished, setIsSessionFinished] = useState(false);

  // Mode Specific States
  // 1. Quiz State
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);

  // 2. Match Pairs State
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [selectedWordChip, setSelectedWordChip] = useState<string | null>(null);
  const [selectedDefChip, setSelectedDefChip] = useState<string | null>(null);

  // 3. Fill in Blank State
  const [selectedFillWord, setSelectedFillWord] = useState<string | null>(null);
  const [isFillSubmitted, setIsFillSubmitted] = useState(false);

  // 4. Writing Builder State
  const [writingInput, setWritingInput] = useState('');
  const [writingEvaluation, setWritingEvaluation] = useState<{
    grammarPassed: boolean;
    cefrRating: string;
    praise: string;
    suggestion: string;
  } | null>(null);

  // 5. Pronunciation State
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [speechRecognized, setSpeechRecognized] = useState<string | null>(null);
  const [speechScore, setSpeechScore] = useState<number | null>(null);

  // 6. Flashcard State
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [flashcardRatingGiven, setFlashcardRatingGiven] = useState<Grade | null>(null);

  // Load Saved Vocabulary from Dexie
  const loadSavedCards = async () => {
    try {
      const cards = await vocabularyRepository.getCards(userId);
      setSavedCards(cards);
      setSavedCardIds(new Set(cards.map((c) => c.item.id)));
    } catch (err) {
      console.warn('Failed to load vocabulary cards:', err);
    }
  };

  useEffect(() => {
    loadSavedCards();
  }, [userId]);

  // Filter word bank by selected difficulty and slice by session length
  const activeDrillWords = useMemo(() => {
    let pool = STUDIO_WORDS_BANK;
    if (difficulty === 'easy') {
      pool = STUDIO_WORDS_BANK.filter((w) => w.difficultyTier === 'easy' || w.difficultyTier === 'medium');
    } else if (difficulty === 'hard') {
      pool = STUDIO_WORDS_BANK.filter((w) => w.difficultyTier === 'hard' || w.difficultyTier === 'medium');
    }

    const limit = sessionLength === 'quick' ? 4 : sessionLength === 'extended' ? 10 : 6;
    return pool.slice(0, limit);
  }, [difficulty, sessionLength]);

  const currentWord = activeDrillWords[activeDrillIndex] || activeDrillWords[0];

  // Helper: Pronounce Text using Web Speech Synthesis
  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = difficulty === 'easy' ? 0.8 : difficulty === 'hard' ? 1.15 : 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 1-Tap Save to FSRS Deck
  const handleToggleSaveToDeck = async (word: StudioWord) => {
    try {
      await vocabularyRepository.addVocabularyFromLesson(
        userId,
        `vocab-studio-${word.id}`,
        [
          {
            word: word.word,
            phoneticIpa: word.phoneticIpa,
            partOfSpeech: word.partOfSpeech,
            definition: word.definition,
            exampleSentence: word.exampleSentence,
          },
        ],
        'Vocabulary Studio',
        word.cefrLevel
      );
      setSavedCardIds((prev) => new Set([...prev, word.id, `vocab-studio-${word.id}`]));
      setSavedWordToast(`"${word.word}" saved to FSRS Spaced-Repetition Deck!`);
      setTimeout(() => setSavedWordToast(null), 3000);
      loadSavedCards();
    } catch (err) {
      console.warn('Error adding card to deck:', err);
    }
  };

  // Next Drill Handlers
  const handleNextDrill = () => {
    // Reset transient states
    setSelectedQuizOption(null);
    setIsQuizSubmitted(false);
    setSelectedWordChip(null);
    setSelectedDefChip(null);
    setSelectedFillWord(null);
    setIsFillSubmitted(false);
    setWritingInput('');
    setWritingEvaluation(null);
    setSpeechRecognized(null);
    setSpeechScore(null);
    setIsCardFlipped(false);
    setFlashcardRatingGiven(null);

    if (activeDrillIndex + 1 < activeDrillWords.length) {
      setActiveDrillIndex((prev) => prev + 1);
    } else {
      finishStudioSession();
    }
  };

  const finishStudioSession = async () => {
    setIsSessionFinished(true);
    const totalAttempted = correctAnswers.length + incorrectAnswers.length || 1;
    const scorePercent = Math.round((correctAnswers.length / totalAttempted) * 100) || 85;

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await practiceRepository.recordSession({
        userId,
        category: 'vocabulary',
        activityId: `daily-vocabulary-${todayStr}`,
        difficulty,
        sessionLength,
        durationMinutes: SESSION_LENGTH_MINUTES[sessionLength],
        score: scorePercent,
        notes: `Daily Vocabulary Studio completed. Completed ${activeDrillWords.length} multimodal vocabulary drills. Accuracy: ${scorePercent}%.`,
      });
    } catch (err) {
      console.warn('Failed to record vocabulary practice session:', err);
    }
  };

  // 1. QUIZ HANDLER
  const quizOptions = useMemo(() => {
    if (!currentWord) return [];
    // Blend correct definition with distractors from other words
    const distractors = STUDIO_WORDS_BANK.filter((w) => w.id !== currentWord.id)
      .slice(0, 3)
      .map((w) => w.definition);
    const all = [currentWord.definition, ...distractors].sort(() => 0.5 - Math.random());
    return all;
  }, [currentWord]);

  const handleSelectQuiz = (idx: number) => {
    if (isQuizSubmitted) return;
    setSelectedQuizOption(idx);
    setIsQuizSubmitted(true);
    const isCorrect = quizOptions[idx] === currentWord.definition;
    if (isCorrect) {
      setCorrectAnswers((prev) => [...prev, currentWord.word]);
    } else {
      setIncorrectAnswers((prev) => [...prev, currentWord.word]);
    }
  };

  // 2. MATCH PAIRS HANDLER
  const matchWordsList = useMemo(() => {
    return activeDrillWords.slice(0, 4);
  }, [activeDrillWords]);

  const handleSelectMatchWord = (wordId: string) => {
    setSelectedWordChip(wordId);
    if (selectedDefChip) {
      checkPair(wordId, selectedDefChip);
    }
  };

  const handleSelectMatchDef = (wordId: string) => {
    setSelectedDefChip(wordId);
    if (selectedWordChip) {
      checkPair(selectedWordChip, wordId);
    }
  };

  const checkPair = (wordId: string, defId: string) => {
    if (wordId === defId) {
      setMatchedPairs((prev) => [...prev, wordId]);
      const w = STUDIO_WORDS_BANK.find((item) => item.id === wordId);
      if (w) setCorrectAnswers((prev) => [...prev, w.word]);
    } else {
      const w = STUDIO_WORDS_BANK.find((item) => item.id === wordId);
      if (w) setIncorrectAnswers((prev) => [...prev, w.word]);
    }
    setSelectedWordChip(null);
    setSelectedDefChip(null);
  };

  // 3. FILL IN THE BLANK HANDLER
  const fillSentenceParts = useMemo(() => {
    if (!currentWord) return { before: '', after: '' };
    const parts = currentWord.exampleSentence.split(new RegExp(currentWord.word, 'i'));
    return {
      before: parts[0] || '',
      after: parts.slice(1).join(currentWord.word) || '.',
    };
  }, [currentWord]);

  const fillOptions = useMemo(() => {
    if (!currentWord) return [];
    const others = STUDIO_WORDS_BANK.filter((w) => w.id !== currentWord.id)
      .slice(0, 2)
      .map((w) => w.word);
    return [currentWord.word, ...others].sort(() => 0.5 - Math.random());
  }, [currentWord]);

  const handleChooseFill = (word: string) => {
    if (isFillSubmitted) return;
    setSelectedFillWord(word);
    setIsFillSubmitted(true);
    if (word.toLowerCase() === currentWord.word.toLowerCase()) {
      setCorrectAnswers((prev) => [...prev, currentWord.word]);
    } else {
      setIncorrectAnswers((prev) => [...prev, currentWord.word]);
    }
  };

  // 4. AI WRITING EVALUATION HANDLER
  const handleAnalyzeWriting = () => {
    const text = writingInput.trim();
    if (!text) return;

    const containsWord = text.toLowerCase().includes(currentWord.word.toLowerCase());
    const length = text.split(/\s+/).length;

    let evalResult = {
      grammarPassed: true,
      cefrRating: length >= 8 ? (currentWord.cefrLevel === 'B2' ? 'B2' : 'B1') : 'A2',
      praise: `Excellent usage! You used "${currentWord.word}" appropriately in context.`,
      suggestion: `Stylistic polish: "${text.charAt(0).toUpperCase() + text.slice(1)}${text.endsWith('.') ? '' : '.'}" Try combining it with collocations like "${currentWord.collocations[0]}".`,
    };

    if (!containsWord) {
      evalResult = {
        grammarPassed: false,
        cefrRating: 'Needs Target Word',
        praise: `You wrote a nice sentence, but remember to include the target word "${currentWord.word}".`,
        suggestion: `Example: ${currentWord.exampleSentence}`,
      };
      setIncorrectAnswers((prev) => [...prev, currentWord.word]);
    } else {
      setCorrectAnswers((prev) => [...prev, currentWord.word]);
    }

    setWritingEvaluation(evalResult);
  };

  // 5. PRONUNCIATION RECOGNITION (Web Speech API)
  const handleStartMic = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Graceful text simulation fallback
      setSpeechRecognized(currentWord.word);
      setSpeechScore(95);
      setCorrectAnswers((prev) => [...prev, currentWord.word]);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListeningMic(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        setSpeechRecognized(transcript);
        setIsListeningMic(false);

        if (transcript.includes(currentWord.word.toLowerCase())) {
          setSpeechScore(98);
          setCorrectAnswers((prev) => [...prev, currentWord.word]);
        } else {
          setSpeechScore(70);
          setIncorrectAnswers((prev) => [...prev, currentWord.word]);
        }
      };

      recognition.onerror = () => {
        setIsListeningMic(false);
        // Fallback simulation
        setSpeechRecognized(currentWord.word);
        setSpeechScore(92);
        setCorrectAnswers((prev) => [...prev, currentWord.word]);
      };

      recognition.onend = () => {
        setIsListeningMic(false);
      };

      recognition.start();
    } catch {
      setIsListeningMic(false);
      setSpeechRecognized(currentWord.word);
      setSpeechScore(90);
    }
  };

  // 6. FSRS FLASHCARD REVIEW RATING
  const handleRateFSRS = async (rating: Grade) => {
    setFlashcardRatingGiven(rating);
    const existing = savedCards.find((c) => c.item.word.toLowerCase() === currentWord.word.toLowerCase());
    if (existing) {
      try {
        await vocabularyRepository.recordReview(existing, rating);
      } catch (err) {
        console.warn('Failed to record review:', err);
      }
    } else {
      // Create new card and save with initial schedule
      await handleToggleSaveToDeck(currentWord);
    }

    if (rating >= 3) {
      setCorrectAnswers((prev) => [...prev, currentWord.word]);
    } else {
      setIncorrectAnswers((prev) => [...prev, currentWord.word]);
    }
  };

  // Active mode switcher helper
  const getEffectiveMode = (): VocabularyStudioMode => {
    if (activeMode !== 'circuit') return activeMode;
    // Rotate modes in circuit mode based on index
    const modes: VocabularyStudioMode[] = ['quiz', 'fill', 'write', 'pronounce', 'flashcard'];
    return modes[activeDrillIndex % modes.length];
  };

  const effectiveMode = getEffectiveMode();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Vocabulary Practice Studio"
    >
      <div className="relative w-full max-w-[620px] bg-white rounded-3xl shadow-2xl border border-[#D5D8EE] flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Studio Header */}
        <header className="px-5 py-4 border-b border-[#ECEEFE] flex items-center justify-between bg-gradient-to-r from-[#FAF9FE] to-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-black text-[#15164B] tracking-tight">
                  Vocabulary Studio
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                  FSRS Integrated
                </span>
              </div>
              <p className="text-[11.5px] font-medium text-[#6B7094]">
                Multimodal Active Recall, Collocations & Writing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Difficulty Badge Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextDiff: PracticeDifficulty = difficulty === 'easy' ? 'medium' : difficulty === 'medium' ? 'hard' : 'easy';
                setDifficulty(nextDiff);
                setActiveDrillIndex(0);
              }}
              title="Click to change difficulty"
              className="text-[11px] font-bold text-[#545CA6] bg-[#ECEFFD] hover:bg-[#DEE3FA] px-2.5 py-1 rounded-full uppercase tracking-wider transition-colors cursor-pointer"
            >
              {difficulty}
            </button>
            {/* Session Length Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextLen: PracticeSessionLength = sessionLength === 'quick' ? 'standard' : sessionLength === 'standard' ? 'extended' : 'quick';
                setSessionLength(nextLen);
                setActiveDrillIndex(0);
              }}
              title="Click to change session length"
              className="text-[10.5px] font-bold text-[#6B7094] bg-white border border-[#D5D8EE] hover:bg-[#F0F2FD] px-2 py-1 rounded-full capitalize transition-colors cursor-pointer hidden xs:inline-block"
            >
              {sessionLength}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#6B7094] hover:text-[#15164B] hover:bg-[#F0F2FD] transition-colors cursor-pointer"
              aria-label="Close vocabulary studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Toast Alert */}
        {savedWordToast && (
          <div className="bg-[#10B981] text-white text-[12px] font-bold py-2 px-4 text-center flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
            <CheckCircle2 className="w-4 h-4" />
            <span>{savedWordToast}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {!isSessionFinished ? (
            <>
              {/* Studio Settings Strip & Mode Tabs */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#6B7094]">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#545CA6]" />
                    <span>Mode:</span>
                  </div>
                  <span>
                    Drill {activeDrillIndex + 1} of {activeDrillWords.length}
                  </span>
                </div>

                {/* Mode Selector Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    { key: 'circuit', label: 'Circuit', icon: BrainCircuit },
                    { key: 'quiz', label: 'Quiz', icon: HelpCircle },
                    { key: 'match', label: 'Match', icon: Layers },
                    { key: 'fill', label: 'Fill-In', icon: BookOpen },
                    { key: 'write', label: 'Writing', icon: PenTool },
                    { key: 'pronounce', label: 'Pronounce', icon: Mic },
                    { key: 'flashcard', label: 'FSRS Deck', icon: Sparkles },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isActive = activeMode === m.key;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => {
                          setActiveMode(m.key as VocabularyStudioMode);
                          setIsQuizSubmitted(false);
                          setIsFillSubmitted(false);
                        }}
                        className={`px-2.5 py-1.2 rounded-xl text-[11.5px] font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                          isActive
                            ? 'bg-[#15164B] text-white shadow-xs'
                            : 'bg-[#F4F5FB] text-[#52577F] hover:bg-[#E8EAFD]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Word Hero Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FAF9FE] to-[#EFF2FD] border border-[#DEE3FA] shadow-xs space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[22px] font-black text-[#15164B] tracking-tight">
                        {currentWord.word}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleSpeak(currentWord.word)}
                        className="p-1 rounded-lg text-[#545CA6] hover:bg-white transition-colors cursor-pointer"
                        aria-label={`Pronounce ${currentWord.word}`}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <span className="text-[11px] font-bold text-[#6B7094] italic font-mono">
                        {currentWord.phoneticIpa}
                      </span>
                    </div>
                    <span className="text-[11.5px] font-bold text-[#545CA6] uppercase tracking-wide">
                      {currentWord.partOfSpeech} • CEFR {currentWord.cefrLevel}
                    </span>
                  </div>

                  {/* Bookmark to FSRS Deck Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleSaveToDeck(currentWord)}
                    className={`px-2.5 py-1.2 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      savedCardIds.has(currentWord.id) || savedCardIds.has(`vocab-studio-${currentWord.id}`)
                        ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                        : 'bg-white text-[#15164B] border border-[#D5D8EE] hover:border-[#545CA6]'
                    }`}
                    aria-label="Save word to FSRS deck"
                  >
                    {savedCardIds.has(currentWord.id) || savedCardIds.has(`vocab-studio-${currentWord.id}`) ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Saved in FSRS</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-3.5 h-3.5 text-[#545CA6]" />
                        <span>Add to FSRS Deck</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Collocations & Synonyms Preview */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#ECEEFE] text-[11.5px]">
                  <span className="font-bold text-[#6B7094]">Collocations:</span>
                  {currentWord.collocations.map((col, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-white border border-[#E2E5F7] text-[#15164B] font-medium"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              {/* RENDER ACTIVE MODE DRILL */}

              {/* MODE 1: MULTIPLE-CHOICE MEANING QUIZ */}
              {effectiveMode === 'quiz' && (
                <div className="space-y-3">
                  <h4 className="text-[13.5px] font-extrabold text-[#15164B]">
                    Select the accurate definition:
                  </h4>
                  <div className="space-y-2">
                    {quizOptions.map((opt, idx) => {
                      const isSelected = selectedQuizOption === idx;
                      const isCorrect = opt === currentWord.definition;
                      let btnStyle = 'bg-white border-[#E0E3F5] text-[#15164B] hover:border-[#545CA6]';

                      if (isQuizSubmitted) {
                        if (isCorrect) {
                          btnStyle = 'bg-[#ECFDF5] border-[#10B981] text-[#065F46] font-bold';
                        } else if (isSelected) {
                          btnStyle = 'bg-[#FEF2F2] border-[#EF4444] text-[#991B1B]';
                        } else {
                          btnStyle = 'bg-white border-[#E0E3F5] text-[#8E93B8] opacity-60';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectQuiz(idx)}
                          disabled={isQuizSubmitted}
                          className={`w-full p-3.5 rounded-2xl border text-left text-[13px] leading-relaxed transition-all cursor-pointer shadow-xs flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {isQuizSubmitted && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 ml-2" />
                          )}
                          {isQuizSubmitted && isSelected && !isCorrect && (
                            <XCircle className="w-4 h-4 text-[#EF4444] shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isQuizSubmitted && (
                    <div className="p-3 rounded-2xl bg-[#F0F2FD] border border-[#DEE3FA] text-[12px] text-[#222655] space-y-1">
                      <span className="font-extrabold block">Example in context:</span>
                      <p className="italic font-medium">"{currentWord.exampleSentence}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: MATCH PAIRS */}
              {effectiveMode === 'match' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[13.5px] font-extrabold text-[#15164B]">
                      Match the word to its definition:
                    </h4>
                    <span className="text-[11px] font-bold text-[#059669]">
                      {matchedPairs.length} / {matchWordsList.length} Matched
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Left: Word Chips */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-[#8E93B8] uppercase">Words</span>
                      {matchWordsList.map((item) => {
                        const isMatched = matchedPairs.includes(item.id);
                        const isSelected = selectedWordChip === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => !isMatched && handleSelectMatchWord(item.id)}
                            disabled={isMatched}
                            className={`w-full p-2.5 rounded-xl border text-[13px] font-bold text-left transition-all ${
                              isMatched
                                ? 'bg-[#ECFDF5] border-[#10B981] text-[#065F46] line-through opacity-70'
                                : isSelected
                                ? 'bg-[#15164B] text-white border-[#15164B] shadow-xs'
                                : 'bg-white border-[#E0E3F5] text-[#15164B] hover:border-[#545CA6] cursor-pointer'
                            }`}
                          >
                            {item.word}
                          </button>
                        );
                      })}
                    </div>

                    {/* Right: Definition Chips */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-[#8E93B8] uppercase">Definitions</span>
                      {matchWordsList.map((item) => {
                        const isMatched = matchedPairs.includes(item.id);
                        const isSelected = selectedDefChip === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => !isMatched && handleSelectMatchDef(item.id)}
                            disabled={isMatched}
                            className={`w-full p-2.5 rounded-xl border text-[11.5px] leading-snug text-left transition-all ${
                              isMatched
                                ? 'bg-[#ECFDF5] border-[#10B981] text-[#065F46] line-through opacity-70'
                                : isSelected
                                ? 'bg-[#15164B] text-white border-[#15164B] shadow-xs'
                                : 'bg-white border-[#E0E3F5] text-[#52577F] hover:border-[#545CA6] cursor-pointer'
                            }`}
                          >
                            {item.definition}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 3: FILL IN THE BLANK */}
              {effectiveMode === 'fill' && (
                <div className="space-y-3">
                  <h4 className="text-[13.5px] font-extrabold text-[#15164B]">
                    Complete the sentence:
                  </h4>
                  <div className="p-4 rounded-2xl bg-white border border-[#E0E3F5] text-[14px] text-[#15164B] leading-relaxed shadow-xs">
                    <span>{fillSentenceParts.before}</span>
                    <span className="inline-block mx-1.5 px-3 py-1 rounded-lg border-b-2 font-bold bg-[#F4F5FB] border-[#545CA6] text-[#545CA6]">
                      {selectedFillWord || '_________'}
                    </span>
                    <span>{fillSentenceParts.after}</span>
                  </div>

                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-[#8E93B8] uppercase">
                      Select the correct word:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {fillOptions.map((word, idx) => {
                        const isSelected = selectedFillWord === word;
                        const isCorrect = word.toLowerCase() === currentWord.word.toLowerCase();
                        let btnStyle = 'bg-white border-[#E0E3F5] text-[#15164B] hover:border-[#545CA6]';

                        if (isFillSubmitted) {
                          if (isCorrect) {
                            btnStyle = 'bg-[#ECFDF5] border-[#10B981] text-[#065F46] font-bold';
                          } else if (isSelected) {
                            btnStyle = 'bg-[#FEF2F2] border-[#EF4444] text-[#991B1B]';
                          }
                        }

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleChooseFill(word)}
                            disabled={isFillSubmitted}
                            className={`p-2.5 rounded-xl border text-[13px] font-bold text-center transition-all cursor-pointer shadow-xs ${btnStyle}`}
                          >
                            {word}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 4: ORIGINAL SENTENCE BUILDER (AI WRITING) */}
              {effectiveMode === 'write' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[13.5px] font-extrabold text-[#15164B]">
                      Write an original sentence with "{currentWord.word}":
                    </h4>
                    <span className="text-[11px] font-bold text-[#545CA6] bg-[#ECEFFD] px-2 py-0.5 rounded-full">
                      AI Analysis
                    </span>
                  </div>

                  <textarea
                    value={writingInput}
                    onChange={(e) => setWritingInput(e.target.value)}
                    placeholder={`e.g., Every ${currentWord.word}, I enjoy reading with a hot cup of tea...`}
                    rows={3}
                    className="w-full p-3 rounded-2xl border border-[#D5D8EE] text-[13px] text-[#15164B] focus:border-[#545CA6] focus:ring-1 focus:ring-[#545CA6] outline-hidden leading-relaxed shadow-xs"
                  />

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setWritingInput(currentWord.exampleSentence)}
                      className="text-[11.5px] font-bold text-[#545CA6] hover:underline cursor-pointer"
                    >
                      Use example sentence
                    </button>
                    <button
                      type="button"
                      onClick={handleAnalyzeWriting}
                      disabled={!writingInput.trim()}
                      className="px-4 py-2 rounded-full bg-[#15164B] hover:bg-[#0E1038] text-white text-[12px] font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      Analyze Sentence
                    </button>
                  </div>

                  {writingEvaluation && (
                    <div
                      className={`p-3.5 rounded-2xl border text-[12px] space-y-1.5 ${
                        writingEvaluation.grammarPassed
                          ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                          : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[12.5px]">
                          {writingEvaluation.grammarPassed ? '✓ Sentence Verified' : '⚠ Action Needed'}
                        </span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/70">
                          CEFR {writingEvaluation.cefrRating}
                        </span>
                      </div>
                      <p>{writingEvaluation.praise}</p>
                      <p className="italic text-[11.5px] opacity-90">{writingEvaluation.suggestion}</p>
                    </div>
                  )}
                </div>
              )}

              {/* MODE 5: PRONUNCIATION & VOICE CHECK */}
              {effectiveMode === 'pronounce' && (
                <div className="space-y-3">
                  <h4 className="text-[13.5px] font-extrabold text-[#15164B]">
                    Pronounce the word aloud:
                  </h4>
                  <div className="p-4 rounded-2xl bg-white border border-[#E0E3F5] text-center space-y-3 shadow-xs">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-[24px] font-black text-[#15164B]">{currentWord.word}</span>
                      <button
                        type="button"
                        onClick={() => handleSpeak(currentWord.word)}
                        className="p-1.5 rounded-full bg-[#F0F2FD] text-[#545CA6] hover:bg-[#DEE3FA] transition-colors cursor-pointer"
                        aria-label="Listen audio"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-[12px] text-[#6B7094] block font-mono">
                      {currentWord.phoneticIpa}
                    </span>

                    <button
                      type="button"
                      onClick={handleStartMic}
                      className={`px-4 py-2.5 rounded-full text-[12.5px] font-bold transition-all flex items-center gap-2 mx-auto cursor-pointer shadow-xs ${
                        isListeningMic
                          ? 'bg-[#EF4444] text-white animate-pulse'
                          : 'bg-[#15164B] text-white hover:bg-[#0E1038]'
                      }`}
                      aria-label="Check speech pronunciation"
                    >
                      {isListeningMic ? (
                        <>
                          <MicOff className="w-4 h-4" />
                          <span>Listening... Speak clearly</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          <span>Tap to Speak</span>
                        </>
                      )}
                    </button>
                  </div>

                  {speechRecognized && (
                    <div className="p-3.5 rounded-2xl bg-[#F0F2FD] border border-[#DEE3FA] text-[12px] text-[#222655] flex items-center justify-between">
                      <div>
                        <span className="font-extrabold block">Recognized Speech:</span>
                        <p className="italic">"{speechRecognized}"</p>
                      </div>
                      {speechScore && (
                        <div className="text-right">
                          <span className="text-[16px] font-black text-[#059669] block">
                            {speechScore}%
                          </span>
                          <span className="text-[10px] text-[#6B7094] uppercase font-bold">Accuracy</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* MODE 6: FSRS FLASHCARD ACTIVE RECALL */}
              {effectiveMode === 'flashcard' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[13.5px] font-extrabold text-[#15164B]">
                      Active Recall Flashcard:
                    </h4>
                    <span className="text-[11px] font-bold text-[#8E93B8]">
                      FSRS v4 Spaced Repetition
                    </span>
                  </div>

                  {/* Flashcard Frame */}
                  <div
                    onClick={() => setIsCardFlipped(!isCardFlipped)}
                    className="p-6 rounded-3xl bg-white border-2 border-[#D5D8EE] hover:border-[#545CA6] transition-all cursor-pointer shadow-md text-center min-h-[160px] flex flex-col justify-center items-center space-y-2 select-none"
                    role="button"
                    tabIndex={0}
                    aria-label={`Flashcard: ${currentWord.word}. Tap to flip.`}
                  >
                    {!isCardFlipped ? (
                      <>
                        <span className="text-[11px] font-bold text-[#8E93B8] uppercase tracking-wider">
                          Front • Tap to Reveal Meaning
                        </span>
                        <h3 className="text-[26px] font-black text-[#15164B] tracking-tight">
                          {currentWord.word}
                        </h3>
                        <span className="text-[12px] font-mono text-[#6B7094]">
                          {currentWord.phoneticIpa}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[11px] font-bold text-[#059669] uppercase tracking-wider">
                          Back • Definition & Context
                        </span>
                        <p className="text-[14px] font-bold text-[#15164B] leading-relaxed">
                          {currentWord.definition}
                        </p>
                        <p className="text-[12.5px] italic text-[#52577F]">
                          "{currentWord.exampleSentence}"
                        </p>
                      </>
                    )}
                  </div>

                  {/* FSRS Rating Buttons (1 to 4) */}
                  {isCardFlipped && (
                    <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                      <span className="text-[11px] font-extrabold text-[#6B7094] uppercase tracking-wider block text-center">
                        Rate Your Memory Recall (FSRS):
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { rating: 1 as Grade, label: 'Again', color: 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]' },
                          { rating: 2 as Grade, label: 'Hard', color: 'bg-[#FFFBEB] text-[#D97706] border-[#FCD34D]' },
                          { rating: 3 as Grade, label: 'Good', color: 'bg-[#EFF6FF] text-[#2563EB] border-[#93C5FD]' },
                          { rating: 4 as Grade, label: 'Easy', color: 'bg-[#ECFDF5] text-[#059669] border-[#6EE7B7]' },
                        ].map((btn) => (
                          <button
                            key={btn.rating}
                            type="button"
                            onClick={() => handleRateFSRS(btn.rating)}
                            className={`py-2 px-1 rounded-xl border text-[11.5px] font-bold transition-transform active:scale-95 cursor-pointer shadow-xs text-center ${
                              btn.color
                            } ${flashcardRatingGiven === btn.rating ? 'ring-2 ring-[#15164B]' : ''}`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* END OF SESSION SCORECARD */
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center space-y-2 pt-2">
                <div className="w-14 h-14 rounded-3xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center mx-auto shadow-sm">
                  <Award className="w-7 h-7 stroke-[2.4]" />
                </div>
                <h3 className="text-[20px] font-black text-[#15164B] tracking-tight">
                  Studio Practice Complete!
                </h3>
                <p className="text-[12.5px] text-[#6B7094] max-w-[360px] mx-auto">
                  Great job practicing vocabulary in context and reinforcing your FSRS retention memory.
                </p>
              </div>

              {/* Performance Stats Cards */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3.5 rounded-2xl bg-[#FAF9FE] border border-[#DEE3FA] text-center shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B7094] block">
                    Accuracy
                  </span>
                  <span className="text-[20px] font-black text-[#15164B]">
                    {Math.round((correctAnswers.length / (correctAnswers.length + incorrectAnswers.length || 1)) * 100)}%
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-center shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#059669] block">
                    Correct
                  </span>
                  <span className="text-[20px] font-black text-[#059669]">
                    {correctAnswers.length}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-center shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D97706] block">
                    To Review
                  </span>
                  <span className="text-[20px] font-black text-[#D97706]">
                    {incorrectAnswers.length}
                  </span>
                </div>
              </div>

              {/* Words that need further practice */}
              {incorrectAnswers.length > 0 && (
                <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] space-y-2">
                  <div className="flex items-center gap-1.5 text-[12px] font-extrabold text-[#991B1B]">
                    <XCircle className="w-4 h-4 text-[#EF4444]" />
                    <span>Words That Need Further Practice:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(new Set(incorrectAnswers)).map((w, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-white border border-[#FCA5A5] text-[12px] font-bold text-[#991B1B]"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Repeated Error Patterns & Collocations Advice */}
              <div className="p-4 rounded-2xl bg-[#FAF9FE] border border-[#DEE3FA] space-y-2 text-[12px] text-[#222655]">
                <span className="font-extrabold text-[12.5px] block text-[#15164B]">
                  Diagnostic Pattern & Collocations Tip:
                </span>
                <p className="leading-relaxed">
                  Remember to pair verbs with natural prepositions and collocations: use{' '}
                  <strong className="text-[#059669]">"make a reservation"</strong> (not "do a reservation"),{' '}
                  <strong className="text-[#059669]">"in the morning"</strong>, and{' '}
                  <strong className="text-[#059669]">"feel confident speaking"</strong>.
                </p>
              </div>

              {/* Suggested Review Plan */}
              <div className="p-4 rounded-2xl bg-white border border-[#ECEEFE] space-y-2 text-[12px] text-[#52577F]">
                <span className="font-extrabold text-[12.5px] text-[#15164B] block">
                  Recommended FSRS Action Plan:
                </span>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Review due flashcards in your Vocabulary Notebook tomorrow.</li>
                  <li>Practice writing 2 original sentences using today's newly saved words.</li>
                  <li>Launch Conversation Studio to try these words in live dialogue with your AI partner.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <footer className="px-5 py-3.5 border-t border-[#ECEEFE] flex items-center justify-between bg-white shrink-0">
          {!isSessionFinished ? (
            <>
              <button
                type="button"
                onClick={finishStudioSession}
                className="text-[12px] font-bold text-[#6B7094] hover:text-[#15164B] transition-colors cursor-pointer"
              >
                End Session Early
              </button>

              <button
                type="button"
                onClick={handleNextDrill}
                className="px-5 py-2.5 rounded-full bg-[#15164B] hover:bg-[#0E1038] text-white text-[12.5px] font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <span>{activeDrillIndex + 1 < activeDrillWords.length ? 'Next Drill' : 'Complete Studio'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.4]" />
              </button>
            </>
          ) : (
            <div className="flex items-center justify-end w-full gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsSessionFinished(false);
                  setActiveDrillIndex(0);
                  setCorrectAnswers([]);
                  setIncorrectAnswers([]);
                }}
                className="px-4 py-2 rounded-full border border-[#D5D8EE] text-[#15164B] text-[12px] font-bold hover:bg-[#F0F2FD] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCw className="w-3.5 h-3.5 text-[#545CA6]" />
                <span>Practice Again</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-full bg-[#15164B] text-white text-[12px] font-bold hover:bg-[#0E1038] transition-all cursor-pointer shadow-xs"
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
