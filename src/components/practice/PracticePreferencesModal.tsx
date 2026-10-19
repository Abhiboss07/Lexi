import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Target, 
  Clock, 
  Sliders, 
  Bell, 
  ShieldCheck, 
  Info,
  Sparkles,
  BookOpen,
  Calendar,
  MessageSquare,
  Lightbulb,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import type { 
  PracticePreferences, 
  PracticeDifficulty, 
  PracticeSessionLength, 
  ReminderFrequency,
  CorrectionTiming,
  ExplanationDepth,
  InputModePreference,
  PracticeDay,
  DailyGoalOption
} from '../../types/practicePreferences';
import { 
  DIFFICULTY_DESCRIPTIONS, 
  SESSION_LENGTH_RANGES,
  CEFR_LEVEL_DESCRIPTIONS,
  ALL_PRACTICE_DAYS,
  VALID_DAILY_GOALS
} from '../../types/practicePreferences';
import type { CEFRLevel } from '../../types/curriculum';
import { practiceRepository } from '../../db/practiceRepository';
import { generateAdaptiveRecommendation, type AdaptiveRecommendation } from '../../services/adaptiveRecommendationService';
import { systemNotificationService } from '../../services/systemNotificationService';
import { 
  type NotificationCategoryPreferences, 
  DEFAULT_NOTIFICATION_CATEGORIES 
} from '../../types/notifications';

interface PracticePreferencesModalProps {
  userId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updated: PracticePreferences) => void;
}

