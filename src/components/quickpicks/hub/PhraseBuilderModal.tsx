import React, { useState, useEffect } from 'react';
import { X, Check, RotateCcw, HelpCircle, Sparkles, ArrowRight, Lightbulb } from 'lucide-react';
import type { PracticePreferences } from '../../../types/practicePreferences';
import { 
  getPhraseBuilderItems, 
  type PhraseTopic, 
  type PhraseBuilderItem 
} from '../../../services/activityHubService';
import { quickPicksRepository } from '../../../db/quickPicksRepository';
import { practiceRepository } from '../../../db/practiceRepository';
import { getLocalDateString } from '../../../services/dailyPracticeService';

interface PhraseBuilderModalProps {
  userId?: string;
  isOpen: boolean;
  preferences?: PracticePreferences;
  onClose: () => void;
}

export const PhraseBuilderModal: React.FC<PhraseBuilderModalProps> = ({
  userId = 'local-learner-1',
  isOpen,
  preferences,
  onClose,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<PhraseTopic>('everyday');
  const [items, setItems] = useState<PhraseBuilderItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [placedWords, setPlacedWords] = useState<string[]>([]);
  const [bankWords, setBankWords] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const diff = preferences?.defaultDifficulty || 'medium';
    const list = getPhraseBuilderItems(selectedTopic, diff);
    setItems(list);
    setCurrentIndex(0);
    resetQuestion(list[0]);
    setScore(0);
    setCompletedCount(0);
  }, [isOpen, selectedTopic, preferences?.defaultDifficulty]);

  const resetQuestion = (item?: PhraseBuilderItem) => {
    if (!item) return;
    setBankWords([...item.scrambledWords]);
    setPlacedWords([]);
    setIsSubmitted(false);
    setIsCorrect(false);
    setShowHint(false);
  };

  if (!isOpen) return null;

  const currentItem = items[currentIndex];

  const handleWordClick = (word: string, indexInBank: number) => {
    if (isSubmitted) return;
    setPlacedWords((prev) => [...prev, word]);
    setBankWords((prev) => prev.filter((_, idx) => idx !== indexInBank));
  };

  const handlePlacedWordClick = (word: string, indexInPlaced: number) => {
    if (isSubmitted) return;
    setBankWords((prev) => [...prev, word]);
    setPlacedWords((prev) => prev.filter((_, idx) => idx !== indexInPlaced));
  };

  const handleCheck = async () => {
    if (!currentItem || placedWords.length === 0) return;
    const userSentence = placedWords.join(' ');
    const correct = userSentence.trim() === currentItem.targetSentence.trim();
    setIsCorrect(correct);
    setIsSubmitted(true);

    const newScore = correct ? score + 1 : score;
    const newCompleted = completedCount + 1;
    setScore(newScore);
    setCompletedCount(newCompleted);

    // Record activity completion
    const dateStr = getLocalDateString();
    await quickPicksRepository.recordActivityCompletion({
      id: `${userId}-phrase-builder-${dateStr}`,
      userId,
      activityId: 'phrase-builder',
      date: dateStr,
      score: Math.round((newScore / Math.max(1, newCompleted)) * 100),
      completedAt: new Date().toISOString(),
    });

    await practiceRepository.recordSession({
      userId,
      category: 'phrase-builder',
      difficulty: preferences?.defaultDifficulty || 'medium',
      sessionLength: preferences?.defaultSessionLength || 'quick',
      durationMinutes: 3,
      score: correct ? 100 : 50,
      activityId: currentItem.id,
    });
  };

  const handleNext = () => {
    if (currentIndex + 1 < items.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      resetQuestion(items[nextIdx]);
    } else {
      // Loop or finish
      resetQuestion(items[0]);
      setCurrentIndex(0);
    }
  };

  const handleResetCurrent = () => {
    resetQuestion(currentItem);
  };

  const topics: Array<{ id: PhraseTopic; label: string }> = [
    { id: 'everyday', label: 'Everyday' },
    { id: 'travel', label: 'Travel' },
    { id: 'workplace', label: 'Workplace' },
    { id: 'interview', label: 'Interview' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#15164B]/40 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="phrase-builder-title"
    >
      <div className="w-full max-w-[460px] bg-white rounded-[32px] p-5 sm:p-6 shadow-2xl border border-[#ECEEFE] space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#545CA6] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6243]" />
              <span>Sentence Construction</span>
            </span>
            <h2 id="phrase-builder-title" className="text-[20px] font-black text-[#15164B] tracking-tight">
              Phrase Builder
            </h2>
            <p className="text-[12px] font-medium text-[#6B7094]">
              Arrange words in natural order to master English sentence patterns.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] text-[#222149] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Phrase Builder"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Topic Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {topics.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTopic(t.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                selectedTopic === t.id
                  ? 'bg-[#15164B] text-white shadow-xs'
                  : 'bg-[#F4F5FD] text-[#6B7094] hover:bg-[#E8EBFB]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Current Target Card */}
        {currentItem && (
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#8E93B8]">
              <span>Topic: {selectedTopic.toUpperCase()}</span>
              <span>Level: {currentItem.cefrLevel} • {currentItem.difficulty}</span>
            </div>

            {/* Placed Words Slot Container */}
            <div className="min-h-[76px] p-3.5 rounded-2xl bg-[#F6F7FE] border-2 border-dashed border-[#D5D8EE] flex flex-wrap items-center gap-1.5">
              {placedWords.length === 0 ? (
                <span className="text-[12px] text-[#8E93B8] italic select-none">
                  Tap words below to build your sentence...
                </span>
              ) : (
                placedWords.map((w, idx) => (
                  <button
                    key={`${w}-${idx}`}
                    type="button"
                    onClick={() => handlePlacedWordClick(w, idx)}
                    disabled={isSubmitted}
                    className="px-3 py-1.5 rounded-xl bg-white text-[#15164B] font-bold text-[13px] border border-[#C5CCFA] shadow-xs hover:border-[#FF6243] hover:text-[#FF6243] cursor-pointer transition-all active:scale-95"
                    aria-label={`Remove ${w}`}
                  >
                    {w}
                  </button>
                ))
              )}
            </div>

            {/* Bank Words */}
            <div className="flex flex-wrap items-center gap-1.5 min-h-[44px]">
              {bankWords.map((w, idx) => (
                <button
                  key={`${w}-${idx}`}
                  type="button"
                  onClick={() => handleWordClick(w, idx)}
                  disabled={isSubmitted}
                  className="px-3 py-1.5 rounded-xl bg-[#ECEFFD] text-[#222149] font-bold text-[13px] border border-[#DEE3FA] hover:bg-[#DEE3FA] hover:border-[#545CA6] cursor-pointer transition-all active:scale-95"
                  aria-label={`Add ${w}`}
                >
                  {w}
                </button>
              ))}
            </div>

            {/* Hint / Explanation */}
            {showHint && (
              <div className="p-3 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-[11.5px] text-[#92400E] flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <span>{currentItem.patternTip}</span>
              </div>
            )}

            {/* Feedback result */}
            {isSubmitted && (
              <div className={`p-3.5 rounded-2xl border space-y-1.5 animate-in fade-in ${
                isCorrect ? 'bg-[#ECFDF5] border-[#A7F3D0]' : 'bg-[#FEF2F2] border-[#FECACA]'
              }`}>
                <div className="flex items-center gap-2 font-bold text-[13px]">
                  {isCorrect ? (
                    <>
                      <Check className="w-4 h-4 text-[#059669] stroke-[3]" />
                      <span className="text-[#059669]">Exact Word Order!</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 text-[#DC2626] stroke-[3]" />
                      <span className="text-[#DC2626]">Not Quite: Inspect Word Order</span>
                    </>
                  )}
                </div>
                {!isCorrect && (
                  <p className="text-[12px] font-bold text-[#15164B]">
                    Correct: "{currentItem.targetSentence}"
                  </p>
                )}
                <p className="text-[11.5px] text-[#474B75] leading-relaxed">
                  {currentItem.explanation}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#F0F2FE]">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleResetCurrent}
                  disabled={isSubmitted}
                  className="p-2 rounded-xl text-[#7D82A8] hover:bg-[#F4F5FD] hover:text-[#15164B] transition-colors cursor-pointer"
                  title="Reset sentence"
                  aria-label="Reset words"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                {preferences?.hintsEnabled !== false && (
                  <button
                    type="button"
                    onClick={() => setShowHint(!showHint)}
                    className="p-2 rounded-xl text-[#7D82A8] hover:bg-[#F4F5FD] hover:text-[#D97706] transition-colors cursor-pointer"
                    title="Toggle grammar hint"
                    aria-label="Toggle hint"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isSubmitted ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-full bg-[#15164B] text-white text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer shadow-md hover:bg-[#0E1038] transition-all"
                >
                  <span>Next Sentence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCheck}
                  disabled={placedWords.length === 0}
                  className="px-5 py-2.5 rounded-full bg-[#545CA6] hover:bg-[#434A8E] disabled:opacity-50 text-white text-[12.5px] font-bold cursor-pointer shadow-sm transition-all"
                >
                  Check Sentence
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
