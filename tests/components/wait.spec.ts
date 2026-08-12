import { test, expect } from '@playwright/test';

test.describe('Wait component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/wait');
  });

  test('should wait for and accept a delayed alert', async ({ page }) => {
    // The alert doesn't pop up instantly — it fires after a random delay
    // (screenshots show anywhere from ~2.1s to ~3.1s), so we register the
    // dialog handler before clicking and just let Playwright wait for it
    // naturally rather than guessing a fixed delay ourselves.
    let dialogMessage = '';
    page.once('dialog', async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });
    await page.getByTestId('button-wait-for-alert').click();

    // Poll until the dialog handler above has actually fired and captured
    // the message — gives it room for the random delay instead of assuming
    // a fixed wait.
    await expect.poll(() => dialogMessage, { timeout: 10000 }).toMatch(/Alert after [\d.]+ seconds!/);
  });

  test('should wait for an element to appear after a delay', async ({ page }) => {
    await page.getByTestId('button-wait-for-element').click();

    // Default 5s assertion timeout isn't enough headroom for the random
    // delay this exercise is built around, so we extend it explicitly.
    await expect(page.getByText(/Element appeared after [\d.]+ seconds!/)).toBeVisible({ timeout: 10000 });
  });

  test('should wait for text content to change after a delay', async ({ page }) => {
    // Confirm the starting placeholder text first, so this test actually
    // proves a change happened rather than just checking the end state.
    await expect(page.getByText('Text to update: Initial text...')).toBeVisible();

    await page.getByTestId('button-wait-for-text').click();

    await expect(page.getByText(/Text to update: Text changed after [\d.]+ seconds!/)).toBeVisible({ timeout: 10000 });
  });

  test('should show an element after clicking, then make it disappear after a delay', async ({ page }) => {
    // Actual behavior confirmed on the page: the element isn't present by
    // default — clicking the button makes it appear, then it disappears
    // again roughly 2s later. Testing the full appear-then-vanish cycle.
    const disappearingElement = page.locator('#disappearing-element');
    await expect(disappearingElement).toBeHidden();

    await page.getByTestId('button-wait-for-disappearance').click();

    await expect(disappearingElement).toBeVisible({ timeout: 10000 });
    await expect(disappearingElement).toHaveText('I will disappear!');

    await expect(disappearingElement).toBeHidden({ timeout: 10000 });
  });
});