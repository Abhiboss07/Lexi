import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryPracticeRepository } from './practiceRepository';
import type { PracticeDifficulty, PracticeSessionLength } from '../types/practicePreferences';

describe('PracticeRepository (Phase B)', () => {
  const testUserId = 'test-learner-phase-b';
  let repo: InMemoryPracticeRepository;

  beforeEach(() => {
    repo = new InMemoryPracticeRepository();
  });

  it('provides default preferences when none exist', async () => {
    const prefs = await repo.getPreferences(testUserId);
    expect(prefs.userId).toBe(testUserId);
    expect(prefs.defaultDifficulty).toBe('medium');
    expect(prefs.defaultSessionLength).toBe('standard');
    expect(prefs.dailyGoalMinutes).toBe(15);
    expect(prefs.reminderFrequency).toBe('off');
  });

  it('selects and saves Easy, Medium, and Hard difficulty levels', async () => {
    const difficulties: PracticeDifficulty[] = ['easy', 'hard', 'medium'];

    for (const diff of difficulties) {
      const updated = await repo.savePreferences(testUserId, {
        defaultDifficulty: diff,
      });
      expect(updated.defaultDifficulty).toBe(diff);

      const reloaded = await repo.getPreferences(testUserId);
      expect(reloaded.defaultDifficulty).toBe(diff);
    }
  });

  it('saves and restores daily goals and session-length choices', async () => {
    const lengths: PracticeSessionLength[] = ['quick', 'extended', 'standard'];

    for (const len of lengths) {
      await repo.savePreferences(testUserId, {
        defaultSessionLength: len,
        dailyGoalMinutes: len === 'quick' ? 5 : len === 'standard' ? 15 : 30,
      });

      const reloaded = await repo.getPreferences(testUserId);
      expect(reloaded.defaultSessionLength).toBe(len);
      expect(reloaded.dailyGoalMinutes).toBe(len === 'quick' ? 5 : len === 'standard' ? 15 : 30);
    }
  });

  it('records single-session difficulty override without overwriting default preferences', async () => {
    // 1. Set user default difficulty to 'medium'
    await repo.savePreferences(testUserId, {
      defaultDifficulty: 'medium',
      defaultSessionLength: 'standard',
    });

    // 2. User plays an 'easy' session as an override
    const session = await repo.recordSession({
      userId: testUserId,
      category: 'conversation',
      difficulty: 'easy',
      sessionLength: 'quick',
      durationMinutes: 5,
      score: 95,
      notes: 'Single session override to easy',
    });

    expect(session.difficulty).toBe('easy');
    expect(session.durationMinutes).toBe(5);

    // 3. User default difficulty remains 'medium'
    const userPrefs = await repo.getPreferences(testUserId);
    expect(userPrefs.defaultDifficulty).toBe('medium');
    expect(userPrefs.defaultSessionLength).toBe('standard');
  });

  it('accumulates daily practice minutes accurately across recorded sessions', async () => {
    await repo.recordSession({
      userId: testUserId,
      category: 'conversation',
      difficulty: 'medium',
      sessionLength: 'quick',
      durationMinutes: 5,
    });

    await repo.recordSession({
      userId: testUserId,
      category: 'stories',
      difficulty: 'hard',
      sessionLength: 'standard',
      durationMinutes: 10,
    });

    const totalMinutes = await repo.getTodayPracticeMinutes(testUserId);
    expect(totalMinutes).toBe(15);
  });

  it('updates and persists CEFR level without corrupting other preferences', async () => {
    const updated = await repo.savePreferences(testUserId, {
      cefrLevel: 'B2',
    });
    expect(updated.cefrLevel).toBe('B2');

    const reloaded = await repo.getPreferences(testUserId);
    expect(reloaded.cefrLevel).toBe('B2');
    expect(reloaded.defaultDifficulty).toBe('medium'); // preserved
  });

  it('saves correction preferences, hint toggles, input modes, and practice days', async () => {
    const updated = await repo.savePreferences(testUserId, {
      correctionTiming: 'end_of_session',
      explanationDepth: 'detailed',
      hintsEnabled: false,
      inputMode: 'voice_first',
      practiceDays: ['Mon', 'Wed', 'Fri'],
    });

    expect(updated.correctionTiming).toBe('end_of_session');
    expect(updated.explanationDepth).toBe('detailed');
    expect(updated.hintsEnabled).toBe(false);
    expect(updated.inputMode).toBe('voice_first');
    expect(updated.practiceDays).toEqual(['Mon', 'Wed', 'Fri']);

    const reloaded = await repo.getPreferences(testUserId);
    expect(reloaded.correctionTiming).toBe('end_of_session');
    expect(reloaded.explanationDepth).toBe('detailed');
    expect(reloaded.hintsEnabled).toBe(false);
    expect(reloaded.practiceDays).toEqual(['Mon', 'Wed', 'Fri']);
  });

  it('sanitizes and validates malformed or invalid inputs with graceful fallbacks', async () => {
    const updated = await repo.savePreferences(testUserId, {
      defaultDifficulty: 'super_hard' as any,
      dailyGoalMinutes: 999 as any,
      correctionTiming: 'invalid_timing' as any,
    });

    // Should fall back to valid values
    expect(updated.defaultDifficulty).toBe('medium');
    expect(updated.dailyGoalMinutes).toBe(15);
    expect(updated.correctionTiming).toBe('immediate');
  });
});
