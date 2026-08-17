// spec: specs/button.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Button - Informational Property Buttons (Find Location / Find Color / Find Height & Width)', () => {
  test("'Find Location' button reports a position fully within the visible viewport, and clicking it produces no visible page change", async ({
    page,
  }) => {
    // 1. Navigate to '/components/button' and read '[data-testid="button-find-location"]''s bounding box via boundingBox(), along with the current viewport size
    await page.goto('/components/button');

    const findLocationButton = page.locator('[data-testid="button-find-location"]');
    const box = await findLocationButton.boundingBox();
    const viewportSize = page.viewportSize();

    expect(box).not.toBeNull();
    expect(viewportSize).not.toBeNull();

    // expect: The button's x coordinate is >= 0 and y coordinate is >= 0
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    // expect: The sum of the button's x coordinate and its width is <= the viewport's width, i.e. the button lies entirely within the visible viewport horizontally
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewportSize!.width);

    // 2. Capture an accessibility-tree/DOM snapshot of the page, click '[data-testid="button-find-location"]', then capture the snapshot again
    const bodyText = page.locator('body');
    const textBefore = await bodyText.innerText();

    await findLocationButton.click();

    const textAfter = await bodyText.innerText();

    // expect: The two snapshots are identical apart from the clicked button's own transient focus/active state — no new text, element, or visible feedback appears anywhere on the page as a result of the click
    // (compared via visible text content only — raw DOM element counts on this live site are not stable across
    // navigations due to third-party/analytics scripts that inject nodes independent of the click)
    expect(textAfter).toBe(textBefore);
  });

  test("'Find Color' (What is my color?) button exposes its background color via CSS class and computed style, and clicking it produces no visible page change", async ({
    page,
  }) => {
    // 1. Navigate to '/components/button' and inspect '[data-testid="button-find-color"]''s class attribute and computed style
    await page.goto('/components/button');

    const findColorButton = page.locator('[data-testid="button-find-color"]');

    // expect: The button's class attribute includes the substring 'bg-pink-400'
    await expect(findColorButton).toHaveClass(/bg-pink-400/);

    // expect: The button's computed 'backgroundColor' style equals exactly 'rgb(244, 114, 182)'
    const backgroundColor = await findColorButton.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(backgroundColor).toBe('rgb(244, 114, 182)');

    // 2. Click '[data-testid="button-find-color"]'
    const bodyText = page.locator('body');
    const textBefore = await bodyText.innerText();

    await findColorButton.click();

    const textAfter = await bodyText.innerText();

    // expect: No new text, element, or visible feedback appears anywhere on the page as a result of the click
    expect(textAfter).toBe(textBefore);
  });

  test("'Find Height & Width' (What are my height and width?) button reports positive dimensions, and clicking it produces no visible page change", async ({
    page,
  }) => {
    // 1. Navigate to '/components/button' and read '[data-testid="button-find-height-width"]''s bounding box via boundingBox()
    await page.goto('/components/button');

    const findHeightWidthButton = page.locator('[data-testid="button-find-height-width"]');
    const box = await findHeightWidthButton.boundingBox();

    expect(box).not.toBeNull();

    // expect: The button's reported width is greater than 0
    expect(box!.width).toBeGreaterThan(0);
    // expect: The button's reported height is greater than 0
    expect(box!.height).toBeGreaterThan(0);

    // 2. Click '[data-testid="button-find-height-width"]'
    const bodyText = page.locator('body');
    const textBefore = await bodyText.innerText();

    await findHeightWidthButton.click();

    const textAfter = await bodyText.innerText();

    // expect: No new text, element, or visible feedback appears anywhere on the page as a result of the click
    expect(textAfter).toBe(textBefore);
  });
});
