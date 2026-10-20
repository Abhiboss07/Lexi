import { db } from '../db';
import type {
  LearnerMistakeRecord,
  MistakeOccurrence,
  TurnFeedback,
  MistakeCategory,
} from '../types/conversationCoach';

export interface IMistakeStorage {
  getRecord(id: string): Promise<LearnerMistakeRecord | undefined>;
  getRecordsByUser(userId: string): Promise<LearnerMistakeRecord[]>;
  saveRecord(record: LearnerMistakeRecord): Promise<void>;
  deleteRecord(id: string): Promise<void>;
}

export class DexieMistakeStorage implements IMistakeStorage {
  async getRecord(id: string): Promise<LearnerMistakeRecord | undefined> {
    try {
      return await db.mistakeRecords.get(id);
    } catch {
      return undefined;
    }
  }

  async getRecordsByUser(userId: string): Promise<LearnerMistakeRecord[]> {
    try {
      return await db.mistakeRecords.where('userId').equals(userId).toArray();
    } catch {
      return [];
    }
  }

  async saveRecord(record: LearnerMistakeRecord): Promise<void> {
    try {
      await db.mistakeRecords.put(record);
    } catch (e) {
      console.warn('Failed to save mistake record to Dexie:', e);
    }
  }

  async deleteRecord(id: string): Promise<void> {
    try {
      await db.mistakeRecords.delete(id);
    } catch (e) {
      console.warn('Failed to delete mistake record from Dexie:', e);
    }
  }
}

export class InMemoryMistakeStorage implements IMistakeStorage {
  private records = new Map<string, LearnerMistakeRecord>();

  async getRecord(id: string): Promise<LearnerMistakeRecord | undefined> {
    return this.records.get(id);
  }

  async getRecordsByUser(userId: string): Promise<LearnerMistakeRecord[]> {
    return Array.from(this.records.values()).filter((r) => r.userId === userId);
  }

  async saveRecord(record: LearnerMistakeRecord): Promise<void> {
    this.records.set(record.id, record);
  }

  async deleteRecord(id: string): Promise<void> {
    this.records.delete(id);
  }

  clear() {
    this.records.clear();
  }
}

const CATEGORY_TITLES: Record<MistakeCategory, string> = {
  'preposition': 'Preposition Usage',
  'verb-tense': 'Verb Tense & Auxiliary Forms',
  'article': 'Singular & Countable Articles',
  'word-order': 'Indirect Question & Word Order',
  'collocation': 'Natural English Collocations',
  'formality': 'Social Formality & Politeness',
  'subject-verb-agreement': 'Subject-Verb Agreement',
};

export class MistakeTrackingService {
  constructor(private storage: IMistakeStorage = new DexieMistakeStorage()) {}

  /**
   * Records detected issues from a conversational turn.
   * Only turns with genuine grammatical or lexical issues are processed.
   */
  async recordTurnMistakes(
    userId: string,
    scenarioId: string,
    feedback: TurnFeedback,
    source: 'rule-based' | 'ai' = 'rule-based'
  ): Promise<LearnerMistakeRecord[]> {
    if (!feedback.detectedIssues || feedback.detectedIssues.length === 0) {
      return [];
    }

    const updatedRecords: LearnerMistakeRecord[] = [];
    const nowIso = new Date().toISOString();

    for (const issue of feedback.detectedIssues) {
      const recordId = `${userId}_${issue.patternKey}`;
      const existing = await this.storage.getRecord(recordId);

      const occurrence: MistakeOccurrence = {
        id: `occ_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        originalSentence: feedback.originalSentence,
        correctedSentence: feedback.correctedSentence || feedback.naturalAlternative,
        explanation: feedback.grammarExplanation || feedback.collocationSuggestion || feedback.formalityGuidance || issue.issue,
        scenarioId,
        occurredAt: nowIso,
        source,
      };

      let record: LearnerMistakeRecord;

      if (existing) {
        const nextFreq = existing.frequency + 1;
        record = {
          ...existing,
          frequency: nextFreq,
          isPersistent: nextFreq >= 2, // At least 2 verified occurrences
          lastOccurredAt: nowIso,
          occurrences: [occurrence, ...existing.occurrences].slice(0, 10), // keep latest 10
        };
      } else {
        record = {
          id: recordId,
          userId,
          category: issue.category,
          patternKey: issue.patternKey,
          title: CATEGORY_TITLES[issue.category] || 'English Grammar & Phrasing',
          description: occurrence.explanation,
          frequency: 1,
          occurrences: [occurrence],
          lastOccurredAt: nowIso,
          isPersistent: false, // Never diagnose persistent weakness from a single sentence!
          recommendedPracticeStudio:
            issue.category === 'collocation' || issue.category === 'formality'
              ? 'conversation'
              : 'grammar',
        };
      }

      await this.storage.saveRecord(record);
      updatedRecords.push(record);
    }

    return updatedRecords;
  }

  /**
   * Retrieves all mistake records for a user.
   */
  async getAllMistakes(userId: string): Promise<LearnerMistakeRecord[]> {
    return this.storage.getRecordsByUser(userId);
  }

  /**
   * Retrieves only validated persistent mistake patterns (frequency >= 2).
   */
  async getPersistentMistakes(userId: string): Promise<LearnerMistakeRecord[]> {
    const all = await this.storage.getRecordsByUser(userId);
    return all.filter((r) => r.isPersistent);
  }

  /**
   * Removes a mistake record when a learner successfully resolves it in practice.
   */
  async resolveMistake(userId: string, patternKey: string): Promise<void> {
    const recordId = `${userId}_${patternKey}`;
    await this.storage.deleteRecord(recordId);
  }
}

export const mistakeTrackingService = new MistakeTrackingService();
