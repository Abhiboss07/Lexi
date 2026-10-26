import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CurriculumLesson, LessonActivity } from '../../types/curriculum';
import {
  validateActivityAnswer,
  calculateLessonScore,
  type ActivityAnswer,
  type ActivityEvaluation,
  type LessonScoreResult,
} from '../../services/lessonScoring';
import { curriculumRepository } from '../../db/curriculumRepository';
import { vocabularyRepository } from '../../db/vocabularyRepository';
import { useModalFocusTrap } from '../../hooks/useModalFocusTrap';
import {
  MultipleChoiceView,
  DialogueView,
  FillBlankView,
  SentenceOrderView,
  ListeningView,
  PronunciationPromptView,
  MatchingView,
  WritingView,
} from './ActivityViews';
import { LessonCompletionSummary } from './LessonCompletionSummary';

interface LessonPlayerProps {
  lesson: CurriculumLesson;
  userId: string;
  onClose: () => void;
  onCompleteLesson?: (lessonId: string, scorePercent: number) => void;
}

export const LessonPlayer: React.FC<LessonPlayerProps> = ({
  lesson,
  userId,
  onClose,
  onCompleteLesson,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, ActivityAnswer>>({});
  const [evaluations, setEvaluations] = useState<Record<string, ActivityEvaluation>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLessonFinished, setIsLessonFinished] = useState(false);
  const [scoreResult, setScoreResult] = useState<LessonScoreResult | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isPersisting, setIsPersisting] = useState(false);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  const activities = lesson.activities;
  const currentActivity: LessonActivity | undefined = activities[currentIdx];
  const currentAnswer = currentActivity ? answers[currentActivity.id] : undefined;
  const currentEvaluation = currentActivity ? evaluations[currentActivity.id] : undefined;

  const handleSafeExit = () => {
    if (isLessonFinished || Object.keys(evaluations).length === 0) {
      onClose();
    } else {
      setShowExitConfirm(true);
    }
  };

  const modalRef = useModalFocusTrap<HTMLDivElement>({
    isOpen: true,
    onClose: handleSafeExit,
  });

  // Handle setting current answer safely
  const handleSetAnswer = (ans: ActivityAnswer) => {
    if (!currentActivity || isSubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      [currentActivity.id]: ans,
    }));
  };

  // Determine if answer is populated enough to enable submit
  const isAnswerProvided = (): boolean => {
    if (!currentActivity) return false;
    const ans = answers[currentActivity.id];
    if (ans === undefined || ans === null) return false;

    switch (currentActivity.kind) {
      case 'multiple-choice':
      case 'listening':
        return typeof ans === 'number';
      case 'dialogue':
        return true;
      case 'fill-blank':
        return typeof ans === 'string' && ans.trim().length > 0;
      case 'sentence-order':
        return Array.isArray(ans) && ans.length > 0;
      case 'pronunciation-prompt':
        return Boolean(ans);
      case 'matching':
        return typeof ans === 'object' && Object.keys(ans).length > 0;
      case 'writing-prompt':
        return typeof ans === 'string' && ans.trim().length > 0;
      default:
        return false;
    }
  };

  const handleCheckAnswer = () => {
    if (!currentActivity || isSubmitted) return;

    const evaluation = validateActivityAnswer(currentActivity, currentAnswer);
    setEvaluations((prev) => ({
      ...prev,
      [currentActivity.id]: evaluation,
    }));
    setIsSubmitted(true);

    if (evaluation.isCorrect) {
      try {
        const prefersReducedMotion =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
          confetti({
            particleCount: 30,
            spread: 50,
            origin: { y: 0.8 },
            colors: ['#232655', '#646AA4', '#10B981', '#FF6243'],
          });
        }
      } catch {
        // Safe in headless or environments without canvas
      }
    }
  };

  const persistAndFinish = async (finalScore: LessonScoreResult) => {
    setIsPersisting(true);
    setPersistenceError(null);

    try {
      await curriculumRepository.recordLessonCompletion(
        userId,
        lesson.id,
        finalScore.scorePercent
      );

      // Product Rule: Onboard curated vocabulary if learner passed the lesson (>= 80%)
      if (finalScore.isPassed && lesson.vocabulary && lesson.vocabulary.length > 0) {
        await vocabularyRepository.addVocabularyFromLesson(
          userId,
          lesson.id,
          lesson.vocabulary,
          lesson.title,
          lesson.level
        );
      }

      setScoreResult(finalScore);
      setIsLessonFinished(true);

      if (onCompleteLesson) {
        onCompleteLesson(lesson.id, finalScore.scorePercent);
      }
    } catch (err) {
      console.error('Failed to persist lesson completion to repository:', err);
      setPersistenceError('Unable to save lesson progress offline. Please check your storage or retry.');
    } finally {
      setIsPersisting(false);
    }
  };

  const handleNextActivity = async () => {
    if (isPersisting) return;
    if (currentIdx < activities.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setIsSubmitted(false);
      setPersistenceError(null);
    } else {
      // Calculate final score
      const finalScore = calculateLessonScore(evaluations, activities.length);
      await persistAndFinish(finalScore);
    }
  };

  const handleReviewLesson = () => {
    setCurrentIdx(0);
    setAnswers({});
    setEvaluations({});
    setIsSubmitted(false);
    setIsLessonFinished(false);
    setScoreResult(null);
  };

  if (!currentActivity && !isLessonFinished) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-[14px] text-[#555E92]">No activities found in this lesson.</p>
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-full bg-[#232655] text-white text-[13px] font-bold"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Interactive Lesson Player"
      aria-labelledby="lesson-header-title"
    >
      <div className="w-full max-w-[430px] h-full sm:h-auto sm:max-h-[92vh] sm:rounded-[36px] bg-[#F6F7FE] shadow-2xl border border-[#ECEEFE] flex flex-col overflow-hidden relative">
        
        {/* Top Header & Progress Indicator */}
        <header className="p-4 bg-white border-b border-[#ECEEFE] shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSafeExit}
                className="min-w-[44px] min-h-[44px] rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] flex items-center justify-center text-[#15164B] transition-colors cursor-pointer"
                aria-label="Exit lesson"
              >
                <X className="w-5 h-5 stroke-[2.2]" />
              </button>
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#646AA4]">
                  {lesson.level} • Lesson {lesson.order}
                </span>
                <h1 id="lesson-header-title" className="text-[15px] font-extrabold text-[#1C2046] leading-none">
                  {lesson.title}
                </h1>
              </div>
            </div>

            <span className="text-[11.5px] font-bold text-[#545CA6] bg-[#ECEFFD] px-2.5 py-1 rounded-full">
              {currentIdx + 1} / {activities.length}
            </span>
          </div>

          {/* Segmented Progress Bar */}
          <div className="w-full bg-[#EAEFFA] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#232655] h-full rounded-full transition-all duration-300"
              style={{
                width: `${((currentIdx + (isSubmitted ? 1 : 0)) / activities.length) * 100}%`,
              }}
              role="progressbar"
              aria-valuenow={Math.round(((currentIdx + (isSubmitted ? 1 : 0)) / activities.length) * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </header>

        {/* Scrollable Main Activity Stage */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-5">
          {isLessonFinished && scoreResult ? (
            <LessonCompletionSummary
              lesson={lesson}
              scoreResult={scoreResult}
              onContinue={onClose}
              onReview={handleReviewLesson}
            />
          ) : currentActivity ? (
            <div className="space-y-4">
              {currentActivity.kind === 'multiple-choice' && (
                <MultipleChoiceView
                  activity={currentActivity}
                  answer={typeof currentAnswer === 'number' ? currentAnswer : null}
                  onSelectAnswer={handleSetAnswer}
                  isSubmitted={isSubmitted}
                  isCorrect={currentEvaluation?.isCorrect}
                />
              )}

              {currentActivity.kind === 'dialogue' && (
                <DialogueView
                  activity={currentActivity}
                  answer={currentAnswer || null}
                  onAnswerChange={handleSetAnswer}
                  isSubmitted={isSubmitted}
                />
              )}

              {currentActivity.kind === 'fill-blank' && (
                <FillBlankView
                  activity={currentActivity}
                  answer={typeof currentAnswer === 'string' ? currentAnswer : ''}
                  onSelectOption={handleSetAnswer}
                  isSubmitted={isSubmitted}
                />
              )}

              {currentActivity.kind === 'sentence-order' && (
                <SentenceOrderView
                  activity={currentActivity}
                  orderedWords={Array.isArray(currentAnswer) ? currentAnswer : []}
                  onChangeOrder={handleSetAnswer}
                  isSubmitted={isSubmitted}
                />
              )}

              {currentActivity.kind === 'listening' && (
                <ListeningView
                  activity={currentActivity}
                  answer={typeof currentAnswer === 'number' ? currentAnswer : null}
                  onSelectOption={handleSetAnswer}
                  isSubmitted={isSubmitted}
                />
              )}

              {currentActivity.kind === 'pronunciation-prompt' && (
                <PronunciationPromptView
                  activity={currentActivity}
                  isPracticed={Boolean(currentAnswer)}
                  onConfirmPractice={() => handleSetAnswer('spoken')}
                  isSubmitted={isSubmitted}
                />
              )}

              {currentActivity.kind === 'matching' && (
                <MatchingView
                  activity={currentActivity}
                  matches={typeof currentAnswer === 'object' && !Array.isArray(currentAnswer) ? (currentAnswer as Record<string, string>) : {}}
                  onMatch={(l, r) => {
                    const existing = (currentAnswer as Record<string, string>) || {};
                    handleSetAnswer({ ...existing, [l]: r });
                  }}
                  isSubmitted={isSubmitted}
                />
              )}

              {currentActivity.kind === 'writing-prompt' && (
                <WritingView
                  activity={currentActivity}
                  text={typeof currentAnswer === 'string' ? currentAnswer : ''}
                  onTextChange={handleSetAnswer}
                  isSubmitted={isSubmitted}
                />
              )}
            </div>
          ) : null}
        </main>

        {/* Bottom Interactive / Feedback Sheet */}
        {!isLessonFinished && (
          <footer className="p-4 bg-white border-t border-[#ECEEFE] shrink-0">
            {isSubmitted && currentEvaluation ? (
              <div className="space-y-3">
                <div
                  className={`p-3.5 rounded-2xl flex items-start gap-2.5 text-[13px] ${
                    currentEvaluation.isCorrect
                      ? 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]'
                      : 'bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]'
                  }`}
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {currentEvaluation.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-bold">{currentEvaluation.feedbackMessage}</p>
                    {currentEvaluation.explanation && (
                      <p className="text-[12px] opacity-90 mt-0.5">
                        {currentEvaluation.explanation}
                      </p>
                    )}
                  </div>
                </div>

                {persistenceError && (
                  <div className="p-3 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-between text-[12.5px] text-[#991B1B]">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
                      <span>{persistenceError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const finalScore = calculateLessonScore(evaluations, activities.length);
                        persistAndFinish(finalScore);
                      }}
                      disabled={isPersisting}
                      className="px-3 py-1 bg-[#1E224E] text-white rounded-lg text-[11px] font-bold hover:bg-[#141738] transition-colors cursor-pointer"
                    >
                      {isPersisting ? 'Retrying...' : 'Retry'}
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleNextActivity}
                  disabled={isPersisting}
                  className="w-full py-3.5 rounded-full bg-[#1E224E] hover:bg-[#141738] disabled:bg-[#8E93B8] text-white text-[14px] font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isPersisting ? 'Saving Progress...' : 'Continue'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={!isAnswerProvided()}
                onClick={handleCheckAnswer}
                className="w-full py-3.5 rounded-full bg-[#1E224E] hover:bg-[#141738] disabled:bg-[#D4D8EE] disabled:cursor-not-allowed text-white text-[14px] font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Check Answer</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </footer>
        )}

        {/* Exit Confirmation Dialog */}
        {showExitConfirm && (
          <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-[320px] bg-white rounded-3xl p-5 shadow-2xl border border-[#ECEEFE] space-y-3 text-center">
              <h3 className="text-[16px] font-extrabold text-[#1C2046]">
                Leave Lesson?
              </h3>
              <p className="text-[12.5px] text-[#636C9E]">
                Your completed exercises will be saved. You can resume this lesson anytime.
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
