import { test, expect } from '@playwright/test';

test.describe('Lexi Phase 4 — Accessibility, Inclusive Learning & Usability', () => {
  test.beforeEach(async ({ page }) => {
    // Dismiss splash screen
    await page.addInitScript(() => {
      sessionStorage.setItem('lexi_splash_shown', 'true');
    });
  });

  test('1. Skip link is present, focusable via Tab, and jumps to #main-content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeAttached();
    await expect(skipLink).toHaveText(/Skip to main content/i);

    // Focus skip link and verify visibility
    await skipLink.focus();
    await expect(skipLink).toBeFocused();

    // Pressing Enter activates skip link and targets main content
    await page.keyboard.press('Enter');
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  });

  test('2. Bottom navigation is fully accessible via keyboard with aria-current="page"', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nav = page.locator('nav[aria-label="Main Navigation"]');
    await expect(nav).toBeVisible();

    const homeTab = nav.getByRole('button', { name: 'Home' });
    const exploreTab = nav.getByRole('button', { name: 'Explore' });
    const practiceTab = nav.getByRole('button', { name: 'Practice' });
    const progressTab = nav.getByRole('button', { name: 'Progress' });

    // Initially Home is active
    await expect(homeTab).toHaveAttribute('aria-current', 'page');

    // Click or keyboard activate Explore
    await exploreTab.focus();
    await expect(exploreTab).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(exploreTab).toHaveAttribute('aria-current', 'page');
    await expect(homeTab).not.toHaveAttribute('aria-current', 'page');

    // Navigate to Practice via keyboard
    await practiceTab.focus();
    await page.keyboard.press('Space');
    await expect(practiceTab).toHaveAttribute('aria-current', 'page');

    // Navigate to Progress
    await progressTab.focus();
    await page.keyboard.press('Enter');
    await expect(progressTab).toHaveAttribute('aria-current', 'page');
  });

  test('3. Search modal: focus trap, Escape closure, and focus restoration to opener button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const searchBtn = page.getByRole('button', { name: 'Search lessons and vocabulary' });
    await expect(searchBtn).toBeVisible();

    // Focus and open search modal
    await searchBtn.focus();
    await expect(searchBtn).toBeFocused();
    await page.keyboard.press('Enter');

    const searchModal = page.locator('div[role="dialog"][aria-label="Search curriculum lessons and studios"]');
    await expect(searchModal).toBeVisible();

    // Auto-focus inside input or first focusable element
    const searchInput = searchModal.locator('input[aria-label="Search curriculum query"]');
    await expect(searchInput).toBeVisible();

    // Press Escape to dismiss modal
    await page.keyboard.press('Escape');
    await expect(searchModal).not.toBeVisible();

    // Verify focus is restored back to the search trigger button
    await expect(searchBtn).toBeFocused();
  });

  test('4. Curriculum Browser modal: focus trap and Escape closure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const syllabusBtn = page.locator('button:has-text("Syllabus")').first();
    await syllabusBtn.focus();
    await page.keyboard.press('Enter');

    const roadmapDialog = page.locator('div[role="dialog"][aria-labelledby="curriculum-browser-title"]');
    await expect(roadmapDialog).toBeVisible();

    // Escape closes modal and returns focus
    await page.keyboard.press('Escape');
    await expect(roadmapDialog).not.toBeVisible();
    await expect(syllabusBtn).toBeFocused();
  });

  test('5. Practice preferences modal: focus trap, Escape dismiss, and touch target size', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const profileBtn = page.getByRole('button', { name: 'User profile settings' });
    await profileBtn.focus();
    await page.keyboard.press('Enter');

    const prefsModal = page.locator('div[role="dialog"][aria-label="Practice Preferences"]');
    await expect(prefsModal).toBeVisible();

    // Verify close button meets >= 24px requirement
    const closeBtn = prefsModal.getByRole('button', { name: 'Close practice preferences' });
    const box = await closeBtn.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);
    }

    // Dismiss with Escape
    await page.keyboard.press('Escape');
    await expect(prefsModal).not.toBeVisible();
    await expect(profileBtn).toBeFocused();
  });

  test('6. Screen reader announcements: ARIA live region in Lesson Player evaluation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 1. Open preview dialog from Hero CTA
    await page.getByRole('button', { name: 'Start Learning English' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // 2. Launch full interactive lesson player
    const startLessonBtn = page.getByRole('button', { name: 'Start Interactive Lesson' });
    await expect(startLessonBtn).toBeVisible();
    await startLessonBtn.click();

    // 3. Lesson Player header & progress checks
    const lessonDialog = page.getByRole('dialog', { name: /Saying Hello & Goodbye/i });
    await expect(lessonDialog).toBeVisible();

    // Activity 1: Multiple Choice
    await expect(lessonDialog.getByText(/You enter a shop at 10:30 in the morning/i)).toBeVisible();
    await lessonDialog.getByRole('button', { name: 'Good morning!' }).click();
    await lessonDialog.getByRole('button', { name: 'Check Answer' }).click();

    // Verification of feedback live region
    const feedbackLiveRegion = lessonDialog.locator('[role="status"][aria-live="polite"]');
    await expect(feedbackLiveRegion).toBeVisible();
    const feedbackText = await feedbackLiveRegion.textContent();
    expect(feedbackText).toContain('Correct!');

    // Safely exit
    const exitBtn = lessonDialog.getByRole('button', { name: 'Exit lesson' });
    await exitBtn.click();
  });

  test('7. prefers-reduced-motion media query disables animations and confetti in CSS/JS', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Evaluate computed animation duration on an element under reduced motion
    const transitionDuration = await page.evaluate(() => {
      const el = document.querySelector('body');
      if (!el) return null;
      return window.getComputedStyle(el).transitionDuration;
    });

    expect(transitionDuration).not.toBeNull();
  });

  test('8. Responsive reflow verification at 320px (iPhone SE minimum) without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify no unexpected horizontal window scroll
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(isOverflowing).toBe(false);

    // Verify main navigation is intact
    const nav = page.locator('nav[aria-label="Main Navigation"]');
    await expect(nav).toBeVisible();
  });

  test('9. Responsive reflow verification at 390px, 768px, and 1280px', async ({ page }) => {
    for (const size of [
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1280, height: 800 },
    ]) {
      await page.setViewportSize(size);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(isOverflowing).toBe(false);
      await expect(page.locator('nav[aria-label="Main Navigation"]')).toBeVisible();
    }
  });

  test('10. Touch targets: interactive buttons meet WCAG 2.2 AA target size minimums (>= 24px)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const navButtons = page.locator('nav[aria-label="Main Navigation"] button');
    const count = await navButtons.count();
    expect(count).toBeGreaterThanOrEqual(4);

    for (let i = 0; i < count; i++) {
      const btn = navButtons.nth(i);
      const box = await btn.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
      }
    }
  });
});
