import { chromium } from 'playwright';

async function capture() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();
  await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });

  // 1. Capture Home Hero After
  const hero = page.locator('section[aria-labelledby="hero-heading"]');
  await hero.waitFor({ state: 'visible' });
  await hero.screenshot({ path: 'docs/testing/screenshots/home_hero_after.png' });
  console.log('Saved home_hero_after.png');

  // 2. Navigate to Explore and capture Search Focused
  const exploreTab = page.locator('button[aria-label="Explore"]');
  await exploreTab.click();
  const searchInput = page.locator('input[placeholder="Search topics, grammar, phrases..."]');
  await searchInput.waitFor({ state: 'visible' });
  await searchInput.focus();
  await page.waitForTimeout(300);
  await page.screenshot({
    path: 'docs/testing/screenshots/explore_search_focused_after.png',
    clip: { x: 12, y: 50, width: 366, height: 70 }
  });
  console.log('Saved explore_search_focused_after.png');

  // 3. Navigate to Progress & Insights
  const progressTab = page.locator('button[aria-label="Progress"]');
  await progressTab.click();
  await page.waitForTimeout(600);

  // 4. Capture Adaptive Learning Intelligence Card
  const adaptiveCard = page.locator('section[aria-label="Adaptive Learning Intelligence"]');
  await adaptiveCard.scrollIntoViewIfNeeded();
  await adaptiveCard.screenshot({ path: 'docs/testing/screenshots/adaptive_card_after.png' });
  console.log('Saved adaptive_card_after.png');

  // 5. Capture AI Error Pattern Diagnostics at 390px
  const errorDiagnostics = page.locator('section[aria-label="AI Diagnostics & Friction Points"]');
  await errorDiagnostics.scrollIntoViewIfNeeded();
  await errorDiagnostics.screenshot({ path: 'docs/testing/screenshots/error_diagnostics_after.png' });
  console.log('Saved error_diagnostics_after.png');

  // 6. Capture Recommended Action Plan
  const actionPlan = page.locator('section[aria-label="Personalized Action Plan"]');
  await actionPlan.scrollIntoViewIfNeeded();
  await actionPlan.screenshot({ path: 'docs/testing/screenshots/action_plan_after.png' });
  console.log('Saved action_plan_after.png');

  // 7. Test at 420px mobile viewport for header row
  await page.setViewportSize({ width: 420, height: 844 });
  await page.waitForTimeout(300);
  await errorDiagnostics.scrollIntoViewIfNeeded();
  await errorDiagnostics.screenshot({ path: 'docs/testing/screenshots/error_diagnostics_420px.png' });
  console.log('Saved error_diagnostics_420px.png');

  await browser.close();
  console.log('All after screenshots captured successfully!');
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
