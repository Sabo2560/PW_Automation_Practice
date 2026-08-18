// spec: specs/button.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { ButtonPage } from '../../pages/ButtonPage';

test.describe('Button - Informational Property Buttons (Find Location / Find Color / Find Height & Width)', () => {
  test("'Find Location' button reports a position fully within the visible viewport, and clicking it produces no visible page change", async ({
    page,
  }) => {
    const buttonPage = new ButtonPage(page);

    // 1. Navigate to '/components/button' and read '[data-testid="button-find-location"]''s bounding box via boundingBox(), along with the current viewport size
    await buttonPage.gotoButton();

    const box = await buttonPage.findLocationBtn.boundingBox();
    const viewportSize = page.viewportSize();

    expect(box).not.toBeNull();
    expect(viewportSize).not.toBeNull();

    // expect: The button's x coordinate is >= 0 and y coordinate is >= 0
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    // expect: The sum of the button's x coordinate and its width is <= the viewport's width, i.e. the button lies entirely within the visible viewport horizontally
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewportSize!.width);

    // 2. Capture an accessibility-tree/DOM snapshot of the page, click '[data-testid="button-find-location"]', then capture the snapshot again
    // expect: The two snapshots are identical apart from the clicked button's own transient focus/active state — no new text, element, or visible feedback appears anywhere on the page as a result of the click
    // (compared via visible text content only — raw DOM element counts on this live site are not stable across
    // navigations due to third-party/analytics scripts that inject nodes independent of the click)
    const { before, after } = await buttonPage.captureTextAround(() => buttonPage.findLocationBtn.click());
    expect(after).toBe(before);
  });

  test("'Find Color' (What is my color?) button exposes its background color via CSS class and computed style, and clicking it produces no visible page change", async ({
    page,
  }) => {
    const buttonPage = new ButtonPage(page);

    // 1. Navigate to '/components/button' and inspect '[data-testid="button-find-color"]''s class attribute and computed style
    await buttonPage.gotoButton();

    // expect: The button's class attribute includes the substring 'bg-pink-400'
    await expect(buttonPage.findColorBtn).toHaveClass(/bg-pink-400/);

    // expect: The button's computed 'backgroundColor' style equals exactly 'rgb(244, 114, 182)'
    const backgroundColor = await buttonPage.findColorBtn.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(backgroundColor).toBe('rgb(244, 114, 182)');

    // 2. Click '[data-testid="button-find-color"]'
    // expect: No new text, element, or visible feedback appears anywhere on the page as a result of the click
    const { before, after } = await buttonPage.captureTextAround(() => buttonPage.findColorBtn.click());
    expect(after).toBe(before);
  });

  test("'Find Height & Width' (What are my height and width?) button reports positive dimensions, and clicking it produces no visible page change", async ({
    page,
  }) => {
    const buttonPage = new ButtonPage(page);

    // 1. Navigate to '/components/button' and read '[data-testid="button-find-height-width"]''s bounding box via boundingBox()
    await buttonPage.gotoButton();

    const box = await buttonPage.findHeightWidthBtn.boundingBox();

    expect(box).not.toBeNull();

    // expect: The button's reported width is greater than 0
    expect(box!.width).toBeGreaterThan(0);
    // expect: The button's reported height is greater than 0
    expect(box!.height).toBeGreaterThan(0);

    // 2. Click '[data-testid="button-find-height-width"]'
    // expect: No new text, element, or visible feedback appears anywhere on the page as a result of the click
    const { before, after } = await buttonPage.captureTextAround(() => buttonPage.findHeightWidthBtn.click());
    expect(after).toBe(before);
  });
});
