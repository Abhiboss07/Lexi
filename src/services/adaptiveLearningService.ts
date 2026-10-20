import { db } from '../db';
import { practiceRepository } from '../db/practiceRepository';
import { curriculumRepository } from '../db/curriculumRepository';
import { vocabularyRepository } from '../db/vocabularyRepository';
import { quickPicksRepository } from '../db/quickPicksRepository';
import { calculateCurriculumSummary } from './curriculumProgressionService';
import { getLocalDateString, getDateSeed } from './dailyPracticeService';
import { SCENARIO_DEFINITIONS } from '../data/scenariosData';
import type { PracticeCategoryKey } from '../components/practice/PracticeCategoryNav';
import type { UserProfile } from '../types';
import type { ReviewLogRecord } from '../types/vocabulary';
import type {
  AdaptiveLearnerProfile,
  DailyStudyPlanRecord,
  DailyStudyPlanItem,
  SkillPerformanceDiagnostic,
  SkillDiagnosticStatus,
} from '../types/adaptivePlan';

export const SKILL_LABELS: Record<PracticeCategoryKey, string> = {
  conversation: 'Conversation & Speaking',
  stories: 'Stories & Reading',
  vocabulary: 'Vocabulary & Idioms',
  grammar: 'Grammar & Syntax',
  listening: 'Listening & Audio',
  interview: 'Interview & Career',
};

export interface IAdaptiveStorage {
  getUser(userId: string): Promise<UserProfile | undefined>;
  getReviewLogs(userId: string): Promise<ReviewLogRecord[]>;
  getDailyStudyPlan(planId: string): Promise<DailyStudyPlanRecord | undefined>;
  saveDailyStudyPlan(plan: DailyStudyPlanRecord): Promise<void>;
}

export class DexieAdaptiveStorage implements IAdaptiveStorage {
  async getUser(userId: string): Promise<UserProfile | undefined> {
    try {
      return await db.users.get(userId);
    } catch {
      return undefined;
    }
  }

  async getReviewLogs(userId: string): Promise<ReviewLogRecord[]> {
    try {
      return await db.reviewLogs.where('userId').equals(userId).toArray();
    } catch {
      return [];
    }
  }

  async getDailyStudyPlan(planId: string): Promise<DailyStudyPlanRecord | undefined> {
    try {
      return await db.dailyStudyPlans.get(planId);
    } catch {
      return undefined;
    }
  }

  async saveDailyStudyPlan(plan: DailyStudyPlanRecord): Promise<void> {
    try {
      await db.dailyStudyPlans.put(plan);
    } catch (e) {
      console.warn('Failed to save daily study plan to Dexie:', e);
    }
  }
}

export class InMemoryAdaptiveStorage implements IAdaptiveStorage {
  users = new Map<string, UserProfile>();
  reviewLogs = new Map<string, ReviewLogRecord[]>();
  plans = new Map<string, DailyStudyPlanRecord>();

  async getUser(userId: string): Promise<UserProfile | undefined> {
    return this.users.get(userId);
  }

  async getReviewLogs(userId: string): Promise<ReviewLogRecord[]> {
    return this.reviewLogs.get(userId) || [];
  }

  async getDailyStudyPlan(planId: string): Promise<DailyStudyPlanRecord | undefined> {
    return this.plans.get(planId);
  }

  async saveDailyStudyPlan(plan: DailyStudyPlanRecord): Promise<void> {
    this.plans.set(plan.id, plan);
  }
}

export class AdaptiveLearningService {
  constructor(
    private practiceRepo: any = practiceRepository,
    private curriculumRepo: any = curriculumRepository,
    private vocabRepo: any = vocabularyRepository,
    private quickPicksRepo: any = quickPicksRepository,
    private storage: IAdaptiveStorage = new DexieAdaptiveStorage(),
  ) {}

