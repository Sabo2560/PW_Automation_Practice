// spec: specs/slider.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { SliderPage } from '../../pages/SliderPage';

test.describe('Slider - Bounds and Edge Cases (Boundary Value Analysis)', () => {
  let sliderPage: SliderPage;

  test.beforeEach(async ({ page }) => {
    sliderPage = new SliderPage(page);
    await sliderPage.gotoSlider();
  });

  test('Basic slider: value cannot go below its absolute minimum (0) or above its absolute maximum (100), confirmed at, just-below (via clamping), and just-above the limits', async () => {
    // 1. Focus the basic slider, press 'Home' (value becomes 0 — AT the minimum boundary), then
    //    press 'ArrowLeft' once (an attempt to go just-below the minimum)
    await sliderPage.basicSlider.press('Home');

    // expect: Value is exactly '0' after Home
    await expect(sliderPage.basicSlider).toHaveValue('0');

    await sliderPage.basicSlider.press('ArrowLeft');

    // expect: Value remains exactly '0' after the ArrowLeft attempt (clamped, no negative value
    //         ever produced, no error thrown)
    await expect(sliderPage.basicSlider).toHaveValue('0');

    // 2. Press 'End' (value becomes 100 — AT the maximum boundary), then press 'ArrowRight' once
    //    (an attempt to go just-above the maximum)
    await sliderPage.basicSlider.press('End');

    // expect: Value is exactly '100' after End
    await expect(sliderPage.basicSlider).toHaveValue('100');

    await sliderPage.basicSlider.press('ArrowRight');

    // expect: Value remains exactly '100' after the ArrowRight attempt (clamped, no value
    //         exceeding 100 ever produced)
    await expect(sliderPage.basicSlider).toHaveValue('100');
  });

  test('Range slider pair: the min slider cannot go below the absolute floor (0) and the max slider cannot exceed the absolute ceiling (100), independent of the cross-field constraint', async () => {
    // 1. Focus the min slider (starts at 20) and press 'Home'
    await sliderPage.minSlider.press('Home');

    // expect: The min slider's value equals exactly '0' (the native absolute floor is reachable,
    //         since the max slider's value of 80 poses no obstruction at the low end)
    await expect(sliderPage.minSlider).toHaveValue('0');

    // 2. Focus the max slider (starts at 80) and press 'End'
    await sliderPage.maxSlider.press('End');

    // expect: The max slider's value equals exactly '100' (the native absolute ceiling is
    //         reachable, since the min slider's value of 0 poses no obstruction at the high end)
    await expect(sliderPage.maxSlider).toHaveValue('100');
  });

  test('The smallest valid gap between min and max is exactly 1 (the step size); a gap of 0 is never achievable via keyboard stepping', async () => {
    // 1. Drive the min slider up via 59 consecutive ArrowRight presses to reach exactly 79 (one
    //    below the max slider's 80)
    await sliderPage.setValueViaArrowKeys(sliderPage.minSlider, 20, 79);

    // expect: The min slider's value equals exactly '79' — a valid, accepted state with a gap of
    //         exactly 1 between min (79) and max (80)
    await expect(sliderPage.minSlider).toHaveValue('79');
    await expect(sliderPage.maxSlider).toHaveValue('80');

    // 2. Attempt one further ArrowRight press on the min slider (which would close the gap to 0,
    //    min=max=80)
    await sliderPage.minSlider.press('ArrowRight');

    // expect: The min slider's value remains unchanged at exactly '79' — confirming a gap of 0
    //         between min and max is never achievable via single-step keyboard interaction, and 1
    //         (the step size) is the smallest valid gap this component allows
    await expect(sliderPage.minSlider).toHaveValue('79');
    await expect(sliderPage.maxSlider).toHaveValue('80');
  });
});
