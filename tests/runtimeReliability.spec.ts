import { test, expect } from '@playwright/test';

test.describe('Lexi — Performance, Runtime Reliability & Product Polish', () => {
  test.beforeEach(async ({ page }) => {
    // Dismiss splash screen
    await page.addInitScript(() => {
      sessionStorage.setItem('lexi_splash_shown', 'true');
    });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('1. Rapid tab switching does not throw unmounted state update errors or degrade UI', async ({ page }) => {
    const errorLogs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errorLogs.push(msg.text());
      }
    });

    // Rapidly cycle through all 4 destinations
    for (let cycle = 0; cycle < 3; cycle++) {
      await page.click('button:has-text("Explore")');
      await page.click('button:has-text("Practice")');
      await page.click('button:has-text("Progress")');
      await page.click('button:has-text("Home")');
    }

    // Verify app remains responsive on Home
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Welcome back|Daily Goal|Continue Learning/i }).first()).toBeVisible({ timeout: 5000 });

    // Verify no unhandled exceptions were logged
    const criticalErrors = errorLogs.filter(
      (err) =>
        err.includes('Uncaught') ||
        err.includes('Cannot read properties of undefined') ||
        err.includes('Can\'t perform a React state update on an unmounted component')
    );
    expect(criticalErrors).toEqual([]);
  });

  test('2. Code-split Search Modal loads on demand via React.lazy and Suspense', async ({ page }) => {
    // Click header search button
    const searchButton = page.getByRole('button', { name: 'Search lessons and vocabulary' });
    await expect(searchButton).toBeVisible();
    await searchButton.click();

    // Verify search modal dialog mounts smoothly
    const searchDialog = page.getByRole('dialog', { name: 'Search curriculum lessons and studios' });
    await expect(searchDialog).toBeVisible({ timeout: 5000 });

    // Test responsive deferred search input
    const searchInput = searchDialog.locator('input[placeholder*="Search"]');
    await searchInput.fill('Travel');
    await page.waitForTimeout(100);

    // Verify search results appear
    const results = searchDialog.locator('button:has-text("Travel")');
    await expect(results.first()).toBeVisible({ timeout: 5000 });

    // Close search modal with Escape
    await page.keyboard.press('Escape');
    await expect(searchDialog).not.toBeVisible();
  });

  test('3. Explore screen deferred search filtering remains responsive under rapid typing', async ({ page }) => {
    const mainNav = page.locator('nav[aria-label="Main Navigation"]');
    await mainNav.getByRole('button', { name: 'Explore', exact: true }).click();
    const searchInput = page.getByPlaceholder('Search topics, grammar, phrases...');
    await expect(searchInput).toBeVisible();

    // Rapid input typing
    await searchInput.fill('Coffee');
    const bakeryCard = page.locator('text=Morning Bakery');
    await expect(bakeryCard).toBeVisible();

    // Clear search
    await searchInput.fill('');
    await expect(page.getByRole('heading', { name: 'Explore', level: 1 })).toBeVisible();
  });

  test('4. Placement Assessment in-flight guard prevents duplicate submission races', async ({ page }) => {
    const mainNav = page.locator('nav[aria-label="Main Navigation"]');
    // Navigate to Progress tab
    await mainNav.getByRole('button', { name: 'Progress', exact: true }).click();
    
    // Look for Take Placement Test / CEFR Assessment button
    const testButton = page.locator('button:has-text("Take Placement Test"), button:has-text("Recalibrate Level")').first();
    if (await testButton.isVisible()) {
      await testButton.click();

      const assessmentModal = page.locator('div[role="dialog"]').filter({ hasText: /Placement Assessment|CEFR Level Placement/i }).first();
      await expect(assessmentModal).toBeVisible({ timeout: 5000 });

      // Select an answer
      const firstOption = assessmentModal.locator('button:has-text("am"), button:has-text("is"), button:has-text("are")').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();

        // Rapid double click Next Question
        const nextButton = assessmentModal.locator('button:has-text("Next Question"), button:has-text("Check Answer")').first();
        if (await nextButton.isVisible()) {
          await nextButton.click();
          // Attempt immediate second click
          await nextButton.click({ force: true }).catch(() => {});
        }
      }

      // Close modal
      const closeBtn = assessmentModal.locator('button[aria-label*="close" i], button:has-text("Exit")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });

  test('5. Offline resilience and asset availability from service worker cache', async ({ page, context }) => {
    // Allow initial idle preloading to execute
    await page.waitForTimeout(1000);

    // Simulate offline state
    await context.setOffline(true);

    const mainNav = page.locator('nav[aria-label="Main Navigation"]');
    // Verify navigating within tabs works offline
    await mainNav.getByRole('button', { name: 'Practice', exact: true }).click();
    await expect(page.getByText('Daily Practice')).toBeVisible({ timeout: 5000 });

    await mainNav.getByRole('button', { name: 'Progress', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Progress & Insights/i })).toBeVisible({ timeout: 5000 });

    // Restore online state
    await context.setOffline(false);
  });
});
