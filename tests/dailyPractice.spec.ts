import { test, expect } from '@playwright/test';
import { clearTestDatabase } from './testDbHelper';

test.describe('Lexi Daily Practice — Fully Functional Daily Practice & Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearTestDatabase(page);
    await page.reload();
  });

  test('Daily Practice row renders without any "Coming Soon" placeholders and displays real action cards', async ({ page }) => {
    // Assert section heading is visible
    await expect(page.getByRole('heading', { name: 'Daily Practice' })).toBeVisible();

    // Verify there are no "Coming Soon" texts or badges
    const comingSoon = page.getByText(/coming soon/i);
    await expect(comingSoon).toHaveCount(0);

    // Verify the three daily practice cards exist
    const vocabCard = page.getByRole('button', { name: /Vocabulary Practice/i });
    const listeningCard = page.getByRole('button', { name: /Listening Practice/i });
    const speakingCard = page.getByRole('button', { name: /Speaking Practice/i });

    await expect(vocabCard).toBeVisible();
    await expect(listeningCard).toBeVisible();
    await expect(speakingCard).toBeVisible();
  });

  test('Launches real Listening activity from Daily Practice and persists completion', async ({ page }) => {
    // Click Daily Listening card
    const listeningCard = page.getByRole('button', { name: /Listening Practice/i });
    await listeningCard.click();

    // Verify Listening Studio modal opens
    const dialog = page.getByRole('dialog', { name: /Ear Training & Comprehension/i });
    await expect(dialog).toBeVisible();

    // Play audio and answer question to finish activity
    await dialog.getByRole('button', { name: '15 minutes' }).click();
    await dialog.getByRole('button', { name: 'Check Answer' }).click();

    // End session early to record completion
    await dialog.getByRole('button', { name: /End Session Early/i }).click();

    // Close the modal
    await dialog.getByRole('button', { name: 'Close listening studio' }).click();
    await expect(dialog).not.toBeVisible();

    // Verify Listening card on Home now displays ✓ Done
    const listeningAfter = page.getByRole('button', { name: /Listening Practice: ✓ Done/i });
    await expect(listeningAfter).toBeVisible();

    // Reload page to verify persistence in IndexedDB
    await page.reload();
    const listeningReloaded = page.getByRole('button', { name: /Listening Practice: ✓ Done/i });
    await expect(listeningReloaded).toBeVisible();
  });

  test('Launches Speaking activity from Daily Practice and opens Conversation Coach', async ({ page }) => {
    // Click Daily Speaking card
    const speakingCard = page.getByRole('button', { name: /Speaking Practice/i });
    await speakingCard.click();

    // Verify Conversation Coach modal opens
    const dialog = page.getByRole('dialog', { name: /Interactive Dialogue Practice/i });
    await expect(dialog).toBeVisible();

    // Send a message
    const input = dialog.getByPlaceholder('Type your reply in English...');
    await input.fill('Could I get an iced latte with oat milk, please?');
    await dialog.getByRole('button', { name: 'Send message' }).click();

    // Verify reply received
    await expect(dialog.getByText(/Wonderful phrasing!/i)).toBeVisible({ timeout: 5000 });

    // Close dialog
    await dialog.getByRole('button', { name: 'Close conversation studio' }).click();
    await expect(dialog).not.toBeVisible();

    // Verify Speaking card on Home now displays ✓ Done
    const speakingAfter = page.getByRole('button', { name: /Speaking Practice: ✓ Done/i });
    await expect(speakingAfter).toBeVisible();
  });

  test('Launches Vocabulary activity from Daily Practice (Review Due)', async ({ page }) => {
    // Click Daily Vocabulary card
    const vocabCard = page.getByRole('button', { name: /Vocabulary Practice/i });
    await vocabCard.click();

    // The Review Player modal opens for due cards
    const reviewDialog = page.getByRole('dialog', { name: /Vocabulary Review/i });
    await expect(reviewDialog).toBeVisible();

    // Tap to reveal definition
    await reviewDialog.getByText(/Tap to Reveal Definition/i).click();

    // Click rating
    await reviewDialog.getByRole('button', { name: /Good/i }).click();

    // Exit review
    await reviewDialog.getByRole('button', { name: 'Exit review' }).click();
    const leaveBtn = reviewDialog.getByRole('button', { name: 'Leave' });
    if (await leaveBtn.isVisible().catch(() => false)) {
      await leaveBtn.click();
    }
  });
});
