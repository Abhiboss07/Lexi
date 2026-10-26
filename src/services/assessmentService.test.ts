import { describe, it, expect, beforeEach } from 'vitest';
import {
  AssessmentService,
  type IAssessmentStorage,
} from './assessmentService';
import {
  evaluateLessonMastery,
  evaluateUnitMastery,
  evaluateMilestoneCertificateEligibility,
} from './masteryService';
import type { ActiveAssessmentDraft, AssessmentResult } from '../types/assessment';
import type { CurriculumProgressionState } from '../types/curriculum';
import {
  getStage1CalibrationQuestions,
  getStage2AdaptiveQuestions,
} from '../data/assessmentQuestionsData';

class MockAssessmentStorage implements IAssessmentStorage {
  drafts = new Map<string, ActiveAssessmentDraft>();
  results = new Map<string, AssessmentResult[]>();

  getDraft(userId: string): ActiveAssessmentDraft | null {
    return this.drafts.get(userId) || null;
  }
  saveDraft(draft: ActiveAssessmentDraft): void {
    this.drafts.set(draft.userId, draft);
  }
  clearDraft(userId: string): void {
    this.drafts.delete(userId);
  }
  async saveResult(result: AssessmentResult): Promise<void> {
    const list = this.results.get(result.userId) || [];
    list.unshift(result);
    this.results.set(result.userId, list);
  }
  async getResults(userId: string): Promise<AssessmentResult[]> {
    return this.results.get(userId) || [];
  }
  async getLatestResult(userId: string): Promise<AssessmentResult | null> {
    const list = this.results.get(userId) || [];
    return list[0] || null;
  }
}

describe('AssessmentService & Adaptive Question Selection', () => {
  let mockStorage: MockAssessmentStorage;
  let service: AssessmentService;

  beforeEach(() => {
    mockStorage = new MockAssessmentStorage();
    service = new AssessmentService(mockStorage);
  });

  it('initializes a balanced Stage 1 core calibration with 8 multi-skill questions', () => {
    const draft = service.startPlacementAssessment('test-user');
    expect(draft.stage).toBe(1);
    expect(draft.questionIds.length).toBe(8);
    expect(draft.currentIndex).toBe(0);
    expect(draft.completed).toBe(false);

    const stage1Questions = getStage1CalibrationQuestions();
    expect(stage1Questions.length).toBe(8);

    // Verify multi-skill coverage in Stage 1
    const skills = new Set(stage1Questions.map((q) => q.skill));
    expect(skills.has('grammar')).toBe(true);
    expect(skills.has('vocabulary')).toBe(true);
    expect(skills.has('reading')).toBe(true);
    expect(skills.has('listening')).toBe(true);
  });

  it('conservatively branches to High Stage 2 (B1/B2) when Stage 1 score is >= 75%', () => {
    let draft = service.startPlacementAssessment('test-user');
    const stage1Questions = getStage1CalibrationQuestions();

    // Answer 7 out of 8 correctly (87.5% >= 75%)
    for (let i = 0; i < stage1Questions.length; i++) {
      const q = stage1Questions[i];
      const answerIndex = i === 0 ? (q.correctIndex + 1) % 4 : q.correctIndex; // 1 wrong
      draft = service.recordAnswer(draft, q.id, answerIndex);
    }

    expect(draft.stage).toBe(2);
    expect(draft.questionIds.length).toBeGreaterThan(8);
    // Should contain high branch questions
    const hasHighBranch = draft.questionIds.some((id) => id.startsWith('stage2-high'));
    expect(hasHighBranch).toBe(true);
  });

  it('conservatively branches to Foundational Stage 2 (A1) when Stage 1 score is < 50%', () => {
    let draft = service.startPlacementAssessment('test-user');
    const stage1Questions = getStage1CalibrationQuestions();

    // Answer 2 out of 8 correctly (25% < 50%)
    for (let i = 0; i < stage1Questions.length; i++) {
      const q = stage1Questions[i];
      const answerIndex = i < 2 ? q.correctIndex : (q.correctIndex + 1) % 4;
      draft = service.recordAnswer(draft, q.id, answerIndex);
    }

    expect(draft.stage).toBe(2);
    const hasLowBranch = draft.questionIds.some((id) => id.startsWith('stage2-low'));
    expect(hasLowBranch).toBe(true);
  });

  it('branches to Mid Stage 2 (A2 consolidation) when Stage 1 score is between 50% and 74%', () => {
    let draft = service.startPlacementAssessment('test-user');
    const stage1Questions = getStage1CalibrationQuestions();

    // Answer 5 out of 8 correctly (62.5%)
    for (let i = 0; i < stage1Questions.length; i++) {
      const q = stage1Questions[i];
      const answerIndex = i < 5 ? q.correctIndex : (q.correctIndex + 1) % 4;
      draft = service.recordAnswer(draft, q.id, answerIndex);
    }

    expect(draft.stage).toBe(2);
    const hasMidBranch = draft.questionIds.some((id) => id.startsWith('stage2-mid'));
    expect(hasMidBranch).toBe(true);
  });

  it('evaluates completed assessment with multi-skill triangulation and unofficial disclaimer', async () => {
    let draft = service.startPlacementAssessment('test-user');

    // Answer all questions correctly across all stages
    while (!draft.completed) {
      const currentQId = draft.questionIds[draft.currentIndex];
      const q = getStage1CalibrationQuestions()
        .concat(getStage2AdaptiveQuestions(100))
        .find((item) => item.id === currentQId);
      if (!q) break;
      draft = service.recordAnswer(draft, currentQId, q.correctIndex);
    }

    const result = await service.submitAssessment(draft);
    expect(result.overallScorePercent).toBe(100);
    expect(result.estimatedCEFRLevel).toBe('B2');
    expect(result.isCertified).toBe(false);
    expect(result.disclaimer).toContain('not an accredited examination diploma');
    expect(result.skillBreakdown.grammar.accuracyPercent).toBe(100);
    expect(result.skillBreakdown.listening.accuracyPercent).toBe(100);
    expect(result.skillBreakdown.reading.accuracyPercent).toBe(100);
    expect(result.skillBreakdown.vocabulary.accuracyPercent).toBe(100);

    // Active draft should be cleared after submission
    expect(mockStorage.getDraft('test-user')).toBeNull();
  });

  it('prevents assigning B2 if a core skill is failing (multi-skill triangulation guard)', () => {
    let draft = service.startPlacementAssessment('test-user');
    const questions = getStage1CalibrationQuestions();

    // Answer grammar, vocab, reading correctly, but deliberately fail all listening questions
    for (const q of questions) {
      if (q.skill === 'listening') {
        draft = service.recordAnswer(draft, q.id, (q.correctIndex + 1) % 4);
      } else {
        draft = service.recordAnswer(draft, q.id, q.correctIndex);
      }
    }

    const result = service.evaluateAssessment(draft);
    // Even if overall accuracy is high, listening is 0% so minSkillAccuracy < 40%
    // Guard prevents over-placing to B2
    expect(result.estimatedCEFRLevel).not.toBe('B2');
    expect(result.skillBreakdown.listening.accuracyPercent).toBe(0);
  });

  it('resumes interrupted draft from storage without losing already answered questions', () => {
    let draft = service.startPlacementAssessment('resume-user');
    draft = service.recordAnswer(draft, draft.questionIds[0], 1);
    draft = service.recordAnswer(draft, draft.questionIds[1], 2);

    // Simulate page reload
    const resumed = service.startPlacementAssessment('resume-user');
    expect(resumed.id).toBe(draft.id);
    expect(Object.keys(resumed.responses).length).toBe(2);
    expect(resumed.currentIndex).toBe(2);
  });
});

