import React, { useState } from 'react';
import { X, Award, CheckCircle2, Lock, ArrowRight, BookOpen, Clock } from 'lucide-react';
import type { CEFRLevel, CurriculumLesson, CurriculumUnit } from '../../types/curriculum';
import { CEFR_LEVELS_META, getUnitsForLevel, getLessonsForUnit } from '../../data/curriculum';
import type { CurriculumProgressionState } from '../../types/curriculum';
import { useModalFocusTrap } from '../../hooks/useModalFocusTrap';

interface CurriculumBrowserModalProps {
  isOpen: boolean;
  userProgress: CurriculumProgressionState | null;
  initialLevel?: CEFRLevel;
  onClose: () => void;
  onSelectLesson: (lesson: CurriculumLesson) => void;
}

export const CurriculumBrowserModal: React.FC<CurriculumBrowserModalProps> = ({
  isOpen,
  userProgress,
  initialLevel = 'A1',
  onClose,
  onSelectLesson,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<CEFRLevel>(initialLevel);
  const modalRef = useModalFocusTrap<HTMLDivElement>({ isOpen, onClose });

  if (!isOpen) return null;

  const currentLevelMeta = CEFR_LEVELS_META[selectedLevel];
  const units: CurriculumUnit[] = getUnitsForLevel(selectedLevel);
  const completedIds = userProgress?.completedLessonIds || [];

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="curriculum-browser-title"
    >
      <div className="w-full max-w-[620px] max-h-[92vh] sm:max-h-[85vh] bg-[#F6F7FE] sm:rounded-[32px] rounded-t-[32px] shadow-2xl border border-[#ECEEFE] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 pb-3 bg-white border-b border-[#ECEEFE] shrink-0">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h2 id="curriculum-browser-title" className="text-[18px] sm:text-[20px] font-black text-[#15164B] tracking-tight">
                  CEFR Curriculum Roadmap
                </h2>
                <p className="text-[12px] font-medium text-[#484E77]">
                  Structured English progression from Beginner to Mastery
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] flex items-center justify-center text-[#15164B] transition-colors shrink-0 cursor-pointer"
              aria-label="Close curriculum roadmap"
            >
              <X className="w-4.5 h-4.5 stroke-[2.2]" />
            </button>
          </div>

          {/* CEFR Level Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar" role="tablist">
            {(Object.keys(CEFR_LEVELS_META) as CEFRLevel[]).map((level) => {
              const isActive = selectedLevel === level;
              return (
                <button
                  key={level}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#232655] text-white shadow-xs'
                      : 'bg-[#F0F2FD] text-[#545CA6] hover:bg-[#E4E7FC]'
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>

        {/* Level Overview Banner */}
        <div className="px-5 py-3 bg-[#EEF1FD] border-b border-[#E0E4FA] flex items-center justify-between shrink-0">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-extrabold text-[#15164B]">
                {currentLevelMeta.name} ({selectedLevel})
              </span>
            </div>
            <p className="text-[11.5px] text-[#555E92] truncate">
              {currentLevelMeta.descriptor}
            </p>
          </div>
          <span className="text-[11px] font-extrabold text-[#4338CA] bg-white px-2.5 py-1 rounded-full shrink-0 shadow-2xs">
            {units.length} {units.length === 1 ? 'Unit' : 'Units'}
          </span>
        </div>

        {/* Scrollable Units & Lessons List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {units.length > 0 ? (
            units.map((unit) => {
              const lessons = getLessonsForUnit(unit.id);
              const completedCount = lessons.filter((l) => completedIds.includes(l.id)).length;
              const unitPercent = Math.round((completedCount / Math.max(1, lessons.length)) * 100);

              return (
                <div
                  key={unit.id}
                  className="bg-white rounded-2xl border border-[#ECEEFE] p-4 shadow-xs space-y-3"
                >
                  {/* Unit Title Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#646AA4] bg-[#F0F2FE] px-2 py-0.5 rounded-md">
                          Unit {unit.unitNumber}
                        </span>
                        {unitPercent === 100 && (
                          <span className="text-[10px] font-bold text-[#10B981] flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </span>
                        )}
                      </div>
                      <h3 className="text-[15px] font-bold text-[#15164B] leading-tight">
                        {unit.title}
                      </h3>
                      <p className="text-[12px] text-[#6B7094] mt-0.5">
                        {unit.subtitle}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[12px] font-black text-[#15164B]">
                        {unitPercent}%
                      </span>
                      <p className="text-[10px] text-[#7D82A8]">
                        {completedCount}/{lessons.length} done
                      </p>
                    </div>
                  </div>

                  {/* Lessons Stack */}
                  <div className="space-y-2 pt-1 border-t border-[#F2F4FD]">
                    {lessons.map((lesson) => {
                      const isCompleted = completedIds.includes(lesson.id);
                      const isLocked = lesson.prerequisites.some((pre) => !completedIds.includes(pre));

                      return (
                        <div
                          key={lesson.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                            isCompleted
                              ? 'bg-[#F9FBFE] border-[#E8EEFB]'
                              : isLocked
                              ? 'bg-[#F8F9FD] border-[#ECEEF6] opacity-75'
                              : 'bg-white border-[#E0E4FA] hover:border-[#646AA4]'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Status Icon */}
                            <div className="shrink-0">
                              {isCompleted ? (
                                <div className="w-7 h-7 rounded-full bg-[#ECFDF5] text-[#10B981] flex items-center justify-center">
                                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                                </div>
                              ) : isLocked ? (
                                <div className="w-7 h-7 rounded-full bg-[#F1F3F9] text-[#9AA0C2] flex items-center justify-center">
                                  <Lock className="w-3.5 h-3.5" />
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                                  <BookOpen className="w-3.5 h-3.5" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <h4 className="text-[13px] font-bold text-[#15164B] truncate">
                                {lesson.title}
                              </h4>
                              <div className="flex items-center gap-2 text-[11px] text-[#7D82A8] mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {lesson.estimatedMinutes}m
                                </span>
                                <span>•</span>
                                <span className="capitalize">{lesson.primarySkill}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div>
                            {isLocked ? (
                              <span className="text-[11px] font-semibold text-[#9AA0C2] px-2.5 py-1">
                                Locked
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  onSelectLesson(lesson);
                                  onClose();
                                }}
                                className={`px-3 py-1.5 rounded-full text-[11.5px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                  isCompleted
                                    ? 'bg-[#F0F2FE] hover:bg-[#E4E8FD] text-[#232655]'
                                    : 'bg-[#232655] hover:bg-[#1B1E48] text-white shadow-xs'
                                }`}
                              >
                                <span>{isCompleted ? 'Review' : 'Start'}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-[#7D82A8] text-[13px] bg-white rounded-2xl border border-[#ECEEFE]">
              Curriculum units for level {selectedLevel} are being calibrated. Check back soon!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
