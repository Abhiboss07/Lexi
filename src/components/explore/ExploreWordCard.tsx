import React, { useState } from 'react';
import { Volume2, Bookmark, Sparkles, ChevronRight, Check } from 'lucide-react';
import { TODAYS_WORD_DATA } from '../../data/exploreData';

interface ExploreWordCardProps {
  onSeeMore?: () => void;
}

export const ExploreWordCard: React.FC<ExploreWordCardProps> = ({ onSeeMore }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [saved, setSaved] = useState(false);

  const handlePronounce = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(TODAYS_WORD_DATA.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlaying(true);
      setTimeout(() => setIsPlaying(false), 1200);
    }
  };

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved(!saved);
  };

  return (
    <section aria-labelledby="todays-word-heading" className="space-y-2">
      {/* Section Header */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5">
          <h2 id="todays-word-heading" className="text-[17px] xs:text-[18px] font-extrabold text-[#15164B]">
            Today's Word
          </h2>
          <span className="text-[14px] text-[#545CA6]" title="Daily refresh">↻</span>
        </div>
        {onSeeMore && (
          <button
            onClick={onSeeMore}
            className="inline-flex items-center gap-0.5 text-[12px] xs:text-[12.5px] font-semibold text-[#545CA6] hover:text-[#15164B] transition-colors"
          >
            <span>See More</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* Word Card */}
      <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#FFFFFF] via-[#FAF9FE] to-[#F3F4FD] border border-[#E4E7F7] p-4.5 xs:p-5 shadow-[0_4px_20px_rgba(35,38,85,0.05)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 pr-1">
            {/* Word & Part of Speech */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[22px] xs:text-[24px] font-black text-[#15164B] tracking-tight">
                {TODAYS_WORD_DATA.word}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E2E0FE] text-[#4E5388]">
                {TODAYS_WORD_DATA.partOfSpeech}
              </span>
            </div>

            {/* Pronunciation & Audio Button */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[12px] xs:text-[12.5px] font-medium text-[#7D82A8]">
                {TODAYS_WORD_DATA.phonetic}
              </span>
              <button
                onClick={handlePronounce}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  isPlaying 
                    ? 'bg-[#15164B] text-white scale-110 shadow-xs' 
                    : 'bg-[#EFF1FE] text-[#545CA6] hover:bg-[#E2E4F8]'
                }`}
                aria-label={`Listen to pronunciation of ${TODAYS_WORD_DATA.word}`}
              >
                <Volume2 className="w-3.5 h-3.5 stroke-[2.4]" />
              </button>
            </div>

            {/* Definition */}
            <p className="text-[12px] xs:text-[12.5px] text-[#52577F] leading-[1.38] mt-2">
              {TODAYS_WORD_DATA.definition}
            </p>
          </div>

          {/* Right Decorative Graphic with Celebration & Sparkles */}
          <div className="shrink-0 w-16 h-16 xs:w-18 xs:h-18 rounded-2xl bg-gradient-to-br from-[#EEF2FF] to-[#E0E7FF] border border-[#C7D2FE]/60 flex items-center justify-center relative shadow-xs">
            <span className="text-2xl xs:text-3xl select-none" role="img" aria-label="Celebration">
              🙌
            </span>
            <Sparkles className="w-3.5 h-3.5 text-[#F59E0B] absolute top-1.5 right-1.5 animate-pulse" />
          </div>
        </div>

        {/* Example Sentence Container with Bookmark Toggle */}
        <div className="mt-3.5 p-3 rounded-2xl bg-[#FEF7ED] border border-[#FDE68A]/70 flex items-center justify-between gap-2.5">
          <p className="text-[11.5px] xs:text-[12px] font-medium text-[#92400E] italic leading-[1.35]">
            "{TODAYS_WORD_DATA.exampleSentence}"
          </p>
          <button
            onClick={handleToggleSave}
            className={`p-1.5 rounded-full transition-colors shrink-0 cursor-pointer ${
              saved 
                ? 'bg-[#D97706] text-white' 
                : 'text-[#B45309] hover:bg-[#FDE68A]'
            }`}
            aria-label={saved ? 'Remove bookmark' : 'Bookmark this sentence'}
          >
            {saved ? (
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : (
              <Bookmark className="w-3.5 h-3.5 stroke-[2.2]" />
            )}
          </button>
        </div>
      </div>
    </section>
  );
};
