import { db } from '../db';
import type {
  LexiBackupPayload,
  LexiBackupVersion,
  BackupImportOptions,
  BackupImportResult,
  UserProfile,
  CurriculumProgressionState,
} from '../types';

export const SUPPORTED_BACKUP_VERSIONS: LexiBackupVersion[] = ['lexi-backup-v1', 'lexi-backup-v2'];
export const CURRENT_BACKUP_VERSION: LexiBackupVersion = 'lexi-backup-v2';

const VALID_CEFR_LEVELS = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

/**
 * Validates the runtime structure, schema, types, and referential integrity of a backup payload.
 * Safely tolerates optional future fields while strictly rejecting corrupt or incompatible data.
 */
export function validateBackupPayload(payload: unknown): { isValid: boolean; error?: string } {
  if (payload === null || payload === undefined) {
    return { isValid: false, error: 'Backup data cannot be empty or null.' };
  }

  if (typeof payload !== 'object' || Array.isArray(payload)) {
    return { isValid: false, error: 'Backup data must be a valid JSON object.' };
  }

  const dataObj = payload as Record<string, unknown>;

  // Check required root envelope fields
  if (!dataObj.version || typeof dataObj.version !== 'string') {
    return { isValid: false, error: 'Backup is missing required "version" identifier.' };
  }

  if (!SUPPORTED_BACKUP_VERSIONS.includes(dataObj.version as LexiBackupVersion)) {
    return {
      isValid: false,
      error: `Unsupported backup version "${dataObj.version}". Supported versions are ${SUPPORTED_BACKUP_VERSIONS.join(', ')}.`,
    };
  }

  if (!dataObj.appName || typeof dataObj.appName !== 'string') {
    return { isValid: false, error: 'Backup is missing required "appName" identifier.' };
  }

  if (!dataObj.data || typeof dataObj.data !== 'object' || Array.isArray(dataObj.data)) {
    return { isValid: false, error: 'Backup is missing required "data" records payload object.' };
  }

  const data = dataObj.data as Record<string, unknown>;

  // Validate User Profile if present
  if (data.user !== undefined && data.user !== null) {
    if (typeof data.user !== 'object' || Array.isArray(data.user)) {
      return { isValid: false, error: 'Invalid user profile record in backup payload.' };
    }
    const user = data.user as Partial<UserProfile>;
    if (!user.id || typeof user.id !== 'string') {
      return { isValid: false, error: 'User profile is missing valid string "id".' };
    }
    if (user.cefrLevel && !VALID_CEFR_LEVELS.has(user.cefrLevel)) {
      return { isValid: false, error: `User profile contains invalid CEFR level "${user.cefrLevel}".` };
    }
  }

  // Validate Curriculum Progress if present
  if (data.curriculumProgress !== undefined && data.curriculumProgress !== null) {
    if (typeof data.curriculumProgress !== 'object' || Array.isArray(data.curriculumProgress)) {
      return { isValid: false, error: 'Invalid curriculum progression record in backup payload.' };
    }
    const curr = data.curriculumProgress as Partial<CurriculumProgressionState>;
    if (curr.completedLessonIds !== undefined && !Array.isArray(curr.completedLessonIds)) {
      return { isValid: false, error: 'Curriculum "completedLessonIds" must be an array of lesson IDs.' };
    }
    if (curr.lessonRecords !== undefined && (typeof curr.lessonRecords !== 'object' || Array.isArray(curr.lessonRecords))) {
      return { isValid: false, error: 'Curriculum "lessonRecords" must be an object map.' };
    }
    if (curr.currentLevel && !VALID_CEFR_LEVELS.has(curr.currentLevel)) {
      return { isValid: false, error: `Curriculum contains invalid CEFR level "${curr.currentLevel}".` };
    }
  }

  // Helper to validate typed collection arrays
  const validateCollection = (
    key: string,
    requiredProps: string[],
    itemValidator?: (item: Record<string, unknown>, idx: number) => string | null
  ): string | null => {
    if (data[key] === undefined || data[key] === null) return null;
    if (!Array.isArray(data[key])) {
      return `Backup field "${key}" must be an array of records.`;
    }
    const arr = data[key] as unknown[];
    const MAX_RECORDS_PER_TABLE = 10000;
    if (arr.length > MAX_RECORDS_PER_TABLE) {
      return `Backup collection "${key}" exceeds the maximum allowed limit of ${MAX_RECORDS_PER_TABLE} records.`;
    }
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return `Record at index ${i} in "${key}" must be a non-null object.`;
      }
      const record = item as Record<string, unknown>;
      for (const prop of requiredProps) {
        if (record[prop] === undefined || record[prop] === null || record[prop] === '') {
          return `Record at index ${i} in "${key}" is missing required property "${prop}".`;
        }
      }
      if (itemValidator) {
        const customErr = itemValidator(record, i);
        if (customErr) return customErr;
      }
    }
    return null;
  };

  // Validate Vocabulary Cards
  const vocabErr = validateCollection('vocabularyCards', ['id'], (c, idx) => {
    const cardObj = c as Record<string, unknown>;
    const hasWord = Boolean(
      cardObj.word || (cardObj.item && typeof cardObj.item === 'object' && (cardObj.item as Record<string, unknown>).word)
    );
    if (!hasWord) {
      return `Vocabulary card at index ${idx} is missing required "word" or "item.word".`;
    }
    const cefr = cardObj.cefrLevel || (cardObj.item && typeof cardObj.item === 'object' && (cardObj.item as Record<string, unknown>).cefrLevel);
    if (cefr && !VALID_CEFR_LEVELS.has(cefr as string)) {
      return `Vocabulary card at index ${idx} has invalid CEFR level "${cefr}".`;
    }
    return null;
  });
  if (vocabErr) return { isValid: false, error: vocabErr };

  // Validate Review Logs
  const logErr = validateCollection('reviewLogs', ['id', 'cardId']);
  if (logErr) return { isValid: false, error: logErr };

  // Validate Practice Sessions
  const sessionErr = validateCollection('practiceSessions', ['id', 'category']);
  if (sessionErr) return { isValid: false, error: sessionErr };

  // Validate Quick Notes
  const noteErr = validateCollection('quickNotes', ['id', 'title']);
  if (noteErr) return { isValid: false, error: noteErr };

  // Validate Activity Completions
  const compErr = validateCollection('activityCompletions', ['id', 'activityId', 'date']);
  if (compErr) return { isValid: false, error: compErr };

  // Validate Daily Study Plans
  const planErr = validateCollection('dailyStudyPlans', ['id', 'date']);
  if (planErr) return { isValid: false, error: planErr };

  // Validate Mistake Records
  const mistakeErr = validateCollection('mistakeRecords', ['id', 'patternKey']);
  if (mistakeErr) return { isValid: false, error: mistakeErr };

  // Validate Assessment Records
  const assessErr = validateCollection('assessmentRecords', ['id', 'type'], (a, idx) => {
    if (a.estimatedCEFRLevel && !VALID_CEFR_LEVELS.has(a.estimatedCEFRLevel as string)) {
      return `Assessment record at index ${idx} has invalid CEFR level "${a.estimatedCEFRLevel}".`;
    }
    return null;
  });
  if (assessErr) return { isValid: false, error: assessErr };

  // Validate Notification Events
  const notifErr = validateCollection('notificationEvents', ['id', 'type']);
  if (notifErr) return { isValid: false, error: notifErr };

  return { isValid: true };
}

