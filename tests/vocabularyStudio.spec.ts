import { test, expect } from '@playwright/test';

test.describe('Lexi Phase E — Multimodal Vocabulary Practice Studio', () => {
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

  test('opens Vocabulary Studio from Practice screen and tests multimodal drills', async ({ page }) => {
    await goToPractice(page);

    // 1. Open Vocab Studio
    const vocabStudioBtn = page.getByRole('button', { name: 'Vocab Studio' }).first();
    await expect(vocabStudioBtn).toBeVisible();
    await vocabStudioBtn.click();

    const dialog = page.getByRole('dialog', { name: 'Vocabulary Practice Studio' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Vocabulary Studio', { exact: true })).toBeVisible();
    await expect(dialog.getByText('FSRS Integrated')).toBeVisible();

    // 2. Test 1-Tap Save to FSRS Deck
    const saveBtn = dialog.getByRole('button', { name: /Add to FSRS Deck/i });
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await expect(dialog.getByText(/Saved in FSRS/i)).toBeVisible();
    }

    // 3. Switch to Quiz Mode
    await dialog.getByRole('button', { name: /Quiz/i }).click();
    await expect(dialog.getByText('Select the accurate definition:')).toBeVisible();
    const firstQuizOption = dialog.locator('button.w-full.p-3\\.5').first();
    await expect(firstQuizOption).toBeVisible();
    await firstQuizOption.click();
    await expect(dialog.getByText('Example in context:')).toBeVisible();

    // 4. Switch to Match Mode
    await dialog.getByRole('button', { name: /Match/i }).click();
    await expect(dialog.getByText('Match the word to its definition:')).toBeVisible();
    await expect(dialog.getByText(/Matched/i)).toBeVisible();

    // 5. Switch to Fill-In Mode
    await dialog.getByRole('button', { name: /Fill-In/i }).click();
    await expect(dialog.getByText('Complete the sentence:')).toBeVisible();
    const firstFillWord = dialog.locator('button.p-2\\.5.rounded-xl.border').first();
    await expect(firstFillWord).toBeVisible();
    await firstFillWord.click();

    // 6. Switch to Writing Mode (AI Sentence Builder)
    await dialog.getByRole('button', { name: /Writing/i }).click();
    await expect(dialog.getByText(/Write an original sentence with/i)).toBeVisible();
    await dialog.getByRole('button', { name: 'Use example sentence' }).click();
    await dialog.getByRole('button', { name: 'Analyze Sentence' }).click();
    await expect(dialog.getByText('✓ Sentence Verified')).toBeVisible();

    // 7. Switch to FSRS Deck Mode (Active Recall Flashcard)
    await dialog.getByRole('button', { name: 'FSRS Deck', exact: true }).click();
    await expect(dialog.getByText(/Active Recall Flashcard/i)).toBeVisible();
    // Tap to flip
    const flashcard = dialog.getByRole('button', { name: /Flashcard:/i });
    await flashcard.click();
    await expect(dialog.getByText(/Rate Your Memory Recall \(FSRS\):/i)).toBeVisible();
    // Rate Good
    await dialog.getByRole('button', { name: 'Good' }).click();

    // 8. End Session and Verify Scorecard
    await dialog.getByRole('button', { name: 'End Session Early' }).click();
    await expect(dialog.getByText('Studio Practice Complete!')).toBeVisible();
    await expect(dialog.getByText('Accuracy')).toBeVisible();
    await expect(dialog.getByText('Diagnostic Pattern & Collocations Tip:')).toBeVisible();
    await expect(dialog.getByText('Recommended FSRS Action Plan:')).toBeVisible();

    // 9. Close Modal
    await dialog.getByRole('button', { name: 'Done' }).click();
    await expect(dialog).not.toBeVisible();
  });
});
