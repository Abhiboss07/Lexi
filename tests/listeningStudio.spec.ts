import { test, expect } from '@playwright/test';

test.describe('Lexi Phase G — Listening and Voice Communication Coach', () => {
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

  test('opens Listening Studio, plays audio, tests comprehension, dictation, speed controls, and voice retell', async ({ page }) => {
    await goToPractice(page);

    // 1. Open Listening Studio
    await page.getByRole('button', { name: 'Listening', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: /Ear Training & Comprehension/i });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Train Platform Announcement').first()).toBeVisible();

    // 2. Play Audio & Speed Controls
    const playBtn = dialog.getByRole('button', { name: 'Play audio' });
    await expect(playBtn).toBeVisible();
    await playBtn.click();
    await dialog.getByRole('button', { name: '1.2x' }).click();

    // 3. Reveal Transcript
    await dialog.getByRole('button', { name: /Reveal Transcript/i }).click();
    await expect(dialog.getByText(/Attention passengers on Platform 3/i)).toBeVisible();

    // 4. Test Comprehension Check
    await dialog.getByRole('button', { name: '15 minutes' }).click();
    await dialog.getByRole('button', { name: 'Check Answer' }).click();
    await expect(dialog.getByText(/Audio Explanation:/i)).toBeVisible();

    // 5. Switch to Dictation Mode
    await dialog.getByRole('button', { name: /Dictation/i }).click();
    await expect(dialog.getByText('Listen & Type What You Hear:')).toBeVisible();
    const textarea = dialog.locator('textarea');
    await textarea.fill('The express train to Oxford has been delayed by 15 minutes.');
    await dialog.getByRole('button', { name: 'Verify Dictation' }).click();
    await expect(dialog.getByText(/Accuracy Match:/i)).toBeVisible();

    // 6. Switch to Listen & Retell Mode
    await dialog.getByRole('button', { name: /Listen & Retell/i }).click();
    await expect(dialog.getByText('Retell in Your Own Words:')).toBeVisible();
    await dialog.getByRole('button', { name: /Tap to speak into microphone/i }).click();
    await expect(dialog.getByText(/Your Spoken Summary:/i)).toBeVisible();

    // 7. End Session Early and Verify Scorecard
    await dialog.getByRole('button', { name: 'End Session Early' }).click();
    await expect(dialog.getByText('Listening Studio Complete!')).toBeVisible();
    await expect(dialog.getByText('Accuracy')).toBeVisible();
    await expect(dialog.getByText('Listening Improvement Plan:')).toBeVisible();

    // 8. Close Modal
    await dialog.getByRole('button', { name: 'Done' }).click();
    await expect(dialog).not.toBeVisible();
  });
});
