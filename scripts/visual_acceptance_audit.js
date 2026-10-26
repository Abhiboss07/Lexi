import { chromium } from 'playwright';
import fs from 'fs';

async function runVisualAudit() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const viewports = [
    { name: '320px', width: 320, height: 640 },
    { name: '360px', width: 360, height: 740 },
    { name: '390px', width: 390, height: 844 },
    { name: '420px', width: 420, height: 844 },
    { name: '768px', width: 768, height: 1024 },
    { name: '1280px', width: 1280, height: 800 },
  ];

  const results = {
    searchStates: {},
    keyboardFocus: false,
    viewports: {},
  };

  // 1. Detailed Search Lifecycle Verification (390px)
  const searchContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const searchPage = await searchContext.newPage();
  await searchPage.goto('http://localhost:4173', { waitUntil: 'networkidle' });

  // Navigate to Explore
  const exploreNav = searchPage.locator('button[aria-label="Explore"]');
  await exploreNav.click();
  const searchInput = searchPage.locator('input[placeholder="Search topics, grammar, phrases..."]');
  await searchInput.waitFor({ state: 'visible' });

  // State A: Before Focus
  await searchPage.screenshot({
    path: 'docs/testing/screenshots/search_audit_1_before_focus.png',
    clip: { x: 12, y: 50, width: 366, height: 70 },
  });
  results.searchStates.beforeFocus = true;

  // State B: During Focus
  await searchInput.focus();
  await searchPage.waitForTimeout(200);
  await searchPage.screenshot({
    path: 'docs/testing/screenshots/search_audit_2_focused.png',
    clip: { x: 12, y: 50, width: 366, height: 70 },
  });
  results.searchStates.focused = true;

  // State C: While Typing
  await searchInput.fill('past tense');
  await searchPage.waitForTimeout(250);
  await searchPage.screenshot({
    path: 'docs/testing/screenshots/search_audit_3_typing.png',
    clip: { x: 12, y: 50, width: 366, height: 70 },
  });
  results.searchStates.typing = true;

  // State D: After Clearing
  const clearBtn = searchPage.locator('button[aria-label="Clear search"]');
  await clearBtn.click();
  await searchPage.waitForTimeout(200);
  await searchPage.screenshot({
    path: 'docs/testing/screenshots/search_audit_4_cleared.png',
    clip: { x: 12, y: 50, width: 366, height: 70 },
  });
  results.searchStates.cleared = true;

  // State E: After Blur
  await searchPage.keyboard.press('Tab'); // blurs input
  await searchPage.waitForTimeout(200);
  await searchPage.screenshot({
    path: 'docs/testing/screenshots/search_audit_5_blurred.png',
    clip: { x: 12, y: 50, width: 366, height: 70 },
  });
  results.searchStates.blurred = true;

  // 2. Keyboard Focus Indicator Verification
  // Press Tab a few times to see button focus ring
  await searchPage.keyboard.press('Tab');
  await searchPage.waitForTimeout(150);
  await searchPage.screenshot({
    path: 'docs/testing/screenshots/keyboard_focus_ring.png',
    clip: { x: 12, y: 110, width: 366, height: 120 },
  });
  results.keyboardFocus = true;
  await searchContext.close();

  // 3. Multi-Viewport Captures for Home and Progress & Insights
  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });

    // Home full screenshot
    await page.screenshot({
      path: `docs/testing/screenshots/home_audit_${vp.name}.png`,
      fullPage: false,
    });

    // Navigate to Progress
    const progressBtn = page.locator('button[aria-label="Progress"]');
    await progressBtn.click();
    await page.waitForTimeout(500);

    // Progress Dashboard screenshot
    await page.screenshot({
      path: `docs/testing/screenshots/progress_audit_${vp.name}.png`,
      fullPage: false,
    });

    // Check specific elements in Progress
    const baselineBadge = page.locator('span:has-text("Baseline")');
    const badgeVisible = await baselineBadge.isVisible().catch(() => false);
    const badgeBox = badgeVisible ? await baselineBadge.boundingBox() : null;

    const errorSection = page.locator('section[aria-label="AI Diagnostics & Friction Points"]');
    const errorBox = await errorSection.boundingBox().catch(() => null);

    results.viewports[vp.name] = {
      width: vp.width,
      badgeVisible,
      badgeHeight: badgeBox ? badgeBox.height : null,
      badgeWidth: badgeBox ? badgeBox.width : null,
      errorBoxHeight: errorBox ? errorBox.height : null,
    };

    await context.close();
    console.log(`Captured viewports for ${vp.name}`);
  }

  await browser.close();
  fs.writeFileSync('reports/visual_audit_metrics.json', JSON.stringify(results, null, 2));
  console.log('Visual audit complete. Metrics saved to reports/visual_audit_metrics.json');
}

runVisualAudit().catch((err) => {
  console.error('Visual audit failed:', err);
  process.exit(1);
});
