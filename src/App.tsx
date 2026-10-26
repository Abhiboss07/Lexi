import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { getAssetPath } from './utils/assetPath';
import { LexiHeader } from './components/home/LexiHeader';
import { HeroCard } from './components/home/HeroCard';
import { CategoryShortcuts } from './components/home/CategoryShortcuts';
import { FeaturedBanner } from './components/home/FeaturedBanner';
import { QuickPicks } from './components/home/QuickPicks';
import { BottomNav } from './components/common/BottomNav';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { preloadLearningModals } from './utils/preloadChunks';
import { ContinueLearningCard } from './components/home/ContinueLearningCard';
import { WordOfTheDayCard } from './components/home/WordOfTheDayCard';
import { DailyPracticeRow, DailyPracticeOption } from './components/home/DailyPracticeRow';
import { ExploreScreen } from './components/explore/ExploreScreen';
import { 
  LEARNING_SHORTCUTS, 
  FEATURED_CAFE_ACTIVITY, 
  QUICK_PICKS 
} from './data/homeData';
import { PracticeScreen } from './components/practice/PracticeScreen';
import { getCurriculumLesson } from './data/curriculum';
import { getMappedLessonForActivity } from './data/lessonMapping';
import { getOrCreateUserProfile, incrementUserStreak } from './db';
import type { CurriculumLesson } from './types/curriculum';
import type { VocabularyCardRecord } from './types/vocabulary';
import type { NavigationTab, LearningShortcut, QuickPickItem, FeaturedActivity, UserProfile } from './types';
import type { PracticeCategoryKey } from './components/practice/PracticeModals';
import { ProgressDashboardScreen } from './components/progress';
import { vocabularyRepository } from './db/vocabularyRepository';
import { dailyPracticeService } from './services/dailyPracticeService';
import type { ActivityHubKey } from './components/quickpicks/ExploreActivitiesHub';
import { SplashScreen } from './components/common/SplashScreen';
import { NotificationToast } from './components/notifications/NotificationToast';
import { notificationService } from './services/notificationService';
import { systemNotificationService } from './services/systemNotificationService';
import type { SmartNotification } from './types/notifications';
import { curriculumProgressionService, type CurriculumDisplaySummary } from './services/curriculumProgressionService';
import { curriculumRepository } from './db/curriculumRepository';
import type { CurriculumProgressionState } from './types/curriculum';
import type { CurriculumSearchResult } from './services/curriculumSearchService';
import { scenarioSimulationService } from './services/scenarioSimulationService';
import { TodaysLearningPlan } from './components/home/TodaysLearningPlan';
import type { DailyStudyPlanItem } from './types/adaptivePlan';

import { CurriculumBrowserModal } from './components/modals/CurriculumBrowserModal';

