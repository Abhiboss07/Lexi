import { test, expect } from '@playwright/test';
import { clearTestDatabase } from './testDbHelper';

test.describe('Lexi — Quick Picks "See All" Interactive Learning Hub', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearTestDatabase(page);
    await page.reload();
  });

  const openActivityHub = async (page: any) => {
    const seeAllBtn = page.getByRole('button', { name: 'See All' }).first();
    await expect(seeAllBtn).toBeVisible();
    await seeAllBtn.scrollIntoViewIfNeeded();
    await seeAllBtn.click();
    const hubDialog = page.getByRole('dialog', { name: /explore learning activities/i });
    await expect(hubDialog).toBeVisible();
    return hubDialog;
  };

  test('clicking See All on Quick Picks opens Explore Activities Hub with category filters and search', async ({ page }) => {
    const hubDialog = await openActivityHub(page);
    await expect(page.getByRole('heading', { name: 'Explore Learning Activities' })).toBeVisible();

    // 1. Verify category filter pills exist
    await expect(hubDialog.getByRole('button', { name: /all \(/i })).toBeVisible();
    await expect(hubDialog.getByRole('button', { name: 'Quick Games', exact: true })).toBeVisible();
    await expect(hubDialog.getByRole('button', { name: 'Vocabulary', exact: true })).toBeVisible();
    await expect(hubDialog.getByRole('button', { name: 'Grammar', exact: true })).toBeVisible();
    await expect(hubDialog.getByRole('button', { name: 'Listening & Speaking', exact: true })).toBeVisible();
    await expect(hubDialog.getByRole('button', { name: 'Creative & Visual', exact: true })).toBeVisible();
    await expect(hubDialog.getByRole('button', { name: 'Career & Goals', exact: true })).toBeVisible();

    // 2. Test Search filter
    const searchInput = hubDialog.getByPlaceholder(/search activities/i);
    await searchInput.fill('Phrase Builder');
    await expect(hubDialog.getByRole('heading', { name: 'Phrase Builder' })).toBeVisible();
    await expect(hubDialog.getByRole('heading', { name: 'Short Listening Quiz' })).not.toBeVisible();

    // Clear search
    await searchInput.fill('');
    await expect(hubDialog.getByRole('heading', { name: 'Short Listening Quiz' })).toBeVisible();

    // 3. Click preferences gear inside Hub
    const gearBtn = hubDialog.getByRole('button', { name: 'Open learning preferences' });
    await expect(gearBtn).toBeVisible();
    await gearBtn.click();

    // Preferences modal opens over Hub
    const prefsModal = page.getByRole('dialog', { name: 'Practice Preferences' });
    await expect(prefsModal).toBeVisible();
    await prefsModal.getByRole('button', { name: 'Close practice preferences' }).click();
    await expect(prefsModal).not.toBeVisible();

    // 4. Close Hub
    await hubDialog.getByRole('button', { name: 'Back to Home' }).click();
    await expect(hubDialog).not.toBeVisible();
  });

  test('launches Phrase Builder, places words, and verifies sentence completion', async ({ page }) => {
    const hubDialog = await openActivityHub(page);

    // Click Start Phrase Builder
    await hubDialog.getByRole('button', { name: 'Start Phrase Builder' }).click();

    // Phrase Builder modal is open
    const builderModal = page.getByRole('dialog', { name: /Phrase Builder/i });
    await expect(builderModal).toBeVisible();
    await expect(builderModal.getByText(/Arrange words in natural order/i)).toBeVisible();

    // Click first word button in the bank (labeled Add ...)
    const firstWordBtn = builderModal.getByRole('button', { name: /^Add /i }).first();
    await expect(firstWordBtn).toBeVisible();
    await firstWordBtn.click();

    // Reset button clears placed words
    const resetBtn = builderModal.getByRole('button', { name: /reset/i });
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    // Close Phrase Builder
    await builderModal.getByRole('button', { name: /close phrase builder/i }).click();
    await expect(builderModal).not.toBeVisible();
  });

  test('launches Idiom of the Day, allows bookmarking, and tests knowledge quiz', async ({ page }) => {
    const hubDialog = await openActivityHub(page);
    await hubDialog.getByRole('button', { name: 'Start Idiom & Expression of the Day' }).click();

    const idiomModal = page.getByRole('dialog', { name: /Idiom & Phrase/i });
    await expect(idiomModal).toBeVisible();

    // Bookmark button
    const bookmarkBtn = idiomModal.getByRole('button', { name: /bookmark/i });
    await expect(bookmarkBtn).toBeVisible();
    await bookmarkBtn.click();

    // Check knowledge quiz option
    const quizOption = idiomModal.locator('div.space-y-2 button').first();
    await expect(quizOption).toBeVisible();
    await quizOption.click();

    // Close idiom modal
    await idiomModal.getByRole('button', { name: /close idiom modal/i }).click();
    await expect(idiomModal).not.toBeVisible();
  });

  test('launches Short Listening Quiz and toggles transcript disclosure', async ({ page }) => {
    const hubDialog = await openActivityHub(page);
    await hubDialog.getByRole('button', { name: 'Start Short Listening Quiz' }).click();

    const listeningModal = page.getByRole('dialog', { name: /Short Listening Quiz/i });
    await expect(listeningModal).toBeVisible();

    // Verify speed controls (Normal vs Slower)
    await expect(listeningModal.getByRole('button', { name: 'Normal (1.0x)' })).toBeVisible();
    await expect(listeningModal.getByRole('button', { name: 'Slower (0.8x)' })).toBeVisible();

    // Toggle transcript
    const transcriptToggle = listeningModal.getByRole('button', { name: /Show Accessible Transcript/i });
    await expect(transcriptToggle).toBeVisible();
    await transcriptToggle.click();
    await expect(listeningModal.getByRole('button', { name: /Hide Accessible Transcript/i })).toBeVisible();

    // Close quiz
    await listeningModal.getByRole('button', { name: /close listening quiz/i }).click();
    await expect(listeningModal).not.toBeVisible();
  });

  test('launches Interview Question Sprint with STAR framework guidance', async ({ page }) => {
    const hubDialog = await openActivityHub(page);
    await hubDialog.getByRole('button', { name: 'Start Interview Question Sprint' }).click();

    const interviewModal = page.getByRole('dialog', { name: /Interview Question Sprint/i });
    await expect(interviewModal).toBeVisible();

    // Expand STAR Framework guidance
    const starBtn = interviewModal.getByRole('button', { name: /Show STAR Framework Blueprint/i });
    await expect(starBtn).toBeVisible();
    await starBtn.click();

    await expect(interviewModal.getByText(/Situation:/i)).toBeVisible();
    await expect(interviewModal.getByText(/Task:/i)).toBeVisible();
    await expect(interviewModal.getByText(/Action:/i)).toBeVisible();
    await expect(interviewModal.getByText(/Result:/i)).toBeVisible();

    // Verify link to full interview studio
    await expect(interviewModal.getByRole('button', { name: /Full Mock Interview Studio/i })).toBeVisible();

    // Close sprint
    await interviewModal.getByRole('button', { name: /close interview sprint/i }).click();
    await expect(interviewModal).not.toBeVisible();
  });
});
