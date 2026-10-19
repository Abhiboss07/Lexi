import { describe, it, expect } from 'vitest';
import { searchCurriculum } from './curriculumSearchService';

describe('curriculumSearchService', () => {
  it('returns curated recommendations for empty queries', () => {
    const results = searchCurriculum('');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].type).toBeDefined();
  });

  it('matches practice studios when searching for studio keywords', () => {
    const results = searchCurriculum('conversation');
    const studioResult = results.find((r) => r.type === 'studio' && r.studioKey === 'conversation');
    expect(studioResult).toBeDefined();
    expect(studioResult?.title).toBe('AI Conversation Coach');
  });

  it('matches curriculum lessons by title keyword', () => {
    const results = searchCurriculum('greetings');
    const lessonResult = results.find((r) => r.type === 'lesson');
    expect(lessonResult).toBeDefined();
    expect(lessonResult?.lessonId).toBeDefined();
  });

  it('matches lessons by vocabulary content', () => {
    const results = searchCurriculum('coffee');
    const cafeLesson = results.find((r) => r.lessonId === 'a1-u3-l1-cafe-order');
    expect(cafeLesson).toBeDefined();
  });

  it('returns empty array when query has no matching lessons or studios', () => {
    const results = searchCurriculum('xyznonexistentquery999');
    expect(results).toHaveLength(0);
  });
});
