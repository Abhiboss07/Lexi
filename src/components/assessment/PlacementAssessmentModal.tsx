import React, { useState, useEffect, useCallback, useId } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  BookOpen,
  Headphones,
  RotateCcw,
  Check,
  AlertCircle,
} from 'lucide-react';
import type {
  ActiveAssessmentDraft,
  AssessmentQuestion,
  AssessmentResult,
  AssessmentSkill,
} from '../../types/assessment';
import type { CEFRLevel } from '../../types/curriculum';
import { assessmentService } from '../../services/assessmentService';
import { ASSESSMENT_QUESTIONS } from '../../data/assessmentQuestionsData';
import { useModalFocusTrap } from '../../hooks/useModalFocusTrap';

interface PlacementAssessmentModalProps {
  isOpen: boolean;
  userId?: string;
  currentLevel?: CEFRLevel;
  onClose: () => void;
  onLevelUpdated?: (newLevel: CEFRLevel) => void;
  onNavigateToPractice?: () => void;
  onStartLesson?: (lessonId: string) => void;
}

export const PlacementAssessmentModal: React.FC<PlacementAssessmentModalProps> = ({
  isOpen,
  userId = 'local-learner-1',
  currentLevel = 'A1',
  onClose,
  onLevelUpdated,
  onNavigateToPractice,
  onStartLesson,
}) => {
  const [draft, setDraft] = useState<ActiveAssessmentDraft | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPlayCount, setAudioPlayCount] = useState(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showReviewAccordion, setShowReviewAccordion] = useState(false);
  const [appliedLevelFeedback, setAppliedLevelFeedback] = useState<string | null>(null);
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);

  const handleSafeClose = () => {
    if (result || (draft?.responses && Object.keys(draft.responses).length === 0)) {
      onClose();
    } else {
      setShowExitConfirm(true);
    }
  };

  const modalRef = useModalFocusTrap<HTMLDivElement>({
    isOpen,
    onClose: handleSafeClose,
  });

  const titleId = useId();

  // Load or restore active draft on open
  useEffect(() => {
    if (!isOpen) {
      setDraft(null);
      setResult(null);
      setSelectedOption(null);
      setShowExitConfirm(false);
      setShowReviewAccordion(false);
      setAppliedLevelFeedback(null);
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    const activeDraft = assessmentService.startPlacementAssessment(userId);
    setDraft(activeDraft);

    // If draft already has an answer for current question, initialize selectedOption
    const currentQId = activeDraft.questionIds[activeDraft.currentIndex];
    if (activeDraft.responses[currentQId]) {
      setSelectedOption(activeDraft.responses[currentQId].selectedIndex);
    } else {
      setSelectedOption(null);
    }
  }, [isOpen, userId]);

  // Current question object
  const currentQuestionId = draft ? draft.questionIds[draft.currentIndex] : null;
  const currentQuestion: AssessmentQuestion | undefined = currentQuestionId
    ? ASSESSMENT_QUESTIONS.find((q) => q.id === currentQuestionId)
    : undefined;

  // Sync selectedOption whenever question index changes
  useEffect(() => {
    if (!draft || !currentQuestionId) return;
    if (draft.responses[currentQuestionId]) {
      setSelectedOption(draft.responses[currentQuestionId].selectedIndex);
    } else {
      setSelectedOption(null);
    }
    setAudioPlayCount(0);
  }, [draft?.currentIndex, currentQuestionId]);

  // Audio speech synthesis helper for listening questions
  const playAudioScript = useCallback(() => {
    if (!currentQuestion?.audioScript || typeof window === 'undefined') return;

    if (!window.speechSynthesis) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentQuestion.audioScript);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => {
      setIsPlayingAudio(false);
      setAudioPlayCount((c) => c + 1);
    };
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  }, [currentQuestion?.audioScript]);

  // Handle option selection
  const handleSelectOption = (index: number) => {
    setSelectedOption(index);
  };

  // Submit current answer and advance
  const handleNextQuestion = () => {
    if (!draft || !currentQuestion || selectedOption === null || isSubmittingAssessment) return;

    const updated = assessmentService.recordAnswer(draft, currentQuestion.id, selectedOption);
    setDraft(updated);

    if (updated.completed) {
      // Evaluate completed assessment
      setIsSubmittingAssessment(true);
      assessmentService.submitAssessment(updated)
        .then((res) => {
          setResult(res);
        })
        .catch((err) => {
          console.error('Failed to submit placement assessment:', err);
        })
        .finally(() => {
          setIsSubmittingAssessment(false);
        });
    }
  };

  // Previous question
  const handlePrevQuestion = () => {
    if (!draft || draft.currentIndex === 0) return;
    const prevIndex = draft.currentIndex - 1;
    const prevQId = draft.questionIds[prevIndex];
    setDraft({
      ...draft,
      currentIndex: prevIndex,
    });
    setSelectedOption(draft.responses[prevQId]?.selectedIndex ?? null);
  };

  // Keyboard navigation for accessible answering (keys 1-4, Enter, Arrow keys)
  useEffect(() => {
    if (!isOpen || !currentQuestion || result) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '1' && e.key <= '4') {
        const idx = parseInt(e.key, 10) - 1;
        if (idx < currentQuestion.options.length) {
          setSelectedOption(idx);
        }
      } else if (e.key === 'Enter' && selectedOption !== null) {
        handleNextQuestion();
      } else if (e.key === 'Escape') {
        setShowExitConfirm(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentQuestion, selectedOption, result]);

  // Explicitly apply recommended CEFR level
  const handleApplyPlacementLevel = async (level: CEFRLevel) => {
    await assessmentService.applyPlacementLevel(userId, level);
    setAppliedLevelFeedback(`Starting level successfully calibrated to CEFR ${level}!`);
    if (onLevelUpdated) {
      onLevelUpdated(level);
    }
  };

  // Restart / Retake test
  const handleRetake = () => {
    assessmentService.resetAssessment(userId);
    const newDraft = assessmentService.startPlacementAssessment(userId);
    setDraft(newDraft);
    setResult(null);
    setSelectedOption(null);
    setShowReviewAccordion(false);
    setAppliedLevelFeedback(null);
  };

  if (!isOpen) return null;

  const totalQuestions = draft?.questionIds.length || 8;
  const currentIndex = draft?.currentIndex || 0;
  const progressPercent = Math.round(((currentIndex + (selectedOption !== null ? 1 : 0)) / totalQuestions) * 100);

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#15164B]/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#ECEEFE] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Bar */}
        <header className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-[#FAF9FE] to-white border-b border-[#ECEEFE] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 stroke-[2.4]" />
            </div>
            <div className="min-w-0">
              <h2 id={titleId} className="text-[14px] sm:text-[15px] font-black text-[#15164B] truncate">
                {result ? 'Assessment Results & Level Diagnosis' : 'CEFR Placement Assessment'}
              </h2>
              <p className="text-[11px] font-semibold text-[#484E77] truncate">
                {result
                  ? 'Client-Side Linguistic Calibration'
                  : draft?.stage === 2
                  ? 'Stage 2: Adaptive Placement Extension'
                  : 'Stage 1: Core Calibration (A1–A2)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!result && (
              <span className="hidden xs:inline-block px-2.5 py-1 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[11px] font-extrabold">
                Q {currentIndex + 1} of {totalQuestions}
              </span>
            )}
            <button
              type="button"
              onClick={handleSafeClose}
              className="min-w-[44px] min-h-[44px] rounded-full bg-[#F0F2FD] hover:bg-[#E2E6FA] text-[#15164B] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close assessment"
            >
              <X className="w-4 h-4 stroke-[2.4]" />
            </button>
          </div>
        </header>

        {/* Exit Confirmation Dialog */}
        {showExitConfirm && (
          <div className="p-4 bg-[#FEF2F2] border-b border-[#FECACA] flex items-center justify-between gap-3 text-left">
            <div className="space-y-0.5">
              <p className="text-[12.5px] font-bold text-[#991B1B]">Pause assessment?</p>
              <p className="text-[11.5px] text-[#B91C1C]">
                Your progress is saved offline. You can resume anytime without losing answers.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#FCA5A5] text-[#991B1B] text-[11px] font-bold"
              >
                Continue Test
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-[#DC2626] text-white text-[11px] font-bold"
              >
                Save & Exit
              </button>
            </div>
          </div>
        )}

        {/* Progress Bar (During Test) */}
        {!result && (
          <div className="w-full h-1.5 bg-[#F0F2FD] shrink-0">
            <div
              className="h-full bg-gradient-to-r from-[#545CA6] to-[#4F46E5] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* ============================================================ */}
          {/* 1. RESULTS SCREEN */}
          {/* ============================================================ */}
          {result ? (
            <div className="space-y-5 text-left animate-in fade-in duration-300">
              {/* Feedback Alert if applied */}
              {appliedLevelFeedback && (
                <div className="p-3.5 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                  <p className="text-[12.5px] font-bold">{appliedLevelFeedback}</p>
                </div>
              )}

              {/* Diagnosis Hero Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-[#15164B] to-[#25286D] text-white space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black tracking-widest uppercase text-[#A5B4FC]">
                      DIAGNOSTIC PLACEMENT RESULT
                    </span>
                    <h3 className="text-[24px] sm:text-[28px] font-black tracking-tight flex items-center gap-2">
                      <span>CEFR {result.estimatedCEFRLevel}</span>
                      <span className="text-[13px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
                        {result.overallScorePercent}% Accuracy
                      </span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="px-3 py-1.5 rounded-2xl bg-white/10 border border-white/20 text-center">
                      <span className="text-[9.5px] text-[#C7D2FE] uppercase font-bold block">Confidence</span>
                      <span className="text-[13px] font-black text-white">{result.confidenceScore}%</span>
                    </div>
                  </div>
                </div>

                <p className="text-[12.5px] text-[#E0E7FF] leading-relaxed">
                  {result.rationale}
                </p>

                {/* Unofficial Diagnostic Disclaimer Pill */}
                <div className="p-3 rounded-2xl bg-white/10 border border-white/15 flex items-start gap-2 text-[11px] text-[#C7D2FE] leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-[#FDE047] shrink-0 mt-0.5" />
                  <span>
                    <strong>Informal Placement Estimate:</strong> This assessment is an automated client-side calibration to personalize your Lexi curriculum and daily study plan. It is an internal learning milestone, not an accredited examination diploma (IELTS/TOEFL/Cambridge).
                  </span>
                </div>

                {/* Level Decision CTAs */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleApplyPlacementLevel(result.estimatedCEFRLevel)}
                    className="flex-1 py-2.5 px-4 rounded-2xl bg-[#FF6243] hover:bg-[#E85336] text-white text-[12.5px] font-black transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Apply CEFR {result.estimatedCEFRLevel} to My Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToPractice) onNavigateToPractice();
                      onClose();
                    }}
                    className="py-2.5 px-4 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-[12px] font-bold transition-colors cursor-pointer text-center"
                  >
                    Keep Current Level ({currentLevel})
                  </button>
                </div>
              </div>

              {/* Skill-by-Skill Breakdown */}
              <div className="space-y-3">
                <h4 className="text-[14px] font-black text-[#15164B] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#4F46E5]" />
                  <span>Multi-Skill Performance Diagnostics</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(result.skillBreakdown) as AssessmentSkill[]).map((skillKey) => {
                    const skill = result.skillBreakdown[skillKey];
                    return (
                      <div
                        key={skillKey}
                        className="p-3.5 rounded-2xl bg-[#FAF9FE] border border-[#ECEEFE] space-y-2 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[12.5px] font-bold text-[#15164B]">{skill.label}</span>
                          <span className="text-[11px] font-black text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded-lg">
                            {skill.accuracyPercent}% • {skill.estimatedLevel}
                          </span>
                        </div>

                        {/* Bar */}
                        <div className="w-full h-1.5 bg-[#E0E3F5] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              skill.accuracyPercent >= 75
                                ? 'bg-[#10B981]'
                                : skill.accuracyPercent >= 50
                                ? 'bg-[#4F46E5]'
                                : 'bg-[#F59E0B]'
                            }`}
                            style={{ width: `${skill.accuracyPercent}%` }}
                          />
                        </div>

                        <p className="text-[11px] text-[#6B7094] leading-snug">
                          {skill.strengthDescription}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review Incorrect Answers Accordion */}
              <div className="border border-[#ECEEFE] rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowReviewAccordion((prev) => !prev)}
                  className="w-full p-3.5 bg-[#FAF9FE] hover:bg-[#F0F2FD] text-left flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="text-[12.5px] font-bold text-[#15164B]">
                    {showReviewAccordion ? 'Hide' : 'Inspect'} Question-by-Question Answers ({result.totalCorrect} / {result.totalQuestions} correct)
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 text-[#545CA6] transition-transform ${
                      showReviewAccordion ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {showReviewAccordion && (
                  <div className="p-3.5 space-y-3 bg-white divide-y divide-[#ECEEFE]">
                    {result.responses.map((resp, idx) => {
                      const q = ASSESSMENT_QUESTIONS.find((item) => item.id === resp.questionId);
                      if (!q) return null;
                      return (
                        <div key={resp.questionId} className="pt-3 first:pt-0 space-y-1.5 text-[11.5px]">
                          <div className="flex items-center gap-1.5">
                            {resp.isCorrect ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                            )}
                            <span className="font-extrabold text-[#15164B]">
                              Q{idx + 1} ({q.skill.toUpperCase()} • {q.cefrLevel}):
                            </span>
                            <span className="text-[#6B7094]">{q.focusArea}</span>
                          </div>
                          <p className="text-[#232655] font-medium whitespace-pre-line pl-5">{q.prompt}</p>
                          <div className="pl-5 space-y-0.5 text-[11px]">
                            <p className={resp.isCorrect ? 'text-[#065F46] font-bold' : 'text-[#991B1B]'}>
                              Your answer: {q.options[resp.selectedIndex]}
                            </p>
                            {!resp.isCorrect && (
                              <p className="text-[#065F46] font-bold">
                                Correct answer: {q.options[q.correctIndex]}
                              </p>
                            )}
                            <p className="text-[#4B5563] italic pt-0.5">
                              Explanation: {q.explanation}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col xs:flex-row items-center justify-between gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="w-full xs:w-auto px-4 py-2 rounded-2xl border border-[#CCD1F0] hover:bg-[#EEF1FB] text-[#15164B] text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retake Assessment</span>
                </button>

                {onStartLesson && (
                  <button
                    type="button"
                    onClick={() => {
                      onStartLesson(result.recommendedLessonId);
                      onClose();
                    }}
                    className="w-full xs:w-auto px-4 py-2 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Start Recommended Lesson</span>
                    <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* 2. QUESTION SCREEN */
            /* ============================================================ */
            currentQuestion && (
              <div className="space-y-4 text-left animate-in fade-in duration-200">
                {/* Meta Tags Row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF] text-[#4F46E5] text-[10.5px] font-extrabold uppercase tracking-wider">
                      {currentQuestion.skill}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#15164B] text-white text-[10.5px] font-extrabold">
                      CEFR {currentQuestion.cefrLevel}
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-[#6B7094]">
                    {currentQuestion.focusArea}
                  </span>
                </div>

                {/* Context Passage (For Reading) */}
                {currentQuestion.contextPassage && (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF9FE] border border-[#E0E3F5] space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#545CA6]">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Reading Passage</span>
                    </div>
                    <p className="text-[12.5px] text-[#222149] font-medium whitespace-pre-line leading-relaxed">
                      {currentQuestion.contextPassage}
                    </p>
                  </div>
                )}

                {/* Audio Script Player (For Listening) */}
                {currentQuestion.audioScript && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FAF9FE] to-[#EFF1FD] border border-[#CCD1F0] flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center shrink-0">
                        <Headphones className="w-4 h-4 stroke-[2.4]" />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-[#15164B]">Listening Clip</p>
                        <p className="text-[10.5px] text-[#6B7094]">
                          {audioPlayCount > 0 ? `Played ${audioPlayCount} time(s)` : 'Listen to the audio clip'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={playAudioScript}
                      disabled={isPlayingAudio}
                      className="px-3.5 py-1.5 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[11.5px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      aria-label="Play listening audio clip"
                    >
                      {isPlayingAudio ? (
                        <>
                          <VolumeX className="w-4 h-4 animate-pulse text-[#FDE047]" />
                          <span>Playing audio...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4" />
                          <span>{audioPlayCount === 0 ? 'Play Audio' : 'Listen Again'}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Prompt Text */}
                <div className="pt-1">
                  <h3 className="text-[15px] sm:text-[16px] font-black text-[#15164B] whitespace-pre-line leading-snug">
                    {currentQuestion.prompt}
                  </h3>
                </div>

                {/* Multiple Choice Options List */}
                <div className="space-y-2 pt-1" role="radiogroup" aria-label="Question answer options">
                  {currentQuestion.options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => handleSelectOption(idx)}
                        className={`w-full p-3.5 rounded-2xl text-left border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? 'bg-[#EEF2FF] border-[#4F46E5] text-[#15164B] shadow-xs'
                            : 'bg-white border-[#E4E7F7] hover:border-[#CCD1F0] hover:bg-[#FAF9FE] text-[#232655]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-[#4F46E5] text-white'
                                : 'bg-[#F0F2FD] text-[#6B7094]'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-[13px] font-semibold truncate">{option}</span>
                        </div>

                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-[#4F46E5] text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer Navigation Bar (During Test) */}
        {!result && (
          <footer className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-[#FAF9FE] to-white border-t border-[#ECEEFE] flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={handlePrevQuestion}
              disabled={currentIndex === 0}
              className="px-3 py-1.5 rounded-2xl border border-[#CCD1F0] hover:bg-[#EEF1FB] text-[#15164B] text-[11.5px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNextQuestion}
              disabled={selectedOption === null || isSubmittingAssessment}
              className="px-5 py-2 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[12px] font-black flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <span>{draft?.stage === 2 && currentIndex === totalQuestions - 1 ? 'Finish & Diagnose' : 'Next'}</span>
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};
