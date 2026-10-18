import type { LearningShortcut, QuickPickItem, FeaturedActivity } from '../types';

export const LEARNING_SHORTCUTS: LearningShortcut[] = [
  {
    id: 'conversation',
    title: 'Conversation',
    iconName: 'Conversation',
    description: 'Practice real-life dialogue and speaking scenarios with natural feedback.',
  },
  {
    id: 'stories',
    title: 'Stories',
    iconName: 'Stories',
    description: 'Immerse in graded CEFR readers with audio narration and comprehension.',
  },
  {
    id: 'vocabulary',
    title: 'Vocabulary',
    iconName: 'Vocabulary',
    description: 'Master essential English terms with FSRS spaced repetition.',
  },
  {
    id: 'grammar',
    title: 'Grammar',
    iconName: 'Grammar',
    description: 'Clear, intuitive grammar rules without dry memorization.',
  },
  {
    id: 'listening',
    title: 'Listening',
    iconName: 'Listening',
    description: 'Train your ear with authentic accents and speed variations.',
  },
];

export const FEATURED_CAFE_ACTIVITY: FeaturedActivity = {
  id: 'cafe-conversation',
  eyebrow: 'FEATURED FOR YOU',
  title: 'Café Conversation',
  description: 'Learn how to order food, ask questions and have a casual chat in a café.',
  durationText: '5-8 min',
  difficultyText: 'Beginner',
  imageAsset: '/assets/cafe-conversation.png',
};

export const QUICK_PICKS: QuickPickItem[] = [
  {
    id: 'lets-talk',
    title: "Let's Talk",
    subtitle: 'Practice with AI',
    iconAsset: '/assets/quick-talk.svg',
    routeId: 'conversation-practice',
  },
  {
    id: 'short-stories',
    title: 'Short Stories',
    subtitle: 'Learn with fun',
    iconAsset: '/assets/quick-stories.svg',
    routeId: 'stories-reader',
  },
  {
    id: 'word-of-the-day',
    title: 'Word of the Day',
    subtitle: 'Expand vocabulary',
    iconAsset: '/assets/quick-vocabulary.svg',
    routeId: 'vocabulary-daily',
  },
  {
    id: 'listen-and-repeat',
    title: 'Listen & Repeat',
    subtitle: 'Improve your speaking',
    iconAsset: '/assets/quick-listening.svg',
    routeId: 'speech-shadowing',
  },
];
