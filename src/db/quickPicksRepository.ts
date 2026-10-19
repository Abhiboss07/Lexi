import type { Table } from 'dexie';
import { db } from './index';
import type {
  QuickNote,
  SavedDrawing,
  DailyChallengeSubmission,
  WordQuestResult,
  ActivityCompletionRecord,
  BookmarkedIdiomRecord,
} from '../types/quickPicks';

export interface IQuickPicksRepository {
  getNotes(userId: string): Promise<QuickNote[]>;
  getNote(id: string): Promise<QuickNote | undefined>;
  saveNote(note: QuickNote): Promise<void>;
  deleteNote(id: string): Promise<void>;

  getDrawings(userId: string): Promise<SavedDrawing[]>;
  getDrawing(id: string): Promise<SavedDrawing | undefined>;
  saveDrawing(drawing: SavedDrawing): Promise<void>;
  deleteDrawing(id: string): Promise<void>;

  getDailyChallengeSubmission(userId: string, date: string): Promise<DailyChallengeSubmission | undefined>;
  saveDailyChallengeSubmission(submission: DailyChallengeSubmission): Promise<void>;

  getWordQuestResults(userId: string): Promise<WordQuestResult[]>;
  saveWordQuestResult(result: WordQuestResult): Promise<void>;

  // Activity Hub Completions & Deduplication
  getActivityCompletion(userId: string, activityId: string, date: string): Promise<ActivityCompletionRecord | undefined>;
  recordActivityCompletion(completion: ActivityCompletionRecord): Promise<void>;
  getAllActivityCompletions(userId: string): Promise<ActivityCompletionRecord[]>;

  // Idioms Bookmarks
  getBookmarkedIdioms(userId: string): Promise<BookmarkedIdiomRecord[]>;
  saveBookmarkedIdiom(record: BookmarkedIdiomRecord): Promise<void>;
  deleteBookmarkedIdiom(userId: string, expression: string): Promise<void>;
}

export const STARTER_NOTES: Omit<QuickNote, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Say "I agree", not "I am agree"',
    body: 'In English, "agree" is a verb, not an adjective. So say:\n• "I agree with you." (Correct)\n• "I don\'t agree." (Correct)\nAvoid saying "I am agree".',
    exampleSentence: 'I completely agree with your suggestion for the team project.',
    newWords: 'agree, disagree, consensus',
    topic: 'grammar',
    category: 'grammar',
    isPinned: true,
  },
  {
    title: 'Café & Restaurant Etiquette',
    body: 'When asking for something politely in English, use "Could I please have...?" or "I\'d like...". Also remember:\n• "On the house" means free of charge provided by the café.\n• "To go" or "takeaway" means packed for takeout.',
    exampleSentence: 'Could I please have an iced Americano with oat milk to go?',
    newWords: 'on the house, takeaway, decaf',
    topic: 'idiom',
    category: 'vocabulary',
    linkedVocabWord: 'request',
    isPinned: false,
  },
];

export class DexieQuickPicksRepository implements IQuickPicksRepository {
  private get notesTable(): Table<QuickNote, string> {
    return db.quickNotes;
  }

  private get drawingsTable(): Table<SavedDrawing, string> {
    return db.savedDrawings;
  }

  private get challengesTable(): Table<DailyChallengeSubmission, string> {
    return db.dailyChallenges;
  }

  private get questResultsTable(): Table<WordQuestResult, string> {
    return db.wordQuestResults;
  }

  private get completionsTable(): Table<ActivityCompletionRecord, string> {
    return db.activityCompletions;
  }

  private get bookmarksTable(): Table<BookmarkedIdiomRecord, string> {
    return db.bookmarkedIdioms;
  }

  async getNotes(userId: string): Promise<QuickNote[]> {
    const existing = await this.notesTable.where('userId').equals(userId).toArray();
    if (existing.length > 0) {
      return existing.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    }

    // Auto-seed starter notes
    const seeded: QuickNote[] = [];
    const now = new Date().toISOString();
    for (let i = 0; i < STARTER_NOTES.length; i++) {
      const s = STARTER_NOTES[i];
      const note: QuickNote = {
        id: `note-${userId}-${i + 1}`,
        userId,
        ...s,
        createdAt: now,
        updatedAt: now,
      };
      await this.notesTable.put(note);
      seeded.push(note);
    }
    return seeded;
  }

  async getNote(id: string): Promise<QuickNote | undefined> {
    return this.notesTable.get(id);
  }

  async saveNote(note: QuickNote): Promise<void> {
    await this.notesTable.put(note);
  }

  async deleteNote(id: string): Promise<void> {
    await this.notesTable.delete(id);
  }

