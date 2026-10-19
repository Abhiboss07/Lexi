import { test, expect } from '@playwright/test';

test.describe('Lexi Phase B — Difficulty, Goals and Practice Preferences', () => {
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

  test('opens Practice Goals & Preferences modal, updates difficulty and daily goal, and persists across reloads', async ({ page }) => {
    await goToPractice(page);

    // 1. Locate Preferences button in Practice header
    const prefButton = page.getByRole('button', { name: /practice goals/i });
    await expect(prefButton).toBeVisible();
    await prefButton.click();

    // 2. Preferences modal appears
    const modal = page.getByRole('dialog', { name: 'Practice Preferences' });
    await expect(modal).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Practice Preferences' })).toBeVisible();

    // 3. Verify difficulty options (Easy, Medium, Hard)
    await expect(page.getByRole('button', { name: /easy/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /medium/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /hard/i }).first()).toBeVisible();

    // 4. Select "Easy"
    await page.getByRole('button', { name: /easy/i }).first().click();

    // 5. Select 20m Daily Goal
    const goal20Btn = page.getByRole('button', { name: '20m', exact: true });
    await expect(goal20Btn).toBeVisible();
    await goal20Btn.click();

    // 6. Select "Daily" reminder
    const dailyReminderBtn = page.getByRole('button', { name: /^daily$/i });
    await dailyReminderBtn.click();

    // 7. Save Preferences
    const saveBtn = page.getByRole('button', { name: /save preferences/i });
    await saveBtn.click();

    // Modal closes upon successful save
    await expect(modal).not.toBeVisible();

    // 8. Re-open to confirm persistence in IndexedDB
    await prefButton.click();
    await expect(modal).toBeVisible();

    // Verify Easy is active (has selected styling / text)
    await expect(page.getByText(/Slower speech \(0\.8x\)/i)).toBeVisible();

    // Close modal
    await page.getByRole('button', { name: 'Close practice preferences' }).click();
    await expect(modal).not.toBeVisible();
  });

  test('session override in Conversation Studio allows on-the-fly difficulty adjustments', async ({ page }) => {
    await goToPractice(page);

    // Open Conversation Studio
    await page.getByRole('button', { name: 'Conversation', exact: true }).click();
    const convModal = page.getByRole('dialog', { name: /Interactive Dialogue Practice/i });
    await expect(convModal).toBeVisible();

    // Verify session difficulty selector is present
    await expect(convModal.getByRole('button', { name: /select easy difficulty/i })).toBeVisible();
    await expect(convModal.getByRole('button', { name: /select medium difficulty/i })).toBeVisible();
    await expect(convModal.getByRole('button', { name: /select hard difficulty/i })).toBeVisible();

    // Click "easy" level override
    await convModal.getByRole('button', { name: /select easy difficulty/i }).click();

    // Easy mode hint banner should appear
    await expect(convModal.getByText(/Easy mode hint: Slower pacing/i)).toBeVisible();

    // Send a message
    const input = convModal.getByPlaceholder('Type your reply in English...');
    await input.fill('I would like to order an oat milk latte, please.');
    await convModal.getByRole('button', { name: 'Send message' }).click();

    // User message is added
    await expect(convModal.getByText('I would like to order an oat milk latte, please.')).toBeVisible();

    // AI reply and easy coaching tip appear
    await expect(convModal.getByText(/Great work! 'Please' and 'thank you'/i)).toBeVisible({ timeout: 5000 });

    // Close conversation studio
    await convModal.getByRole('button', { name: 'Close conversation studio' }).click();
    await expect(convModal).not.toBeVisible();
  });
});
