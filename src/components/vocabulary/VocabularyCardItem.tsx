import React from 'react';
import { Volume2, BookOpen, Clock, RotateCcw } from 'lucide-react';
import type { VocabularyCardRecord } from '../../types/vocabulary';
import { formatIntervalPreview } from '../../services/fsrsScheduler';

interface VocabularyCardItemProps {
  card: VocabularyCardRecord;
  onReviewSingle?: (card: VocabularyCardRecord) => void;
}

export const VocabularyCardItem: React.FC<VocabularyCardItemProps> = ({
  card,
  onReviewSingle,
}) => {
  const item = card.item;

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(item.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const isDue = new Date(card.due).getTime() <= Date.now();
  const nextReviewText = isDue 
    ? 'Due now' 
    : `Due in ${formatIntervalPreview(new Date(), new Date(card.due))}`;

  const stateColors: Record<string, { bg: string; text: string; label: string }> = {
    new: { bg: 'bg-[#EFF6FF]', text: 'text-[#2563EB]', label: 'New' },
    learning: { bg: 'bg-[#FFFBEB]', text: 'text-[#D97706]', label: 'Learning' },
    review: { bg: 'bg-[#ECFDF5]', text: 'text-[#059669]', label: 'Review' },
    relearning: { bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', label: 'Relearning' },
  };

  const stateMeta = stateColors[card.state] || stateColors.learning;

  return (
    <div className="p-4 sm:p-4.5 rounded-2xl bg-white border border-[#ECEEFE] shadow-[0_2px_10px_rgba(35,38,85,0.04)] hover:border-[#CCD1F0] transition-all space-y-3">
      {/* Top Header: Word, Badges, Audio */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[17px] font-black text-[#1C2046] tracking-tight">
              {item.word}
            </h3>
            {item.phoneticIpa && (
              <span className="text-[12px] text-[#6B7094] font-mono">
                {item.phoneticIpa}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#ECEFFD] text-[#545CA6] uppercase">
              {item.cefrLevel}
            </span>
            {item.partOfSpeech && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#F1F3F9] text-[#646AA4]">
                {item.partOfSpeech}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSpeak}
          className="w-8 h-8 rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] text-[#222149] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          aria-label={`Listen to pronunciation of ${item.word}`}
          title="Play pronunciation"
        >
          <Volume2 className="w-4 h-4 text-[#545CA6]" />
        </button>
      </div>

      {/* Meaning & Definition */}
      <p className="text-[13px] text-[#2D3154] leading-relaxed">
        {item.definition}
      </p>

      {/* Example Sentence */}
      {item.exampleSentence && (
        <div className="p-2.5 rounded-xl bg-[#FAF9FE] border border-[#F0F1FB] text-[12.5px] text-[#555E92] italic">
          "{item.exampleSentence}"
        </div>
      )}

      {/* Bottom Spaced Repetition Meta */}
      <div className="pt-1 flex items-center justify-between text-[11px] text-[#7C82AA] border-t border-[#F4F5FD] gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* FSRS State badge */}
          <span className={`px-2 py-0.5 rounded-full font-bold ${stateMeta.bg} ${stateMeta.text}`}>
            {stateMeta.label}
          </span>

          {/* Due indicator */}
          <span className={`inline-flex items-center gap-1 font-semibold ${isDue ? 'text-[#DC2626]' : 'text-[#646AA4]'}`}>
            <Clock className="w-3 h-3" />
            <span>{nextReviewText}</span>
          </span>

          {/* Reps count */}
          <span className="text-[#8E93B8]">
            {card.reps} {card.reps === 1 ? 'review' : 'reviews'}
          </span>
        </div>

        {item.sourceLessonTitle && (
          <span className="truncate max-w-[120px] text-[#8E93B8] inline-flex items-center gap-1" title={item.sourceLessonTitle}>
            <BookOpen className="w-3 h-3 shrink-0" />
            <span className="truncate">{item.sourceLessonTitle}</span>
          </span>
        )}

        {onReviewSingle && isDue && (
          <button
            type="button"
            onClick={() => onReviewSingle(card)}
            className="px-2.5 py-1 rounded-full bg-[#1E224E] hover:bg-[#141738] text-white text-[11px] font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-1"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Review</span>
          </button>
        )}
      </div>
    </div>
  );
};
