import { test, expect } from '@playwright/test';

test.describe('Lexi Phase F — Grammar Practice Studio', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        const req = window.indexedDB.deleteDatabase('LexiDatabase');
        await new Promise((resolve) => {
          req.onsuccess = resolve;
          req.onerror = resolve;
          req.onblocked = resolve;
        });
      }
    });
    await page.reload();
  });

  const goToPractice = async (page: any) => {
    const nav = page.getByRole('navigation', { name: 'Main Navigation' });
    await expect(nav).toBeVisible();
    const practiceTab = nav.getByRole('button', { name: 'Practice' });
    await practiceTab.click();
    await expect(practiceTab).toHaveAttribute('aria-current', 'page');
  };

  test('opens Grammar Studio, tests diagnostic drills, rule explainers, chips ordering, and error tracking', async ({ page }) => {
    await goToPractice(page);

    // 1. Open Grammar Studio
    await page.getByRole('button', { name: 'Grammar', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: /Key Rules & Diagnostic Practice/i });
    await expect(dialog).toBeVisible();

    // 2. Core Rule Card
    await expect(dialog.getByText('Core Grammar Rule')).toBeVisible();
    await expect(dialog.getByText('Present Simple vs Present Continuous').first()).toBeVisible();
    await expect(dialog.getByText(/Use Present Simple for regular routines/i)).toBeVisible();

    // 3. Drill 1: Multiple choice
    await expect(dialog.getByText('Look! She _______ her umbrella because it is raining heavily.')).toBeVisible();
    await dialog.getByRole('button', { name: 'is carrying' }).click();
    await dialog.getByRole('button', { name: 'Check Answer' }).click();
    await expect(dialog.getByText(/Because 'Look!' refers to an action occurring right at this moment/i)).toBeVisible();

    // 4. Drill 2: Sentence error correction
    await dialog.getByRole('button', { name: /Next Exercise/i }).click();
    await expect(dialog.getByText(/Identify the error in this sentence/i)).toBeVisible();
    await dialog.getByRole('button', { name: /Change "walking" to "walks"/i }).click();
    await dialog.getByRole('button', { name: 'Check Answer' }).click();
    await expect(dialog.getByText(/'Usually' indicates a regular routine/i)).toBeVisible();

    // 5. Drill 3: Sentence ordering chips
    await dialog.getByRole('button', { name: /Next Exercise/i }).click();
    await expect(dialog.getByText(/Arrange the words in the correct order/i)).toBeVisible();
    // Tap chips: She is studying for her exam right now.
    for (const word of ['She', 'is', 'studying', 'for', 'her', 'exam', 'right', 'now.']) {
      await dialog.getByRole('button', { name: word, exact: true }).click();
    }
    await dialog.getByRole('button', { name: 'Check Answer' }).click();
    await expect(dialog.getByText(/Standard English word order/i)).toBeVisible();

    // 6. Switch Topic to Prepositions
    await dialog.getByRole('button', { name: /Prepositions of Time/i }).click();
    await expect(dialog.getByText(/Use AT for exact clock times/i)).toBeVisible();

    // 7. End session early and verify scorecard
    await dialog.getByRole('button', { name: 'End Session Early' }).click();
    await expect(dialog.getByText('Grammar Practice Complete!')).toBeVisible();
    await expect(dialog.getByText('Accuracy')).toBeVisible();
    await expect(dialog.getByText('Grammar Error Pattern Analysis:')).toBeVisible();
    await expect(dialog.getByText('Targeted Next Step:')).toBeVisible();

    // 8. Close Modal
    await dialog.getByRole('button', { name: 'Done' }).click();
    await expect(dialog).not.toBeVisible();
  });
});
