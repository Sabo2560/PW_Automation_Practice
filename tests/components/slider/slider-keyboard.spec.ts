// spec: specs/slider.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { SliderPage } from '../../pages/SliderPage';

test.describe('Slider - Keyboard Interaction (Basic Slider)', () => {
  let sliderPage: SliderPage;

  test.beforeEach(async ({ page }) => {
    sliderPage = new SliderPage(page);
    await sliderPage.gotoSlider();
  });

  test('ArrowRight and ArrowLeft change the value by exactly the step size (1)', async () => {
    // 1. Focus the basic slider (data-testid='slider', starts at 50) and press 'ArrowRight' once
    await sliderPage.basicSlider.press('ArrowRight');

    // expect: The input's value equals exactly '51'
    await expect(sliderPage.basicSlider).toHaveValue('51');

    // 2. Press 'ArrowLeft' twice
    await sliderPage.basicSlider.press('ArrowLeft');
    await sliderPage.basicSlider.press('ArrowLeft');

    // expect: The input's value equals exactly '49' (51 - 1 - 1), confirming ArrowLeft decreases
    //         by exactly 1 per press, matching ArrowRight's increment magnitude in the opposite direction
    await expect(sliderPage.basicSlider).toHaveValue('49');
  });

  test('ArrowUp and ArrowDown behave identically to ArrowRight and ArrowLeft respectively (+1/-1)', async () => {
    // 1. Focus the basic slider (value 50) and press 'ArrowUp' once, then 'ArrowDown' twice
    await sliderPage.basicSlider.press('ArrowUp');

    // expect: After ArrowUp: value equals exactly '51'
    await expect(sliderPage.basicSlider).toHaveValue('51');

    await sliderPage.basicSlider.press('ArrowDown');
    await sliderPage.basicSlider.press('ArrowDown');

    // expect: After the two ArrowDown presses: value equals exactly '49', confirming ArrowUp/ArrowDown
    //         are functionally equivalent to ArrowRight/ArrowLeft for this horizontal slider
    //         (both move by exactly 1 per press)
    await expect(sliderPage.basicSlider).toHaveValue('49');
  });

  test('Home jumps directly to the minimum (0); End jumps directly to the maximum (100)', async () => {
    // 1. Focus the basic slider (value 50) and press 'Home'
    await sliderPage.basicSlider.press('Home');

    // expect: The input's value equals exactly '0' in a single keypress (not a gradual decrement)
    await expect(sliderPage.basicSlider).toHaveValue('0');

    // 2. Press 'End'
    await sliderPage.basicSlider.press('End');

    // expect: The input's value equals exactly '100' in a single keypress
    await expect(sliderPage.basicSlider).toHaveValue('100');

    // 3. Press 'ArrowLeft' once while at value 0 (after a fresh Home press), and separately press
    //    'ArrowRight' once while at value 100 (after a fresh End press)
    await sliderPage.basicSlider.press('Home');
    await sliderPage.basicSlider.press('ArrowLeft');

    // expect: Pressing ArrowLeft at value 0 leaves the value unchanged at exactly '0'
    //         (clamped at the minimum, no negative overflow)
    await expect(sliderPage.basicSlider).toHaveValue('0');

    await sliderPage.basicSlider.press('End');
    await sliderPage.basicSlider.press('ArrowRight');

    // expect: Pressing ArrowRight at value 100 leaves the value unchanged at exactly '100'
    //         (clamped at the maximum, no overflow past 100)
    await expect(sliderPage.basicSlider).toHaveValue('100');
  });

  test('PageUp and PageDown change the value by exactly 10', async () => {
    // 1. Focus the basic slider (value 50) and press 'PageDown' once
    await sliderPage.basicSlider.press('PageDown');

    // expect: The input's value equals exactly '40' (50 - 10)
    await expect(sliderPage.basicSlider).toHaveValue('40');

    // 2. Press 'PageUp' twice
    await sliderPage.basicSlider.press('PageUp');
    await sliderPage.basicSlider.press('PageUp');

    // expect: The input's value equals exactly '60' (40 + 10 + 10), confirming PageUp/PageDown move
    //         by exactly 10 per press in this browser engine (confirmed live in Chromium; the exact
    //         increment is engine-dependent per this plan's Ambiguous section, and was not
    //         independently confirmed in Firefox/WebKit)
    await expect(sliderPage.basicSlider).toHaveValue('60');
  });

  test("aria-valuenow and the displayed 'Value:' text remain in sync with the input's value after every keyboard interaction", async () => {
    // 1. Focus the basic slider and perform a sequence of keyboard interactions: ArrowRight x3,
    //    Home, End, PageDown, checking after each individual keypress
    const keys = ['ArrowRight', 'ArrowRight', 'ArrowRight', 'Home', 'End', 'PageDown'];

    for (const key of keys) {
      await sliderPage.basicSlider.press(key);

      // expect: After every single keypress in the sequence, the input's 'aria-valuenow' attribute
      //         exactly equals its current 'value' property (as a string), and the adjacent text
      //         node reads exactly 'Value: ' followed by that same value — confirmed never to drift
      //         out of sync at any point in the sequence
      const value = await sliderPage.getValue(sliderPage.basicSlider);
      const ariaValueNow = await sliderPage.getAriaValueNow(sliderPage.basicSlider);
      expect(ariaValueNow).toBe(value);
      await expect(sliderPage.basicSliderValueText).toHaveText(`Value: ${value}`);
    }
  });
});
