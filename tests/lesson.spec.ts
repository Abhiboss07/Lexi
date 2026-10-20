import { test, expect } from '@playwright/test';

test.describe('Lexi Interactive Lesson Engine (Phase 5)', () => {
  test('launches interactive lesson player from Home hero and completes all activities to summary', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('net::ERR_')) {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // 1. Open preview dialog from Hero CTA
    await page.getByRole('button', { name: 'Start Learning English' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // 2. Launch full interactive lesson player
    const startLessonBtn = page.getByRole('button', { name: 'Start Interactive Lesson' });
    await expect(startLessonBtn).toBeVisible();
    await startLessonBtn.click();

    // 3. Lesson Player header & progress checks
    const lessonDialog = page.getByRole('dialog', { name: /Saying Hello & Goodbye/i });
    await expect(lessonDialog).toBeVisible();
    await expect(lessonDialog.getByText('Saying Hello & Goodbye')).toBeVisible();
    await expect(lessonDialog.getByText('1 / 4')).toBeVisible();

    // Activity 1: Multiple Choice
    await expect(lessonDialog.getByText(/You enter a shop at 10:30 in the morning/i)).toBeVisible();
    await lessonDialog.getByRole('button', { name: 'Good morning!' }).click();
    await lessonDialog.getByRole('button', { name: 'Check Answer' }).click();

    // Verification of feedback & advance
    await expect(lessonDialog.getByText('Correct! Excellent conversational choice.')).toBeVisible();
    await lessonDialog.getByRole('button', { name: 'Continue' }).click();

    // Activity 2: Dialogue with Comprehension
    await expect(lessonDialog.getByText('2 / 4')).toBeVisible();
    await expect(lessonDialog.getByText('Elena').first()).toBeVisible();
    await expect(lessonDialog.getByText(/What time of day is this conversation taking place/i)).toBeVisible();
    await lessonDialog.getByRole('button', { name: 'Afternoon' }).click();
    await lessonDialog.getByRole('button', { name: 'Check Answer' }).click();
    await expect(lessonDialog.getByText('Great comprehension! You followed the conversation dialogue accurately.')).toBeVisible();
    await lessonDialog.getByRole('button', { name: 'Continue' }).click();

    // Activity 3: Fill in the blank
    await expect(lessonDialog.getByText('3 / 4')).toBeVisible();
    await expect(lessonDialog.getByText('Have a')).toBeVisible();
    await lessonDialog.getByRole('button', { name: 'great' }).click();
    await lessonDialog.getByRole('button', { name: 'Check Answer' }).click();
    await expect(lessonDialog.getByText('Spot on! The sentence is grammatically and contextually sound.')).toBeVisible();
    await lessonDialog.getByRole('button', { name: 'Continue' }).click();

    // Activity 4: Pronunciation Prompt
    await expect(lessonDialog.getByText('4 / 4')).toBeVisible();
    await expect(lessonDialog.getByText('/hæv ə ˈwʌndərfəl deɪ, siː juː təˈmɔːroʊ/')).toBeVisible();
    await lessonDialog.getByRole('button', { name: /practiced/i }).click();
    await lessonDialog.getByRole('button', { name: 'Check Answer' }).click();
    await expect(lessonDialog.getByText('Pronunciation practice completed!')).toBeVisible();

    // Complete lesson action
    await lessonDialog.getByRole('button', { name: 'Continue' }).click();

    // 4. Lesson Completion Summary
    await expect(lessonDialog.getByRole('heading', { name: 'Lesson Completed!' })).toBeVisible();
    await expect(lessonDialog.getByText('100%')).toBeVisible();
    await expect(lessonDialog.getByText('+1')).toBeVisible();

    // Vocabulary review cards in summary
    await expect(lessonDialog.getByText('morning')).toBeVisible();
    await expect(lessonDialog.getByText('evening')).toBeVisible();
    await expect(lessonDialog.getByText('later')).toBeVisible();

    // Close summary and return to app
    await lessonDialog.getByRole('button', { name: 'Continue' }).click();
    await expect(lessonDialog).not.toBeVisible();

    expect(consoleErrors).toEqual([]);
  });

  test('lesson exit confirmation allows resuming or leaving without crash', async ({ page }) => {
    await page.goto('/');

    // Launch lesson
    await page.getByRole('button', { name: 'Start Learning English' }).click();
    await page.getByRole('button', { name: 'Start Interactive Lesson' }).click();
    const lessonDialog = page.getByRole('dialog', { name: /Saying Hello & Goodbye/i });
    await expect(lessonDialog).toBeVisible();

    // Answer first question so exit confirmation triggers
    await lessonDialog.getByRole('button', { name: 'Good morning!' }).click();
    await lessonDialog.getByRole('button', { name: 'Check Answer' }).click();

    // Click close/exit button
    await lessonDialog.getByRole('button', { name: 'Exit lesson' }).click();
    await expect(lessonDialog.getByText('Leave Lesson?')).toBeVisible();

    // Resume lesson with Stay
    await lessonDialog.getByRole('button', { name: 'Stay' }).click();
    await expect(lessonDialog.getByText('Leave Lesson?')).not.toBeVisible();
    await expect(lessonDialog.getByText('Saying Hello & Goodbye')).toBeVisible();

    // Click exit again and confirm leave
    await lessonDialog.getByRole('button', { name: 'Exit lesson' }).click();
    await lessonDialog.getByRole('button', { name: 'Exit', exact: true }).click();
    await expect(lessonDialog).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Learn English Your Way', level: 1 })).toBeVisible();
  });

  test('launches interactive lesson from Explore screen adventure card', async ({ page }) => {
    await page.goto('/');

    // Navigate to Explore
    const nav = page.getByRole('navigation', { name: 'Main Navigation' });
    const exploreTab = nav.getByRole('button', { name: 'Explore' });
    await exploreTab.click();
    await expect(exploreTab).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { name: 'Explore', level: 1 })).toBeVisible();

    // Open Morning Bakery adventure card
    await page.getByRole('heading', { name: 'Morning Bakery' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Launch interactive lesson
    const startBtn = page.getByRole('button', { name: /Start interactive curriculum lesson|Start Interactive Lesson/i });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Verify LessonPlayer loaded with bakery lesson
    const lessonDialog = page.getByRole('dialog', { name: /Morning Bakery/i });
    await expect(lessonDialog).toBeVisible();
    await expect(lessonDialog.getByText('Morning Bakery')).toBeVisible();

    // Exit lesson cleanly
    await lessonDialog.getByRole('button', { name: 'Exit lesson' }).click();
    await expect(lessonDialog).not.toBeVisible();
  });
});
