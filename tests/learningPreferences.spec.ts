import { test, expect } from '@playwright/test';
import { clearTestDatabase } from './testDbHelper';

test.describe('Lexi Phase 4 — Personalized Learning Preferences & Adaptive Difficulty', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearTestDatabase(page);
    await page.reload();
  });

  test('opens Learning Preferences from header avatar and displays all Phase 4 preference controls', async ({ page }) => {
    // 1. Locate profile avatar in LexiHeader and click it
    const avatarButton = page.getByRole('button', { name: /user profile settings/i });
    await expect(avatarButton).toBeVisible();
    await avatarButton.click();

    // 2. Preferences modal appears
    const modal = page.getByRole('dialog', { name: 'Practice Preferences' });
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { name: 'Practice Preferences' })).toBeVisible();

    // 3. CEFR Level selector buttons A1 to C1
    for (const lvl of ['A1', 'A2', 'B1', 'B2', 'C1']) {
      await expect(modal.getByRole('button', { name: `Select CEFR level ${lvl}` })).toBeVisible();
    }

    // 4. Practice Difficulty options (Easy, Medium, Hard)
    await expect(modal.getByRole('button', { name: /easy/i }).first()).toBeVisible();
    await expect(modal.getByRole('button', { name: /medium/i }).first()).toBeVisible();
    await expect(modal.getByRole('button', { name: /hard/i }).first()).toBeVisible();

    // 5. Session Duration options (Quick 3-5m, Standard 8-10m, Extended 15-20m)
    await expect(modal.getByRole('button', { name: /quick/i })).toBeVisible();
    await expect(modal.getByRole('button', { name: /standard/i })).toBeVisible();
    await expect(modal.getByRole('button', { name: /extended/i })).toBeVisible();

    // 6. Daily Goal targets
    for (const min of ['5m', '10m', '15m', '20m', '30m']) {
      await expect(modal.getByRole('button', { name: min, exact: true })).toBeVisible();
    }

    // 7. Feedback Style: Immediate vs Detailed
    await expect(modal.getByText(/Immediate Feedback/i)).toBeVisible();
    await expect(modal.getByText(/Gentle Guidance/i)).toBeVisible();

    // 8. Contextual Hints switch
    await expect(modal.getByRole('switch', { name: /Toggle contextual hints/i })).toBeVisible();

    // 9. Practice Days of the week (Mon to Sun)
    for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']) {
      await expect(modal.getByRole('button', { name: `Toggle practice day ${day}` })).toBeVisible();
    }

    // 10. Reminder frequencies
    await expect(modal.getByRole('button', { name: 'off', exact: true })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'daily', exact: true })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'weekdays', exact: true })).toBeVisible();

    // Close modal
    await modal.getByRole('button', { name: 'Close practice preferences' }).click();
    await expect(modal).not.toBeVisible();
  });

  test('selecting a different CEFR level triggers confirmation and updates level upon saving', async ({ page }) => {
    const avatarButton = page.getByRole('button', { name: /user profile settings/i });
    await avatarButton.click();

    const modal = page.getByRole('dialog', { name: 'Practice Preferences' });
    await expect(modal).toBeVisible();

    // Click B1 button (user is initially A2)
    const b1Btn = modal.getByRole('button', { name: 'Select CEFR level B1' });
    await b1Btn.click();

    // Level change confirmation prompt appears
    await expect(modal.getByText(/Switch proficiency level to/i)).toBeVisible();
    const confirmBtn = modal.getByRole('button', { name: 'Confirm Level Change' });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Change difficulty to Hard and session length to Extended
    await modal.getByRole('button', { name: /hard/i }).first().click();
    await modal.getByRole('button', { name: /extended/i }).click();

    // Toggle Sunday
    await modal.getByRole('button', { name: 'Toggle practice day Sun' }).click();

    // Save preferences
    await modal.getByRole('button', { name: /save preferences/i }).click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Reopen modal to verify saved values in Dexie database
    await avatarButton.click();
    await expect(modal).toBeVisible();

    // Check that B1 is selected
    await expect(modal.getByText('Current: B1')).toBeVisible();

    // Check that Extended duration button is active (pressed)
    await expect(modal.getByRole('button', { name: /extended/i })).toHaveAttribute('aria-pressed', 'true');

    await modal.getByRole('button', { name: 'Close practice preferences' }).click();
  });
});
