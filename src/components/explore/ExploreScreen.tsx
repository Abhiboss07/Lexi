import React, { useState, useMemo } from 'react';
import { Search, Compass } from 'lucide-react';
import { ContinueJourneyCard } from './ContinueJourneyCard';
import { AdventureFilterBar } from './AdventureFilterBar';
import { AdventureCard } from './AdventureCard';
import { ExploreWordCard } from './ExploreWordCard';
import { PopularModulesSection } from './PopularModulesSection';
import { ExploreSearchResults } from './ExploreSearchResults';
import { 
  ADVENTURE_CATEGORIES, 
  ADVENTURE_SCENARIOS, 
  CURRENT_JOURNEY_UNIT, 
  POPULAR_MODULES,
  TODAYS_WORD_DATA
} from '../../data/exploreData';
import type { AdventureCategory, AdventureScenario, PopularModule } from '../../types';

interface ExploreScreenProps {
  onOpenActivity: (activity: {
    id?: string;
    title: string;
    subtitle?: string;
    category?: string;
    description: string;
    prompt?: string;
  }) => void;
}

export const ExploreScreen: React.FC<ExploreScreenProps> = ({ onOpenActivity }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AdventureCategory>('All');

  // Filtered adventure scenarios based on category pill
  const filteredScenarios = useMemo(() => {
    if (selectedCategory === 'All') {
      return ADVENTURE_SCENARIOS;
    }
    return ADVENTURE_SCENARIOS.filter((s) => s.category === selectedCategory);
  }, [selectedCategory]);

  // Combined search results across all modules
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const list: Array<{
      id: string;
      title: string;
      subtitle: string;
      category: string;
      badge: string;
      description: string;
    }> = [];

    // Search scenarios
    for (const s of ADVENTURE_SCENARIOS) {
      if (
        s.title.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      ) {
        list.push({
          id: s.id,
          title: s.title,
          subtitle: s.subtitle,
          category: s.category,
          badge: s.difficulty,
          description: s.description,
        });
      }
    }

    // Search journey unit
    if (
      CURRENT_JOURNEY_UNIT.title.toLowerCase().includes(q) ||
      CURRENT_JOURNEY_UNIT.subtitle.toLowerCase().includes(q) ||
      CURRENT_JOURNEY_UNIT.description.toLowerCase().includes(q) ||
      q.includes('grammar') ||
      q.includes('past') ||
      q.includes('tense')
    ) {
      list.push({
        id: 'journey-unit-3',
        title: CURRENT_JOURNEY_UNIT.title,
        subtitle: CURRENT_JOURNEY_UNIT.subtitle,
        category: 'Grammar Course',
        badge: 'Unit 3',
        description: CURRENT_JOURNEY_UNIT.description,
      });
    }

    // Search popular modules
    for (const p of POPULAR_MODULES) {
      if (
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      ) {
        list.push({
          id: p.id,
          title: p.title,
          subtitle: p.subtitle,
          category: p.category,
          badge: p.difficulty,
          description: p.description,
        });
      }
    }

    // Search today's word
    if (
      TODAYS_WORD_DATA.word.toLowerCase().includes(q) ||
      TODAYS_WORD_DATA.definition.toLowerCase().includes(q) ||
      q.includes('word') ||
      q.includes('vocab')
    ) {
      list.push({
        id: 'todays-word',
        title: `Word: ${TODAYS_WORD_DATA.word}`,
        subtitle: `${TODAYS_WORD_DATA.partOfSpeech} • ${TODAYS_WORD_DATA.phonetic}`,
        category: 'Vocabulary',
        badge: 'Daily',
        description: `${TODAYS_WORD_DATA.definition} Example: "${TODAYS_WORD_DATA.exampleSentence}"`,
      });
    }

    return list;
  }, [searchQuery]);

  const handleSelectScenario = (scenario: AdventureScenario) => {
    onOpenActivity({
      id: scenario.id,
      title: scenario.title,
      subtitle: `${scenario.category} • ${scenario.difficulty} • ${scenario.duration}`,
      category: 'Adventure Scenario',
      description: `${scenario.description}\n\n${scenario.samplePrompt || ''}`,
    });
  };

  const handleSelectPopular = (module: PopularModule) => {
    onOpenActivity({
      id: module.id,
      title: module.title,
      subtitle: `${module.category} • ${module.difficulty} • ${module.duration}`,
      category: 'Curriculum Library',
      description: module.description,
    });
  };

  const handleContinueJourney = () => {
    onOpenActivity({
      id: 'present-vs-past',
      title: `${CURRENT_JOURNEY_UNIT.title} (Unit 3)`,
      subtitle: `${CURRENT_JOURNEY_UNIT.nextLessonTitle} • 60% Complete`,
      category: 'Grammar Journey',
      description: `${CURRENT_JOURNEY_UNIT.description}\n\nContinue mastering irregular past verb inflections with real-world contextual questions.`,
    });
  };

  return (
    <div className="space-y-4 xs:space-y-4.5 pb-4">
      {/* 1. Explore Header & Search */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-[22px] xs:text-[24px] font-black text-[#15164B] tracking-tight">
                Explore
              </h1>
              <Compass className="w-5 h-5 text-[#545CA6] stroke-[2.4]" />
            </div>
            <p className="text-[12px] xs:text-[12.5px] font-medium text-[#6B7094] mt-0.5">
              Discover lessons, stories, and real-world conversations
            </p>
          </div>
        </div>

        {/* Integrated Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#787DAB]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics, grammar, phrases..."
            className="w-full pl-10 pr-9 py-2.5 rounded-full bg-white border border-[#E4E7F7] text-[13px] text-[#15164B] placeholder:text-[#8E93B8] focus:outline-hidden focus:ring-2 focus:ring-[#545CA6]/40 focus:border-[#545CA6] shadow-xs transition-all"
            aria-label="Search learning content"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-[#E2E4F8] text-[#545CA6] hover:bg-[#D4D8F4] text-xs font-bold cursor-pointer"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. Search Mode vs Discovery Mode */}
      {searchQuery.trim() ? (
        <ExploreSearchResults
          query={searchQuery}
          results={searchResults}
          onSelectResult={(item) => {
            onOpenActivity({
              title: item.title,
              subtitle: `${item.category} • ${item.badge}`,
              category: 'Search Result',
              description: item.description,
            });
          }}
          onClearSearch={() => setSearchQuery('')}
        />
      ) : (
        <>
          {/* A. Continue Your Journey Card */}
          <ContinueJourneyCard
            unit={CURRENT_JOURNEY_UNIT}
            onContinue={handleContinueJourney}
            onSeeAll={() => {
              onOpenActivity({
                title: 'Grammar Journey Curriculum',
                subtitle: 'All 10 Units • A1 to B2 Roadmap',
                category: 'Curriculum Roadmap',
                description: 'Explore the full structured grammar syllabus from foundational subject-verb agreement to advanced conditionals.',
              });
            }}
          />

          {/* B. Choose Your Adventure Section */}
          <section aria-labelledby="adventure-heading" className="space-y-2.5">
            <h2 id="adventure-heading" className="text-[17px] xs:text-[18px] font-extrabold text-[#15164B] px-0.5">
              Choose Your Adventure
            </h2>

            {/* Filter Pills */}
            <AdventureFilterBar
              categories={ADVENTURE_CATEGORIES}
              activeCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* Adventure Scenario Cards */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5 pt-0.5">
              {filteredScenarios.map((scenario) => (
                <AdventureCard
                  key={scenario.id}
                  scenario={scenario}
                  onSelect={handleSelectScenario}
                />
              ))}
            </div>
          </section>

          {/* C. Today's Word Section */}
          <ExploreWordCard
            onSeeMore={() => {
              onOpenActivity({
                title: 'Vocabulary Vault: Confident',
                subtitle: 'Synonyms, Antonyms, and Collocations',
                category: 'Vocabulary Deck',
                description: 'Deep dive into "confident" and its word family: confidence (noun), confidently (adverb), and self-confidence.',
              });
            }}
          />

          {/* D. Popular with Learners Section */}
          <PopularModulesSection
            modules={POPULAR_MODULES}
            onSelectModule={handleSelectPopular}
            onSeeAll={() => {
              onOpenActivity({
                title: 'Popular Community Modules',
                subtitle: 'Top Rated by Lexi Learners',
                category: 'Community Favorites',
                description: 'Browse the most active and highly rated interactive conversation scenarios and graded reading stories.',
              });
            }}
          />
        </>
      )}
    </div>
  );
};