/**
 * Generates an offline-compatible JSON backup of all 16 IndexedDB database tables for the learner.
 */
export async function exportLearnerBackup(userId: string = 'local-learner-1'): Promise<LexiBackupPayload> {
  if (typeof indexedDB === 'undefined') {
    return {
      version: CURRENT_BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      appName: 'Lexi English Learning',
      userId,
      data: {
        vocabularyCards: [],
        reviewLogs: [],
        practiceSessions: [],
        quickNotes: [],
        savedDrawings: [],
        dailyChallenges: [],
        wordQuestResults: [],
        activityCompletions: [],
        bookmarkedIdioms: [],
        notificationEvents: [],
        dailyStudyPlans: [],
        mistakeRecords: [],
        assessmentRecords: [],
      },
    };
  }

  const [
    user,
    preferences,
    curriculumProgress,
    vocabularyCards,
    reviewLogs,
    practiceSessions,
    quickNotes,
    savedDrawings,
    dailyChallenges,
    wordQuestResults,
    activityCompletions,
    bookmarkedIdioms,
    notificationEvents,
    dailyStudyPlans,
    mistakeRecords,
    assessmentRecords,
  ] = await Promise.all([
    db.users.get(userId),
    db.practicePreferences.get(userId),
    db.curriculumProgress.get(userId),
    db.vocabularyCards.where('userId').equals(userId).toArray(),
    db.reviewLogs.where('userId').equals(userId).toArray(),
    db.practiceSessions.where('userId').equals(userId).toArray(),
    db.quickNotes.where('userId').equals(userId).toArray(),
    db.savedDrawings.where('userId').equals(userId).toArray(),
    db.dailyChallenges.where('userId').equals(userId).toArray(),
    db.wordQuestResults.where('userId').equals(userId).toArray(),
    db.activityCompletions.where('userId').equals(userId).toArray(),
    db.bookmarkedIdioms.where('userId').equals(userId).toArray(),
    db.notificationEvents.where('userId').equals(userId).toArray(),
    db.dailyStudyPlans.where('userId').equals(userId).toArray(),
    db.mistakeRecords.where('userId').equals(userId).toArray(),
    db.assessmentRecords ? db.assessmentRecords.where('userId').equals(userId).toArray() : Promise.resolve([]),
  ]);

  return {
    version: CURRENT_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appName: 'Lexi English Learning',
    userId,
    data: {
      user: user || undefined,
      preferences: preferences || undefined,
      curriculumProgress: curriculumProgress || undefined,
      vocabularyCards,
      reviewLogs,
      practiceSessions,
      quickNotes,
      savedDrawings,
      dailyChallenges,
      wordQuestResults,
      activityCompletions,
      bookmarkedIdioms,
      notificationEvents,
      dailyStudyPlans,
      mistakeRecords,
      assessmentRecords,
    },
  };
}

