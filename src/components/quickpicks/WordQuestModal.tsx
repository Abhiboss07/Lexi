import React, { useState, useEffect } from 'react';
import {
  X,
  Trophy,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Zap,
  Clock,
} from 'lucide-react';
import type { WordQuestQuestion, WordQuestResult } from '../../types/quickPicks';
import { getWordQuestQuestions } from '../../services/quickPicksService';
import { quickPicksRepository } from '../../db/quickPicksRepository';

interface WordQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onCompleteExercise?: () => void;
}

export const WordQuestModal: React.FC<WordQuestModalProps> = ({
  isOpen,
  onClose,
  userId = 'local-learner-1',
  onCompleteExercise,
}) => {
  const [questions, setQuestions] = useState<WordQuestQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [roundCompleted, setRoundCompleted] = useState(false);

  // Match mode specific state
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({});
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Optional gentle timer toggle (no manipulative penalties)
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(90);

  const startNewRound = () => {
    // Deterministic date offset plus random round seed
    const daySeed = new Date().getDate() + Math.floor(Math.random() * 5);
    const roundQuestions = getWordQuestQuestions(4, daySeed);
    setQuestions(roundQuestions);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setIsCorrect(false);
    setScore(0);
    setRoundCompleted(false);
    setMatchedPairs({});
    setSelectedWord(null);
    setSecondsRemaining(90);
  };

  useEffect(() => {
    if (isOpen) {
      startNewRound();
    }
  }, [isOpen]);

  // Gentle timer countdown
  useEffect(() => {
    if (!isOpen || roundCompleted || !timerEnabled || isAnswerChecked) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, roundCompleted, timerEnabled, isAnswerChecked]);

  const currentQ = questions[currentIndex] || questions[0];

  const handleCheckAnswer = () => {
    if (!currentQ) return;

    if (currentQ.mode === 'match') {
      const allMatched =
        currentQ.pairs &&
        currentQ.pairs.every((p) => matchedPairs[p.word] === p.meaning);
      const passed = Boolean(allMatched);
      setIsCorrect(passed);
      if (passed) setScore((s) => s + 25);
    } else {
      const passed = selectedOption === currentQ.correctAnswer;
      setIsCorrect(passed);
      if (passed) setScore((s) => s + 25);
    }
    setIsAnswerChecked(true);
  };

  const handleNextQuestion = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
      setIsCorrect(false);
      setSelectedWord(null);
    } else {
      // Complete round
      setRoundCompleted(true);
      const totalQ = questions.length;
      const finalScore = score + (isCorrect ? 25 : 0);
      const accuracy = Math.round((finalScore / (totalQ * 25)) * 100);

      const result: WordQuestResult = {
        id: `wq-res-${Date.now()}`,
        userId,
        date: new Date().toISOString().split('T')[0],
        score: finalScore,
        totalQuestions: totalQ,
        accuracy,
        mode: currentQ.mode,
        completedAt: new Date().toISOString(),
      };

      try {
        await quickPicksRepository.saveWordQuestResult(result);
        if (onCompleteExercise) onCompleteExercise();
      } catch (err) {
        console.error('Failed to save quest result:', err);
      }
    }
  };

  const handleMatchSelect = (word: string, meaning: string) => {
    setMatchedPairs((prev) => ({
      ...prev,
      [word]: meaning,
    }));
    setSelectedWord(null);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#15164B]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="word-quest-title"
    >
      <div className="bg-[#FAF9FE] w-full max-w-lg rounded-[28px] border border-[#E2E6FD] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#ECEEFE] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EFF2FE] border border-[#D5D8EE] flex items-center justify-center text-[#545CA6]">
              <Trophy className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="word-quest-title" className="text-[17px] font-black text-[#15164B] tracking-tight">
                  Word Quest
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full">
                  Mini Language Game
                </span>
              </div>
              <p className="text-[11.5px] font-medium text-[#7D82A8]">
                1–3 minute bite-sized games to sharpen vocabulary in context
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F0F2FE] hover:bg-[#E2E6FD] text-[#545CA6] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close word quest modal"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {roundCompleted ? (
            /* Round Completion Summary */
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#059669] mx-auto shadow-xs">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[20px] font-black text-[#15164B]">Quest Round Complete!</h3>
                <p className="text-[12.5px] text-[#5B618E] font-medium max-w-sm mx-auto">
                  You earned <strong className="text-[#059669]">{score} pts</strong> across {questions.length} challenges.
                </p>
              </div>

              {/* Scorecard */}
              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto p-4 bg-white rounded-2xl border border-[#ECEEFE] shadow-xs">
                <div>
                  <span className="text-[22px] font-black text-[#15164B] block">{score}</span>
                  <span className="text-[10px] font-bold text-[#8E93B8] uppercase">Total Score</span>
                </div>
                <div>
                  <span className="text-[22px] font-black text-[#059669] block">
                    {Math.round((score / (questions.length * 25)) * 100)}%
                  </span>
                  <span className="text-[10px] font-bold text-[#8E93B8] uppercase">Accuracy</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={startNewRound}
                  className="px-5 py-2.5 rounded-full bg-[#15164B] hover:bg-[#0E1038] text-white text-[12.5px] font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                  <span>Play Another Round</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-full bg-white border border-[#D5D8EE] text-[#5B618E] text-[12.5px] font-bold hover:bg-[#F0F2FE]"
                >
                  Return to Home
                </button>
              </div>
            </div>
          ) : currentQ ? (
            /* Active Question Card */
            <div className="space-y-4">
              {/* Progress & Controls Bar */}
              <div className="flex items-center justify-between gap-2 pb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11.5px] font-extrabold text-[#15164B]">
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                  <span className="text-[9.5px] font-bold text-[#545CA6] bg-[#ECEFFD] px-2 py-0.5 rounded-full uppercase">
                    Level {currentQ.cefrLevel}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTimerEnabled(!timerEnabled)}
                    className={`text-[10.5px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors ${
                      timerEnabled
                        ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                        : 'bg-[#F0F2FE] text-[#6B7094]'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{timerEnabled ? `${secondsRemaining}s` : 'Timer Off'}</span>
                  </button>
                  <span className="text-[12px] font-black text-[#545CA6] bg-[#ECEFFD] px-2 py-0.5 rounded-md">
                    {score} pts
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#E2E6FD] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#545CA6] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Question Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#ECEEFE] shadow-xs space-y-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#545CA6]">
                  <Zap className="w-3.5 h-3.5" />
                  <span>
                    {currentQ.mode === 'choice' && 'Fill in the Blank'}
                    {currentQ.mode === 'match' && 'Match the Pairs'}
                    {currentQ.mode === 'find_error' && 'Find the Incorrect Word'}
                    {currentQ.mode === 'rapid_phrase' && 'Rapid Phrase Completion'}
                  </span>
                </div>

                <h3 className="text-[15px] font-black text-[#15164B] leading-snug">
                  {currentQ.prompt}
                </h3>

                {currentQ.sentenceWithBlank && (
                  <div className="p-3 bg-[#F6F7FE] rounded-xl border border-[#E4E7F7] text-[13.5px] font-bold text-[#232655]">
                    {currentQ.sentenceWithBlank}
                  </div>
                )}

                {currentQ.highlightedSentence && (
                  <div className="p-3 bg-[#FFF7ED] rounded-xl border border-[#FED7AA] text-[13.5px] font-bold text-[#9A3412]">
                    "{currentQ.highlightedSentence}"
                  </div>
                )}

                {/* Multiple Choice / Error Options */}
                {currentQ.options && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {currentQ.options.map((option) => {
                      const isSelected = selectedOption === option;
                      let optionClasses = 'bg-white border-[#DCE0F7] text-[#15164B] hover:bg-[#F0F2FE]';
                      if (isSelected) {
                        optionClasses = 'bg-[#15164B] border-[#15164B] text-white shadow-xs';
                      }
                      if (isAnswerChecked) {
                        if (option === currentQ.correctAnswer) {
                          optionClasses = 'bg-[#ECFDF5] border-[#10B981] text-[#065F46] font-black';
                        } else if (isSelected && !isCorrect) {
                          optionClasses = 'bg-[#FEE2E2] border-[#EF4444] text-[#991B1B]';
                        }
                      }

                      return (
                        <button
                          key={option}
                          disabled={isAnswerChecked}
                          onClick={() => setSelectedOption(option)}
                          className={`p-3 rounded-xl border text-[13px] font-bold text-center transition-all cursor-pointer ${optionClasses}`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Match Pairs Mode */}
                {currentQ.mode === 'match' && currentQ.pairs && (
                  <div className="space-y-2 pt-2">
                    <p className="text-[11.5px] font-medium text-[#7D82A8]">
                      Tap a term on the left, then tap its matching meaning on the right:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        {currentQ.pairs.map((p) => {
                          const isMatched = Boolean(matchedPairs[p.word]);
                          return (
                            <button
                              key={p.word}
                              disabled={isMatched || isAnswerChecked}
                              onClick={() => setSelectedWord(p.word)}
                              className={`w-full p-2.5 rounded-xl border text-[12px] font-bold text-left transition-colors ${
                                isMatched
                                  ? 'bg-[#ECFDF5] border-[#10B981] text-[#065F46]'
                                  : selectedWord === p.word
                                  ? 'bg-[#15164B] text-white border-[#15164B]'
                                  : 'bg-white border-[#DCE0F7] text-[#15164B]'
                              }`}
                            >
                              {p.word}
                            </button>
                          );
                        })}
                      </div>
                      <div className="space-y-1.5">
                        {currentQ.pairs.map((p) => {
                          const matchedWord = Object.keys(matchedPairs).find(
                            (k) => matchedPairs[k] === p.meaning
                          );
                          return (
                            <button
                              key={p.meaning}
                              disabled={Boolean(matchedWord) || isAnswerChecked}
                              onClick={() => {
                                if (selectedWord) {
                                  handleMatchSelect(selectedWord, p.meaning);
                                }
                              }}
                              className={`w-full p-2.5 rounded-xl border text-[11px] font-semibold text-left transition-colors ${
                                matchedWord
                                  ? 'bg-[#ECFDF5] border-[#10B981] text-[#065F46]'
                                  : 'bg-white border-[#DCE0F7] text-[#5B618E] hover:bg-[#F0F2FE]'
                              }`}
                            >
                              {p.meaning}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Feedback Explanation Callout */}
              {isAnswerChecked && (
                <div
                  className={`p-3.5 rounded-2xl border flex items-start gap-2.5 transition-all ${
                    isCorrect
                      ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                      : 'bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]'
                  }`}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-[#E11D48] shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <span className="text-[12px] font-black block">
                      {isCorrect ? 'Correct! +25 pts' : 'Not quite!'}
                    </span>
                    <p className="text-[11.5px] font-medium leading-relaxed opacity-95">
                      {currentQ.explanation}
                    </p>
                  </div>
                </div>
              )}

              {/* Bottom Action Button */}
              <div className="pt-2 flex justify-end">
                {!isAnswerChecked ? (
                  <button
                    onClick={handleCheckAnswer}
                    disabled={
                      currentQ.mode === 'match'
                        ? Object.keys(matchedPairs).length < (currentQ.pairs?.length || 1)
                        : !selectedOption
                    }
                    className="px-6 py-2.5 rounded-full bg-[#15164B] hover:bg-[#0E1038] disabled:bg-[#D5D8EE] disabled:cursor-not-allowed text-white text-[12.5px] font-bold shadow-xs cursor-pointer transition-colors"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="px-6 py-2.5 rounded-full bg-[#15164B] hover:bg-[#0E1038] text-white text-[12.5px] font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <span>{currentIndex + 1 < questions.length ? 'Next Question' : 'Complete Quest'}</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
