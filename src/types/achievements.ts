import type { CEFRLevel } from './curriculum';
import type { UserProfile } from './index';
import type { CurriculumProgressionState } from './curriculum';
import type { VocabularyCardRecord, ReviewLogRecord } from './vocabulary';
import type { PracticePreferences, PracticeSessionRecord } from './practicePreferences';
import {
  QuickNote,
  SavedDrawing,
  DailyChallengeSubmission,
  WordQuestResult,
  ActivityCompletionRecord,
  BookmarkedIdiomRecord,
} from './quickPicks';
import type { DailyStudyPlanRecord } from './adaptivePlan';
import type { LearnerMistakeRecord } from './conversationCoach';
import type { AssessmentResult } from './assessment';
import type { NotificationEventRecord } from './notifications';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export type BadgeCategory = 'streak' | 'vocab' | 'curriculum' | 'studios' | 'engagement';

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  category: BadgeCategory;
  tier: BadgeTier;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  currentValue: number;
  targetValue: number;
  progressPercent: number;
  unit: string;
}

export interface CEFRCertificate {
  id: string;
  level: CEFRLevel;
  title: string;
  learnerName: string;
  isCompleted: boolean;
  completionDate?: string;
  credentialId: string;
  hoursPracticed: number;
  vocabularyMastered: number;
  accuracyScore: number;
  skillsCertified: string[];
  disclaimer?: string;
  isInternalMilestone?: boolean;
}

export interface LearnerAchievementSummary {
  totalBadgesCount: number;
  unlockedBadgesCount: number;
  completionPercent: number;
  rankTitle: string;
  rankDescription: string;
  badges: AchievementBadge[];
  certificates: CEFRCertificate[];
}

export type LexiBackupVersion = 'lexi-backup-v1' | 'lexi-backup-v2';

export interface LexiBackupPayload {
  version: LexiBackupVersion;
  exportedAt: string;
  appName: string;
  userId: string;
  data: {
    user?: UserProfile;
    preferences?: PracticePreferences;
    curriculumProgress?: CurriculumProgressionState;
    vocabularyCards?: VocabularyCardRecord[];
    reviewLogs?: ReviewLogRecord[];
    practiceSessions?: PracticeSessionRecord[];
    quickNotes?: QuickNote[];
    savedDrawings?: SavedDrawing[];
    dailyChallenges?: DailyChallengeSubmission[];
    wordQuestResults?: WordQuestResult[];
    activityCompletions?: ActivityCompletionRecord[];
    bookmarkedIdioms?: BookmarkedIdiomRecord[];
    dailyStudyPlans?: DailyStudyPlanRecord[];
    mistakeRecords?: LearnerMistakeRecord[];
    assessmentRecords?: AssessmentResult[];
    notificationEvents?: NotificationEventRecord[];
  };
}

export interface BackupImportOptions {
  mode?: 'replace' | 'merge';
}

export interface BackupImportResult {
  success: boolean;
  message: string;
  itemsRestored?: Record<string, number>;
  error?: string;
}
