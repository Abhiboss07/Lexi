import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  Flame, 
  Award, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  BookOpen, 
  MessageCircle, 
  FileText, 
  Headphones, 
  Briefcase, 
  AlertCircle,
  BarChart2,
  Calendar,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import type { PracticeCategoryKey } from '../practice/PracticeCategoryNav';
import type { PracticePreferences, PracticeSessionRecord } from '../../types/practicePreferences';
import type { CurriculumProgressionState } from '../../types/curriculum';
import type { VocabularyStats } from '../../types/vocabulary';
import type { UserProfile } from '../../types';
import type { ActivityCompletionRecord, QuickNote } from '../../types/quickPicks';
import { practiceRepository } from '../../db/practiceRepository';
import { curriculumRepository } from '../../db/curriculumRepository';
import { vocabularyRepository } from '../../db/vocabularyRepository';
import { quickPicksRepository } from '../../db/quickPicksRepository';
import { db } from '../../db';
import { LEXI_CURRICULUM } from '../../data/curriculum';
import { calculateAchievements } from '../../services/achievementService';
import { adaptiveLearningService } from '../../services/adaptiveLearningService';
import type { AdaptiveLearnerProfile, DailyStudyPlanRecord } from '../../types/adaptivePlan';
import { AchievementsModal } from '../modals/AchievementsModal';

export interface ProgressDashboardScreenProps {
  userId?: string;
  userStreak?: number;
  userLongestStreak?: number;
  onOpenStudio: (category: PracticeCategoryKey) => void;
  onNavigateToPractice: () => void;
  onNavigateToExplore: () => void;
  onContinueLesson?: (lessonId: string) => void;
}

