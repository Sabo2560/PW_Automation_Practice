// spec: specs/slider.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { SliderPage } from '../../pages/SliderPage';

test.describe('Slider - Accessibility / ARIA', () => {
  let sliderPage: SliderPage;

  test.beforeEach(async ({ page }) => {
    sliderPage = new SliderPage(page);
    await sliderPage.gotoSlider();
  });

  test("The basic slider's role is 'slider' but it has NO accessible name (no aria-label or aria-labelledby)", async () => {
    // 1. Inspect the basic slider's role (implicit from input[type=range]), and its 'aria-label'
    //    and 'aria-labelledby' attributes
    // expect: The element's implicit ARIA role is 'slider' (confirmed via the accessibility tree,
    //         since no explicit role attribute is present — role='slider' is the native implicit
    //         role of input[type=range]), with no accessible name attached to it
    await expect(sliderPage.basicSlider).toMatchAriaSnapshot(`- slider: "50"`);

    // expect: getAttribute('aria-label') returns null and getAttribute('aria-labelledby') returns
    //         null — confirming this slider has NO accessible name at all, a real, confirmed
    //         accessibility gap distinct from the two range sliders in scenario 6.2 below, which
    //         DO have one
    await expect(sliderPage.basicSlider).not.toHaveAttribute('aria-label');
    await expect(sliderPage.basicSlider).not.toHaveAttribute('aria-labelledby');
  });

  test('The min and max range sliders each have a distinct, correct accessible name via aria-label', async ({
    page,
  }) => {
    // 1. Locate sliders by accessible role+name: getByRole('slider', { name: 'Minimum value',
    //    exact: true }) and getByRole('slider', { name: 'Maximum value', exact: true })
    const minSliderByRole = page.getByRole('slider', { name: 'Minimum value', exact: true });
    const maxSliderByRole = page.getByRole('slider', { name: 'Maximum value', exact: true });

    // expect: Each resolves to exactly 1 element (unique, unambiguous accessible names)
    await expect(minSliderByRole).toHaveCount(1);
    await expect(maxSliderByRole).toHaveCount(1);

    // expect: The 'Minimum value'-named slider's data-testid equals exactly 'min-slider', and the
    //         'Maximum value'-named slider's data-testid equals exactly 'max-slider', confirming
    //         the aria-label values correctly correspond to their respective inputs
    await expect(minSliderByRole).toHaveAttribute('data-testid', 'min-slider');
    await expect(maxSliderByRole).toHaveAttribute('data-testid', 'max-slider');
  });

  test("All three sliders' accessible min/max/current-value are always correct, whether exposed via explicit ARIA attributes or the browser's native computation", async () => {
    // 1. For the basic slider, read its aria-valuenow/aria-valuemin/aria-valuemax attributes
    //    directly
    // expect: Basic slider: aria-valuenow='50', aria-valuemin='0', aria-valuemax='100' (matching
    //         its DOM value/min/max exactly, on fresh load)
    await expect(sliderPage.basicSlider).toHaveAttribute('aria-valuenow', '50');
    await expect(sliderPage.basicSlider).toHaveAttribute('aria-valuemin', '0');
    await expect(sliderPage.basicSlider).toHaveAttribute('aria-valuemax', '100');

    // For the min and max sliders, read the accessibility tree's reported current value via the
    // accessibility snapshot (role=slider, since no aria-valuenow attribute exists on these two per
    // scenario 1.3) instead of the attribute
    // expect: Min slider: accessibility-tree-reported value is '20' (matching its 'value' property,
    //         computed natively by the browser from the absent-aria-valuenow input, not from any
    //         explicit attribute)
    await expect(sliderPage.minSlider).toMatchAriaSnapshot(`- slider "Minimum value": "20"`);
    // expect: Max slider: accessibility-tree-reported value is '80', likewise natively computed
    await expect(sliderPage.maxSlider).toMatchAriaSnapshot(`- slider "Maximum value": "80"`);

    // After changing the basic slider's value via a real ArrowRight press (per scenario 2.1)
    await sliderPage.basicSlider.press('ArrowRight');

    // expect: its aria-valuenow attribute updates to match the new value exactly — confirming this
    //         explicit-attribute approach stays correctly synced with genuine interaction, not
    //         merely correct on initial load
    await expect(sliderPage.basicSlider).toHaveAttribute('aria-valuenow', '51');
  });
});
