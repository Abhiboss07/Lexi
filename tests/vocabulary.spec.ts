import { test, expect } from '@playwright/test';

test.describe('Lexi Practice Hub & Spaced-Repetition System (Phase A)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      const lexiDb = (window as any).__lexiDb;
      if (lexiDb && lexiDb.tables) {
        await Promise.all(lexiDb.tables.map((t: any) => t.clear()));
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
    await expect(page.getByRole('heading', { name: 'morning' })).toBeVisible();
  };

  test('navigates to Practice tab, renders Practice hero with 3D art, without redundant categories or banner', async ({ page }) => {
    // 1. Click on Practice in BottomNav
    await goToPractice(page);

    // 2. Practice screen header
    await expect(page.getByRole('heading', { name: 'Practice', level: 1 })).toBeVisible();
    await expect(page.getByText(/AI English Coach • Focused Studios/i)).toBeVisible();

    // 3. Premium Practice Hero Card & Transparent 3D Illustration
    await expect(page.getByText('YOUR PRACTICE STUDIO')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Practice Every Day Grow Stronger/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Review Due Words/i })).toBeVisible();
    const heroImage = page.locator('img[alt*="3D digital illustration of a student wearing headphones"]');
    await expect(heroImage).toBeVisible();

    // 4. Verify "Explore Practice Studios" 5 large cards and separate dark review banner are REMOVED
    await expect(page.getByRole('heading', { name: 'Explore Practice Studios' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: /words are ready for review/i })).not.toBeVisible();

    // 5. Dedicated Studios Quick Access
    await expect(page.getByRole('button', { name: 'Grammar', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Conversation', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Stories', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Listening', exact: true })).toBeVisible();

    // 6. Integrated Vocabulary Deck & Stats strip
    await expect(page.getByRole('heading', { name: 'Vocabulary Notebook', level: 2 })).toBeVisible();
    await expect(page.getByText('Total', { exact: true })).toBeVisible();
    await expect(page.getByText('Due', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Learning', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Review', { exact: true }).first()).toBeVisible();

    // 7. Seeded Cards
    await expect(page.getByRole('heading', { name: 'morning' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'evening' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'confident' })).toBeVisible();
  });

  test('connects Home shortcuts to dedicated, functional practice studios', async ({ page }) => {
    // 1. Home Shortcut: Conversation -> Conversation Studio
    await page.getByRole('button', { name: /^Conversation:/i }).click();
    const convDialog = page.getByRole('dialog', { name: /Interactive Dialogue Practice/i });
    await expect(convDialog).toBeVisible();
    await expect(convDialog.getByText('Ordering at a Cozy Café')).toBeVisible();
    // Test interactive prompt click
    await convDialog.getByRole('button', { name: /I'd like an iced latte/i }).click();
    await expect(convDialog.getByText("I'd like an iced latte with oat milk, please.", { exact: true })).toBeVisible();
    await convDialog.getByRole('button', { name: 'Close conversation studio' }).click();
    await expect(convDialog).not.toBeVisible();

    // 2. Home Shortcut: Stories -> Story Studio
    await page.getByRole('button', { name: /^Stories:/i }).click();
    const storyDialog = page.getByRole('dialog', { name: /Interactive Graded Stories/i });
    await expect(storyDialog).toBeVisible();
    await expect(storyDialog.getByText('The Secret of the Old Clocktower').first()).toBeVisible();
    await expect(storyDialog.getByText('Comprehension Check')).toBeVisible();
    await storyDialog.getByRole('button', { name: 'Close stories studio' }).click();
    await expect(storyDialog).not.toBeVisible();

    // 3. Home Shortcut: Listening -> Listening Studio
    await page.getByRole('button', { name: /^Listening:/i }).click();
    const listenDialog = page.getByRole('dialog', { name: /Ear Training & Comprehension/i });
    await expect(listenDialog).toBeVisible();
    await expect(listenDialog.getByText('Train Platform Announcement').first()).toBeVisible();
    await expect(listenDialog.getByRole('button', { name: 'Play audio' })).toBeVisible();
    await listenDialog.getByRole('button', { name: 'Close listening studio' }).click();
    await expect(listenDialog).not.toBeVisible();

    // 4. Grammar Shortcut -> Grammar Studio
    await page.getByRole('button', { name: /^Grammar:/i }).click();
    const grammarDialog = page.getByRole('dialog', { name: /Key Rules & Diagnostic Practice/i });
    await expect(grammarDialog).toBeVisible();
    await expect(grammarDialog.getByText('Core Grammar Rule')).toBeVisible();
    await expect(grammarDialog.getByRole('button', { name: 'is carrying' })).toBeVisible();
    await grammarDialog.getByRole('button', { name: 'Close grammar studio' }).click();
    await expect(grammarDialog).not.toBeVisible();

    // 5. Vocabulary Shortcut -> Practice Tab
    await page.getByRole('button', { name: /^Vocabulary:/i }).click();
    await expect(page.getByRole('heading', { name: 'Practice', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Vocabulary Notebook', level: 2 })).toBeVisible();
  });

  test('filters cards by CEFR level and state pills', async ({ page }) => {
    await goToPractice(page);

    // Wait for initial seeded cards to be rendered
    await expect(page.getByRole('heading', { name: 'morning' })).toBeVisible();

    // Filter by A2
    await page.getByRole('button', { name: /^A2/ }).click();
    await expect(page.getByRole('heading', { name: 'confident' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'morning' })).not.toBeVisible();

    // Filter by A1
    await page.getByRole('button', { name: /^A1/ }).click();
    await expect(page.getByRole('heading', { name: 'morning' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'confident' })).not.toBeVisible();

    // Filter by All
    await page.getByRole('button', { name: /^All/ }).click();
    await expect(page.getByRole('heading', { name: 'morning' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'confident' })).toBeVisible();
  });

  test('searches vocabulary items with live filter and empty search state', async ({ page }) => {
    await goToPractice(page);

    // Wait for initial seeded cards to be rendered
    await expect(page.getByRole('heading', { name: 'morning' })).toBeVisible();

    const searchInput = page.getByPlaceholder(/Search words, meanings/i);
    await expect(searchInput).toBeVisible();

    // Type query matching 'confident'
    await searchInput.fill('confident');
    await expect(page.getByRole('heading', { name: 'confident' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'morning' })).not.toBeVisible();

    // Type query matching nothing
    await searchInput.fill('xyznonexistentterm');
    await expect(page.getByRole('heading', { name: 'No matching vocabulary' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset Search & Filters' })).toBeVisible();

    // Reset search
    await page.getByRole('button', { name: 'Reset Search & Filters' }).click();
    await expect(page.getByRole('heading', { name: 'morning' })).toBeVisible();
  });

  test('launches ReviewPlayer, flips flashcard, rates cards, and completes review session', async ({ page }) => {
    await goToPractice(page);

    // Launch review from hero CTA
    const startReviewBtn = page.getByRole('button', { name: /Review Due Words/i });
    await startReviewBtn.click();

    // ReviewPlayer modal visible
    const reviewDialog = page.getByRole('dialog', { name: 'Vocabulary Review' });
    await expect(reviewDialog).toBeVisible();
    await expect(reviewDialog.getByText('1 / 3')).toBeVisible();

    // Card front should show prompt to flip
    await expect(reviewDialog.getByText('Tap to Reveal Definition')).toBeVisible();

    // Click 'Reveal Meaning'
    const flipBtn = reviewDialog.getByRole('button', { name: 'Reveal Meaning' });
    await expect(flipBtn).toBeVisible();
    await flipBtn.click();

    // Now back of card is shown with FSRS rating buttons
    await expect(reviewDialog.getByText('Meaning')).toBeVisible();
    await expect(reviewDialog.getByRole('button', { name: /Again/i })).toBeVisible();
    await expect(reviewDialog.getByRole('button', { name: /Hard/i })).toBeVisible();
    await expect(reviewDialog.getByRole('button', { name: /Good/i })).toBeVisible();
    await expect(reviewDialog.getByRole('button', { name: /Easy/i })).toBeVisible();

    // Rate card 1 as 'Good'
    await reviewDialog.getByRole('button', { name: /Good/i }).click();

    // Card 2
    await expect(reviewDialog.getByText('2 / 3')).toBeVisible();

    // Flip card 2 by clicking Reveal Meaning
    await reviewDialog.getByRole('button', { name: 'Reveal Meaning' }).click();
    await expect(reviewDialog.getByText('Meaning')).toBeVisible();

    // Rate card 2 as 'Easy'
    await reviewDialog.getByRole('button', { name: /Easy/i }).click();

    // Card 3
    await expect(reviewDialog.getByText('3 / 3')).toBeVisible();
    await reviewDialog.getByRole('button', { name: 'Reveal Meaning' }).click();
    await reviewDialog.getByRole('button', { name: /Good/i }).click();

    // Celebratory completion view
    await expect(reviewDialog.getByRole('heading', { name: 'Review Completed!' })).toBeVisible();
    await expect(reviewDialog.getByText('Reviewed', { exact: true })).toBeVisible();
    await expect(reviewDialog.getByText('Updated', { exact: true })).toBeVisible();

    // Close review dialog
    const finishBtn = reviewDialog.getByRole('button', { name: 'Back to Notebook' });
    await expect(finishBtn).toBeVisible();
    await finishBtn.click();

    await expect(reviewDialog).not.toBeVisible();
  });

  test('handles review exit confirmation mid-session', async ({ page }) => {
    await goToPractice(page);

    await page.getByRole('button', { name: /Review Due Words/i }).click();
    const reviewDialog = page.getByRole('dialog', { name: 'Vocabulary Review' });
    await expect(reviewDialog).toBeVisible();

    // Click exit button
    await reviewDialog.getByRole('button', { name: 'Exit review' }).click();

    // Exit confirmation appears
    await expect(reviewDialog.getByText('Leave Review Session?')).toBeVisible();

    // Resume review
    await reviewDialog.getByRole('button', { name: 'Stay' }).click();
    await expect(reviewDialog.getByText('Leave Review Session?')).not.toBeVisible();

    // Reopen exit confirmation and choose Exit
    await reviewDialog.getByRole('button', { name: 'Exit review' }).click();
    await reviewDialog.getByRole('button', { name: 'Exit', exact: true }).click();

    await expect(reviewDialog).not.toBeVisible();
  });

  test('supports mobile (390px) and desktop (1280px) viewports with responsive aesthetics', async ({ page }) => {
    // Mobile Viewport (iPhone 14 / modern standard mobile)
    await page.setViewportSize({ width: 390, height: 844 });
    await goToPractice(page);

    await expect(page.getByRole('heading', { name: 'Practice', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Practice Every Day Grow Stronger/i })).toBeVisible();

    // Ensure scroll position is at top
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      const scrollable = document.querySelector('.overflow-y-auto');
      if (scrollable) scrollable.scrollTop = 0;
    });
    await page.waitForTimeout(300);

    await page.screenshot({ path: 'docs/testing/screenshots/practice_hub_390px.png' });

    // Desktop Viewport (1280px)
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      const scrollable = document.querySelector('.overflow-y-auto');
      if (scrollable) scrollable.scrollTop = 0;
    });
    await page.waitForTimeout(300);
    await expect(page.getByRole('heading', { name: 'Practice', level: 1 })).toBeVisible();
    await page.screenshot({ path: 'docs/testing/screenshots/practice_hub_1280px.png' });

    // Switch back to mobile to verify review flow and capture review modals
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByText('Total', { exact: true })).toBeVisible();

    // Launch review and capture mobile flashcard screenshot
    await page.getByRole('button', { name: /Review Due Words/i }).click();
    const reviewDialog = page.getByRole('dialog', { name: 'Vocabulary Review' });
    await expect(reviewDialog).toBeVisible();
    await page.screenshot({ path: 'docs/testing/screenshots/practice_review_front_390px.png' });

    // Flip card and capture rating state
    await reviewDialog.getByRole('button', { name: 'Reveal Meaning' }).click();
    await expect(reviewDialog.getByRole('button', { name: /Good/i })).toBeVisible();
    await page.screenshot({ path: 'docs/testing/screenshots/practice_review_back_390px.png' });

    await reviewDialog.getByRole('button', { name: 'Exit review' }).click();
    await reviewDialog.getByRole('button', { name: 'Exit', exact: true }).click();
  });

  test('auto-onboards vocabulary into notebook when completing a lesson with >= 80% score', async ({ page }) => {
    // 1. Launch interactive lesson from hero
    await page.getByRole('button', { name: 'Start Learning English' }).click();
    await page.getByRole('button', { name: 'Start Interactive Lesson' }).click();

    const lessonDialog = page.getByRole('dialog', { name: /Saying Hello & Goodbye/i });
    await expect(lessonDialog).toBeVisible();

    // Activity 1: Multiple Choice
    await lessonDialog.getByRole('button', { name: 'Good morning!' }).click();
    await lessonDialog.getByRole('button', { name: 'Check Answer' }).click();
    await lessonDialog.getByRole('button', { name: 'Continue' }).click();

    // Activity 2: Dialogue Comprehension
    await lessonDialog.getByRole('button', { name: 'Afternoon' }).click();
    await lessonDialog.getByRole('button', { name: 'Check Answer' }).click();
    await lessonDialog.getByRole('button', { name: 'Continue' }).click();

    // Activity 3: Fill in the blank
    await lessonDialog.getByRole('button', { name: 'great' }).click();
    await lessonDialog.getByRole('button', { name: 'Check Answer' }).click();
    await lessonDialog.getByRole('button', { name: 'Continue' }).click();

    // Activity 4: Pronunciation
    await lessonDialog.getByRole('button', { name: /practiced/i }).click();
    await lessonDialog.getByRole('button', { name: 'Check Answer' }).click();
    await lessonDialog.getByRole('button', { name: 'Continue' }).click();

    // Lesson summary appears
    await expect(lessonDialog.getByRole('heading', { name: 'Lesson Completed!' })).toBeVisible();
    await lessonDialog.getByRole('button', { name: 'Continue' }).click();
    await expect(lessonDialog).not.toBeVisible();

    // 2. Navigate to Practice tab
    await goToPractice(page);

    // 3. Verify onboarded lesson vocabulary (e.g. "later") is now in notebook
    await expect(page.getByRole('heading', { name: 'later' })).toBeVisible();
  });
});
