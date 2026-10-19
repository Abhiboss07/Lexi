import React, { useState, useEffect } from 'react';
import { X, Bookmark, BookmarkCheck, Check, Sparkles, Volume2, Info } from 'lucide-react';
import type { PracticePreferences } from '../../../types/practicePreferences';
import { getTodayIdiom, type DailyIdiom } from '../../../services/activityHubService';
import { quickPicksRepository } from '../../../db/quickPicksRepository';
import { practiceRepository } from '../../../db/practiceRepository';
import { getLocalDateString } from '../../../services/dailyPracticeService';

interface IdiomOfTheDayModalProps {
  userId?: string;
  isOpen: boolean;
  preferences?: PracticePreferences;
  onClose: () => void;
}

export const IdiomOfTheDayModal: React.FC<IdiomOfTheDayModalProps> = ({
  userId = 'local-learner-1',
  isOpen,
  preferences,
  onClose,
}) => {
  const [idiom, setIdiom] = useState<DailyIdiom | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const today = getTodayIdiom();
    setIdiom(today);
    setSelectedOption(null);
    setIsAnswerChecked(false);

    // Check if bookmarked
    quickPicksRepository.getBookmarkedIdioms(userId).then((bookmarks) => {
      const match = bookmarks.some((b) => b.expression.toLowerCase() === today.expression.toLowerCase());
      setIsBookmarked(match);
    });
  }, [isOpen, userId]);

  if (!isOpen || !idiom) return null;

  const handleToggleBookmark = async () => {
    if (isBookmarked) {
      await quickPicksRepository.deleteBookmarkedIdiom(userId, idiom.expression);
      setIsBookmarked(false);
    } else {
      await quickPicksRepository.saveBookmarkedIdiom({
        id: `${userId}-${idiom.expression.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        userId,
        expression: idiom.expression,
        meaning: idiom.meaning,
        example: idiom.example,
        bookmarkedAt: new Date().toISOString(),
      });
      setIsBookmarked(true);
    }
  };

  const handlePlayAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`${idiom.expression}. ${idiom.meaning}`);
      utterance.lang = 'en-US';
      utterance.rate = preferences?.defaultDifficulty === 'easy' ? 0.8 : 1.0;
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCheckAnswer = async (idx: number) => {
    setSelectedOption(idx);
    setIsAnswerChecked(true);

    const isCorrect = idx === idiom.practiceQuestion.correctIndex;
    const dateStr = getLocalDateString();

    await quickPicksRepository.recordActivityCompletion({
      id: `${userId}-idiom-${dateStr}`,
      userId,
      activityId: 'idiom-of-the-day',
      date: dateStr,
      score: isCorrect ? 100 : 50,
      completedAt: new Date().toISOString(),
    });

    await practiceRepository.recordSession({
      userId,
      category: 'idiom-practice',
      difficulty: preferences?.defaultDifficulty || 'medium',
      sessionLength: 'quick',
      durationMinutes: 2,
      score: isCorrect ? 100 : 50,
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#15164B]/40 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="idiom-modal-title"
    >
      <div className="w-full max-w-[460px] bg-white rounded-[32px] p-5 sm:p-6 shadow-2xl border border-[#ECEEFE] space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#545CA6] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6243]" />
              <span>Expression of the Day</span>
            </span>
            <h2 id="idiom-modal-title" className="text-[20px] font-black text-[#15164B] tracking-tight">
              Idiom & Phrase
            </h2>
            <p className="text-[12px] font-medium text-[#6B7094]">
              Expand your conversational fluency with authentic idiomatic language.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleBookmark}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                isBookmarked 
                  ? 'bg-[#ECEFFD] text-[#545CA6]' 
                  : 'bg-[#F4F5FD] hover:bg-[#E8EBFB] text-[#7D82A8]'
              }`}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark this expression'}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this expression'}
            >
              {isBookmarked ? <BookmarkCheck className="w-4 h-4 text-[#545CA6]" /> : <Bookmark className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] text-[#222149] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close Idiom modal"
            >
              <X className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* Featured Expression Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#F0F2FE] to-[#F9FAFF] border border-[#DEE3FA] space-y-2.5">
          <div className="flex items-start justify-between">
            <h3 className="text-[18px] font-black text-[#15164B] tracking-tight leading-snug">
              "{idiom.expression}"
            </h3>
            <button
              type="button"
              onClick={handlePlayAudio}
              className={`p-2 rounded-xl bg-white border border-[#D5D8EE] text-[#545CA6] hover:bg-[#ECEFFD] cursor-pointer shadow-2xs transition-colors shrink-0 ${
                isPlayingAudio ? 'ring-2 ring-[#545CA6]' : ''
              }`}
              aria-label="Listen to idiom pronunciation"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5 text-[12.5px]">
            <p className="text-[#222149] font-medium">
              <strong className="text-[#15164B]">Meaning:</strong> {idiom.meaning}
            </p>
            <p className="text-[#474B75] italic bg-white p-2.5 rounded-xl border border-[#ECEEFE]">
              "{idiom.example}"
            </p>
          </div>

          <p className="text-[10.5px] text-[#7D82A8]">
            <Info className="w-3 h-3 inline mr-1 text-[#545CA6] -mt-0.5" />
            {idiom.originOrContext}
          </p>
        </div>

        {/* Practice Question */}
        <div className="space-y-2.5 pt-1">
          <label className="text-[12px] font-bold text-[#15164B] uppercase tracking-wider block">
            Quick Understanding Check:
          </label>
          <p className="text-[13px] font-semibold text-[#222149]">
            {idiom.practiceQuestion.prompt}
          </p>

          <div className="space-y-2">
            {idiom.practiceQuestion.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === idiom.practiceQuestion.correctIndex;
              let style = 'bg-white border-[#E2E6FA] text-[#222149] hover:bg-[#F9FAFF]';

              if (isAnswerChecked) {
                if (isCorrect) {
                  style = 'bg-[#ECFDF5] border-[#10B981] text-[#065F46] font-extrabold';
                } else if (isSelected) {
                  style = 'bg-[#FEF2F2] border-[#EF4444] text-[#991B1B] font-bold';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => !isAnswerChecked && handleCheckAnswer(idx)}
                  disabled={isAnswerChecked}
                  className={`w-full p-3 rounded-xl border text-left text-[12.5px] transition-all cursor-pointer flex items-center justify-between ${style}`}
                >
                  <span>{opt}</span>
                  {isAnswerChecked && isCorrect && <Check className="w-4 h-4 text-[#10B981] stroke-[3]" />}
                </button>
              );
            })}
          </div>

          {isAnswerChecked && (
            <div className="p-3 rounded-2xl bg-[#F0F3FE] border border-[#DEE3FA] text-[12px] text-[#222149] leading-relaxed space-y-1 animate-in fade-in">
              <span className="font-extrabold text-[#545CA6] block">Insight:</span>
              <p>{idiom.practiceQuestion.explanation}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-[#15164B] hover:bg-[#0E1038] text-white text-[12.5px] font-bold cursor-pointer shadow-md transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
