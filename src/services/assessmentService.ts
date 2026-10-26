import type {
  AssessmentResult,
  AssessmentSkill,
  AssessmentType,
  LearnerQuestionResponse,
  SkillScoreSummary,
  ActiveAssessmentDraft,
} from '../types/assessment';
import type { CEFRLevel } from '../types/curriculum';
import {
  ASSESSMENT_QUESTIONS,
  getStage1CalibrationQuestions,
  getStage2AdaptiveQuestions,
} from '../data/assessmentQuestionsData';
import { db } from '../db';
import { practiceRepository } from '../db/practiceRepository';
import { curriculumRepository } from '../db/curriculumRepository';

const DRAFT_STORAGE_KEY_PREFIX = 'lexi_assessment_draft_';

export interface IAssessmentStorage {
  getDraft(userId: string): ActiveAssessmentDraft | null;
  saveDraft(draft: ActiveAssessmentDraft): void;
  clearDraft(userId: string): void;
  saveResult(result: AssessmentResult): Promise<void>;
  getResults(userId: string): Promise<AssessmentResult[]>;
  getLatestResult(userId: string, type?: AssessmentType): Promise<AssessmentResult | null>;
}

export class LocalAssessmentStorage implements IAssessmentStorage {
  getDraft(userId: string): ActiveAssessmentDraft | null {
    try {
      const raw = localStorage.getItem(`${DRAFT_STORAGE_KEY_PREFIX}${userId}`);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  saveDraft(draft: ActiveAssessmentDraft): void {
    try {
      localStorage.setItem(`${DRAFT_STORAGE_KEY_PREFIX}${draft.userId}`, JSON.stringify(draft));
    } catch (e) {
      console.warn('Failed to save assessment draft to localStorage:', e);
    }
  }

  clearDraft(userId: string): void {
    try {
      localStorage.removeItem(`${DRAFT_STORAGE_KEY_PREFIX}${userId}`);
    } catch (e) {
      console.warn('Failed to clear assessment draft:', e);
    }
  }

  async saveResult(result: AssessmentResult): Promise<void> {
    if (db.assessmentRecords) {
      await db.assessmentRecords.put(result);
    }
  }

  async getResults(userId: string): Promise<AssessmentResult[]> {
    try {
      if ((db as any).assessmentRecords) {
        return await (db as any).assessmentRecords
          .where('userId')
          .equals(userId)
          .sortBy('completedAt')
          .then((items: AssessmentResult[]) => items.reverse());
      }
      return [];
    } catch {
      return [];
    }
  }

  async getLatestResult(userId: string, type?: AssessmentType): Promise<AssessmentResult | null> {
    try {
      const results = await this.getResults(userId);
      const filtered = type ? results.filter((r) => r.type === type) : results;
      return filtered[0] || null;
    } catch {
      return null;
    }
  }
}

export class AssessmentService {
  constructor(private storage: IAssessmentStorage = new LocalAssessmentStorage()) {}

  /**
   * Initializes or resumes an active placement assessment draft.
   */
  startPlacementAssessment(userId: string = 'local-learner-1'): ActiveAssessmentDraft {
    const existing = this.storage.getDraft(userId);
    if (existing && !existing.completed) {
      return existing;
    }

    const stage1Questions = getStage1CalibrationQuestions();
    const draft: ActiveAssessmentDraft = {
      id: `assess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId,
      type: 'cefr-placement',
      startedAt: new Date().toISOString(),
      stage: 1,
      questionIds: stage1Questions.map((q) => q.id),
      currentIndex: 0,
      responses: {},
      completed: false,
    };

    this.storage.saveDraft(draft);
    return draft;
  }

  /**
   * Records an answer for the current question in the active draft.
   */
  recordAnswer(
    draft: ActiveAssessmentDraft,
    questionId: string,
    selectedIndex: number,
    timeSpentMs?: number
  ): ActiveAssessmentDraft {
    const question = ASSESSMENT_QUESTIONS.find((q) => q.id === questionId);
    if (!question) return draft;

    const isCorrect = selectedIndex === question.correctIndex;
    const response: LearnerQuestionResponse = {
      questionId,
      skill: question.skill,
      cefrLevel: question.cefrLevel,
      selectedIndex,
      isCorrect,
      timeSpentMs,
      answeredAt: new Date().toISOString(),
    };

    const updatedResponses = {
      ...draft.responses,
      [questionId]: response,
    };

    // Check if Stage 1 is complete and needs Stage 2 adaptive branch
    let updatedQuestionIds = [...draft.questionIds];
    let updatedStage = draft.stage;

    if (draft.stage === 1) {
      const stage1Questions = getStage1CalibrationQuestions();
      const allStage1Answered = stage1Questions.every((q) => updatedResponses[q.id]);

      if (allStage1Answered && updatedQuestionIds.length === stage1Questions.length) {
        // Calculate Stage 1 accuracy to select Stage 2 branch
        const stage1Correct = stage1Questions.filter((q) => updatedResponses[q.id]?.isCorrect).length;
        const stage1Accuracy = Math.round((stage1Correct / stage1Questions.length) * 100);

        const stage2Questions = getStage2AdaptiveQuestions(stage1Accuracy);
        updatedQuestionIds = [...stage1Questions.map((q) => q.id), ...stage2Questions.map((q) => q.id)];
        updatedStage = 2;
      }
    }

    const isCompleted = updatedQuestionIds.every((id) => updatedResponses[id]);
    const nextIndex = isCompleted
      ? draft.currentIndex
      : Math.min(draft.currentIndex + 1, updatedQuestionIds.length - 1);

    const updatedDraft: ActiveAssessmentDraft = {
      ...draft,
      stage: updatedStage,
      questionIds: updatedQuestionIds,
      currentIndex: nextIndex,
      responses: updatedResponses,
      completed: isCompleted,
    };

    this.storage.saveDraft(updatedDraft);
    return updatedDraft;
  }

  /**
   * Evaluates completed assessment responses and produces the official AssessmentResult.
   */
  evaluateAssessment(draft: ActiveAssessmentDraft): AssessmentResult {
    const responsesList = Object.values(draft.responses);
    const totalQuestions = draft.questionIds.length;
    const totalCorrect = responsesList.filter((r) => r.isCorrect).length;
    const overallScorePercent = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    // Calculate Skill-by-Skill Breakdown
    const skills: AssessmentSkill[] = ['grammar', 'vocabulary', 'reading', 'listening'];
    const skillBreakdown = {} as Record<AssessmentSkill, SkillScoreSummary>;

    for (const skill of skills) {
      const skillResponses = responsesList.filter((r) => r.skill === skill);
      const skillTotal = skillResponses.length;
      const skillCorrect = skillResponses.filter((r) => r.isCorrect).length;
      const accuracyPercent = skillTotal > 0 ? Math.round((skillCorrect / skillTotal) * 100) : 0;

      let estimatedLevel: CEFRLevel = 'A1';
      if (accuracyPercent >= 80) estimatedLevel = 'B2';
      else if (accuracyPercent >= 65) estimatedLevel = 'B1';
      else if (accuracyPercent >= 45) estimatedLevel = 'A2';
      else estimatedLevel = 'A1';

      let strengthDescription = 'Building foundational comprehension.';
      let growthArea = 'Reinforce fundamental sentence structures and essential vocabulary.';
      let recommendedStudio: any = 'grammar';

      if (skill === 'grammar') {
        recommendedStudio = 'grammar';
        if (accuracyPercent >= 75) {
          strengthDescription = 'Strong grasp of verb tenses, conditionals, and agreement.';
          growthArea = 'Explore nuanced modal verbs and inversion.';
        } else {
          strengthDescription = 'Familiar with core present and past structures.';
          growthArea = 'Focus on irregular past forms and subject-verb agreement.';
        }
      } else if (skill === 'vocabulary') {
        recommendedStudio = 'vocabulary';
        if (accuracyPercent >= 75) {
          strengthDescription = 'Rich vocabulary breadth including collocations and idioms.';
          growthArea = 'Refine formal register and workplace terminology.';
        } else {
          strengthDescription = 'Solid daily vocabulary for common everyday contexts.';
          growthArea = 'Build essential verb collocations (make/do, take/get).';
        }
      } else if (skill === 'reading') {
        recommendedStudio = 'stories';
        if (accuracyPercent >= 75) {
          strengthDescription = 'Skilled at synthesizing extended texts and complex arguments.';
          growthArea = 'Practice fast skimming and technical editorial comprehension.';
        } else {
          strengthDescription = 'Understands straightforward public notices and messages.';
          growthArea = 'Practice finding key details in multi-paragraph emails.';
        }
      } else if (skill === 'listening') {
        recommendedStudio = 'listening';
        if (accuracyPercent >= 75) {
          strengthDescription = 'High audio comprehension across varied natural accents.';
          growthArea = 'Listen to fast-paced group dialogues and technical updates.';
        } else {
          strengthDescription = 'Catches core announcements and simple conversational cues.';
          growthArea = 'Train your ear on connected speech and number/time audio cues.';
        }
      }

      skillBreakdown[skill] = {
        skill,
        label: skill.charAt(0).toUpperCase() + skill.slice(1),
        totalQuestions: skillTotal,
        correctCount: skillCorrect,
        accuracyPercent,
        estimatedLevel,
        strengthDescription,
        growthArea,
        recommendedStudio,
      };
    }

    // Determine Multi-Skill Triangulated Level
    // Conservative placement: Requires balanced cross-skill evidence
    let estimatedCEFRLevel: CEFRLevel = 'A1';
    let recommendedStartingLevel: CEFRLevel = 'A1';
    let recommendedLessonId = 'a1-u1-l1-hello';
    let recommendedLessonTitle = 'Saying Hello & Personal Details';
    let rationale = 'Start with foundational English to build solid conversational confidence.';

    // Triangulation: Check minimum accuracy across skills
    const minSkillAccuracy = Math.min(...skills.map((s) => skillBreakdown[s]?.accuracyPercent || 0));

    if (overallScorePercent >= 85 && minSkillAccuracy >= 60) {
      estimatedCEFRLevel = 'B2';
      recommendedStartingLevel = 'B2';
      recommendedLessonId = 'a2-u3-l3-workplace-feedback';
      recommendedLessonTitle = 'Professional Communication & Workplace Fluency';
      rationale = 'Demonstrated advanced multi-skill proficiency across grammar, vocabulary, reading, and listening.';
    } else if (overallScorePercent >= 68 && minSkillAccuracy >= 40) {
      estimatedCEFRLevel = 'B1';
      recommendedStartingLevel = 'B1';
      recommendedLessonId = 'a2-u2-l3-daily-routines';
      recommendedLessonTitle = 'Intermediate Conversations & Complex Routines';
      rationale = 'Solid command of practical English with strong readiness for independent conversational fluency.';
    } else if (overallScorePercent >= 45) {
      estimatedCEFRLevel = 'A2';
      recommendedStartingLevel = 'A2';
      recommendedLessonId = 'a1-u2-l1-time';
      recommendedLessonTitle = 'Telling Time & Scheduling Daily Activities';
      rationale = 'Good baseline understanding of everyday English. Ready for practical travel and social interactions.';
    } else {
      estimatedCEFRLevel = 'A1';
      recommendedStartingLevel = 'A1';
      recommendedLessonId = 'a1-u1-l1-hello';
      recommendedLessonTitle = 'Saying Hello & Introductions';
      rationale = 'Strengthen your core foundation with guided A1 lessons before moving to complex scenarios.';
    }

    // Confidence Score based on question sample size and answer variance
    const confidenceScore = Math.min(100, Math.round(50 + totalQuestions * 3.5));

    const result: AssessmentResult = {
      id: draft.id,
      userId: draft.userId,
      type: draft.type,
      startedAt: draft.startedAt,
      completedAt: new Date().toISOString(),
      totalQuestions,
      totalCorrect,
      overallScorePercent,
      estimatedCEFRLevel,
      confidenceScore,
      stageReached: draft.stage,
      skillBreakdown,
      responses: responsesList,
      recommendedStartingLevel,
      recommendedLessonId,
      recommendedLessonTitle,
      rationale,
      isCertified: false,
      disclaimer:
        'This diagnostic assessment provides an estimated CEFR placement based on client-side linguistic evaluation. It is designed to calibrate your personal study path in Lexi and is not an accredited examination diploma.',
    };

    return result;
  }

  /**
   * Finalizes an active assessment, stores the result, and cleans up the active draft.
   */
  async submitAssessment(draft: ActiveAssessmentDraft): Promise<AssessmentResult> {
    const result = this.evaluateAssessment(draft);
    await this.storage.saveResult(result);
    this.storage.clearDraft(draft.userId);
    return result;
  }

  /**
   * Explicitly applies the assessment recommended starting level to the learner's profile.
   * NEVER called automatically or silently — strictly under the learner's explicit consent.
   */
  async applyPlacementLevel(userId: string, level: CEFRLevel): Promise<void> {
    try {
      // 1. Update practice preferences
      await practiceRepository.savePreferences(userId, {
        cefrLevel: level,
        updatedAt: new Date().toISOString(),
      });

      // 2. Update curriculum repository progression state
      const curr = await curriculumRepository.getLearnerProgress(userId);
      await curriculumRepository.saveLearnerProgress({
        ...curr,
        currentLevel: level,
        placement: {
          startingLevel: level,
          method: 'placement-test-preview',
          placedAt: new Date().toISOString(),
          isCertified: false,
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to apply placement level:', e);
    }
  }

  /**
   * Discards the active draft if the learner cancels or resets.
   */
  resetAssessment(userId: string): void {
    this.storage.clearDraft(userId);
  }

  /**
   * Retrieves assessment history for the learner.
   */
  async getLearnerAssessmentHistory(userId: string): Promise<AssessmentResult[]> {
    return this.storage.getResults(userId);
  }

  /**
   * Retrieves the most recent assessment result.
   */
  async getLatestAssessment(userId: string): Promise<AssessmentResult | null> {
    return this.storage.getLatestResult(userId);
  }
}

export const assessmentService = new AssessmentService();
