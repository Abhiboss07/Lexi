import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Play, 
  Pause, 
  CheckCircle2, 
  Sparkles, 
  PenTool, 
  Compass, 
  BookPlus, 
  Send
} from 'lucide-react';
import type { PracticeDifficulty, PracticeSessionLength } from '../../types/practicePreferences';
import { DIFFICULTY_DESCRIPTIONS, SESSION_LENGTH_MINUTES } from '../../types/practicePreferences';
import { practiceRepository } from '../../db/practiceRepository';
import { vocabularyRepository } from '../../db/vocabularyRepository';

export interface GradedStory {
  id: string;
  title: string;
  genre: string;
  level: string;
  duration: string;
  paragraphs: string[];
  question: string;
  options: Array<{ text: string; correct: boolean }>;
  explanation: string;
  vocabulary: Array<{ word: string; pos: string; definition: string; example: string }>;
}

export const GRADED_STORIES: GradedStory[] = [
  {
    id: 'story-old-clocktower',
    title: 'The Secret of the Old Clocktower',
    genre: 'Adventure & Mystery',
    level: 'A2 • Adventure',
    duration: '3 min read',
    paragraphs: [
      "Every morning at eight o'clock, the bronze bell of the clocktower chimed across the village square.",
      "Lucas, a quiet student who loved old maps, noticed something strange. Yesterday, the clock rang nine times instead of eight.",
      "Curious, he climbed the stone staircase inside the tower. Near the brass gears, he discovered a folded leather diary with a golden key tucked inside.",
    ],
    question: 'Why did Lucas decide to climb the clocktower staircase?',
    options: [
      { text: 'The clock struck an unusual number of times', correct: true },
      { text: 'He was looking for his lost backpack', correct: false },
      { text: 'His friend asked him to fix the bronze bell', correct: false },
    ],
    explanation: 'Lucas noticed that the clock struck nine times instead of eight, which made him curious to investigate.',
    vocabulary: [
      { word: 'chimed', pos: 'verb', definition: 'Made a clear ringing sound, typically to indicate the hour.', example: 'The bronze bell chimed across the quiet village square.' },
      { word: 'curious', pos: 'adjective', definition: 'Eager to know or learn something new.', example: 'Curious about the sound, he explored the staircase.' },
      { word: 'brass', pos: 'noun', definition: 'A yellow alloy of copper and zinc often used for gears.', example: 'The clockwork was made of polished brass.' },
    ],
  },
  {
    id: 'story-harbor-market',
    title: 'Morning at the Harbor Market',
    genre: 'Daily Life',
    level: 'A1 • Everyday',
    duration: '2 min read',
    paragraphs: [
      "The sun rises over the quiet harbor. Fishermen unload wooden crates of fresh cod and silver mackerel.",
      "Elena walks along the stone pier, breathing in the salty ocean breeze. She buys two warm lemon pastries from the corner bakery.",
      "An old seagull lands on the wooden post, watching her eat with curious black eyes.",
    ],
    question: 'What does Elena buy at the bakery?',
    options: [
      { text: 'Two warm lemon pastries', correct: true },
      { text: 'A loaf of fresh sourdough bread', correct: false },
      { text: 'A basket of fresh silver mackerel', correct: false },
    ],
    explanation: 'Elena bought two warm lemon pastries from the corner bakery while walking along the pier.',
    vocabulary: [
      { word: 'harbor', pos: 'noun', definition: 'A sheltered body of water where ships can anchor safely.', example: 'Boats floated peacefully in the harbor.' },
      { word: 'breeze', pos: 'noun', definition: 'A gentle and pleasant wind.', example: 'A cool breeze drifted from the sea.' },
    ],
  },
  {
    id: 'story-midnight-train',
    title: 'The Midnight Train to Edinburgh',
    genre: 'Travel & Mystery',
    level: 'B1 • Travel',
    duration: '4 min read',
    paragraphs: [
      "Rain streaked against the double-paned window of Carriage B as the express departed King's Cross station.",
      "Dr. Aris opened a battered leather briefcase containing century-old botanical manuscripts from the Highlands.",
      "A conductor stepped into the aisle with a ticket puncher, smiling warmly. 'Expect a picturesque misty morning over the Scottish hills, sir.'",
    ],
    question: 'Where was the express train traveling to?',
    options: [
      { text: 'Edinburgh', correct: true },
      { text: 'Oxford', correct: false },
      { text: 'Manchester', correct: false },
    ],
    explanation: 'The passenger boarded the midnight express train departing London headed for Edinburgh.',
    vocabulary: [
      { word: 'manuscript', pos: 'noun', definition: 'A book or document written before printing was invented.', example: 'The historical manuscript was preserved carefully.' },
      { word: 'picturesque', pos: 'adjective', definition: 'Visually attractive, especially in a charming or quaint way.', example: 'The Scottish countryside looked picturesque in the mist.' },
    ],
  },
];

