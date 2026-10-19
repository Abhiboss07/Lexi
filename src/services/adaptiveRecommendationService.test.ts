import { describe, it, expect } from 'vitest';
import { generateAdaptiveRecommendation } from './adaptiveRecommendationService';
import type { PracticePreferences, PracticeSessionRecord } from '../types/practicePreferences';
import { DEFAULT_PRACTICE_PREFERENCES } from '../types/practicePreferences';

describe('Adaptive Recommendation Engine', () => {
  const basePrefs: PracticePreferences = {
    userId: 'test-user',
    ...DEFAULT_PRACTICE_PREFERENCES,
    cefrLevel: 'A2',
    defaultDifficulty: 'medium',
    defaultSessionLength: 'standard',
    dailyGoalMinutes: 15,
  };

  it('returns building_baseline status when fewer than 2 scored sessions exist', () => {
    const rec = generateAdaptiveRecommendation(basePrefs, []);
    expect(rec.status).toBe('building_baseline');
    expect(rec.sampleCount).toBe(0);
    expect(rec.suggestedDifficulty).toBe('medium');
    expect(rec.userAuthoritativeNotice).toContain('authoritative');
  });

  it('recommends step_up_ready when recent session scores exceed 85%', () => {
    const sessions: PracticeSessionRecord[] = [
      { id: '1', userId: 'test-user', category: 'grammar', difficulty: 'medium', sessionLength: 'standard', durationMinutes: 10, completedAt: '2026-10-19T10:00:00Z', score: 90 },
      { id: '2', userId: 'test-user', category: 'vocabulary', difficulty: 'medium', sessionLength: 'standard', durationMinutes: 10, completedAt: '2026-10-19T11:00:00Z', score: 95 },
      { id: '3', userId: 'test-user', category: 'listening', difficulty: 'medium', sessionLength: 'standard', durationMinutes: 10, completedAt: '2026-10-19T12:00:00Z', score: 88 },
    ];

    const rec = generateAdaptiveRecommendation(basePrefs, sessions);
    expect(rec.status).toBe('step_up_ready');
    expect(rec.suggestedDifficulty).toBe('hard');
    expect(rec.recentAverageScore).toBe(91);
    expect(rec.explanation).toContain('High accuracy detected');
  });

  it('recommends needs_support and hints when recent session scores fall below 65%', () => {
    const sessions: PracticeSessionRecord[] = [
      { id: '1', userId: 'test-user', category: 'grammar', difficulty: 'medium', sessionLength: 'standard', durationMinutes: 10, completedAt: '2026-10-19T10:00:00Z', score: 50 },
      { id: '2', userId: 'test-user', category: 'vocabulary', difficulty: 'medium', sessionLength: 'standard', durationMinutes: 10, completedAt: '2026-10-19T11:00:00Z', score: 60 },
    ];

    const rec = generateAdaptiveRecommendation(basePrefs, sessions);
    expect(rec.status).toBe('needs_support');
    expect(rec.suggestedDifficulty).toBe('easy');
    expect(rec.suggestedHints).toBe(true);
    expect(rec.recentAverageScore).toBe(55);
    expect(rec.explanation).toContain('reinforce');
  });

  it('recommends optimal_challenge when scores are in the 65%-84% sweet spot', () => {
    const sessions: PracticeSessionRecord[] = [
      { id: '1', userId: 'test-user', category: 'grammar', difficulty: 'medium', sessionLength: 'standard', durationMinutes: 10, completedAt: '2026-10-19T10:00:00Z', score: 75 },
      { id: '2', userId: 'test-user', category: 'vocabulary', difficulty: 'medium', sessionLength: 'standard', durationMinutes: 10, completedAt: '2026-10-19T11:00:00Z', score: 70 },
    ];

    const rec = generateAdaptiveRecommendation(basePrefs, sessions);
    expect(rec.status).toBe('optimal_challenge');
    expect(rec.suggestedDifficulty).toBe('medium');
    expect(rec.recentAverageScore).toBe(73);
  });
});
