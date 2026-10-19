import { test, expect } from '@playwright/test';

test.describe('Lexi Interactive Scenario Simulation & Real-World Roleplay Engine', () => {
  test('launches Café Conversation from Home, completes turns, and saves vocabulary', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('net::ERR_')) {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // 1. Click Featured Café Conversation card on Home
    const cafeBanner = page.locator('section[aria-labelledby="featured-activity-heading"] [role="button"]');
    await expect(cafeBanner).toBeVisible();
    await cafeBanner.click();

    // 2. Verify Interactive Scenario Modal opened
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Café Conversation' })).toBeVisible();
    await expect(dialog.getByText(/Turn 1 of 4/i)).toBeVisible();
    await expect(dialog.getByText(/Good morning! Welcome to The Roastery/i)).toBeVisible();

    // 3. Complete Turn 1
    const turn1Option = dialog.getByRole('radio', { name: /Could I please get a medium cappuccino with oat milk\?/i });
    await expect(turn1Option).toBeVisible();
    await turn1Option.click();

    await expect(dialog.getByText(/Natural & Polite/i)).toBeVisible();
    await expect(dialog.getByText(/Perfect! Using "Could I please get\.\.\." is polite/i)).toBeVisible();

    const continueBtn = dialog.getByRole('button', { name: 'Continue' });
    await continueBtn.click();

    // 4. Complete Turn 2
    await expect(dialog.getByText(/Turn 2 of 4/i)).toBeVisible();
    await expect(dialog.getByText(/Would you like that for here or to go\?/i)).toBeVisible();

    const turn2Option = dialog.getByRole('radio', { name: /To go, please! Also, do you have any freshly baked croissants left\?/i });
    await expect(turn2Option).toBeVisible();
    await turn2Option.click();
    await expect(dialog.getByText(/Excellent response! "To go, please" is spot on/i)).toBeVisible();
    await continueBtn.click();

    // 5. Complete Turn 3
    await expect(dialog.getByText(/Turn 3 of 4/i)).toBeVisible();
    await expect(dialog.getByText(/fresh batch of almond croissants/i)).toBeVisible();

    const turn3Option = dialog.getByRole('radio', { name: /That sounds delightful! Yes, please add one almond croissant\./i });
    await expect(turn3Option).toBeVisible();
    await turn3Option.click();
    await expect(dialog.getByText(/Great enthusiasm! "That sounds delightful"/i)).toBeVisible();
    await continueBtn.click();

    // 6. Complete Turn 4
    await expect(dialog.getByText(/Turn 4 of 4/i)).toBeVisible();
    await expect(dialog.getByText(/That comes to \$8\.50/i)).toBeVisible();

    const turn4Option = dialog.getByRole('radio', { name: /Here you go! Thanks so much, have a wonderful rest of your day\./i });
    await expect(turn4Option).toBeVisible();
    await turn4Option.click();
    await expect(dialog.getByText(/Outstanding! Friendly closing remarks build rapport/i)).toBeVisible();

    const finishBtn = dialog.getByRole('button', { name: 'Complete & View Score' });
    await finishBtn.click();

    // 7. Verify Completion Screen & Scorecard
    await expect(dialog.getByText(/Scenario Complete!/i)).toBeVisible();
    await expect(dialog.getByText(/100%/i)).toBeVisible();
    await expect(dialog.getByText(/Native-like/i)).toBeVisible();

    // 8. Key Vocabulary & 1-tap FSRS save
    await expect(dialog.getByText('Key Phrases & Vocabulary')).toBeVisible();
    await expect(dialog.getByText('cappuccino')).toBeVisible();
    await expect(dialog.getByText('dairy-free')).toBeVisible();

    const saveVocabBtn = dialog.getByRole('button', { name: /Add All to Memory Deck/i });
    await expect(saveVocabBtn).toBeVisible();
    await saveVocabBtn.click();

    await expect(dialog.getByRole('button', { name: /Saved 4 Words to Memory Deck/i })).toBeVisible();

    // 9. Close Modal
    await dialog.getByRole('button', { name: 'Finish & Return Home' }).click();
    await expect(dialog).not.toBeVisible();

    expect(consoleErrors).toEqual([]);
  });

  test('launches Adventure Scenario from Explore screen', async ({ page }) => {
    await page.goto('/');

    // Navigate to Explore
    await page.getByRole('navigation', { name: 'Main Navigation' }).getByRole('button', { name: 'Explore' }).click();

    // Click At the Airport
    const airportCard = page.getByRole('button', { name: /Open At the Airport scenario/i });
    await expect(airportCard).toBeVisible();
    await airportCard.click();

    // Verify modal
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'At the Airport' })).toBeVisible();
    await expect(dialog.getByText(/with Elena \(Airline Check-In Agent\)/i)).toBeVisible();
    await expect(dialog.getByText(/Turn 1 of 4/i)).toBeVisible();

    // Close modal
    await dialog.getByRole('button', { name: 'Close dialog' }).click();
    await expect(dialog).not.toBeVisible();
  });

  test('verifies responsive layout at 320px, 390px, and 1280px without overflow', async ({ page }) => {
    const viewports = [
      { width: 320, height: 640, label: '320px' },
      { width: 390, height: 844, label: '390px' },
      { width: 1280, height: 800, label: '1280px' },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');

      // Launch scenario from Featured Banner
      const cafeBanner = page.locator('section[aria-labelledby="featured-activity-heading"] [role="button"]');
      await expect(cafeBanner).toBeVisible();
      await cafeBanner.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // Check overflow
      const overflow = await page.evaluate(() => {
        const modal = document.querySelector('div[role="dialog"] > div');
        if (!modal) return { hasOverflow: false, scrollWidth: 0, clientWidth: 0 };
        return {
          hasOverflow: modal.scrollWidth > modal.clientWidth,
          scrollWidth: modal.scrollWidth,
          clientWidth: modal.clientWidth,
        };
      });

      expect(overflow.hasOverflow).toBe(false);

      // Screenshot for verification artifact
      await page.screenshot({
        path: `/home/abhiboss/.gemini/antigravity/brain/d20f30d9-d11b-4244-9752-50bc4be0eb44/scenario_modal_${vp.label}.png`,
      });

      await dialog.getByRole('button', { name: 'Close dialog' }).click();
      await expect(dialog).not.toBeVisible();
    }
  });
});
