import { test, expect } from '@playwright/test';

test.describe('Lexi Phase H — Personal Interview Trainer', () => {
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

  test('opens Interview Trainer, configures role, answers questions with STAR guide, and reviews report', async ({ page }) => {
    await goToPractice(page);

    // 1. Open Interview Trainer from Practice Studios row
    const interviewBtn = page.getByRole('button', { name: 'Interview', exact: true });
    await expect(interviewBtn).toBeVisible();
    await interviewBtn.click();

    const dialog = page.getByRole('dialog', { name: 'Personal Interview Trainer' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('STAR Method AI')).toBeVisible();
    await expect(dialog.getByText('Target Role & Requirements Setup')).toBeVisible();

    // 2. Setup Role & Verify Extracted Competencies
    await expect(dialog.getByRole('button', { name: /Software Engineer/i })).toBeVisible();
    await expect(dialog.getByText('✓ React')).toBeVisible();

    // Switch experience level to senior
    await dialog.getByRole('button', { name: 'senior' }).click();

    // 3. Start Mock Interview
    await dialog.getByRole('button', { name: /Start Mock Interview/i }).click();

    // 4. Verify Question 1 & Persona
    await expect(dialog.getByText(/Question 1 of/i)).toBeVisible();
    await expect(dialog.getByText(/Sarah • Engineering Director/i)).toBeVisible();
    await expect(dialog.getByText(/challenging bug or technical setback/i)).toBeVisible();

    // 5. Toggle Hint & STAR Guidance
    await dialog.getByRole('button', { name: /Interview Hint/i }).click();
    await expect(dialog.getByText(/Use the STAR method/i)).toBeVisible();

    await dialog.getByRole('button', { name: /STAR Method Structure/i }).click();
    await expect(dialog.getByText(/STAR Answering Blueprint/i)).toBeVisible();
    await expect(dialog.getByText(/S - Situation:/i)).toBeVisible();
    await expect(dialog.getByText(/R - Result:/i)).toBeVisible();

    // 6. Insert Model Response & Submit
    await dialog.getByRole('button', { name: 'Insert Model Response' }).click();
    const textarea = dialog.locator('textarea');
    await expect(textarea).not.toBeEmpty();

    await dialog.getByRole('button', { name: 'Submit & Next Question' }).click();

    // 7. Verify Question 2
    await expect(dialog.getByText(/Question 2 of/i)).toBeVisible();

    // 8. Finish Interview Session Early
    await dialog.getByRole('button', { name: 'Finish Early' }).click();

    // 9. Verify Assessment Report
    await expect(dialog.getByText('Interview Assessment Report')).toBeVisible();
    await expect(dialog.getByText('Composite Score')).toBeVisible();
    await expect(dialog.getByText('STAR Structure')).toBeVisible();
    await expect(dialog.getByText('Vocabulary', { exact: true })).toBeVisible();
    await expect(dialog.getByText('Clarity & Tone')).toBeVisible();
    await expect(dialog.getByText('Recommended Lexi Preparation Plan:')).toBeVisible();

    // 10. Close Dialog
    await dialog.getByRole('button', { name: 'Done' }).click();
    await expect(dialog).not.toBeVisible();
  });
});
