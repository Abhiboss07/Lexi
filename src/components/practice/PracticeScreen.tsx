import React, { useState, useEffect, useMemo, useCallback, useDeferredValue, lazy, Suspense } from 'react';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  Sliders,
  AlertCircle,
  Award,
} from 'lucide-react';
import type { VocabularyCardRecord, VocabularyStats } from '../../types/vocabulary';
import type { PracticePreferences } from '../../types/practicePreferences';
import { vocabularyRepository } from '../../db/vocabularyRepository';
import { practiceRepository } from '../../db/practiceRepository';
import { VocabularyCardItem } from '../vocabulary/VocabularyCardItem';
import { isCardDue } from '../../services/fsrsScheduler';
import { PracticeHeroCard } from './PracticeHeroCard';
import type { PracticeCategoryKey } from './PracticeCategoryNav';

const PracticeModal = lazy(() => import('./PracticeModals').then(m => ({ default: m.PracticeModal })));
const PracticePreferencesModal = lazy(() => import('./PracticePreferencesModal').then(m => ({ default: m.PracticePreferencesModal })));
const PlacementAssessmentModal = lazy(() => import('../assessment/PlacementAssessmentModal').then(m => ({ default: m.PlacementAssessmentModal })));

export interface PracticeScreenProps {
  userId?: string;
  onStartReview: (cardsToReview: VocabularyCardRecord[]) => void;
  onExploreLessons?: () => void;
}

type FilterPill = 'All' | 'Due' | 'A1' | 'A2' | 'Learning' | 'Review';