// Code-split dynamic modals and secondary studios
const ActivityModal = lazy(() => import('./components/modals/ActivityModal').then(m => ({ default: m.ActivityModal })));
const SearchModal = lazy(() => import('./components/modals/SearchModal').then(m => ({ default: m.SearchModal })));
const LessonPlayer = lazy(() => import('./components/lesson/LessonPlayer').then(m => ({ default: m.LessonPlayer })));
const ReviewPlayer = lazy(() => import('./components/vocabulary/ReviewPlayer').then(m => ({ default: m.ReviewPlayer })));
const PracticeModal = lazy(() => import('./components/practice/PracticeModals').then(m => ({ default: m.PracticeModal })));
const QuickNotesModal = lazy(() => import('./components/quickpicks/QuickNotesModal').then(m => ({ default: m.QuickNotesModal })));
const WordQuestModal = lazy(() => import('./components/quickpicks/WordQuestModal').then(m => ({ default: m.WordQuestModal })));
const SketchExplainModal = lazy(() => import('./components/quickpicks/SketchExplainModal').then(m => ({ default: m.SketchExplainModal })));
const DailyChallengeModal = lazy(() => import('./components/quickpicks/DailyChallengeModal').then(m => ({ default: m.DailyChallengeModal })));
const PracticePreferencesModal = lazy(() => import('./components/practice/PracticePreferencesModal').then(m => ({ default: m.PracticePreferencesModal })));
const ExploreActivitiesHub = lazy(() => import('./components/quickpicks/ExploreActivitiesHub').then(m => ({ default: m.ExploreActivitiesHub })));
const PhraseBuilderModal = lazy(() => import('./components/quickpicks/hub/PhraseBuilderModal').then(m => ({ default: m.PhraseBuilderModal })));
const MiniGrammarGamesModal = lazy(() => import('./components/quickpicks/hub/MiniGrammarGamesModal').then(m => ({ default: m.MiniGrammarGamesModal })));
const ScenarioChallengeModal = lazy(() => import('./components/quickpicks/hub/ScenarioChallengeModal').then(m => ({ default: m.ScenarioChallengeModal })));
const IdiomOfTheDayModal = lazy(() => import('./components/quickpicks/hub/IdiomOfTheDayModal').then(m => ({ default: m.IdiomOfTheDayModal })));
const DailyWordPuzzleModal = lazy(() => import('./components/quickpicks/hub/DailyWordPuzzleModal').then(m => ({ default: m.DailyWordPuzzleModal })));
const DescribeAndDrawModal = lazy(() => import('./components/quickpicks/hub/DescribeAndDrawModal').then(m => ({ default: m.DescribeAndDrawModal })));
const ShortListeningQuizModal = lazy(() => import('./components/quickpicks/hub/ShortListeningQuizModal').then(m => ({ default: m.ShortListeningQuizModal })));
const SpeakingPromptModal = lazy(() => import('./components/quickpicks/hub/SpeakingPromptModal').then(m => ({ default: m.SpeakingPromptModal })));
const InterviewSprintModal = lazy(() => import('./components/quickpicks/hub/InterviewSprintModal').then(m => ({ default: m.InterviewSprintModal })));
const InteractiveScenarioModal = lazy(() => import('./components/modals/InteractiveScenarioModal').then(m => ({ default: m.InteractiveScenarioModal })));

