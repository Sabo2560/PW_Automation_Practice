// spec: specs/slider.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { SliderPage } from '../../pages/SliderPage';

/**
 * Performs a broad interaction sequence across both slider exercises — every keyboard key on the
 * basic slider (Arrow x4, Home, End, PageUp, PageDown), a click and a drag on it, and enough
 * min/max ArrowRight/ArrowLeft presses on the range pair to trigger the strict min-less-than-max
 * constraint-rejection boundary at least twice (once from each side) — the sequence used by the
 * console-errors scenario below, per specs/slider.plan.md §8.1.
 */
async function performBroadInteractionSequence(sliderPage: SliderPage) {
  // Every keyboard key on the basic slider.
  await sliderPage.basicSlider.focus();
  for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown']) {
    await sliderPage.basicSlider.press(key);
  }
  // A click and a drag on the basic slider.
  await sliderPage.setValueViaClick(sliderPage.basicSlider, 25, 0, 100);
  await sliderPage.dragSliderToValue(sliderPage.basicSlider, 75, 0, 100);

  // Drive the min slider up to exactly one below the max slider's default (79), then attempt one
  // more ArrowRight step — rejected from the min side (per the confirmed strict constraint).
  await sliderPage.setValueViaArrowKeys(sliderPage.minSlider, 20, 79);
  await sliderPage.minSlider.press('ArrowRight');

  // Attempt to decrement the max slider (still at its default 80) down to 79, equal to the min
  // slider's current value — rejected from the max side.
  await sliderPage.maxSlider.press('ArrowLeft');
}

test.describe('Slider - Console Behavior', () => {
  let sliderPage: SliderPage;

  test.beforeEach(async ({ page }) => {
    sliderPage = new SliderPage(page);
    await sliderPage.gotoSlider();
  });

  test('No console errors are logged during extensive interaction with either exercise', async () => {
    // 1. Navigate to '/components/slider', begin tracking console errors, then perform a broad
    // interaction sequence: all keyboard keys on the basic slider (Arrow x4, Home, End, PageUp,
    // PageDown), a click and a drag on the basic slider, and enough min/max slider
    // ArrowRight/ArrowLeft presses on the range pair to trigger the constraint-rejection boundary
    // at least twice (once from each side)
    const consoleErrors = sliderPage.trackConsoleErrors();
    await performBroadInteractionSequence(sliderPage);

    // expect: Zero console error messages are logged throughout the entire sequence, matching the
    // clean-console baseline (0 errors) observed live during this plan's own exploration of this
    // exact interaction breadth, including during the boundary-rejection attempts
    expect(consoleErrors).toEqual([]);
  });
});
