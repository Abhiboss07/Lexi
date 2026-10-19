import { LEXI_CURRICULUM } from '../data/curriculum';
import type { CEFRLevel } from '../types/curriculum';
import type { PracticeCategoryKey } from '../components/practice/PracticeModals';

export interface CurriculumSearchResult {
  id: string;
  type: 'lesson' | 'studio' | 'unit';
  title: string;
  subtitle: string;
  category: string;
  levelBadge?: CEFRLevel | string;
  lessonId?: string;
  studioKey?: PracticeCategoryKey;
  unitId?: string;
  matchSnippet?: string;
}

const STUDIOS_CATALOG: Array<{
  key: PracticeCategoryKey;
  title: string;
  category: string;
  subtitle: string;
  keywords: string[];
}> = [
  {
    key: 'conversation',
    title: 'AI Conversation Coach',
    category: 'Speaking Studio',
    subtitle: 'Practice real-time spoken dialogue with supportive AI personas',
    keywords: ['conversation', 'chat', 'talk', 'speaking', 'speech', 'dialogue', 'fluency'],
  },
  {
    key: 'stories',
    title: 'Interactive Story Studio',
    category: 'Reading Studio',
    subtitle: 'Explore CEFR-graded stories with collaborative AI co-creation',
    keywords: ['stories', 'story', 'reading', 'reader', 'book', 'comprehension'],
  },
  {
    key: 'vocabulary',
    title: 'Vocabulary Practice Studio',
    category: 'Vocabulary Studio',
    subtitle: 'Multimodal recall circuit powered by FSRS spaced repetition',
    keywords: ['vocabulary', 'words', 'flashcards', 'fsrs', 'definitions', 'matching', 'terms'],
  },
  {
    key: 'grammar',
    title: 'Grammar Practice Studio',
    category: 'Grammar Studio',
    subtitle: 'Interactive rule explainers, token ordering, and error correction',
    keywords: ['grammar', 'tenses', 'prepositions', 'verbs', 'past', 'present', 'rules', 'syntax'],
  },
  {
    key: 'listening',
    title: 'Listening & Voice Coach',
    category: 'Listening Studio',
    subtitle: 'Authentic real-world audio scenarios with speed control & dictation',
    keywords: ['listening', 'listen', 'audio', 'voice', 'dictation', 'accent', 'pronunciation'],
  },
  {
    key: 'interview',
    title: 'Personal Interview Trainer',
    category: 'Career Studio',
    subtitle: 'STAR method interview simulation across technical and leadership tracks',
    keywords: ['interview', 'career', 'job', 'star method', 'resume', 'questions', 'work'],
  },
];

/**
 * Searches curriculum lessons, units, and practice studios for matching terms.
 */
export function searchCurriculum(query: string, maxResults = 8): CurriculumSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    // Return curated recommendations
    return [
      {
        id: 'rec-1',
        type: 'lesson',
        title: 'Real-World Greetings & Courtesies',
        subtitle: 'Polite welcomes and professional introductions',
        category: 'A1 • Social & Basics',
        levelBadge: 'A1',
        lessonId: 'a1-u1-l1-hello',
      },
      {
        id: 'rec-2',
        type: 'lesson',
        title: 'Ordering food at a café',
        subtitle: 'Coffee orders, asking questions, and paying politely',
        category: 'A1 • Food & Shopping',
        levelBadge: 'A1',
        lessonId: 'a1-u3-l1-cafe-order',
      },
      {
        id: 'rec-3',
        type: 'studio',
        title: 'AI Conversation Coach',
        subtitle: 'Practice friendly spoken conversations with Alex & Sophia',
        category: 'Speaking Studio',
        levelBadge: 'Studio',
        studioKey: 'conversation',
      },
      {
        id: 'rec-4',
        type: 'lesson',
        title: 'Asking for & Giving Directions',
        subtitle: 'Find your way around airports, stations, and cities',
        category: 'A2 • Travel & Directions',
        levelBadge: 'A2',
        lessonId: 'a2-u4-l1-directions',
      },
      {
        id: 'rec-5',
        type: 'studio',
        title: 'Grammar Practice Studio',
        subtitle: 'Rule explainers, token sentence ordering, and error correction',
        category: 'Grammar Studio',
        levelBadge: 'Studio',
        studioKey: 'grammar',
      },
    ];
  }

  const results: CurriculumSearchResult[] = [];

  // 1. Search Practice Studios
  for (const studio of STUDIOS_CATALOG) {
    if (
      studio.title.toLowerCase().includes(q) ||
      studio.category.toLowerCase().includes(q) ||
      studio.subtitle.toLowerCase().includes(q) ||
      studio.keywords.some((k) => k.includes(q) || q.includes(k))
    ) {
      results.push({
        id: `studio-${studio.key}`,
        type: 'studio',
        title: studio.title,
        subtitle: studio.subtitle,
        category: studio.category,
        levelBadge: 'Studio',
        studioKey: studio.key,
      });
    }
  }

  // 2. Search Curriculum Lessons
  for (const lesson of Object.values(LEXI_CURRICULUM.lessons)) {
    const titleMatch = lesson.title.toLowerCase().includes(q);
    const subtitleMatch = lesson.subtitle ? lesson.subtitle.toLowerCase().includes(q) : false;
    const descMatch = lesson.description.toLowerCase().includes(q);
    const vocabMatch = lesson.vocabulary?.some(
      (v) => v.word.toLowerCase().includes(q) || v.definition.toLowerCase().includes(q)
    );
    const grammarMatch = lesson.grammar?.some(
      (g) => g.topic.toLowerCase().includes(q) || g.ruleSummary.toLowerCase().includes(q)
    );

    if (titleMatch || subtitleMatch || descMatch || vocabMatch || grammarMatch) {
      const unit = LEXI_CURRICULUM.units[lesson.unitId];
      const categoryLabel = unit ? `${lesson.level} • ${unit.title}` : `${lesson.level} Lesson`;
      results.push({
        id: `lesson-${lesson.id}`,
        type: 'lesson',
        title: lesson.title,
        subtitle: lesson.subtitle || lesson.description,
        category: categoryLabel,
        levelBadge: lesson.level,
        lessonId: lesson.id,
      });
    }

    if (results.length >= maxResults * 2) break;
  }

  return results.slice(0, maxResults);
}
