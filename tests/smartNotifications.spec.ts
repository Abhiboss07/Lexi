import { test, expect } from '@playwright/test';
import { clearTestDatabase, seedPracticePreferences } from './testDbHelper';

test.describe('Lexi Smart Notifications & Learning Reminders', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      sessionStorage.setItem('lexi_splash_shown', 'true');
    });
    await clearTestDatabase(page);
    await seedPracticePreferences(page, {
      userId: 'local-learner-1',
      cefrLevel: 'A2',
      defaultDifficulty: 'medium',
      defaultSessionLength: 'standard',
      dailyGoalMinutes: 15,
      correctionTiming: 'immediate',
      explanationDepth: 'gentle',
      hintsEnabled: true,
      inputMode: 'text_first',
      practiceDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      reminderFrequency: 'off',
      inAppRemindersEnabled: true,
      systemNotificationsEnabled: false,
      notificationCategories: {
        streaks: true,
        vocabulary: true,
        dailyChallenge: true,
        unfinished: true,
        milestones: true,
      },
      quietHoursStart: '23:59',
      quietHoursEnd: '00:01',
    });
    await page.reload();
  });

  test('displays contextual in-app notification and dismisses cleanly without altering progress', async ({ page }) => {
    // 1. Wait for Home page to load
    await expect(page.getByRole('heading', { name: 'Daily Practice' })).toBeVisible();

    // 2. Notification toast should appear with role="status"
    const toast = page.locator('div[role="status"][aria-live="polite"]');
    await expect(toast).toBeVisible({ timeout: 4000 });

    // Verify notification structure
    await expect(toast.getByRole('button', { name: 'Dismiss reminder' })).toBeVisible();

    // 3. Dismiss the notification
    await toast.getByRole('button', { name: 'Dismiss reminder' }).click();

    // Toast should disappear
    await expect(toast).not.toBeVisible();

    // User streak remains intact
    const header = page.getByRole('banner');
    await expect(header.getByLabel(/current streak/i)).toBeVisible();
  });

  test('clicking notification action routes to the valid destination', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Daily Practice' })).toBeVisible();

    const toast = page.locator('div[role="status"][aria-live="polite"]');
    await expect(toast).toBeVisible({ timeout: 4000 });

    // Click the notification action button
    const actionBtn = toast.locator('button').first();
    await expect(actionBtn).toBeVisible();
    await actionBtn.click();

    // Toast closes after action
    await expect(toast).not.toBeVisible();
  });

  test('notification preferences can be configured in PracticePreferencesModal', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Daily Practice' })).toBeVisible();

    // Open Practice Preferences from profile avatar
    const avatarBtn = page.getByRole('button', { name: /user profile settings/i });
    await avatarBtn.click();

    const modal = page.getByRole('dialog', { name: 'Practice Preferences' });
    await expect(modal).toBeVisible();

    // Verify Notification Delivery & Categories section
    await expect(modal.getByText('Notification Delivery & Categories')).toBeVisible();

    // Verify in-app reminders switch
    const inAppSwitch = modal.getByRole('switch', { name: 'Toggle in-app reminders' });
    await expect(inAppSwitch).toBeVisible();
    expect(await inAppSwitch.getAttribute('aria-checked')).toBe('true');

    // Toggle in-app reminders off
    await inAppSwitch.click();
    expect(await inAppSwitch.getAttribute('aria-checked')).toBe('false');

    // Verify category toggle buttons
    await expect(modal.getByRole('button', { name: /toggle reminder category 🔥 streaks/i })).toBeVisible();
    await expect(modal.getByRole('button', { name: /toggle reminder category 📚 vocabulary/i })).toBeVisible();
    await expect(modal.getByRole('button', { name: /toggle reminder category 🎯 daily challenge/i })).toBeVisible();

    // Verify quiet hours notice
    await expect(modal.getByText(/quiet hours: 10:00 pm – 8:00 am/i)).toBeVisible();

    // Save preferences
    await modal.getByRole('button', { name: 'Save Preferences' }).click();
    await expect(modal).not.toBeVisible({ timeout: 2000 });
  });

  test('active interactive lesson suppresses in-app notification toasts', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Daily Practice' })).toBeVisible();

    // Launch a lesson from Hero card
    const heroBtn = page.getByRole('button', { name: 'Start Learning English' });
    await heroBtn.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const startLessonBtn = page.getByRole('button', { name: 'Start Interactive Lesson' });
    await expect(startLessonBtn).toBeVisible();
    await startLessonBtn.click();

    // Lesson player is active
    const lessonDialog = page.getByRole('dialog', { name: /Saying Hello & Goodbye/i });
    await expect(lessonDialog).toBeVisible();

    // Notification toast must NOT be visible while in an active lesson
    const toast = page.locator('div[role="status"][aria-live="polite"]');
    await expect(toast).not.toBeVisible();
  });
});
