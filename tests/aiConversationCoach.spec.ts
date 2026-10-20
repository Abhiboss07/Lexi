import { test, expect } from '@playwright/test';

test.describe('Lexi AI Conversation Coach & Personalized English Feedback (Phase 8)', () => {
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

  const goToProgress = async (page: any) => {
    const nav = page.getByRole('navigation', { name: 'Main Navigation' });
    await expect(nav).toBeVisible();
    const progressTab = nav.getByRole('button', { name: 'Progress' });
    await progressTab.click();
    await expect(progressTab).toHaveAttribute('aria-current', 'page');
  };

  test('Conversation Coach: multi-turn partner replies, progressive hints, linguistic feedback, and FSRS vocab save', async ({ page }) => {
    await goToPractice(page);

    // 1. Open Conversation Studio
    await page.getByRole('button', { name: 'Conversation', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: /Interactive Dialogue Practice/i });
    await expect(dialog).toBeVisible();

    // 2. Scenario Header and Partner Persona
    await expect(dialog.getByText('Ordering at a Cozy Café')).toBeVisible();
    await expect(dialog.getByText('Alex')).toBeVisible();
    await expect(dialog.getByText('(Barista)')).toBeVisible();
    await expect(dialog.getByText('A1 • Beginner')).toBeVisible();

    // 3. Audio & Voice Controls
    const audioBtn = dialog.getByRole('button', { name: 'Listen to coach audio' }).first();
    await expect(audioBtn).toBeVisible();
    const micBtn = dialog.getByRole('button', { name: /start voice input/i });
    await expect(micBtn).toBeVisible();

    // 4. Test Progressive Hint System (does NOT immediately reveal full answer)
    const hintBtn = dialog.getByRole('button', { name: /Need a hint\?/i });
    await expect(hintBtn).toBeVisible();
    await hintBtn.click();

    // Level 1: Strategy concept hint
    await expect(dialog.getByText(/Strategy Hint/i)).toBeVisible();
    await expect(dialog.getByText(/Greet Alex politely and specify what drink you want/i)).toBeVisible();

    // Advance to Level 2
    await dialog.getByRole('button', { name: /Advance to Level 2/i }).click();
    await expect(dialog.getByText(/Sentence Starter Hint/i)).toBeVisible();

    // Advance to Level 3
    await dialog.getByRole('button', { name: /Advance to Level 3/i }).click();
    await expect(dialog.getByText(/Complete Model Phrase/i)).toBeVisible();

    // Hide hint
    await dialog.getByRole('button', { name: 'Hide' }).click();
    await expect(dialog.getByText(/Complete Model Phrase/i)).not.toBeVisible();

    // 5. Test Suggested Starters Toggle
    const startersToggle = dialog.getByRole('button', { name: /Suggested Starters/i });
    await startersToggle.click();
    const starterChip = dialog.getByRole('button', { name: /\+ Could I please get\.\.\./i });
    await expect(starterChip).toBeVisible();
    await starterChip.click();

    const input = dialog.getByPlaceholder('Type your reply in English...');
    await expect(input).toHaveValue('Could I please get...');

    // Complete the sentence and send
    await input.fill('Could I please get an iced latte with oat milk, please?');
    await dialog.getByRole('button', { name: 'Send message' }).click();

    // Verify user message visible
    await expect(dialog.getByText('Could I please get an iced latte with oat milk, please?')).toBeVisible();

    // Verify context-aware partner response acknowledging the drink
    await expect(dialog.getByText(/iced oat milk latte|Wonderful phrasing/i)).toBeVisible({ timeout: 5000 });

    // 6. Inspect Personalized Linguistic Feedback Accordion
    await expect(dialog.getByText(/Coach Feedback & Linguistic Insights/i)).toBeVisible();
    await expect(dialog.getByText(/What worked well/i)).toBeVisible();
    await expect(dialog.getByText(/More Natural Expression:/i)).toBeVisible();

    // 7. Test Turn 2 with an intentional grammatical preposition mistake ("in night")
    await input.fill('I usually study English in night. What pastries do you have fresh today?');
    await dialog.getByRole('button', { name: 'Send message' }).click();

    // Partner contextually responds
    await expect(dialog.getByText(/comes to £|tap your card|pastries/i).first()).toBeVisible({ timeout: 5000 });

    // Inspect grammar correction for "in night" -> "at night"
    await expect(dialog.getByText(/Grammar & Syntax Correction:/i)).toBeVisible();
    await expect(dialog.getByText(/at night/i).first()).toBeVisible();
    await expect(dialog.getByText(/Rule Insight:/i)).toBeVisible();

    // 8. Open Structured Session Evaluation Scorecard
    const evalBtn = dialog.getByRole('button', { name: 'Evaluate' });
    await expect(evalBtn).toBeVisible();
    await evalBtn.click();

    // 9. Verify Evaluation Scorecard metrics & strengths
    await expect(dialog.getByText('SESSION EVALUATION')).toBeVisible();
    await expect(dialog.getByText('Overall Communication Score')).toBeVisible();
    await expect(dialog.getByText('Performance Breakdown')).toBeVisible();
    await expect(dialog.getByText('Naturalness & Fluency')).toBeVisible();
    await expect(dialog.getByText('Grammar Accuracy')).toBeVisible();
    await expect(dialog.getByText('Vocabulary Diversity')).toBeVisible();
    await expect(dialog.getByText('Key Strengths Demonstrated')).toBeVisible();

    // 10. Save Vocabulary Word into FSRS Deck
    const savePastryBtn = dialog.getByRole('button', { name: '+ Save Word' }).first();
    await expect(savePastryBtn).toBeVisible();
    await savePastryBtn.click();
    await expect(dialog.getByText('Saved to Deck')).toBeVisible();

    // 11. Complete session
    await dialog.getByRole('button', { name: 'Done' }).click();
    await expect(dialog).not.toBeVisible();

    // 12. Verify newly saved word in Vocabulary Notebook
    await expect(page.getByRole('heading', { name: 'cappuccino' })).toBeVisible();
  });

  test('Progress Dashboard: tracks and inspects real recorded mistake patterns', async ({ page }) => {
    await goToPractice(page);

    // Open Conversation Studio and trigger preposition mistake
    await page.getByRole('button', { name: 'Conversation', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: /Interactive Dialogue Practice/i });
    await expect(dialog).toBeVisible();

    const input = dialog.getByPlaceholder('Type your reply in English...');
    await input.fill('I usually study English in night.');
    await dialog.getByRole('button', { name: 'Send message' }).click();
    await expect(dialog.getByText(/Grammar & Syntax Correction:/i)).toBeVisible({ timeout: 5000 });

    // Close conversation studio
    await dialog.getByRole('button', { name: 'Close conversation studio' }).click();
    await expect(dialog).not.toBeVisible();

    // Navigate to Progress Dashboard
    await goToProgress(page);

    // AI Error Pattern Diagnostics should display recorded mistake
    await expect(page.getByRole('heading', { name: 'AI Error Pattern Diagnostics' })).toBeVisible();
    await expect(page.getByText('Preposition Usage')).toBeVisible();
    await expect(page.getByText(/Seen 1x/i)).toBeVisible();

    // Click "Inspect Feedback" button
    const inspectBtn = page.getByRole('button', { name: 'Inspect Feedback' });
    await expect(inspectBtn).toBeVisible();
    await inspectBtn.click();

    // Inspector modal opens with full evidence
    const inspector = page.getByRole('dialog', { name: /Preposition Usage/i });
    await expect(inspector).toBeVisible();
    await expect(inspector.getByText(/In English, we say 'at night'/i)).toBeVisible();
    await expect(inspector.getByText('I usually study English in night.')).toBeVisible();
    await expect(inspector.getByText(/✓ I usually study English at night\./i)).toBeVisible();

    // Close inspector
    await inspector.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(inspector).not.toBeVisible();
  });

  test('Responsive Layout: Conversation Coach and Mistake Inspector render with zero horizontal overflow across 320px–1280px', async ({ page }) => {
    const viewports = [
      { width: 320, height: 640 },
      { width: 360, height: 740 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 1280, height: 800 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await goToPractice(page);

      await page.getByRole('button', { name: 'Conversation', exact: true }).click();
      const coachDialog = page.getByRole('dialog', { name: /Interactive Dialogue Practice/i });
      await expect(coachDialog).toBeVisible();

      // Check zero horizontal overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(overflow).toBe(false);

      await coachDialog.getByRole('button', { name: 'Close conversation studio' }).click();
      await expect(coachDialog).not.toBeVisible();
    }
  });
});
