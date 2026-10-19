import { test, expect } from '@playwright/test';
import * as path from 'path';

test('capture home header logo symbol close-ups', async ({ page }) => {
  const artifactsDir = '/home/abhiboss/.gemini/antigravity/brain/d20f30d9-d11b-4244-9752-50bc4be0eb44';
  const docsScreenshotsDir = '/home/abhiboss/Projects/Lexi/docs/testing/screenshots';

  const viewports = [
    { width: 320, height: 640, label: '320px' },
    { width: 360, height: 740, label: '360px' },
    { width: 390, height: 844, label: '390px' },
    { width: 430, height: 932, label: '430px' },
    { width: 768, height: 1024, label: '768px' },
    { width: 1280, height: 800, label: '1280px' },
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/');

    // Wait for splash screen to complete if visible
    const splash = page.getByRole('status', { name: /lexi english companion loading/i });
    if (await splash.isVisible()) {
      await expect(splash).not.toBeVisible({ timeout: 5000 });
    }

    // Ensure header banner and controls are fully rendered
    const header = page.getByRole('banner');
    await expect(header).toBeVisible({ timeout: 5000 });
    await expect(header.getByText('Lexi', { exact: true })).toBeVisible();
    await page.waitForTimeout(300);

    // Save screenshots
    await header.screenshot({ path: path.join(artifactsDir, `header_symbol_fixed_${vp.label}.png`) });
    await header.screenshot({ path: path.join(docsScreenshotsDir, `header_symbol_fixed_${vp.label}.png`) });
  }
});
