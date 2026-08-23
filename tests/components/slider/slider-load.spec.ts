// spec: specs/slider.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { SliderPage } from '../../pages/SliderPage';

test.describe('Slider - Initial Load and Default State', () => {
  let sliderPage: SliderPage;

  test.beforeEach(async ({ page }) => {
    sliderPage = new SliderPage(page);
  });

  test('Slider page loads with heading, both exercise sections, and Insight section correctly rendered', async ({
    page,
  }) => {
    // 1. Navigate to '/components/slider' on a fresh browser context
    const consoleErrors = sliderPage.trackConsoleErrors();
    const response = await sliderPage.gotoSlider();

    // expect: Page loads successfully (HTTP 200, no console errors)
    expect(response?.status()).toBe(200);
    // expect: Heading 'Slider' (level 1) is visible
    await expect(page.getByRole('heading', { name: 'Slider', level: 1 })).toBeVisible();
    expect(consoleErrors).toEqual([]);

    // 2. Inspect both 'form-label' elements in DOM order
    // expect: The two labels read exactly, in order
    await expect(page.getByTestId('form-label')).toHaveText([
      'Adjust the slider to test min/max constraints',
      'Validate that the minimum value is always less than the maximum value',
    ]);

    // 3. Inspect the 'Insight' section without performing any click/expand interaction
    // expect: Heading 'Insight' (level 2) is visible immediately with no interaction required
    await expect(page.getByRole('heading', { name: 'Insight', level: 2 })).toBeVisible();
    // expect: The concept list contains exactly, in order, the documented items
    const conceptList = page.getByRole('list').filter({ hasText: 'Drag a slider to a specific value' });
    await expect(conceptList.getByRole('listitem')).toHaveText([
      'Drag a slider to a specific value',
      'Validate min/max constraints',
      'Validate range slider min/max relationship',
      'Read current slider value',
      'Update slider with keyboard',
    ]);
    // expect: A 'Github solution' link is visible with the expected href
    const githubLink = page.getByRole('link', { name: 'Github solution' });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/slider/slider.spec.ts'
    );
  });

  test('Basic slider loads with its exact default value, bounds, and display text', async () => {
    // 1. Navigate to '/components/slider'. Without interacting, read the basic slider's
    //    (data-testid='slider') value, min, max, step and its adjacent display text
    await sliderPage.gotoSlider();

    // expect: The input's value equals exactly '50'
    await expect(sliderPage.basicSlider).toHaveValue('50');
    // expect: min='0', max='100', step='1'
    await expect(sliderPage.basicSlider).toHaveAttribute('min', '0');
    await expect(sliderPage.basicSlider).toHaveAttribute('max', '100');
    await expect(sliderPage.basicSlider).toHaveAttribute('step', '1');
    // expect: The adjacent 'Value: ' text reads exactly 'Value: 50'
    await expect(sliderPage.basicSliderValueText).toHaveText('Value: 50');
    // expect: aria-valuenow, aria-valuemin, aria-valuemax attributes are present directly on the
    //         input and equal '50', '0', '100' respectively
    await expect(sliderPage.basicSlider).toHaveAttribute('aria-valuenow', '50');
    await expect(sliderPage.basicSlider).toHaveAttribute('aria-valuemin', '0');
    await expect(sliderPage.basicSlider).toHaveAttribute('aria-valuemax', '100');
  });

  test('Range slider pair loads with exact default values, bounds, and combined display text', async () => {
    // 1. Navigate to '/components/slider'. Without interacting, read the min slider
    //    (data-testid='min-slider') and max slider (data-testid='max-slider') values, min/max,
    //    and the shared display text
    await sliderPage.gotoSlider();

    // expect: The min slider's value equals exactly '20'; the max slider's value equals exactly '80'
    await expect(sliderPage.minSlider).toHaveValue('20');
    await expect(sliderPage.maxSlider).toHaveValue('80');
    // expect: Both inputs have min='0' and max='100'; step attribute is absent/empty on both
    await expect(sliderPage.minSlider).toHaveAttribute('min', '0');
    await expect(sliderPage.minSlider).toHaveAttribute('max', '100');
    await expect(sliderPage.maxSlider).toHaveAttribute('min', '0');
    await expect(sliderPage.maxSlider).toHaveAttribute('max', '100');
    await expect(sliderPage.minSlider).not.toHaveAttribute('step');
    await expect(sliderPage.maxSlider).not.toHaveAttribute('step');
    // expect: The shared display text reads exactly 'Min: 20 / Max: 80'
    await expect(sliderPage.rangeSliderValueText).toHaveText('Min: 20 / Max: 80');
    // expect: Neither the min slider nor the max slider has an aria-valuenow, aria-valuemin, or
    //         aria-valuemax attribute present in the DOM at all
    await expect(sliderPage.minSlider).not.toHaveAttribute('aria-valuenow');
    await expect(sliderPage.minSlider).not.toHaveAttribute('aria-valuemin');
    await expect(sliderPage.minSlider).not.toHaveAttribute('aria-valuemax');
    await expect(sliderPage.maxSlider).not.toHaveAttribute('aria-valuenow');
    await expect(sliderPage.maxSlider).not.toHaveAttribute('aria-valuemin');
    await expect(sliderPage.maxSlider).not.toHaveAttribute('aria-valuemax');
    // expect: The accessible value is still correctly exposed to assistive tech via the
    //         browser's native computation from the value/min/max IDL properties
    await expect(sliderPage.minSlider).toHaveAccessibleName('Minimum value');
  });

  test('The component is confirmed to be built on native input[type=range] elements, not a MUI Slider, and all three data-testids are globally unique on the page', async ({
    page,
  }) => {
    // 1. Navigate to '/components/slider'. Query the DOM for '.MuiSlider-root' and
    //    '.MuiSlider-thumb', and separately query for every element matching
    //    '[data-testid="slider"]', '[data-testid="min-slider"]', '[data-testid="max-slider"]'
    await sliderPage.gotoSlider();

    // expect: Zero elements match '.MuiSlider-root' and zero match '.MuiSlider-thumb' anywhere
    //         on the page, confirming this component is NOT built on MUI's Slider
    await expect(page.locator('.MuiSlider-root')).toHaveCount(0);
    await expect(page.locator('.MuiSlider-thumb')).toHaveCount(0);
    // expect: Exactly one element matches each of '[data-testid="slider"]',
    //         '[data-testid="min-slider"]', '[data-testid="max-slider"]'
    await expect(page.locator('[data-testid="slider"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="min-slider"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="max-slider"]')).toHaveCount(1);
  });
});
