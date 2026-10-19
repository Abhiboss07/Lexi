import { test, expect } from '@playwright/test';

test.describe('Learner Achievements & Offline Backup System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to settle and splash screen to transition
    await page.waitForSelector('nav[aria-label="Main Navigation"]', { timeout: 10000 });
  });

  test('opens Achievements modal from Progress header and displays badges', async ({ page }) => {
    // 1. Navigate to Progress tab
    const progressNavBtn = page.getByRole('button', { name: 'Progress' });
    await progressNavBtn.click();

    // 2. Locate Milestones & Badges button in header
    const milestonesBtn = page.getByRole('button', { name: 'Open milestones and badges modal' });
    await expect(milestonesBtn).toBeVisible();

    // 3. Click to open modal
    await milestonesBtn.click();

    // 4. Verify Achievements Modal is open
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    const modalTitle = page.locator('#achievements-modal-title');
    await expect(modalTitle).toBeVisible();
    await expect(modalTitle).toHaveText('Achievements & Milestones');

    // 5. Verify Badges Tab is active by default and renders milestone cards
    const badgesTabBtn = page.getByRole('button', { name: /Badges/i }).first();
    await expect(badgesTabBtn).toBeVisible();

    // Check presence of key milestone badges
    await expect(page.getByText('3-Day Spark')).toBeVisible();
    await expect(page.getByText('Week Warrior')).toBeVisible();
    await expect(page.getByText('First Word')).toBeVisible();

    // 6. Test Status Filtering
    const unlockedFilterBtn = page.getByRole('button', { name: /Unlocked \(/i });
    await unlockedFilterBtn.click();
    // In unlocked mode, unlocked badges are visible
    await expect(page.getByText('Week Warrior')).toBeVisible();

    const inProgressFilterBtn = page.getByRole('button', { name: /In Progress \(/i });
    await inProgressFilterBtn.click();
    // Monthly Legend (30-day streak) should be visible as in-progress
    await expect(page.getByText('Monthly Legend')).toBeVisible();

    // 7. Test Category Filtering
    // Reset to Unlocked and select Vocabulary
    await unlockedFilterBtn.click();
    const vocabCategoryBtn = modal.getByRole('button', { name: 'Vocabulary', exact: true });
    await vocabCategoryBtn.click();
    await expect(page.getByText('First Word')).toBeVisible();

    // 8. Close Modal using Close Button
    const closeBtn = page.getByRole('button', { name: 'Close achievements modal' });
    await closeBtn.click();
    await expect(modalTitle).not.toBeVisible();
  });

  test('inspects CEFR Certificates and details view', async ({ page }) => {
    const progressNavBtn = page.getByRole('button', { name: 'Progress' });
    await progressNavBtn.click();

    const milestonesBtn = page.getByRole('button', { name: 'Open milestones and badges modal' });
    await milestonesBtn.click();

    // Switch to Certificates Tab using explicit tab aria-label
    const certTabBtn = page.getByRole('button', { name: 'Certificates tab' });
    await certTabBtn.click();

    // Check certificate cards
    await expect(page.getByText('A1 Beginner Foundation Certificate')).toBeVisible();
    await expect(page.getByText('A2 Elementary Fluency Certificate')).toBeVisible();
    await expect(page.getByText('B1 Intermediate Communicator Certificate')).toBeVisible();

    // Check verified competencies list
    await expect(page.getByText('Everyday greetings and basic introductions')).toBeVisible();

    // If View Certificate is available for A1, click and view details
    const viewCertBtn = page.getByRole('button', { name: 'View Certificate' }).first();
    if (await viewCertBtn.isVisible()) {
      await viewCertBtn.click();
      await expect(page.getByText('Verified Credential')).toBeVisible();
      await expect(page.getByText(/LEXI-CEFR-A1/i)).toBeVisible();

      // Close certificate preview
      const doneBtn = page.getByRole('button', { name: 'Done' });
      await doneBtn.click();
      await expect(page.getByText('Verified Credential')).not.toBeVisible();
    }
  });

  test('validates offline data backup export workflow', async ({ page }) => {
    const progressNavBtn = page.getByRole('button', { name: 'Progress' });
    await progressNavBtn.click();

    const milestonesBtn = page.getByRole('button', { name: 'Open milestones and badges modal' });
    await milestonesBtn.click();

    // Switch to Data & Backup Tab
    const backupTabBtn = page.getByRole('button', { name: 'Data & Backup tab' });
    await backupTabBtn.click();

    // Verify offline-first explanations
    await expect(page.getByText('Offline-First Storage & Data Portability')).toBeVisible();
    await expect(page.getByText('Export Learning Backup')).toBeVisible();
    await expect(page.getByText('Restore from Backup')).toBeVisible();

    // Click Export Backup button
    const exportBtn = page.getByRole('button', { name: /Download Backup/i });
    await expect(exportBtn).toBeVisible();

    // Listen for download or feedback
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 4000 }).catch(() => null),
      exportBtn.click(),
    ]);

    // If download event was captured, verify filename
    if (download) {
      expect(download.suggestedFilename()).toContain('lexi-backup-');
      expect(download.suggestedFilename()).toContain('.json');
    }

    // Verify success confirmation message appears
    await expect(page.getByText(/exported successfully/i)).toBeVisible();
  });

  test('streak pill in progress hero card opens Achievements modal', async ({ page }) => {
    const progressNavBtn = page.getByRole('button', { name: 'Progress' });
    await progressNavBtn.click();

    // Click interactive streak pill on hero
    const streakHeroBtn = page.getByRole('button', { name: 'View streak achievements' });
    await expect(streakHeroBtn).toBeVisible();
    await streakHeroBtn.click();

    // Check modal opened
    const modalTitle = page.locator('#achievements-modal-title');
    await expect(modalTitle).toBeVisible();
  });

  test('verifies responsive layout at 320px, 390px, and 1280px without horizontal overflow', async ({ page }) => {
    const viewports = [
      { width: 320, height: 640 },
      { width: 390, height: 844 },
      { width: 1280, height: 800 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/');
      await page.waitForSelector('nav[aria-label="Main Navigation"]', { timeout: 10000 });

      const progressNavBtn = page.getByRole('button', { name: 'Progress' });
      await progressNavBtn.click();

      const milestonesBtn = page.getByRole('button', { name: 'Open milestones and badges modal' });
      await milestonesBtn.click();

      const modalTitle = page.locator('#achievements-modal-title');
      await expect(modalTitle).toBeVisible();

      // Check horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);

      // Close modal
      const closeBtn = page.getByRole('button', { name: 'Close achievements modal' });
      await closeBtn.click();
    }
  });
});
