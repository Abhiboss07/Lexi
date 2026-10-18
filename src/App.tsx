import { useState, useEffect } from 'react';
import { LexiHeader } from './components/home/LexiHeader';
import { HeroCard } from './components/home/HeroCard';
import { CategoryShortcuts } from './components/home/CategoryShortcuts';
import { FeaturedBanner } from './components/home/FeaturedBanner';
import { QuickPicks } from './components/home/QuickPicks';
import { BottomNav } from './components/common/BottomNav';
import { ActivityModal } from './components/modals/ActivityModal';
import { SearchModal } from './components/modals/SearchModal';
import { 
  LEARNING_SHORTCUTS, 
  FEATURED_CAFE_ACTIVITY, 
  QUICK_PICKS 
} from './data/homeData';
import { getOrCreateUserProfile, incrementUserStreak } from './db';
import type { NavigationTab, LearningShortcut, QuickPickItem, FeaturedActivity, UserProfile } from './types';

export function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<NavigationTab>('Home');
  const [searchOpen, setSearchOpen] = useState(false);

  // Active activity modal state
  const [activeModal, setActiveModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    description: string;
    category?: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
  });

  // Load user profile and streak from IndexedDB (Dexie)
  useEffect(() => {
    getOrCreateUserProfile().then((u) => {
      setUser(u);
    });
  }, []);

  const handleStartLearning = () => {
    setActiveModal({
      isOpen: true,
      title: 'Daily Conversational English',
      subtitle: 'Lesson 1 • Real-World Greetings',
      category: 'Recommended For You',
      description: 'Start your daily learning session by mastering polite conversational greetings in casual and professional contexts.',
    });
  };

  const handleSelectShortcut = (shortcut: LearningShortcut) => {
    setActiveModal({
      isOpen: true,
      title: `${shortcut.title} Practice`,
      subtitle: `Module: ${shortcut.title} Essentials`,
      category: shortcut.title,
      description: shortcut.description,
    });
  };

  const handleLaunchFeatured = (activity: FeaturedActivity) => {
    setActiveModal({
      isOpen: true,
      title: activity.title,
      subtitle: `${activity.durationText} • ${activity.difficultyText}`,
      category: activity.eyebrow,
      description: activity.description,
    });
  };

  const handleSelectQuickPick = (item: QuickPickItem) => {
    setActiveModal({
      isOpen: true,
      title: item.title,
      subtitle: item.subtitle,
      category: 'Quick Pick',
      description: `Jump right into this focused practice session to strengthen your speaking, vocabulary, and grammar confidence.`,
    });
  };

  const handleCompleteExercise = async () => {
    const updatedStreak = await incrementUserStreak();
    if (user) {
      setUser({ ...user, currentStreak: updatedStreak });
    }
  };

  return (
    <div className="min-h-screen bg-[#E7EAFD] flex items-center justify-center p-0 sm:py-6">
      {/* Device Frame / Screen Canvas */}
      <main 
        className="w-full sm:max-w-[430px] min-h-screen sm:min-h-[880px] bg-[#F6F7FE] sm:rounded-[40px] sm:shadow-2xl sm:border-[6px] sm:border-white/80 overflow-hidden flex flex-col relative"
        role="region"
        aria-label="Lexi Application"
      >
        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-6 space-y-4">
          {activeTab === 'Home' ? (
            <>
              {/* Header */}
              <LexiHeader
                streakCount={user?.currentStreak ?? 7}
                avatarUrl={user?.avatarUrl ?? '/assets/default-avatar.svg'}
                onOpenSearch={() => setSearchOpen(true)}
                onOpenProfile={() => {
                  setActiveModal({
                    isOpen: true,
                    title: 'Learner Profile',
                    subtitle: user?.email ?? 'learner@lexi.local',
                    category: 'Settings & Progress',
                    description: `Active Level: ${user?.cefrLevel ?? 'A2'} • Daily Goal: ${user?.dailyGoalMinutes ?? 15} minutes • Longest Streak: ${user?.longestStreak ?? 14} days.`,
                  });
                }}
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
                onSeeAll={() => {
                  setActiveModal({
                    isOpen: true,
                    title: 'All Quick Picks',
                    category: 'Curriculum Library',
                    description: 'Browse all bite-sized interactive learning modules categorized by CEFR competency and speaking goals.',
                  });
                }}
              />
            </>
          ) : (
            /* Interim Destination Placeholder for Non-Home Tabs */
            <div className="py-16 px-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#ECEEFE] text-[#232655] flex items-center justify-center mx-auto text-2xl font-bold">
                {activeTab === 'Explore' ? '🧭' : activeTab === 'Practice' ? '🎙️' : '📊'}
              </div>
              <h2 className="text-[22px] font-bold text-[#222149]">
                {activeTab} Destination
              </h2>
              <p className="text-[13px] text-[#6B7094] max-w-[280px] mx-auto leading-relaxed">
                {activeTab === 'Explore'
                  ? 'The Explore curriculum journey, CEFR unit maps, and interactive adventures are scheduled for implementation in Phase 3.'
                  : activeTab === 'Practice'
                  ? 'The dedicated Practice speech and listening studio with TS-FSRS review is scheduled for Phase 3.'
                  : 'Your learning metrics, vocabulary retention curves, and CEFR progress reports are scheduled for Phase 3.'}
              </p>
              <button
                onClick={() => setActiveTab('Home')}
                className="inline-flex px-6 py-2.5 rounded-full bg-[#232655] text-white text-[13px] font-semibold hover:bg-[#181A3C] transition-colors"
              >
                Return to Home
              </button>
            </div>
          )}
        </div>

        {/* 4-Destination Bottom Navigation */}
        <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Interactive Activity Dialog */}
        <ActivityModal
          isOpen={activeModal.isOpen}
          title={activeModal.title}
          subtitle={activeModal.subtitle}
          category={activeModal.category}
          description={activeModal.description}
          onClose={() => setActiveModal({ ...activeModal, isOpen: false })}
          onCompleteExercise={handleCompleteExercise}
        />

        {/* Quick Search Overlay */}
        <SearchModal
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          onSelectTopic={(topic) => {
            setActiveModal({
              isOpen: true,
              title: topic,
              category: 'Search Result',
              description: `Loaded lesson topic: "${topic}". Jump directly into interactive grammar and dialogue practice.`,
            });
          }}
        />
      </main>
    </div>
  );
}

export default App;