  /**
   * Derives a comprehensive, offline-first Adaptive Learner Profile from real persisted records.
   * Gracefully handles new learners, empty records, and strictly distinguishes insufficient evidence from low scores.
   */
  async buildAdaptiveProfile(userId: string = 'local-learner-1'): Promise<AdaptiveLearnerProfile> {
    const today = getLocalDateString();

    const [
      user,
      preferences,
      curriculumProgress,
      vocabStats,
      dueCards,
      allSessions,
      todayMinutes,
      _activityCompletions,
      reviewLogs,
    ] = await Promise.all([
      this.storage.getUser(userId),
      this.practiceRepo.getPreferences(userId),
      this.curriculumRepo.getLearnerProgress(userId),
      this.vocabRepo.getStats(userId),
      this.vocabRepo.getDueCards(userId),
      this.practiceRepo.getSessions(userId, 50),
      this.practiceRepo.getTodayPracticeMinutes(userId),
      this.quickPicksRepo.getAllActivityCompletions(userId),
      this.storage.getReviewLogs(userId),
    ]);

    const currentLevel = preferences.cefrLevel || curriculumProgress.currentLevel || 'A2';
    const curriculumSummary = calculateCurriculumSummary(curriculumProgress, currentLevel);

    // Overdue vocabulary cards (due date strictly before today)
    const overdueVocabCards = dueCards.filter((c: any) => {
      if (!c.due) return false;
      const dueDate = typeof c.due === 'string' ? c.due.split('T')[0] : '';
      return dueDate < today;
    }).length;

    // Review logs for retention calculation
    let retentionRate: number | null = null;
    if (reviewLogs.length >= 3) {
      const successfulReviews = reviewLogs.filter((r) => r.rating >= 3).length;
      retentionRate = Math.round((successfulReviews / reviewLogs.length) * 100);
    }

    // Average score across recorded curriculum lessons
    const lessonScores = Object.values(curriculumProgress.lessonRecords || {})
      .map((r: any) => r.score)
      .filter((s): s is number => typeof s === 'number' && !isNaN(s));
    const averageLessonScore = lessonScores.length > 0
      ? Math.round(lessonScores.reduce((a, b) => a + b, 0) / lessonScores.length)
      : null;

    // Recent session accuracy and trends
    const scoredSessions = allSessions.filter(
      (s: any) => typeof s.score === 'number' && !isNaN(s.score)
    );
    const recentScored = scoredSessions.slice(0, 10);
    const recentAverageScore = recentScored.length > 0
      ? Math.round(recentScored.reduce((a: number, s: any) => a + (s.score || 0), 0) / recentScored.length)
      : null;

    let performanceTrend: 'improving' | 'steady' | 'declining' | 'baseline' = 'baseline';
    if (scoredSessions.length >= 4) {
      const recentWindow = scoredSessions.slice(0, 3);
      const prevWindow = scoredSessions.slice(3, 6);
      const recentAvg = recentWindow.reduce((a: number, s: any) => a + (s.score || 0), 0) / recentWindow.length;
      const prevAvg = prevWindow.reduce((a: number, s: any) => a + (s.score || 0), 0) / prevWindow.length;
      const diff = recentAvg - prevAvg;
      if (diff >= 5) {
        performanceTrend = 'improving';
      } else if (diff <= -5) {
        performanceTrend = 'declining';
      } else {
        performanceTrend = 'steady';
      }
    }

    // Scenario Simulation metrics
    const scenarioSessions = allSessions.filter(
      (s: any) => s.category === 'conversation' || s.activityId?.startsWith('scenario-') || s.notes?.includes('scenario')
    );
    const scenarioScores = scenarioSessions
      .map((s: any) => s.score)
      .filter((s: any): s is number => typeof s === 'number' && !isNaN(s));
    const scenarioAverageScore = scenarioScores.length > 0
      ? Math.round(scenarioScores.reduce((a: number, b: number) => a + b, 0) / scenarioScores.length)
      : null;

    // Per-skill diagnostics
    const categories: PracticeCategoryKey[] = [
      'conversation',
      'stories',
      'vocabulary',
      'grammar',
      'listening',
      'interview',
    ];

    const skills = {} as Record<PracticeCategoryKey, SkillPerformanceDiagnostic>;
    let strongestArea: { category: PracticeCategoryKey; label: string; score: number } | null = null;
    let weakestArea: { category: PracticeCategoryKey; label: string; score: number } | null = null;
    let maxScore = -1;
    let minScore = 101;
    let hasSufficientEvidence = false;

    for (const cat of categories) {
      const catSessions = allSessions.filter((s: any) => s.category === cat);
      const catScored = catSessions.filter(
        (s: any) => typeof s.score === 'number' && !isNaN(s.score)
      );
      const sessionCount = catScored.length;
      const lastSession = catSessions[0];

      let status: SkillDiagnosticStatus = 'insufficient_evidence';
      let score: number | null = null;
      let insight = 'Complete at least 2 sessions to establish a diagnostic baseline.';
      let trend: 'improving' | 'steady' | 'declining' | 'baseline' = 'baseline';

      if (sessionCount >= 2) {
        hasSufficientEvidence = true;
        score = Math.round(
          catScored.reduce((a: number, s: any) => a + (s.score || 0), 0) / catScored.length
        );

        if (score >= 85) {
          status = 'strength';
          insight = `Consistently high accuracy (${score}%). Strong command of ${SKILL_LABELS[cat]}.`;
          if (score > maxScore) {
            maxScore = score;
            strongestArea = { category: cat, label: SKILL_LABELS[cat], score };
          }
        } else if (score >= 70) {
          status = 'proficient';
          insight = `Solid foundation (${score}%). Steady progress in ${SKILL_LABELS[cat]}.`;
        } else {
          status = 'needs_reinforcement';
          insight = `Opportunity for growth (${score}%). Targeted reinforcement recommended.`;
          if (score < minScore) {
            minScore = score;
            weakestArea = { category: cat, label: SKILL_LABELS[cat], score };
          }
        }

        // Skill trend
        if (sessionCount >= 3) {
          const firstScore = catScored[catScored.length - 1].score || 0;
          const latestScore = catScored[0].score || 0;
          if (latestScore - firstScore >= 6) trend = 'improving';
          else if (latestScore - firstScore <= -6) trend = 'declining';
          else trend = 'steady';
        }
      } else if (sessionCount === 1) {
        score = catScored[0].score || null;
        insight = `Initial score recorded (${score}%). 1 more session needed for verification.`;
      }

      skills[cat] = {
        category: cat,
        label: SKILL_LABELS[cat],
        score,
        sessionCount,
        status,
        trend,
        lastPracticedAt: lastSession ? lastSession.completedAt : null,
        insight,
      };
    }

    // Consistency & returning learner detection
    const lastActiveDate = user?.lastActiveDate || today;
    const isReturningAfterBreak = this.isDateBeforeDays(lastActiveDate, today, 3);

    const currentStreak = user?.currentStreak ?? 0;
    const longestStreak = user?.longestStreak ?? 0;
    const dailyGoalMinutes = preferences.dailyGoalMinutes || 15;
    const dailyGoalPercent = Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100));

    return {
      userId,
      calculatedAt: new Date().toISOString(),
      currentLevel,
      preferredDifficulty: preferences.defaultDifficulty || 'medium',
      sessionLength: preferences.defaultSessionLength || 'standard',
      dailyGoalMinutes,
      totalVocabCards: vocabStats.totalCards,
      dueVocabCards: dueCards.length,
      overdueVocabCards,
      retentionRate,
      completedLessonsCount: curriculumSummary.completedLessonsCount,
      totalLessonsInLevel: curriculumSummary.totalLessonsInLevel,
      levelProgressPercent: curriculumSummary.levelProgressPercent,
      nextLesson: curriculumSummary.nextLesson,
      averageLessonScore,
      totalSessionsCount: allSessions.length,
      recentAverageScore,
      performanceTrend,
      scenariosCompletedCount: scenarioSessions.length,
      scenarioAverageScore,
      skills,
      strongestArea,
      weakestArea,
      hasSufficientEvidence,
      currentStreak,
      longestStreak,
      todayMinutes,
      dailyGoalPercent,
      isReturningAfterBreak,
    };
  }

  /**
   * Generates or reconciles today's personalized daily study plan.
   * Deterministic, transparent, respecting learner time budget and actual completions.
   */
  async getDailyStudyPlan(
    userId: string = 'local-learner-1',
    targetDate: Date = new Date()
  ): Promise<DailyStudyPlanRecord> {
    const dateStr = getLocalDateString(targetDate);
    const planId = `plan-${userId}-${dateStr}`;

    const profile = await this.buildAdaptiveProfile(userId);
    const existing = await this.storage.getDailyStudyPlan(planId);

    // If a plan already exists for today, reconcile it with latest activity progress
    if (existing) {
      return this.reconcilePlanWithProgress(existing, profile, dateStr);
    }

    // Build fresh daily plan
    return this.constructNewDailyPlan(profile, dateStr);
  }

  /**
   * Reconciles an existing daily plan with actual persisted completions without losing order or item IDs.
   */
  private async reconcilePlanWithProgress(
    plan: DailyStudyPlanRecord,
    profile: AdaptiveLearnerProfile,
    dateStr: string
  ): Promise<DailyStudyPlanRecord> {
    const allCompletions = await this.quickPicksRepo.getAllActivityCompletions(plan.userId);
    const todayCompletions = allCompletions.filter((c: any) => c.date === dateStr);
    const todaySessions = await this.practiceRepo.getSessions(plan.userId, 20);
    const todayCompletedSessions = todaySessions.filter((s: any) => s.completedAt.startsWith(dateStr));
    const curriculumProgress = await this.curriculumRepo.getLearnerProgress(plan.userId);

    let completedMinutes = 0;
    const updatedItems: DailyStudyPlanItem[] = plan.items.map((item) => {
      let isCompleted = item.isCompleted;
      let completedAt = item.completedAt;

      // 1. Vocabulary review item: completed if due cards is 0 AND a review was logged today
      if (item.type === 'vocabulary_review') {
        const hasSession = todayCompletedSessions.some((s: any) => s.category === 'vocabulary');
        const hasCompletion = todayCompletions.some((c: any) => c.activityId === 'vocabulary-review' || c.activityId === item.id);
        if (hasSession || hasCompletion || (item.isCompleted && profile.dueVocabCards === 0)) {
          isCompleted = true;
          completedAt = completedAt || new Date().toISOString();
        }
      }

      // 2. Curriculum lesson: completed if lessonId is in curriculum completedLessonIds
      if (item.type === 'curriculum_lesson') {
        if (curriculumProgress.completedLessonIds.includes(item.action.targetId)) {
          isCompleted = true;
          completedAt = completedAt || new Date().toISOString();
        }
      }

      // 3. Scenario roleplay: completed if scenario session recorded today
      if (item.type === 'scenario_roleplay') {
        const hasScenarioSession = todayCompletedSessions.some(
          (s: any) => s.activityId === item.action.targetId || s.activityId?.includes(item.action.targetId)
        );
        const hasCompletion = todayCompletions.some(
          (c: any) => c.activityId === item.action.targetId || c.activityId === item.id
        );
        if (hasScenarioSession || hasCompletion) {
          isCompleted = true;
          completedAt = completedAt || new Date().toISOString();
        }
      }

      // 4. Weakness reinforcement or studio
      if (item.type === 'weakness_reinforcement') {
        const hasStudioSession = todayCompletedSessions.some(
          (s: any) => s.category === item.category
        );
        const hasCompletion = todayCompletions.some((c: any) => c.activityId === item.id);
        if (hasStudioSession || hasCompletion) {
          isCompleted = true;
          completedAt = completedAt || new Date().toISOString();
        }
      }

      // 5. Daily challenge
      if (item.type === 'daily_challenge') {
        const hasCompletion = todayCompletions.some(
          (c: any) => c.activityId === 'daily-challenge' || c.activityId === item.id
        );
        if (hasCompletion) {
          isCompleted = true;
          completedAt = completedAt || new Date().toISOString();
        }
      }

      if (isCompleted) {
        completedMinutes += item.estimatedMinutes;
      }

      return {
        ...item,
        isCompleted,
        completedAt,
      };
    });

    const updatedPlan: DailyStudyPlanRecord = {
      ...plan,
      completedMinutes,
      updatedAt: new Date().toISOString(),
      items: updatedItems,
    };

    await this.storage.saveDailyStudyPlan(updatedPlan);
    return updatedPlan;
  }

  /**
   * Deterministically constructs a tailored daily plan based on the learner's profile and time budget.
   */
  private async constructNewDailyPlan(
    profile: AdaptiveLearnerProfile,
    dateStr: string
  ): Promise<DailyStudyPlanRecord> {
    const seed = getDateSeed(dateStr);
    const planId = `plan-${profile.userId}-${dateStr}`;
    const targetMinutes = profile.dailyGoalMinutes;

    const items: DailyStudyPlanItem[] = [];
    let order = 1;

    // RULE 1: Spaced Repetition Priority (Due vocabulary cards)
    if (profile.dueVocabCards > 0) {
      const estMin = Math.min(8, Math.max(3, Math.ceil(profile.dueVocabCards * 0.8)));
      items.push({
        id: `plan-item-vocab-${dateStr}`,
        order: order++,
        title: `Spaced Vocabulary Review (${profile.dueVocabCards} Due)`,
        subtitle: 'FSRS Spaced Repetition Memory Deck',
        type: 'vocabulary_review',
        category: 'vocabulary',
        estimatedMinutes: estMin,
        cefrLevel: profile.currentLevel,
        reason: `${profile.dueVocabCards} ${profile.dueVocabCards === 1 ? 'word is' : 'words are'} scheduled for review today to prevent memory decay.`,
        isPriority: true,
        isCompleted: false,
        action: {
          type: 'review',
          targetId: 'vocabulary',
          category: 'vocabulary',
        },
      });
    }

    // RULE 2: Linear Curriculum Progression (Next uncompleted lesson)
    if (profile.nextLesson) {
      const lessonEst = profile.nextLesson.estimatedMinutes || 6;
      items.push({
        id: `plan-item-lesson-${profile.nextLesson.id}`,
        order: order++,
        title: `Lesson ${profile.nextLesson.order}: ${profile.nextLesson.title}`,
        subtitle: `CEFR ${profile.currentLevel} • Structured Curriculum`,
        type: 'curriculum_lesson',
        category: 'conversation',
        estimatedMinutes: lessonEst,
        cefrLevel: profile.currentLevel,
        reason: `Advance your ${profile.currentLevel} progression. Focus on conversational fluency and natural syntax.`,
        isPriority: profile.dueVocabCards === 0,
        isCompleted: false,
        action: {
          type: 'lesson',
          targetId: profile.nextLesson.id,
          category: 'conversation',
        },
      });
    }

    // RULE 3: Weakness Reinforcement OR Scenario Challenge
    if (profile.weakestArea) {
      // Prioritize targeted practice for verified weak area
      items.push({
        id: `plan-item-weakness-${profile.weakestArea.category}-${dateStr}`,
        order: order++,
        title: `Targeted ${profile.weakestArea.label} Practice`,
        subtitle: `Skill Reinforcement • Recent Average: ${profile.weakestArea.score}%`,
        type: 'weakness_reinforcement',
        category: profile.weakestArea.category,
        estimatedMinutes: 5,
        cefrLevel: profile.currentLevel,
        reason: `Diagnosed as an improvement opportunity (${profile.weakestArea.score}% average). Targeted drills build automaticity.`,
        isPriority: false,
        isCompleted: false,
        action: {
          type: 'studio',
          targetId: profile.weakestArea.category,
          category: profile.weakestArea.category,
        },
      });
    } else {
      // Rotate an authentic scenario roleplay
      const scenarioList = Object.values(SCENARIO_DEFINITIONS);
      const scenario = scenarioList[seed % scenarioList.length];
      if (scenario) {
        items.push({
          id: `plan-item-scenario-${scenario.id}-${dateStr}`,
          order: order++,
          title: `${scenario.title} Roleplay`,
          subtitle: `Authentic Dialogue with ${scenario.partnerName}`,
          type: 'scenario_roleplay',
          category: 'conversation',
          estimatedMinutes: 5,
          cefrLevel: profile.currentLevel,
          reason: `Real-world dialogue simulation with immediate tone feedback and key phrase acquisition.`,
          isPriority: false,
          isCompleted: false,
          action: {
            type: 'scenario',
            targetId: scenario.id,
            category: 'conversation',
          },
        });
      }
    }

    // RULE 4: For standard (15m) or deep (30m) learners, add a complementary engagement item
    if (targetMinutes >= 15 && items.length < 3) {
      items.push({
        id: `plan-item-challenge-${dateStr}`,
        order: order++,
        title: "Today's Daily Challenge",
        subtitle: 'Bite-Sized Practical Application',
        type: 'daily_challenge',
        category: 'grammar',
        estimatedMinutes: 4,
        cefrLevel: profile.currentLevel,
        reason: 'Daily contextual challenge to solidify practical phrasing in under 5 minutes.',
        isPriority: false,
        isCompleted: false,
        action: {
          type: 'challenge',
          targetId: 'daily-challenge',
          category: 'grammar',
        },
      });
    }

    if (targetMinutes >= 30 && items.length < 4) {
      // Add a listening comprehension drill for deep practice
      items.push({
        id: `plan-item-listening-deep-${dateStr}`,
        order: order++,
        title: 'Listening & Voice Studio Drill',
        subtitle: 'Acoustic Clarity & Pronunciation Match',
        type: 'weakness_reinforcement',
        category: 'listening',
        estimatedMinutes: 7,
        cefrLevel: profile.currentLevel,
        reason: 'Deep session extra: train phonetic discrimination and shadow natural speech cadence.',
        isPriority: false,
        isCompleted: false,
        action: {
          type: 'studio',
          targetId: 'listening',
          category: 'listening',
        },
      });
    }

    // RULE 5: Trim or cap items to match learner's configured time budget
    let trimmedItems = items;
    if (targetMinutes <= 5 && items.length > 2) {
      // Keep only top 1-2 items (priority first)
      trimmedItems = items.slice(0, 2);
    } else if (targetMinutes <= 15 && items.length > 3) {
      trimmedItems = items.slice(0, 3);
    }

    const estimatedTotalMinutes = trimmedItems.reduce((acc, it) => acc + it.estimatedMinutes, 0);

    // Headline summaries and rationale
    let headlineSummary = `Today's Plan: ${trimmedItems.length} Focused Activities (~${estimatedTotalMinutes} min)`;
    let primaryReason = 'Balanced plan aligned with your daily goal and CEFR progression.';

    if (profile.isReturningAfterBreak) {
      headlineSummary = `Welcome back! Gentle Restart Plan (${estimatedTotalMinutes} min)`;
      primaryReason = 'Easing back in with high-yield review before tackling new complex concepts.';
    } else if (profile.dueVocabCards > 0 && profile.weakestArea) {
      headlineSummary = `Review & Focus: ${profile.dueVocabCards} Due Cards + ${profile.weakestArea.label}`;
      primaryReason = `Protecting memory retention with FSRS reviews and reinforcing ${profile.weakestArea.label}.`;
    } else if (profile.dueVocabCards > 0) {
      headlineSummary = `Memory Deck Priority: ${profile.dueVocabCards} Due Flashcards`;
      primaryReason = 'Clearing overdue reviews ensures durable long-term word recall.';
    } else if (profile.weakestArea) {
      headlineSummary = `Skill Reinforcement: ${profile.weakestArea.label}`;
      primaryReason = `Focusing on ${profile.weakestArea.label} to close measured accuracy gaps.`;
    }

    const planRecord: DailyStudyPlanRecord = {
      id: planId,
      userId: profile.userId,
      date: dateStr,
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetMinutes,
      estimatedTotalMinutes,
      completedMinutes: 0,
      headlineSummary,
      primaryReason,
      adaptationNotice: `Personalized for your ${profile.currentLevel} level and ${profile.preferredDifficulty.toUpperCase()} preference.`,
      items: trimmedItems,
    };

    // Reconcile in case user already completed activities today before opening plan
    const reconciled = await this.reconcilePlanWithProgress(planRecord, profile, dateStr);
    await this.storage.saveDailyStudyPlan(reconciled);
    return reconciled;
  }

  /**
   * Explicitly marks a daily plan item as completed.
   */
  async markItemComplete(userId: string, itemId: string): Promise<DailyStudyPlanRecord | null> {
    const today = getLocalDateString();
    const planId = `plan-${userId}-${today}`;
    const plan = await this.storage.getDailyStudyPlan(planId);
    if (!plan) return null;

    let completedMinutes = 0;
    const updatedItems = plan.items.map((it) => {
      if (it.id === itemId) {
        return {
          ...it,
          isCompleted: true,
          completedAt: new Date().toISOString(),
        };
      }
      if (it.isCompleted) {
        completedMinutes += it.estimatedMinutes;
      }
      return it;
    });

    // Add completion for this item
    const targetItem = plan.items.find((it) => it.id === itemId);
    if (targetItem && !targetItem.isCompleted) {
      completedMinutes += targetItem.estimatedMinutes;
      await this.quickPicksRepo.recordActivityCompletion({
        id: `comp-${userId}-${itemId}-${today}`,
        userId,
        activityId: itemId,
        date: today,
        completedAt: new Date().toISOString(),
      });
    }

    const updatedPlan: DailyStudyPlanRecord = {
      ...plan,
      completedMinutes,
      updatedAt: new Date().toISOString(),
      items: updatedItems,
    };

    await this.storage.saveDailyStudyPlan(updatedPlan);
    return updatedPlan;
  }

  /**
   * Recalculates today's plan while strictly preserving completed activities.
   */
  async recalculatePlan(userId: string = 'local-learner-1'): Promise<DailyStudyPlanRecord> {
    const today = getLocalDateString();
    const planId = `plan-${userId}-${today}`;
    const existing = await this.storage.getDailyStudyPlan(planId);
    const profile = await this.buildAdaptiveProfile(userId);

    const freshPlan = await this.constructNewDailyPlan(profile, today);

    // If previous plan had completed items, carry over their completed state
    if (existing) {
      const completedMap = new Map<string, string | undefined>();
      existing.items.forEach((it) => {
        if (it.isCompleted) {
          completedMap.set(it.id, it.completedAt);
          completedMap.set(it.type, it.completedAt);
          completedMap.set(it.action.targetId, it.completedAt);
        }
      });

      let completedMinutes = 0;
      freshPlan.items = freshPlan.items.map((it) => {
        const matchingCompletion =
          completedMap.get(it.id) ||
          completedMap.get(it.type) ||
          completedMap.get(it.action.targetId);
        if (matchingCompletion) {
          completedMinutes += it.estimatedMinutes;
          return {
            ...it,
            isCompleted: true,
            completedAt: matchingCompletion,
          };
        }
        return it;
      });
      freshPlan.completedMinutes = completedMinutes;
    }

    await this.storage.saveDailyStudyPlan(freshPlan);
    return freshPlan;
  }

  private isDateBeforeDays(earlierDateStr: string, laterDateStr: string, daysThreshold: number): boolean {
    const earlier = new Date(earlierDateStr).getTime();
    const later = new Date(laterDateStr).getTime();
    const diffDays = (later - earlier) / (1000 * 60 * 60 * 24);
    return diffDays >= daysThreshold;
  }
}

export const adaptiveLearningService = new AdaptiveLearningService();
