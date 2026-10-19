import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  CheckCircle2, 
  Briefcase, 
  HelpCircle,
  ExternalLink 
} from 'lucide-react';
import type { PracticePreferences } from '../../../types/practicePreferences';
import { 
  getInterviewSprintQuestions, 
  type InterviewSprintQuestion 
} from '../../../services/activityHubService';
import { quickPicksRepository } from '../../../db/quickPicksRepository';
import { practiceRepository } from '../../../db/practiceRepository';
import { getLocalDateString } from '../../../services/dailyPracticeService';

interface InterviewSprintModalProps {
  userId?: string;
  isOpen: boolean;
  preferences?: PracticePreferences;
  onClose: () => void;
  onOpenFullTrainer?: () => void;
}

export const InterviewSprintModal: React.FC<InterviewSprintModalProps> = ({
  userId = 'local-learner-1',
  isOpen,
  preferences,
  onClose,
  onOpenFullTrainer,
}) => {
  const [selectedRole, setSelectedRole] = useState<InterviewSprintQuestion['role']>('General Professional');
  const [question, setQuestion] = useState<InterviewSprintQuestion | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [showStarGuide, setShowStarGuide] = useState(false);
  const [feedback, setFeedback] = useState<{
    score: number;
    starBreakdown: { s: boolean; t: boolean; a: boolean; r: boolean };
    strengths: string[];
    tips: string[];
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const list = getInterviewSprintQuestions(selectedRole, preferences?.defaultDifficulty || 'medium');
    setQuestion(list[0]);
    setAnswerText('');
    setFeedback(null);
    setShowStarGuide(false);
  }, [isOpen, selectedRole, preferences?.defaultDifficulty]);

  if (!isOpen || !question) return null;

  const handleEvaluateAnswer = async () => {
    const clean = answerText.trim();
    if (!clean) return;

    const lower = clean.toLowerCase();
    const words = clean.split(/\s+/);

    // STAR heuristics
    const hasSituation = lower.includes('when') || lower.includes('at my') || lower.includes('in my') || lower.includes('project') || lower.includes('time');
    const hasTask = lower.includes('need') || lower.includes('goal') || lower.includes('task') || lower.includes('responsible') || lower.includes('had to');
    const hasAction = lower.includes('i ') || lower.includes('organized') || lower.includes('developed') || lower.includes('created') || lower.includes('reached out') || lower.includes('implemented');
    const hasResult = lower.includes('result') || lower.includes('increase') || lower.includes('achieved') || lower.includes('successfully') || lower.includes('improved') || lower.includes('learned');

    const strengths: string[] = [];
    const tips: string[] = [];

    let score = 50;

    if (words.length >= 25) {
      score += 20;
      strengths.push(`Good interview answer length (${words.length} words) offering clear detail.`);
    } else {
      tips.push('Aim for 25+ words to construct a compelling behavioral interview narrative.');
    }

    if (hasAction) {
      score += 15;
      strengths.push('Clear first-person action verbs ("I implemented", "I organized").');
    } else {
      tips.push('Emphasize your individual contribution using strong active verbs.');
    }

    if (hasResult) {
      score += 15;
      strengths.push('Articulated an outcome or measurable result.');
    } else {
      tips.push('Always conclude your answer with the positive result or what you learned.');
    }

    const finalScore = Math.min(100, Math.max(50, score));

    setFeedback({
      score: finalScore,
      starBreakdown: { s: hasSituation, t: hasTask, a: hasAction, r: hasResult },
      strengths,
      tips,
    });

    const dateStr = getLocalDateString();
    await quickPicksRepository.recordActivityCompletion({
      id: `${userId}-interview-sprint-${dateStr}`,
      userId,
      activityId: 'interview-question-sprint',
      date: dateStr,
      score: finalScore,
      completedAt: new Date().toISOString(),
    });

    await practiceRepository.recordSession({
      userId,
      category: 'interview-sprint',
      difficulty: preferences?.defaultDifficulty || 'medium',
      sessionLength: 'standard',
      durationMinutes: 4,
      score: finalScore,
    });
  };

  const roles: Array<InterviewSprintQuestion['role']> = [
    'General Professional',
    'Software Engineer',
    'Product Manager',
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#15164B]/40 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="interview-sprint-title"
    >
      <div className="w-full max-w-[480px] bg-white rounded-[32px] p-5 sm:p-6 shadow-2xl border border-[#ECEEFE] space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#545CA6] flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#FF6243]" />
              <span>Career & Fluency Sprint</span>
            </span>
            <h2 id="interview-sprint-title" className="text-[20px] font-black text-[#15164B] tracking-tight">
              Interview Question Sprint
            </h2>
            <p className="text-[12px] font-medium text-[#6B7094]">
              High-impact 3-minute practice for common English behavioral interview questions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] text-[#222149] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Interview Sprint"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Role Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {roles.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setSelectedRole(r)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors whitespace-nowrap ${
                selectedRole === r
                  ? 'bg-[#15164B] text-white shadow-xs'
                  : 'bg-[#F4F5FD] text-[#6B7094] hover:bg-[#E8EBFB]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Question Card */}
        <div className="p-4 rounded-2xl bg-[#F6F7FE] border border-[#ECEEFE] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#545CA6]">
            <span>Behavioral Question</span>
            <span>Target Level: {question.cefrLevel}</span>
          </div>
          <p className="text-[14px] font-black text-[#15164B] leading-snug">
            "{question.question}"
          </p>

          <button
            type="button"
            onClick={() => setShowStarGuide(!showStarGuide)}
            className="text-[11.5px] font-bold text-[#545CA6] hover:text-[#15164B] flex items-center gap-1 cursor-pointer pt-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showStarGuide ? 'Hide STAR Framework Blueprint' : 'Show STAR Framework Blueprint'}</span>
          </button>

          {showStarGuide && (
            <div className="p-3 rounded-xl bg-white border border-[#DEE3FA] text-[11px] space-y-1 text-[#222149] animate-in fade-in">
              <p><strong>Situation:</strong> {question.starFrameworkTip.situation}</p>
              <p><strong>Task:</strong> {question.starFrameworkTip.task}</p>
              <p><strong>Action:</strong> {question.starFrameworkTip.action}</p>
              <p><strong>Result:</strong> {question.starFrameworkTip.result}</p>
            </div>
          )}
        </div>

        {/* Answer Input */}
        <div className="space-y-2">
          <label className="text-[11.5px] font-bold text-[#15164B] block">
            Draft or practice your answer:
          </label>
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Structure using STAR: In my previous role, we faced... My responsibility was to... I took action by... As a result, we achieved..."
            rows={4}
            className="w-full p-3 rounded-2xl bg-[#F9FAFF] border border-[#DEE3FA] text-[12.5px] text-[#222149] focus:outline-hidden focus:border-[#545CA6] resize-none"
          />

          <div className="flex items-center justify-between pt-1">
            {onOpenFullTrainer && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFullTrainer();
                }}
                className="text-[11.5px] font-bold text-[#545CA6] hover:text-[#15164B] flex items-center gap-1 cursor-pointer"
              >
                <span>Full Mock Interview Studio</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}

            <button
              type="button"
              onClick={handleEvaluateAnswer}
              disabled={!answerText.trim()}
              className="ml-auto px-5 py-2.5 rounded-full bg-[#15164B] hover:bg-[#0E1038] disabled:opacity-50 text-white text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Evaluate Answer</span>
            </button>
          </div>
        </div>

        {/* Evaluation Output */}
        {feedback && (
          <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[13.5px] font-black text-[#15164B] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                STAR Readiness: {feedback.score}/100
              </span>
            </div>

            {/* STAR checklist pills */}
            <div className="grid grid-cols-4 gap-1 text-[10.5px] text-center font-bold">
              <div className={`p-1.5 rounded-lg border ${feedback.starBreakdown.s ? 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]' : 'bg-white text-[#9CA3AF] border-[#E5E7EB]'}`}>
                Situation {feedback.starBreakdown.s ? '✓' : ''}
              </div>
              <div className={`p-1.5 rounded-lg border ${feedback.starBreakdown.t ? 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]' : 'bg-white text-[#9CA3AF] border-[#E5E7EB]'}`}>
                Task {feedback.starBreakdown.t ? '✓' : ''}
              </div>
              <div className={`p-1.5 rounded-lg border ${feedback.starBreakdown.a ? 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]' : 'bg-white text-[#9CA3AF] border-[#E5E7EB]'}`}>
                Action {feedback.starBreakdown.a ? '✓' : ''}
              </div>
              <div className={`p-1.5 rounded-lg border ${feedback.starBreakdown.r ? 'bg-[#DCFCE7] text-[#166534] border-[#86EFAC]' : 'bg-white text-[#9CA3AF] border-[#E5E7EB]'}`}>
                Result {feedback.starBreakdown.r ? '✓' : ''}
              </div>
            </div>

            {feedback.strengths.length > 0 && (
              <div className="space-y-0.5 text-[11.5px] text-[#15803D]">
                <strong className="block">Strengths:</strong>
                <ul className="list-disc list-inside">
                  {feedback.strengths.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {feedback.tips.length > 0 && (
              <div className="space-y-0.5 text-[11.5px] text-[#9A3412] bg-[#FFF7ED] p-2 rounded-xl border border-[#FED7AA]">
                <strong className="block">STAR Enhancements:</strong>
                <ul className="list-disc list-inside">
                  {feedback.tips.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
