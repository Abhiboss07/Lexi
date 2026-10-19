import { test } from '@playwright/test';
import * as path from 'path';

test('capture achievements and progress screenshots', async ({ page }) => {
  const artifactsDir = '/home/abhiboss/.gemini/antigravity/brain/d20f30d9-d11b-4244-9752-50bc4be0eb44';
  const docsScreenshotsDir = '/home/abhiboss/Projects/Lexi/docs/testing/screenshots';

  // 1. Mobile 390px Progress Dashboard
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForSelector('nav[aria-label="Main Navigation"]', { timeout: 10000 });
  await page.getByRole('button', { name: 'Progress' }).click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(docsScreenshotsDir, 'progress_dashboard_390px.png') });
  await page.screenshot({ path: path.join(artifactsDir, 'progress_dashboard_390px.png') });

  // 2. Open Achievements Modal - Badges Tab
  await page.getByRole('button', { name: 'Open milestones and badges modal' }).click();
  await page.waitForSelector('#achievements-modal-title');
  await page.waitForTimeout(400);

  await page.screenshot({ path: path.join(docsScreenshotsDir, 'achievements_modal_badges_390px.png') });
  await page.screenshot({ path: path.join(artifactsDir, 'achievements_modal_badges_390px.png') });

  // 3. Certificates Tab
  await page.getByRole('button', { name: 'Certificates tab' }).click();
  await page.waitForTimeout(400);

  await page.screenshot({ path: path.join(docsScreenshotsDir, 'achievements_modal_certificates_390px.png') });
  await page.screenshot({ path: path.join(artifactsDir, 'achievements_modal_certificates_390px.png') });

  // 4. Data & Backup Tab
  await page.getByRole('button', { name: 'Data & Backup tab' }).click();
  await page.waitForTimeout(400);

  await page.screenshot({ path: path.join(docsScreenshotsDir, 'achievements_modal_backup_390px.png') });
  await page.screenshot({ path: path.join(artifactsDir, 'achievements_modal_backup_390px.png') });

  // 5. Desktop 1280px Viewport
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole('button', { name: 'Badges tab' }).click();
  await page.waitForTimeout(400);

  await page.screenshot({ path: path.join(docsScreenshotsDir, 'achievements_modal_1280px.png') });
  await page.screenshot({ path: path.join(artifactsDir, 'achievements_modal_1280px.png') });
});
