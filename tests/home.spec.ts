import { test, expect } from '@playwright/test';

test.describe('Lexi Home Page Verification', () => {
  test('renders all approved visual zones and captures screenshots', async ({ page }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('net::ERR_')) {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // 1. Verify Header
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByText('Lexi')).toBeVisible();
    await expect(page.getByText('Your English Companion')).toBeVisible();
    await expect(page.getByText('🔥')).toBeVisible();
    await expect(page.getByText('7')).toBeVisible();

    // 2. Verify Hero
    await expect(page.getByText('A BRIGHTER YOU')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Learn English/i })).toBeVisible();
    await expect(page.getByText('Your Way')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Learning English' })).toBeVisible();
    await expect(page.getByAltText(/Student sitting comfortably/i)).toBeVisible();

    // 3. Verify 5 Category Shortcuts
    await expect(page.getByRole('button', { name: /^Conversation:/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Stories:/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Vocabulary:/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Grammar:/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Listening:/i })).toBeVisible();

    // 4. Verify Featured Banner
    await expect(page.getByText('FEATURED FOR YOU')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Café Conversation' })).toBeVisible();
    await expect(page.getByText('5-8 min')).toBeVisible();
    await expect(page.getByText('Beginner')).toBeVisible();

    // 5. Verify Quick Picks
    await expect(page.getByRole('heading', { name: 'Quick Picks' })).toBeVisible();
    await expect(page.getByText("Let's Talk")).toBeVisible();
    await expect(page.getByText('Short Stories')).toBeVisible();
    await expect(page.getByText('Word of the Day')).toBeVisible();
    await expect(page.getByText('Listen & Repeat')).toBeVisible();

    // 6. Verify Bottom Navigation
    const nav = page.getByRole('navigation', { name: 'Main Navigation' });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page');

    // Capture screenshots
    const isMobile = testInfo.project.name.includes('Mobile');
    const screenshotPath = isMobile
      ? 'docs/testing/screenshots/home_screen_mobile.png'
      : 'docs/testing/screenshots/home_screen_desktop.png';

    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Assert zero console errors
    expect(consoleErrors).toEqual([]);
  });

  test('interactive modals work for Start Learning and Search', async ({ page }) => {
    await page.goto('/');

    // Test Search Modal
    await page.getByRole('button', { name: 'Search lessons and vocabulary' }).click();
    await expect(page.getByPlaceholder('Search grammar, stories, topics...')).toBeVisible();
    await page.getByPlaceholder('Search grammar, stories, topics...').fill('café');
    await expect(page.getByText('Ordering food at a café')).toBeVisible();
    await page.getByRole('button', { name: 'Close search' }).click();

    // Test Start Learning Modal
    await page.getByRole('button', { name: 'Start Learning English' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Daily Conversational English')).toBeVisible();
    await expect(page.getByText('Interactive Preview')).toBeVisible();

    // Select option & check answer
    await page.getByText('Certainly! Would you like that for here or to go?').click();
    await page.getByRole('button', { name: 'Check Answer' }).click();
    await expect(page.getByText('Great job!')).toBeVisible();
    await page.getByRole('button', { name: 'Continue Learning' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
