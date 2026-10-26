import { test, expect } from '@playwright/test';
import { clearTestDatabase, seedPracticePreferences } from './testDbHelper';

test.describe('Lexi Daily Practice & Screen Refinements — Verification Screenshots', () => {
  const viewports = [
    { width: 320, height: 640, label: '320px' },
    { width: 360, height: 740, label: '360px' },
    { width: 390, height: 844, label: '390px' },
    { width: 430, height: 932, label: '430px' },
    { width: 768, height: 1024, label: '768px' },
    { width: 1280, height: 800, label: '1280px' },
  ];

  test('Captures responsive screenshots for Home Daily Practice', async ({ page }) => {
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await expect(page.getByRole('heading', { name: 'Daily Practice' })).toBeVisible();

      await page.screenshot({
        path: `docs/testing/screenshots/home_daily_practice_${vp.label}.png`,
        fullPage: true,
      });

      if (vp.label === '390px') {
        const dailySection = page.locator('section[aria-labelledby="daily-practice-heading"]');
        if (await dailySection.isVisible()) {
          await dailySection.screenshot({
            path: 'docs/testing/screenshots/daily_practice_card_390px.png',
          });
        }
      }
    }
  });

  test('Captures responsive screenshots for Practice Screen & Header Row', async ({ page }) => {
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      const nav = page.getByRole('navigation', { name: 'Main Navigation' });
      await nav.getByRole('button', { name: 'Practice' }).click();
      await expect(page.getByRole('heading', { name: 'Practice', exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Vocabulary Notebook' })).toBeVisible();

      await page.screenshot({
        path: `docs/testing/screenshots/practice_screen_${vp.label}.png`,
        fullPage: true,
      });

      if (vp.label === '390px') {
        const heroSection = page.locator('section[aria-labelledby="practice-hero-heading"]');
        if (await heroSection.isVisible()) {
          await heroSection.screenshot({
            path: 'docs/testing/screenshots/practice_hero_card_390px.png',
          });
        }
        const notebookSection = page.locator('#vocabulary-deck-section');
        if (await notebookSection.isVisible()) {
          await notebookSection.screenshot({
            path: 'docs/testing/screenshots/practice_notebook_section_390px.png',
          });
        }
      }
    }
  });

  test('Captures responsive screenshots for Progress Screen with Premium Hero & Compact FSRS', async ({ page }) => {
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      const nav = page.getByRole('navigation', { name: 'Main Navigation' });
      await nav.getByRole('button', { name: 'Progress' }).click();
      await expect(page.getByText('Progress & Insights')).toBeVisible();
      await expect(page.getByText('Your Progress,')).toBeVisible();

      const progressHeader = page.locator('header').filter({ hasText: 'Progress & Insights' });
      if (await progressHeader.isVisible()) {
        await progressHeader.screenshot({
          path: `docs/testing/screenshots/progress_header_${vp.label}.png`,
        });
      }

      await page.screenshot({
        path: `docs/testing/screenshots/progress_screen_${vp.label}.png`,
        fullPage: true,
      });

      if (vp.label === '390px') {
        const heroSection = page.locator('section[aria-label="Daily Goal and Streak Summary"]');
        if (await heroSection.isVisible()) {
          await heroSection.screenshot({
            path: 'docs/testing/screenshots/progress_hero_card_390px.png',
          });
        }
        const fsrsSection = page.locator('section[aria-label="FSRS Spaced-Repetition Memory Deck"]');
        if (await fsrsSection.isVisible()) {
          await fsrsSection.screenshot({
            path: 'docs/testing/screenshots/progress_fsrs_section_390px.png',
          });
        }
      }
    }
  });

  test('Captures responsive screenshots for Practice Preferences Modal', async ({ page }) => {
    for (const vp of [{ width: 390, height: 844, label: '390px' }, { width: 1280, height: 800, label: '1280px' }]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      const avatarBtn = page.getByRole('button', { name: /user profile settings/i });
      await avatarBtn.click();
      await expect(page.getByRole('dialog', { name: 'Practice Preferences' })).toBeVisible();

      await page.screenshot({
        path: `docs/testing/screenshots/practice_preferences_modal_${vp.label}.png`,
        fullPage: true,
      });
    }
  });

  test('Captures responsive screenshots for Explore Activities Hub', async ({ page }) => {
    for (const vp of [{ width: 390, height: 844, label: '390px' }, { width: 1280, height: 800, label: '1280px' }]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      const seeAllBtn = page.getByRole('button', { name: 'See All' }).first();
      await seeAllBtn.scrollIntoViewIfNeeded();
      await seeAllBtn.click();
      await expect(page.getByRole('dialog', { name: /explore learning activities/i })).toBeVisible();

      await page.screenshot({
        path: `docs/testing/screenshots/explore_activities_hub_${vp.label}.png`,
        fullPage: true,
      });
    }
  });

  test('Captures responsive screenshots for Opening Animation & Brand Splash', async ({ page }) => {
    for (const vp of [
      { width: 320, height: 640, label: '320px' },
      { width: 390, height: 844, label: '390px' },
      { width: 768, height: 1024, label: '768px' },
      { width: 1280, height: 800, label: '1280px' },
    ]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.evaluate(() => sessionStorage.clear());
      await page.reload();

      const splash = page.getByRole('status', { name: /lexi english companion loading/i });
      if (await splash.isVisible()) {
        await page.screenshot({
          path: `docs/testing/screenshots/brand_splash_${vp.label}.png`,
        });
      }
    }
  });

  test('Captures responsive screenshots for Smart Notification Toast', async ({ page }) => {
    // 1. Initial setup to guarantee toast appears regardless of time of day
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

    await expect(page.getByRole('heading', { name: 'Daily Practice' })).toBeVisible();

    const toast = page.locator('div[role="status"][aria-live="polite"]');
    await expect(toast).toBeVisible({ timeout: 5000 });

    // 2. Capture responsive screenshots across breakpoints
    for (const vp of [
      { width: 320, height: 640, label: '320px' },
      { width: 390, height: 844, label: '390px' },
      { width: 768, height: 1024, label: '768px' },
      { width: 1280, height: 800, label: '1280px' },
    ]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await expect(toast).toBeVisible();
      await page.screenshot({
        path: `docs/testing/screenshots/smart_notification_${vp.label}.png`,
      });
    }
  });
});


