import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryCurriculumRepository } from './curriculumRepository';

describe('Curriculum Persistence Repository (Offline-First Architecture)', () => {
  const TEST_USER_ID = 'test-persistence-user-1';
  let repository: InMemoryCurriculumRepository;

  beforeEach(() => {
    repository = new InMemoryCurriculumRepository();
  });

  it('retrieves default seeded progression state for a new learner', async () => {
    const progress = await repository.getLearnerProgress(TEST_USER_ID);
    expect(progress).toBeDefined();
    expect(progress.userId).toBe(TEST_USER_ID);
    expect(progress.currentLevel).toBe('A1');
    expect(progress.placement.startingLevel).toBe('A1');
    expect(progress.placement.isCertified).toBe(false);

    // Initial seed has Unit 1 complete and Unit 2 in progress
    expect(progress.completedLessonIds).toContain('a1-u1-l1-hello');
    expect(progress.completedLessonIds).toContain('a1-u1-l4-checkins');
    expect(progress.completedLessonIds).toContain('a1-u2-l2-everyday-conversations');
  });

  it('records lesson completion and persists to local repository', async () => {
    let progress = await repository.getLearnerProgress(TEST_USER_ID);
    expect(progress.completedLessonIds).not.toContain('a1-u2-l3-bus-stop');

    // Complete lesson a1-u2-l3-bus-stop with 95% score
    progress = await repository.recordLessonCompletion(TEST_USER_ID, 'a1-u2-l3-bus-stop', 95);

    expect(progress.completedLessonIds).toContain('a1-u2-l3-bus-stop');
    const record = progress.lessonRecords['a1-u2-l3-bus-stop'];
    expect(record).toBeDefined();
    expect(record.status).toBe('completed');
    expect(record.scorePercent).toBe(95);

    // Verify it persists by re-fetching from repository
    const fetched = await repository.getLearnerProgress(TEST_USER_ID);
    expect(fetched.completedLessonIds).toContain('a1-u2-l3-bus-stop');
  });

  it('updates the learner CEFR level safely', async () => {
    await repository.setLearnerLevel(TEST_USER_ID, 'A2');
    const progress = await repository.getLearnerProgress(TEST_USER_ID);
    expect(progress.currentLevel).toBe('A2');
  });
});
