import { test, expect } from '@playwright/test';

test.describe('Lexi Listening Comprehension & Speaking Intelligence (Phase 7)', () => {
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

  test('Listening Studio: plays audio, toggles transcript, uses phrase playback, and checks comprehension', async ({ page }) => {
    await goToPractice(page);

    // 1. Open Listening Studio
    await page.getByRole('button', { name: 'Listening', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: /Ear Training & Comprehension/i });
    await expect(dialog).toBeVisible();

    // 2. Verified synthetic audio badge & CEFR pill
    await expect(dialog.getByText('Synthesized English Audio')).toBeVisible();
    await expect(dialog.getByText('A2').first()).toBeVisible();

    // 3. Play audio controls & speed adjustment
    const playBtn = dialog.getByRole('button', { name: 'Play audio' });
    await expect(playBtn).toBeVisible();
    await playBtn.click();
    await dialog.getByRole('button', { name: '1.2x' }).click();

    // 4. Reveal & Hide transcript
    const transcriptToggle = dialog.getByRole('button', { name: /Reveal Transcript/i });
    await transcriptToggle.click();
    await expect(dialog.getByText(/Attention passengers on Platform 3/i)).toBeVisible();
    await dialog.getByRole('button', { name: /Hide Transcript/i }).click();

    // 5. Phrase-by-phrase playback
    await expect(dialog.getByText(/Phrase-by-Phrase Playback/i)).toBeVisible();
    const phraseBtn = dialog.getByRole('button', { name: /Listen to phrase tp-2/i });
    await expect(phraseBtn).toBeVisible();
    await phraseBtn.click();

    // 6. Test Multiple Choice Comprehension
    await dialog.getByRole('button', { name: '15 minutes', exact: true }).click();
    await dialog.getByRole('button', { name: 'Check Answer' }).click();
    await expect(dialog.getByText(/Audio Explanation:/i)).toBeVisible();

    // 7. Finish session and verify persistence
    await dialog.getByRole('button', { name: 'End Session Early' }).click();
    await expect(dialog.getByText('Listening Studio Complete!')).toBeVisible();
    await dialog.getByRole('button', { name: 'Done' }).click();
    await expect(dialog).not.toBeVisible();
  });

  test('Speaking Studio: launches from Practice screen, listens to model, evaluates typed fallback', async ({ page }) => {
    await goToPractice(page);

    // 1. Open Speaking Studio from the studios bar
    await page.getByRole('button', { name: 'Speaking', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: /Spoken Fluency & Rhythm Coach/i });
    await expect(dialog).toBeVisible();

    // 2. Check prompt content and privacy disclosure
    await expect(dialog.getByText(/Scenario Prompt/i)).toBeVisible();
    await expect(dialog.getByText('Local Processing Only')).toBeVisible();
    await expect(dialog.getByText(/Model Response/i)).toBeVisible();

    // 3. Listen to Model Audio
    const modelBtn = dialog.getByRole('button', { name: /Listen to Model/i });
    await expect(modelBtn).toBeVisible();
    await modelBtn.click();

    // 4. Use Typed Input Fallback (for environments without active mic)
    const input = dialog.getByPlaceholder('Type your spoken sentence here...');
    await expect(input).toBeVisible();
    await input.fill('Could I please have a medium oat milk latte to go? How much is that?');
    await dialog.getByRole('button', { name: 'Evaluate' }).click();

    // 5. Inspect Linguistic Analysis & Feedback
    await expect(dialog.getByText('Linguistic Analysis & Feedback')).toBeVisible();
    await expect(dialog.getByText(/Accuracy/i).first()).toBeVisible();
    await expect(dialog.getByText(/Matched Key Phrases/i)).toBeVisible();
    await expect(dialog.getByText('Sentence Completeness')).toBeVisible();

    // 6. Retry Without Penalty
    await dialog.getByRole('button', { name: /Retry Without Penalty/i }).click();
    await expect(dialog.getByText('Linguistic Analysis & Feedback')).not.toBeVisible();

    // 7. Re-enter and proceed to Next Prompt
    await input.fill('Could I please have an oat milk latte to go?');
    await dialog.getByRole('button', { name: 'Evaluate' }).click();
    await dialog.getByRole('button', { name: /Continue to Next Prompt/i }).click();

    // 8. Should advance to next prompt (Describing Your Morning Routine)
    await expect(dialog.getByText(/Morning Routine/i)).toBeVisible();

    // 9. Finish studio
    await dialog.getByRole('button', { name: 'End Session Early' }).click();
    await expect(dialog.getByText('Speaking Studio Complete!')).toBeVisible();
    await dialog.getByRole('button', { name: 'Done' }).click();
    await expect(dialog).not.toBeVisible();
  });

  test('Daily Practice: launches Listening Practice and records completion badge on Home', async ({ page }) => {
    // 1. From Home screen, locate Daily Practice row
    const listeningCard = page.getByRole('button', { name: /Listening Practice/i });
    await expect(listeningCard).toBeVisible();

    // 2. Launch Listening Studio
    await listeningCard.click();
    const dialog = page.getByRole('dialog', { name: /Ear Training & Comprehension/i });
    await expect(dialog).toBeVisible();

    // 3. Complete an answer and finish
    await dialog.getByRole('button', { name: '15 minutes', exact: true }).click();
    await dialog.getByRole('button', { name: 'Check Answer' }).click();
    await dialog.getByRole('button', { name: 'End Session Early' }).click();
    await dialog.getByRole('button', { name: 'Done' }).click();

    // 4. Verify Listening card on Home updates to "Done"
    await expect(page.getByRole('button', { name: /Listening Practice: ✓ Done/i })).toBeVisible();
  });

  test('Responsive Layout: Speaking and Listening dialogs render with zero horizontal overflow across 320px–1280px', async ({ page }) => {
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

      // Test Speaking Dialog responsive fit
      await page.getByRole('button', { name: 'Speaking', exact: true }).click();
      const speakDialog = page.getByRole('dialog', { name: /Spoken Fluency & Rhythm Coach/i });
      await expect(speakDialog).toBeVisible();

      // Check zero horizontal overflow
      const speakOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(speakOverflow).toBe(false);

      await speakDialog.getByRole('button', { name: 'Close speaking studio' }).click();
      await expect(speakDialog).not.toBeVisible();

      // Test Listening Dialog responsive fit
      await page.getByRole('button', { name: 'Listening', exact: true }).click();
      const listenDialog = page.getByRole('dialog', { name: /Ear Training & Comprehension/i });
      await expect(listenDialog).toBeVisible();

      const listenOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      expect(listenOverflow).toBe(false);

      await listenDialog.getByRole('button', { name: 'Close listening studio' }).click();
      await expect(listenDialog).not.toBeVisible();
    }
  });
});