export function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<NavigationTab>('Home');
  const [searchOpen, setSearchOpen] = useState(false);
  const [wordHighlighted, setWordHighlighted] = useState(false);
  const [activeLesson, setActiveLesson] = useState<CurriculumLesson | null>(null);
  const [reviewCards, setReviewCards] = useState<VocabularyCardRecord[] | null>(null);
  const [activePracticeStudio, setActivePracticeStudio] = useState<PracticeCategoryKey | null>(null);
  const [activeQuickPickModal, setActiveQuickPickModal] = useState<'quest' | 'notes' | 'sketch' | 'challenge' | null>(null);
  const [isActivityHubOpen, setIsActivityHubOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isCurriculumBrowserOpen, setIsCurriculumBrowserOpen] = useState(false);
  const [curriculumSummary, setCurriculumSummary] = useState<CurriculumDisplaySummary | null>(null);
  const [curriculumProgressState, setCurriculumProgressState] = useState<CurriculumProgressionState | null>(null);
  const [activeHubActivity, setActiveHubActivity] = useState<ActivityHubKey | null>(null);
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem('lexi_splash_shown');
  });
  const [activeNotification, setActiveNotification] = useState<SmartNotification | null>(null);

  // Active activity modal state
  const [activeModal, setActiveModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    description: string;
    category?: string;
    mappedLessonId?: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
  });
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  // Load user profile and streak from IndexedDB (Dexie)
  useEffect(() => {
    getOrCreateUserProfile().then((u) => {
      setUser(u);
    });
    // Idle preloading for offline reliability & smooth instant modal transitions
    preloadLearningModals();
  }, []);

  // Real curriculum progression loader
  const refreshCurriculum = useCallback(async () => {
    try {
      const progress = await curriculumRepository.getLearnerProgress(user?.id || 'local-learner-1');
      setCurriculumProgressState(progress);
      const summary = await curriculumProgressionService.getSummary(user?.id || 'local-learner-1', user?.cefrLevel);
      setCurriculumSummary(summary);
    } catch (err) {
      console.warn('Failed to refresh curriculum progression:', err);
    }
  }, [user?.id, user?.cefrLevel]);

  useEffect(() => {
    refreshCurriculum();
  }, [refreshCurriculum]);

  // Context-aware smart notification checking
  const checkNotifications = useCallback(async () => {
    try {
      const notif = await notificationService.getNextNotification(user?.id || 'local-learner-1');
      if (notif) {
        setActiveNotification(notif);
        await notificationService.recordShown(notif, user?.id || 'local-learner-1');
        // Dispatch system notification if granted
        systemNotificationService.sendNotification(notif.title, { body: notif.message });
      }
    } catch (err) {
      console.warn('Failed to evaluate smart notifications:', err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!showSplash) {
      checkNotifications();
    }
  }, [showSplash, activeTab, checkNotifications]);

  const handleNotificationAction = async (notif: SmartNotification) => {
    await notificationService.recordClicked(notif, user?.id || 'local-learner-1');
    setActiveNotification(null);

    const dest = notif.destination;
    if (dest.tab) {
      setActiveTab(dest.tab);
    }
    if (dest.startReview) {
      setActiveTab('Practice');
      const dueCards = await vocabularyRepository.getDueCards(user?.id || 'local-learner-1');
      if (dueCards.length > 0) {
        setReviewCards(dueCards);
      }
    }
    if (dest.studio) {
      setActivePracticeStudio(dest.studio);
    }
    if (dest.quickPickModal) {
      setActiveQuickPickModal(dest.quickPickModal);
    }
    if (dest.hubActivity) {
      setActiveHubActivity(dest.hubActivity);
    }
  };

  const handleNotificationDismiss = async (notif: SmartNotification) => {
    await notificationService.recordDismissed(notif, user?.id || 'local-learner-1');
    setActiveNotification(null);
  };

  const isAnyModalOpen = Boolean(
    activeLesson ||
    reviewCards ||
    activePracticeStudio ||
    activeQuickPickModal ||
    isActivityHubOpen ||
    isPreferencesOpen ||
    isCurriculumBrowserOpen ||
    activeHubActivity ||
    activeModal.isOpen ||
    Boolean(activeScenarioId) ||
    searchOpen
  );

  const handleStartLearning = () => {
    setActiveModal({
      isOpen: true,
      title: 'Daily Conversational English',
      subtitle: 'Lesson 1 • Real-World Greetings',
      category: 'Recommended For You',
      mappedLessonId: 'a1-u1-l1-hello',
      description: 'Start your daily learning session by mastering polite conversational greetings in casual and professional contexts.',
    });
  };

  const handleSelectShortcut = (shortcut: LearningShortcut) => {
    if (shortcut.id === 'conversation') {
      setActivePracticeStudio('conversation');
      return;
    }
    if (shortcut.id === 'stories') {
      setActivePracticeStudio('stories');
      return;
    }
    if (shortcut.id === 'vocabulary') {
      setActiveTab('Practice');
      return;
    }
    if (shortcut.id === 'grammar') {
      setActivePracticeStudio('grammar');
      return;
    }
    if (shortcut.id === 'listening') {
      setActivePracticeStudio('listening');
      return;
    }

    setActiveModal({
      isOpen: true,
      title: `${shortcut.title} Practice`,
      subtitle: `Module: ${shortcut.title} Essentials`,
      category: shortcut.title,
      description: shortcut.description,
    });
  };

  const handleLaunchFeatured = (activity: FeaturedActivity) => {
    if (scenarioSimulationService.getScenarioById(activity.id)) {
      setActiveScenarioId(activity.id);
      return;
    }
    const mapped = getMappedLessonForActivity(activity.id);
    setActiveModal({
      isOpen: true,
      title: activity.title,
      subtitle: `${activity.durationText} • ${activity.difficultyText}`,
      category: activity.eyebrow,
      mappedLessonId: mapped?.id,
      description: activity.description,
    });
  };

  const handleSelectQuickPick = (item: QuickPickItem) => {
    if (item.id === 'word-quest') {
      setActiveQuickPickModal('quest');
      return;
    }
    if (item.id === 'quick-notes') {
      setActiveQuickPickModal('notes');
      return;
    }
    if (item.id === 'sketch-explain') {
      setActiveQuickPickModal('sketch');
      return;
    }
    if (item.id === 'daily-challenge') {
      setActiveQuickPickModal('challenge');
      return;
    }

    // Backwards compatibility for legacy IDs
    if (item.id === 'lets-talk') {
      setActivePracticeStudio('conversation');
      return;
    }
    if (item.id === 'short-stories') {
      setActivePracticeStudio('stories');
      return;
    }
    if (item.id === 'word-of-the-day') {
      setActiveTab('Practice');
      setWordHighlighted(true);
      setTimeout(() => setWordHighlighted(false), 2000);
      return;
    }
    if (item.id === 'listen-and-repeat') {
      setActivePracticeStudio('listening');
      return;
    }

    setActiveModal({
      isOpen: true,
      title: item.title,
      subtitle: item.subtitle,
      category: 'Quick Pick',
      description: `Jump right into this focused practice session to strengthen your speaking, vocabulary, and grammar confidence.`,
    });
  };

  const [dailyRefreshTrigger, setDailyRefreshTrigger] = useState(0);

  const handleSelectDailyPractice = async (option: DailyPracticeOption) => {
    if (option.id === 'vocabulary') {
      const dueCards = await vocabularyRepository.getDueCards(user?.id || 'local-learner-1');
      if (dueCards.length > 0) {
        setReviewCards(dueCards);
      } else {
        setActivePracticeStudio('vocabulary');
      }
      return;
    }
    if (option.id === 'listening') {
      setActivePracticeStudio('listening');
      return;
    }
    if (option.id === 'speaking') {
      setActivePracticeStudio('conversation');
      return;
    }
  };

  const handleLaunchPlanItem = async (item: DailyStudyPlanItem) => {
    if (item.action.type === 'review') {
      const dueCards = await vocabularyRepository.getDueCards(user?.id || 'local-learner-1');
      if (dueCards.length > 0) {
        setReviewCards(dueCards);
      } else {
        setActivePracticeStudio('vocabulary');
      }
      return;
    }
    if (item.action.type === 'lesson') {
      const lesson = getCurriculumLesson(item.action.targetId);
      if (lesson) {
        setActiveLesson(lesson);
      } else {
        const mapped = getMappedLessonForActivity(item.action.targetId);
        setActiveModal({
          isOpen: true,
          title: item.title,
          subtitle: item.subtitle,
          category: 'Curriculum Lesson',
          mappedLessonId: mapped?.id || item.action.targetId,
          description: item.reason,
        });
      }
      return;
    }
    if (item.action.type === 'scenario') {
      setActiveScenarioId(item.action.targetId);
      return;
    }
    if (item.action.type === 'studio') {
      setActivePracticeStudio(item.action.category || (item.action.targetId as PracticeCategoryKey));
      return;
    }
    if (item.action.type === 'challenge') {
      setActiveQuickPickModal('challenge');
      return;
    }
  };

  const handleCompleteExercise = async () => {
    const updatedStreak = await incrementUserStreak();
    if (user) {
      setUser({ ...user, currentStreak: updatedStreak });
    }
  };

  return (
    <>
      {showSplash && (
        <SplashScreen
          onFinish={() => {
            sessionStorage.setItem('lexi_splash_shown', 'true');
            setShowSplash(false);
          }}
        />
      )}

      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="min-h-screen bg-[#E7EAFD] flex items-center justify-center p-0 sm:py-6">
        {/* Device Frame / Screen Canvas */}
        <main 
          className="w-full sm:max-w-[430px] min-h-screen sm:min-h-[880px] bg-[#F6F7FE] sm:rounded-[40px] sm:shadow-2xl sm:border-[6px] sm:border-white/80 overflow-hidden flex flex-col relative"
          role="region"
          aria-label="Lexi Application"
        >
        {/* Scrollable Content Container */}
        <div id="main-content" tabIndex={-1} className="flex-1 px-4 sm:px-5 pb-24 sm:pb-6 space-y-4 focus:outline-hidden">
          <ErrorBoundary fallbackTitle="Lexi Application Error">
            {activeTab === 'Home' ? (
            <>
              {/* Header */}
              <LexiHeader
                streakCount={user?.currentStreak ?? 7}
                avatarUrl={user?.avatarUrl ?? getAssetPath('/assets/default-avatar.svg')}
                onOpenSearch={() => setSearchOpen(true)}
                onOpenProfile={() => setIsPreferencesOpen(true)}
              />

              {/* Large Illustrated Hero */}
              <HeroCard onStartLearning={handleStartLearning} />

              {/* Category Shortcuts */}
              <CategoryShortcuts
                shortcuts={LEARNING_SHORTCUTS}
                onSelectShortcut={handleSelectShortcut}
              />

              {/* Featured Learning Banner */}
              <FeaturedBanner
                activity={FEATURED_CAFE_ACTIVITY}
                onLaunch={handleLaunchFeatured}
              />

              {/* Quick Picks 2x2 Grid */}
              <QuickPicks
                items={QUICK_PICKS}
                onSelectItem={handleSelectQuickPick}
                onSeeAll={() => setIsActivityHubOpen(true)}
              />

              {/* A. Continue Learning (Real curriculum progression & syllabus gateway) */}
              <ContinueLearningCard
                unitLabel={curriculumSummary?.currentUnitLabel || 'Unit 2 • Practical Speaking'}
                lessonTitle="Everyday Conversations"
                description={curriculumSummary?.nextLesson.description || 'Practice daily conversational English in real-world contexts.'}
                progressPercent={curriculumSummary?.unitProgressPercent ?? 65}
                nextLessonTitle={`Next: Lesson ${curriculumSummary?.nextLesson.order || 3} • ${curriculumSummary?.nextLesson.title || 'At the Bus Stop'}`}
                badgeLabel={curriculumSummary?.unitProgressPercent === 100 ? 'Completed' : 'In Progress'}
                onSeeAll={() => setIsCurriculumBrowserOpen(true)}
                onContinue={() => {
                  const mapped = getMappedLessonForActivity('everyday-conversations');
                  setActiveModal({
                    isOpen: true,
                    title: 'Everyday Conversations (Sample Lesson)',
                    subtitle: 'Unit 2 • Practical Speaking • Lesson 3',
                    category: 'Continue Learning',
                    mappedLessonId: mapped?.id || 'a1-u2-l2-everyday-conversations',
                    description: 'Practice greetings, polite requests, and casual dialogue in natural settings. Continue your structured CEFR learning journey.',
                  });
                }}
              />

              {/* B. Word of the Day (Interactive pronunciation) */}
              <WordOfTheDayCard isHighlighted={wordHighlighted} />

              {/* C. Daily Practice (Vocabulary, Listening, Speaking) */}
              <DailyPracticeRow
                userId={user?.id || 'local-learner-1'}
                onSelectOption={handleSelectDailyPractice}
                refreshTrigger={dailyRefreshTrigger}
              />

              {/* Personalized Daily Study Plan (Adaptive Intelligence) */}
              <TodaysLearningPlan
                userId={user?.id || 'local-learner-1'}
                onLaunchItem={handleLaunchPlanItem}
                refreshTrigger={dailyRefreshTrigger}
              />
            </>
          ) : activeTab === 'Explore' ? (
            /* Dedicated Explore Destination with Real Syllabus */
            <ExploreScreen
              onOpenCurriculumBrowser={() => setIsCurriculumBrowserOpen(true)}
              onOpenActivity={(act) => {
                if (act.id && scenarioSimulationService.getScenarioById(act.id)) {
                  setActiveScenarioId(act.id);
                  return;
                }
                const mapped = act.id ? getMappedLessonForActivity(act.id) : undefined;
                setActiveModal({
                  isOpen: true,
                  title: act.title,
                  subtitle: act.subtitle,
                  category: act.category,
                  mappedLessonId: mapped?.id,
                  description: act.description,
                });
              }}
            />
          ) : activeTab === 'Practice' ? (
            /* Dedicated Practice Hub & Spaced Repetition (FSRS) */
            <PracticeScreen
              userId={user?.id || 'local-learner-1'}
              onStartReview={(cardsToReview) => setReviewCards(cardsToReview)}
              onExploreLessons={() => setActiveTab('Explore')}
            />
          ) : activeTab === 'Progress' ? (
            /* Unified Progress & Improvement Dashboard */
            <ProgressDashboardScreen
              userId={user?.id || 'local-learner-1'}
              userStreak={user?.currentStreak ?? 7}
              userLongestStreak={user?.longestStreak ?? 14}
              onOpenStudio={(cat) => setActivePracticeStudio(cat)}
              onNavigateToPractice={() => setActiveTab('Practice')}
              onNavigateToExplore={() => setActiveTab('Explore')}
              onContinueLesson={(lessonId) => {
                const lesson = getCurriculumLesson(lessonId);
                if (lesson) {
                  setActiveLesson(lesson);
                }
              }}
            />
          ) : null}
          </ErrorBoundary>
        </div>

        {/* 4-Destination Bottom Navigation */}
        <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />

        <ErrorBoundary fallbackTitle="Activity Error">
          <Suspense fallback={null}>
            {/* Interactive Activity Dialog */}
            {activeModal.isOpen && (
              <ActivityModal
                isOpen={activeModal.isOpen}
                title={activeModal.title}
                subtitle={activeModal.subtitle}
                category={activeModal.category}
                description={activeModal.description}
                mappedLessonId={activeModal.mappedLessonId}
                onClose={() => setActiveModal({ ...activeModal, isOpen: false })}
                onCompleteExercise={handleCompleteExercise}
                onStartLesson={(lessonId) => {
                  const lesson = getCurriculumLesson(lessonId);
                  if (lesson) {
                    setActiveModal((prev) => ({ ...prev, isOpen: false }));
                    setActiveLesson(lesson);
                  }
                }}
              />
            )}

            {/* Quick Search Overlay */}
            {searchOpen && (
              <SearchModal
                isOpen={searchOpen}
                onClose={() => setSearchOpen(false)}
                onSelectResult={(result: CurriculumSearchResult) => {
                  if (result.type === 'lesson' && result.lessonId) {
                    const lesson = getCurriculumLesson(result.lessonId);
                    if (lesson) {
                      setActiveLesson(lesson);
                      return;
                    }
                  }
                  if (result.type === 'studio' && result.studioKey) {
                    setActivePracticeStudio(result.studioKey);
                    return;
                  }
                  setActiveModal({
                    isOpen: true,
                    title: result.title,
                    category: result.category,
                    description: result.subtitle,
                  });
                }}
                onSelectTopic={(topic) => {
                  setActiveModal({
                    isOpen: true,
                    title: topic,
                    category: 'Search Result',
                    description: `Loaded lesson topic: "${topic}". Jump directly into interactive grammar and dialogue practice.`,
                  });
                }}
              />
            )}

            {/* Full Interactive Lesson Player */}
            {activeLesson && (
              <LessonPlayer
                lesson={activeLesson}
                userId={user?.id || 'local-learner-1'}
                onClose={() => setActiveLesson(null)}
                onCompleteLesson={async () => {
                  const updatedStreak = await incrementUserStreak();
                  if (user) {
                    setUser({ ...user, currentStreak: updatedStreak });
                  }
                  await refreshCurriculum();
                }}
              />
            )}

            {/* Spaced-Repetition FSRS Review Player */}
            {reviewCards && (
              <ReviewPlayer
                cards={reviewCards}
                onClose={() => setReviewCards(null)}
                onFinishedReview={async () => {
                  const updatedStreak = await incrementUserStreak();
                  if (user) {
                    setUser({ ...user, currentStreak: updatedStreak });
                  }
                  await dailyPracticeService.recordDailyCompletion(user?.id || 'local-learner-1', 'vocabulary', 95);
                  setDailyRefreshTrigger((prev) => prev + 1);
                }}
              />
            )}

            {/* Dedicated Practice Studio Modal (Conversation, Stories, Grammar, Listening, Interview) */}
            {activePracticeStudio && (
              <PracticeModal
                category={activePracticeStudio}
                userId={user?.id || 'local-learner-1'}
                onClose={() => {
                  setActivePracticeStudio(null);
                  setDailyRefreshTrigger((prev) => prev + 1);
                }}
              />
            )}

            {/* Complementary Quick Picks Modals */}
            {activeQuickPickModal === 'notes' && (
              <QuickNotesModal
                isOpen={activeQuickPickModal === 'notes'}
                onClose={() => setActiveQuickPickModal(null)}
                userId={user?.id || 'local-learner-1'}
              />
            )}
            {activeQuickPickModal === 'quest' && (
              <WordQuestModal
                isOpen={activeQuickPickModal === 'quest'}
                onClose={() => setActiveQuickPickModal(null)}
                userId={user?.id || 'local-learner-1'}
                onCompleteExercise={handleCompleteExercise}
              />
            )}
            {activeQuickPickModal === 'sketch' && (
              <SketchExplainModal
                isOpen={activeQuickPickModal === 'sketch'}
                onClose={() => setActiveQuickPickModal(null)}
                userId={user?.id || 'local-learner-1'}
              />
            )}
            {activeQuickPickModal === 'challenge' && (
              <DailyChallengeModal
                isOpen={activeQuickPickModal === 'challenge'}
                onClose={() => setActiveQuickPickModal(null)}
                userId={user?.id || 'local-learner-1'}
                onCompleteExercise={handleCompleteExercise}
              />
            )}

            {/* Personalized Practice Preferences Modal */}
            {isPreferencesOpen && (
              <PracticePreferencesModal
                isOpen={isPreferencesOpen}
                onClose={() => setIsPreferencesOpen(false)}
                userId={user?.id || 'local-learner-1'}
                onSaved={async () => {
                  const updated = await getOrCreateUserProfile();
                  setUser(updated);
                }}
              />
            )}

            {/* Explore More Activities Hub */}
            {isActivityHubOpen && (
              <ExploreActivitiesHub
                isOpen={isActivityHubOpen}
                onClose={() => setIsActivityHubOpen(false)}
                userId={user?.id || 'local-learner-1'}
                userLevel={user?.cefrLevel || 'A2'}
                onOpenPreferences={() => setIsPreferencesOpen(true)}
                onLaunchActivity={(key) => {
                  setIsActivityHubOpen(false);
                  if (key === 'word_quest') {
                    setActiveQuickPickModal('quest');
                  } else if (key === 'sketch_explain') {
                    setActiveQuickPickModal('sketch');
                  } else if (key === 'daily_challenge') {
                    setActiveQuickPickModal('challenge');
                  } else if (key === 'quick_notes') {
                    setActiveQuickPickModal('notes');
                  } else {
                    setActiveHubActivity(key);
                  }
                }}
              />
            )}

            {/* Hub Interactive Activities */}
            {activeHubActivity === 'phrase_builder' && (
              <PhraseBuilderModal
                isOpen={activeHubActivity === 'phrase_builder'}
                onClose={() => setActiveHubActivity(null)}
                userId={user?.id || 'local-learner-1'}
              />
            )}
            {activeHubActivity === 'mini_grammar' && (
              <MiniGrammarGamesModal
                isOpen={activeHubActivity === 'mini_grammar'}
                onClose={() => setActiveHubActivity(null)}
                userId={user?.id || 'local-learner-1'}
              />
            )}
            {activeHubActivity === 'scenario_challenge' && (
              <ScenarioChallengeModal
                isOpen={activeHubActivity === 'scenario_challenge'}
                onClose={() => setActiveHubActivity(null)}
                userId={user?.id || 'local-learner-1'}
              />
            )}
            {activeHubActivity === 'idiom_of_day' && (
              <IdiomOfTheDayModal
                isOpen={activeHubActivity === 'idiom_of_day'}
                onClose={() => setActiveHubActivity(null)}
                userId={user?.id || 'local-learner-1'}
              />
            )}
            {activeHubActivity === 'daily_word_puzzle' && (
              <DailyWordPuzzleModal
                isOpen={activeHubActivity === 'daily_word_puzzle'}
                onClose={() => setActiveHubActivity(null)}
                userId={user?.id || 'local-learner-1'}
              />
            )}
            {activeHubActivity === 'describe_and_draw' && (
              <DescribeAndDrawModal
                isOpen={activeHubActivity === 'describe_and_draw'}
                onClose={() => setActiveHubActivity(null)}
                userId={user?.id || 'local-learner-1'}
              />
            )}
            {activeHubActivity === 'listening_quiz' && (
              <ShortListeningQuizModal
                isOpen={activeHubActivity === 'listening_quiz'}
                onClose={() => setActiveHubActivity(null)}
                userId={user?.id || 'local-learner-1'}
              />
            )}
            {activeHubActivity === 'speaking_prompt' && (
              <SpeakingPromptModal
                isOpen={activeHubActivity === 'speaking_prompt'}
                onClose={() => setActiveHubActivity(null)}
                userId={user?.id || 'local-learner-1'}
              />
            )}
            {activeHubActivity === 'interview_sprint' && (
              <InterviewSprintModal
                isOpen={activeHubActivity === 'interview_sprint'}
                onClose={() => setActiveHubActivity(null)}
                userId={user?.id || 'local-learner-1'}
                onOpenFullTrainer={() => {
                  setActiveHubActivity(null);
                  setIsActivityHubOpen(false);
                  setActivePracticeStudio('interview');
                }}
              />
            )}

            {/* Interactive Multi-turn Scenario Roleplay Modal */}
            {Boolean(activeScenarioId) && (
              <InteractiveScenarioModal
                isOpen={Boolean(activeScenarioId)}
                scenarioId={activeScenarioId}
                userId={user?.id || 'local-learner-1'}
                onClose={() => setActiveScenarioId(null)}
                onStartLesson={(lessonId) => {
                  const lesson = getCurriculumLesson(lessonId);
                  if (lesson) {
                    setActiveScenarioId(null);
                    setActiveLesson(lesson);
                  }
                }}
                onSessionComplete={() => {
                  refreshCurriculum();
                }}
              />
            )}

            {/* Interactive CEFR Curriculum Roadmap & Course Browser */}
            {isCurriculumBrowserOpen && (
              <CurriculumBrowserModal
                isOpen={isCurriculumBrowserOpen}
                userProgress={curriculumProgressState}
                initialLevel={user?.cefrLevel || 'A1'}
                onClose={() => setIsCurriculumBrowserOpen(false)}
                onSelectLesson={(lesson) => setActiveLesson(lesson)}
              />
            )}
          </Suspense>
        </ErrorBoundary>

        {/* Smart In-App Notification Toast */}
        {!isAnyModalOpen && activeNotification && (
          <NotificationToast
            notification={activeNotification}
            onAction={handleNotificationAction}
            onDismiss={handleNotificationDismiss}
          />
        )}
      </main>
    </div>
  </>
  );
}

export default App;
