import React, { useState } from 'react';
import { Volume2, Sparkles, Check } from 'lucide-react';

export interface WordOfTheDayData {
  word: string;
  ipa: string;
  partOfSpeech: string;
  definition: string;
  exampleSentence: string;
  cefrLevel: string;
}

export const SAMPLE_WORD_OF_THE_DAY: WordOfTheDayData = {
  word: 'confident',
  ipa: '/ˈkɒn.fɪ.dənt/',
  partOfSpeech: 'adjective',
  definition: 'Feeling sure of yourself and your abilities in social or practical situations.',
  exampleSentence: 'With daily practice, she felt confident speaking English with colleagues.',
  cefrLevel: 'B1',
};

interface WordOfTheDayCardProps {
  data?: WordOfTheDayData;
  isHighlighted?: boolean;
}

export const WordOfTheDayCard: React.FC<WordOfTheDayCardProps> = ({ 
  data = SAMPLE_WORD_OF_THE_DAY,
  isHighlighted = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  const handlePlayAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(data.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleCopyWord = () => {
    navigator.clipboard?.writeText(`${data.word} (${data.partOfSpeech}) - ${data.definition}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section 
      id="word-of-the-day-section" 
      aria-labelledby="word-of-the-day-heading" 
      className={`pt-2 pb-1 transition-all duration-700 ${
        isHighlighted ? 'ring-2 ring-[#646AA4] rounded-3xl p-1 bg-[#F0F2FE]/50' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <div className="flex items-center gap-1.5">
          <h2 id="word-of-the-day-heading" className="text-[19px] font-extrabold tracking-tight text-[#222149]">
            Word of the Day
          </h2>
          <Sparkles className="w-4 h-4 text-[#F5A623]" aria-hidden="true" />
        </div>
        <span className="text-[11px] font-semibold text-[#7D82A8] bg-[#ECEEFE] px-2 py-0.5 rounded-full">
          Level {data.cefrLevel}
        </span>
      </div>

      <div className="p-4.5 rounded-2xl bg-gradient-to-br from-[#FFFFFF] via-[#FBFBFE] to-[#F3F5FE] border border-[#ECEEFE] shadow-lexi-card">
        {/* Word + IPA + Audio Control */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <h3 className="text-[22px] font-extrabold text-[#222149] tracking-tight">
              {data.word}
            </h3>
            <span className="text-[12px] font-mono text-[#7D82A8]">
              {data.ipa}
            </span>
            <span className="text-[11px] font-semibold text-[#5B6094] bg-[#EEF1FE] px-2 py-0.5 rounded-md">
              {data.partOfSpeech}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Pronunciation Audio Button */}
            <button
              onClick={handlePlayAudio}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isPlaying
                  ? 'bg-[#232655] text-white scale-105'
                  : 'bg-[#EEF1FE] text-[#232655] hover:bg-[#232655] hover:text-white'
              } focus:outline-hidden focus:ring-2 focus:ring-[#646AA4] focus:ring-offset-1`}
              aria-label={`Listen to pronunciation of ${data.word}`}
              title="Listen to pronunciation"
            >
              <Volume2 className="w-4 h-4 stroke-[2.2]" />
            </button>

            {/* Quick Copy Bookmark */}
            <button
              onClick={handleCopyWord}
              className="w-9 h-9 rounded-full bg-[#FAFBFD] border border-[#ECEEFE] flex items-center justify-center text-[#7D82A8] hover:text-[#232655] hover:border-[#CCD1F0] transition-colors focus:outline-hidden"
              aria-label="Copy word and definition"
              title={copied ? 'Copied!' : 'Copy to clipboard'}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <span className="text-xs font-bold">Aa</span>}
            </button>
          </div>
        </div>

        {/* Definition */}
        <p className="text-[13px] text-[#4F5377] leading-relaxed mt-2.5 font-normal">
          {data.definition}
        </p>

        {/* Natural Context Example */}
        <div className="mt-3 p-3 rounded-xl bg-[#FFFDF5] border border-[#FDEECC]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E7A38] block mb-0.5">
            Example
          </span>
          <p className="text-[12.5px] text-[#5C4D2E] italic leading-snug">
            "{data.exampleSentence}"
          </p>
        </div>
      </div>
    </section>
  );
};
