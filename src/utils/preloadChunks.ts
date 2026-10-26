/**
 * Idle-time preloader for code-split modal chunks and studios.
 *
 * Ensures that when the PWA runs offline, all dynamic feature chunks
 * have already been requested and cached by the Service Worker during browser idle.
 */
export function preloadLearningModals(): void {
  if (typeof window === 'undefined') return;

  const prefetch = () => {
    try {
      import('../components/lesson/LessonPlayer').catch(() => {});
      import('../components/vocabulary/ReviewPlayer').catch(() => {});
      import('../components/modals/SearchModal').catch(() => {});
      import('../components/modals/ActivityModal').catch(() => {});
      import('../components/modals/InteractiveScenarioModal').catch(() => {});
      import('../components/practice/PracticeModals').catch(() => {});
      import('../components/practice/PracticePreferencesModal').catch(() => {});
      import('../components/practice/ListeningVoiceStudioModal').catch(() => {});
      import('../components/practice/SpeakingPracticeModal').catch(() => {});
      import('../components/practice/ConversationCoachModal').catch(() => {});
      import('../components/assessment/PlacementAssessmentModal').catch(() => {});
      import('../components/modals/AchievementsModal').catch(() => {});
    } catch {
      // Ignore background prefetch errors
    }
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(prefetch, { timeout: 3500 });
  } else {
    setTimeout(prefetch, 2000);
  }
}
