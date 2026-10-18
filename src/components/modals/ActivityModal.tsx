import React from 'react';
import { X, CheckCircle2, Sparkles, Volume2, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ActivityModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  description: string;
  category?: string;
  onClose: () => void;
  onCompleteExercise?: () => void;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  title,
  subtitle,
  description,
  category,
  onClose,
  onCompleteExercise,
}) => {
  const [selectedOption, setSelectedOption] = React.useState<number | null>(null);
  const [isCompleted, setIsCompleted] = React.useState(false);

  if (!isOpen) return null;

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCheck = () => {
    setIsCompleted(true);
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#232655', '#646AA4', '#FF6243', '#F5A623'],
    });
    if (onCompleteExercise) {
      onCompleteExercise();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-[440px] bg-white rounded-t-[32px] sm:rounded-[28px] p-6 shadow-2xl border border-[#ECEEFE] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#ECEEFE]">
          <div>
            {category && (
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#646AA4] block mb-1">
                {category}
              </span>
            )}
            <h3 id="modal-title" className="text-[20px] font-bold text-[#222149]">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[12px] font-medium text-[#7D82A8] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] flex items-center justify-center text-[#222149] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-5 space-y-4">
          <p className="text-[14px] text-[#555982] leading-relaxed">
            {description}
          </p>

          {/* Interactive Micro-Exercise */}
          <div className="p-4 rounded-2xl bg-[#F6F7FE] border border-[#ECEEFE] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#222149] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#646AA4]" />
                Interactive Preview
              </span>
              <button
                onClick={() => handleSpeak("Could I please get a hot cappuccino with oat milk?")}
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#646AA4] hover:text-[#232655] transition-colors"
                title="Listen to native pronunciation"
              >
                <Volume2 className="w-4 h-4" />
                <span>Audio</span>
              </button>
            </div>

            <p className="text-[15px] font-medium text-[#222149] bg-white p-3 rounded-xl border border-[#E4E7F8]">
              "Could I please get a hot cappuccino with oat milk?"
            </p>

            <div className="space-y-2 pt-1">
              <p className="text-[12px] font-semibold text-[#6B7094]">
                Choose the best polite response:
              </p>
              {[
                { id: 0, text: "Certainly! Would you like that for here or to go?" },
                { id: 1, text: "No, we don't have that." },
                { id: 2, text: "Give me money now." },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`w-full text-left p-3 rounded-xl text-[13px] font-medium transition-all border ${
                    selectedOption === opt.id
                      ? 'bg-[#232655] text-white border-[#232655] shadow-xs'
                      : 'bg-white text-[#222149] border-[#ECEEFE] hover:border-[#CCD1F0]'
                  }`}
                >
                  {opt.text}
                </button>
              ))}
            </div>
          </div>

          {/* Completion Status */}
          {isCompleted && (
            <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center gap-2.5 text-[#065F46] animate-in slide-in-from-bottom-2">
              <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
              <div className="text-[13px]">
                <span className="font-bold">Great job!</span> You completed this practice turn and advanced your daily goal.
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2">
          {!isCompleted ? (
            <button
              onClick={handleCheck}
              disabled={selectedOption === null}
              className="w-full py-3.5 rounded-full bg-[#232655] hover:bg-[#181A3C] disabled:bg-[#D5D8EE] disabled:cursor-not-allowed text-white text-[14px] font-semibold transition-all shadow-lexi-btn flex items-center justify-center gap-2"
            >
              <span>Check Answer</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-full bg-[#232655] hover:bg-[#181A3C] text-white text-[14px] font-semibold transition-all shadow-lexi-btn flex items-center justify-center gap-2"
            >
              <span>Continue Learning</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
