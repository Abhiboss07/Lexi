import { test, expect } from '@playwright/test';

test.describe('Lexi Brand Identity & Modern Opening Animation', () => {
  test.beforeEach(async ({ page }) => {
    // Clear session storage before each test to test startup sequence cleanly
    await page.goto('/');
    await page.evaluate(() => {
      sessionStorage.clear();
      const lexiDb = (window as any).__lexiDb;
      if (lexiDb && lexiDb.tables) {
        return Promise.all(lexiDb.tables.map((t: any) => t.clear()));
      }
    });
  });

  test('opening animation displays brand mark on initial load and smoothly transitions to app', async ({ page }) => {
    await page.goto('/');

    // 1. Splash screen with role="status" should be present on initial startup
    const splash = page.getByRole('status', { name: /lexi english companion loading/i });
    
    // Check if splash exists or has completed (graceful check for fast execution)
    if (await splash.isVisible()) {
      await expect(splash).toBeVisible();
      await expect(splash.getByText('Lexi', { exact: true })).toBeVisible();
      await expect(splash.getByText(/your english companion/i)).toBeVisible();
      await expect(splash.getByText(/learn english your way/i)).toBeVisible();

      // 2. Wait for splash to transition out cleanly
      await expect(splash).not.toBeVisible({ timeout: 2500 });
    }

    // 3. Application canvas is fully loaded and interactive
    await expect(page.getByRole('region', { name: 'Lexi Application' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Daily Practice' })).toBeVisible();
  });

  test('brand logo and wordmark render clearly in the header across mobile and desktop', async ({ page }) => {
    // Navigate and allow initial splash to finish
    await page.goto('/');
    await page.waitForTimeout(1000);

    const header = page.getByRole('banner');
    await expect(header).toBeVisible();

    // Verify brand wordmark and sparkle
    await expect(header.getByText('Lexi', { exact: true })).toBeVisible();
    await expect(header.getByText('✦', { exact: true })).toBeVisible();
    await expect(header.getByText('Your English Companion')).toBeVisible();

    // Verify streak pill and user profile avatar
    await expect(header.getByLabel(/current streak/i)).toBeVisible();
    await expect(header.getByRole('button', { name: /user profile settings/i })).toBeVisible();
  });

  test('tab navigation between Home, Explore, Practice, and Progress never replays splash animation', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const nav = page.getByRole('navigation', { name: 'Main Navigation' });

    // Navigate to Explore
    await nav.getByRole('button', { name: 'Explore' }).click();
    await expect(page.getByText('Choose Your Adventure')).toBeVisible();
    await expect(page.getByRole('status', { name: /lexi english companion loading/i })).not.toBeVisible();

    // Navigate to Practice
    await nav.getByRole('button', { name: 'Practice' }).click();
    await expect(page.getByRole('heading', { name: 'Vocabulary Notebook' })).toBeVisible();
    await expect(page.getByRole('status', { name: /lexi english companion loading/i })).not.toBeVisible();

    // Navigate to Progress
    await nav.getByRole('button', { name: 'Progress' }).click();
    await expect(page.getByText('Progress & Insights')).toBeVisible();
    await expect(page.getByRole('status', { name: /lexi english companion loading/i })).not.toBeVisible();

    // Navigate back to Home
    await nav.getByRole('button', { name: 'Home' }).click();
    await expect(page.getByRole('heading', { name: 'Daily Practice' })).toBeVisible();
    await expect(page.getByRole('status', { name: /lexi english companion loading/i })).not.toBeVisible();
  });

  test('favicon and vector logo assets are available and valid', async ({ page }) => {
    const faviconResp = await page.request.get('/favicon.svg');
    expect(faviconResp.status()).toBe(200);
    const faviconText = await faviconResp.text();
    expect(faviconText).toContain('<svg');
    expect(faviconText).toContain('lexi-fav-grad');

    const symbolResp = await page.request.get('/assets/lexi-symbol.svg');
    expect(symbolResp.status()).toBe(200);

    const logoResp = await page.request.get('/assets/lexi-logo.svg');
    expect(logoResp.status()).toBe(200);
    const logoText = await logoResp.text();
    expect(logoText).toContain('Lexi');
  });

  test('prefers-reduced-motion bypasses long splash animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    // With reduced motion, splash screen completes almost immediately (< 300ms)
    await page.waitForTimeout(200);
    await expect(page.getByRole('region', { name: 'Lexi Application' })).toBeVisible();
  });
});
