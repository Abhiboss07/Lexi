import { db } from './index';
import type { 
  PracticePreferences, 
  PracticeSessionRecord 
} from '../types/practicePreferences';
import { 
  DEFAULT_PRACTICE_PREFERENCES,
  validatePracticePreferences 
} from '../types/practicePreferences';

export interface IPracticeRepository {
  getPreferences(userId: string): Promise<PracticePreferences>;
  savePreferences(userId: string, update: Partial<PracticePreferences>): Promise<PracticePreferences>;
  recordSession(session: Omit<PracticeSessionRecord, 'id' | 'completedAt'> & { id?: string; completedAt?: string }): Promise<PracticeSessionRecord>;
  getSessions(userId: string, limit?: number): Promise<PracticeSessionRecord[]>;
  getTodayPracticeMinutes(userId: string): Promise<number>;
}

export { DEFAULT_PRACTICE_PREFERENCES };

class DexiePracticeRepository implements IPracticeRepository {
  async getPreferences(userId: string): Promise<PracticePreferences> {
    const user = await db.users.get(userId);
    const fallbackCefr = user?.cefrLevel || 'A2';
    const existing = await db.practicePreferences.get(userId);

    const validated = validatePracticePreferences(existing, userId, fallbackCefr);

    // If record did not exist or was missing new Phase 4 fields, persist cleanly
    if (!existing || !existing.cefrLevel || !existing.practiceDays || !existing.correctionTiming) {
      await db.practicePreferences.put(validated);
    }

    return validated;
  }

  async savePreferences(userId: string, update: Partial<PracticePreferences>): Promise<PracticePreferences> {
    const current = await this.getPreferences(userId);
    const merged = {
      ...current,
      ...update,
      userId,
      updatedAt: new Date().toISOString(),
    };
    const updated = validatePracticePreferences(merged, userId, current.cefrLevel);

    await db.practicePreferences.put(updated);

    // Sync dailyGoalMinutes and cefrLevel to user profile
    const user = await db.users.get(userId);
    if (user) {
      const userUpdate: Record<string, unknown> = {};
      if (updated.dailyGoalMinutes !== user.dailyGoalMinutes) {
        userUpdate.dailyGoalMinutes = updated.dailyGoalMinutes;
      }
      if (updated.cefrLevel !== user.cefrLevel) {
        userUpdate.cefrLevel = updated.cefrLevel;
      }
      if (Object.keys(userUpdate).length > 0) {
        await db.users.update(userId, userUpdate);
      }
    }

    // Sync curriculum currentLevel when CEFR level manually updated
    if (update.cefrLevel) {
      const progress = await db.curriculumProgress.get(userId);
      if (progress && progress.currentLevel !== update.cefrLevel) {
        await db.curriculumProgress.update(userId, {
          currentLevel: update.cefrLevel,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return updated;
  }

  async recordSession(
    sessionData: Omit<PracticeSessionRecord, 'id' | 'completedAt'> & { id?: string; completedAt?: string }
  ): Promise<PracticeSessionRecord> {
    const record: PracticeSessionRecord = {
      id: sessionData.id || `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: sessionData.userId,
      category: sessionData.category,
      difficulty: sessionData.difficulty,
      sessionLength: sessionData.sessionLength,
      durationMinutes: sessionData.durationMinutes,
      completedAt: sessionData.completedAt || new Date().toISOString(),
      score: sessionData.score,
      notes: sessionData.notes,
      activityId: sessionData.activityId,
    };

    await db.practiceSessions.put(record);
    return record;
  }

  async getSessions(userId: string, limit: number = 20): Promise<PracticeSessionRecord[]> {
    const sessions = await db.practiceSessions
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('completedAt');

    return sessions.slice(0, limit);
  }

  async getTodayPracticeMinutes(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const sessions = await db.practiceSessions
      .where('userId')
      .equals(userId)
      .filter((s) => s.completedAt.startsWith(today))
      .toArray();

    return sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  }
}

export const practiceRepository = new DexiePracticeRepository();

export class InMemoryPracticeRepository implements IPracticeRepository {
  private prefs = new Map<string, PracticePreferences>();
  private sessions: PracticeSessionRecord[] = [];

  async getPreferences(userId: string): Promise<PracticePreferences> {
    if (!this.prefs.has(userId)) {
      const defaultPrefs = validatePracticePreferences(undefined, userId, 'A2');
      this.prefs.set(userId, defaultPrefs);
    }
    return { ...this.prefs.get(userId)! };
  }

  async savePreferences(userId: string, update: Partial<PracticePreferences>): Promise<PracticePreferences> {
    const current = await this.getPreferences(userId);
    const merged = {
      ...current,
      ...update,
      userId,
      updatedAt: new Date().toISOString(),
    };
    const updated = validatePracticePreferences(merged, userId, current.cefrLevel);
    this.prefs.set(userId, updated);
    return { ...updated };
  }

  async recordSession(
    sessionData: Omit<PracticeSessionRecord, 'id' | 'completedAt'> & { id?: string; completedAt?: string }
  ): Promise<PracticeSessionRecord> {
    const record: PracticeSessionRecord = {
      id: sessionData.id || `session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      userId: sessionData.userId,
      category: sessionData.category,
      difficulty: sessionData.difficulty,
      sessionLength: sessionData.sessionLength,
      durationMinutes: sessionData.durationMinutes,
      completedAt: sessionData.completedAt || new Date().toISOString(),
      score: sessionData.score,
      notes: sessionData.notes,
      activityId: sessionData.activityId,
    };
    this.sessions.unshift(record);
    return { ...record };
  }

  async getSessions(userId: string, limit: number = 20): Promise<PracticeSessionRecord[]> {
    return this.sessions
      .filter((s) => s.userId === userId)
      .slice(0, limit);
  }

  async getTodayPracticeMinutes(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    return this.sessions
      .filter((s) => s.userId === userId && s.completedAt.startsWith(today))
      .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  }
}