describe('MasteryService & Verified Learning Mastery', () => {
  it('distinguishes lesson completion from demonstrated verified mastery', () => {
    // 1 attempt with 75% -> passing/proficient, but not yet mastered
    const singlePass = evaluateLessonMastery('a1-u1-l1', {
      lessonId: 'a1-u1-l1',
      status: 'completed',
      scorePercent: 75,
      completedAt: new Date().toISOString(),
      attempts: 1,
      lastActivityIndex: 3,
    });
    expect(singlePass.status).toBe('proficient');
    expect(singlePass.demonstratedConsistency).toBe(false);
    expect(singlePass.revisionRecommended).toBe(true);

    // 2 consistent attempts with >= 80% -> verified mastered
    const mastered = evaluateLessonMastery('a1-u1-l1', {
      lessonId: 'a1-u1-l1',
      status: 'completed',
      scorePercent: 85,
      completedAt: new Date().toISOString(),
      attempts: 2,
      lastActivityIndex: 3,
    });
    expect(mastered.status).toBe('mastered');
    expect(mastered.demonstratedConsistency).toBe(true);
    expect(mastered.revisionRecommended).toBe(false);
  });

  it('calculates unit-level mastery accurately across lessons', () => {
    const mockProgressionState: CurriculumProgressionState = {
      userId: 'test-user',
      currentLevel: 'A1',
      placement: { startingLevel: 'A1', method: 'self-selected', placedAt: '', isCertified: false },
      completedLessonIds: ['a1-u1-l1-hello', 'a1-u1-l2-introductions', 'a1-u1-l3-courtesies', 'a1-u1-l4-checkins'],
      lessonRecords: {
        'a1-u1-l1-hello': { lessonId: 'a1-u1-l1-hello', status: 'completed', scorePercent: 90, attempts: 2, lastActivityIndex: 3 },
        'a1-u1-l2-introductions': { lessonId: 'a1-u1-l2-introductions', status: 'completed', scorePercent: 85, attempts: 2, lastActivityIndex: 3 },
        'a1-u1-l3-courtesies': { lessonId: 'a1-u1-l3-courtesies', status: 'completed', scorePercent: 88, attempts: 2, lastActivityIndex: 3 },
        'a1-u1-l4-checkins': { lessonId: 'a1-u1-l4-checkins', status: 'completed', scorePercent: 92, attempts: 2, lastActivityIndex: 3 },
      },
      updatedAt: new Date().toISOString(),
    };

    const unitReport = evaluateUnitMastery('a1-unit-1', mockProgressionState);
    expect(unitReport.totalLessons).toBe(4);
    expect(unitReport.masteredLessonsCount).toBe(4);
    expect(unitReport.unitMasteryPercent).toBe(100);
    expect(unitReport.isUnitMastered).toBe(true);
  });

  it('distinguishes internal milestone certificates with explicit disclaimer', () => {
    const mockProgressionState: CurriculumProgressionState = {
      userId: 'test-user',
      currentLevel: 'A1',
      placement: { startingLevel: 'A1', method: 'self-selected', placedAt: '', isCertified: false },
      completedLessonIds: [],
      lessonRecords: {},
      updatedAt: new Date().toISOString(),
    };

    const eligibility = evaluateMilestoneCertificateEligibility('A1', mockProgressionState);
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.disclaimer).toContain('Lexi Internal Curriculum Milestone');
    expect(eligibility.disclaimer).toContain('not an accredited examination diploma');
  });
});
