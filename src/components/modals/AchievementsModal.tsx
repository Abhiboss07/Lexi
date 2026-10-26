import React, { useState, useRef } from 'react';
import {
  X,
  Award,
  Sparkles,
  Flame,
  ShieldCheck,
  BookOpen,
  TrendingUp,
  Compass,
  FileText,
  Download,
  Upload,
  CheckCircle2,
  Lock,
  Database,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import type {
  CEFRCertificate,
  LearnerAchievementSummary,
  BadgeCategory,
} from '../../types/achievements';
import {
  exportLearnerBackup,
  importLearnerBackup,
  downloadBackupFile,
} from '../../services/achievementService';
import { useModalFocusTrap } from '../../hooks/useModalFocusTrap';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  summary: LearnerAchievementSummary | null;
  onRefresh?: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  userId = 'local-learner-1',
  summary,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'badges' | 'certificates' | 'backup'>('badges');
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | BadgeCategory>('all');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<CEFRCertificate | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const modalRef = useModalFocusTrap<HTMLDivElement>({ isOpen, onClose });

  if (!isOpen) return null;

  const badges = summary?.badges || [];
  const filteredBadges = badges.filter((b) => {
    if (filter === 'unlocked' && !b.unlocked) return false;
    if (filter === 'locked' && b.unlocked) return false;
    if (categoryFilter !== 'all' && b.category !== categoryFilter) return false;
    return true;
  });

  const unlockedCount = summary?.unlockedBadgesCount || 0;
  const totalCount = summary?.totalBadgesCount || 15;
  const completionPercent = summary?.completionPercent || 0;

  // Icon selector helper
  const renderBadgeIcon = (iconName: string, tier: string, unlocked: boolean) => {
    const tierColors: Record<string, { bg: string; text: string }> = {
      bronze: { bg: 'bg-[#FDF4EC]', text: 'text-[#D97706]' },
      silver: { bg: 'bg-[#F1F5F9]', text: 'text-[#475569]' },
      gold: { bg: 'bg-[#FEF9C3]', text: 'text-[#B45309]' },
      diamond: { bg: 'bg-[#EFF6FF]', text: 'text-[#2563EB]' },
    };

    const colorConfig = tierColors[tier] || tierColors.bronze;
    const sizeClasses = 'w-5 h-5 stroke-[2.2]';

    let IconComponent = Sparkles;
    if (iconName === 'flame') IconComponent = Flame;
    else if (iconName === 'award') IconComponent = Award;
    else if (iconName === 'book-open') IconComponent = BookOpen;
    else if (iconName === 'shield-check') IconComponent = ShieldCheck;
    else if (iconName === 'trending-up') IconComponent = TrendingUp;
    else if (iconName === 'compass') IconComponent = Compass;
    else if (iconName === 'file-text') IconComponent = FileText;

    return (
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
          unlocked ? colorConfig.bg : 'bg-[#EAEBF2]'
        } ${unlocked ? colorConfig.text : 'text-[#8E93B8]'}`}
      >
        <IconComponent className={sizeClasses} />
      </div>
    );
  };

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      const backupData = await exportLearnerBackup(userId);
      downloadBackupFile(backupData);
      setImportStatus({
        success: true,
        message: 'Lexi learning progress exported successfully to JSON backup file.',
      });
    } catch (err) {
      setImportStatus({
        success: false,
        message: 'Failed to generate learning progress export.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Enforce 5 MB maximum file size limit to prevent memory exhaustion & DoS
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setImportStatus({
        success: false,
        message: 'Backup file exceeds the 5 MB maximum size limit. Please provide a valid Lexi backup file.',
      });
      return;
    }

    try {
      setIsImporting(true);
      setImportStatus(null);
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        setImportStatus({
          success: false,
          message: 'Malformed or corrupt JSON file. Please provide a valid Lexi JSON backup.',
        });
        return;
      }

      const result = await importLearnerBackup(userId, parsed);
      setImportStatus({
        success: result.success,
        message: result.message,
      });

      if (result.success && onRefresh) {
        onRefresh();
      }
    } catch (err) {
      setImportStatus({
        success: false,
        message: 'Could not process backup file. Please provide a valid Lexi JSON backup.',
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievements-modal-title"
    >
      <div className="w-full max-w-[660px] max-h-[92vh] sm:max-h-[86vh] bg-[#F6F7FE] sm:rounded-[32px] rounded-t-[32px] shadow-2xl border border-[#ECEEFE] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#ECEEFE] shrink-0">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h2
                    id="achievements-modal-title"
                    className="text-[16px] sm:text-[19px] font-black text-[#15164B] tracking-tight leading-snug"
                  >
                    Achievements & Milestones
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#FAF5FF] border border-[#E9D5FF] text-[#9333EA] text-[10px] sm:text-[10.5px] font-extrabold uppercase shrink-0">
                    {summary?.rankTitle || 'Learner'}
                  </span>
                </div>
                <p className="text-[11px] sm:text-[11.5px] font-medium text-[#484E77] line-clamp-1 mt-0.5">
                  {summary?.rankDescription || 'Track learning milestones, certificates, and offline backups.'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] flex items-center justify-center text-[#15164B] transition-colors shrink-0 cursor-pointer"
              aria-label="Close achievements modal"
            >
              <X className="w-4.5 h-4.5 stroke-[2.2]" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 pt-2 border-t border-[#F0F2FD]">
            <button
              type="button"
              onClick={() => setActiveTab('badges')}
              aria-label="Badges tab"
              className={`flex-1 py-1.5 px-3 rounded-xl text-[12px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'badges'
                  ? 'bg-[#15164B] text-white shadow-xs'
                  : 'bg-[#FAF9FE] text-[#52577F] hover:bg-[#EEF1FB]'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Badges</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'badges' ? 'bg-white/20 text-white' : 'bg-[#E8EBFA] text-[#545CA6]'}`}>
                {unlockedCount}/{totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('certificates')}
              aria-label="Certificates tab"
              className={`flex-1 py-1.5 px-3 rounded-xl text-[12px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'certificates'
                  ? 'bg-[#15164B] text-white shadow-xs'
                  : 'bg-[#FAF9FE] text-[#52577F] hover:bg-[#EEF1FB]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Certificates</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              aria-label="Data & Backup tab"
              className={`flex-1 py-1.5 px-3 rounded-xl text-[12px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'backup'
                  ? 'bg-[#15164B] text-white shadow-xs'
                  : 'bg-[#FAF9FE] text-[#52577F] hover:bg-[#EEF1FB]'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Data & Backup</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* TAB 1: BADGES & MILESTONES */}
          {activeTab === 'badges' && (
            <div className="space-y-4">
              {/* Overall Progress Banner */}
              <div className="p-3.5 rounded-2xl bg-white border border-[#ECEEFE] shadow-xs flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#545CA6]" />
                    <span className="text-[12.5px] font-black text-[#15164B]">
                      Milestone Progress
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B7094]">
                    Unlocked {unlockedCount} of {totalCount} language achievement badges ({completionPercent}%)
                  </p>
                </div>
                <div className="w-24 sm:w-32 h-2.5 bg-[#EEF1FB] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#545CA6] to-[#10B981] rounded-full transition-all duration-300"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                    filter === 'all'
                      ? 'bg-[#15164B] text-white'
                      : 'bg-white border border-[#E4E7F7] text-[#52577F] hover:bg-[#F0F2FD]'
                  }`}
                >
                  All ({badges.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('unlocked')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                    filter === 'unlocked'
                      ? 'bg-[#059669] text-white'
                      : 'bg-white border border-[#E4E7F7] text-[#52577F] hover:bg-[#F0F2FD]'
                  }`}
                >
                  Unlocked ({unlockedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('locked')}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                    filter === 'locked'
                      ? 'bg-[#6B7094] text-white'
                      : 'bg-white border border-[#E4E7F7] text-[#52577F] hover:bg-[#F0F2FD]'
                  }`}
                >
                  In Progress ({totalCount - unlockedCount})
                </button>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10.5px]">
                {(['all', 'streak', 'vocab', 'curriculum', 'studios', 'engagement'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2.5 py-0.5 rounded-lg font-bold capitalize whitespace-nowrap cursor-pointer transition-colors ${
                      categoryFilter === cat
                        ? 'bg-[#545CA6] text-white shadow-xs'
                        : 'bg-white text-[#6B7094] border border-[#ECEEFE] hover:bg-[#FAF9FE]'
                    }`}
                  >
                    {cat === 'all' ? 'All Categories' : cat === 'vocab' ? 'Vocabulary' : cat}
                  </button>
                ))}
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-2xl bg-white border transition-all flex items-start gap-3 shadow-xs ${
                      badge.unlocked ? 'border-[#ECEEFE] hover:border-[#CCD1F0]' : 'border-[#F0F2FA] opacity-75'
                    }`}
                  >
                    {renderBadgeIcon(badge.icon, badge.tier, badge.unlocked)}

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-[13px] font-black text-[#15164B] truncate">
                          {badge.title}
                        </h4>
                        <span
                          className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-md ${
                            badge.tier === 'diamond'
                              ? 'bg-[#EFF6FF] text-[#2563EB]'
                              : badge.tier === 'gold'
                              ? 'bg-[#FEF9C3] text-[#B45309]'
                              : badge.tier === 'silver'
                              ? 'bg-[#F1F5F9] text-[#475569]'
                              : 'bg-[#FDF4EC] text-[#D97706]'
                          }`}
                        >
                          {badge.tier}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#6B7094] line-clamp-2">
                        {badge.description}
                      </p>

                      {badge.unlocked ? (
                        <div className="flex items-center gap-1 pt-1 text-[10.5px] font-bold text-[#059669]">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span>Unlocked</span>
                          {badge.unlockedAt && (
                            <span className="text-[#8E93B8] font-normal">• {badge.unlockedAt}</span>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-[#6B7094]">
                            <span>
                              {badge.currentValue} / {badge.targetValue} {badge.unit}
                            </span>
                            <span>{badge.progressPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-[#EEF1FB] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#545CA6] rounded-full transition-all duration-300"
                              style={{ width: `${badge.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CEFR CERTIFICATES */}
          {activeTab === 'certificates' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-white border border-[#ECEEFE] shadow-xs space-y-1.5 text-left">
                <h3 className="text-[13px] font-black text-[#15164B] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#4F46E5]" />
                  <span>CEFR Curriculum Milestone Certificates</span>
                </h3>
                <p className="text-[11.5px] text-[#6B7094] leading-relaxed">
                  Internal learning milestone certificates recognizing demonstrated completion and mastery of Lexi’s CEFR-aligned syllabus.
                </p>
                <div className="p-2.5 rounded-xl bg-[#F0F2FD] border border-[#CCD1F0] text-[10.5px] text-[#545CA6] flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-[#545CA6] shrink-0 mt-0.5" />
                  <span>
                    <strong>Informal Milestone Disclaimer:</strong> These certificates track internal educational progression in Lexi and do not represent external accredited qualifications (such as IELTS, TOEFL, or Cambridge).
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {summary?.certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className={`p-4 rounded-3xl bg-white border shadow-xs transition-all space-y-3 ${
                      cert.isCompleted ? 'border-[#D5D8EE]' : 'border-[#ECEEFE] opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[18px] shrink-0 ${
                            cert.isCompleted
                              ? 'bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]'
                              : 'bg-[#F1F5F9] text-[#64748B]'
                          }`}
                        >
                          {cert.level}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-[14px] sm:text-[15px] font-black text-[#15164B]">
                              {cert.title}
                            </h4>
                            {cert.isCompleted ? (
                              <span className="px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#059669] text-[10px] font-extrabold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Verified</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#6B7280] text-[10px] font-bold flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                <span>In Progress</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#6B7094]">
                            Candidate: {cert.learnerName} • Credential ID: {cert.credentialId}
                          </p>
                        </div>
                      </div>

                      {cert.isCompleted && (
                        <button
                          type="button"
                          onClick={() => setSelectedCertificate(cert)}
                          className="px-3 py-1.5 rounded-xl bg-[#15164B] text-white hover:bg-[#0E1038] text-[11px] font-bold cursor-pointer transition-colors shrink-0 shadow-xs flex items-center gap-1.5"
                        >
                          <span>View Certificate</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Certified Skills Checklist */}
                    <div className="p-3 rounded-2xl bg-[#FAF9FE] border border-[#E9ECFB] space-y-1.5">
                      <span className="text-[10px] font-extrabold uppercase text-[#545CA6] tracking-wider block">
                        Verified Fluency Competencies
                      </span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-[#52577F]">
                        {cert.skillsCertified.map((skill, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-[#10B981] shrink-0" />
                            <span className="truncate">{skill}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Certificate Stats Bar */}
                    <div className="flex items-center justify-between text-[11px] font-semibold text-[#6B7094] pt-1 border-t border-[#F0F2FD]">
                      <span>Hours Practiced: {cert.hoursPracticed}h</span>
                      <span>Mastered Words: {cert.vocabularyMastered}</span>
                      <span>Accuracy: {cert.accuracyScore}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DATA & BACKUP */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-white border border-[#ECEEFE] shadow-xs space-y-1">
                <h3 className="text-[13px] font-black text-[#15164B] flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-[#545CA6]" />
                  <span>Offline-First Storage & Data Portability</span>
                </h3>
                <p className="text-[11.5px] text-[#6B7094]">
                  Lexi stores all your learning progress, vocabulary cards, and session history locally in your device's offline Dexie database.
                </p>
              </div>

              {/* Status Banner */}
              {importStatus && (
                <div
                  className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${
                    importStatus.success
                      ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                      : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                  }`}
                >
                  {importStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <p className="text-[12px] font-semibold">{importStatus.message}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Export Card */}
                <div className="p-4 rounded-3xl bg-white border border-[#ECEEFE] shadow-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center">
                      <Download className="w-4 h-4 stroke-[2.3]" />
                    </div>
                    <h4 className="text-[13.5px] font-black text-[#15164B] pt-1">
                      Export Learning Backup
                    </h4>
                    <p className="text-[11px] text-[#6B7094]">
                      Download a complete, offline-compatible JSON backup of your streaks, FSRS cards, notes, and curriculum.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportBackup}
                    disabled={isExporting}
                    className="w-full py-2 px-3 rounded-xl bg-[#15164B] text-white hover:bg-[#0E1038] text-[11.5px] font-bold cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExporting ? 'Generating...' : 'Download Backup (.json)'}</span>
                  </button>
                </div>

                {/* Import Card */}
                <div className="p-4 rounded-3xl bg-white border border-[#ECEEFE] shadow-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center">
                      <Upload className="w-4 h-4 stroke-[2.3]" />
                    </div>
                    <h4 className="text-[13.5px] font-black text-[#15164B] pt-1">
                      Restore from Backup
                    </h4>
                    <p className="text-[11px] text-[#6B7094]">
                      Restore your learning state onto this device from a previously exported Lexi JSON backup.
                    </p>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,application/json"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting}
                    className="w-full py-2 px-3 rounded-xl bg-[#F6F7FE] border border-[#CCD1F0] text-[#545CA6] hover:bg-[#ECEFFD] text-[11.5px] font-bold cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isImporting ? 'Restoring...' : 'Select Backup File'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Certificate Detail Modal Overlay */}
        {selectedCertificate && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-label="Certificate details view"
          >
            <div className="w-full max-w-[540px] bg-white rounded-3xl shadow-2xl border-4 border-[#C7D2FE] p-5 sm:p-6 space-y-4 text-center relative">
              <button
                type="button"
                onClick={() => setSelectedCertificate(null)}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] flex items-center justify-center text-[#222149] cursor-pointer"
                aria-label="Close certificate preview"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-14 h-14 rounded-full bg-[#EEF2FF] border-2 border-[#818CF8] flex items-center justify-center mx-auto text-[#4F46E5]">
                <Award className="w-7 h-7 stroke-[2.2]" />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#545CA6]">
                  Lexi English Learning • Verified Credential
                </span>
                <h3 className="text-[20px] sm:text-[22px] font-black text-[#15164B]">
                  {selectedCertificate.title}
                </h3>
                <p className="text-[13px] font-medium text-[#52577F]">
                  This certifies that <strong className="text-[#15164B]">{selectedCertificate.learnerName}</strong> has demonstrated verified proficiency in CEFR {selectedCertificate.level} English.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF9FE] border border-[#E9ECFB] text-left space-y-1.5">
                <span className="text-[10.5px] font-black uppercase text-[#545CA6] tracking-wider block">
                  Certified Competencies
                </span>
                <ul className="space-y-1 text-[11.5px] text-[#52577F]">
                  {selectedCertificate.skillsCertified.map((s, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold text-[#6B7094] border-t border-[#EEF2FF] pt-3">
                <span>ID: {selectedCertificate.credentialId}</span>
                <span>Accuracy: {selectedCertificate.accuracyScore}%</span>
                <span>Internal Milestone</span>
              </div>

              <p className="text-[10px] text-[#8E93B8] leading-tight text-center">
                Lexi internal curriculum milestone certificate. Not an accredited external examination qualification (IELTS/TOEFL/Cambridge).
              </p>

              <button
                type="button"
                onClick={() => setSelectedCertificate(null)}
                className="w-full py-2.5 rounded-xl bg-[#15164B] text-white text-[12px] font-bold cursor-pointer hover:bg-[#0E1038] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
