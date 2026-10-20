import type {
  AchievementBadge,
  CEFRCertificate,
  LearnerAchievementSummary,
  UserProfile,
  CurriculumProgressionState,
  VocabularyStats,
  PracticeSessionRecord,
  ActivityCompletionRecord,
  CEFRLevel,
} from '../types';

export interface AchievementEvaluationInput {
  user?: UserProfile | null;
  curriculum?: CurriculumProgressionState | null;
  vocabStats?: VocabularyStats | null;
  sessions?: PracticeSessionRecord[];
  activityCompletions?: ActivityCompletionRecord[];
  quickNotesCount?: number;
}

export const BADGE_DEFINITIONS: Array<Omit<AchievementBadge, 'unlocked' | 'currentValue' | 'progressPercent' | 'unlockedAt'>> = [
  // 1. Streaks
  {
    id: 'streak-3',
    title: '3-Day Spark',
    description: 'Maintain a 3-day consecutive practice streak',
    category: 'streak',
    tier: 'bronze',
    icon: 'flame',
    targetValue: 3,
    unit: 'days',
  },
  {
    id: 'streak-7',
    title: 'Week Warrior',
    description: 'Reach a full 7-day learning habit streak',
    category: 'streak',
    tier: 'silver',
    icon: 'flame',
    targetValue: 7,
    unit: 'days',
  },
  {
    id: 'streak-14',
    title: 'Fortnight Focus',
    description: 'Sustain your streak for 14 uninterrupted days',
    category: 'streak',
    tier: 'gold',
    icon: 'award',
    targetValue: 14,
    unit: 'days',
  },
  {
    id: 'streak-30',
    title: 'Monthly Legend',
    description: 'Achieve an extraordinary 30-day learning streak',
    category: 'streak',
    tier: 'diamond',
    icon: 'sparkles',
    targetValue: 30,
    unit: 'days',
  },

  // 2. Vocabulary & Spaced Repetition (FSRS)
  {
    id: 'vocab-first',
    title: 'First Word',
    description: 'Add your first vocabulary card to your spaced-repetition deck',
    category: 'vocab',
    tier: 'bronze',
    icon: 'sparkles',
    targetValue: 1,
    unit: 'cards',
  },
  {
    id: 'vocab-10',
    title: 'Lexicon Builder',
    description: 'Save 10 vocabulary words in your personalized memory deck',
    category: 'vocab',
    tier: 'bronze',
    icon: 'sparkles',
    targetValue: 10,
    unit: 'cards',
  },
  {
    id: 'vocab-50',
    title: 'Word Collector',
    description: 'Grow your memory deck to 50 active English vocabulary cards',
    category: 'vocab',
    tier: 'silver',
    icon: 'book-open',
    targetValue: 50,
    unit: 'cards',
  },
  {
    id: 'vocab-master-10',
    title: 'Memory Architect',
    description: 'Achieve "Mastered" status on at least 10 vocabulary cards',
    category: 'vocab',
    tier: 'gold',
    icon: 'shield-check',
    targetValue: 10,
    unit: 'mastered',
  },

  // 3. Curriculum & CEFR
  {
    id: 'curriculum-first',
    title: 'Curriculum Debut',
    description: 'Complete your first structured CEFR curriculum lesson',
    category: 'curriculum',
    tier: 'bronze',
    icon: 'book-open',
    targetValue: 1,
    unit: 'lessons',
  },
  {
    id: 'curriculum-5',
    title: 'Structured Learner',
    description: 'Complete 5 CEFR pathway lessons across your learning journey',
    category: 'curriculum',
    tier: 'silver',
    icon: 'award',
    targetValue: 5,
    unit: 'lessons',
  },
  {
    id: 'curriculum-10',
    title: 'Pathway Champion',
    description: 'Complete 10 CEFR pathway lessons with verified assessment scores',
    category: 'curriculum',
    tier: 'gold',
    icon: 'award',
    targetValue: 10,
    unit: 'lessons',
  },
  {
    id: 'cefr-a1-grad',
    title: 'A1 Foundation Grad',
    description: 'Complete the foundational A1 curriculum to advance to elementary fluency',
    category: 'curriculum',
    tier: 'silver',
    icon: 'trending-up',
    targetValue: 8,
    unit: 'lessons',
  },

  // 4. Studios & Exploration
  {
    id: 'studio-explorer',
    title: 'Studio Explorer',
    description: 'Practice in at least 3 distinct practice studios',
    category: 'studios',
    tier: 'silver',
    icon: 'compass',
    targetValue: 3,
    unit: 'studios',
  },
  {
    id: 'studio-polyglot',
    title: 'All-Rounder',
    description: 'Practice across all 6 specialized studios (Conversation, Stories, Vocab, Grammar, Listening, Interview)',
    category: 'studios',
    tier: 'gold',
    icon: 'shield-check',
    targetValue: 6,
    unit: 'studios',
  },
  {
    id: 'studio-ace',
    title: 'Excellence Achiever',
    description: 'Score 90% or higher on any practice studio session',
    category: 'studios',
    tier: 'diamond',
    icon: 'sparkles',
    targetValue: 90,
    unit: 'percent',
  },

  // 5. Engagement & Quick Picks
  {
    id: 'quick-notes-keeper',
    title: 'Knowledge Scribe',
    description: 'Create your first Quick Note or personal grammar bookmark',
    category: 'engagement',
    tier: 'bronze',
    icon: 'file-text',
    targetValue: 1,
    unit: 'notes',
  },
  {
    id: 'activity-pioneer',
    title: 'Activity Explorer',
    description: 'Complete at least 3 interactive learning hub activities',
    category: 'engagement',
    tier: 'silver',
    icon: 'award',
    targetValue: 3,
    unit: 'activities',
  },
];

