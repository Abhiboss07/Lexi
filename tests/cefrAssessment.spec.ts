import { test, expect } from '@playwright/test';

test.describe('Lexi — CEFR Placement, Skill Assessment & Verified Mastery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear any previous drafts
    await page.evaluate(() => {
      localStorage.removeItem('lexi_assessment_draft_local-learner-1');
    });
  });

  test('Launches CEFR Placement Assessment from Progress screen, navigates questions, and reviews results', async ({ page }) => {
    // 1. Navigate to Progress tab
    const nav = page.getByRole('navigation', { name: 'Main Navigation' });
    await nav.getByRole('button', { name: 'Progress' }).click();

    await expect(page.getByText('Progress & Insights')).toBeVisible();

    // 2. Click "Take Test" or the CEFR badge button
    const takeTestBtn = page.getByRole('button', { name: 'Start CEFR Placement Test' });
    await expect(takeTestBtn).toBeVisible();
    await takeTestBtn.click();

    // 3. Verify Modal opens with dialog semantics
    const modal = page.getByRole('dialog', { name: /Assessment Results & Level Diagnosis|CEFR Placement Assessment/i });
    await expect(modal).toBeVisible();
    await expect(modal.getByText(/Stage 1: Core Calibration/i)).toBeVisible();

    const vp = page.viewportSize();
    const vpSuffix = vp && vp.width < 500 ? '390px' : '1280px';
    await page.screenshot({
      path: `/home/abhiboss/.gemini/antigravity/brain/d20f30d9-d11b-4244-9752-50bc4be0eb44/placement_assessment_question_${vpSuffix}.png`,
    });

    // 4. Verify Question elements: Skill badge, focus area, options
    await expect(modal.getByText(/grammar/i).first()).toBeVisible();
    await expect(modal.getByRole('radiogroup')).toBeVisible();

    // Answer Question 1 (drinks)
    const q1Option = modal.getByRole('radio', { name: /drinks/i });
    await q1Option.click();
    await expect(q1Option).toHaveAttribute('aria-checked', 'true');

    // Click Next
    await modal.getByRole('button', { name: 'Next' }).click();

    // Question 2 (saw)
    await expect(modal.getByText(/Q 2 of/i)).toBeVisible();
    const q2Option = modal.getByRole('radio', { name: /saw/i });
    await q2Option.click();
    await modal.getByRole('button', { name: 'Next' }).click();

    // Question 3 (pharmacy)
    await expect(modal.getByText(/Q 3 of/i)).toBeVisible();
    await modal.getByRole('radio', { name: /pharmacy/i }).click();
    await modal.getByRole('button', { name: 'Next' }).click();

    // Question 4 (make)
    await expect(modal.getByText(/Q 4 of/i)).toBeVisible();
    await modal.getByRole('radio', { name: /make/i }).click();
    await modal.getByRole('button', { name: 'Next' }).click();

    // Question 5 (reading passage - 5:00 PM)
    await expect(modal.getByText(/Reading Passage/i)).toBeVisible();
    await modal.getByRole('radio', { name: /5:00 PM/i }).click();
    await modal.getByRole('button', { name: 'Next' }).click();

    // Question 6 (reading email - Bring his own sweet food)
    await modal.getByRole('radio', { name: /Bring his own sweet food/i }).click();
    await modal.getByRole('button', { name: 'Next' }).click();

    // Question 7 (listening clip - Heavy rain)
    await expect(modal.getByText(/Listening Clip/i)).toBeVisible();
    const audioBtn = modal.getByRole('button', { name: /Play listening audio clip/i });
    await expect(audioBtn).toBeVisible();
    await modal.getByRole('radio', { name: /Heavy rain/i }).click();
    await modal.getByRole('button', { name: 'Next' }).click();

    // Question 8 (listening café - Oat milk)
    await expect(modal.getByRole('button', { name: /Play listening audio clip/i })).toBeVisible();
    await modal.getByRole('radio', { name: /Oat milk/i }).click();

    // Because score is high (8/8), it adapts into Stage 2 (Advanced extension)
    await modal.getByRole('button', { name: 'Next' }).click();
    await expect(modal.getByText(/Stage 2: Adaptive Placement Extension/i)).toBeVisible();

    // Answer remaining questions to complete the test
    let maxSafetyTurns = 12;
    while (maxSafetyTurns > 0) {
      maxSafetyTurns--;
      const isResultVisible = await modal.getByText(/DIAGNOSTIC PLACEMENT RESULT/i).isVisible();
      if (isResultVisible) break;

      const firstRadio = modal.getByRole('radio').first();
      if (await firstRadio.isVisible()) {
        await firstRadio.click();
      }

      const finishBtn = modal.getByRole('button', { name: 'Finish & Diagnose' });
      if (await finishBtn.isVisible()) {
        await finishBtn.click();
        break;
      }

      const nextBtn = modal.getByRole('button', { name: 'Next' });
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
      }
    }

    // 5. Verify Results Display
    await expect(modal.getByText(/DIAGNOSTIC PLACEMENT RESULT/i)).toBeVisible({ timeout: 5000 });
    await expect(modal.getByText(/CEFR/i).first()).toBeVisible();
    await expect(modal.getByText(/Informal Placement Estimate:/i)).toBeVisible();
    await expect(modal.getByText(/Multi-Skill Performance Diagnostics/i)).toBeVisible();
    await expect(modal.getByText('Grammar', { exact: true })).toBeVisible();
    await expect(modal.getByText('Vocabulary', { exact: true })).toBeVisible();
    await expect(modal.getByText('Reading', { exact: true })).toBeVisible();
    await expect(modal.getByText('Listening', { exact: true })).toBeVisible();

    await page.screenshot({
      path: `/home/abhiboss/.gemini/antigravity/brain/d20f30d9-d11b-4244-9752-50bc4be0eb44/placement_assessment_results_${vpSuffix}.png`,
    });

    // 6. Test Accordion for question-by-question inspection
    const accordionBtn = modal.getByRole('button', { name: /Inspect Question-by-Question Answers/i });
    await expect(accordionBtn).toBeVisible();
    await accordionBtn.click();
    await expect(modal.getByText(/Explanation:/i).first()).toBeVisible();

    // 7. Verify explicit Apply button
    const applyBtn = modal.getByRole('button', { name: /Apply CEFR/i });
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();
    await expect(modal.getByText(/successfully calibrated/i)).toBeVisible();

    // Close modal
    await modal.getByRole('button', { name: 'Close assessment' }).click();
    await expect(modal).not.toBeVisible();
  });

  test('Recovers gracefully when reloaded during an in-flight assessment', async ({ page }) => {
    // 1. Navigate to Practice tab
    const nav = page.getByRole('navigation', { name: 'Main Navigation' });
    await nav.getByRole('button', { name: 'Practice' }).click();

    // 2. Open placement test from quick bar
    const testPill = page.getByRole('button', { name: 'Open CEFR placement test' });
    await expect(testPill).toBeVisible();
    await testPill.click();

    const modal = page.getByRole('dialog', { name: /CEFR Placement Assessment/i });
    await expect(modal).toBeVisible();

    // 3. Answer question 1 and question 2
    await modal.getByRole('radio', { name: /drinks/i }).click();
    await modal.getByRole('button', { name: 'Next' }).click();
    await expect(modal.getByText(/Q 2 of/i)).toBeVisible();

    await modal.getByRole('radio', { name: /saw/i }).click();
    await modal.getByRole('button', { name: 'Next' }).click();
    await expect(modal.getByText(/Q 3 of/i)).toBeVisible();

    // 4. Reload page to simulate accidental interruption
    await page.reload();

    // 5. Re-open from Practice tab
    const navAfterReload = page.getByRole('navigation', { name: 'Main Navigation' });
    await navAfterReload.getByRole('button', { name: 'Practice' }).click();
    await page.getByRole('button', { name: 'Open CEFR placement test' }).click();

    const resumedModal = page.getByRole('dialog', { name: /CEFR Placement Assessment/i });
    await expect(resumedModal).toBeVisible();

    // Verify it resumed at Question 3 rather than restarting from Question 1!
    await expect(resumedModal.getByText(/Q 3 of/i)).toBeVisible();

    // Click Back to verify Question 2 answer was preserved
    await resumedModal.getByRole('button', { name: 'Back' }).click();
    await expect(resumedModal.getByText(/Q 2 of/i)).toBeVisible();
    const preservedOption = resumedModal.getByRole('radio', { name: /saw/i });
    await expect(preservedOption).toHaveAttribute('aria-checked', 'true');
  });

  test('Renders responsive layout without horizontal overflow across 320px, 390px, 768px, 1280px', async ({ page }) => {
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
      await page.goto('/');

      const nav = page.getByRole('navigation', { name: 'Main Navigation' });
      await nav.getByRole('button', { name: 'Progress' }).click();

      const takeTestBtn = page.getByRole('button', { name: 'Start CEFR Placement Test' });
      await expect(takeTestBtn).toBeVisible();
      await takeTestBtn.click();

      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();

      // Check horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow).toBe(false);

      await modal.getByRole('button', { name: 'Close assessment' }).click();
    }
  });
});
