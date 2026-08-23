// spec: specs/slider.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { SliderPage } from '../../pages/SliderPage';

test.describe('Slider - Range Slider Min/Max Constraint', () => {
  let sliderPage: SliderPage;

  test.beforeEach(async ({ page }) => {
    sliderPage = new SliderPage(page);
    await sliderPage.gotoSlider();
  });

  test("Incrementing the min slider via ArrowRight is hard-blocked exactly one step below the max slider's current value, never reaching or exceeding it", async () => {
    // 1. Focus the min slider and press 'ArrowRight' repeatedly (59 times) to drive it up toward
    //    the max slider's value
    await sliderPage.setValueViaArrowKeys(sliderPage.minSlider, 20, 79);

    // expect: The min slider's value increases by exactly 1 per press for every press that keeps
    //         it strictly below 80, ultimately reaching exactly '79' (max - 1)
    await expect(sliderPage.minSlider).toHaveValue('79');

    // 2. Press 'ArrowRight' one more time (an attempt to reach 80, equal to the max slider's value)
    await sliderPage.minSlider.press('ArrowRight');

    // expect: The min slider's value remains unchanged at exactly '79' — the keypress has NO
    //         effect, confirming the app enforces a STRICT inequality (min must be less than max,
    //         not less-than-or-equal), and that the max slider's own value (80) remains unchanged
    //         at '80' throughout, confirmed unaffected by this rejected attempt on the min slider
    await expect(sliderPage.minSlider).toHaveValue('79');
    await expect(sliderPage.maxSlider).toHaveValue('80');
  });

  test("Decrementing the max slider via ArrowLeft is hard-blocked exactly one step above the min slider's current value, never reaching or going below it", async () => {
    // 1. Drive the min slider up to exactly 79 via repeated ArrowRight presses (per scenario 4.1's
    //    confirmed climb). Then focus the max slider (still at 80) and press 'ArrowLeft' once,
    //    attempting to reach 79 (equal to the min slider's value)
    await sliderPage.setValueViaArrowKeys(sliderPage.minSlider, 20, 79);
    await sliderPage.maxSlider.press('ArrowLeft');

    // expect: The max slider's value remains unchanged at exactly '80' — the keypress has NO
    //         effect, confirming the same strict-inequality constraint is enforced symmetrically
    //         from the max side, and the min slider's value remains unchanged at '79' throughout
    await expect(sliderPage.maxSlider).toHaveValue('80');
    await expect(sliderPage.minSlider).toHaveValue('79');
  });

  test('A large keyboard jump (Home/End, PageUp/PageDown) that would land beyond the opposing boundary is fully rejected with the value left completely unchanged — not clamped to the nearest valid value', async () => {
    // 1. Focus the min slider and press 'End' (an attempt to jump directly to 100, the native
    //    absolute maximum, which would badly violate the min<max constraint against max=80)
    await sliderPage.minSlider.press('End');

    // expect: The min slider's value remains completely unchanged at exactly '20' (its pre-press
    //         value) — NOT clamped to 79 (max - 1, the nearest theoretically-valid value)
    await expect(sliderPage.minSlider).toHaveValue('20');

    // 2. Focus the min slider (still at 20) and press 'PageUp' three times in sequence
    //    (20 -> 30 -> 40 -> 50, each individually valid since max is 80)
    await sliderPage.minSlider.press('PageUp');
    await sliderPage.minSlider.press('PageUp');
    await sliderPage.minSlider.press('PageUp');
    await expect(sliderPage.minSlider).toHaveValue('50');

    //    then continue pressing PageUp (50 -> 60 -> 70, still valid) until an attempted PageUp
    //    would land at or past 80
    await sliderPage.minSlider.press('PageUp');
    await sliderPage.minSlider.press('PageUp');

    // expect: Each PageUp press that keeps the resulting value strictly below 80 succeeds,
    //         advancing by exactly 10 each time
    await expect(sliderPage.minSlider).toHaveValue('70');

    await sliderPage.minSlider.press('PageUp');

    // expect: The specific PageUp press that would land the value at exactly 80 (equal to max) is
    //         fully rejected — the value remains unchanged at its pre-press value (70)
    await expect(sliderPage.minSlider).toHaveValue('70');
  });

  test("A click on the track that would place a slider's value in violation of the min<max constraint is also fully rejected", async () => {
    // 1. Drive the min slider up to exactly 79 via repeated ArrowRight presses (min=79, max=80).
    //    Then perform a default (center-of-element) click directly on the max slider — which,
    //    per the click-quirk confirmed in the Click/Drag suite, targets value 50 (well below the
    //    current min of 79)
    await sliderPage.setValueViaArrowKeys(sliderPage.minSlider, 20, 79);
    await sliderPage.maxSlider.click();

    // expect: The max slider's value remains unchanged at exactly '80' after the click — the
    //         click has NO effect, confirming click-based (not just keyboard-based) attempts to
    //         violate the strict min<max constraint are equally rejected, and the min slider's
    //         value remains unchanged at '79'
    await expect(sliderPage.maxSlider).toHaveValue('80');
    await expect(sliderPage.minSlider).toHaveValue('79');
  });

  test('Both sliders can be freely repositioned to any pair of values as long as min remains strictly less than max (happy path)', async () => {
    // 1. Using the min slider's ArrowRight/ArrowLeft keys, move it from 20 to exactly 30
    //    (10 presses). Using the max slider's ArrowLeft/ArrowRight keys, move it from 80 to
    //    exactly 70 (10 presses)
    await sliderPage.setValueViaArrowKeys(sliderPage.minSlider, 20, 30);
    await sliderPage.setValueViaArrowKeys(sliderPage.maxSlider, 80, 70);

    // expect: The min slider's final value equals exactly '30'
    await expect(sliderPage.minSlider).toHaveValue('30');
    // expect: The max slider's final value equals exactly '70' — both changes succeeded with no
    //         rejection at any intermediate step (since 30 < 70 holds throughout the entire
    //         sequence, regardless of the order the two sliders are adjusted in)
    await expect(sliderPage.maxSlider).toHaveValue('70');
    // expect: The shared display text reads exactly 'Min: 30 / Max: 70'
    await expect(sliderPage.rangeSliderValueText).toHaveText('Min: 30 / Max: 70');
  });
});
