// spec: specs/slider.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { SliderPage } from '../../pages/SliderPage';

test.describe('Slider - Click and Drag Interaction (Basic Slider)', () => {
  let sliderPage: SliderPage;

  test.beforeEach(async ({ page }) => {
    sliderPage = new SliderPage(page);
    await sliderPage.gotoSlider();
  });

  test("Clicking at the horizontal center of the track sets the value to 50 regardless of the slider's current value", async () => {
    // 1. Focus the basic slider and press 'End' to move it to 100 (away from center), then click
    //    the slider element using Playwright's default center-of-element click (no explicit
    //    position offset)
    await sliderPage.basicSlider.press('End');
    await expect(sliderPage.basicSlider).toHaveValue('100');
    await sliderPage.basicSlider.click();

    // expect: After the click, the input's value equals exactly '50' (the value corresponding to
    //         the exact horizontal midpoint of the 0-100 range) — confirming native
    //         input[type=range] click-to-position behavior
    await expect(sliderPage.basicSlider).toHaveValue('50');
    // expect: aria-valuenow and the 'Value:' text both read '50' as well, confirming a real
    //         trusted click correctly updates React's controlled state
    await expect(sliderPage.basicSlider).toHaveAttribute('aria-valuenow', '50');
    await expect(sliderPage.basicSliderValueText).toHaveText('Value: 50');
  });

  test('Dragging the slider to a specific screen position moves the value toward that position, staying in sync throughout', async () => {
    // 1. Perform a real Playwright drag (basic slider starts at 50) from the basic slider's
    //    current thumb position to a point at approximately 10% of the way along the track's own
    //    bounding box (computed via boundingBox(), not a fixed pixel offset), using page.mouse
    //    down/move/up so the drag is a genuine trusted pointer sequence
    await sliderPage.dragSliderToValue(sliderPage.basicSlider, 10, 0, 100);

    // expect: After the drag completes, the input's value is approximately 10 (within a small
    //         tolerance for pixel-rounding, e.g. 8-12) — a materially different, correctly-lower
    //         value than the starting 50, and not equal to 0 or 100 (ruling out a click-only
    //         jump-to-extreme fallback)
    const value = Number(await sliderPage.getValue(sliderPage.basicSlider));
    expect(value).toBeGreaterThanOrEqual(8);
    expect(value).toBeLessThanOrEqual(12);
    expect(value).not.toBe(0);
    expect(value).not.toBe(100);

    // expect: aria-valuenow and the 'Value:' text both equal the input's final 'value' exactly,
    //         confirming the drag's final drop position correctly updated React's state end-to-end
    await expect(sliderPage.basicSlider).toHaveAttribute('aria-valuenow', String(value));
    await expect(sliderPage.basicSliderValueText).toHaveText(`Value: ${value}`);
  });

  test('[QUIRK] Default center-targeted click()/dragTo(otherElement) interactions always land at value 50, regardless of the current thumb position or which element is passed as a drag target', async () => {
    // 1. On the min/max range slider pair (min=20, max=80 by default), perform a default (no
    //    position override) Playwright drag from the min slider to the max slider element (dragTo
    //    an entirely different, non-overlapping-in-value element)
    await sliderPage.minSlider.dragTo(sliderPage.maxSlider);

    // expect: The min slider's resulting value equals exactly '50' — NOT a value near 80 (the max
    //         slider's own current value) — confirming that because both are native
    //         input[type=range] elements always spanning the FULL track width regardless of their
    //         current thumb position, a default element-to-element dragTo() or a plain .click()
    //         always resolves to the horizontal CENTER of the target element's bounding box
    await expect(sliderPage.minSlider).toHaveValue('50');
  });

  test("[QUIRK, informational, testing-methodology guardrail] Programmatically setting the input's .value property via a raw DOM/page.evaluate call, bypassing React's synthetic event handling, desynchronizes aria-valuenow and the displayed text from the actual value", async () => {
    // 1. Move the basic slider away from its default via real keyboard interaction (End then
    //    ArrowLeft) so React's own last-known state is a distinctive, non-default value (99)
    await sliderPage.basicSlider.press('End');
    await sliderPage.basicSlider.press('ArrowLeft');
    await expect(sliderPage.basicSlider).toHaveValue('99');

    //    Then, via page.evaluate, directly set the basic slider's '.value' property to a new
    //    value and dispatch synthetic 'input' and 'change' Events (bubbles: true), WITHOUT any
    //    real trusted click/keyboard/drag interaction
    await sliderPage.basicSlider.evaluate((el: HTMLInputElement) => {
      el.value = '30';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // expect: The input's 'value' DOM property/attribute reflects the newly-assigned value
    await expect(sliderPage.basicSlider).toHaveValue('30');
    // expect: aria-valuenow and the adjacent 'Value:' text remain UNCHANGED at whatever value they
    //         held before this evaluate call (99, not 30) — confirming these two are driven
    //         exclusively by React's own controlled-input state, which only updates on a genuine
    //         trusted browser interaction event, not a synthetic one dispatched from page.evaluate
    await expect(sliderPage.basicSlider).toHaveAttribute('aria-valuenow', '99');
    await expect(sliderPage.basicSliderValueText).toHaveText('Value: 99');
  });
});
