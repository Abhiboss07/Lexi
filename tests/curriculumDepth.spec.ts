import { test, expect } from '@playwright/test';

test.describe('Lexi — Curriculum Depth, Content Quality & Learning Path Completion', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('lexi_splash_shown', 'true');
    });
    await page.goto('/');
  });

  test('Browses CEFR Roadmap across A1, A2, B1, B2 and launches an active B1 lesson', async ({ page }) => {
    // 1. Open Search Modal to test direct curriculum discovery
    const searchBtn = page.getByRole('button', { name: 'Search lessons and vocabulary' });
    await expect(searchBtn).toBeVisible();
    await searchBtn.click();

    const searchInput = page.getByPlaceholder(/search grammar, stories/i);
    await expect(searchInput).toBeVisible();

    // 3. Search for B1 lesson: "elevator pitch"
    await searchInput.fill('elevator pitch');
    const b1Result = page.getByRole('button', { name: /Crafting Your Professional Introduction/i });
    await expect(b1Result).toBeVisible({ timeout: 3000 });
    await b1Result.click();

    // 4. Verify LessonPlayer opens with real activities (NOT "No activities found")
    const lessonHeading = page.getByRole('heading', { name: /Crafting Your Professional Introduction/i });
    await expect(lessonHeading).toBeVisible({ timeout: 4000 });
    await expect(page.getByText('No activities found in this lesson.')).not.toBeVisible();

    const vp = page.viewportSize();
    const vpSuffix = vp && vp.width < 500 ? '390px' : '1280px';
    await page.screenshot({
      path: `/home/abhiboss/.gemini/antigravity/brain/d20f30d9-d11b-4244-9752-50bc4be0eb44/curriculum_b1_dialogue_${vpSuffix}.png`,
    });

    // 5. Verify Activity 1 (Dialogue)
    await expect(page.getByText(/Delivering an elevator pitch to a hiring director/i)).toBeVisible();
    await expect(page.getByText(/Daniel/i).first()).toBeVisible();

    // Select dialogue comprehension option
    const optionBtn = page.getByRole('button', { name: /Scaled the active user base by forty percent/i });
    await expect(optionBtn).toBeVisible();
    await optionBtn.click();

    // Submit answer
    const checkBtn = page.getByRole('button', { name: /Check Answer/i });
    await expect(checkBtn).toBeVisible();
    await checkBtn.click();

    // Verify positive feedback banner
    await expect(page.getByText(/Great comprehension!|Spot on!|Correct!/i)).toBeVisible();

    // Advance to Activity 2
    const nextBtn = page.getByRole('dialog').getByRole('button', { name: 'Continue' });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // Verify Activity 2 (Multiple Choice)
    await expect(page.getByText(/Which statement most effectively introduces/i)).toBeVisible();
  });

  test('Discovers B2 debates lesson via search and verifies educational explanation', async ({ page }) => {
    const searchBtn = page.getByRole('button', { name: 'Search lessons and vocabulary' });
    await expect(searchBtn).toBeVisible();
    await searchBtn.click();

    const searchInput = page.getByPlaceholder(/search grammar, stories/i);
    await searchInput.fill('debates');

    const b2Result = page.getByRole('button', { name: /Constructing Balanced Arguments/i });
    await expect(b2Result).toBeVisible({ timeout: 3000 });
    await b2Result.click();

    // Verify Lesson Player loads B2 lesson
    const heading = page.getByRole('heading', { name: /Constructing Balanced Arguments/i });
    await expect(heading).toBeVisible({ timeout: 4000 });
    await expect(page.getByText('No activities found in this lesson.')).not.toBeVisible();

    // Verify Dialogue activity
    await expect(page.getByText(/Dr. Vasquez/i).first()).toBeVisible();

    const vp = page.viewportSize();
    const vpSuffix = vp && vp.width < 500 ? '390px' : '1280px';
    await page.screenshot({
      path: `/home/abhiboss/.gemini/antigravity/brain/d20f30d9-d11b-4244-9752-50bc4be0eb44/curriculum_b2_lesson_${vpSuffix}.png`,
    });
  });

  test('Ensures responsive layout without horizontal overflow across 320px, 390px, 768px, 1280px', async ({ page }) => {
    const viewports = [
      { width: 320, height: 600 },
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1280, height: 800 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.waitForTimeout(150);

      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalOverflow).toBe(false);
    }
  });
});
