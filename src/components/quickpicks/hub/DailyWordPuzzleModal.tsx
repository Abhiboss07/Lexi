import React, { useState, useEffect } from 'react';
import { X, Lightbulb, Sparkles, CheckCircle2 } from 'lucide-react';
import type { PracticePreferences } from '../../../types/practicePreferences';
import { getDailyWordPuzzle, type DailyWordPuzzle } from '../../../services/activityHubService';
import { quickPicksRepository } from '../../../db/quickPicksRepository';
import { practiceRepository } from '../../../db/practiceRepository';
import { getLocalDateString } from '../../../services/dailyPracticeService';

interface DailyWordPuzzleModalProps {
  userId?: string;
  isOpen: boolean;
  preferences?: PracticePreferences;
  onClose: () => void;
}

export const DailyWordPuzzleModal: React.FC<DailyWordPuzzleModalProps> = ({
  userId = 'local-learner-1',
  isOpen,
  preferences,
  onClose,
}) => {
  const [puzzle, setPuzzle] = useState<DailyWordPuzzle | null>(null);
  const [enteredLetters, setEnteredLetters] = useState<string[]>([]);
  const [isCompletedToday, setIsCompletedToday] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const today = getDailyWordPuzzle();
    setPuzzle(today);
    setEnteredLetters([]);
    setIsSuccess(false);
    setIsError(false);
    setHintRevealed(false);

    // Check if already completed today to prevent double reward
    const dateStr = getLocalDateString();
    quickPicksRepository.getActivityCompletion(userId, 'daily-word-puzzle', dateStr).then((comp) => {
      if (comp) {
        setIsCompletedToday(true);
        setIsSuccess(true);
      } else {
        setIsCompletedToday(false);
      }
    });
  }, [isOpen, userId]);

  if (!isOpen || !puzzle) return null;

  const targetChars = puzzle.targetWord.split('');

  const handleSelectLetter = (char: string) => {
    if (isSuccess || isCompletedToday) return;
    if (enteredLetters.length < targetChars.length) {
      setEnteredLetters((prev) => [...prev, char]);
      setIsError(false);
    }
  };

  const handleBackspace = () => {
    if (isSuccess || isCompletedToday) return;
    setEnteredLetters((prev) => prev.slice(0, -1));
    setIsError(false);
  };

  const handleCheckWord = async () => {
    const word = enteredLetters.join('').toUpperCase();
    if (word === puzzle.targetWord) {
      setIsSuccess(true);
      setIsError(false);

      if (!isCompletedToday) {
        const dateStr = getLocalDateString();
        await quickPicksRepository.recordActivityCompletion({
          id: `${userId}-puzzle-${dateStr}`,
          userId,
          activityId: 'daily-word-puzzle',
          date: dateStr,
          score: 100,
          completedAt: new Date().toISOString(),
        });

        await practiceRepository.recordSession({
          userId,
          category: 'word-puzzle',
          difficulty: preferences?.defaultDifficulty || 'medium',
          sessionLength: 'quick',
          durationMinutes: 3,
          score: 100,
        });

        setIsCompletedToday(true);
      }
    } else {
      setIsError(true);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#15164B]/40 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="word-puzzle-title"
    >
      <div className="w-full max-w-[460px] bg-white rounded-[32px] p-5 sm:p-6 shadow-2xl border border-[#ECEEFE] space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#545CA6] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6243]" />
              <span>Daily Brain Workout</span>
            </span>
            <h2 id="word-puzzle-title" className="text-[20px] font-black text-[#15164B] tracking-tight">
              Daily Word Puzzle
            </h2>
            <p className="text-[12px] font-medium text-[#6B7094]">
              Decipher today's vocabulary word from contextual clues.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] text-[#222149] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Word Puzzle"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Clue Box */}
        <div className="p-4 rounded-2xl bg-[#F6F7FE] border border-[#ECEEFE] space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#545CA6]">
            <span>Today's Clue:</span>
            <span>Level: {puzzle.cefrLevel}</span>
          </div>
          <p className="text-[13.5px] font-extrabold text-[#15164B]">
            "{puzzle.clue}"
          </p>
          {hintRevealed && (
            <p className="text-[11.5px] text-[#92400E] bg-[#FEF3C7] p-2 rounded-xl border border-[#FDE68A] animate-in fade-in">
              <strong>Definition:</strong> {puzzle.definition}
            </p>
          )}
        </div>

        {/* Letter Boxes Display */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 py-2">
          {targetChars.map((_, idx) => {
            const letter = isSuccess || isCompletedToday
              ? targetChars[idx]
              : enteredLetters[idx] || '';

            return (
              <div
                key={idx}
                className={`w-9 h-11 sm:w-10 sm:h-12 rounded-xl flex items-center justify-center text-[18px] font-black transition-all border ${
                  isSuccess || isCompletedToday
                    ? 'bg-[#ECFDF5] border-[#10B981] text-[#065F46]'
                    : letter
                    ? 'bg-white border-[#545CA6] text-[#15164B] shadow-xs'
                    : 'bg-[#F9FAFF] border-[#D5D8EE] text-transparent'
                }`}
              >
                {letter}
              </div>
            );
          })}
        </div>

        {/* Error message */}
        {isError && (
          <p className="text-[12px] font-bold text-[#DC2626] text-center animate-in fade-in">
            Not quite! Clear letters and re-inspect the clue.
          </p>
        )}

        {/* Success Banner */}
        {(isSuccess || isCompletedToday) && (
          <div className="p-3.5 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-center space-y-1 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-[#10B981] mx-auto" />
            <h4 className="text-[14px] font-black text-[#065F46]">
              Solved: {puzzle.targetWord}!
            </h4>
            <p className="text-[11.5px] text-[#047857]">
              {puzzle.definition}
            </p>
          </div>
        )}

        {/* Keyboard / Letter Bank */}
        {!isSuccess && !isCompletedToday && (
          <div className="space-y-3 pt-1">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {puzzle.letterBank.map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => handleSelectLetter(char)}
                  className="w-10 h-10 rounded-xl bg-white border border-[#D5D8EE] text-[#15164B] text-[15px] font-black shadow-xs hover:bg-[#ECEFFD] hover:border-[#545CA6] active:scale-95 transition-all cursor-pointer"
                >
                  {char}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#F0F2FE]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBackspace}
                  disabled={enteredLetters.length === 0}
                  className="px-3 py-2 rounded-xl text-[11.5px] font-bold text-[#6B7094] hover:bg-[#F4F5FD] disabled:opacity-40 cursor-pointer transition-colors"
                >
                  Clear Last
                </button>
                {preferences?.hintsEnabled !== false && !hintRevealed && (
                  <button
                    type="button"
                    onClick={() => setHintRevealed(true)}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-[11.5px] font-bold text-[#D97706] hover:bg-[#FFFBEB] cursor-pointer transition-colors"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Show Hint</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleCheckWord}
                disabled={enteredLetters.length !== targetChars.length}
                className="px-5 py-2.5 rounded-full bg-[#15164B] hover:bg-[#0E1038] disabled:opacity-40 text-white text-[12.5px] font-bold shadow-md transition-all cursor-pointer"
              >
                Submit Word
              </button>
            </div>
          </div>
        )}

        {/* Close Button when finished */}
        {(isSuccess || isCompletedToday) && (
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-full bg-[#15164B] hover:bg-[#0E1038] text-white text-[13px] font-black cursor-pointer shadow-md"
            >
              Done & Return
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