  async getDrawings(userId: string): Promise<SavedDrawing[]> {
    const drawings = await this.drawingsTable.where('userId').equals(userId).toArray();
    return drawings.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getDrawing(id: string): Promise<SavedDrawing | undefined> {
    return this.drawingsTable.get(id);
  }

  async saveDrawing(drawing: SavedDrawing): Promise<void> {
    await this.drawingsTable.put(drawing);
  }

  async deleteDrawing(id: string): Promise<void> {
    await this.drawingsTable.delete(id);
  }

  async getDailyChallengeSubmission(userId: string, date: string): Promise<DailyChallengeSubmission | undefined> {
    const all = await this.challengesTable.where('userId').equals(userId).toArray();
    return all.find((c) => c.date === date);
  }

  async saveDailyChallengeSubmission(submission: DailyChallengeSubmission): Promise<void> {
    await this.challengesTable.put(submission);
  }

  async getWordQuestResults(userId: string): Promise<WordQuestResult[]> {
    const all = await this.questResultsTable.where('userId').equals(userId).toArray();
    return all.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }

  async saveWordQuestResult(result: WordQuestResult): Promise<void> {
    await this.questResultsTable.put(result);
  }

  async getActivityCompletion(userId: string, activityId: string, date: string): Promise<ActivityCompletionRecord | undefined> {
    const key = `${userId}-${activityId}-${date}`;
    return this.completionsTable.get(key);
  }

  async recordActivityCompletion(completion: ActivityCompletionRecord): Promise<void> {
    await this.completionsTable.put(completion);
  }

  async getAllActivityCompletions(userId: string): Promise<ActivityCompletionRecord[]> {
    return this.completionsTable.where('userId').equals(userId).toArray();
  }

  async getBookmarkedIdioms(userId: string): Promise<BookmarkedIdiomRecord[]> {
    return this.bookmarksTable.where('userId').equals(userId).toArray();
  }

  async saveBookmarkedIdiom(record: BookmarkedIdiomRecord): Promise<void> {
    await this.bookmarksTable.put(record);
  }

  async deleteBookmarkedIdiom(userId: string, expression: string): Promise<void> {
    const key = `${userId}-${expression.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    await this.bookmarksTable.delete(key);
  }
}

export class InMemoryQuickPicksRepository implements IQuickPicksRepository {
  private notes: QuickNote[] = [];
  private drawings: SavedDrawing[] = [];
  private challenges: DailyChallengeSubmission[] = [];
  private questResults: WordQuestResult[] = [];
  private completions: ActivityCompletionRecord[] = [];
  private bookmarks: BookmarkedIdiomRecord[] = [];

  constructor() {
    const now = new Date().toISOString();
    STARTER_NOTES.forEach((s, idx) => {
      this.notes.push({
        id: `mem-note-${idx + 1}`,
        userId: 'local-learner-1',
        ...s,
        createdAt: now,
        updatedAt: now,
      });
    });
  }

  async getNotes(userId: string): Promise<QuickNote[]> {
    return this.notes
      .filter((n) => n.userId === userId)
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }

  async getNote(id: string): Promise<QuickNote | undefined> {
    return this.notes.find((n) => n.id === id);
  }

  async saveNote(note: QuickNote): Promise<void> {
    const idx = this.notes.findIndex((n) => n.id === note.id);
    if (idx >= 0) {
      this.notes[idx] = note;
    } else {
      this.notes.push(note);
    }
  }

  async deleteNote(id: string): Promise<void> {
    this.notes = this.notes.filter((n) => n.id !== id);
  }

  async getDrawings(userId: string): Promise<SavedDrawing[]> {
    return this.drawings
      .filter((d) => d.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async getDrawing(id: string): Promise<SavedDrawing | undefined> {
    return this.drawings.find((d) => d.id === id);
  }

  async saveDrawing(drawing: SavedDrawing): Promise<void> {
    const idx = this.drawings.findIndex((d) => d.id === drawing.id);
    if (idx >= 0) {
      this.drawings[idx] = drawing;
    } else {
      this.drawings.push(drawing);
    }
  }

  async deleteDrawing(id: string): Promise<void> {
    this.drawings = this.drawings.filter((d) => d.id !== id);
  }

  async getDailyChallengeSubmission(userId: string, date: string): Promise<DailyChallengeSubmission | undefined> {
    return this.challenges.find((c) => c.userId === userId && c.date === date);
  }

  async saveDailyChallengeSubmission(submission: DailyChallengeSubmission): Promise<void> {
    const idx = this.challenges.findIndex((c) => c.id === submission.id);
    if (idx >= 0) {
      this.challenges[idx] = submission;
    } else {
      this.challenges.push(submission);
    }
  }

  async getWordQuestResults(userId: string): Promise<WordQuestResult[]> {
    return this.questResults
      .filter((q) => q.userId === userId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }

  async saveWordQuestResult(result: WordQuestResult): Promise<void> {
    this.questResults.push(result);
  }

  async getActivityCompletion(userId: string, activityId: string, date: string): Promise<ActivityCompletionRecord | undefined> {
    return this.completions.find((c) => c.userId === userId && c.activityId === activityId && c.date === date);
  }

  async recordActivityCompletion(completion: ActivityCompletionRecord): Promise<void> {
    const idx = this.completions.findIndex((c) => c.id === completion.id);
    if (idx >= 0) {
      this.completions[idx] = completion;
    } else {
      this.completions.push(completion);
    }
  }

  async getAllActivityCompletions(userId: string): Promise<ActivityCompletionRecord[]> {
    return this.completions.filter((c) => c.userId === userId);
  }

  async getBookmarkedIdioms(userId: string): Promise<BookmarkedIdiomRecord[]> {
    return this.bookmarks.filter((b) => b.userId === userId);
  }

  async saveBookmarkedIdiom(record: BookmarkedIdiomRecord): Promise<void> {
    const idx = this.bookmarks.findIndex((b) => b.id === record.id);
    if (idx >= 0) {
      this.bookmarks[idx] = record;
    } else {
      this.bookmarks.push(record);
    }
  }

  async deleteBookmarkedIdiom(userId: string, expression: string): Promise<void> {
    const key = `${userId}-${expression.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    this.bookmarks = this.bookmarks.filter((b) => b.id !== key);
  }
}

export const quickPicksRepository: IQuickPicksRepository = new DexieQuickPicksRepository();
