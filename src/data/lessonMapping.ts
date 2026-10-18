import { LEXI_CURRICULUM } from './curriculum';
import type { CurriculumLesson } from '../types/curriculum';

/**
 * Maps interactive entry points (adventure cards, featured banners, journey cards)
 * to real curated curriculum lessons.
 */
export const ADVENTURE_LESSON_MAP: Record<string, string> = {
  // Explore Adventure Scenarios
  'at-the-airport': 'a2-u4-l2-airport-transit',
  'shopping-day': 'a1-u3-l3-shopping-day',
  'bakery-morning': 'a1-u3-l2-bakery',
  'morning-bakery': 'a1-u3-l2-bakery',
  'at-the-restaurant': 'a1-u3-l1-cafe-order',

  // Featured Home Banner
  'cafe-conversation': 'a1-u3-l1-cafe-order',

  // Continue Learning Card
  'everyday-conversations': 'a1-u2-l2-everyday-conversations',

  // Home Hero CTA (Primary recommended onboarding)
  'start-learning': 'a1-u1-l1-hello',

  // Explore Continue Your Journey
  'present-vs-past': 'a2-u6-l2-present-vs-past',
};

/**
 * Helper to retrieve mapped curriculum lesson for an adventure or shortcut ID.
 */
export function getMappedLessonForActivity(activityId: string): CurriculumLesson | undefined {
  const lessonId = ADVENTURE_LESSON_MAP[activityId];
  if (!lessonId) return undefined;
  return LEXI_CURRICULUM.lessons[lessonId];
}
