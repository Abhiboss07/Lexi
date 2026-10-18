import React from 'react';
import { Trophy, Star, ArrowRight, RotateCcw, Flame, BookOpen } from 'lucide-react';
import type { CurriculumLesson } from '../../types/curriculum';
import type { LessonScoreResult } from '../../services/lessonScoring';

interface LessonCompletionSummaryProps {
  lesson: CurriculumLesson;
  scoreResult: LessonScoreResult;
  onContinue: () => void;
  onReview: () => void;
}

export const LessonCompletionSummary: React.FC<LessonCompletionSummaryProps> = ({
  lesson,
  scoreResult,
  onContinue,
  onReview,
}) => {
  return (
    <div className="p-6 space-y-6 text-center animate-in fade-in duration-300">
      {/* Trophy & Stars */}
      <div className="pt-2">
        <div className="w-20 h-20 mx-auto rounded-full bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#10B981] shadow-sm mb-3">
          <Trophy className="w-10 h-10 stroke-[2]" />
        </div>

        {/* 3 Star Tier */}
        <div className="flex justify-center gap-1.5 mb-2">
          {[1, 2, 3].map((starIdx) => (
            <Star
              key={starIdx}
              className={`w-6 h-6 ${
                starIdx <= scoreResult.starsEarned
                  ? 'text-[#F5A623] fill-[#F5A623]'
                  : 'text-[#DDE1F5]'
              }`}
            />
          ))}
        </div>

        <h2 className="text-[22px] font-extrabold text-[#1C2046]">
          {scoreResult.isPassed ? 'Lesson Completed!' : 'Review Recommended'}
        </h2>
        <p className="text-[13px] text-[#636C9E] mt-0.5">
          {scoreResult.isPassed
            ? 'Great job! You have satisfied the completion criteria for this module.'
            : 'You scored below the 80% passing threshold. Try reviewing the lesson to master these concepts.'}
        </p>
      </div>

      {/* Key Score Metrics Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-[#F6F7FE] border border-[#ECEEFE]">
          <span className="text-[10.5px] font-bold text-[#6872A4] uppercase tracking-wider block">
            Score
          </span>
          <span className="text-[19px] font-extrabold text-[#1C2046] mt-0.5 block">
            {scoreResult.scorePercent}%
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F6F7FE] border border-[#ECEEFE]">
          <span className="text-[10.5px] font-bold text-[#6872A4] uppercase tracking-wider block">
            Accuracy
          </span>
          <span className="text-[19px] font-extrabold text-[#1C2046] mt-0.5 block">
            {scoreResult.correctActivities}/{scoreResult.totalActivities}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F6F7FE] border border-[#ECEEFE]">
          <span className="text-[10.5px] font-bold text-[#6872A4] uppercase tracking-wider block">
            Streak
          </span>
          <span className="text-[19px] font-extrabold text-[#FF6243] mt-0.5 flex items-center justify-center gap-1">
            <Flame className="w-4 h-4 fill-[#FF6243]" />
            <span>+1</span>
          </span>
        </div>
      </div>

      {/* Learned Vocabulary & Grammar Highlights */}
      {lesson.vocabulary && lesson.vocabulary.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#FAF9FE] border border-[#ECEEFE] text-left space-y-2">
          <span className="text-[11px] font-bold text-[#545CA6] uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Key Vocabulary Mastered</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {lesson.vocabulary.map((voc, i) => (
              <span key={i} className="px-2.5 py-1 rounded-xl bg-white border border-[#E0E4F8] text-[12px] font-semibold text-[#1C2046]">
                {voc.word} <span className="font-mono text-[11px] text-[#646AA4]">{voc.phoneticIpa}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2.5 pt-2">
        <button
          type="button"
          onClick={onContinue}
          className="w-full py-3.5 rounded-full bg-[#1E224E] hover:bg-[#141738] text-white text-[14px] font-bold transition-all shadow-[0_4px_16px_rgba(30,34,78,0.22)] flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>

        <button
          type="button"
          onClick={onReview}
          className="w-full py-3 rounded-full bg-white hover:bg-[#F9F9FE] text-[#555E92] border border-[#D5D8EE] text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Review Lesson</span>
        </button>
      </div>
    </div>
  );
};
