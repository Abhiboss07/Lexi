import { test, expect } from '@playwright/test';

test.describe('Lexi Explore Page Verification & Interactivity Suite', () => {
  test('navigates to Explore screen and renders all approved sections', async ({ page }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('net::ERR_')) {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // 1. Navigate to Explore
    const nav = page.getByRole('navigation', { name: 'Main Navigation' });
    await expect(nav).toBeVisible();
    const exploreTab = nav.getByRole('button', { name: 'Explore' });
    await exploreTab.click();
    await expect(exploreTab).toHaveAttribute('aria-current', 'page');

    // 2. Verify Explore Header & Search
    await expect(page.getByRole('heading', { name: 'Explore', level: 1 })).toBeVisible();
    await expect(page.getByText('Discover lessons, stories, and real-world conversations')).toBeVisible();
    const searchInput = page.getByPlaceholder('Search topics, grammar, phrases...');
    await expect(searchInput).toBeVisible();

    // 3. Verify Continue Your Journey Card
    await expect(page.getByRole('heading', { name: 'Continue Your Journey' })).toBeVisible();
    await expect(page.getByText('UNIT 3 • GRAMMAR')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Present vs Past' })).toBeVisible();
    await expect(page.getByText('60%')).toBeVisible();
    await expect(page.getByText('Continue', { exact: true })).toBeVisible();

    // 4. Verify Choose Your Adventure Section & Filter Pills
    await expect(page.getByRole('heading', { name: 'Choose Your Adventure' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'All', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Daily Life', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Travel', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Career', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fun', exact: true })).toBeVisible();

    // 5. Verify All 6 Adventure Scenario Cards
    await expect(page.getByRole('heading', { name: 'At the Airport' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Shopping Day' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Job Interview' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Morning Bakery' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'At the Restaurant' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Weekend Getaway' })).toBeVisible();

    // Verify category badges show only uppercase category names (no difficulty, no bullet separators)
    const adventureBadges = page.locator('section[aria-labelledby="adventure-heading"] span.uppercase');
    const badgeCount = await adventureBadges.count();
    expect(badgeCount).toBe(6);

    for (let i = 0; i < badgeCount; i++) {
      const text = await adventureBadges.nth(i).innerText();
      expect(['TRAVEL', 'DAILY LIFE', 'CAREER', 'FUN']).toContain(text);
      expect(text).not.toContain('•');
      expect(text).not.toContain('BEGINNER');
      expect(text).not.toContain('INTERMEDIATE');
    }

    // 6. Verify Today's Word Card
    await expect(page.getByRole('heading', { name: "Today's Word" })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'confident' })).toBeVisible();
    await expect(page.getByText('adjective')).toBeVisible();
    await expect(page.getByText('/ˈkɒnfɪdənt/')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Listen to pronunciation of confident' })).toBeVisible();
    await expect(page.getByText(/She felt confident before the interview/i)).toBeVisible();

    // 7. Verify Popular with Learners Section
    await expect(page.getByRole('heading', { name: 'Popular with Learners' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Night Study & Reflections' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Crossroads: Making Decisions' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Language Exchange Café' })).toBeVisible();

    // Capture standard explore screenshot
    const isMobile = testInfo.project.name.includes('Mobile');
    const screenshotPath = isMobile
      ? 'docs/testing/screenshots/explore_screen_mobile.png'
      : 'docs/testing/screenshots/explore_screen_desktop.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Assert zero console errors
    expect(consoleErrors).toEqual([]);
  });

  test('interactively filters adventure cards by category', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Main Navigation' }).getByRole('button', { name: 'Explore' }).click();

    // Filter to Travel
    await page.getByRole('button', { name: 'Travel', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'At the Airport' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Job Interview' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Shopping Day' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'At the Restaurant' })).not.toBeVisible();

    // Filter to Career
    await page.getByRole('button', { name: 'Career', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Job Interview' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'At the Airport' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'At the Restaurant' })).not.toBeVisible();

    // Filter to Daily Life (must include Shopping Day, Morning Bakery, and At the Restaurant)
    await page.getByRole('button', { name: 'Daily Life', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Shopping Day' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Morning Bakery' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'At the Restaurant' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'At the Airport' })).not.toBeVisible();

    // Reset to All (all 6 cards visible)
    await page.getByRole('button', { name: 'All', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'At the Airport' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Shopping Day' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Job Interview' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Morning Bakery' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'At the Restaurant' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Weekend Getaway' })).toBeVisible();
  });

  test('interactively searches activities and handles empty results', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Main Navigation' }).getByRole('button', { name: 'Explore' }).click();

    const searchInput = page.getByPlaceholder('Search topics, grammar, phrases...');
    
    // Search for "restaurant" (new card)
    await searchInput.fill('restaurant');
    await expect(page.getByText(/Found 1 result/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'At the Restaurant' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Shopping Day' })).not.toBeVisible();

    // Search for nonexistent term
    await searchInput.fill('nonexistentterm999');
    await expect(page.getByText('No activities found')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear Search', exact: true })).toBeVisible();

    // Clear search via button
    await page.getByRole('button', { name: 'Clear Search', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Continue Your Journey' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'At the Restaurant' })).toBeVisible();
  });

  test('opens interactive detail modals from Explore cards', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Main Navigation' }).getByRole('button', { name: 'Explore' }).click();

    // 1. Click Journey Card
    await page.getByRole('button', { name: /Continue Present vs Past/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Present vs Past \(Unit 3\)/i)).toBeVisible();
    await dialog.getByRole('button', { name: 'Close dialog' }).click();
    await expect(dialog).not.toBeVisible();

    // 2. Click New Adventure Scenario Card: At the Restaurant
    await page.getByRole('button', { name: /Open At the Restaurant scenario/i }).click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'At the Restaurant' })).toBeVisible();
    await expect(dialog.getByText(/Daily Life • Beginner • 4-6 min/i)).toBeVisible();
    await dialog.getByRole('button', { name: 'Close dialog' }).click();
    await expect(dialog).not.toBeVisible();

    // 3. Click Popular Module Card
    await page.getByRole('button', { name: /Open Night Study & Reflections/i }).click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Night Study & Reflections' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Close dialog' }).click();
  });

  test('switches cleanly between Home and Explore preserving state', async ({ page }) => {
    await page.goto('/');

    // Initially on Home
    await expect(page.getByRole('heading', { name: 'Learn English Your Way', level: 1 })).toBeVisible();
    
    // Switch to Explore
    const nav = page.getByRole('navigation', { name: 'Main Navigation' });
    await nav.getByRole('button', { name: 'Explore' }).click();
    await expect(page.getByRole('heading', { name: 'Explore', level: 1 })).toBeVisible();

    // Switch back to Home
    await nav.getByRole('button', { name: 'Home' }).click();
    await expect(page.getByRole('heading', { name: 'Learn English Your Way', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start Learning English' })).toBeVisible();
    await expect(page.getByText('Café Conversation')).toBeVisible();
  });

  // Responsive Widths: 320px, 360px, 390px, 430px, 768px, 1280px
  const viewports = [
    { width: 320, height: 640, label: '320px' },
    { width: 360, height: 740, label: '360px' },
    { width: 390, height: 844, label: '390px' },
    { width: 430, height: 932, label: '430px' },
    { width: 768, height: 1024, label: '768px' },
    { width: 1280, height: 800, label: '1280px' },
  ];

  for (const vp of viewports) {
    test(`Explore layout fits cleanly at ${vp.label} with zero horizontal overflow`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Navigate to Explore
      await page.getByRole('navigation', { name: 'Main Navigation' }).getByRole('button', { name: 'Explore' }).click();
      await expect(page.getByRole('heading', { name: 'Explore', level: 1 })).toBeVisible();

      // Check document horizontal overflow: scrollWidth must equal clientWidth
      const hasOverflow = await page.evaluate(() => {
        const doc = document.documentElement;
        const main = document.querySelector('main');
        const docOverflow = doc.scrollWidth > doc.clientWidth;
        const mainOverflow = main ? main.scrollWidth > main.clientWidth : false;
        return docOverflow || mainOverflow;
      });
      expect(hasOverflow).toBe(false);

      // Save screenshot for each viewport
      await page.screenshot({ 
        path: `docs/testing/screenshots/explore_${vp.label}.png`, 
        fullPage: true 
      });
    });
  }
});
