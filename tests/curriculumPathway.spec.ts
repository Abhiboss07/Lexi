import { test, expect } from '@playwright/test';

test.describe('CEFR Curriculum Progression, Syllabus Browser & Global Search', () => {
  test.beforeEach(async ({ page }) => {
    // Suppress splash screen for deterministic test runs
    await page.addInitScript(() => {
      sessionStorage.setItem('lexi_splash_shown', 'true');
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Home Continue Learning card displays real curriculum progress without sample placeholders', async ({ page }) => {
    const continueSection = page.locator('section[aria-labelledby="continue-learning-heading"]');
    await expect(continueSection).toBeVisible();

    // Verify absence of "Sample Preview" placeholder
    await expect(continueSection.getByText('Sample Preview')).not.toBeVisible();

    // Verify presence of "In Progress" or "Completed" badge
    await expect(continueSection.getByText(/In Progress|Completed/i)).toBeVisible();

    // Verify Syllabus link is present and clickable
    const syllabusBtn = continueSection.getByRole('button', { name: /Syllabus/i });
    await expect(syllabusBtn).toBeVisible();
    await syllabusBtn.click();

    // Verify Curriculum Roadmap modal opens
    const syllabusModal = page.getByRole('dialog', { name: /CEFR Curriculum Roadmap/i });
    await expect(syllabusModal).toBeVisible();
    await expect(syllabusModal.getByText(/Structured English progression/i)).toBeVisible();
  });

  test('Clicking Continue on Home card launches the interactive LessonPlayer', async ({ page }) => {
    const continueSection = page.locator('section[aria-labelledby="continue-learning-heading"]');
    await expect(continueSection.getByText('Sample Preview')).not.toBeVisible();

    const continueBtn = continueSection.getByRole('button', { name: 'Continue' });
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();

    // Verify lesson dialog opens
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/Everyday Conversations/i)).toBeVisible();

    // Click Start Interactive Lesson to open Lesson Player
    const startLessonBtn = dialog.getByRole('button', { name: /Start Interactive Lesson/i });
    await expect(startLessonBtn).toBeVisible();
    await startLessonBtn.click();

    // Verify Lesson Player launches
    const lessonDialog = page.getByRole('dialog', { name: /Everyday Conversations/i });
    await expect(lessonDialog).toBeVisible();
  });

  test('Explore Continue Journey card displays real progress and "See All" opens Syllabus Browser', async ({ page }) => {
    // Navigate to Explore tab via bottom nav button
    const nav = page.getByRole('navigation', { name: 'Main Navigation' });
    await nav.getByRole('button', { name: 'Explore' }).click();

    const journeySection = page.locator('section[aria-labelledby="journey-heading"]');
    await expect(journeySection).toBeVisible();

    // Click "See All"
    const seeAllBtn = journeySection.getByRole('button', { name: /See All/i });
    await expect(seeAllBtn).toBeVisible();
    await seeAllBtn.click();

    // Verify Curriculum Roadmap modal opens
    const syllabusModal = page.getByRole('dialog', { name: /CEFR Curriculum Roadmap/i });
    await expect(syllabusModal).toBeVisible();
  });

  test('Curriculum Browser allows level switching and displays units and lesson items', async ({ page }) => {
    // Navigate to Explore and open syllabus modal
    const nav = page.getByRole('navigation', { name: 'Main Navigation' });
    await nav.getByRole('button', { name: 'Explore' }).click();
    await page.locator('section[aria-labelledby="journey-heading"]').getByRole('button', { name: /See All/i }).click();

    const modal = page.getByRole('dialog', { name: /CEFR Curriculum Roadmap/i });
    await expect(modal).toBeVisible();

    // Switch to A2 level
    const a2Tab = modal.getByRole('tab', { name: 'A2' });
    await a2Tab.click();
    await expect(modal.getByText(/Travel & Directions/i)).toBeVisible();

    // Switch back to A1 level
    const a1Tab = modal.getByRole('tab', { name: 'A1' });
    await a1Tab.click();
    await expect(modal.getByText(/Greetings & Introductions/i)).toBeVisible();

    // Close modal
    await modal.getByRole('button', { name: /Close curriculum roadmap/i }).click();
    await expect(modal).not.toBeVisible();
  });

  test('Search modal performs real queries across curriculum lessons and practice studios', async ({ page }) => {
    // Click header search button
    const searchBtn = page.getByRole('banner').getByRole('button', { name: /Search lessons and vocabulary/i });
    await searchBtn.click();

    const searchDialog = page.getByRole('dialog', { name: /Search curriculum lessons and studios/i });
    await expect(searchDialog).toBeVisible();

    const searchInput = searchDialog.getByPlaceholder(/Search grammar/i);

    // Query for conversation studio
    await searchInput.fill('conversation');
    await expect(searchDialog.getByText('AI Conversation Coach')).toBeVisible();

    // Query for greetings lesson
    await searchInput.fill('greetings');
    await expect(searchDialog.getByText('Saying Hello & Goodbye')).toBeVisible();

    // Clicking a lesson launches the lesson player
    const lessonItem = searchDialog.getByRole('button', { name: /Saying Hello & Goodbye/i });
    await lessonItem.click();

    // Verify Lesson Player launches
    const lessonDialog = page.getByRole('dialog', { name: /Saying Hello & Goodbye/i });
    await expect(lessonDialog).toBeVisible();
    await expect(lessonDialog.getByRole('heading', { name: 'Saying Hello & Goodbye' })).toBeVisible();
  });
});
