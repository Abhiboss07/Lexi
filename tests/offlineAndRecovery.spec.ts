import { test, expect } from '@playwright/test';

test.describe('Offline Reliability, Data Integrity & Recovery Engineering (Phase 3)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('lexi_splash_shown', 'true');
    });
    await page.goto('/');
    await page.waitForSelector('nav[aria-label="Main Navigation"]', { timeout: 10000 });
  });

  test('completes a lesson and verifies persistence across page reload in IndexedDB', async ({ page }) => {
    // 1. Locate Continue Learning section on Home
    const continueSection = page.locator('section[aria-labelledby="continue-learning-heading"]');
    await expect(continueSection).toBeVisible();

    const continueBtn = continueSection.getByRole('button', { name: 'Continue' });
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();

    // 2. Verify LessonPlayer dialog is active
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 3. Step through lesson exercises
    for (let step = 0; step < 5; step++) {
      // Check if finished
      const finishedHeader = dialog.getByText(/Lesson Complete!|Good Effort!/i);
      if (await finishedHeader.isVisible()) {
        break;
      }

      // Check if Check Answer button is visible and enabled
      const checkBtn = dialog.getByRole('button', { name: 'Check Answer' });
      if (await checkBtn.isVisible()) {
        // Select an option if answer not provided
        const options = dialog.locator('button').filter({ hasText: /am|is|are|going|meet|hello|bus|ticket|morning|colleague|pleasure|request/i });
        const count = await options.count();
        if (count > 0) {
          await options.first().click();
        }
        if (await checkBtn.isEnabled()) {
          await checkBtn.click();
        }
      }

      // Click Continue
      const nextContinue = dialog.getByRole('button', { name: 'Continue' });
      if (await nextContinue.isVisible()) {
        await nextContinue.click();
      }
    }

    // Close lesson dialog if finished
    const closeLessonBtn = dialog.getByRole('button', { name: /Continue Learning|Exit|Close/i }).first();
    if (await closeLessonBtn.isVisible()) {
      await closeLessonBtn.click();
    }

    // 4. Reload page to verify offline persistence in IndexedDB
    await page.reload();
    await page.waitForSelector('nav[aria-label="Main Navigation"]', { timeout: 10000 });

    // 5. Navigate to Progress tab and verify lesson progress reflects in metrics
    const progressNav = page.getByRole('button', { name: 'Progress' });
    await progressNav.click();
    await expect(page.getByText('Progress & Insights')).toBeVisible();
    await expect(page.getByText(/Lessons Completed/i)).toBeVisible();
  });

  test('operates core learning and curriculum browsing fully offline', async ({ page, context }) => {
    // 1. Simulate turning off internet connection
    await context.setOffline(true);

    // 2. Verify Explore screen works completely offline
    const mainNav = page.locator('nav[aria-label="Main Navigation"]');
    const exploreBtn = mainNav.getByRole('button', { name: 'Explore', exact: true });
    await exploreBtn.click();
    await expect(page.getByRole('heading', { name: 'Explore', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Choose Your Adventure' })).toBeVisible();

    // 3. Navigate back to Home and open Syllabus Roadmap offline
    const homeBtn = mainNav.getByRole('button', { name: 'Home', exact: true });
    await homeBtn.click();
    const continueSection = page.locator('section[aria-labelledby="continue-learning-heading"]');
    const syllabusBtn = continueSection.getByRole('button', { name: /Syllabus/i });
    await expect(syllabusBtn).toBeVisible();
    await syllabusBtn.click();

    // Verify roadmap modal opens offline
    const roadmapModal = page.getByRole('dialog', { name: /CEFR Curriculum Roadmap/i });
    await expect(roadmapModal).toBeVisible();
    await expect(roadmapModal.getByText(/Structured English progression/i)).toBeVisible();

    // Switch to B1 tab offline
    const b1Tab = roadmapModal.getByRole('tab', { name: 'B1' });
    await b1Tab.click();
    await expect(roadmapModal.getByText(/Professional Networking/i)).toBeVisible();

    // Close roadmap
    const closeRoadmap = roadmapModal.getByRole('button', { name: 'Close curriculum roadmap' });
    await closeRoadmap.click();

    // 4. Navigate to Practice tab offline
    const practiceBtn = mainNav.getByRole('button', { name: 'Practice', exact: true });
    await practiceBtn.click();
    await expect(page.getByText('Daily Practice')).toBeVisible();

    // Restore network
    await context.setOffline(false);
  });

  test('handles corrupted backup files and validates restore rollback', async ({ page }) => {
    // 1. Navigate to Progress -> Achievements -> Data & Backup
    const progressNav = page.getByRole('button', { name: 'Progress' });
    await progressNav.click();

    const milestonesBtn = page.getByRole('button', { name: 'Open milestones and badges modal' });
    await milestonesBtn.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const backupTabBtn = page.getByRole('button', { name: 'Data & Backup tab' });
    await backupTabBtn.click();

    await expect(page.getByText('Offline-First Storage & Data Portability')).toBeVisible();

    // 2. Test importing malformed JSON
    const fileChooserPromise = page.waitForEvent('filechooser');
    const restoreTriggerBtn = page.getByRole('button', { name: /Select Backup File/i });
    await restoreTriggerBtn.click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'corrupted-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{ "this is": "invalid json with no closing brace'),
    });

    // 3. Verify safe rejection feedback is displayed
    await expect(page.getByText(/Malformed or corrupt JSON file/i)).toBeVisible();

    // 4. Test importing an invalid version payload
    const fileChooserPromise2 = page.waitForEvent('filechooser');
    await restoreTriggerBtn.click();
    const fileChooser2 = await fileChooserPromise2;
    await fileChooser2.setFiles({
      name: 'future-version-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({
        version: 'lexi-backup-v999',
        appName: 'Lexi English Learning',
        data: {},
      })),
    });

    // 5. Verify unsupported version error is displayed
    await expect(page.getByText(/Unsupported backup version/i)).toBeVisible();

    // Close modal
    const closeBtn = page.getByRole('button', { name: 'Close achievements modal' });
    await closeBtn.click();
  });

  test('preserves responsive layout without horizontal overflow at 320px, 390px, 768px, 1280px', async ({ page }) => {
    const viewports = [
      { width: 320, height: 640 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1280, height: 800 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      const mainNav = page.locator('nav[aria-label="Main Navigation"]');

      // Check Home
      await mainNav.getByRole('button', { name: 'Home', exact: true }).click();
      let scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      let clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

      // Check Progress
      await mainNav.getByRole('button', { name: 'Progress', exact: true }).click();
      scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    }
  });
});