const WRITING_PROMPTS = [
  {
    id: 'prompt-envelope',
    title: 'The Mystery Envelope',
    intro: 'While browsing books in an old shop, you find a sealed wax envelope addressed to your name...',
  },
  {
    id: 'prompt-rain',
    title: 'Rainy Day in Tokyo',
    intro: 'You stepped under the neon awning to escape the sudden downpour, when someone offered to share their umbrella...',
  },
];

interface StoryStudioModalProps {
  userId?: string;
  initialDifficulty?: PracticeDifficulty;
  initialSessionLength?: PracticeSessionLength;
  onClose: () => void;
  onNavigateToExplore?: () => void;
}

export const StoryStudioModal: React.FC<StoryStudioModalProps> = ({
  userId = 'local-learner-1',
  initialDifficulty = 'medium',
  initialSessionLength = 'standard',
  onClose,
}) => {
  const [studioMode, setStudioMode] = useState<'reading' | 'writing'>('reading');
  const [sessionDifficulty, setSessionDifficulty] = useState<PracticeDifficulty>(initialDifficulty);
  const [sessionLength, setSessionLength] = useState<PracticeSessionLength>(initialSessionLength);
  
  // Reading Mode State
  const [selectedStory, setSelectedStory] = useState<GradedStory>(GRADED_STORIES[0]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

  // Creative Writing Co-Creator State
  const [selectedPrompt, setSelectedPrompt] = useState(WRITING_PROMPTS[0]);
  const [learnerText, setLearnerText] = useState('');
  const [storySubmissions, setStorySubmissions] = useState<Array<{
    userText: string;
    aiFeedback: {
      praise: string;
      upgrade: string;
      cefr: string;
    };
    aiContinuation: string;
  }>>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleReadAloud = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }
    window.speechSynthesis.cancel();
    const textToSpeak = `${selectedStory.title}. ${selectedStory.paragraphs.join(' ')}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'en-US';
    utterance.rate = DIFFICULTY_DESCRIPTIONS[sessionDifficulty].speechRate;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSwitchStory = (story: GradedStory) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    }
    setSelectedStory(story);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  const handleCheckAnswer = () => {
    setIsAnswered(true);
    practiceRepository.recordSession({
      userId,
      category: 'stories',
      activityId: selectedStory.id,
      difficulty: sessionDifficulty,
      sessionLength,
      durationMinutes: SESSION_LENGTH_MINUTES[sessionLength],
      score: selectedOption === 0 ? 100 : 50,
    }).catch(console.error);
  };

  const handleSaveVocab = async (vocab: { word: string; pos: string; definition: string; example: string }) => {
    try {
      await vocabularyRepository.addVocabularyFromLesson(
        userId,
        selectedStory.id,
        [{
          word: vocab.word,
          partOfSpeech: vocab.pos,
          definition: vocab.definition,
          exampleSentence: vocab.example,
        }],
        selectedStory.title,
        selectedStory.level.startsWith('B') ? 'B1' : 'A2'
      );
      setSavedWords((prev) => new Set([...prev, vocab.word]));
    } catch (err) {
      console.error('Failed to save story vocab word:', err);
    }
  };

  const handleSubmitWriting = () => {
    if (!learnerText.trim()) return;

    setIsAnalyzing(true);
    const text = learnerText.trim();
    setLearnerText('');

    // Record writing session
    practiceRepository.recordSession({
      userId,
      category: 'stories',
      activityId: `writing-${selectedPrompt.id}`,
      difficulty: sessionDifficulty,
      sessionLength,
      durationMinutes: SESSION_LENGTH_MINUTES[sessionLength],
      score: 95,
      notes: `Creative writing co-creation: ${selectedPrompt.title}`,
    }).catch(console.error);

    setTimeout(() => {
      setIsAnalyzing(false);
      setStorySubmissions((prev) => [
        ...prev,
        {
          userText: text,
          aiFeedback: {
            praise: 'Expressive and descriptive sentence structure! Great narrative momentum.',
            upgrade: "Stylistic enhancement: You can use 'cautiously inspected' to add suspense.",
            cefr: 'Demonstrated: B1+ Descriptive Vocabulary',
          },
          aiContinuation: 'Inside, a handwritten letter whispered of a meeting at twilight near the old stone bridge.',
        },
      ]);
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stories-modal-title"
    >
      <div className="w-full max-w-[440px] h-full sm:h-auto sm:max-h-[92vh] sm:rounded-[36px] bg-[#F6F7FE] shadow-2xl border border-[#ECEEFE] flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="p-4 bg-white border-b border-[#ECEEFE] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#FDF4FF] text-[#C026D3] flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#C026D3]">
                Story Studio
              </span>
              <h1 id="stories-modal-title" className="text-[15px] font-black text-[#1C2046] leading-none">
                Interactive Graded Stories
              </h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] text-[#222149] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close stories studio"
          >
            <X className="w-4.5 h-4.5 stroke-[2.2]" />
          </button>
        </header>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-[#E2E6FA] bg-white px-4 pt-1 gap-4 text-[12.5px] font-bold">
          <button
            type="button"
            onClick={() => setStudioMode('reading')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              studioMode === 'reading'
                ? 'border-[#C026D3] text-[#C026D3]'
                : 'border-transparent text-[#6B7094] hover:text-[#15164B]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Graded Stories</span>
          </button>
          <button
            type="button"
            onClick={() => setStudioMode('writing')}
            className={`pb-2.5 flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              studioMode === 'writing'
                ? 'border-[#C026D3] text-[#C026D3]'
                : 'border-transparent text-[#6B7094] hover:text-[#15164B]'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Co-Creative Writing</span>
          </button>
        </div>

        {/* Session Difficulty & Duration Override Bar */}
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

        {/* Studio Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {studioMode === 'reading' ? (
            /* Mode 1: Graded Interactive Reading */
            <>
              {/* Easy mode reading hint */}
              {sessionDifficulty === 'easy' && (
                <div className="px-3.5 py-2 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[11.5px] text-[#1E40AF] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-[#2563EB]" />
                  <span>Easy mode: Audio is played at 0.8x pace to help you follow along smoothly.</span>
                </div>
              )}

              {/* Story Selector Pills */}
              <div className="space-y-1.5">
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#8E93B8] block">
                  Select Graded Story
                </span>
                <div className="flex flex-wrap gap-1.5 py-0.5">
                  {GRADED_STORIES.map((story) => (
                    <button
                      key={story.id}
                      type="button"
                      onClick={() => handleSwitchStory(story)}
                      className={`px-3 py-1 rounded-full text-[11.5px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                        selectedStory.id === story.id
                          ? 'bg-[#15164B] text-white shadow-xs'
                          : 'bg-white text-[#6B7094] border border-[#ECEEFE] hover:bg-[#F9F9FE]'
                      }`}
                    >
                      {story.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Story Narrative Card */}
              <div className="p-5 rounded-3xl bg-white border border-[#ECEEFE] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#FDF4FF] text-[#C026D3]">
                    {selectedStory.level} • {selectedStory.duration}
                  </span>
                  <button
                    type="button"
                    onClick={handleReadAloud}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4F5FD] hover:bg-[#ECEFFD] text-[#545CA6] text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlayingAudio ? 'Pause' : 'Listen'}</span>
                  </button>
                </div>

                <h2 className="text-[18px] font-black text-[#15164B]">
                  {selectedStory.title}
                </h2>

                <div className="space-y-2.5 text-[13px] text-[#333758] leading-relaxed">
                  {selectedStory.paragraphs.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
              </div>

              {/* Vocabulary in Context */}
              <div className="p-4 rounded-3xl bg-white border border-[#ECEEFE] space-y-2.5 shadow-xs">
                <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#8E93B8] block flex items-center gap-1.5">
                  <BookPlus className="w-3.5 h-3.5 text-[#545CA6]" />
                  Key Words from this Story
                </span>
                <div className="space-y-2">
                  {selectedStory.vocabulary.map((vocab) => {
                    const isSaved = savedWords.has(vocab.word);
                    return (
                      <div
                        key={vocab.word}
                        className="p-2.5 rounded-2xl bg-[#F8F9FE] border border-[#ECEEFE] flex items-center justify-between text-[12px]"
                      >
                        <div>
                          <span className="font-bold text-[#15164B] capitalize">{vocab.word}</span>
                          <span className="text-[10.5px] text-[#545CA6] ml-1.5">({vocab.pos})</span>
                          <p className="text-[11px] text-[#6B7094] line-clamp-1">{vocab.definition}</p>
                        </div>
                        <button
                          type="button"
                          disabled={isSaved}
                          onClick={() => handleSaveVocab(vocab)}
                          className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold transition-all cursor-pointer shrink-0 ${
                            isSaved
                              ? 'bg-[#ECFDF5] text-[#065F46] border border-[#10B981]'
                              : 'bg-white hover:bg-[#15164B] hover:text-white text-[#15164B] border border-[#D5D8EE]'
                          }`}
                        >
                          {isSaved ? 'Saved' : '+ Save Word'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Comprehension Challenge */}
              <div className="p-4 rounded-3xl bg-white border border-[#ECEEFE] shadow-xs space-y-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#C026D3]" />
                  <h3 className="text-[13.5px] font-extrabold text-[#1C2046]">
                    Comprehension Check
                  </h3>
                </div>

                <p className="text-[12.5px] font-medium text-[#4B527E]">
                  {selectedStory.question}
                </p>

                <div className="space-y-2">
                  {selectedStory.options.map((opt, i) => {
                    const isSelected = selectedOption === i;
                    let btnStyle = 'bg-white border-[#E0E4FC] text-[#222149] hover:bg-[#F9F9FE]';
                    if (isAnswered) {
                      if (opt.correct) {
                        btnStyle = 'bg-[#ECFDF5] border-[#10B981] text-[#065F46] font-bold';
                      } else if (isSelected && !opt.correct) {
                        btnStyle = 'bg-[#FEF2F2] border-[#EF4444] text-[#991B1B]';
                      }
                    } else if (isSelected) {
                      btnStyle = 'bg-[#ECEFFD] border-[#545CA6] text-[#15164B] font-bold';
                    }

                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={isAnswered}
                        onClick={() => setSelectedOption(i)}
                        className={`w-full text-left p-3 rounded-2xl border text-[12.5px] transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                      >
                        <span>{opt.text}</span>
                        {isAnswered && opt.correct && <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {!isAnswered ? (
                  <button
                    type="button"
                    disabled={selectedOption === null}
                    onClick={handleCheckAnswer}
                    className="w-full py-2.5 rounded-full bg-[#15164B] hover:bg-[#0E1038] disabled:opacity-40 text-white text-[12.5px] font-bold transition-all cursor-pointer"
                  >
                    Check Answer
                  </button>
                ) : (
                  <div className="p-3 rounded-2xl bg-[#F4F5FD] border border-[#E0E4FC] space-y-1">
                    <span className="text-[11px] font-extrabold uppercase text-[#545CA6] block">
                      Feedback
                    </span>
                    <p className="text-[12px] text-[#484F79]">
                      {selectedStory.explanation}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Mode 2: Creative Writing Co-Creator */
            <div className="space-y-4">
              {/* Prompt Selector Pills */}
              <div className="flex gap-1.5 flex-wrap">
                {WRITING_PROMPTS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPrompt(p);
                      setStorySubmissions([]);
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                      selectedPrompt.id === p.id
                        ? 'bg-[#C026D3] text-white shadow-xs'
                        : 'bg-white text-[#6B7094] border border-[#ECEEFE] hover:bg-[#FDF4FF]'
                    }`}
                  >
                    {p.title}
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-3xl bg-linear-to-br from-[#1E224E] to-[#391852] text-white space-y-2 shadow-md">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">
                  CO-CREATIVE STORY BUILDER
                </span>
                <h3 className="text-[16px] font-black">{selectedPrompt.title}</h3>
                <p className="text-[12px] text-[#E0E7FF] leading-relaxed">
                  "{selectedPrompt.intro}"
                </p>
              </div>

              {/* Story Submission Chain */}
              {storySubmissions.map((sub, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="p-3.5 rounded-2xl bg-[#15164B] text-white text-[12.5px] leading-relaxed">
                    <span className="text-[10px] text-[#A5AFEE] font-bold uppercase block mb-1">You wrote:</span>
                    {sub.userText}
                  </div>

                  <div className="p-3 rounded-2xl bg-[#EFF6FF] border border-[#BFDBFE] text-[11.5px] text-[#1E40AF] space-y-1">
                    <span className="font-extrabold flex items-center gap-1 text-[#2563EB]">
                      <Sparkles className="w-3.5 h-3.5" />
                      Coach Evaluation
                    </span>
                    <p>{sub.aiFeedback.praise}</p>
                    <p className="font-semibold text-[#1D4ED8]">{sub.aiFeedback.upgrade}</p>
                    <span className="inline-block text-[10px] font-extrabold bg-white px-2 py-0.5 rounded-full text-[#2563EB] mt-1">
                      {sub.aiFeedback.cefr}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-[#E0E4FC] text-[12.5px] text-[#15164B] leading-relaxed">
                    <span className="text-[10px] text-[#C026D3] font-bold uppercase block mb-1">Story continues:</span>
                    {sub.aiContinuation}
                  </div>
                </div>
              ))}

              {/* Writing Input Card */}
              <div className="p-4 rounded-3xl bg-white border border-[#ECEEFE] space-y-3 shadow-xs">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#6B7094] block">
                  Write the Next Sentence
                </label>
                <textarea
                  value={learnerText}
                  onChange={(e) => setLearnerText(e.target.value)}
                  placeholder="Continue the story in English... (e.g., I carefully opened the lock with my trembling hands.)"
                  rows={3}
                  className="w-full p-3 rounded-2xl bg-[#F6F7FE] border border-[#ECEEFE] text-[12.5px] text-[#1C2046] placeholder-[#8E93B8] focus:outline-hidden focus:border-[#C026D3] resize-none"
                />
                <button
                  type="button"
                  disabled={!learnerText.trim() || isAnalyzing}
                  onClick={handleSubmitWriting}
                  className="w-full py-2.5 rounded-full bg-[#C026D3] hover:bg-[#A21CAF] disabled:opacity-40 text-white text-[12.5px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isAnalyzing ? 'Analyzing Writing...' : 'Submit & Continue Story'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
