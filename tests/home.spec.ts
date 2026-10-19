import { test, expect } from '@playwright/test';

test.describe('Lexi Home Page Verification & Responsive Refinements', () => {
  test('renders all approved visual zones and captures mobile & desktop screenshots', async ({ page }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('net::ERR_')) {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // 1. Verify Header
    const banner = page.getByRole('banner');
    await expect(banner).toBeVisible({ timeout: 10000 });
    await expect(banner.getByText('Lexi')).toBeVisible();
    await expect(banner.getByText('Your English Companion')).toBeVisible();
    await expect(banner.getByText('🔥')).toBeVisible();
    await expect(banner.getByText('7')).toBeVisible();

    // 2. Verify Hero Banner & Prominence
    const eyebrow = page.getByText('A BRIGHTER YOU');
    await expect(eyebrow).toBeVisible();
    const isEyebrowSingleLine = await eyebrow.evaluate((el: HTMLElement) => {
      const computedStyle = window.getComputedStyle(el);
      const isNowrap = computedStyle.whiteSpace === 'nowrap';
      const lineHeight = parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.2;
      return isNowrap && el.clientHeight <= lineHeight * 1.4;
    });
    expect(isEyebrowSingleLine).toBe(true);

    await expect(page.getByRole('heading', { name: 'Learn English Your Way', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Learn English Your Way', level: 1 }).getByText('Your Way')).toBeVisible();
    
    // Verify Start Learning button fits on single line
    const startLearningBtn = page.getByRole('button', { name: 'Start Learning English' });
    await expect(startLearningBtn).toBeVisible();
    const btnSpan = startLearningBtn.locator('span');
    await expect(btnSpan).toHaveText('Start Learning');
    
    // Check that button text does not wrap into multiple lines
    const isSingleLine = await btnSpan.evaluate((el: HTMLElement) => {
      const computedStyle = window.getComputedStyle(el);
      const isNowrap = computedStyle.whiteSpace === 'nowrap';
      const lineHeight = parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.2;
      return isNowrap && el.clientHeight <= lineHeight * 1.4;
    });
    expect(isSingleLine).toBe(true);

    const heroImg = page.getByAltText(/Student sitting comfortably/i);
    await expect(heroImg).toBeVisible();

    // Ensure hero image is loaded and not clipped
    const isImageLoaded = await heroImg.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
    expect(isImageLoaded).toBe(true);

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

    // 5. Verify Quick Picks (No arrows, no card overflow)
    const quickPicksHeading = page.getByRole('heading', { name: 'Quick Picks' });
    await expect(quickPicksHeading).toBeVisible();
    await expect(page.getByText('Word Quest')).toBeVisible();
    await expect(page.getByText('Quick Notes')).toBeVisible();
    await expect(page.getByText('Sketch & Explain')).toBeVisible();
    await expect(page.getByText('Daily Challenge')).toBeVisible();

    // Ensure NO arrow icons remain in Quick Picks
    const quickPickCards = page.locator('section[aria-labelledby="quick-picks-heading"] [role="button"]');
    await expect(quickPickCards).toHaveCount(4);
    const arrowIcons = page.locator('section[aria-labelledby="quick-picks-heading"] svg');
    await expect(arrowIcons).toHaveCount(0);

    // 6. Verify Section A: Continue Learning
    const continueHeading = page.getByRole('heading', { name: 'Continue Learning' });
    await expect(continueHeading).toBeVisible();
    await expect(page.getByText('Everyday Conversations')).toBeVisible();
    await expect(page.getByRole('progressbar')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible();

    // 7. Verify Section B: Word of the Day Card
    const wotdHeading = page.getByRole('heading', { name: 'Word of the Day', level: 2 });
    await expect(wotdHeading).toBeVisible();
    await expect(page.getByRole('heading', { name: 'confident' })).toBeVisible();
    await expect(page.getByText('adjective')).toBeVisible();
    await expect(page.getByText(/Feeling sure of yourself/i)).toBeVisible();
    await expect(page.getByText(/With daily practice, she felt confident/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Listen to pronunciation of confident/i })).toBeVisible();

    // 8. Verify Section C: Daily Practice
    const dailyPracticeHeading = page.getByRole('heading', { name: 'Daily Practice' });
    await expect(dailyPracticeHeading).toBeVisible();
    await expect(page.getByRole('button', { name: /Vocabulary Practice/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Listening Practice/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Speaking Practice/i })).toBeVisible();

    // 9. Verify Bottom Navigation (Clean outlined active Home icon)
    const nav = page.getByRole('navigation', { name: 'Main Navigation' });
    await expect(nav).toBeVisible();
    const homeBtn = nav.getByRole('button', { name: 'Home' });
    await expect(homeBtn).toHaveAttribute('aria-current', 'page');

    // Capture standard screenshots
    const isMobile = testInfo.project.name.includes('Mobile');
    const screenshotPath = isMobile
      ? 'docs/testing/screenshots/home_screen_mobile.png'
      : 'docs/testing/screenshots/home_screen_desktop.png';

    await page.screenshot({ path: screenshotPath, fullPage: true });

    if (isMobile) {
      const heroSection = page.locator('section[aria-labelledby="hero-heading"]');
      await heroSection.screenshot({ path: 'docs/testing/screenshots/hero_card_updated_390px.png' });
      const continueSection = page.locator('section[aria-labelledby="continue-learning-heading"]');
      await continueSection.screenshot({ path: 'docs/testing/screenshots/continue_learning_updated_390px.png' });
    }

    // Assert zero console errors
    expect(consoleErrors).toEqual([]);
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
    test(`responsive layout fits cleanly at ${vp.label} with zero horizontal overflow and single-line CTA`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Wait for content render
      await expect(page.getByRole('heading', { name: 'Quick Picks' })).toBeVisible();

      // Check document horizontal overflow: scrollWidth must equal clientWidth
      const hasOverflow = await page.evaluate(() => {
        const doc = document.documentElement;
        const main = document.querySelector('main');
        const docOverflow = doc.scrollWidth > doc.clientWidth;
        const mainOverflow = main ? main.scrollWidth > main.clientWidth : false;
        return docOverflow || mainOverflow;
      });
      expect(hasOverflow).toBe(false);

      // Verify Start Learning button remains strictly on a single line
      const btnSpan = page.getByRole('button', { name: 'Start Learning English' }).locator('span');
      const isSingleLine = await btnSpan.evaluate((el: HTMLElement) => {
        const computedStyle = window.getComputedStyle(el);
        const isNowrap = computedStyle.whiteSpace === 'nowrap';
        const lineHeight = parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.2;
        return isNowrap && el.clientHeight <= lineHeight * 1.4;
      });
      expect(isSingleLine).toBe(true);

      // Verify A BRIGHTER YOU remains strictly on a single line and within hero bounds
      const eyebrowEl = page.getByText('A BRIGHTER YOU');
      const isEyebrowSingleLine = await eyebrowEl.evaluate((el: HTMLElement) => {
        const computedStyle = window.getComputedStyle(el);
        const isNowrap = computedStyle.whiteSpace === 'nowrap';
        const lineHeight = parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.2;
        const heroSection = el.closest('section');
        const heroRect = heroSection ? heroSection.getBoundingClientRect() : null;
        const elRect = el.getBoundingClientRect();
        const withinBounds = heroRect ? elRect.right <= heroRect.right && elRect.left >= heroRect.left : true;
        return isNowrap && el.clientHeight <= lineHeight * 1.4 && withinBounds;
      });
      expect(isEyebrowSingleLine).toBe(true);

      // Check Quick Picks cards bounding boxes are fully contained within main
      const cardBoundsValid = await page.evaluate(() => {
        const main = document.querySelector('main');
        if (!main) return false;
        const mainRect = main.getBoundingClientRect();
        const cards = document.querySelectorAll('section[aria-labelledby="quick-picks-heading"] [role="button"]');
        for (const card of Array.from(cards)) {
          const rect = card.getBoundingClientRect();
          if (rect.right > mainRect.right + 1 || rect.left < mainRect.left - 1) {
            return false;
          }
        }
        return true;
      });
      expect(cardBoundsValid).toBe(true);

      // Save screenshot for each viewport width
      await page.screenshot({ 
        path: `docs/testing/screenshots/home_${vp.label}.png`, 
        fullPage: true 
      });
    });
  }

  test('interactive modals work for Start Learning, Search, Continue Learning, and Practice', async ({ page }) => {
    await page.goto('/');

    // Test Search Modal
    await page.getByRole('button', { name: 'Search lessons and vocabulary' }).click();
    await expect(page.getByPlaceholder('Search grammar, stories, topics...')).toBeVisible();
    await page.getByPlaceholder('Search grammar, stories, topics...').fill('café');
    await expect(page.getByText('Ordering food at a café')).toBeVisible();
    await page.getByRole('button', { name: 'Close search' }).click();

    // Test Continue Learning Modal
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Everyday Conversations (Sample Lesson)')).toBeVisible();
    await page.getByRole('button', { name: 'Close dialog' }).click();

    // Test Daily Practice Launch
    await page.getByRole('button', { name: /Speaking Practice/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Close conversation studio' }).click();

    // Test Start Learning Modal
    await page.getByRole('button', { name: 'Start Learning English' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Daily Conversational English')).toBeVisible();

    // Select option & check answer
    await page.getByText('Certainly! Would you like that for here or to go?').click();
    await page.getByRole('button', { name: 'Check Answer' }).click();
    await expect(page.getByText('Great job!')).toBeVisible();
    await page.getByRole('button', { name: 'Continue Learning' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
