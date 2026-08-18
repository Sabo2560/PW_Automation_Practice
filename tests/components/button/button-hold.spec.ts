// spec: specs/button.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { ButtonPage } from '../../pages/ButtonPage';

test.describe('Button - Click and Hold Timer', () => {
  test('An instantaneous click (no meaningful hold duration) reports 0 ms and does not leave the button stuck in a Holding state', async ({
    page,
  }) => {
    const buttonPage = new ButtonPage(page);

    // 1. Navigate to '/components/button' and perform a standard, instantaneous Playwright '.click()' on '[data-testid="hold-button"]'
    await buttonPage.gotoButton();
    await buttonPage.holdBtn.click();

    // expect: A paragraph of the form 'You held the button for N ms' becomes visible below the button
    await expect(buttonPage.holdResultText).toBeVisible();

    // expect: The captured numeric N value equals 0
    const heldMs = await buttonPage.getHoldResultMs();
    expect(heldMs).toBe(0);

    // expect: The button's own text is exactly 'Click and Hold' (not stuck showing 'Holding...')
    await expect(buttonPage.holdBtn).toHaveText('Click and Hold');
  });

  test("Holding the mouse down updates the button's own text with an increasing elapsed-time counter, and releasing over the button reports the held duration", async ({
    page,
  }) => {
    const buttonPage = new ButtonPage(page);

    // 1. Navigate to '/components/button', hover over '[data-testid="hold-button"]', press the mouse button down, and wait ~150ms
    await buttonPage.gotoButton();
    await buttonPage.holdBtn.hover();

    const start = Date.now();
    await page.mouse.down();
    await page.waitForTimeout(150);

    // expect: The button's text is now of the form 'Holding... (N ms)' (no longer 'Click and Hold')
    const holdingText = await buttonPage.holdBtn.innerText();
    expect(holdingText).toMatch(/Holding\.\.\. \(\d+ ms\)/);

    // expect: The numeric N value currently shown is greater than 0
    expect(buttonPage.parseMs(holdingText)).toBeGreaterThan(0);

    // 2. Continue holding for a further measured interval, then release the mouse button while the pointer is still positioned over the button
    await page.waitForTimeout(500);
    await page.mouse.up();
    const actualDurationMs = Date.now() - start;

    // expect: The button's text reverts to exactly 'Click and Hold'
    await expect(buttonPage.holdBtn).toHaveText('Click and Hold');

    // expect: A paragraph of the form 'You held the button for N ms' becomes visible
    await expect(buttonPage.holdResultText).toBeVisible();

    // expect: The reported N value is within a reasonable tolerance of the actual wall-clock duration measured
    const reportedMs = await buttonPage.getHoldResultMs();
    expect(Math.abs(reportedMs - actualDurationMs)).toBeLessThanOrEqual(400);
  });

  test('[Edge case] Moving the mouse off the button while still held ends the hold immediately via mouseleave, independent of when the physical mouseup eventually occurs', async ({
    page,
  }) => {
    const buttonPage = new ButtonPage(page);

    // 1. Navigate to '/components/button', hover over and press down on '[data-testid="hold-button"]', wait ~150ms,
    // then move the mouse away WITHOUT releasing the mouse button, and wait a further ~150ms
    await buttonPage.gotoButton();
    await buttonPage.holdBtn.hover();
    await page.mouse.down();
    await page.waitForTimeout(150);

    await page.mouse.move(10, 10);
    await page.waitForTimeout(150);

    // expect: Before any mouseup occurs, the button's text has already reverted to exactly 'Click and Hold'
    await expect(buttonPage.holdBtn).toHaveText('Click and Hold');

    // expect: A result paragraph has already appeared, with N less than the full ~300ms the test waited in this step
    await expect(buttonPage.holdResultText).toBeVisible();
    const msAfterLeave = await buttonPage.getHoldResultMs();
    expect(msAfterLeave).toBeLessThan(300);

    // 2. Release the mouse button at the current off-button location
    await page.mouse.up();
    await page.waitForTimeout(100);

    // expect: The result paragraph's text does not change again after this mouseup
    const msAfterUp = await buttonPage.getHoldResultMs();
    expect(msAfterUp).toBe(msAfterLeave);
  });

  test('Repeated hold interactions replace the single result paragraph rather than appending duplicates', async ({ page }) => {
    const buttonPage = new ButtonPage(page);

    // 1. Navigate to '/components/button' and double-click '[data-testid="hold-button"]'
    await buttonPage.gotoButton();
    await buttonPage.holdBtn.dblclick();

    // expect: Exactly one element on the page matches text of the form 'You held the button for N ms'
    await expect(buttonPage.holdResultText).toHaveCount(1);
  });

  test('[GAP - accessibility] Keyboard-only activation (focus + hold Enter) does not trigger the hold-tracking behavior at all', async ({
    page,
  }) => {
    const buttonPage = new ButtonPage(page);

    // 1. Navigate to '/components/button', focus '[data-testid="hold-button"]', then press and hold the Enter key for at least 300ms
    await buttonPage.gotoButton();
    await buttonPage.holdBtn.focus();

    await page.keyboard.down('Enter');
    await page.waitForTimeout(300);

    // expect: The button's text remains exactly 'Click and Hold' throughout the entire held-Enter period
    await expect(buttonPage.holdBtn).toHaveText('Click and Hold');

    await page.keyboard.up('Enter');

    // expect: No paragraph of the form 'You held the button for N ms' appears anywhere on the page after releasing the Enter key
    await expect(buttonPage.holdResultText).toHaveCount(0);
  });
});
