import { test, expect } from '@playwright/test';

test('capture scenario dialogue and completion scorecard screenshots', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  // 1. Launch Café Conversation
  const cafeBanner = page.locator('section[aria-labelledby="featured-activity-heading"] [role="button"]');
  await expect(cafeBanner).toBeVisible();
  await cafeBanner.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // 2. Select option for Turn 1 to show feedback
  const turn1Option = dialog.getByRole('radio', { name: /Could I please get a medium cappuccino with oat milk\?/i });
  await turn1Option.click();
  await expect(dialog.getByText(/Natural & Polite/i)).toBeVisible();

  // Capture active dialogue with immediate feedback
  await page.screenshot({
    path: '/home/abhiboss/.gemini/antigravity/brain/d20f30d9-d11b-4244-9752-50bc4be0eb44/scenario_dialogue_turn1_390px.png',
  });

  // Advance through turns to completion
  const continueBtn = dialog.getByRole('button', { name: 'Continue' });
  await continueBtn.click();

  const turn2Option = dialog.getByRole('radio', { name: /To go, please! Also, do you have any freshly baked croissants left\?/i });
  await turn2Option.click();
  await continueBtn.click();

  const turn3Option = dialog.getByRole('radio', { name: /That sounds delightful! Yes, please add one almond croissant\./i });
  await turn3Option.click();
  await continueBtn.click();

  const turn4Option = dialog.getByRole('radio', { name: /Here you go! Thanks so much, have a wonderful rest of your day\./i });
  await turn4Option.click();

  const finishBtn = dialog.getByRole('button', { name: 'Complete & View Score' });
  await finishBtn.click();

  // Wait for scorecard
  await expect(dialog.getByText(/Scenario Complete!/i)).toBeVisible();

  // Capture completion scorecard
  await page.screenshot({
    path: '/home/abhiboss/.gemini/antigravity/brain/d20f30d9-d11b-4244-9752-50bc4be0eb44/scenario_completion_scorecard_390px.png',
  });
});
