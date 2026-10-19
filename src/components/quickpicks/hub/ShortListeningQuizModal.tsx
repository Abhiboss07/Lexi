import React, { useState, useEffect } from 'react';
import { 
  X, 
  Volume2, 
  VolumeX, 
  Check, 
  ArrowRight, 
  Sparkles, 
  FileText, 
  Award
} from 'lucide-react';
import type { PracticePreferences } from '../../../types/practicePreferences';
import { getListeningQuiz, type ListeningDialogue } from '../../../services/activityHubService';
import { quickPicksRepository } from '../../../db/quickPicksRepository';
import { practiceRepository } from '../../../db/practiceRepository';
import { getLocalDateString } from '../../../services/dailyPracticeService';

interface ShortListeningQuizModalProps {
  userId?: string;
  isOpen: boolean;
  preferences?: PracticePreferences;
  onClose: () => void;
}

export const ShortListeningQuizModal: React.FC<ShortListeningQuizModalProps> = ({
  userId = 'local-learner-1',
  isOpen,
  preferences,
  onClose,
}) => {
  const [dialogue, setDialogue] = useState<ListeningDialogue | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [speechRate, setSpeechRate] = useState<number>(1.0);

  useEffect(() => {
    if (!isOpen) return;
    const diff = preferences?.defaultDifficulty || 'medium';
    const item = getListeningQuiz(diff);
    setDialogue(item);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setIsAnswerChecked(false);
    setIsCompleted(false);
    setShowTranscript(false);
    setScore(0);
    setSpeechRate(diff === 'easy' ? 0.8 : 1.0);
  }, [isOpen, preferences?.defaultDifficulty]);

  if (!isOpen || !dialogue) return null;

  const currentQ = dialogue.questions[currentQuestionIndex];

  const handlePlayAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(dialogue.audioText);
      utterance.lang = 'en-US';
      utterance.rate = speechRate;
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerChecked) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestionIndex]: idx }));
  };

  const handleCheckQuestion = () => {
    setIsAnswerChecked(true);
    const chosen = selectedAnswers[currentQuestionIndex];
    if (chosen === currentQ.correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = async () => {
    if (currentQuestionIndex + 1 < dialogue.questions.length) {
      setCurrentQuestionIndex((idx) => idx + 1);
      setIsAnswerChecked(false);
    } else {
      setIsCompleted(true);
      const chosen = selectedAnswers[currentQuestionIndex];
      const finalScore = score + (chosen === currentQ.correctIndex ? 1 : 0);
      const accuracy = Math.round((finalScore / dialogue.questions.length) * 100);

      const dateStr = getLocalDateString();
      await quickPicksRepository.recordActivityCompletion({
        id: `${userId}-listening-quiz-${dateStr}`,
        userId,
        activityId: 'short-listening-quiz',
        date: dateStr,
        score: accuracy,
        completedAt: new Date().toISOString(),
      });

      await practiceRepository.recordSession({
        userId,
        category: 'listening-quiz',
        difficulty: preferences?.defaultDifficulty || 'medium',
        sessionLength: 'quick',
        durationMinutes: 3,
        score: accuracy,
      });
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#15164B]/40 backdrop-blur-xs animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="listening-quiz-title"
    >
      <div className="w-full max-w-[460px] bg-white rounded-[32px] p-5 sm:p-6 shadow-2xl border border-[#ECEEFE] space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#545CA6] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6243]" />
              <span>Ear Training</span>
            </span>
            <h2 id="listening-quiz-title" className="text-[20px] font-black text-[#15164B] tracking-tight">
              Short Listening Quiz
            </h2>
            <p className="text-[12px] font-medium text-[#6B7094]">
              Listen carefully to the authentic dialogue and answer comprehension checks.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] text-[#222149] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Listening Quiz"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Audio Player Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#F0F2FE] to-[#F8F9FF] border border-[#DEE3FA] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-[#545CA6] block">
                Scenario: {dialogue.title}
              </span>
              <span className="text-[12px] font-medium text-[#6B7094]">
                Speaker: {dialogue.speaker} • {speechRate}x speed
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#DEE3FA]">
                <button
                  type="button"
                  onClick={() => setSpeechRate(1.0)}
                  className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold cursor-pointer transition-colors ${
                    speechRate === 1.0
                      ? 'bg-[#15164B] text-white shadow-xs'
                      : 'text-[#6B7094] hover:bg-[#F0F2FE]'
                  }`}
                  aria-pressed={speechRate === 1.0}
                >
                  Normal (1.0x)
                </button>
                <button
                  type="button"
                  onClick={() => setSpeechRate(0.8)}
                  className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold cursor-pointer transition-colors ${
                    speechRate === 0.8
                      ? 'bg-[#15164B] text-white shadow-xs'
                      : 'text-[#6B7094] hover:bg-[#F0F2FE]'
                  }`}
                  aria-pressed={speechRate === 0.8}
                >
                  Slower (0.8x)
                </button>
              </div>

              <button
                type="button"
                onClick={isPlaying ? handleStopAudio : handlePlayAudio}
                className={`p-3 rounded-2xl flex items-center gap-1.5 font-bold text-[12px] transition-all cursor-pointer shadow-xs ${
                  isPlaying 
                    ? 'bg-[#EF4444] text-white hover:bg-[#DC2626]' 
                    : 'bg-[#15164B] text-white hover:bg-[#0E1038]'
                }`}
                aria-label={isPlaying ? 'Pause audio' : 'Play listening dialogue'}
              >
                {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{isPlaying ? 'Stop' : 'Play Audio'}</span>
              </button>
            </div>
          </div>

          {/* Transcript Accessibility Toggle */}
          <div className="pt-1 border-t border-[#DEE3FA]/60">
            <button
              type="button"
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-[11.5px] font-bold text-[#545CA6] hover:text-[#15164B] flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showTranscript ? 'Hide Accessible Transcript' : 'Show Accessible Transcript'}</span>
            </button>
            {showTranscript && (
              <p className="mt-2 p-3 rounded-xl bg-white text-[12px] text-[#222149] italic border border-[#DEE3FA] leading-relaxed animate-in fade-in">
                "{dialogue.transcript}"
              </p>
            )}
          </div>
        </div>

        {/* Question Area */}
        {!isCompleted && currentQ && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#8E93B8]">
              <span>Question {currentQuestionIndex + 1} of {dialogue.questions.length}</span>
              <span>Level: {dialogue.cefrLevel}</span>
            </div>

            <p className="text-[13.5px] font-black text-[#15164B]">
              {currentQ.question}
            </p>

            <div className="space-y-2">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                const isCorrect = idx === currentQ.correctIndex;
                let style = 'bg-white border-[#E2E6FA] text-[#222149] hover:bg-[#F9FAFF]';

                if (isAnswerChecked) {
                  if (isCorrect) {
                    style = 'bg-[#ECFDF5] border-[#10B981] text-[#065F46] font-extrabold';
                  } else if (isSelected) {
                    style = 'bg-[#FEF2F2] border-[#EF4444] text-[#991B1B] font-bold';
                  }
                } else if (isSelected) {
                  style = 'bg-[#15164B] text-white border-[#15164B] font-bold shadow-xs';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(idx)}
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
              <div className="p-3 rounded-2xl bg-[#F0F3FE] border border-[#DEE3FA] text-[12px] text-[#222149] leading-relaxed animate-in fade-in">
                <span className="font-extrabold text-[#545CA6] block">Insight:</span>
                <p>{currentQ.explanation}</p>
              </div>
            )}

            <div className="flex justify-end pt-1">
              {!isAnswerChecked ? (
                <button
                  type="button"
                  onClick={handleCheckQuestion}
                  disabled={selectedAnswers[currentQuestionIndex] === undefined}
                  className="px-5 py-2.5 rounded-full bg-[#545CA6] hover:bg-[#434A8E] disabled:opacity-50 text-white text-[12.5px] font-bold cursor-pointer shadow-sm transition-all"
                >
                  Check Answer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-full bg-[#15164B] hover:bg-[#0E1038] text-white text-[12.5px] font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                >
                  <span>{currentQuestionIndex + 1 < dialogue.questions.length ? 'Next Question' : 'Finish Quiz'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Completion Card */}
        {isCompleted && (
          <div className="p-5 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] text-center space-y-3 animate-in fade-in">
            <Award className="w-10 h-10 text-[#16A34A] mx-auto" />
            <h3 className="text-[17px] font-black text-[#15164B]">Listening Completed!</h3>
            <p className="text-[13px] font-bold text-[#15803D]">
              Score: {score} of {dialogue.questions.length} correct ({Math.round((score / dialogue.questions.length) * 100)}%)
            </p>
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
