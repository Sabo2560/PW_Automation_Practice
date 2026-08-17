// spec: specs/button.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Button - Click and Hold Timer', () => {
  test('An instantaneous click (no meaningful hold duration) reports 0 ms and does not leave the button stuck in a Holding state', async ({
    page,
  }) => {
    // 1. Navigate to '/components/button' and perform a standard, instantaneous Playwright '.click()' on '[data-testid="hold-button"]'
    await page.goto('/components/button');

    const holdButton = page.locator('[data-testid="hold-button"]');
    await holdButton.click();

    // expect: A paragraph of the form 'You held the button for N ms' becomes visible below the button
    const resultText = page.getByText(/You held the button for \d+ ms/);
    await expect(resultText).toBeVisible();

    // expect: The captured numeric N value equals 0
    const text = await resultText.innerText();
    const heldMs = Number(text.match(/(\d+) ms/)![1]);
    expect(heldMs).toBe(0);

    // expect: The button's own text is exactly 'Click and Hold' (not stuck showing 'Holding...')
    await expect(holdButton).toHaveText('Click and Hold');
  });

  test("Holding the mouse down updates the button's own text with an increasing elapsed-time counter, and releasing over the button reports the held duration", async ({
    page,
  }) => {
    // 1. Navigate to '/components/button', hover over '[data-testid="hold-button"]', press the mouse button down, and wait ~150ms
    await page.goto('/components/button');

    const holdButton = page.locator('[data-testid="hold-button"]');
    await holdButton.hover();

    const start = Date.now();
    await page.mouse.down();
    await page.waitForTimeout(150);

    // expect: The button's text is now of the form 'Holding... (N ms)' (no longer 'Click and Hold')
    const holdingText = await holdButton.innerText();
    expect(holdingText).toMatch(/Holding\.\.\. \(\d+ ms\)/);

    // expect: The numeric N value currently shown is greater than 0
    const holdingMs = Number(holdingText.match(/(\d+) ms/)![1]);
    expect(holdingMs).toBeGreaterThan(0);

    // 2. Continue holding for a further measured interval, then release the mouse button while the pointer is still positioned over the button
    await page.waitForTimeout(500);
    await page.mouse.up();
    const actualDurationMs = Date.now() - start;

    // expect: The button's text reverts to exactly 'Click and Hold'
    await expect(holdButton).toHaveText('Click and Hold');

    // expect: A paragraph of the form 'You held the button for N ms' becomes visible
    const resultText = page.getByText(/You held the button for \d+ ms/);
    await expect(resultText).toBeVisible();

    // expect: The reported N value is within a reasonable tolerance of the actual wall-clock duration measured
    const text = await resultText.innerText();
    const reportedMs = Number(text.match(/(\d+) ms/)![1]);
    expect(Math.abs(reportedMs - actualDurationMs)).toBeLessThanOrEqual(250);
  });

  test('[Edge case] Moving the mouse off the button while still held ends the hold immediately via mouseleave, independent of when the physical mouseup eventually occurs', async ({
    page,
  }) => {
    // 1. Navigate to '/components/button', hover over and press down on '[data-testid="hold-button"]', wait ~150ms,
    // then move the mouse away WITHOUT releasing the mouse button, and wait a further ~150ms
    await page.goto('/components/button');

    const holdButton = page.locator('[data-testid="hold-button"]');
    await holdButton.hover();
    await page.mouse.down();
    await page.waitForTimeout(150);

    await page.mouse.move(10, 10);
    await page.waitForTimeout(150);

    // expect: Before any mouseup occurs, the button's text has already reverted to exactly 'Click and Hold'
    await expect(holdButton).toHaveText('Click and Hold');

    // expect: A result paragraph has already appeared, with N less than the full ~300ms the test waited in this step
    const resultText = page.getByText(/You held the button for \d+ ms/);
    await expect(resultText).toBeVisible();
    const textAfterLeave = await resultText.innerText();
    const msAfterLeave = Number(textAfterLeave.match(/(\d+) ms/)![1]);
    expect(msAfterLeave).toBeLessThan(300);

    // 2. Release the mouse button at the current off-button location
    await page.mouse.up();
    await page.waitForTimeout(100);

    // expect: The result paragraph's text does not change again after this mouseup
    const textAfterUp = await resultText.innerText();
    expect(textAfterUp).toBe(textAfterLeave);
  });

  test('Repeated hold interactions replace the single result paragraph rather than appending duplicates', async ({ page }) => {
    // 1. Navigate to '/components/button' and double-click '[data-testid="hold-button"]'
    await page.goto('/components/button');

    const holdButton = page.locator('[data-testid="hold-button"]');
    await holdButton.dblclick();

    // expect: Exactly one element on the page matches text of the form 'You held the button for N ms'
    await expect(page.getByText(/You held the button for \d+ ms/)).toHaveCount(1);
  });

  test('[GAP - accessibility] Keyboard-only activation (focus + hold Enter) does not trigger the hold-tracking behavior at all', async ({
    page,
  }) => {
    // 1. Navigate to '/components/button', focus '[data-testid="hold-button"]', then press and hold the Enter key for at least 300ms
    await page.goto('/components/button');

    const holdButton = page.locator('[data-testid="hold-button"]');
    await holdButton.focus();

    await page.keyboard.down('Enter');
    await page.waitForTimeout(300);

    // expect: The button's text remains exactly 'Click and Hold' throughout the entire held-Enter period
    await expect(holdButton).toHaveText('Click and Hold');

    await page.keyboard.up('Enter');

    // expect: No paragraph of the form 'You held the button for N ms' appears anywhere on the page after releasing the Enter key
    await expect(page.getByText(/You held the button for \d+ ms/)).toHaveCount(0);
  });
});
