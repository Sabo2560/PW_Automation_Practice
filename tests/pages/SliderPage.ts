import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Slider component (https://www.automationplayground.dev/components/slider),
 * which presents two independent exercises: a Basic slider (`data-testid="slider"`) and a
 * Min/Max range slider pair (`data-testid="min-slider"` / `"max-slider"`) enforcing a strict
 * min-less-than-max constraint. See specs/slider.plan.md for full detail.
 *
 * Confirmed NOT a MUI Slider (`.MuiSlider-root`/`.MuiSlider-thumb` both return 0 matches, live) —
 * all three controls are plain native `<input type="range">` elements, each carrying a globally
 * unique `data-testid`, so every locator below resolves unambiguously via `page.getByTestId()`
 * with no duplicate-testid/accessible-name fallback workaround required (unlike WindowPage/
 * CalendarPage).
 */
export class SliderPage extends BasePage {
  readonly basicSlider: Locator;
  readonly minSlider: Locator;
  readonly maxSlider: Locator;
  readonly basicSliderValueText: Locator;
  readonly rangeSliderValueText: Locator;

  constructor(page: Page) {
    super(page);
    this.basicSlider = page.getByTestId('slider');
    this.minSlider = page.getByTestId('min-slider');
    this.maxSlider = page.getByTestId('max-slider');
    // No data-testid of its own — the adjacent "Value: N" text is a plain sibling <span>
    // immediately following the input in the DOM (confirmed live via nextElementSibling).
    this.basicSliderValueText = this.basicSlider.locator('xpath=following-sibling::span[1]');
    // The shared "Min: X / Max: Y" text is a <div>, also with no data-testid of its own,
    // that is NOT a sibling of either input directly — it's a sibling of the container <div>
    // that wraps both stacked range inputs. Confirmed live: from either input, walking up one
    // level (`..`) to that container then across to its own next sibling `<div>` resolves to
    // the exact display text, reproducibly, for both the min and max slider as the anchor.
    this.rangeSliderValueText = this.minSlider.locator('xpath=../following-sibling::div[1]');
  }

  async gotoSlider() {
    const response = await this.goto('/components/slider');
    await expect(this.page.getByRole('heading', { name: 'Slider', level: 1 })).toBeVisible();
    return response;
  }

  /**
   * Reads a slider's current value via `inputValue()`, which works uniformly across all three
   * native `input[type=range]` elements. Deliberately NOT `.fill()` — Playwright refuses to run
   * `.fill()` against `input[type="range"]` at all.
   */
  async getValue(slider: Locator): Promise<string> {
    return slider.inputValue();
  }

  /**
   * Reads the `aria-valuenow` attribute directly off `slider`. Returns a real value only for the
   * basic slider, which explicitly sets `aria-valuenow`/`aria-valuemin`/`aria-valuemax` in the
   * DOM (confirmed live). The min/max range sliders carry NONE of these three attributes at all
   * (confirmed `null` via `getAttribute`) — their accessible current value is still correctly
   * computed and exposed natively by the browser from the `value`/`min`/`max` IDL properties, but
   * that can only be observed via the accessibility tree/snapshot, not this attribute read.
   */
  async getAriaValueNow(slider: Locator): Promise<string | null> {
    return slider.getAttribute('aria-valuenow');
  }

  /**
   * Focuses `slider` and presses ArrowRight/ArrowLeft the exact number of times needed to move
   * from `currentValue` to `targetValue` (step size of 1 for all three sliders on this page) —
   * the only fully deterministic way to reach an arbitrary exact value, given this app's
   * confirmed all-or-nothing overshoot-rejection behavior for Home/End/PageUp/PageDown on the
   * range slider pair (a large jump that would violate the min<max constraint is fully rejected
   * rather than clamped).
   */
  async setValueViaArrowKeys(slider: Locator, currentValue: number, targetValue: number) {
    await slider.focus();
    const delta = targetValue - currentValue;
    const key = delta >= 0 ? 'ArrowRight' : 'ArrowLeft';
    for (let i = 0; i < Math.abs(delta); i++) {
      await this.page.keyboard.press(key);
    }
  }

  /**
   * Resolves `slider`'s bounding box and computes the pixel x-offset corresponding to
   * `targetValue` within `[min, max]` — the shared "value -> track x-offset" math used by both
   * `setValueViaClick()` and `dragSliderToValue()` below.
   */
  private async resolveTargetX(slider: Locator, targetValue: number, min: number, max: number) {
    const box = await slider.boundingBox();
    if (!box) throw new Error('resolveTargetX: slider has no bounding box.');
    const fraction = (targetValue - min) / (max - min);
    return { box, targetX: box.x + fraction * box.width };
  }

  /**
   * Clicks `slider` at the precise pixel x-offset corresponding to `targetValue` within the
   * `[min, max]` range, computed from the slider's own `boundingBox()`. REQUIRED instead of a
   * bare `.click()` — a default, unpositioned click always lands at the horizontal CENTER of the
   * element's full-width bounding box (i.e. always value 50 for a 0-100 range), because every
   * slider here is a native, always-full-track-width `input[type=range]`, not a narrow MUI-style
   * thumb element (confirmed live, documented as Known Quirk #2 in specs/slider.plan.md).
   */
  async setValueViaClick(slider: Locator, targetValue: number, min: number, max: number) {
    const { box, targetX } = await this.resolveTargetX(slider, targetValue, min, max);
    await slider.click({ position: { x: targetX - box.x, y: box.height / 2 } });
  }

  /**
   * Drags `slider`'s thumb to the precise pixel x-offset corresponding to `targetValue`, via a
   * real mouse down/move/up sequence (a genuine trusted pointer sequence, not `.dragTo()`, which
   * is likewise subject to Known Quirk #2's always-lands-at-center behavior when passed another
   * element as its target). Same pixel-offset math as `setValueViaClick`.
   */
  async dragSliderToValue(slider: Locator, targetValue: number, min: number, max: number) {
    const { box, targetX } = await this.resolveTargetX(slider, targetValue, min, max);
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(targetX, startY, { steps: 10 });
    await this.page.mouse.up();
  }
}
