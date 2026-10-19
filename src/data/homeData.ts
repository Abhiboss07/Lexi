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
    id: 'word-quest',
    title: 'Word Quest',
    subtitle: 'Mini Language Game',
    iconAsset: '/assets/quick-quest.svg',
    routeId: 'word-quest',
  },
  {
    id: 'quick-notes',
    title: 'Quick Notes',
    subtitle: 'Personal Notebook',
    iconAsset: '/assets/quick-notes.svg',
    routeId: 'quick-notes',
  },
  {
    id: 'sketch-explain',
    title: 'Sketch & Explain',
    subtitle: 'Learning Canvas',
    iconAsset: '/assets/quick-sketch.svg',
    routeId: 'sketch-explain',
  },
  {
    id: 'daily-challenge',
    title: 'Daily Challenge',
    subtitle: 'One Small Win',
    iconAsset: '/assets/quick-challenge.svg',
    routeId: 'daily-challenge',
  },
];
