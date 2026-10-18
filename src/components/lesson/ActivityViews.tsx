import React, { useState } from 'react';
import { Volume2, Check, Eye, EyeOff } from 'lucide-react';
import type {
  MultipleChoiceActivity,
  DialogueActivity,
  FillBlankActivity,
  SentenceOrderActivity,
  ListeningActivity,
  PronunciationPromptActivity,
  MatchingActivity,
  WritingPromptActivity,
} from '../../types/curriculum';
import type { ActivityAnswer } from '../../services/lessonScoring';

/**
 * Helper to safely pronounce text using browser Web Speech API with fallback notice
 */
export function playBrowserSpeech(text: string, rate: number = 0.9): boolean {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = rate;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * 1. Multiple Choice Activity View
 */
export const MultipleChoiceView: React.FC<{
  activity: MultipleChoiceActivity;
  answer: number | null;
  onSelectAnswer: (index: number) => void;
  isSubmitted: boolean;
  isCorrect?: boolean;
}> = ({ activity, answer, onSelectAnswer, isSubmitted }) => {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-[#F6F7FE] border border-[#ECEEFE]">
        <p className="text-[15px] sm:text-[16px] font-semibold text-[#1C2046] leading-relaxed">
          {activity.prompt}
        </p>
      </div>

      <div className="space-y-2.5 pt-1">
        {activity.options.map((option, idx) => {
          const isSelected = answer === idx;
          let btnClass = 'bg-white text-[#222149] border-[#ECEEFE] hover:border-[#CCD1F0]';
          if (isSelected) {
            btnClass = 'bg-[#232655] text-white border-[#232655] shadow-sm';
          }
          if (isSubmitted) {
            if (idx === activity.correctIndex) {
              btnClass = 'bg-[#ECFDF5] text-[#065F46] border-[#10B981] font-bold';
            } else if (isSelected && idx !== activity.correctIndex) {
              btnClass = 'bg-[#FEF2F2] text-[#991B1B] border-[#EF4444]';
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isSubmitted}
              onClick={() => onSelectAnswer(idx)}
              className={`w-full text-left p-3.5 sm:p-4 rounded-2xl text-[14px] font-medium transition-all border flex items-center justify-between cursor-pointer ${btnClass}`}
            >
              <span>{option}</span>
              <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                isSelected ? 'border-white/80 bg-white/20' : 'border-[#D8DCEF]'
              }`}>
                {String.fromCharCode(65 + idx)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 2. Dialogue Activity View
 */
export const DialogueView: React.FC<{
  activity: DialogueActivity;
  answer: ActivityAnswer | null;
  onAnswerChange: (ans: ActivityAnswer) => void;
  isSubmitted: boolean;
}> = ({ activity, answer, onAnswerChange, isSubmitted }) => {
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl bg-[#EFF1FE] border border-[#E0E4FC] flex items-center justify-between">
        <span className="text-[11.5px] font-bold uppercase tracking-wider text-[#545CA6]">
          Context: {activity.scenarioContext}
        </span>
      </div>

      {/* Dialogue Conversation Turns */}
      <div className="space-y-3 py-1">
        {activity.turns.map((turn, idx) => (
          <div key={idx} className="p-3.5 rounded-2xl bg-[#FAF9FE] border border-[#ECEEFE] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-bold text-[#646AA4] uppercase tracking-wider">
                {turn.speaker}
              </span>
              <button
                type="button"
                onClick={() => playBrowserSpeech(turn.text, turn.audioSpeed || 0.9)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#646AA4] hover:text-[#232655] cursor-pointer"
                title="Play pronunciation"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Listen</span>
              </button>
            </div>
            <p className="text-[14px] text-[#1D2147] font-medium leading-relaxed">
              "{turn.text}"
            </p>
          </div>
        ))}
      </div>

      {/* Comprehension Question if provided */}
      {activity.comprehensionQuestion ? (
        <div className="pt-2 space-y-2.5">
          <p className="text-[13px] font-bold text-[#1C2046]">
            {activity.comprehensionQuestion.question}
          </p>
          {activity.comprehensionQuestion.options.map((opt, idx) => {
            const isSelected = answer === idx;
            let btnClass = isSelected 
              ? 'bg-[#232655] text-white border-[#232655]' 
              : 'bg-white text-[#222149] border-[#ECEEFE] hover:border-[#CCD1F0]';
            if (isSubmitted) {
              if (idx === activity.comprehensionQuestion?.correctIndex) {
                btnClass = 'bg-[#ECFDF5] text-[#065F46] border-[#10B981] font-bold';
              } else if (isSelected && idx !== activity.comprehensionQuestion?.correctIndex) {
                btnClass = 'bg-[#FEF2F2] text-[#991B1B] border-[#EF4444]';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isSubmitted}
                onClick={() => onAnswerChange(idx)}
                className={`w-full text-left p-3 rounded-xl text-[13px] font-medium transition-all border cursor-pointer ${btnClass}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="pt-2">
          <button
            type="button"
            disabled={isSubmitted}
            onClick={() => onAnswerChange('acknowledged')}
            className={`w-full p-3.5 rounded-2xl text-[13.5px] font-bold border transition-all cursor-pointer ${
              answer === 'acknowledged'
                ? 'bg-[#232655] text-white border-[#232655]'
                : 'bg-white text-[#222149] border-[#ECEEFE] hover:border-[#CCD1F0]'
            }`}
          >
            I have read and understood this dialogue ✓
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * 3. Fill in the Blank Activity View
 */
export const FillBlankView: React.FC<{
  activity: FillBlankActivity;
  answer: string;
  onSelectOption: (word: string) => void;
  isSubmitted: boolean;
}> = ({ activity, answer, onSelectOption, isSubmitted }) => {
  const parts = activity.sentenceWithBlank.split('_____');

  return (
    <div className="space-y-4">
      {/* Sentence Banner with Blank */}
      <div className="p-5 rounded-2xl bg-[#F6F7FE] border border-[#ECEEFE] text-center">
        <p className="text-[17px] font-medium text-[#1E224E] leading-relaxed">
          {parts[0]}
          <span className="inline-block mx-1.5 px-3 py-0.5 rounded-lg border-b-2 border-[#232655] bg-white font-bold text-[#232655] min-w-[70px]">
            {answer || '______'}
          </span>
          {parts[1] || ''}
        </p>
      </div>

      {activity.targetGrammarPoint && (
        <p className="text-[11.5px] font-medium text-[#7D84B0] text-center">
          Focus: {activity.targetGrammarPoint}
        </p>
      )}

      {/* Option Pills */}
      <div className="grid grid-cols-2 gap-2.5 pt-2">
        {activity.options.map((opt, idx) => {
          const isSelected = answer.toLowerCase() === opt.toLowerCase();
          let btnClass = isSelected
            ? 'bg-[#232655] text-white border-[#232655] shadow-xs'
            : 'bg-white text-[#222149] border-[#ECEEFE] hover:border-[#CCD1F0]';
          if (isSubmitted) {
            if (opt.toLowerCase() === activity.correctOption.toLowerCase()) {
              btnClass = 'bg-[#ECFDF5] text-[#065F46] border-[#10B981] font-bold';
            } else if (isSelected) {
              btnClass = 'bg-[#FEF2F2] text-[#991B1B] border-[#EF4444]';
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isSubmitted}
              onClick={() => onSelectOption(opt)}
              className={`p-3.5 rounded-2xl text-[14px] font-bold text-center border transition-all cursor-pointer ${btnClass}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 4. Sentence Ordering Activity View
 */
export const SentenceOrderView: React.FC<{
  activity: SentenceOrderActivity;
  orderedWords: string[];
  onChangeOrder: (words: string[]) => void;
  isSubmitted: boolean;
}> = ({ activity, orderedWords, onChangeOrder, isSubmitted }) => {
  // Pool contains scrambled words minus currently chosen words
  const availableWords = activity.scrambledWords.filter((w) => !orderedWords.includes(w));

  const handlePickWord = (word: string) => {
    if (isSubmitted) return;
    onChangeOrder([...orderedWords, word]);
  };

  const handleRemoveWord = (word: string) => {
    if (isSubmitted) return;
    onChangeOrder(orderedWords.filter((w) => w !== word));
  };

  return (
    <div className="space-y-4">
      <div className="p-3.5 rounded-2xl bg-[#F6F7FE] border border-[#ECEEFE]">
        <p className="text-[13px] font-bold text-[#232655]">
          Tap the words in the correct syntactic order:
        </p>
      </div>

      {/* Assembled Sentence Area */}
      <div className="min-h-[75px] p-4 rounded-2xl bg-white border border-[#CCD1F0] flex flex-wrap gap-2 items-center">
        {orderedWords.length === 0 ? (
          <span className="text-[13px] text-[#A0A7D0] italic">
            Tap words from below to construct your sentence...
          </span>
        ) : (
          orderedWords.map((word, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isSubmitted}
              onClick={() => handleRemoveWord(word)}
              className="px-3 py-1.5 rounded-xl bg-[#232655] text-white text-[13.5px] font-bold transition-transform active:scale-95 cursor-pointer"
            >
              {word}
            </button>
          ))
        )}
      </div>

      {/* Available Word Bank */}
      <div className="flex flex-wrap gap-2 pt-2 justify-center">
        {availableWords.map((word, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isSubmitted}
            onClick={() => handlePickWord(word)}
            className="px-3.5 py-2 rounded-xl bg-white text-[#222149] border border-[#D5D8EE] text-[13.5px] font-semibold hover:border-[#232655] hover:bg-[#F9F9FE] shadow-2xs transition-all cursor-pointer"
          >
            {word}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * 5. Listening Activity View
 */
export const ListeningView: React.FC<{
  activity: ListeningActivity;
  answer: number | null;
  onSelectOption: (idx: number) => void;
  isSubmitted: boolean;
}> = ({ activity, answer, onSelectOption, isSubmitted }) => {
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <div className="space-y-4">
      {/* Audio Playback Controls */}
      <div className="p-5 rounded-2xl bg-[#EFF2FD] border border-[#D8DEFA] text-center space-y-3">
        <button
          type="button"
          onClick={() => playBrowserSpeech(activity.audioTranscript, activity.playbackSpeed || 0.9)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#232655] hover:bg-[#181A3C] text-white font-bold text-[13.5px] shadow-sm transition-all cursor-pointer"
        >
          <Volume2 className="w-4 h-4 stroke-[2.5]" />
          <span>Play Audio</span>
        </button>
        <p className="text-[11px] text-[#636C9E]">
          Uses browser Web Speech API. If audio is muted, toggle the transcript below.
        </p>

        {/* Honest Fallback Transcript Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowTranscript(!showTranscript)}
            className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[#545CA6] hover:underline cursor-pointer"
          >
            {showTranscript ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showTranscript ? 'Hide Transcript' : 'Show Fallback Transcript'}</span>
          </button>
          {showTranscript && (
            <p className="mt-2 p-2.5 rounded-xl bg-white text-[12.5px] text-[#1C2046] font-medium border border-[#E0E4F8]">
              "{activity.audioTranscript}"
            </p>
          )}
        </div>
      </div>

      <p className="text-[14px] font-bold text-[#1C2046] pt-1">
        {activity.question}
      </p>

      {/* Options */}
      <div className="space-y-2">
        {activity.options.map((opt, idx) => {
          const isSelected = answer === idx;
          let btnClass = isSelected
            ? 'bg-[#232655] text-white border-[#232655]'
            : 'bg-white text-[#222149] border-[#ECEEFE] hover:border-[#CCD1F0]';
          if (isSubmitted) {
            if (idx === activity.correctIndex) {
              btnClass = 'bg-[#ECFDF5] text-[#065F46] border-[#10B981] font-bold';
            } else if (isSelected) {
              btnClass = 'bg-[#FEF2F2] text-[#991B1B] border-[#EF4444]';
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isSubmitted}
              onClick={() => onSelectOption(idx)}
              className={`w-full text-left p-3.5 rounded-2xl text-[13.5px] font-medium border transition-all cursor-pointer ${btnClass}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 6. Pronunciation Prompt Activity View
 */
export const PronunciationPromptView: React.FC<{
  activity: PronunciationPromptActivity;
  isPracticed: boolean;
  onConfirmPractice: () => void;
  isSubmitted: boolean;
}> = ({ activity, isPracticed, onConfirmPractice, isSubmitted }) => {
  return (
    <div className="space-y-4 text-center">
      <div className="p-6 rounded-3xl bg-[#F6F7FE] border border-[#ECEEFE] space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#646AA4]">
          Target English Phrase
        </span>
        <h3 className="text-[20px] font-extrabold text-[#1C2046] leading-snug">
          "{activity.targetPhrase}"
        </h3>
        <p className="text-[13px] font-mono text-[#545CA6] bg-[#ECEFFD] inline-block px-3 py-1 rounded-full">
          {activity.phoneticIpa}
        </p>
      </div>

      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={() => playBrowserSpeech(activity.targetPhrase, 0.85)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-[#D5D8EE] hover:bg-[#F9F9FE] text-[#222149] text-[13px] font-bold shadow-2xs transition-all cursor-pointer"
        >
          <Volume2 className="w-4 h-4 text-[#545CA6]" />
          <span>Listen Model</span>
        </button>
      </div>

      <div className="pt-2">
        <button
          type="button"
          disabled={isSubmitted}
          onClick={onConfirmPractice}
          className={`w-full p-4 rounded-2xl text-[14px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
            isPracticed
              ? 'bg-[#232655] text-white border-[#232655]'
              : 'bg-white text-[#222149] border-[#D5D8EE] hover:border-[#232655]'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>I have practiced speaking this phrase out loud</span>
        </button>
      </div>
    </div>
  );
};

/**
 * 7. Matching Activity View
 */
export const MatchingView: React.FC<{
  activity: MatchingActivity;
  matches: Record<string, string>;
  onMatch: (left: string, right: string) => void;
  isSubmitted: boolean;
}> = ({ activity, matches, onMatch, isSubmitted }) => {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const handleLeftClick = (left: string) => {
    if (isSubmitted) return;
    setSelectedLeft(left);
  };

  const handleRightClick = (right: string) => {
    if (isSubmitted || !selectedLeft) return;
    onMatch(selectedLeft, right);
    setSelectedLeft(null);
  };

  return (
    <div className="space-y-4">
      <p className="text-[13px] font-bold text-[#1C2046]">
        {activity.prompt || 'Match each conversational prompt with its natural rejoinder:'}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Left column */}
        <div className="space-y-2">
          {activity.pairs.map((pair, idx) => {
            const isSelected = selectedLeft === pair.left;
            const isMatched = Boolean(matches[pair.left]);
            return (
              <button
                key={idx}
                type="button"
                disabled={isSubmitted}
                onClick={() => handleLeftClick(pair.left)}
                className={`w-full p-3 text-left rounded-xl text-[12.5px] font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#232655] text-white border-[#232655]'
                    : isMatched
                    ? 'bg-[#EFF1FE] text-[#545CA6] border-[#CCD1F0]'
                    : 'bg-white text-[#222149] border-[#ECEEFE] hover:border-[#CCD1F0]'
                }`}
              >
                {pair.left}
              </button>
            );
          })}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          {activity.pairs.map((pair, idx) => {
            const isMatchedWithSelected = selectedLeft && matches[selectedLeft] === pair.right;
            return (
              <button
                key={idx}
                type="button"
                disabled={isSubmitted}
                onClick={() => handleRightClick(pair.right)}
                className={`w-full p-3 text-left rounded-xl text-[12.5px] font-medium border transition-all cursor-pointer ${
                  isMatchedWithSelected
                    ? 'bg-[#232655] text-white border-[#232655]'
                    : 'bg-white text-[#222149] border-[#ECEEFE] hover:border-[#CCD1F0]'
                }`}
              >
                {pair.right}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * 8. Writing Prompt Activity View
 */
export const WritingView: React.FC<{
  activity: WritingPromptActivity;
  text: string;
  onTextChange: (t: string) => void;
  isSubmitted: boolean;
}> = ({ activity, text, onTextChange, isSubmitted }) => {
  const words = text.trim().length > 0 ? text.trim().split(/\s+/) : [];
  const wordCount = words.length;

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-[#F6F7FE] border border-[#ECEEFE] space-y-2">
        <p className="text-[14px] font-semibold text-[#1C2046]">
          {activity.prompt || activity.context}
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[11px] text-[#636C9E] font-medium">Include vocabulary:</span>
          {activity.keywordsToInclude.map((kw, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full bg-[#ECEFFD] text-[#545CA6] text-[11px] font-bold">
              {kw}
            </span>
          ))}
        </div>
      </div>

      <div>
        <textarea
          rows={4}
          disabled={isSubmitted}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Write your response in English here..."
          className="w-full p-3.5 rounded-2xl border border-[#D5D8EE] focus:border-[#232655] text-[13.5px] text-[#1C2046] focus:outline-hidden focus:ring-1 focus:ring-[#232655] bg-white"
        />
        <div className="flex justify-between items-center text-[11.5px] text-[#7D84B0] px-1 mt-1">
          <span>Min words: {activity.minWords}</span>
          <span>Current: {wordCount} words</span>
        </div>
      </div>
    </div>
  );
};
