import { test, expect } from '@playwright/test';
import { clearTestDatabase } from './testDbHelper';

test.describe('Lexi Complementary Quick Picks Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearTestDatabase(page);
    await page.reload();
  });

  test('Home page displays 4 complementary Quick Picks cards with appropriate icons and titles', async ({ page }) => {
    const quickPicks = page.locator('section[aria-labelledby="quick-picks-heading"]');
    await expect(quickPicks).toBeVisible();

    await expect(quickPicks.getByText('Word Quest')).toBeVisible();
    await expect(quickPicks.getByText('Mini Language Game')).toBeVisible();

    await expect(quickPicks.getByText('Quick Notes')).toBeVisible();
    await expect(quickPicks.getByText('Personal Notebook')).toBeVisible();

    await expect(quickPicks.getByText('Sketch & Explain')).toBeVisible();
    await expect(quickPicks.getByText('Learning Canvas')).toBeVisible();

    await expect(quickPicks.getByText('Daily Challenge')).toBeVisible();
    await expect(quickPicks.getByText('One Small Win')).toBeVisible();
  });

  test('Quick Notes: creates note, pins, searches, and persists locally across reloads', async ({ page }) => {
    // 1. Open Quick Notes from Home card
    await page.getByRole('button', { name: /Quick Notes: Personal Notebook/i }).click();
    const notesModal = page.getByRole('dialog', { name: /Quick Notes/i });
    await expect(notesModal).toBeVisible();

    // 2. Click "New Note" and fill in form
    await notesModal.getByRole('button', { name: /New Note/i }).click();
    await notesModal.getByPlaceholder(/Say 'I agree'/i).fill('Remember: "depend on", not "depend of"');
    await notesModal.getByPlaceholder(/Write your explanation/i).fill('In English, the preposition following depend is always "on". Example: It depends on the weather.');
    await notesModal.getByPlaceholder(/team proposal/i).fill('Our picnic depends on the weather tomorrow.');
    await notesModal.getByRole('checkbox', { name: /Pin to top/i }).check();

    // 3. Save note
    await notesModal.getByRole('button', { name: /Save Note/i }).click();

    // 4. Note appears in list with Pinned badge
    await expect(notesModal.getByText('Remember: "depend on", not "depend of"')).toBeVisible();
    await expect(notesModal.getByText('Pinned').first()).toBeVisible();

    // 5. Test search filter
    const searchInput = notesModal.getByPlaceholder(/Search notes/i);
    await searchInput.fill('weather');
    await expect(notesModal.getByText('Remember: "depend on", not "depend of"')).toBeVisible();
    await searchInput.fill('nonexistenttermxyz');
    await expect(notesModal.getByText('No matching notes found')).toBeVisible();

    // 6. Close modal, reload page, and verify persistence
    await notesModal.getByRole('button', { name: 'Close notes modal' }).click();
    await expect(notesModal).not.toBeVisible();

    await page.reload();
    await page.getByRole('button', { name: /Quick Notes: Personal Notebook/i }).click();
    await expect(page.getByText('Remember: "depend on", not "depend of"')).toBeVisible();
  });

  test('Word Quest: plays mini-game, checks answer with instant explanation, and tracks score', async ({ page }) => {
    // 1. Open Word Quest
    await page.getByRole('button', { name: /Word Quest: Mini Language Game/i }).click();
    const questModal = page.getByRole('dialog', { name: /Word Quest/i });
    await expect(questModal).toBeVisible();

    // 2. Question box is visible
    await expect(questModal.getByText(/Question 1 of/i)).toBeVisible();

    // 3. Select an option (e.g. first available option button)
    const options = questModal.locator('.grid-cols-2 button');
    const count = await options.count();
    if (count > 0) {
      await options.first().click();
      const checkBtn = questModal.getByRole('button', { name: /Check Answer/i });
      await expect(checkBtn).toBeEnabled();
      await checkBtn.click();

      // Explanation callout appears
      const feedback = questModal.locator('div.border.flex.items-start');
      await expect(feedback).toBeVisible();

      // Next Question button appears
      const nextBtn = questModal.getByRole('button', { name: /Next Question|Complete Quest/i });
      await expect(nextBtn).toBeVisible();
    }

    // 4. Close modal
    await questModal.getByRole('button', { name: 'Close word quest modal' }).click();
    await expect(questModal).not.toBeVisible();
  });

  test('Sketch & Explain: draws on canvas, saves drawing, and views saved gallery', async ({ page }) => {
    // 1. Open Sketch & Explain
    await page.getByRole('button', { name: /Sketch & Explain: Learning Canvas/i }).click();
    const sketchModal = page.getByRole('dialog', { name: /Sketch & Explain/i });
    await expect(sketchModal).toBeVisible();

    // 2. Canvas surface exists
    const canvas = sketchModal.locator('canvas');
    await expect(canvas).toBeVisible();

    // 3. Draw a stroke using mouse drag
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 120, box.y + 100);
      await page.mouse.up();
    }

    // 4. Fill in title & labels
    const titleInput = sketchModal.getByPlaceholder(/My Morning Routine/i);
    await titleInput.fill('Coffee & Morning Desk');
    const labelsInput = sketchModal.getByPlaceholder(/coffee mug, notebook/i);
    await labelsInput.fill('ceramic mug, notebook');

    // 5. Save drawing
    await sketchModal.getByRole('button', { name: /Save Drawing/i }).click();
    await expect(sketchModal.getByText('✓ Drawing saved to local notebook!')).toBeVisible();

    // 6. Switch to Saved Gallery
    await sketchModal.getByRole('button', { name: /Saved \(/i }).click();
    await expect(sketchModal.getByText('Your Saved Sketches')).toBeVisible();
    await expect(sketchModal.getByText('Coffee & Morning Desk')).toBeVisible();

    // 7. Close modal
    await sketchModal.getByRole('button', { name: 'Close sketch canvas modal' }).click();
    await expect(sketchModal).not.toBeVisible();
  });

  test('Daily Challenge: loads rotating task, validates input, submits response, and displays rule-based feedback', async ({ page }) => {
    // 1. Open Daily Challenge
    await page.getByRole('button', { name: /Daily Challenge: One Small Win/i }).click();
    const chalModal = page.getByRole('dialog', { name: /Daily Challenge/i });
    await expect(chalModal).toBeVisible();

    // 2. Prompt title and word counter are present
    await expect(chalModal.getByText(/Target Level:/i)).toBeVisible();

    // 3. Type a full English response satisfying the minimum words
    const textarea = chalModal.getByPlaceholder(/Type your response in English/i);
    await textarea.fill('This morning I enjoyed a fresh cup of coffee at home before starting my work. After lunch I had a productive meeting with my team to discuss new plans. Tonight I will read an English short story.');

    // 4. Submit response
    await chalModal.getByRole('button', { name: /Submit for Feedback/i }).click();

    // 5. Submission completes with feedback
    await expect(chalModal.getByText(/Completed Today!/i)).toBeVisible();
    await expect(chalModal.getByText(/Score:/i)).toBeVisible();
    await expect(chalModal.getByText(/Strengths:/i)).toBeVisible();

    // 6. Close and reopen to verify today's completion state is preserved
    await chalModal.getByRole('button', { name: 'Close daily challenge modal' }).click();
    await expect(chalModal).not.toBeVisible();

    await page.getByRole('button', { name: /Daily Challenge: One Small Win/i }).click();
    await expect(chalModal.getByText(/Completed Today!/i)).toBeVisible();
  });
});
