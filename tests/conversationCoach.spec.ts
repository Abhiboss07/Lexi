import { test, expect } from '@playwright/test';

test.describe('Lexi Phase C — AI Conversation Coach Studio', () => {
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

  test('provides realistic scenarios, coach feedback, audio speech, voice toggle, and evaluation scorecard with FSRS vocab saving', async ({ page }) => {
    await goToPractice(page);

    // 1. Open Conversation Studio
    await page.getByRole('button', { name: 'Conversation', exact: true }).click();
    const coachDialog = page.getByRole('dialog', { name: /Interactive Dialogue Practice/i });
    await expect(coachDialog).toBeVisible();

    // 2. Scenario & Persona Information
    await expect(coachDialog.getByText('Ordering at a Cozy Café')).toBeVisible();
    await expect(coachDialog.getByText('Alex')).toBeVisible();
    await expect(coachDialog.getByText('(Barista)')).toBeVisible();
    await expect(coachDialog.getByText('A1 • Beginner')).toBeVisible();

    // 3. Audio pronunciation / speech synthesis button
    const audioBtn = coachDialog.getByRole('button', { name: 'Listen to coach audio' }).first();
    await expect(audioBtn).toBeVisible();
    await audioBtn.click();

    // 4. Voice Input (Microphone) button
    const micBtn = coachDialog.getByRole('button', { name: /start voice input/i });
    await expect(micBtn).toBeVisible();

    // 5. Send first message
    const input = coachDialog.getByPlaceholder('Type your reply in English...');
    await input.fill("Could I get an iced latte with oat milk, please?");
    await coachDialog.getByRole('button', { name: 'Send message' }).click();

    await expect(coachDialog.getByText("Could I get an iced latte with oat milk, please?")).toBeVisible();
    // AI reply and coach feedback
    await expect(coachDialog.getByText(/Wonderful phrasing!/i)).toBeVisible({ timeout: 5000 });

    // 6. Send second message via quick prompt tap
    const secondPrompt = coachDialog.getByRole('button', { name: /Could I see what pastries you have fresh today/i });
    await secondPrompt.click();

    // Evaluate button should appear once learner completes conversational turns
    const evalBtn = coachDialog.getByRole('button', { name: 'Evaluate' });
    await expect(evalBtn).toBeVisible({ timeout: 5000 });
    await evalBtn.click();

    // 7. Verify Structured Evaluation Scorecard
    await expect(coachDialog.getByText('SESSION EVALUATION')).toBeVisible();
    await expect(coachDialog.getByText('Overall Communication Score')).toBeVisible();
    await expect(coachDialog.getByText('Strong Fluency')).toBeVisible();
    await expect(coachDialog.getByText('Performance Breakdown')).toBeVisible();
    await expect(coachDialog.getByText('Naturalness & Fluency')).toBeVisible();
    await expect(coachDialog.getByText('Grammar Accuracy')).toBeVisible();
    await expect(coachDialog.getByText('Vocabulary Diversity')).toBeVisible();
    await expect(coachDialog.getByText('Key Strengths Demonstrated')).toBeVisible();

    // 8. Save key vocabulary word from dialogue directly into FSRS Vocabulary Deck
    const savePastryBtn = coachDialog.getByRole('button', { name: '+ Save Word' }).first();
    await expect(savePastryBtn).toBeVisible();
    await savePastryBtn.click();

    // Confirms word saved
    await expect(coachDialog.getByText('Saved to Deck')).toBeVisible();

    // 9. Close coach studio
    await coachDialog.getByRole('button', { name: 'Done' }).click();
    await expect(coachDialog).not.toBeVisible();

    // 10. Verify newly saved word appears in Vocabulary Notebook
    await expect(page.getByRole('heading', { name: 'cappuccino' })).toBeVisible();
  });

  test('switches between everyday, workplace, and travel personas seamlessly', async ({ page }) => {
    await goToPractice(page);
    await page.getByRole('button', { name: 'Conversation', exact: true }).click();
    const coachDialog = page.getByRole('dialog', { name: /Interactive Dialogue Practice/i });
    await expect(coachDialog).toBeVisible();

    // Switch to Meeting a New Colleague (Workplace)
    await coachDialog.getByRole('button', { name: 'Meeting a New Colleague' }).click();
    await expect(coachDialog.getByText('Sarah', { exact: true })).toBeVisible();
    await expect(coachDialog.getByText('(Design Lead)')).toBeVisible();
    await expect(coachDialog.getByText("Hi there! I don't think we've met yet.")).toBeVisible();

    // Switch to Giving a Project Standup Update (Professional)
    await coachDialog.getByRole('button', { name: 'Giving a Project Standup Update' }).click();
    await expect(coachDialog.getByText('Marcus')).toBeVisible();
    await expect(coachDialog.getByText('(Engineering Lead)')).toBeVisible();
    await expect(coachDialog.getByText("Morning team! Let's do a quick round of standup.")).toBeVisible();

    await coachDialog.getByRole('button', { name: 'Close conversation studio' }).click();
    await expect(coachDialog).not.toBeVisible();
  });
});
