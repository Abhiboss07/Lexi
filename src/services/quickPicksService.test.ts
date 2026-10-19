import { describe, it, expect } from 'vitest';
import {
  getTodayChallenge,
  evaluateDailyChallenge,
  getWordQuestQuestions,
  DAILY_CHALLENGE_PROMPTS,
} from './quickPicksService';
import { InMemoryQuickPicksRepository } from '../db/quickPicksRepository';
import type { QuickNote, SavedDrawing, DailyChallengeSubmission, WordQuestResult } from '../types/quickPicks';

describe('quickPicksService — Word Quest & Daily Challenge Logic', () => {
  it('returns a valid challenge prompt for every day of the week', () => {
    for (let day = 0; day < 7; day++) {
      // Mock date for day of week
      const date = new Date(2026, 9, 18 + day); // 2026-10-18 is Sunday (0)
      const challenge = getTodayChallenge(date);
      expect(challenge).toBeDefined();
      expect(challenge.title).toBeTruthy();
      expect(challenge.instructions).toBeTruthy();
      expect(challenge.minWords).toBeGreaterThan(0);
      expect(challenge.guidanceTips.length).toBeGreaterThan(0);
    }
  });

  it('evaluates learner daily challenge response with constructive score and feedback', () => {
    const prompt = DAILY_CHALLENGE_PROMPTS[1]; // Monday 3 sentences
    const highQualityResponse =
      'This morning I drank hot coffee before starting my design work. In the afternoon I completed an important project report. Tonight I will read an English short story.';
    const feedback = evaluateDailyChallenge(prompt, highQualityResponse);

    expect(feedback.score).toBeGreaterThanOrEqual(80);
    expect(feedback.strengths.length).toBeGreaterThan(0);
    expect(feedback.vocabularyUsed.length).toBeGreaterThan(0);
  });

  it('detects common errors such as "I am agree" and flags grammatical advice', () => {
    const prompt = DAILY_CHALLENGE_PROMPTS[5]; // Error correction challenge
    const incorrectResponse = 'I am agree with your opinion because this is very good idea for our project.';
    const feedback = evaluateDailyChallenge(prompt, incorrectResponse);

    expect(feedback.grammarNotes.some((g) => g.includes('I agree'))).toBe(true);
  });

  it('deterministically rotates Word Quest questions based on day seed', () => {
    const q1 = getWordQuestQuestions(3, 1);
    const q2 = getWordQuestQuestions(3, 1);
    expect(q1.map((q) => q.id)).toEqual(q2.map((q) => q.id));

    const qDifferentDay = getWordQuestQuestions(3, 5);
    expect(qDifferentDay.length).toBe(3);
  });
});

describe('InMemoryQuickPicksRepository — Persistence and CRUD', () => {
  it('performs CRUD on quick notes including pinning and topic filtering', async () => {
    const repo = new InMemoryQuickPicksRepository();
    const userId = 'user-test-1';

    const newNote: QuickNote = {
      id: 'note-1',
      userId,
      title: 'Preposition rule',
      body: 'Always use depend on, not depend of.',
      topic: 'grammar',
      isPinned: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await repo.saveNote(newNote);
    const notes = await repo.getNotes(userId);
    expect(notes.length).toBe(1);
    expect(notes[0].title).toBe('Preposition rule');
    expect(notes[0].isPinned).toBe(true);

    // Delete note
    await repo.deleteNote('note-1');
    const remaining = await repo.getNotes(userId);
    expect(remaining.length).toBe(0);
  });

  it('persists and retrieves saved drawings and metadata', async () => {
    const repo = new InMemoryQuickPicksRepository();
    const userId = 'user-test-1';

    const drawing: SavedDrawing = {
      id: 'draw-1',
      userId,
      title: 'My Desk',
      prompt: 'Draw desk',
      explanation: 'Coffee mug on desk',
      dataUrl: 'data:image/png;base64,sample',
      labels: ['mug', 'desk'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await repo.saveDrawing(drawing);
    const drawings = await repo.getDrawings(userId);
    expect(drawings.length).toBe(1);
    expect(drawings[0].title).toBe('My Desk');
    expect(drawings[0].labels).toContain('mug');
  });

  it('persists daily challenge submissions and word quest results', async () => {
    const repo = new InMemoryQuickPicksRepository();
    const userId = 'user-test-1';

    const sub: DailyChallengeSubmission = {
      id: 'challenge-2026-10-19',
      userId,
      date: '2026-10-19',
      challengeId: 'dc-mon-three-sentences',
      promptTitle: 'Three Sentences',
      userResponse: 'Sample answer text here',
      status: 'completed',
      score: 95,
      wordCount: 20,
      feedback: { strengths: ['Good'], improvements: [], grammarNotes: [], vocabularyUsed: [] },
      submittedAt: new Date().toISOString(),
    };

    await repo.saveDailyChallengeSubmission(sub);
    const fetched = await repo.getDailyChallengeSubmission(userId, '2026-10-19');
    expect(fetched).toBeDefined();
    expect(fetched?.score).toBe(95);

    const questRes: WordQuestResult = {
      id: 'wq-1',
      userId,
      date: '2026-10-19',
      score: 100,
      totalQuestions: 4,
      accuracy: 100,
      mode: 'choice',
      completedAt: new Date().toISOString(),
    };

    await repo.saveWordQuestResult(questRes);
    const questList = await repo.getWordQuestResults(userId);
    expect(questList.length).toBe(1);
    expect(questList[0].score).toBe(100);
  });
});
