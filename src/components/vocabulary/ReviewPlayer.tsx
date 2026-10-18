import React, { useState } from 'react';
import { X, Volume2, Sparkles, Trophy, ArrowRight, RotateCw, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Grade } from 'ts-fsrs';
import type { VocabularyCardRecord } from '../../types/vocabulary';
import { getRatingPreviews } from '../../services/fsrsScheduler';
import { vocabularyRepository } from '../../db/vocabularyRepository';

interface ReviewPlayerProps {
  cards: VocabularyCardRecord[];
  onClose: () => void;
  onFinishedReview?: (reviewedCount: number) => void;
}

export const ReviewPlayer: React.FC<ReviewPlayerProps> = ({
  cards,
  onClose,
  onFinishedReview,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const currentCard = cards[currentIdx];

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleRate = async (rating: Grade) => {
    if (!currentCard) return;

    try {
      await vocabularyRepository.recordReview(currentCard, rating);
    } catch (err) {
      console.warn('Error recording review to repository:', err);
    }

    const nextCount = reviewedCount + 1;
    setReviewedCount(nextCount);

    if (currentIdx + 1 < cards.length) {
      setIsFlipped(false);
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsFinished(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#232655', '#646AA4', '#10B981', '#F59E0B'],
      });
      if (onFinishedReview) {
        onFinishedReview(nextCount);
      }
    }
  };

  const handleSafeExit = () => {
    if (isFinished) {
      onClose();
    } else {
      setShowExitConfirm(true);
    }
  };

  // If no cards are due or empty
  if ((!cards || cards.length === 0) && !isFinished) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Vocabulary Review"
      >
        <div className="w-full max-w-[380px] bg-white rounded-3xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#ECFDF5] text-[#10B981] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-[17px] font-extrabold text-[#1C2046]">All Caught Up!</h3>
          <p className="text-[13px] text-[#6B7094] leading-relaxed">
            You don't have any vocabulary cards due for review right now.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-full bg-[#232655] text-white text-[13px] font-bold cursor-pointer"
          >
            Back to Notebook
          </button>
        </div>
      </div>
    );
  }

  // Previews for current card ratings
  const ratingPreviews = currentCard ? getRatingPreviews(currentCard) : [];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-header-title"
    >
      <div className="w-full max-w-[430px] h-full sm:h-auto sm:max-h-[92vh] sm:rounded-[36px] bg-[#F6F7FE] shadow-2xl border border-[#ECEEFE] flex flex-col overflow-hidden relative">
        
        {/* Top Header & Progress */}
        <header className="p-4 bg-white border-b border-[#ECEEFE] shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSafeExit}
                className="w-9 h-9 rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] flex items-center justify-center text-[#222149] transition-colors cursor-pointer"
                aria-label="Exit review"
              >
                <X className="w-5 h-5 stroke-[2.2]" />
              </button>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#646AA4]">
                  Spaced Repetition
                </span>
                <h1 id="review-header-title" className="text-[15px] font-extrabold text-[#1C2046] leading-none">
                  Vocabulary Review
                </h1>
              </div>
            </div>

            <span className="text-[11.5px] font-bold text-[#545CA6] bg-[#ECEFFD] px-2.5 py-1 rounded-full">
              {isFinished ? cards.length : currentIdx + 1} / {cards.length}
            </span>
          </div>

          {/* Segmented Progress Bar */}
          <div className="w-full bg-[#EAEFFA] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#232655] h-full rounded-full transition-all duration-300"
              style={{
                width: `${((isFinished ? cards.length : currentIdx) / cards.length) * 100}%`,
              }}
            />
          </div>
        </header>

        {/* Card Stage / Completion Stage */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col justify-center">
          {isFinished ? (
            /* Completed Screen */
            <div className="text-center space-y-5 py-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-3xl bg-amber-50 border-2 border-amber-200 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
                <Trophy className="w-10 h-10 stroke-[1.8]" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-[22px] font-black text-[#15164B]">
                  Review Completed!
                </h2>
                <p className="text-[13px] text-[#6B7094] max-w-[280px] mx-auto leading-relaxed">
                  Excellent work! You reviewed {reviewedCount} {reviewedCount === 1 ? 'word' : 'words'}. FSRS has updated their memory retention intervals.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#ECEEFE] flex items-center justify-around max-w-[260px] mx-auto">
                <div className="text-center">
                  <span className="text-[20px] font-black text-[#1C2046]">{reviewedCount}</span>
                  <p className="text-[11px] font-bold text-[#8E93B8] uppercase">Reviewed</p>
                </div>
                <div className="h-8 w-px bg-[#ECEEFE]" />
                <div className="text-center">
                  <span className="text-[20px] font-black text-[#10B981]">100%</span>
                  <p className="text-[11px] font-bold text-[#8E93B8] uppercase">Updated</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3.5 rounded-full bg-[#1E224E] hover:bg-[#141738] text-white text-[14px] font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Back to Notebook</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          ) : currentCard ? (
            /* Interactive 3D Flashcard */
            <div className="space-y-4">
              <div 
                onClick={() => setIsFlipped(!isFlipped)}
                className={`w-full min-h-[260px] sm:min-h-[290px] rounded-3xl p-6 sm:p-7 border transition-all duration-300 flex flex-col justify-between cursor-pointer relative ${
                  isFlipped
                    ? 'bg-white border-[#CCD1F0] shadow-xl'
                    : 'bg-white border-[#E0E4FC] shadow-lg hover:border-[#B5BCF0]'
                }`}
              >
                {/* Front of Card */}
                {!isFlipped ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ECEFFD] text-[#545CA6] uppercase">
                        {currentCard.item.cefrLevel} • {currentCard.item.partOfSpeech || 'Word'}
                      </span>
                      <button
                        type="button"
                        onClick={handleSpeak.bind(null, currentCard.item.word)}
                        className="w-9 h-9 rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] text-[#222149] flex items-center justify-center transition-colors cursor-pointer"
                        aria-label={`Listen to pronunciation of ${currentCard.item.word}`}
                      >
                        <Volume2 className="w-4.5 h-4.5 text-[#545CA6]" />
                      </button>
                    </div>

                    <div className="text-center py-6 space-y-2">
                      <h2 className="text-[32px] sm:text-[36px] font-black text-[#15164B] tracking-tight">
                        {currentCard.item.word}
                      </h2>
                      {currentCard.item.phoneticIpa && (
                        <p className="text-[15px] text-[#6B7094] font-mono">
                          {currentCard.item.phoneticIpa}
                        </p>
                      )}
                    </div>

                    <div className="text-center pt-2">
                      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#545CA6] bg-[#F4F5FD] px-4 py-2 rounded-full hover:bg-[#E8EBFB] transition-colors">
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Tap to Reveal Definition</span>
                      </span>
                    </div>
                  </>
                ) : (
                  /* Back of Card (Flipped) */
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-[#F4F5FD] pb-3">
                      <div>
                        <h3 className="text-[22px] font-black text-[#15164B]">
                          {currentCard.item.word}
                        </h3>
                        <p className="text-[12px] text-[#6B7094] font-mono">
                          {currentCard.item.phoneticIpa || ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleSpeak.bind(null, currentCard.item.word)}
                        className="w-8 h-8 rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] text-[#222149] flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="Listen audio"
                      >
                        <Volume2 className="w-4 h-4 text-[#545CA6]" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E93B8]">
                        Meaning
                      </span>
                      <p className="text-[15px] font-medium text-[#1E224E] leading-relaxed">
                        {currentCard.item.definition}
                      </p>
                    </div>

                    {currentCard.item.exampleSentence && (
                      <div className="p-3 rounded-2xl bg-[#FAF9FE] border border-[#F0F1FB] space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E93B8]">
                          Example in Context
                        </span>
                        <p className="text-[13px] text-[#555E92] italic leading-relaxed">
                          "{currentCard.item.exampleSentence}"
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </main>

        {/* FSRS 4-Tier Rating Action Footer */}
        {!isFinished && (
          <footer className="p-4 bg-white border-t border-[#ECEEFE] shrink-0">
            {!isFlipped ? (
              <button
                type="button"
                onClick={() => setIsFlipped(true)}
                className="w-full py-3.5 rounded-full bg-[#1E224E] hover:bg-[#141738] text-white text-[14px] font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Reveal Meaning</span>
                <Sparkles className="w-4 h-4" />
              </button>
            ) : (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[#8E93B8] uppercase tracking-wider block text-center">
                  How well did you know this word?
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {ratingPreviews.map((preview) => (
                    <button
                      key={preview.rating}
                      type="button"
                      onClick={() => handleRate(preview.rating)}
                      className={`py-2 px-1 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${preview.colorClass}`}
                    >
                      <span className="text-[13px] font-extrabold leading-tight">
                        {preview.label}
                      </span>
                      <span className="text-[10.5px] opacity-80 font-medium">
                        {preview.intervalText}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </footer>
        )}

        {/* Exit Confirmation Dialog */}
        {showExitConfirm && (
          <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-[320px] bg-white rounded-3xl p-5 shadow-2xl border border-[#ECEEFE] space-y-3 text-center">
              <h3 className="text-[16px] font-extrabold text-[#1C2046]">
                Leave Review Session?
              </h3>
              <p className="text-[12.5px] text-[#636C9E]">
                Your completed ratings are saved. You can finish the remaining due cards anytime.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-2.5 rounded-full bg-[#ECEFFD] text-[#545CA6] text-[13px] font-bold cursor-pointer"
                >
                  Stay
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-full bg-[#1E224E] text-white text-[13px] font-bold cursor-pointer"
                >
                  Exit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