export const PracticeScreen: React.FC<PracticeScreenProps> = ({
  userId = 'local-learner-1',
  onStartReview,
  onExploreLessons,
}) => {
  const [cards, setCards] = useState<VocabularyCardRecord[]>([]);
  const [stats, setStats] = useState<VocabularyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterPill>('All');
  const [activePracticeModal, setActivePracticeModal] = useState<PracticeCategoryKey | null>(null);
  const [preferences, setPreferences] = useState<PracticePreferences | null>(null);
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);
  const [isPlacementOpen, setIsPlacementOpen] = useState(false);

  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Load cards, statistics, and practice preferences from repository with unmount guard
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [allCards, deckStats, userPrefs] = await Promise.all([
        vocabularyRepository.getCards(userId),
        vocabularyRepository.getStats(userId),
        practiceRepository.getPreferences(userId),
      ]);
      setCards(allCards);
      setStats(deckStats);
      setPreferences(userPrefs);
    } catch (err) {
      console.error('Error loading practice data:', err);
      setError('Could not load your vocabulary notebook. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [allCards, deckStats, userPrefs] = await Promise.all([
          vocabularyRepository.getCards(userId),
          vocabularyRepository.getStats(userId),
          practiceRepository.getPreferences(userId),
        ]);
        if (!isMounted) return;
        setCards(allCards);
        setStats(deckStats);
        setPreferences(userPrefs);
      } catch (err) {
        if (!isMounted) return;
        console.error('Error loading practice data:', err);
        setError('Could not load your vocabulary notebook. Please try again.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Filtered & searched cards using deferred query for 60fps typing
  const filteredCards = useMemo(() => {
    const q = deferredSearchQuery.trim().toLowerCase();
    const now = new Date();

    return cards.filter((card) => {
      // 1. Search filter
      if (q) {
        const matchesWord = card.item.word.toLowerCase().includes(q);
        const matchesDef = card.item.definition.toLowerCase().includes(q);
        const matchesExample = card.item.exampleSentence.toLowerCase().includes(q);
        const matchesLesson = card.item.sourceLessonTitle?.toLowerCase().includes(q);
        if (!matchesWord && !matchesDef && !matchesExample && !matchesLesson) {
          return false;
        }
      }

      // 2. Filter Pill
      switch (activeFilter) {
        case 'Due':
          return isCardDue(card, now);
        case 'A1':
          return card.item.cefrLevel === 'A1';
        case 'A2':
          return card.item.cefrLevel === 'A2';
        case 'Learning':
          return card.state === 'learning' || card.state === 'new';
        case 'Review':
          return card.state === 'review';
        case 'All':
        default:
          return true;
      }
    });
  }, [cards, deferredSearchQuery, activeFilter]);

  const dueCards = useMemo(() => {
    const now = new Date();
    return cards.filter((c) => isCardDue(c, now));
  }, [cards]);



  const handleStartRecommended = () => {
    if (dueCards.length > 0) {
      onStartReview(dueCards);
    } else {
      setActivePracticeModal('conversation');
    }
  };

  return (
    <div className="space-y-5 pb-6">
      {/* 1. Practice Screen Header */}
      <header className="flex items-center justify-between pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <h1 className="text-[22px] xs:text-[24px] font-black text-[#15164B] tracking-tight">
              Practice
            </h1>
            <Sparkles className="w-5 h-5 text-[#545CA6] stroke-[2.4]" />
          </div>
          <p className="text-[12px] xs:text-[12.5px] font-medium text-[#6B7094]">
            AI English Coach • Focused Studios & Spaced Repetition (FSRS)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsPrefsOpen(true)}
          className="px-2.5 py-1.5 rounded-full bg-white border border-[#D5D8EE] hover:border-[#545CA6] text-[#15164B] text-[11px] font-extrabold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          aria-label="Open Practice Goals & Preferences"
        >
          <Sliders className="w-3.5 h-3.5 text-[#545CA6]" />
          <span className="capitalize">{preferences?.defaultDifficulty || 'Medium'} • {preferences?.dailyGoalMinutes || 15}m</span>
        </button>
      </header>

      {/* 2. Premium 3D Practice Hero Card */}
      <PracticeHeroCard
        onStartRecommendedPractice={handleStartRecommended}
        dueReviewsCount={dueCards.length}
      />

      {/* 3. Dedicated Skill Studios Quick Access */}
      <div className="flex items-center gap-1.5 pt-0.5 px-0.5 overflow-x-auto no-scrollbar pb-1 -mb-1">
        <button
          type="button"
          onClick={() => setIsPlacementOpen(true)}
          className="px-3 py-1 rounded-full bg-[#EEF2FF] border border-[#CCD1F0] text-[#4F46E5] text-[11.5px] font-extrabold hover:bg-[#E0E7FF] transition-colors cursor-pointer shadow-xs shrink-0 flex items-center gap-1"
          aria-label="Open CEFR placement test"
        >
          <Award className="w-3.5 h-3.5 text-[#4F46E5]" />
          <span>Placement Test</span>
        </button>
        <span className="text-[11px] font-bold text-[#8E93B8] uppercase tracking-wider shrink-0 mr-0.5">
          Studios:
        </span>
        <button
          type="button"
          onClick={() => setActivePracticeModal('grammar')}
          className="px-3 py-1 rounded-full bg-white border border-[#ECEEFE] text-[#15164B] text-[11.5px] font-bold hover:bg-[#F0F2FD] transition-colors cursor-pointer shadow-xs shrink-0"
        >
          Grammar
        </button>
        <button
          type="button"
          onClick={() => setActivePracticeModal('conversation')}
          className="px-3 py-1 rounded-full bg-white border border-[#ECEEFE] text-[#15164B] text-[11.5px] font-bold hover:bg-[#F0F2FD] transition-colors cursor-pointer shadow-xs shrink-0"
        >
          Conversation
        </button>
        <button
          type="button"
          onClick={() => setActivePracticeModal('speaking')}
          className="px-3 py-1 rounded-full bg-white border border-[#ECEEFE] text-[#15164B] text-[11.5px] font-bold hover:bg-[#F0F2FD] transition-colors cursor-pointer shadow-xs shrink-0"
        >
          Speaking
        </button>
        <button
          type="button"
          onClick={() => setActivePracticeModal('stories')}
          className="px-3 py-1 rounded-full bg-white border border-[#ECEEFE] text-[#15164B] text-[11.5px] font-bold hover:bg-[#F0F2FD] transition-colors cursor-pointer shadow-xs shrink-0"
        >
          Stories
        </button>
        <button
          type="button"
          onClick={() => setActivePracticeModal('listening')}
          className="px-3 py-1 rounded-full bg-white border border-[#ECEEFE] text-[#15164B] text-[11.5px] font-bold hover:bg-[#F0F2FD] transition-colors cursor-pointer shadow-xs shrink-0"
        >
          Listening
        </button>
        <button
          type="button"
          onClick={() => setActivePracticeModal('vocabulary')}
          className="px-3 py-1 rounded-full bg-white border border-[#ECEEFE] text-[#15164B] text-[11.5px] font-bold hover:bg-[#F0F2FD] transition-colors cursor-pointer shadow-xs shrink-0"
        >
          Vocab Studio
        </button>
        <button
          type="button"
          onClick={() => setActivePracticeModal('interview')}
          className="px-3 py-1 rounded-full bg-white border border-[#ECEEFE] text-[#15164B] text-[11.5px] font-bold hover:bg-[#F0F2FD] transition-colors cursor-pointer shadow-xs shrink-0"
        >
          Interview
        </button>
      </div>

      {/* 4. Integrated Vocabulary & FSRS Spaced-Repetition Deck Section */}
      <section
        id="vocabulary-deck-section"
        aria-labelledby="vocab-deck-heading"
        className="space-y-4 pt-1"
      >
        <div className="flex flex-wrap xs:flex-nowrap items-center justify-between gap-y-1.5 gap-x-1 sm:gap-x-2 px-0.5">
          <div className="flex items-center gap-1.5 shrink-0">
            <h2 id="vocab-deck-heading" className="text-[13.5px] xs:text-[14.5px] sm:text-[16px] font-black text-[#15164B] tracking-tight whitespace-nowrap">
              Vocabulary Notebook
            </h2>
            <span className="text-[9.5px] xs:text-[10px] font-bold text-[#545CA6] bg-[#ECEFFD] px-1.5 py-0.5 rounded-full shrink-0">
              FSRS
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto xs:ml-0">
            <button
              type="button"
              onClick={() => setActivePracticeModal('vocabulary')}
              className="text-[10.5px] xs:text-[11px] font-bold text-[#545CA6] bg-white border border-[#D5D8EE] hover:bg-[#ECEFFD] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full cursor-pointer transition-colors shadow-xs whitespace-nowrap"
              aria-label="Open Vocab Practice Studio"
            >
              Vocab Studio
            </button>
            {dueCards.length > 0 ? (
              <button
                type="button"
                onClick={() => onStartReview(dueCards)}
                className="text-[10.5px] xs:text-[11px] font-bold text-[#15164B] bg-[#ECEFFD] hover:bg-[#DEE3FA] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full cursor-pointer transition-colors whitespace-nowrap"
              >
                Review Due ({dueCards.length})
              </button>
            ) : (
              <span className="text-[10px] xs:text-[10.5px] font-semibold text-[#8E93B8] whitespace-nowrap">
                Personalized Retention
              </span>
            )}
          </div>
        </div>

        {/* Quick Deck Statistics */}
        {stats && (
          <div className="grid grid-cols-4 gap-2">
            <div className="p-3 rounded-2xl bg-white border border-[#ECEEFE] text-center shadow-xs">
              <span className="text-[16px] font-black text-[#1C2046] block">{stats.totalCards}</span>
              <span className="text-[10px] font-bold text-[#8E93B8] uppercase">Total</span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-[#ECEEFE] text-center shadow-xs">
              <span className={`text-[16px] font-black block ${stats.dueCards > 0 ? 'text-[#DC2626]' : 'text-[#10B981]'}`}>
                {stats.dueCards}
              </span>
              <span className="text-[10px] font-bold text-[#8E93B8] uppercase">Due</span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-[#ECEEFE] text-center shadow-xs">
              <span className="text-[16px] font-black text-[#D97706] block">{stats.learningCards + stats.newCards}</span>
              <span className="text-[10px] font-bold text-[#8E93B8] uppercase">Learning</span>
            </div>
            <div className="p-3 rounded-2xl bg-white border border-[#ECEEFE] text-center shadow-xs">
              <span className="text-[16px] font-black text-[#2563EB] block">{stats.reviewCards}</span>
              <span className="text-[10px] font-bold text-[#8E93B8] uppercase">Review</span>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8E93B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search words, meanings, or topics..."
            className="w-full pl-10 pr-9 py-2.5 rounded-full bg-white border border-[#E4E7F7] text-[13px] text-[#15164B] placeholder:text-[#8E93B8] focus:border-[#545CA6] focus:ring-2 focus:ring-[#545CA6]/20 shadow-xs transition-all outline-none"
            aria-label="Search vocabulary"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-[#EFF1FE] text-[#545CA6] hover:bg-[#E0E4FC] transition-colors cursor-pointer text-xs font-bold"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {(['All', 'Due', 'A1', 'A2', 'Learning', 'Review'] as FilterPill[]).map((pill) => {
            const isActive = activeFilter === pill;
            const count = 
              pill === 'All' ? cards.length :
              pill === 'Due' ? dueCards.length :
              pill === 'A1' ? cards.filter(c => c.item.cefrLevel === 'A1').length :
              pill === 'A2' ? cards.filter(c => c.item.cefrLevel === 'A2').length :
              pill === 'Learning' ? cards.filter(c => c.state === 'learning' || c.state === 'new').length :
              cards.filter(c => c.state === 'review').length;

            return (
              <button
                key={pill}
                type="button"
                onClick={() => setActiveFilter(pill)}
                className={`px-3 py-1.5 rounded-full text-[11.5px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                  isActive
                    ? 'bg-[#1E224E] text-white shadow-xs'
                    : 'bg-white text-[#6B7094] border border-[#ECEEFE] hover:bg-[#F9F9FE]'
                }`}
              >
                <span>{pill}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-[#ECEFFD] text-[#545CA6]'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Card Deck List & Meaningful States */}
        {isLoading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-4 rounded-2xl bg-white border border-[#ECEEFE] space-y-3 animate-pulse">
                <div className="h-5 bg-[#ECEFFD] rounded-md w-1/3" />
                <div className="h-4 bg-[#F4F5FD] rounded-md w-3/4" />
                <div className="h-3 bg-[#F4F5FD] rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 rounded-3xl bg-white border border-[#FCA5A5] text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-[#DC2626] mx-auto" />
            <p className="text-[13px] text-[#991B1B] font-medium">{error}</p>
            <button
              type="button"
              onClick={loadData}
              className="px-4 py-2 rounded-full bg-[#1E224E] text-white text-[12px] font-bold cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-[#ECEEFE] text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F4F5FD] text-[#646AA4] flex items-center justify-center mx-auto">
              {searchQuery ? <Search className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
            <h3 className="text-[16px] font-bold text-[#1C2046]">
              {searchQuery ? 'No matching vocabulary' : 'Notebook is Empty'}
            </h3>
            <p className="text-[12.5px] text-[#6B7094] max-w-[260px] mx-auto leading-relaxed">
              {searchQuery
                ? `No words matched "${searchQuery}". Try searching for another phrase or clear your filter.`
                : 'Complete lessons in the curriculum to automatically add vocabulary words to your spaced-repetition deck.'}
            </p>
            {searchQuery ? (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setActiveFilter('All'); }}
                className="px-4 py-2 rounded-full bg-[#ECEFFD] text-[#545CA6] text-[12px] font-bold cursor-pointer"
              >
                Reset Search & Filters
              </button>
            ) : onExploreLessons ? (
              <button
                type="button"
                onClick={onExploreLessons}
                className="px-5 py-2.5 rounded-full bg-[#1E224E] text-white text-[12.5px] font-bold cursor-pointer"
              >
                Explore Lessons
              </button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCards.map((card) => (
              <VocabularyCardItem
                key={card.id}
                card={card}
                onReviewSingle={(c) => onStartReview([c])}
              />
            ))}
          </div>
        )}
      </section>

      {/* 5. Dedicated Practice Modals (Conversation, Stories, Grammar, Listening) */}
      <Suspense fallback={null}>
        {Boolean(activePracticeModal) && (
          <PracticeModal
            category={activePracticeModal}
            userId={userId}
            initialDifficulty={preferences?.defaultDifficulty}
            initialSessionLength={preferences?.defaultSessionLength}
            onClose={() => {
              setActivePracticeModal(null);
              loadData();
            }}
            onNavigateToExplore={onExploreLessons}
          />
        )}

        {/* 6. Practice Preferences Modal (Difficulty, Goals, Session Length) */}
        {isPrefsOpen && (
          <PracticePreferencesModal
            userId={userId}
            isOpen={isPrefsOpen}
            onClose={() => setIsPrefsOpen(false)}
            onSaved={(updated) => setPreferences(updated)}
          />
        )}

        {/* 7. CEFR Placement & Skill Assessment Modal */}
        {isPlacementOpen && (
          <PlacementAssessmentModal
            isOpen={isPlacementOpen}
            userId={userId}
            currentLevel={preferences?.cefrLevel || 'A1'}
            onClose={() => {
              setIsPlacementOpen(false);
              loadData();
            }}
            onLevelUpdated={(newLevel) => {
              if (preferences) {
                setPreferences({ ...preferences, cefrLevel: newLevel });
              }
            }}
          />
        )}
      </Suspense>
    </div>
  );
};
