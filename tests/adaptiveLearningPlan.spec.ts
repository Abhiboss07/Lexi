import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Adaptive Learning Intelligence & Personalized Daily Study Plan', () => {
  const artifactsDir = '/home/abhiboss/.gemini/antigravity/brain/d20f30d9-d11b-4244-9752-50bc4be0eb44';
  const docsScreenshotsDir = '/home/abhiboss/Projects/Lexi/docs/testing/screenshots';

  test('renders Today\'s Learning Plan on Home with responsive layout across all viewports', async ({ page }) => {
    const viewports = [
      { width: 320, height: 640, label: '320px' },
      { width: 360, height: 740, label: '360px' },
      { width: 390, height: 844, label: '390px' },
      { width: 430, height: 932, label: '430px' },
      { width: 768, height: 1024, label: '768px' },
      { width: 1280, height: 800, label: '1280px' },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Wait for splash screen to complete if visible
      const splash = page.getByRole('status', { name: /lexi english companion loading/i });
      if (await splash.isVisible()) {
        await expect(splash).not.toBeVisible({ timeout: 5000 });
      }

      // Verify Today's Learning Plan is rendered
      const planSection = page.locator('section[aria-labelledby="todays-plan-heading"]');
      await expect(planSection).toBeVisible({ timeout: 7000 });
      await expect(planSection.getByRole('heading', { name: "Today's Learning Plan" })).toBeVisible();

      // Verify progress indicator and scheduled activities
      await expect(planSection.getByText(/Completed/i)).toBeVisible();
      await expect(planSection.getByText(/Scheduled Activities/i)).toBeVisible();

      // Check horizontal overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(overflow).toBe(false);

      // Save screenshot for mobile and desktop
      if (vp.label === '390px' || vp.label === '1280px') {
        await page.screenshot({ path: path.join(artifactsDir, `adaptive_plan_home_${vp.label}.png`) });
        await page.screenshot({ path: path.join(docsScreenshotsDir, `adaptive_plan_home_${vp.label}.png`) });
      }
    }
  });

  test('launches next recommended activity from the daily plan', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const splash = page.getByRole('status', { name: /lexi english companion loading/i });
    if (await splash.isVisible()) {
      await expect(splash).not.toBeVisible({ timeout: 5000 });
    }

    const planSection = page.locator('section[aria-labelledby="todays-plan-heading"]');
    await expect(planSection).toBeVisible({ timeout: 7000 });

    // Look for Start Activity button in the priority card
    const startBtn = planSection.getByRole('button', { name: /Start Activity/i });
    if (await startBtn.isVisible()) {
      await startBtn.click();

      // Either a dialog (review, lesson, or scenario) opens
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Close modal
      const closeBtn = dialog.getByRole('button', { name: /close/i });
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });

  test('displays real Adaptive Learning Intelligence on Progress Dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const splash = page.getByRole('status', { name: /lexi english companion loading/i });
    if (await splash.isVisible()) {
      await expect(splash).not.toBeVisible({ timeout: 5000 });
    }

    // Navigate to Progress tab
    await page.getByRole('navigation', { name: 'Main Navigation' }).getByRole('button', { name: 'Progress' }).click();

    // Verify Progress dashboard loaded
    await expect(page.getByRole('heading', { name: /Progress & Insights/i })).toBeVisible({ timeout: 7000 });

    // Verify Adaptive Learning Intelligence section
    const adaptiveSection = page.locator('section[aria-labelledby="Adaptive Learning Intelligence"], section[aria-label="Adaptive Learning Intelligence"]');
    await expect(adaptiveSection).toBeVisible({ timeout: 5000 });
    await expect(adaptiveSection.getByRole('heading', { name: 'Adaptive Learning Intelligence' })).toBeVisible();

    // Verify Strongest Skill & Improvement Opportunity
    await expect(adaptiveSection.getByText('Strongest Skill', { exact: true })).toBeVisible();
    await expect(adaptiveSection.getByText('Improvement Opportunity', { exact: true })).toBeVisible();
    await expect(adaptiveSection.getByText(/How Today's Study Plan Adapts to Your Progress/i)).toBeVisible();

    // Capture screenshot
    await page.screenshot({ path: path.join(artifactsDir, 'adaptive_progress_dashboard_390px.png') });
    await page.screenshot({ path: path.join(docsScreenshotsDir, 'adaptive_progress_dashboard_390px.png') });
  });
});