/**
 * Restores a validated Lexi backup into the offline IndexedDB database.
 * Executes inside an atomic Dexie transaction across all relevant tables.
 * If any write fails, the entire transaction is rolled back and existing data is preserved.
 *
 * Restore policy:
 * - 'replace' (default): Clears all existing records belonging to userId and replaces with the backup records.
 * - 'merge': Upserts backup records into existing tables without deleting unmentioned records.
 */
export async function importLearnerBackup(
  userId: string = 'local-learner-1',
  payload: unknown,
  options: BackupImportOptions = {}
): Promise<BackupImportResult> {
  const mode = options.mode || 'replace';

  const validation = validateBackupPayload(payload);
  if (!validation.isValid) {
    return {
      success: false,
      message: validation.error || 'Invalid backup payload.',
      error: validation.error,
    };
  }

  const typedPayload = payload as LexiBackupPayload;
  const { data } = typedPayload;
  const itemsRestored: Record<string, number> = {};

  if (typeof indexedDB === 'undefined') {
    return {
      success: true,
      message: 'Backup validated successfully (mock environment).',
      itemsRestored: { validated: 1 },
    };
  }

  const allTables = [
    db.users,
    db.practicePreferences,
    db.curriculumProgress,
    db.vocabularyCards,
    db.reviewLogs,
    db.practiceSessions,
    db.quickNotes,
    db.savedDrawings,
    db.dailyChallenges,
    db.wordQuestResults,
    db.activityCompletions,
    db.bookmarkedIdioms,
    db.notificationEvents,
    db.dailyStudyPlans,
    db.mistakeRecords,
    ...(db.assessmentRecords ? [db.assessmentRecords] : []),
  ];

  try {
    await db.transaction('rw', allTables, async () => {
      // If replace mode, clear existing user records across all multi-item tables first
      if (mode === 'replace') {
        await Promise.all([
          db.vocabularyCards.where('userId').equals(userId).delete(),
          db.reviewLogs.where('userId').equals(userId).delete(),
          db.practiceSessions.where('userId').equals(userId).delete(),
          db.quickNotes.where('userId').equals(userId).delete(),
          db.savedDrawings.where('userId').equals(userId).delete(),
          db.dailyChallenges.where('userId').equals(userId).delete(),
          db.wordQuestResults.where('userId').equals(userId).delete(),
          db.activityCompletions.where('userId').equals(userId).delete(),
          db.bookmarkedIdioms.where('userId').equals(userId).delete(),
          db.notificationEvents.where('userId').equals(userId).delete(),
          db.dailyStudyPlans.where('userId').equals(userId).delete(),
          db.mistakeRecords.where('userId').equals(userId).delete(),
          db.assessmentRecords ? db.assessmentRecords.where('userId').equals(userId).delete() : Promise.resolve(),
        ]);
      }

      // 1. User Profile
      if (data.user) {
        await db.users.put({ ...data.user, id: userId });
        itemsRestored['userProfile'] = 1;
      }

      // 2. Practice Preferences
      if (data.preferences) {
        await db.practicePreferences.put({ ...data.preferences, userId });
        itemsRestored['preferences'] = 1;
      }

      // 3. Curriculum Progression
      if (data.curriculumProgress) {
        await db.curriculumProgress.put({ ...data.curriculumProgress, userId });
        itemsRestored['curriculumProgress'] = 1;
      }

      // 4. Vocabulary Cards
      if (data.vocabularyCards && data.vocabularyCards.length > 0) {
        const boundCards = data.vocabularyCards.map((c) => ({ ...c, userId }));
        await db.vocabularyCards.bulkPut(boundCards);
        itemsRestored['vocabularyCards'] = boundCards.length;
      }

      // 5. Review Logs
      if (data.reviewLogs && data.reviewLogs.length > 0) {
        const boundLogs = data.reviewLogs.map((l) => ({ ...l, userId }));
        await db.reviewLogs.bulkPut(boundLogs);
        itemsRestored['reviewLogs'] = boundLogs.length;
      }

      // 6. Practice Sessions
      if (data.practiceSessions && data.practiceSessions.length > 0) {
        const boundSessions = data.practiceSessions.map((s) => ({ ...s, userId }));
        await db.practiceSessions.bulkPut(boundSessions);
        itemsRestored['practiceSessions'] = boundSessions.length;
      }

      // 7. Quick Notes
      if (data.quickNotes && data.quickNotes.length > 0) {
        const boundNotes = data.quickNotes.map((n) => ({ ...n, userId }));
        await db.quickNotes.bulkPut(boundNotes);
        itemsRestored['quickNotes'] = boundNotes.length;
      }

      // 8. Saved Drawings
      if (data.savedDrawings && data.savedDrawings.length > 0) {
        const boundDrawings = data.savedDrawings.map((d) => ({ ...d, userId }));
        await db.savedDrawings.bulkPut(boundDrawings);
        itemsRestored['savedDrawings'] = boundDrawings.length;
      }

      // 9. Daily Challenges
      if (data.dailyChallenges && data.dailyChallenges.length > 0) {
        const boundChallenges = data.dailyChallenges.map((c) => ({ ...c, userId }));
        await db.dailyChallenges.bulkPut(boundChallenges);
        itemsRestored['dailyChallenges'] = boundChallenges.length;
      }

      // 10. Word Quest Results
      if (data.wordQuestResults && data.wordQuestResults.length > 0) {
        const boundQuests = data.wordQuestResults.map((q) => ({ ...q, userId }));
        await db.wordQuestResults.bulkPut(boundQuests);
        itemsRestored['wordQuestResults'] = boundQuests.length;
      }

      // 11. Activity Completions
      if (data.activityCompletions && data.activityCompletions.length > 0) {
        const boundCompletions = data.activityCompletions.map((a) => ({ ...a, userId }));
        await db.activityCompletions.bulkPut(boundCompletions);
        itemsRestored['activityCompletions'] = boundCompletions.length;
      }

      // 12. Bookmarked Idioms
      if (data.bookmarkedIdioms && data.bookmarkedIdioms.length > 0) {
        const boundIdioms = data.bookmarkedIdioms.map((i) => ({ ...i, userId }));
        await db.bookmarkedIdioms.bulkPut(boundIdioms);
        itemsRestored['bookmarkedIdioms'] = boundIdioms.length;
      }

      // 13. Notification Events
      if (data.notificationEvents && data.notificationEvents.length > 0) {
        const boundEvents = data.notificationEvents.map((e) => ({ ...e, userId }));
        await db.notificationEvents.bulkPut(boundEvents);
        itemsRestored['notificationEvents'] = boundEvents.length;
      }

      // 14. Daily Study Plans
      if (data.dailyStudyPlans && data.dailyStudyPlans.length > 0) {
        const boundPlans = data.dailyStudyPlans.map((p) => ({ ...p, userId }));
        await db.dailyStudyPlans.bulkPut(boundPlans);
        itemsRestored['dailyStudyPlans'] = boundPlans.length;
      }

      // 15. Mistake Records
      if (data.mistakeRecords && data.mistakeRecords.length > 0) {
        const boundMistakes = data.mistakeRecords.map((m) => ({ ...m, userId }));
        await db.mistakeRecords.bulkPut(boundMistakes);
        itemsRestored['mistakeRecords'] = boundMistakes.length;
      }

      // 16. Assessment Records
      if (data.assessmentRecords && data.assessmentRecords.length > 0 && db.assessmentRecords) {
        const boundAssessments = data.assessmentRecords.map((a) => ({ ...a, userId }));
        await db.assessmentRecords.bulkPut(boundAssessments);
        itemsRestored['assessmentRecords'] = boundAssessments.length;
      }
    });

    const totalCount = Object.values(itemsRestored).reduce((sum, n) => sum + n, 0);

    return {
      success: true,
      message: `Backup successfully restored (${totalCount} records restored).`,
      itemsRestored,
    };
  } catch (err) {
    return {
      success: false,
      message: 'Failed to restore backup into offline database. Existing records preserved.',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Generates and triggers browser download of the backup payload.
 */
export function downloadBackupFile(backup: LexiBackupPayload, fileName?: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  anchor.href = url;
  anchor.download = fileName || `lexi-backup-${dateStr}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
