import { test, expect } from '@playwright/test';

test.describe('Button component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/button');
  });

  test('should navigate home via Go Home button', async ({ page }) => {
    await page.getByTestId('button-go-home').click();
    await expect(page).toHaveURL('/');
  });

  test('should read the actual X & Y coordinates of the location button', async ({ page }) => {
    const findLocationBtn = page.getByTestId('button-find-location');
    const box = await findLocationBtn.boundingBox();
    const viewport = page.viewportSize();

    // Coordinates being >= 0 is trivially true for almost any element, so
    // instead we confirm the button actually sits inside the visible
    // viewport — that's a real check on its computed position.
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    if (box && viewport) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    }
  });

  test('should read the actual background color of the color button', async ({ page }) => {
    const findColorBtn = page.getByTestId('button-find-color');
    await expect(findColorBtn).toHaveClass(/bg-pink-400/);
    const actualColor = await findColorBtn.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(actualColor).toMatch(/^rgb/);
  });

  test('should read the actual height & width of the size button', async ({ page }) => {
    const findSizeBtn = page.getByTestId('button-find-height-width');
    const box = await findSizeBtn.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);
  });

  test('should confirm disabled button cannot be clicked', async ({ page }) => {
    const disabledBtn = page.getByTestId('button-disabled-button');
    await expect(disabledBtn).toBeDisabled();
  });

  test('should track hold duration on click and hold', async ({ page }) => {
    const holdBtn = page.getByTestId('hold-button');
    await holdBtn.hover();
    await page.mouse.down();
    await expect(holdBtn).toHaveText(/Holding\.\.\. \(\d+ ms\)/);
    await page.waitForTimeout(500);
    await page.mouse.up();
    await expect(page.getByText(/You held the button for \d+ ms/)).toBeVisible();
  });
});