export const PracticePreferencesModal: React.FC<PracticePreferencesModalProps> = ({
  userId = 'local-learner-1',
  isOpen,
  onClose,
  onSaved,
}) => {
  // Preferences State
  const [cefrLevel, setCefrLevel] = useState<CEFRLevel>('A2');
  const [difficulty, setDifficulty] = useState<PracticeDifficulty>('medium');
  const [sessionLength, setSessionLength] = useState<PracticeSessionLength>('standard');
  const [dailyGoal, setDailyGoal] = useState<DailyGoalOption>(15);
  const [correctionTiming, setCorrectionTiming] = useState<CorrectionTiming>('immediate');
  const [explanationDepth, setExplanationDepth] = useState<ExplanationDepth>('gentle');
  const [hintsEnabled, setHintsEnabled] = useState<boolean>(true);
  const [inputMode, setInputMode] = useState<InputModePreference>('text_first');
  const [practiceDays, setPracticeDays] = useState<PracticeDay[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [reminder, setReminder] = useState<ReminderFrequency>('off');
  const [reminderTime, setReminderTime] = useState<string>('09:00');
  const [inAppRemindersEnabled, setInAppRemindersEnabled] = useState<boolean>(true);
  const [systemNotificationsEnabled, setSystemNotificationsEnabled] = useState<boolean>(false);
  const [notificationCategories, setNotificationCategories] = useState<NotificationCategoryPreferences>({
    ...DEFAULT_NOTIFICATION_CATEGORIES,
  });
  const [quietHoursStart, setQuietHoursStart] = useState<string>('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState<string>('08:00');
  const [sysNotifMessage, setSysNotifMessage] = useState<string | null>(null);

  // Recommendation State
  const [recommendation, setRecommendation] = useState<AdaptiveRecommendation | null>(null);
  const [showLevelConfirm, setShowLevelConfirm] = useState(false);
  const [pendingLevel, setPendingLevel] = useState<CEFRLevel | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    Promise.all([
      practiceRepository.getPreferences(userId),
      practiceRepository.getSessions(userId, 10),
    ]).then(([prefs, sessions]) => {
      if (!isMounted) return;
      setCefrLevel(prefs.cefrLevel);
      setDifficulty(prefs.defaultDifficulty);
      setSessionLength(prefs.defaultSessionLength);
      setDailyGoal((prefs.dailyGoalMinutes as DailyGoalOption) || 15);
      setCorrectionTiming(prefs.correctionTiming);
      setExplanationDepth(prefs.explanationDepth);
      setHintsEnabled(prefs.hintsEnabled);
      setInputMode(prefs.inputMode);
      setPracticeDays(prefs.practiceDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
      setReminder(prefs.reminderFrequency);
      setReminderTime(prefs.reminderTime || '09:00');
      setInAppRemindersEnabled(prefs.inAppRemindersEnabled ?? true);
      setSystemNotificationsEnabled(prefs.systemNotificationsEnabled ?? false);
      setNotificationCategories(prefs.notificationCategories || { ...DEFAULT_NOTIFICATION_CATEGORIES });
      setQuietHoursStart(prefs.quietHoursStart || '22:00');
      setQuietHoursEnd(prefs.quietHoursEnd || '08:00');

      const rec = generateAdaptiveRecommendation(prefs, sessions);
      setRecommendation(rec);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleToggleDay = (day: PracticeDay) => {
    if (practiceDays.includes(day)) {
      if (practiceDays.length > 1) {
        setPracticeDays(practiceDays.filter((d) => d !== day));
      }
    } else {
      setPracticeDays([...practiceDays, day]);
    }
  };

  const handleLevelSelect = (level: CEFRLevel) => {
    if (level === cefrLevel) return;
    setPendingLevel(level);
    setShowLevelConfirm(true);
  };

  const confirmLevelChange = () => {
    if (pendingLevel) {
      setCefrLevel(pendingLevel);
      setPendingLevel(null);
      setShowLevelConfirm(false);
    }
  };

  const applyRecommendation = () => {
    if (!recommendation) return;
    setDifficulty(recommendation.suggestedDifficulty);
    setHintsEnabled(recommendation.suggestedHints);
    setSessionLength(recommendation.suggestedSessionLength);
  };

  const handleToggleSystemNotifications = async () => {
    if (!systemNotificationsEnabled) {
      const status = systemNotificationService.getStatus();
      if (!status.isSupported) {
        setSysNotifMessage('System notifications are not supported in this browser environment.');
        return;
      }
      const perm = await systemNotificationService.requestPermission();
      if (perm === 'granted') {
        setSystemNotificationsEnabled(true);
        setSysNotifMessage('Browser system notifications enabled.');
      } else {
        setSystemNotificationsEnabled(false);
        setSysNotifMessage('Permission was denied. In-app reminders will continue.');
      }
    } else {
      setSystemNotificationsEnabled(false);
      setSysNotifMessage(null);
    }
  };

  const handleToggleCategory = (catKey: keyof NotificationCategoryPreferences) => {
    setNotificationCategories((prev) => ({
      ...prev,
      [catKey]: !prev[catKey],
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updated = await practiceRepository.savePreferences(userId, {
        cefrLevel,
        defaultDifficulty: difficulty,
        defaultSessionLength: sessionLength,
        dailyGoalMinutes: dailyGoal,
        correctionTiming,
        explanationDepth,
        hintsEnabled,
        inputMode,
        practiceDays,
        reminderFrequency: reminder,
        reminderTime,
        inAppRemindersEnabled,
        systemNotificationsEnabled,
        notificationCategories,
        quietHoursStart,
        quietHoursEnd,
      });
      setSaveSuccess(true);
      onSaved?.(updated);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 600);
    } catch (err) {
      console.error('Failed to save practice preferences:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

  return (
    <div 
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-[#15164B]/40 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Practice Preferences"
      aria-labelledby="practice-prefs-title"
    >
      <div className="w-full max-w-[480px] bg-white rounded-[32px] p-5 sm:p-6 shadow-2xl border border-[#ECEEFE] space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-1 border-b border-[#F0F2FE]">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#545CA6]">
              <Sliders className="w-3.5 h-3.5" />
              <span>Personalized Coach</span>
            </div>
            <h2 id="practice-prefs-title" className="text-[20px] font-black text-[#15164B] tracking-tight">
              Practice Preferences
            </h2>
            <p className="text-[12px] font-medium text-[#6B7094]">
              Tune your proficiency level, pace, feedback, and weekly schedule.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] text-[#222149] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close practice preferences"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* 1. Adaptive Recommendation Card */}
        {recommendation && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#F0F3FE] to-[#F8F9FF] border border-[#DEE3FA] space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#545CA6]">
                <Sparkles className="w-3.5 h-3.5 text-[#FF6243]" />
                <span>Coach Insight</span>
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                recommendation.status === 'step_up_ready' ? 'bg-[#10B981]/10 text-[#059669]' :
                recommendation.status === 'needs_support' ? 'bg-[#FF6243]/10 text-[#FF6243]' :
                'bg-[#545CA6]/10 text-[#545CA6]'
              }`}>
                {recommendation.status === 'step_up_ready' ? 'Ready to Advance' :
                 recommendation.status === 'needs_support' ? 'Extra Support' :
                 recommendation.status === 'optimal_challenge' ? 'Optimal Pace' : 'Baseline Gathering'}
              </span>
            </div>
            <p className="text-[12px] text-[#222149] leading-relaxed font-medium">
              {recommendation.explanation}
            </p>
            {recommendation.status !== 'building_baseline' && recommendation.suggestedDifficulty !== difficulty && (
              <button
                type="button"
                onClick={applyRecommendation}
                className="text-[11px] font-bold text-[#545CA6] hover:text-[#15164B] flex items-center gap-1 cursor-pointer pt-0.5"
              >
                <span>Apply suggested {recommendation.suggestedDifficulty.toUpperCase()} difficulty</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* 2. English Proficiency Level (CEFR) */}
        <div className="space-y-2">
          <label className="text-[12px] font-bold uppercase tracking-wider text-[#15164B] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#545CA6]" />
              <span>English Proficiency (CEFR)</span>
            </span>
            <span className="text-[11px] font-extrabold text-[#545CA6]">
              Current: {cefrLevel}
            </span>
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {CEFR_LEVELS.map((lvl) => {
              const isSelected = cefrLevel === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => handleLevelSelect(lvl)}
                  className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    isSelected
                      ? 'bg-[#15164B] text-white border-[#15164B] shadow-xs'
                      : 'bg-[#F9FAFF] text-[#222149] border-[#E2E6FA] hover:bg-[#EFF2FD]'
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`Select CEFR level ${lvl}`}
                >
                  <span className="text-[13px] font-black">{lvl}</span>
                  <span className={`text-[8.5px] font-bold truncate max-w-full px-0.5 ${isSelected ? 'text-[#C5CCFA]' : 'text-[#7D82A8]'}`}>
                    {lvl === 'A1' ? 'Beginner' : lvl === 'A2' ? 'Elem.' : lvl === 'B1' ? 'Inter.' : lvl === 'B2' ? 'Upper' : 'Adv.'}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-[#6B7094] leading-relaxed bg-[#F4F6FE] p-2.5 rounded-xl border border-[#E8EBFC]">
            {CEFR_LEVEL_DESCRIPTIONS[cefrLevel]?.description || 'Practical communicative English competence.'}
          </p>

          {/* Level confirmation prompt */}
          {showLevelConfirm && pendingLevel && (
            <div className="p-3 rounded-2xl bg-[#FFF7ED] border border-[#FED7AA] space-y-2 animate-in fade-in">
              <p className="text-[11.5px] font-medium text-[#9A3412]">
                Switch proficiency level to <strong>{pendingLevel} ({CEFR_LEVEL_DESCRIPTIONS[pendingLevel]?.name})</strong>? 
                This will adapt conversation complexity, story readers, and lesson recommendations.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={confirmLevelChange}
                  className="px-3 py-1 rounded-lg bg-[#EA580C] hover:bg-[#C2410C] text-white text-[11px] font-bold cursor-pointer"
                >
                  Confirm Level Change
                </button>
                <button
                  type="button"
                  onClick={() => { setShowLevelConfirm(false); setPendingLevel(null); }}
                  className="px-2.5 py-1 text-[11px] font-semibold text-[#7C2D12] hover:underline cursor-pointer"
                >
                  Keep {cefrLevel}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Difficulty Tier Selection */}
        <div className="space-y-2">
          <label className="text-[12px] font-bold uppercase tracking-wider text-[#15164B] flex items-center justify-between">
            <span>Difficulty Mode</span>
            <span className="text-[11px] font-semibold text-[#545CA6] capitalize">
              {difficulty}
            </span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['easy', 'medium', 'hard'] as PracticeDifficulty[]).map((level) => {
              const isSelected = difficulty === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    isSelected
                      ? 'bg-[#15164B] text-white border-[#15164B] shadow-sm scale-101'
                      : 'bg-[#F9FAFF] text-[#222149] border-[#E2E6FA] hover:bg-[#EFF2FD]'
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className="text-[13px] font-black capitalize">{level}</span>
                  <span className={`text-[10px] font-semibold ${isSelected ? 'text-[#C5CCFA]' : 'text-[#7D82A8]'}`}>
                    {level === 'easy' ? '0.8x • Extra Hints' : level === 'medium' ? '1.0x • Balanced' : '1.15x • Challenge'}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-[#6B7094] leading-relaxed bg-[#F4F6FE] p-2.5 rounded-xl border border-[#E8EBFC]">
            <Info className="w-3.5 h-3.5 inline mr-1 text-[#545CA6] -mt-0.5" />
            {DIFFICULTY_DESCRIPTIONS[difficulty].description}
          </p>
        </div>

        {/* 4. Session Length & Daily Goal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Session Length */}
          <div className="space-y-1.5">
            <label className="text-[11.5px] font-bold uppercase tracking-wider text-[#15164B] flex items-center justify-between">
              <span>Session Length</span>
              <span className="text-[10.5px] font-semibold text-[#545CA6]">
                {SESSION_LENGTH_RANGES[sessionLength].range}
              </span>
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['quick', 'standard', 'extended'] as PracticeSessionLength[]).map((len) => {
                const isSelected = sessionLength === len;
                return (
                  <button
                    key={len}
                    type="button"
                    onClick={() => setSessionLength(len)}
                    className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-[#15164B] text-white border-[#15164B]'
                        : 'bg-[#F9FAFF] text-[#222149] border-[#E2E6FA] hover:bg-[#EFF2FD]'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <span className="text-[11px] font-bold capitalize">{len}</span>
                    <span className={`text-[9px] ${isSelected ? 'text-[#C5CCFA]' : 'text-[#7D82A8]'}`}>
                      {SESSION_LENGTH_RANGES[len].range}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Goal */}
          <div className="space-y-1.5">
            <label className="text-[11.5px] font-bold uppercase tracking-wider text-[#15164B] flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3 text-[#FF6243]" />
                <span>Daily Goal</span>
              </span>
              <span className="text-[11px] font-black text-[#15164B]">
                {dailyGoal} min
              </span>
            </label>
            <div className="grid grid-cols-5 gap-1">
              {VALID_DAILY_GOALS.map((min) => {
                const isSelected = dailyGoal === min;
                return (
                  <button
                    key={min}
                    type="button"
                    onClick={() => setDailyGoal(min)}
                    className={`py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer border text-center ${
                      isSelected
                        ? 'bg-[#545CA6] text-white border-[#545CA6]'
                        : 'bg-white text-[#52577F] border-[#E0E3F8] hover:bg-[#F2F4FD]'
                    }`}
                    aria-pressed={isSelected}
                  >
                    {min}m
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. Correction and Feedback Preferences */}
        <div className="space-y-2.5 pt-1 border-t border-[#F0F2FE]">
          <label className="text-[12px] font-bold uppercase tracking-wider text-[#15164B] flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#545CA6]" />
            <span>Feedback & Coaching Style</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setCorrectionTiming(correctionTiming === 'immediate' ? 'end_of_session' : 'immediate')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                correctionTiming === 'immediate'
                  ? 'bg-[#F0F3FE] border-[#545CA6] text-[#15164B]'
                  : 'bg-white border-[#E2E6FA] text-[#474B75]'
              }`}
            >
              <span className="text-[11px] font-bold flex items-center justify-between">
                <span>Immediate Feedback</span>
                {correctionTiming === 'immediate' && <CheckCircle2 className="w-3.5 h-3.5 text-[#545CA6]" />}
              </span>
              <span className="text-[9.5px] text-[#6B7094]">
                Correct sentences right after submission
              </span>
            </button>

            <button
              type="button"
              onClick={() => setExplanationDepth(explanationDepth === 'gentle' ? 'detailed' : 'gentle')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                explanationDepth === 'detailed'
                  ? 'bg-[#F0F3FE] border-[#545CA6] text-[#15164B]'
                  : 'bg-white border-[#E2E6FA] text-[#474B75]'
              }`}
            >
              <span className="text-[11px] font-bold flex items-center justify-between">
                <span>{explanationDepth === 'detailed' ? 'Detailed Analysis' : 'Gentle Guidance'}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#545CA6]" />
              </span>
              <span className="text-[9.5px] text-[#6B7094]">
                {explanationDepth === 'detailed' ? 'Deep grammar rule explanations' : 'Concise conversational tips'}
              </span>
            </button>
          </div>

          {/* Hints Toggle & Interaction Mode */}
          <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#F6F7FE] border border-[#ECEEFE]">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#F59E0B]" />
              <div>
                <span className="text-[11.5px] font-bold text-[#1C2046] block">Contextual Hints</span>
                <span className="text-[9.5px] text-[#7D82A8]">Show optional vocabulary and structure hints</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHintsEnabled(!hintsEnabled)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                hintsEnabled ? 'bg-[#545CA6]' : 'bg-[#D1D5DB]'
              }`}
              role="switch"
              aria-checked={hintsEnabled}
              aria-label="Toggle contextual hints"
            >
              <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                hintsEnabled ? 'left-6' : 'left-1'
              }`} />
            </button>
          </div>
        </div>

        {/* 6. Practice Frequency & Schedule */}
        <div className="space-y-2 pt-1 border-t border-[#F0F2FE]">
          <label className="text-[12px] font-bold uppercase tracking-wider text-[#15164B] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#545CA6]" />
              <span>Preferred Practice Days</span>
            </span>
            <span className="text-[11px] font-semibold text-[#545CA6]">
              {practiceDays.length} days / week
            </span>
          </label>
          <div className="flex items-center justify-between gap-1">
            {ALL_PRACTICE_DAYS.map((day) => {
              const isSelected = practiceDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleToggleDay(day)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border text-center ${
                    isSelected
                      ? 'bg-[#15164B] text-white border-[#15164B]'
                      : 'bg-white text-[#6B7094] border-[#E2E6FA] hover:bg-[#F2F4FD]'
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`Toggle practice day ${day}`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Reminder Preferences */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11.5px] font-bold text-[#15164B]">
              <span className="flex items-center gap-1.5">
                <Bell className="w-3 h-3 text-[#545CA6]" />
                <span>Optional Reminder</span>
              </span>
              <div className="flex items-center gap-1">
                {(['off', 'daily', 'weekdays'] as ReminderFrequency[]).map((freq) => (
                  <button
                    key={freq}
                    type="button"
                    onClick={() => setReminder(freq)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize cursor-pointer ${
                      reminder === freq
                        ? 'bg-[#15164B] text-white'
                        : 'bg-[#F4F5FD] text-[#6B7094] hover:bg-[#E8EBFB]'
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>

            {reminder !== 'off' && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#F6F7FE] border border-[#ECEEFE] text-[11.5px]">
                <span className="font-bold text-[#1C2046] flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-[#545CA6]" />
                  Notification Time
                </span>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="bg-white border border-[#D5D8EE] rounded-lg px-2 py-0.5 text-[11.5px] font-bold text-[#1C2046] focus:outline-hidden focus:ring-1 focus:ring-[#545CA6]"
                  aria-label="Preferred reminder time"
                />
              </div>
            )}
          </div>

          {/* Smart In-App & System Notification Channels */}
          <div className="space-y-2 pt-2 border-t border-[#F0F2FE]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#15164B] block">
              Notification Delivery & Categories
            </span>

            {/* In-App Reminders Switch */}
            <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-[#F6F7FE] border border-[#ECEEFE]">
              <div>
                <span className="text-[11px] font-bold text-[#1C2046] block">In-App Reminders</span>
                <span className="text-[9.5px] text-[#7D82A8]">Unobtrusive banners for streaks, vocabulary, and challenges</span>
              </div>
              <button
                type="button"
                onClick={() => setInAppRemindersEnabled(!inAppRemindersEnabled)}
                className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                  inAppRemindersEnabled ? 'bg-[#545CA6]' : 'bg-[#D1D5DB]'
                }`}
                role="switch"
                aria-checked={inAppRemindersEnabled}
                aria-label="Toggle in-app reminders"
              >
                <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-1 transition-transform ${
                  inAppRemindersEnabled ? 'left-5.5' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Browser System Notifications Switch */}
            <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-[#F6F7FE] border border-[#ECEEFE]">
              <div>
                <span className="text-[11px] font-bold text-[#1C2046] block">Browser Notifications</span>
                <span className="text-[9.5px] text-[#7D82A8]">Optional system alerts when reviews are due (explicit opt-in)</span>
              </div>
              <button
                type="button"
                onClick={handleToggleSystemNotifications}
                className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                  systemNotificationsEnabled ? 'bg-[#545CA6]' : 'bg-[#D1D5DB]'
                }`}
                role="switch"
                aria-checked={systemNotificationsEnabled}
                aria-label="Toggle browser system notifications"
              >
                <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-1 transition-transform ${
                  systemNotificationsEnabled ? 'left-5.5' : 'left-1'
                }`} />
              </button>
            </div>

            {sysNotifMessage && (
              <p className="text-[10px] text-[#545CA6] font-medium px-1">
                {sysNotifMessage}
              </p>
            )}

            {/* Notification Categories Grid */}
            <div className="space-y-1 pt-1">
              <span className="text-[10.5px] font-bold text-[#6B7094] block">Active Reminder Categories</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'streaks', label: '🔥 Streaks' },
                  { key: 'vocabulary', label: '📚 Vocabulary' },
                  { key: 'dailyChallenge', label: '🎯 Daily Challenge' },
                  { key: 'unfinished', label: '⚡ Goal Progress' },
                  { key: 'milestones', label: '🌟 Milestones' },
                ].map(({ key, label }) => {
                  const catKey = key as keyof NotificationCategoryPreferences;
                  const isActive = notificationCategories[catKey];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleToggleCategory(catKey)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                        isActive
                          ? 'bg-[#15164B] text-white border-[#15164B]'
                          : 'bg-white text-[#7D82A8] border-[#ECEEFE] hover:bg-[#F2F4FD]'
                      }`}
                      aria-pressed={isActive}
                      aria-label={`Toggle reminder category ${label}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quiet Hours Note */}
            <div className="flex items-center gap-1.5 text-[9.5px] text-[#7D82A8] bg-[#F4F5FD] px-2.5 py-1.5 rounded-lg border border-[#ECEEFE]">
              <Clock className="w-3 h-3 text-[#545CA6] shrink-0" />
              <span>Quiet Hours: 10:00 PM – 8:00 AM (reminders paused to prevent disruption)</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-[#7D82A8] pt-0.5">
            <ShieldCheck className="w-3 h-3 text-[#10B981] shrink-0" />
            <span>FSRS spaced-repetition schedules are calculated independently based on memory retention.</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-2 border-t border-[#F0F2FE]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-full bg-[#F4F5FD] hover:bg-[#E8EBFB] text-[#52577F] text-[13px] font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3 rounded-full bg-[#15164B] hover:bg-[#0E1038] text-white text-[13px] font-black transition-all shadow-md hover:scale-101 active:scale-99 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Saved!</span>
              </>
            ) : isSaving ? (
              <span>Saving...</span>
            ) : (
              <span>Save Preferences</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