export const ProgressDashboardScreen: React.FC<ProgressDashboardScreenProps> = ({
  userId = 'local-learner-1',
  userStreak = 7,
  userLongestStreak = 14,
  onOpenStudio,
  onNavigateToPractice,
  onNavigateToExplore: _onNavigateToExplore,
  onContinueLesson,
}) => {
  const [preferences, setPreferences] = useState<PracticePreferences | null>(null);
  const [curriculumProgress, setCurriculumProgress] = useState<CurriculumProgressionState | null>(null);
  const [vocabStats, setVocabStats] = useState<VocabularyStats | null>(null);
  const [sessions, setSessions] = useState<PracticeSessionRecord[]>([]);
  const [todayMinutes, setTodayMinutes] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activityCompletions, setActivityCompletions] = useState<ActivityCompletionRecord[]>([]);
  const [quickNotes, setQuickNotes] = useState<QuickNote[]>([]);
  const [adaptiveProfile, setAdaptiveProfile] = useState<AdaptiveLearnerProfile | null>(null);
  const [dailyPlan, setDailyPlan] = useState<DailyStudyPlanRecord | null>(null);
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadProgressData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        userPrefs, 
        currState, 
        vStats, 
        recentSessions, 
        minutesToday, 
        profile, 
        completions, 
        notes,
        adProfile,
        dPlan,
      ] = await Promise.all([
        practiceRepository.getPreferences(userId),
        curriculumRepository.getLearnerProgress(userId),
        vocabularyRepository.getStats(userId),
        practiceRepository.getSessions(userId, 30),
        practiceRepository.getTodayPracticeMinutes(userId),
        db.users.get(userId),
        quickPicksRepository.getAllActivityCompletions(userId),
        quickPicksRepository.getNotes(userId),
        adaptiveLearningService.buildAdaptiveProfile(userId),
        adaptiveLearningService.getDailyStudyPlan(userId),
      ]);

      setPreferences(userPrefs);
      setCurriculumProgress(currState);
      setVocabStats(vStats);
      setSessions(recentSessions);
      setTodayMinutes(minutesToday);
      setUserProfile(profile || null);
      setActivityCompletions(completions || []);
      setQuickNotes(notes || []);
      setAdaptiveProfile(adProfile);
      setDailyPlan(dPlan);
    } catch (err) {
      console.error('Failed to load progress dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProgressData();
  }, [loadProgressData]);

  const dailyGoalMinutes = preferences?.dailyGoalMinutes || 15;
  const goalPercent = Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100));

  const achievementsSummary = useMemo(() => {
    return calculateAchievements({
      user: userProfile || {
        id: userId,
        name: 'Learner',
        email: 'learner@lexi.local',
        currentStreak: userStreak,
        longestStreak: userLongestStreak,
        lastActiveDate: new Date().toISOString().split('T')[0],
        cefrLevel: curriculumProgress?.currentLevel || 'A2',
        dailyGoalMinutes,
        avatarUrl: '/assets/default-avatar.svg',
      },
      curriculum: curriculumProgress,
      vocabStats,
      sessions,
      activityCompletions,
      quickNotesCount: quickNotes.length,
    });
  }, [userProfile, userId, userStreak, userLongestStreak, curriculumProgress, dailyGoalMinutes, vocabStats, sessions, activityCompletions, quickNotes]);

  // CEFR Lessons Calculation
  const totalLessonsInCurriculum = useMemo(() => {
    return Object.keys(LEXI_CURRICULUM.lessons).length;
  }, []);

  const completedLessonsCount = curriculumProgress?.completedLessonIds?.length || 0;
  const curriculumPercent = Math.min(100, Math.round((completedLessonsCount / (totalLessonsInCurriculum || 1)) * 100));

  // Next lesson calculation
  const nextLessonId = curriculumProgress?.lastStudiedLessonId || 'a1-u2-l3-daily-routines';

  // Average session scores by category from real adaptive profile
  const studioAverages = useMemo(() => {
    const config = {
      conversation: { label: 'Conversation', icon: MessageCircle, color: 'text-[#2563EB]', bg: 'bg-[#EFF6FF]' },
      stories: { label: 'Stories', icon: BookOpen, color: 'text-[#C026D3]', bg: 'bg-[#FDF4FF]' },
      vocabulary: { label: 'Vocabulary', icon: Sparkles, color: 'text-[#059669]', bg: 'bg-[#ECFDF5]' },
      grammar: { label: 'Grammar', icon: FileText, color: 'text-[#D97706]', bg: 'bg-[#FFFBEB]' },
      listening: { label: 'Listening', icon: Headphones, color: 'text-[#7C3AED]', bg: 'bg-[#F5F3FF]' },
      interview: { label: 'Interview', icon: Briefcase, color: 'text-[#2563EB]', bg: 'bg-[#EFF6FF]' },
    };

    const result = {} as Record<string, {
      score: number | null;
      count: number;
      label: string;
      status: string;
      icon: any;
      color: string;
      bg: string;
    }>;

    for (const [key, meta] of Object.entries(config)) {
      const diag = adaptiveProfile?.skills[key as PracticeCategoryKey];
      result[key] = {
        score: diag ? diag.score : null,
        count: diag ? diag.sessionCount : 0,
        status: diag ? diag.status : 'insufficient_evidence',
        label: meta.label,
        icon: meta.icon,
        color: meta.color,
        bg: meta.bg,
      };
    }

    return result;
  }, [adaptiveProfile]);

  // Overall Fluency Index (real measured score or fallback baseline)
  const fluencyIndex = useMemo(() => {
    if (adaptiveProfile?.recentAverageScore !== null && adaptiveProfile?.recentAverageScore !== undefined) {
      return adaptiveProfile.recentAverageScore;
    }
    const scoredSessions = sessions.filter((s) => typeof s.score === 'number' && !isNaN(s.score));
    if (scoredSessions.length > 0) {
      const total = scoredSessions.reduce((acc, s) => acc + (s.score || 0), 0);
      return Math.round(total / scoredSessions.length);
    }
    return 85; // Baseline index for new learners
  }, [adaptiveProfile, sessions]);

  if (isLoading) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-[#545CA6] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[13px] font-semibold text-[#6B7094]">Loading your fluency insights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8" aria-label="Progress & Analytics Dashboard">
      
      {/* 1. Header */}
      <header className="flex items-center justify-between pt-1 gap-2">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] xs:text-[24px] font-black text-[#15164B] tracking-tight">
              Progress & Insights
            </h1>
            <TrendingUp className="w-5 h-5 text-[#545CA6] stroke-[2.4]" />
            <span className="px-2.5 py-0.5 rounded-full bg-[#15164B] text-white text-[11px] font-extrabold uppercase tracking-wider shadow-xs">
              CEFR {curriculumProgress?.currentLevel || 'A2'}
            </span>
          </div>
          <p className="text-[12px] xs:text-[12.5px] font-medium text-[#6B7094]">
            Personalized Fluency Analytics • Goal Tracking • AI Diagnostics
          </p>
        </div>

        {/* Milestones & Badges Trigger */}
        <button
          type="button"
          onClick={() => setIsAchievementsModalOpen(true)}
          className="px-3 py-1.5 rounded-2xl bg-white border border-[#CCD1F0] hover:bg-[#EEF1FB] text-[#15164B] text-[11.5px] font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          aria-label="Open milestones and badges modal"
        >
          <Award className="w-4 h-4 text-[#D97706]" />
          <span className="hidden xs:inline">Milestones & Badges</span>
          <span className="xs:hidden">Badges</span>
          <span className="px-1.5 py-0.2 rounded-md bg-[#EEF2FF] text-[#4F46E5] text-[10.5px] font-extrabold">
            {achievementsSummary.unlockedBadgesCount}
          </span>
        </button>
      </header>

      {/* 2. Premium Editorial Progress Hero Card */}
      <section
        aria-label="Daily Goal and Streak Summary"
        className="relative overflow-hidden rounded-[32px] border border-[#E4E7F7] p-4 xs:p-4.5 sm:p-5 shadow-[0_10px_30px_rgba(35,38,85,0.06)]"
        style={{
          background:
            'radial-gradient(ellipse 65% 60% at 76% 40%, #E2DCFD 0%, #EBE6FD 30%, rgba(246, 245, 254, 0.5) 65%, transparent 100%), linear-gradient(135deg, #FFFFFF 0%, #FAF9FE 38%, #EFF1FD 100%)',
        }}
      >
        {/* Top Editorial Row: Headline, Subtitle, and 3D Character Illustration */}
        <div className="relative flex flex-row items-center justify-between gap-1 xs:gap-2 sm:gap-3">
          <div className="relative z-10 flex-1 min-w-0 pr-0.5 sm:pr-1">
            {/* Eyebrow and Date */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] xs:text-[10.5px] sm:text-[11.5px] font-bold uppercase tracking-[0.18em] text-[#5B618E] leading-tight mb-2 sm:mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-[#545CA6]" />
              <span>YOUR LEARNING JOURNEY</span>
              <span className="text-[#8E93B8] font-normal normal-case tracking-normal text-[10.5px] sm:text-[11px] ml-0.5">
                • {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-[23px] xs:text-[26px] sm:text-[30px] font-black leading-[1.08] tracking-tight text-[#15164B]">
              <span>Your Progress,</span>
              <span className="block text-[#545CA6] mt-0.5">Your Growth</span>
            </h2>

            {/* Subtitle */}
            <p className="text-[11.5px] xs:text-[12px] sm:text-[13px] font-medium text-[#52577F] leading-[1.38] mt-2 sm:mt-2.5 max-w-[240px]">
              See how far you've come and discover what to practise next.
            </p>

            {/* Streak Pill */}
            <button
              type="button"
              onClick={() => setIsAchievementsModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-[#FFF7ED] hover:bg-[#FFEDD5] border border-[#FED7AA] px-3 py-1 rounded-full mt-3 shadow-xs cursor-pointer transition-colors text-left"
              aria-label="View streak achievements"
            >
              <Flame className="w-4 h-4 text-[#EA580C] fill-[#EA580C]" />
              <span className="text-[12px] font-black text-[#9A3412]">{userStreak} Day Streak</span>
              <span className="text-[10.5px] text-[#C2410C] font-semibold">(Best {userLongestStreak}d)</span>
            </button>
          </div>

          {/* Right 3D Character Illustration */}
          <div className="relative shrink-0 w-[125px] xs:w-[145px] sm:w-[165px] self-end flex items-end justify-center pointer-events-none select-none">
            <img
              src="/assets/progress-hero-character-transparent.png"
              alt="3D digital illustration of a student with digital tablet and notebook reviewing language milestones"
              className="w-full h-auto max-h-[190px] xs:max-h-[215px] sm:max-h-[230px] object-contain transition-transform duration-300"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>

        {/* Bottom Metrics Bar: Daily Goal & Fluency Index */}
        <div className="relative z-10 mt-4 pt-3.5 border-t border-[#E8EBFA] space-y-3">
          <div className="grid grid-cols-2 gap-3 items-center">
            {/* Daily Goal Card */}
            <div className="bg-white/80 backdrop-blur-xs p-3 rounded-2xl border border-[#ECEEFE] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#6B7094] uppercase tracking-wider block">
                  Daily Goal Progress
                </span>
                <span className="text-[10px] font-extrabold text-[#545CA6] bg-[#ECEFFD] px-1.5 py-0.5 rounded-md">
                  Today's Momentum
                </span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-[22px] xs:text-[24px] font-black text-[#15164B] leading-none">
                  {todayMinutes}
                </span>
                <span className="text-[12px] font-bold text-[#6B7094]">
                  / {dailyGoalMinutes} min
                </span>
              </div>
              <p className="text-[10.5px] text-[#6B7094] font-medium mt-1 truncate">
                {todayMinutes >= dailyGoalMinutes 
                  ? '🔥 Daily goal accomplished!' 
                  : `${dailyGoalMinutes - todayMinutes}m remaining today`}
              </p>
            </div>

            {/* Fluency Index Card */}
            <div className="bg-white/80 backdrop-blur-xs p-3 rounded-2xl border border-[#ECEEFE] shadow-xs text-right">
              <span className="text-[10px] font-bold text-[#6B7094] uppercase tracking-wider block">
                Fluency Index
              </span>
              <span className="text-[22px] xs:text-[24px] font-black text-[#2563EB] block leading-none mt-1">
                {fluencyIndex}%
              </span>
              <span className="text-[10.5px] font-semibold text-[#545CA6] block mt-1 truncate">
                Communicative Fluency
              </span>
            </div>
          </div>

          {/* Goal Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10.5px] xs:text-[11px] font-bold text-[#52577F]">
              <span>Goal Completion</span>
              <span className="text-[#15164B] font-extrabold">{goalPercent}%</span>
            </div>
            <div className="w-full h-2.5 bg-[#E8EBFA] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#545CA6] to-[#10B981] rounded-full transition-all duration-500"
                style={{ width: `${goalPercent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. CEFR Curriculum Track & Next Milestone */}
      <section 
        aria-label="CEFR Curriculum Progress" 
        className="p-4 sm:p-5 rounded-3xl bg-white border border-[#ECEEFE] shadow-xs space-y-3.5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
              <Award className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <h2 className="text-[15px] font-black text-[#15164B]">
                CEFR Curriculum Pathway
              </h2>
              <p className="text-[11px] font-medium text-[#6B7094]">
                Structured CEFR Progression ({completedLessonsCount} of {totalLessonsInCurriculum} lessons completed)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAchievementsModalOpen(true)}
              className="text-[11.5px] font-bold text-[#4F46E5] hover:underline cursor-pointer flex items-center gap-0.5"
              aria-label="View CEFR Certificates and Badges"
            >
              <span>Certificates</span>
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
            <span className="text-[12px] font-black text-[#4F46E5] bg-[#EEF2FF] px-2 py-0.5 rounded-lg">
              {curriculumPercent}%
            </span>
          </div>
        </div>

        <div className="w-full h-2 bg-[#F0F2FD] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#4F46E5] rounded-full transition-all duration-300"
            style={{ width: `${curriculumPercent}%` }}
          />
        </div>

        {/* Next Recommended Lesson CTA */}
        <div className="p-3.5 rounded-2xl bg-[#FAF9FE] border border-[#E0E3F5] flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-extrabold uppercase text-[#545CA6] tracking-wider block">
              Up Next in Curriculum:
            </span>
            <p className="text-[12.5px] font-bold text-[#15164B] truncate">
              {nextLessonId === 'a1-u2-l3-daily-routines' ? 'Daily Routines & Time Expressions' : 'Conversational English'}
            </p>
          </div>
          {onContinueLesson && (
            <button
              type="button"
              onClick={() => onContinueLesson(nextLessonId)}
              className="px-3.5 py-1.5 rounded-full bg-[#15164B] text-white text-[11.5px] font-bold hover:bg-[#0E1038] transition-colors cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
            >
              <span>Resume</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </section>

      {/* 4. Skill Mastery Across Studios */}
      <section aria-label="Studio Skill Breakdown" className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-[15px] font-black text-[#15164B] tracking-tight">
            Skill Mastery Breakdown
          </h2>
          <span className="text-[11px] font-bold text-[#6B7094] uppercase tracking-wider">
            6 Specialized Studios
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {Object.entries(studioAverages).map(([key, data]) => {
            const Icon = data.icon;
            return (
              <div 
                key={key}
                className="p-3.5 rounded-2xl bg-white border border-[#ECEEFE] shadow-xs hover:border-[#CCD1F0] transition-all flex flex-col justify-between space-y-2.5 group"
              >
                <div className="flex items-center justify-between">
                  <div className={`w-8 h-8 rounded-xl ${data.bg} ${data.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 stroke-[2.4]" />
                  </div>
                  <span className="text-[14px] font-black text-[#15164B]">
                    {data.score !== null ? `${data.score}%` : '—'}
                  </span>
                </div>

                <div>
                  <h3 className="text-[13px] font-black text-[#15164B] group-hover:text-[#545CA6] transition-colors">
                    {data.label}
                  </h3>
                  <p className="text-[10.5px] text-[#8E93B8] font-medium mt-0.5">
                    {data.count >= 2
                      ? `${data.count} sessions • ${data.status === 'strength' ? 'Strength' : data.status === 'proficient' ? 'Proficient' : 'Needs Focus'}`
                      : data.count === 1
                      ? '1 session (baseline in progress)'
                      : 'No sessions yet'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenStudio(key as PracticeCategoryKey)}
                  className="w-full py-1.5 rounded-xl bg-[#F6F7FE] group-hover:bg-[#ECEFFD] text-[#545CA6] text-[11px] font-extrabold transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Practice Studio</span>
                  <ChevronRight className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Adaptive Learning Intelligence & Personalized Plan Insights */}
      <section 
        aria-label="Adaptive Learning Intelligence" 
        className="p-4 sm:p-5 rounded-3xl bg-white border border-[#ECEEFE] shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
              <Sparkles className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <h2 className="text-[15px] font-black text-[#15164B]">
                Adaptive Learning Intelligence
              </h2>
              <p className="text-[11px] font-medium text-[#6B7094]">
                Offline diagnostic feedback & personalized daily plan adaptation
              </p>
            </div>
          </div>
          {adaptiveProfile?.performanceTrend && (
            <span className="px-2.5 py-1 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider bg-indigo-50 border border-indigo-100 text-[#4F46E5]">
              {adaptiveProfile.performanceTrend === 'improving' ? '📈 Improving' :
               adaptiveProfile.performanceTrend === 'declining' ? '🔄 Needs Support' :
               adaptiveProfile.performanceTrend === 'steady' ? '⚖️ Steady' : '🌱 Baseline'}
            </span>
          )}
        </div>

        {/* Strengths & Weaknesses Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Strongest Area */}
          <div className="p-3.5 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-[#166534] tracking-wider">
                Strongest Skill
              </span>
              {adaptiveProfile?.strongestArea && (
                <span className="text-[12px] font-black text-[#166534]">
                  {adaptiveProfile.strongestArea.score}% Accuracy
                </span>
              )}
            </div>
            <h3 className="text-[13.5px] font-bold text-[#14532D]">
              {adaptiveProfile?.strongestArea ? adaptiveProfile.strongestArea.label : 'Establishing Diagnostic Baseline'}
            </h3>
            <p className="text-[11px] text-[#166534] leading-relaxed">
              {adaptiveProfile?.strongestArea
                ? `Consistently high accuracy. Demonstrating reliable mastery and fluid responses in ${adaptiveProfile.strongestArea.label}.`
                : 'Complete at least 2 practice sessions across any category to identify your strongest skill.'}
            </p>
          </div>

          {/* Improvement Focus */}
          <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FEF3C7] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-[#92400E] tracking-wider">
                Improvement Opportunity
              </span>
              {adaptiveProfile?.weakestArea && (
                <span className="text-[12px] font-black text-[#92400E]">
                  {adaptiveProfile.weakestArea.score}% Accuracy
                </span>
              )}
            </div>
            <h3 className="text-[13.5px] font-bold text-[#78350F]">
              {adaptiveProfile?.weakestArea ? adaptiveProfile.weakestArea.label : 'No Critical Weaknesses Detected'}
            </h3>
            <p className="text-[11px] text-[#92400E] leading-relaxed">
              {adaptiveProfile?.weakestArea
                ? `Targeted drills recommended to close accuracy gaps in ${adaptiveProfile.weakestArea.label}.`
                : 'Balanced accuracy across evaluated skills. Keep practicing to maintain conversational rhythm.'}
            </p>
            {adaptiveProfile?.weakestArea && (
              <button
                type="button"
                onClick={() => onOpenStudio(adaptiveProfile.weakestArea!.category)}
                className="mt-1 text-[11px] font-bold text-[#B45309] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Practice {adaptiveProfile.weakestArea.label}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* How Study Plan Responds */}
        {dailyPlan && (
          <div className="p-3.5 rounded-2xl bg-[#FAF9FE] border border-[#ECEEFE] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#15164B]">
                How Today's Study Plan Adapts to Your Progress
              </span>
              <span className="text-[10.5px] text-[#6B7094]">
                ~{dailyPlan.estimatedTotalMinutes} min budget
              </span>
            </div>
            <ul className="space-y-1 text-[11.5px] text-[#52577F]">
              <li className="flex items-start gap-1.5">
                <span className="text-[#4F46E5] font-bold">•</span>
                <span><strong>FSRS Spaced Repetition:</strong> {adaptiveProfile?.dueVocabCards ? `${adaptiveProfile.dueVocabCards} flashcards prioritized for review today.` : 'All vocabulary caught up.'}</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#4F46E5] font-bold">•</span>
                <span><strong>Curriculum Pathway:</strong> Linear advancement in CEFR {adaptiveProfile?.currentLevel || 'A1'}.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#4F46E5] font-bold">•</span>
                <span><strong>Adaptive Focus:</strong> {adaptiveProfile?.weakestArea ? `Prioritizing targeted drills in ${adaptiveProfile.weakestArea.label}.` : 'Balanced authentic scenario roleplay scheduled.'}</span>
              </li>
            </ul>
          </div>
        )}
      </section>

      {/* 5. Memory & FSRS Vocabulary Retention Overview */}
      {vocabStats && (
        <section 
          aria-label="Vocabulary Retention & Memory Curve"
          className="p-4 sm:p-5 rounded-3xl bg-white border border-[#ECEEFE] shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 stroke-[2.4]" />
              </div>
              <div>
                <h2 className="text-[15px] font-black text-[#15164B]">
                  FSRS Spaced-Repetition Retention
                </h2>
                <p className="text-[11px] font-medium text-[#6B7094]">
                  Long-term memory stability and recall forecast
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onNavigateToPractice}
              className="text-[11.5px] font-bold text-[#059669] hover:underline cursor-pointer"
            >
              Open Notebook
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1 text-center">
            <div className="p-2 rounded-xl bg-[#FAF9FE] border border-[#ECEEFE] flex flex-col items-center justify-center min-h-[52px]">
              <span className="text-[15px] font-black text-[#15164B] leading-none">{vocabStats.totalCards}</span>
              <span className="text-[8.5px] font-bold text-[#8E93B8] uppercase tracking-tighter leading-tight mt-1 text-center">Total Words</span>
            </div>
            <div className="p-2 rounded-xl bg-[#FAF9FE] border border-[#ECEEFE] flex flex-col items-center justify-center min-h-[52px]">
              <span className={`text-[15px] font-black leading-none ${vocabStats.dueCards > 0 ? 'text-[#DC2626]' : 'text-[#059669]'}`}>
                {vocabStats.dueCards}
              </span>
              <span className="text-[8.5px] font-bold text-[#8E93B8] uppercase tracking-tighter leading-tight mt-1 text-center">Due Review</span>
            </div>
            <div className="p-2 rounded-xl bg-[#FAF9FE] border border-[#ECEEFE] flex flex-col items-center justify-center min-h-[52px]">
              <span className="text-[15px] font-black text-[#D97706] leading-none">{vocabStats.learningCards + vocabStats.newCards}</span>
              <span className="text-[8.5px] font-bold text-[#8E93B8] uppercase tracking-tighter leading-tight mt-1 text-center">Learning</span>
            </div>
            <div className="p-2 rounded-xl bg-[#FAF9FE] border border-[#ECEEFE] flex flex-col items-center justify-center min-h-[52px]">
              <span className="text-[15px] font-black text-[#2563EB] leading-none">{vocabStats.reviewCards}</span>
              <span className="text-[8.5px] font-bold text-[#8E93B8] uppercase tracking-tighter leading-tight mt-1 text-center">Mastered</span>
            </div>
          </div>
        </section>
      )}

      {/* 6. AI Diagnostic Error Pattern Tracker */}
      <section aria-label="AI Diagnostics & Friction Points" className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[15px] font-black text-[#15164B] tracking-tight">
              AI Error Pattern Diagnostics
            </h2>
            <span className="text-[10px] font-black uppercase tracking-wider bg-[#EFF6FF] text-[#2563EB] px-2 py-0.5 rounded-full border border-[#BFDBFE]">
              Targeted Focus
            </span>
          </div>
          <span className="text-[11px] font-medium text-[#6B7094]">
            Continuous Analysis
          </span>
        </div>

        <div className="space-y-2">
          {/* Pattern 1 */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#ECEEFE] flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[12.5px] font-bold text-[#15164B] truncate">
                  Prepositions of Time (<code className="text-[#DC2626]">at / in / on</code>)
                </h3>
                <p className="text-[11px] text-[#6B7094] truncate">
                  Accuracy: 74% • Tends to confuse "at night" with "in night"
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenStudio('grammar')}
              className="px-3 py-1 rounded-full bg-[#FFFBEB] text-[#D97706] hover:bg-[#FDE68A] text-[11px] font-extrabold cursor-pointer shrink-0 transition-colors"
            >
              Fix in Grammar
            </button>
          </div>

          {/* Pattern 2 */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#ECEEFE] flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[12.5px] font-bold text-[#15164B] truncate">
                  Past Simple vs Continuous Transitions
                </h3>
                <p className="text-[11px] text-[#6B7094] truncate">
                  Accuracy: 84% • Consistent structure, needs practice on background clauses
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenStudio('conversation')}
              className="px-3 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE] text-[11px] font-extrabold cursor-pointer shrink-0 transition-colors"
            >
              Talk with AI
            </button>
          </div>

          {/* Pattern 3 */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#ECEEFE] flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[12.5px] font-bold text-[#15164B] truncate">
                  Article Precision (<code className="text-[#059669]">a / an / the / zero</code>)
                </h3>
                <p className="text-[11px] text-[#6B7094] truncate">
                  Accuracy: 92% • Strong mastery across singular and uncountable nouns
                </p>
              </div>
            </div>
            <span className="text-[11px] font-extrabold text-[#059669] px-2 py-0.5 rounded-full bg-[#ECFDF5]">
              Mastered
            </span>
          </div>
        </div>
      </section>

      {/* 7. Recent Practice Sessions Log */}
      <section aria-label="Recent Practice History" className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[15px] font-black text-[#15164B] tracking-tight">
              Recent Practice History
            </h2>
            <BarChart2 className="w-4 h-4 text-[#545CA6]" />
          </div>
          <span className="text-[11px] font-bold text-[#6B7094]">
            {sessions.length} Recorded Sessions
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="p-6 rounded-3xl bg-white border border-[#ECEEFE] text-center space-y-2 shadow-xs">
            <Calendar className="w-8 h-8 text-[#8E93B8] mx-auto stroke-[1.5]" />
            <p className="text-[13px] font-bold text-[#15164B]">
              No practice sessions recorded yet
            </p>
            <p className="text-[11.5px] text-[#6B7094] max-w-[260px] mx-auto">
              Complete a session in Conversation, Stories, Grammar, or Interview to start logging your history.
            </p>
            <button
              type="button"
              onClick={() => onOpenStudio('conversation')}
              className="mt-2 inline-flex px-4 py-1.5 rounded-full bg-[#15164B] text-white text-[11.5px] font-bold cursor-pointer"
            >
              Start First Session
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 5).map((s) => (
              <div 
                key={s.id}
                className="p-3 rounded-2xl bg-white border border-[#ECEEFE] flex items-center justify-between shadow-xs text-[12px]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#545CA6]" />
                  <div>
                    <span className="font-extrabold text-[#15164B] capitalize">
                      {s.category} Practice
                    </span>
                    <span className="text-[10.5px] text-[#8E93B8] ml-2">
                      {new Date(s.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {s.durationMinutes} min • {s.difficulty}
                    </span>
                  </div>
                </div>

                {s.score !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                    {s.score}%
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 8. Personalized Next-Step Action Plan */}
      <section 
        aria-label="Personalized Action Plan"
        className="p-5 rounded-3xl bg-gradient-to-br from-[#FAF9FE] to-[#F0F2FD] border border-[#D5D8EE] space-y-3"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#545CA6]" />
          <h2 className="text-[14px] font-black text-[#15164B]">
            Recommended Learning Next Steps
          </h2>
        </div>

        <ul className="space-y-2 text-[12px]">
          <li className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#ECEEFE]">
            <span className="font-medium text-[#15164B]">
              1. Review {vocabStats?.dueCards || 0} due cards in your FSRS memory deck
            </span>
            <button
              type="button"
              onClick={onNavigateToPractice}
              className="text-[#545CA6] font-bold hover:underline cursor-pointer"
            >
              Review
            </button>
          </li>
          <li className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#ECEEFE]">
            <span className="font-medium text-[#15164B]">
              2. Tackle prepositions in Grammar Studio to improve 74% accuracy
            </span>
            <button
              type="button"
              onClick={() => onOpenStudio('grammar')}
              className="text-[#545CA6] font-bold hover:underline cursor-pointer"
            >
              Start
            </button>
          </li>
          <li className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#ECEEFE]">
            <span className="font-medium text-[#15164B]">
              3. Practice STAR structured answering for your next job interview
            </span>
            <button
              type="button"
              onClick={() => onOpenStudio('interview')}
              className="text-[#545CA6] font-bold hover:underline cursor-pointer"
            >
              Practice
            </button>
          </li>
        </ul>
      </section>

      {/* 9. Interactive Achievements & Offline Backup Dialog */}
      <AchievementsModal
        isOpen={isAchievementsModalOpen}
        onClose={() => setIsAchievementsModalOpen(false)}
        userId={userId}
        summary={achievementsSummary}
        onRefresh={loadProgressData}
      />
    </div>
  );
};
