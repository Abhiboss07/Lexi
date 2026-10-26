import { test, expect } from '@playwright/test';

const ARTIFACT_DIR = '/home/abhiboss/.gemini/antigravity/brain/d20f30d9-d11b-4244-9752-50bc4be0eb44';

test.describe('Lexi Phase 4 — Capture Accessibility Verification Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('lexi_splash_shown', 'true');
    });
  });

  test('Capture focus-visible state and skip link at 390px and 1280px', async ({ page }) => {
    for (const vp of [
      { width: 390, height: 844, label: '390px' },
      { width: 1280, height: 800, label: '1280px' },
    ]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Focus skip link
      const skipLink = page.locator('.skip-link');
      await skipLink.focus();

      await page.screenshot({
        path: `${ARTIFACT_DIR}/accessibility_skip_link_${vp.label}.png`,
        fullPage: false,
      });

      // Tab to bottom navigation to highlight focus visible ring
      const exploreTab = page.locator('nav[aria-label="Main Navigation"]').getByRole('button', { name: 'Explore' });
      await exploreTab.focus();

      await page.screenshot({
        path: `${ARTIFACT_DIR}/accessibility_focus_ring_${vp.label}.png`,
        fullPage: false,
      });
    }
  });

  test('Capture modal focus trap and accessible controls at 390px and 1280px', async ({ page }) => {
    for (const vp of [
      { width: 390, height: 844, label: '390px' },
      { width: 1280, height: 800, label: '1280px' },
    ]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const searchBtn = page.getByRole('button', { name: 'Search lessons and vocabulary' });
      await searchBtn.click();

      const searchModal = page.locator('div[role="dialog"]');
      await expect(searchModal).toBeVisible();

      await page.screenshot({
        path: `${ARTIFACT_DIR}/accessibility_search_modal_${vp.label}.png`,
        fullPage: false,
      });

      await page.keyboard.press('Escape');
      await expect(searchModal).not.toBeVisible();
    }
  });

  test('Capture Lesson Player with ARIA live feedback at 390px and 1280px', async ({ page }) => {
    for (const vp of [
      { width: 390, height: 844, label: '390px' },
      { width: 1280, height: 800, label: '1280px' },
    ]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: 'Start Learning English' }).click();
      const startLessonBtn = page.getByRole('button', { name: 'Start Interactive Lesson' });
      await startLessonBtn.click();

      const lessonDialog = page.getByRole('dialog', { name: /Saying Hello & Goodbye/i });
      await expect(lessonDialog).toBeVisible();

      await lessonDialog.getByRole('button', { name: 'Good morning!' }).click();
      await lessonDialog.getByRole('button', { name: 'Check Answer' }).click();

      const feedbackLiveRegion = lessonDialog.locator('[role="status"][aria-live="polite"]');
      await expect(feedbackLiveRegion).toBeVisible();

      await page.screenshot({
        path: `${ARTIFACT_DIR}/accessibility_lesson_feedback_${vp.label}.png`,
        fullPage: false,
      });

      await lessonDialog.getByRole('button', { name: 'Exit lesson' }).click();
    }
  });

  test('Capture 320px responsive reflow', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: `${ARTIFACT_DIR}/accessibility_reflow_320px.png`,
      fullPage: false,
    });
  });
});
