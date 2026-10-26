import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  RotateCw, 
  Target, 
  BookOpen, 
  MessageCircle, 
  FileText, 
  Headphones, 
  Award,
  ChevronRight,
  Mic
} from 'lucide-react';
import type { 
  DailyStudyPlanRecord, 
  DailyStudyPlanItem, 
  AdaptiveLearnerProfile 
} from '../../types/adaptivePlan';
import { adaptiveLearningService } from '../../services/adaptiveLearningService';

export interface TodaysLearningPlanProps {
  userId?: string;
  onLaunchItem: (item: DailyStudyPlanItem) => void;
  refreshTrigger?: number;
}

export const TodaysLearningPlan: React.FC<TodaysLearningPlanProps> = ({
  userId = 'local-learner-1',
  onLaunchItem,
  refreshTrigger = 0,
}) => {
  const [plan, setPlan] = useState<DailyStudyPlanRecord | null>(null);
  const [profile, setProfile] = useState<AdaptiveLearnerProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadPlan = useCallback(async () => {
    try {
      setIsLoading(true);
      const [currentPlan, currentProfile] = await Promise.all([
        adaptiveLearningService.getDailyStudyPlan(userId),
        adaptiveLearningService.buildAdaptiveProfile(userId),
      ]);
      setPlan(currentPlan);
      setProfile(currentProfile);
    } catch (err) {
      console.error('Failed to load personalized daily plan:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan, refreshTrigger]);

  const handleManualRefresh = async () => {
    try {
      setIsRefreshing(true);
      const recalculated = await adaptiveLearningService.recalculatePlan(userId);
      const updatedProfile = await adaptiveLearningService.buildAdaptiveProfile(userId);
      setPlan(recalculated);
      setProfile(updatedProfile);
    } catch (err) {
      console.error('Failed to refresh daily plan:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading && !plan) {
    return (
      <section 
        className="bg-white rounded-3xl p-5 border border-[#ECEEFE] shadow-xs animate-pulse space-y-3"
        aria-label="Today's Learning Plan Loading"
      >
        <div className="h-4 bg-indigo-50 rounded-full w-40" />
        <div className="h-16 bg-[#FAF9FD] rounded-2xl" />
        <div className="h-12 bg-[#FAF9FD] rounded-xl" />
      </section>
    );
  }

  if (!plan) return null;

  const totalItems = plan.items.length;
  const completedCount = plan.items.filter((it) => it.isCompleted).length;
  const isAllComplete = totalItems > 0 && completedCount === totalItems;
  const nextItem = plan.items.find((it) => !it.isCompleted) || plan.items[0];

  const getItemIcon = (item: DailyStudyPlanItem) => {
    switch (item.type) {
      case 'vocabulary_review':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case 'curriculum_lesson':
        return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case 'scenario_roleplay':
        return <MessageCircle className="w-4 h-4 text-purple-600" />;
      case 'weakness_reinforcement':
        if (item.category === 'listening') {
          return <Headphones className="w-4 h-4 text-violet-600" />;
        }
        if (item.category === 'speaking') {
          return <Mic className="w-4 h-4 text-rose-600" />;
        }
        return <FileText className="w-4 h-4 text-amber-600" />;
      case 'daily_challenge':
        return <Award className="w-4 h-4 text-amber-500" />;
      default:
        return <Target className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <section
      className="bg-white rounded-3xl p-4 xs:p-5 border border-[#ECEEFE] shadow-xs space-y-4"
      aria-labelledby="todays-plan-heading"
    >
      {/* 1. Header & Progress Stats */}
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <h2
              id="todays-plan-heading"
              className="text-[16px] xs:text-[18px] font-black text-[#222149] tracking-tight"
            >
              Today's Learning Plan
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-[#4F46E5] text-[10.5px] font-extrabold uppercase tracking-wider">
              {profile?.currentLevel || 'A1'}
            </span>
          </div>
          <p className="text-[11.5px] xs:text-[12px] font-medium text-[#7D82A8]">
            {plan.headlineSummary}
          </p>
        </div>

        {/* Pacing & Refresh */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-xl bg-[#FAF9FD] hover:bg-indigo-50 text-[#7D82A8] hover:text-[#4F46E5] transition-colors border border-[#ECEEFE]"
            title="Recalculate personalized plan"
            aria-label="Recalculate personalized plan"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#4F46E5]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Progress Bar & Timing Indicator */}
      <div className="space-y-1.5 bg-[#FAF9FE] rounded-2xl p-3 border border-[#EEF0FD]">
        <div className="flex items-center justify-between text-[11.5px] font-bold">
          <span className="text-[#222149] flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span>
              {completedCount} of {totalItems} Completed
            </span>
          </span>
          <span className="text-[#7D82A8] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>~{plan.estimatedTotalMinutes} min total target</span>
          </span>
        </div>

        <div className="w-full bg-[#E5E7FA] h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-[#4F46E5] rounded-full transition-all duration-500"
            style={{
              width: `${totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0}%`,
            }}
          />
        </div>

        <p className="text-[10.5px] text-[#7D82A8] italic">
          ↳ {plan.primaryReason}
        </p>
      </div>

      {/* 2. Priority "Up Next" Hero Action Card */}
      {!isAllComplete && nextItem && (
        <div className="bg-gradient-to-r from-[#F5F6FE] to-[#F1F3FE] border-2 border-indigo-200/90 rounded-2xl p-4 space-y-2.5 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                Up Next • Priority
              </span>
              <span className="text-[11px] font-bold text-[#646AA4]">
                ~{nextItem.estimatedMinutes} min
              </span>
            </div>
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-xs">
              {getItemIcon(nextItem)}
            </div>
          </div>

          <div>
            <h3 className="text-[14px] xs:text-[15px] font-bold text-[#222149]">
              {nextItem.title}
            </h3>
            <p className="text-[11.5px] text-[#646AA4] mt-0.5 leading-relaxed">
              {nextItem.reason}
            </p>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={() => onLaunchItem(nextItem)}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <span>Start Activity</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* When All Completed Celebration */}
      {isAllComplete && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold">Today's plan complete!</span> Outstanding dedication. Keep reviewing or explore extra scenarios in the Explore tab.
          </div>
        </div>
      )}

      {/* 3. Sequence of Today's Activities */}
      <div className="space-y-2">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#7D82A8] px-1">
          Scheduled Activities ({plan.items.length})
        </div>

        <div className="space-y-1.5">
          {plan.items.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => onLaunchItem(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onLaunchItem(item);
                }
              }}
              className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer select-none ${
                item.isCompleted
                  ? 'bg-[#F9FAFC] border-[#E8EBF5] opacity-75'
                  : 'bg-white hover:bg-[#FAF9FE] border-[#ECEEFE] hover:border-indigo-200 shadow-2xs'
              }`}
              aria-label={`${item.title} - ${item.isCompleted ? 'Completed' : 'Not completed'}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Status indicator circle */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    item.isCompleted
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  {item.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[12.5px] font-bold truncate ${
                        item.isCompleted ? 'text-[#7D82A8] line-through' : 'text-[#222149]'
                      }`}
                    >
                      {item.title}
                    </span>
                    {item.isPriority && !item.isCompleted && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-extrabold uppercase shrink-0">
                        Priority
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#7D82A8] truncate">
                    {item.subtitle} • ~{item.estimatedMinutes} min
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[#7D82A8] shrink-0">
                {item.isCompleted ? (
                  <span className="text-[10.5px] font-semibold text-emerald-700">Done</span>
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#A4A9D3]" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
