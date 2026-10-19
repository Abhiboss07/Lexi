import React, { useState, useEffect } from 'react';
import { X, Check, ArrowRight, Sparkles, Award, Lightbulb } from 'lucide-react';
import type { PracticePreferences } from '../../../types/practicePreferences';
import { 
  getGrammarGameQuestions, 
  type GrammarGameQuestion 
} from '../../../services/activityHubService';
import { quickPicksRepository } from '../../../db/quickPicksRepository';
import { practiceRepository } from '../../../db/practiceRepository';
import { getLocalDateString } from '../../../services/dailyPracticeService';

interface MiniGrammarGamesModalProps {
  userId?: string;
  isOpen: boolean;
  preferences?: PracticePreferences;
  onClose: () => void;
}

export const MiniGrammarGamesModal: React.FC<MiniGrammarGamesModalProps> = ({
  userId = 'local-learner-1',
  isOpen,
  preferences,
  onClose,
}) => {
  const [questions, setQuestions] = useState<GrammarGameQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionAnswers, setSessionAnswers] = useState<Array<{ question: GrammarGameQuestion; chosen: string; isCorrect: boolean }>>([]);

  const isImmediate = preferences?.correctionTiming !== 'end_of_session';

  useEffect(() => {
    if (!isOpen) return;
    const list = getGrammarGameQuestions(
      preferences?.cefrLevel || 'A2',
      preferences?.defaultDifficulty || 'medium',
      4
    );
    setQuestions(list);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    setScore(0);
    setSessionCompleted(false);
    setSessionAnswers([]);
  }, [isOpen, preferences?.cefrLevel, preferences?.defaultDifficulty]);

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];

  const handleSelectOption = (opt: string) => {
    if (isAnswerChecked && isImmediate) return;
    setSelectedAnswer(opt);
  };

  const handleCheckImmediate = async () => {
    if (!currentQ || !selectedAnswer) return;
    const correct = selectedAnswer === currentQ.correctAnswer;
    setIsAnswerChecked(true);
    if (correct) setScore((s) => s + 1);

    setSessionAnswers((prev) => [
      ...prev,
      { question: currentQ, chosen: selectedAnswer, isCorrect: correct },
    ]);
  };

  const handleNextQuestion = async () => {
    if (!isImmediate && selectedAnswer && currentQ) {
      const correct = selectedAnswer === currentQ.correctAnswer;
      if (correct) setScore((s) => s + 1);
      setSessionAnswers((prev) => [
        ...prev,
        { question: currentQ, chosen: selectedAnswer, isCorrect: correct },
      ]);
    }

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((idx) => idx + 1);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
    } else {
      // Session finished
      setSessionCompleted(true);
      const finalScore = score + (isImmediate ? 0 : (selectedAnswer === currentQ?.correctAnswer ? 1 : 0));
      const accuracy = Math.round((finalScore / questions.length) * 100);

      const dateStr = getLocalDateString();
      await quickPicksRepository.recordActivityCompletion({
        id: `${userId}-grammar-games-${dateStr}`,
        userId,
        activityId: 'mini-grammar-games',
        date: dateStr,
        score: accuracy,
        completedAt: new Date().toISOString(),
      });

      await practiceRepository.recordSession({
        userId,
        category: 'grammar-games',
        difficulty: preferences?.defaultDifficulty || 'medium',
        sessionLength: preferences?.defaultSessionLength || 'quick',
        durationMinutes: 4,
        score: accuracy,
      });
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#15164B]/40 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="grammar-games-title"
    >
      <div className="w-full max-w-[460px] bg-white rounded-[32px] p-5 sm:p-6 shadow-2xl border border-[#ECEEFE] space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#545CA6] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6243]" />
              <span>Diagnostic Drills</span>
            </span>
            <h2 id="grammar-games-title" className="text-[20px] font-black text-[#15164B] tracking-tight">
              Mini Grammar Games
            </h2>
            <p className="text-[12px] font-medium text-[#6B7094]">
              Rapid diagnostics covering error spotting, tenses, and prepositions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] text-[#222149] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Grammar Games"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {!sessionCompleted && currentQ && (
          <div className="space-y-4 pt-1">
            {/* Progress & Rule Pill */}
            <div className="flex items-center justify-between text-[11px] font-bold text-[#8E93B8]">
              <span className="bg-[#ECEFFD] text-[#545CA6] px-2.5 py-0.5 rounded-full">
                {currentQ.ruleTopic}
              </span>
              <span>Question {currentIndex + 1} of {questions.length}</span>
            </div>

            {/* Prompt Box */}
            <div className="p-4 rounded-2xl bg-[#F6F7FE] border border-[#ECEEFE] space-y-2">
              <p className="text-[13px] font-bold text-[#15164B]">
                {currentQ.prompt}
              </p>
              {currentQ.sentence && (
                <p className="text-[14px] font-extrabold text-[#222149] p-3 rounded-xl bg-white border border-[#DEE3FA]">
                  {currentQ.sentence}
                </p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-2">
              {currentQ.options.map((opt) => {
                const isSelected = selectedAnswer === opt;
                const isCorrect = opt === currentQ.correctAnswer;
                let btnStyle = 'bg-white border-[#E2E6FA] text-[#222149] hover:bg-[#F9FAFF]';

                if (isAnswerChecked && isImmediate) {
                  if (isCorrect) {
                    btnStyle = 'bg-[#ECFDF5] border-[#10B981] text-[#065F46] font-extrabold';
                  } else if (isSelected) {
                    btnStyle = 'bg-[#FEF2F2] border-[#EF4444] text-[#991B1B] font-bold';
                  }
                } else if (isSelected) {
                  btnStyle = 'bg-[#15164B] text-white border-[#15164B] font-extrabold shadow-xs';
                }

                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full p-3 rounded-xl border text-left text-[13px] transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswerChecked && isImmediate && isCorrect && (
                      <Check className="w-4 h-4 text-[#10B981] stroke-[3]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Immediate Explanation */}
            {isAnswerChecked && isImmediate && (
              <div className="p-3 rounded-2xl bg-[#F0F3FE] border border-[#DEE3FA] text-[12px] text-[#222149] leading-relaxed space-y-1 animate-in fade-in">
                <span className="font-extrabold text-[#545CA6] flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-[#F59E0B]" />
                  Explanation:
                </span>
                <p>{currentQ.explanation}</p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex justify-end">
              {isImmediate ? (
                !isAnswerChecked ? (
                  <button
                    type="button"
                    onClick={handleCheckImmediate}
                    disabled={!selectedAnswer}
                    className="px-5 py-2.5 rounded-full bg-[#545CA6] hover:bg-[#434A8E] disabled:opacity-50 text-white text-[12.5px] font-bold cursor-pointer shadow-sm transition-all"
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="px-5 py-2.5 rounded-full bg-[#15164B] hover:bg-[#0E1038] text-white text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                  >
                    <span>{currentIndex + 1 < questions.length ? 'Next Question' : 'Complete Workout'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  disabled={!selectedAnswer}
                  className="px-5 py-2.5 rounded-full bg-[#15164B] hover:bg-[#0E1038] disabled:opacity-50 text-white text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <span>{currentIndex + 1 < questions.length ? 'Record & Next' : 'Finish & Review'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* End of session summary (especially valuable for End-of-Session correction mode) */}
        {sessionCompleted && (
          <div className="space-y-4 pt-1 animate-in fade-in">
            <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] text-center space-y-1">
              <Award className="w-8 h-8 text-[#16A34A] mx-auto" />
              <h3 className="text-[17px] font-black text-[#15164B]">Workout Complete!</h3>
              <p className="text-[13px] font-bold text-[#15803D]">
                Score: {score} of {questions.length} ({Math.round((score / questions.length) * 100)}%)
              </p>
            </div>

            {/* End of Session Review breakdown */}
            <div className="space-y-2">
              <h4 className="text-[12px] font-bold text-[#15164B] uppercase tracking-wider">
                Session Performance Review
              </h4>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {sessionAnswers.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#F9FAFF] border border-[#ECEEFE] text-[11.5px] space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-[#15164B]">Q{idx + 1}: {item.question.ruleTopic}</span>
                      <span className={item.isCorrect ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                        {item.isCorrect ? '✓ Correct' : '✗ Review'}
                      </span>
                    </div>
                    <p className="text-[#6B7094]">{item.question.prompt}</p>
                    <p className="text-[#15164B] font-semibold">
                      Your answer: <span className={item.isCorrect ? 'text-[#16A34A]' : 'text-[#DC2626]'}>{item.chosen}</span>
                    </p>
                    {!item.isCorrect && (
                      <p className="text-[#059669] font-bold">
                        Correct: {item.question.correctAnswer}
                      </p>
                    )}
                    <p className="text-[10.5px] text-[#7D82A8] bg-white p-2 rounded-lg border border-[#F0F2FE]">
                      {item.question.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-full bg-[#15164B] hover:bg-[#0E1038] text-white text-[13px] font-black transition-all cursor-pointer shadow-md"
            >
              Done & Return to Activities
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
