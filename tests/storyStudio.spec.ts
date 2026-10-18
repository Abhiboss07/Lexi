import { test, expect } from '@playwright/test';

test.describe('Lexi Phase D — Interactive Story Studio', () => {
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

  test('Mode 1: graded reading, audio read-aloud, comprehension check, and FSRS vocabulary extraction', async ({ page }) => {
    await goToPractice(page);

    // 1. Open Stories Studio
    await page.getByRole('button', { name: 'Stories', exact: true }).click();
    const storyDialog = page.getByRole('dialog', { name: /Interactive Graded Stories/i });
    await expect(storyDialog).toBeVisible();

    // 2. Graded Stories mode header and first story
    await expect(storyDialog.getByRole('heading', { name: 'The Secret of the Old Clocktower' })).toBeVisible();
    await expect(storyDialog.getByText('A2 • Adventure')).toBeVisible();

    // 3. Audio narration
    const listenBtn = storyDialog.getByRole('button', { name: /listen/i });
    await expect(listenBtn).toBeVisible();
    await listenBtn.click();

    // 4. Extract story vocabulary to FSRS notebook
    const saveChimedBtn = storyDialog.getByRole('button', { name: '+ Save Word' }).first();
    await expect(saveChimedBtn).toBeVisible();
    await saveChimedBtn.click();
    await expect(storyDialog.getByRole('button', { name: 'Saved' }).first()).toBeVisible();

    // 5. Comprehension Challenge
    await expect(storyDialog.getByText('Why did Lucas decide to climb the clocktower staircase?')).toBeVisible();
    await storyDialog.getByRole('button', { name: 'The clock struck an unusual number of times' }).click();
    await storyDialog.getByRole('button', { name: 'Check Answer' }).click();

    // Feedback displayed
    await expect(storyDialog.getByText(/Lucas noticed that the clock struck nine times/i)).toBeVisible();

    // 6. Switch to another graded story
    await storyDialog.getByRole('button', { name: 'Morning at the Harbor Market' }).click();
    await expect(storyDialog.getByRole('heading', { name: 'Morning at the Harbor Market' })).toBeVisible();
    await expect(storyDialog.getByText('What does Elena buy at the bakery?')).toBeVisible();

    // 7. Close studio and verify saved vocabulary appears in notebook
    await storyDialog.getByRole('button', { name: 'Close stories studio' }).click();
    await expect(storyDialog).not.toBeVisible();

    await expect(page.getByRole('heading', { name: 'chimed' })).toBeVisible();
  });

  test('Mode 2: creative writing co-creator evaluates learner sentences and continues narrative', async ({ page }) => {
    await goToPractice(page);

    // Open Stories Studio
    await page.getByRole('button', { name: 'Stories', exact: true }).click();
    const storyDialog = page.getByRole('dialog', { name: /Interactive Graded Stories/i });
    await expect(storyDialog).toBeVisible();

    // Switch to Co-Creative Writing mode
    await storyDialog.getByRole('button', { name: /Co-Creative Writing/i }).click();

    // Prompt title
    await expect(storyDialog.getByText('CO-CREATIVE STORY BUILDER')).toBeVisible();
    await expect(storyDialog.getByRole('heading', { name: 'The Mystery Envelope' })).toBeVisible();

    // Switch prompt to Rainy Day in Tokyo
    await storyDialog.getByRole('button', { name: 'Rainy Day in Tokyo' }).click();
    await expect(storyDialog.getByRole('heading', { name: 'Rainy Day in Tokyo' })).toBeVisible();

    // Write continuation sentence
    const textarea = storyDialog.getByPlaceholder(/Continue the story in English.../i);
    await textarea.fill('I stepped under the bright neon awning and thanked the stranger with a warm smile.');

    // Submit
    await storyDialog.getByRole('button', { name: /Submit & Continue Story/i }).click();

    // AI feedback appears
    await expect(storyDialog.getByText('Coach Evaluation')).toBeVisible({ timeout: 5000 });
    await expect(storyDialog.getByText('Expressive and descriptive sentence structure!')).toBeVisible();
    await expect(storyDialog.getByText('Story continues:')).toBeVisible();

    await storyDialog.getByRole('button', { name: 'Close stories studio' }).click();
    await expect(storyDialog).not.toBeVisible();
  });
});