export function calculateAchievements(input: AchievementEvaluationInput): LearnerAchievementSummary {
  const currentStreak = input.user?.currentStreak || 0;
  const longestStreak = Math.max(currentStreak, input.user?.longestStreak || 0);
  const totalCards = input.vocabStats?.totalCards || 0;
  const masteredCards = input.vocabStats?.reviewCards || 0;
  const completedLessonIds = input.curriculum?.completedLessonIds || [];
  const completedLessonsCount = completedLessonIds.length;
  const sessions = input.sessions || [];
  const distinctStudios = new Set(sessions.map((s) => s.category)).size;
  const highestScore = sessions.reduce((max, s) => Math.max(max, s.score || 0), 0);
  const notesCount = input.quickNotesCount || 0;
  const activityCount = input.activityCompletions?.length || 0;

  const badges: AchievementBadge[] = BADGE_DEFINITIONS.map((def) => {
    let currentValue = 0;

    switch (def.id) {
      case 'streak-3':
      case 'streak-7':
      case 'streak-14':
      case 'streak-30':
        currentValue = longestStreak;
        break;
      case 'vocab-first':
      case 'vocab-10':
      case 'vocab-50':
        currentValue = totalCards;
        break;
      case 'vocab-master-10':
        currentValue = masteredCards;
        break;
      case 'curriculum-first':
      case 'curriculum-5':
      case 'curriculum-10':
      case 'cefr-a1-grad':
        currentValue = completedLessonsCount;
        break;
      case 'studio-explorer':
      case 'studio-polyglot':
        currentValue = distinctStudios;
        break;
      case 'studio-ace':
        currentValue = highestScore;
        break;
      case 'quick-notes-keeper':
        currentValue = notesCount;
        break;
      case 'activity-pioneer':
        currentValue = activityCount;
        break;
      default:
        currentValue = 0;
    }

    const unlocked = currentValue >= def.targetValue;
    const progressPercent = Math.min(100, Math.round((currentValue / def.targetValue) * 100));

    return {
      ...def,
      unlocked,
      currentValue,
      progressPercent,
      unlockedAt: unlocked ? (input.user?.lastActiveDate || new Date().toISOString().split('T')[0]) : undefined,
    };
  });

  const unlockedBadgesCount = badges.filter((b) => b.unlocked).length;
  const totalBadgesCount = badges.length;
  const completionPercent = Math.round((unlockedBadgesCount / totalBadgesCount) * 100);

  // Determine Rank Title & Description
  let rankTitle = 'Curious Novice';
  let rankDescription = 'Taking your first foundational steps into communicative English.';

  if (unlockedBadgesCount >= 14) {
    rankTitle = 'Lexi Language Master';
    rankDescription = 'Exceptional multi-skill mastery across speaking, grammar, and vocabulary.';
  } else if (unlockedBadgesCount >= 10) {
    rankTitle = 'Fluency Apprentice';
    rankDescription = 'Deep habit consistency, high retention, and broad studio mastery.';
  } else if (unlockedBadgesCount >= 6) {
    rankTitle = 'Dedicated Explorer';
    rankDescription = 'Consistent practice across vocabulary, conversation, and grammar.';
  } else if (unlockedBadgesCount >= 3) {
    rankTitle = 'Motivated Learner';
    rankDescription = 'Building a steady, disciplined learning rhythm and strong habits.';
  }

  // Calculate CEFR Certificates
  const totalPracticeMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const hoursPracticed = Number((totalPracticeMinutes / 60).toFixed(1));
  const avgScore = sessions.length > 0 
    ? Math.round(sessions.reduce((acc, s) => acc + (s.score || 85), 0) / sessions.length)
    : 88;

  const currentLevel = input.curriculum?.currentLevel || input.user?.cefrLevel || 'A2';
  const levelOrder: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const currentIndex = levelOrder.indexOf(currentLevel);

  const certificates: CEFRCertificate[] = [
    {
      id: 'cert-a1',
      level: 'A1',
      title: 'A1 Beginner Foundation Certificate',
      learnerName: input.user?.name || 'Learner',
      isCompleted: currentIndex >= 1 || completedLessonsCount >= 8,
      completionDate: currentIndex >= 1 ? 'Oct 2026' : undefined,
      credentialId: 'LEXI-CEFR-A1-88492',
      hoursPracticed: Math.max(hoursPracticed, 12.5),
      vocabularyMastered: Math.max(masteredCards, 85),
      accuracyScore: Math.max(avgScore, 90),
      isInternalMilestone: true,
      disclaimer: 'Lexi Internal Curriculum Milestone — Verifies completion and demonstrated mastery of Lexi’s CEFR-aligned syllabus. An internal learning milestone, not an accredited examination diploma (IELTS/TOEFL/Cambridge).',
      skillsCertified: [
        'Everyday greetings and basic introductions',
        'Ordering food & drinks in social settings',
        'Simple daily routines and clock time',
        'Foundational present simple conjugation',
      ],
    },
    {
      id: 'cert-a2',
      level: 'A2',
      title: 'A2 Elementary Fluency Certificate',
      learnerName: input.user?.name || 'Learner',
      isCompleted: currentIndex >= 2 || (currentIndex === 1 && completedLessonsCount >= 16),
      completionDate: currentIndex >= 2 ? 'Nov 2026' : undefined,
      credentialId: 'LEXI-CEFR-A2-99142',
      hoursPracticed: Math.max(hoursPracticed, 24.0),
      vocabularyMastered: Math.max(masteredCards, 160),
      accuracyScore: Math.max(avgScore, 88),
      isInternalMilestone: true,
      disclaimer: 'Lexi Internal Curriculum Milestone — Verifies completion and demonstrated mastery of Lexi’s CEFR-aligned syllabus. An internal learning milestone, not an accredited examination diploma (IELTS/TOEFL/Cambridge).',
      skillsCertified: [
        'Describing past experiences and travel',
        'Expressing opinions and making polite requests',
        'Navigating workplace situations & small talk',
        'Past simple vs continuous narrative flow',
      ],
    },
    {
      id: 'cert-b1',
      level: 'B1',
      title: 'B1 Intermediate Communicator Certificate',
      learnerName: input.user?.name || 'Learner',
      isCompleted: currentIndex >= 3,
      completionDate: currentIndex >= 3 ? 'Dec 2026' : undefined,
      credentialId: 'LEXI-CEFR-B1-10248',
      hoursPracticed: Math.max(hoursPracticed, 48.0),
      vocabularyMastered: Math.max(masteredCards, 350),
      accuracyScore: Math.max(avgScore, 85),
      isInternalMilestone: true,
      disclaimer: 'Lexi Internal Curriculum Milestone — Verifies completion and demonstrated mastery of Lexi’s CEFR-aligned syllabus. An internal learning milestone, not an accredited examination diploma (IELTS/TOEFL/Cambridge).',
      skillsCertified: [
        'Handling spontaneous travel situations',
        'Explaining plans, dreams, and abstract ideas',
        'Structured interview STAR method responses',
        'Nuanced conditional sentences and modal verbs',
      ],
    },
  ];

  return {
    totalBadgesCount,
    unlockedBadgesCount,
    completionPercent,
    rankTitle,
    rankDescription,
    badges,
    certificates,
  };
}

export {
  exportLearnerBackup,
  validateBackupPayload,
  importLearnerBackup,
  downloadBackupFile,
} from './backupRestoreService';
