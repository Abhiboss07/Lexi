import { describe, it, expect } from 'vitest';
import {
  evaluateSpokenResponse,
  normalizeText,
} from './speakingEvaluationService';
import type { SpeakingPrompt } from '../data/speakingData';

describe('speakingEvaluationService', () => {
  const samplePrompt: SpeakingPrompt = {
    id: 'test-order',
    title: 'Ordering a Drink',
    cefrLevel: 'A1',
    levelBadge: 'A1 • Beginner',
    category: 'everyday',
    prompt: 'Order an oat milk latte to take away and ask how much it costs.',
    context: 'At a London coffee counter',
    modelResponse: 'Could I please have a medium oat milk latte to go? How much is that?',
    targetKeyPhrases: ['could i please have', 'oat milk latte', 'to go', 'how much is that'],
    audioAccent: 'en-GB',
    pronunciationTips: 'Link could I smoothly.',
    sampleHints: ['Could I please have...'],
  };

  it('normalizes text removing punctuation and casing', () => {
    expect(normalizeText("Could I, please, have an oat milk latte? It's $5!")).toBe(
      'could i please have an oat milk latte its 5'
    );
  });

  it('evaluates an empty spoken response gracefully', () => {
    const result = evaluateSpokenResponse('', samplePrompt);
    expect(result.overallScore).toBe(0);
    expect(result.isPassing).toBe(false);
    expect(result.matchedKeyPhrases).toEqual([]);
    expect(result.missingKeyPhrases.length).toBe(samplePrompt.targetKeyPhrases.length);
    expect(result.feedback).toContain('No spoken response detected');
  });

  it('evaluates an exact or near-exact match with high scores', () => {
    const spoken = 'Could I please have a medium oat milk latte to go? How much is that?';
    const result = evaluateSpokenResponse(spoken, samplePrompt);

    expect(result.overallScore).toBeGreaterThanOrEqual(90);
    expect(result.isPassing).toBe(true);
    expect(result.matchedKeyPhrases.length).toBe(4);
    expect(result.missingKeyPhrases.length).toBe(0);
    expect(result.wordOrderScore).toBeGreaterThanOrEqual(90);
    expect(result.feedback).toContain('Outstanding');
  });

  it('identifies missing target key phrases and provides practical tips', () => {
    const spoken = 'Can I have an oat milk latte?';
    const result = evaluateSpokenResponse(spoken, samplePrompt);

    expect(result.matchedKeyPhrases).toContain('oat milk latte');
    expect(result.missingKeyPhrases).toContain('how much is that');
    expect(result.missingKeyPhrases).toContain('to go');
    expect(result.improvementSuggestions.length).toBeGreaterThan(0);
    expect(result.improvementSuggestions[0]).toContain('Try including:');
  });

  it('penalizes severely jumbled word order', () => {
    // Completely reversed words
    const spoken = 'that is much How go to latte milk oat have please I Could';
    const result = evaluateSpokenResponse(spoken, samplePrompt);

    expect(result.wordOrderScore).toBeLessThan(50);
  });

  it('handles partial token matches in key phrases', () => {
    const spoken = 'Could I actually please have one oat milk latte to go?';
    const result = evaluateSpokenResponse(spoken, samplePrompt);

    expect(result.matchedKeyPhrases).toContain('could i please have');
    expect(result.matchedKeyPhrases).toContain('oat milk latte');
    expect(result.matchedKeyPhrases).toContain('to go');
  });
});
