import type { DailyPracticeCategory, DailyPracticeOption } from '../types/dailyPractice';
import { vocabularyRepository } from '../db/vocabularyRepository';
import { practiceRepository } from '../db/practiceRepository';
import { incrementUserStreak } from '../db';
import { LISTENING_SCENARIOS } from '../components/practice/ListeningVoiceStudioModal';
import { CONVERSATION_SCENARIOS } from '../components/practice/ConversationCoachModal';

/**
 * Returns user's local date as ISO YYYY-MM-DD
 * Safely respects local browser timezone and calendar day.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Deterministic integer hash from a date string (e.g. "2026-10-19")
 */
export function getDateSeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export interface DailyVocabularyTopic {
  id: string;
  title: string;
  cefr: string;
  theme: string;
  description: string;
}

export const DAILY_VOCABULARY_TOPICS: DailyVocabularyTopic[] = [
  {
    id: 'routines',
    title: 'Daily Routines & Time',
    cefr: 'A1-A2',
    theme: 'Everyday Life',
    description: 'Essential verbs and temporal expressions for describing daily habits.',
  },
  {
    id: 'dining',
    title: 'Café & Food Culture',
    cefr: 'A2-B1',
    theme: 'Dining & Social',
    description: 'Polite ordering, coffee terms, dietary requests, and menu navigation.',
  },
  {
    id: 'workplace',
    title: 'Collaborative Workplace',
    cefr: 'B1-B2',
    theme: 'Professional English',
    description: 'Action items, stakeholder updates, feedback phrasing, and deadlines.',
  },
  {
    id: 'travel',
    title: 'Transit & Wayfinding',
    cefr: 'A2-B1',
    theme: 'Travel & Exploration',
    description: 'Airport departures, platform announcements, directions, and tickets.',
  },
  {
    id: 'mindset',
    title: 'Curiosity & Growth',
    cefr: 'B1-B2',
    theme: 'Personal Learning',
    description: 'Expressing goals, reflections, perseverance, and communication milestones.',
  },
];

export class DailyPracticeService {
  private vocabRepo: typeof vocabularyRepository;
  private practiceRepo: typeof practiceRepository;

  constructor(
    vocabRepo: any = vocabularyRepository,
    practiceRepo: any = practiceRepository
  ) {
    this.vocabRepo = vocabRepo;
    this.practiceRepo = practiceRepo;
  }

  /**
   * Retrieves today's 3 daily practice options (Vocabulary, Listening, Speaking)
   * with real persistence status and deterministic rotation.
   */
  async getDailyPracticeOptions(
    userId: string = 'local-learner-1',
    targetDate: Date = new Date()
  ): Promise<DailyPracticeOption[]> {
    const dateStr = getLocalDateString(targetDate);
    const seed = getDateSeed(dateStr);

    // 1. Fetch user's due cards and today's completed practice sessions
    const [dueCards, todaySessions] = await Promise.all([
      this.vocabRepo.getDueCards(userId, targetDate).catch(() => []),
      this.practiceRepo.getSessions(userId, 50).catch(() => []),
    ]);

    // Sessions completed on this target date (matching daily activityId or completed on this dateStr)
    const isVocabDone = todaySessions.some(
      (s) => s.activityId === `daily-vocabulary-${dateStr}` || (s.category === 'vocabulary' && s.activityId?.includes(dateStr))
    );
    const isListeningDone = todaySessions.some(
      (s) => s.activityId === `daily-listening-${dateStr}` || (s.category === 'listening' && s.activityId?.includes(dateStr))
    );
    const isSpeakingDone = todaySessions.some(
      (s) => s.activityId === `daily-speaking-${dateStr}` || (s.category === 'conversation' && s.activityId?.includes(dateStr))
    );

    // 2. Vocabulary Selection
    const vocabTopicIndex = seed % DAILY_VOCABULARY_TOPICS.length;
    const vocabTopic = DAILY_VOCABULARY_TOPICS[vocabTopicIndex];
    let vocabBadge = 'Ready';
    let vocabDesc = vocabTopic.description;
    let vocabTitle = 'Vocabulary';

    if (isVocabDone) {
      vocabBadge = '✓ Done';
    } else if (dueCards.length > 0) {
      vocabBadge = `${dueCards.length} Due`;
      vocabDesc = `Review ${dueCards.length} due word${dueCards.length > 1 ? 's' : ''} in your FSRS memory deck.`;
    } else {
      vocabBadge = 'Ready';
      vocabDesc = `Daily Focus: ${vocabTopic.title}. Practice definitions, matching, and sentence writing.`;
    }

    // 3. Listening Selection (rotated deterministically across LISTENING_SCENARIOS)
    const listeningIndex = seed % LISTENING_SCENARIOS.length;
    const listeningScenario = LISTENING_SCENARIOS[listeningIndex];
    let listeningBadge = isListeningDone ? '✓ Done' : 'Ready';

    // 4. Speaking Selection (rotated deterministically across CONVERSATION_SCENARIOS)
    const speakingIndex = seed % CONVERSATION_SCENARIOS.length;
    const speakingScenario = CONVERSATION_SCENARIOS[speakingIndex];
    let speakingBadge = isSpeakingDone ? '✓ Done' : 'Ready';

    return [
      {
        id: 'vocabulary',
        title: vocabTitle,
        badgeText: vocabBadge,
        status: isVocabDone ? 'completed' : 'ready',
        topicTitle: dueCards.length > 0 ? 'FSRS Due Review' : vocabTopic.title,
        description: vocabDesc,
        dueCount: dueCards.length,
        durationMinutes: 3,
      },
      {
        id: 'listening',
        title: 'Listening',
        badgeText: listeningBadge,
        status: isListeningDone ? 'completed' : 'ready',
        topicTitle: listeningScenario.title,
        description: `${listeningScenario.scenario} • ${listeningScenario.level}.`,
        durationMinutes: 3,
      },
      {
        id: 'speaking',
        title: 'Speaking',
        badgeText: speakingBadge,
        status: isSpeakingDone ? 'completed' : 'ready',
        topicTitle: speakingScenario.title,
        description: `Chat with ${speakingScenario.partner} (${speakingScenario.partnerRole}) • Speech or text response.`,
        durationMinutes: 3,
      },
    ];
  }

  /**
   * Persists completion of a daily practice activity and increments the user's streak.
   */
  async recordDailyCompletion(
    userId: string = 'local-learner-1',
    category: DailyPracticeCategory,
    score: number = 90,
    targetDate: Date = new Date()
  ): Promise<void> {
    const dateStr = getLocalDateString(targetDate);
    const activityId = `daily-${category}-${dateStr}`;

    await this.practiceRepo.recordSession({
      userId,
      category: category === 'speaking' ? 'conversation' : category,
      activityId,
      difficulty: 'medium',
      sessionLength: 'quick',
      durationMinutes: 3,
      score,
      completedAt: targetDate.toISOString(),
    });

    try {
      await incrementUserStreak();
    } catch {
      // In-memory or non-browser fallback
    }
  }
}

export const dailyPracticeService = new DailyPracticeService();
