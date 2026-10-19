import { test, expect } from '@playwright/test';

test.describe('Lexi Phase I — Unified Progress & Improvement Dashboard', () => {
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

  const goToProgress = async (page: any) => {
    const nav = page.getByRole('navigation', { name: 'Main Navigation' });
    await expect(nav).toBeVisible();
    const progressTab = nav.getByRole('button', { name: 'Progress' });
    await progressTab.click();
    await expect(progressTab).toHaveAttribute('aria-current', 'page');
  };

  test('navigates to Progress tab, verifies fluency metrics, curriculum tracking, error patterns, and studio navigation', async ({ page }) => {
    await goToProgress(page);

    // 1. Header & Level Badge
    await expect(page.getByText('Progress & Insights')).toBeVisible();
    await expect(page.getByText(/CEFR/i).first()).toBeVisible();

    // 2. Hero Daily Goal & Streak Card
    await expect(page.getByText("Today's Momentum")).toBeVisible();
    await expect(page.getByText(/Day Streak/i)).toBeVisible();
    await expect(page.getByText('Daily Goal Progress')).toBeVisible();
    await expect(page.getByText('Fluency Index')).toBeVisible();

    // 3. CEFR Curriculum Pathway
    await expect(page.getByText('CEFR Curriculum Pathway')).toBeVisible();
    await expect(page.getByText(/Up Next in Curriculum:/i)).toBeVisible();

    // 4. Studio Skill Breakdown (6 studios)
    await expect(page.getByText('Skill Mastery Breakdown')).toBeVisible();
    await expect(page.getByText('Conversation', { exact: true })).toBeVisible();
    await expect(page.getByText('Stories', { exact: true })).toBeVisible();
    await expect(page.getByText('Vocabulary', { exact: true })).toBeVisible();
    await expect(page.getByText('Grammar', { exact: true })).toBeVisible();
    await expect(page.getByText('Listening', { exact: true })).toBeVisible();
    await expect(page.getByText('Interview', { exact: true })).toBeVisible();

    // 5. Memory & FSRS Vocabulary Overview
    await expect(page.getByText('FSRS Spaced-Repetition Retention')).toBeVisible();
    await expect(page.getByText('Total Words')).toBeVisible();
    await expect(page.getByText('Due Review')).toBeVisible();

    // 6. AI Error Pattern Diagnostics
    await expect(page.getByText('AI Error Pattern Diagnostics')).toBeVisible();
    await expect(page.getByText(/Prepositions of Time/i)).toBeVisible();
    await expect(page.getByText(/Past Simple vs Continuous Transitions/i)).toBeVisible();
    await expect(page.getByText(/Article Precision/i)).toBeVisible();

    // 7. Test Studio launch from diagnostic action button ("Fix in Grammar")
    const fixGrammarBtn = page.getByRole('button', { name: 'Fix in Grammar' });
    await expect(fixGrammarBtn).toBeVisible();
    await fixGrammarBtn.click();

    // Verify Grammar Studio opens
    const grammarDialog = page.getByRole('dialog', { name: /Grammar Practice Studio/i });
    await expect(grammarDialog).toBeVisible();
    await grammarDialog.getByRole('button', { name: 'Close grammar studio' }).click();
    await expect(grammarDialog).not.toBeVisible();

    // 8. Test Studio launch from Action Plan ("Practice" interview)
    const actionPlan = page.getByRole('region', { name: 'Personalized Action Plan' });
    const practiceInterviewBtn = actionPlan.getByRole('button', { name: 'Practice', exact: true });
    await expect(practiceInterviewBtn).toBeVisible();
    await practiceInterviewBtn.click();

    // Verify Interview Trainer opens
    const interviewDialog = page.getByRole('dialog', { name: 'Personal Interview Trainer' });
    await expect(interviewDialog).toBeVisible();
    await interviewDialog.getByRole('button', { name: 'Close interview trainer' }).click();
    await expect(interviewDialog).not.toBeVisible();

    // 9. Recommended Learning Next Steps
    await expect(page.getByText('Recommended Learning Next Steps')).toBeVisible();
  });
});
