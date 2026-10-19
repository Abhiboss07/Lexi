import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  CheckCircle2,
  Send,
  Calendar,
} from 'lucide-react';
import type { DailyChallengePrompt, DailyChallengeSubmission } from '../../types/quickPicks';
import {
  getTodayChallenge,
  evaluateDailyChallenge,
} from '../../services/quickPicksService';
import { quickPicksRepository } from '../../db/quickPicksRepository';

interface DailyChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onCompleteExercise?: () => void;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({
  isOpen,
  onClose,
  userId = 'local-learner-1',
  onCompleteExercise,
}) => {
  const [challenge, setChallenge] = useState<DailyChallengePrompt>(getTodayChallenge());
  const [userText, setUserText] = useState('');
  const [submission, setSubmission] = useState<DailyChallengeSubmission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const loadTodaySubmission = async () => {
    try {
      const todayChallenge = getTodayChallenge();
      setChallenge(todayChallenge);

      const existing = await quickPicksRepository.getDailyChallengeSubmission(userId, todayStr);
      if (existing) {
        setSubmission(existing);
        setUserText(existing.userResponse);
      } else {
        setSubmission(null);
        setUserText(todayChallenge.starterPrompt || '');
      }
    } catch (e) {
      console.error('Failed to load daily challenge:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTodaySubmission();
    }
  }, [isOpen, userId, todayStr]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userText.trim()) return;

    setIsSubmitting(true);
    const feedbackResult = evaluateDailyChallenge(challenge, userText);

    const newSubmission: DailyChallengeSubmission = {
      id: `challenge-${todayStr}`,
      userId,
      date: todayStr,
      challengeId: challenge.id,
      promptTitle: challenge.title,
      userResponse: userText.trim(),
      status: 'completed',
      score: feedbackResult.score,
      wordCount: userText.trim().split(/\s+/).filter(Boolean).length,
      feedback: {
        strengths: feedbackResult.strengths,
        improvements: feedbackResult.improvements,
        grammarNotes: feedbackResult.grammarNotes,
        vocabularyUsed: feedbackResult.vocabularyUsed,
      },
      submittedAt: new Date().toISOString(),
    };

    try {
      await quickPicksRepository.saveDailyChallengeSubmission(newSubmission);
      setSubmission(newSubmission);
      setIsEditingExisting(false);
      if (onCompleteExercise) onCompleteExercise();
    } catch (err) {
      console.error('Failed to save daily challenge submission:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentWords = userText.trim() ? userText.trim().split(/\s+/).filter(Boolean).length : 0;
  const wordGoalMet = currentWords >= challenge.minWords;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#15164B]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-challenge-title"
    >
      <div className="bg-[#FAF9FE] w-full max-w-lg rounded-[28px] border border-[#E2E6FD] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#ECEEFE] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] flex items-center justify-center text-[#EA580C]">
              <Target className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="daily-challenge-title" className="text-[17px] font-black text-[#15164B] tracking-tight">
                  Daily Challenge
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#EA580C] bg-[#FFF7ED] px-2 py-0.5 rounded-full border border-[#FED7AA]">
                  One Small Win
                </span>
              </div>
              <p className="text-[11.5px] font-medium text-[#7D82A8]">
                One focused communicative task rotated every day
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F0F2FE] hover:bg-[#E2E6FD] text-[#545CA6] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close daily challenge modal"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Challenge Prompt Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#ECEEFE] shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#EA580C]">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#545CA6] bg-[#ECEFFD] px-2 py-0.5 rounded-full">
                Target Level: {challenge.cefrLevel}
              </span>
            </div>

            <h3 className="text-[16px] font-black text-[#15164B] leading-snug">
              {challenge.title}
            </h3>

            <p className="text-[12.5px] text-[#484D74] font-medium leading-relaxed">
              {challenge.scenario}
            </p>

            <div className="p-3 rounded-xl bg-[#F6F7FE] border border-[#E2E6FD] space-y-1">
              <span className="text-[11px] font-bold text-[#545CA6] uppercase tracking-wider block">
                Instructions:
              </span>
              <p className="text-[12px] text-[#15164B] font-semibold">
                {challenge.instructions}
              </p>
            </div>

            {/* Guidance Tips */}
            <div className="space-y-1 pt-1">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#8E93B8] block">
                Guidance & Vocabulary Tips:
              </span>
              <ul className="space-y-1 text-[11px] text-[#5B618E]">
                {challenge.guidanceTips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#545CA6] font-black shrink-0">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* If already submitted and not editing */}
          {submission && !isEditingExisting ? (
            <div className="space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#ECEEFE] shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#ECEEFE]">
                <div className="flex items-center gap-1.5 text-[12px] font-black text-[#059669]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Completed Today!</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-black text-[#15164B] bg-[#ECFDF5] px-2.5 py-0.5 rounded-md border border-[#A7F3D0]">
                    Score: {submission.score}/100
                  </span>
                  <button
                    onClick={() => setIsEditingExisting(true)}
                    className="text-[11px] font-bold text-[#545CA6] hover:underline"
                  >
                    Edit / Redo
                  </button>
                </div>
              </div>

              {/* Submitted Response */}
              <div className="space-y-1">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#8E93B8] block">
                  Your Response ({submission.wordCount} words):
                </span>
                <div className="p-3 bg-[#FAF9FE] rounded-xl border border-[#DCE0F7] text-[12.5px] text-[#15164B] font-medium leading-relaxed whitespace-pre-wrap">
                  {submission.userResponse}
                </div>
              </div>

              {/* Assessment Feedback */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#15164B]">
                    Feedback & Diagnosis
                  </span>
                  <span className="text-[9.5px] font-semibold text-[#8E93B8]">
                    Rule-Based Linguistic Engine
                  </span>
                </div>

                {submission.feedback.strengths.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] space-y-1">
                    <span className="text-[11px] font-bold text-[#065F46] block">Strengths:</span>
                    <ul className="text-[11px] text-[#065F46] space-y-0.5">
                      {submission.feedback.strengths.map((s, idx) => (
                        <li key={idx}>✓ {s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {submission.feedback.grammarNotes.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] space-y-1">
                    <span className="text-[11px] font-bold text-[#92400E] block">Grammar Notes:</span>
                    <ul className="text-[11px] text-[#92400E] space-y-0.5">
                      {submission.feedback.grammarNotes.map((g, idx) => (
                        <li key={idx}>• {g}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {submission.feedback.improvements.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-[#F0F2FE] border border-[#D5D8EE] space-y-1">
                    <span className="text-[11px] font-bold text-[#232655] block">Tips to Elevate:</span>
                    <ul className="text-[11px] text-[#434775] space-y-0.5">
                      {submission.feedback.improvements.map((imp, idx) => (
                        <li key={idx}>• {imp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Input Response Form */
            <form onSubmit={handleSubmit} className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#ECEEFE] shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#15164B] block">
                  Write Your Response:
                </label>
                <span
                  className={`text-[11px] font-extrabold ${
                    wordGoalMet ? 'text-[#059669]' : 'text-[#EA580C]'
                  }`}
                >
                  {currentWords} / {challenge.minWords} words
                </span>
              </div>

              <textarea
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                rows={5}
                placeholder="Type your response in English..."
                className="w-full p-3 bg-[#F9F9FE] rounded-xl border border-[#DCE0F7] text-[13px] text-[#15164B] font-medium leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-[#545CA6]"
                autoFocus
              />

              {/* Example response toggle */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowExample(!showExample)}
                  className="text-[11.5px] font-bold text-[#545CA6] hover:underline"
                >
                  {showExample ? 'Hide Model Example' : 'Show Model Example'}
                </button>

                <button
                  type="submit"
                  disabled={!userText.trim() || isSubmitting}
                  className="px-5 py-2 rounded-full bg-[#15164B] hover:bg-[#0E1038] disabled:bg-[#D5D8EE] text-white text-[12px] font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit for Feedback</span>
                </button>
              </div>

              {showExample && (
                <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[11.5px] text-[#166534] space-y-1">
                  <span className="font-bold block">Model Native Example:</span>
                  <p className="italic">"{challenge.exampleResponse}"</p>
                </div>
              )}
            </form>
          )}

          {/* Honest Local Architecture Disclosure */}
          <div className="p-2.5 rounded-xl bg-[#F6F7FE] border border-[#E2E6FD] text-[10.5px] text-[#6B7094] flex items-center justify-between">
            <span>Assessment is rule-based and computed privately on-device.</span>
            <span className="font-bold text-[#545CA6]">100% Offline Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
