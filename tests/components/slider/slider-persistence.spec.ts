// spec: specs/slider.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { SliderPage } from '../../pages/SliderPage';

test.describe('Slider - Reload Persistence', () => {
  let sliderPage: SliderPage;

  test.beforeEach(async ({ page }) => {
    sliderPage = new SliderPage(page);
    await sliderPage.gotoSlider();
  });

  test('No slider value persists across a page reload — all three inputs reset to their documented fresh-load defaults', async () => {
    // 1. Change the basic slider to 100 (via 'End'), the min slider to a different value via
    //    ArrowRight presses, and the max slider to a different value via ArrowLeft presses
    await sliderPage.basicSlider.focus();
    await sliderPage.basicSlider.press('End');
    await sliderPage.setValueViaArrowKeys(sliderPage.minSlider, 20, 55);
    await sliderPage.setValueViaArrowKeys(sliderPage.maxSlider, 80, 77);

    // expect: Before reload: the basic slider's value equals '100', and the min/max sliders both
    //         reflect the just-performed non-default changes
    await expect(sliderPage.basicSlider).toHaveValue('100');
    await expect(sliderPage.minSlider).toHaveValue('55');
    await expect(sliderPage.maxSlider).toHaveValue('77');
    await expect(sliderPage.rangeSliderValueText).toHaveText('Min: 55 / Max: 77');

    // 2. Reload the page (page.reload())
    await sliderPage.page.reload();

    // expect: The basic slider's value is exactly '50' again (the documented fresh-load default),
    //         with its 'Value: 50' text and aria-valuenow='50' restored
    await expect(sliderPage.basicSlider).toHaveValue('50');
    await expect(sliderPage.basicSliderValueText).toHaveText('Value: 50');
    await expect(sliderPage.basicSlider).toHaveAttribute('aria-valuenow', '50');

    // expect: The min slider's value is exactly '20' again and the max slider's value is exactly
    //         '80' again, with the shared 'Min: 20 / Max: 80' text restored — confirming no
    //         localStorage/sessionStorage/URL state is involved for any of the three sliders
    await expect(sliderPage.minSlider).toHaveValue('20');
    await expect(sliderPage.maxSlider).toHaveValue('80');
    await expect(sliderPage.rangeSliderValueText).toHaveText('Min: 20 / Max: 80');
  });
});
