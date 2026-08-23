# Slider Component Test Plan

## Application Overview

**No prior coverage exists for this component.** `Glob` on `specs/slider.plan.md`, `tests/pages/SliderPage.ts`, and `tests/components/slider/**` confirmed none of the three exist anywhere in the repo before this plan. Everything below was derived from scratch through live exploration on 2026-08-22 via `browser_navigate`, `browser_snapshot`, `browser_evaluate`, `browser_click`, `browser_drag`, and `browser_press_key`; no assumption was carried over from any prior legacy spec (none exists) or from typical MUI Slider behavior — the underlying implementation was independently identified and confirmed live (see below), not guessed.

**Page Object:** `SliderPage.ts` (new — does not yet exist in `tests/pages/`), extending `BasePage.ts` with `readonly Locator` fields and helper methods, matching the conventions established in `WindowPage.ts` and `CalendarPage.ts`. Unlike those two MUI-based pages, all three sliders on this page carry a globally-unique `data-testid` (`slider`, `min-slider`, `max-slider` — confirmed live via `document.querySelectorAll`, exactly 1 match each), so `SliderPage.ts` can locate every control directly via `page.getByTestId(...)` with no duplicate-testid or accessible-name fallback workaround required, a simpler story than either prior plan. It should expose: a `gotoSlider()` navigation helper (asserting the 'Slider' level-1 heading is visible); `basicSlider` (`page.getByTestId('slider')`); `minSlider` (`page.getByTestId('min-slider')`, also uniquely locatable via `getByRole('slider', { name: 'Minimum value', exact: true })`); `maxSlider` (`page.getByTestId('max-slider')`, also `getByRole('slider', { name: 'Maximum value', exact: true })`); `basicSliderValueText` (located relative to `basicSlider` via its immediate following sibling `<span>`, since it carries no `data-testid` of its own — e.g. `basicSlider.locator('xpath=following-sibling::span[1]')`); `rangeSliderValueText` (the shared `<div class="text-secondary text-sm">Min: X / Max: Y</div>`, likewise no `data-testid`, located as a sibling of the range inputs' shared container); `getValue(slider: Locator): Promise<string>` (reads via Playwright's built-in `inputValue()`, which works uniformly for all three native `input[type=range]` elements — NOT via `.fill()`, which Playwright explicitly refuses to run against `input[type="range"]`); `getAriaValueNow(slider: Locator): Promise<string | null>` (reads the `aria-valuenow` attribute directly — returns a real value only for the basic slider; `null` for the min/max sliders, per the confirmed quirk below, so callers must not assume this attribute is populated for all three); `setValueViaArrowKeys(slider: Locator, currentValue: number, targetValue: number)` (focuses the slider and presses `ArrowRight`/`ArrowLeft` the exact number of times needed, the only fully deterministic way to reach an arbitrary exact value without relying on this app's confirmed all-or-nothing overshoot-rejection behavior for `Home`/`End`/`PageUp`/`PageDown` — see Known Quirk #2); and `setValueViaClick(slider: Locator, targetValue: number, min: number, max: number)` (computes the target pixel x-offset from the slider's own `boundingBox()` via `targetX = box.x + (targetValue - min) / (max - min) * box.width` and performs a positioned `.click({ position: { x: targetX - box.x, y: box.height / 2 } })` — this precise-offset approach is REQUIRED, per Known Quirk #3 below, because a default, unpositioned `.click()` or `.dragTo(otherElement)` always lands at the horizontal center of the target element's full bounding box, i.e. always value 50 for a 0-100 range, regardless of which slider element is referenced or its current displayed value, since every slider here is a native, always-full-track-width `input[type=range]`, not a narrow MUI-style thumb element).

**Confirmed NOT a MUI Slider.** `document.querySelectorAll('.MuiSlider-root')` and `.MuiSlider-thumb` both returned 0 matches (confirmed live), a direct, confirmed contrast with this repo's Window and Calendar components (both genuinely MUI-based). Both exercises on this page are plain native `<input type="range">` elements styled with Tailwind utility classes (`h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-300`) — there is no custom thumb, track-fill, or mark-label DOM structure of any kind; all visual rendering (thumb, filled portion) comes from the browser's own native range-input rendering. `role="slider"` is never an explicit HTML attribute anywhere on this page — it is the browser's native IMPLICIT ARIA role for `input[type=range]`, confirmed by `document.querySelectorAll('[role="slider"]')` returning 0 elements (no literal `role` attribute exists) while the accessibility snapshot nonetheless correctly reports `slider` role and current value for all three, proving the role/value are computed natively rather than authored explicitly (except where the app explicitly duplicates `aria-valuenow`/`min`/`max`, see below).

**Page structure and exact labels (verified live, DOM order):** two `[data-testid="form-label"]` elements read exactly: `"Adjust the slider to test min/max constraints"` (basic slider) and `"Validate that the minimum value is always less than the maximum value"` (range slider pair). The Insight section (heading level 2; concept list confirmed exactly: `'Drag a slider to a specific value'`, `'Validate min/max constraints'`, `'Validate range slider min/max relationship'`, `'Read current slider value'`, `'Update slider with keyboard'`; Github solution link to `https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/slider/slider.spec.ts`) is visible immediately with no interaction required, matching every other component page's pattern.

**Basic slider (`data-testid="slider"`) — confirmed behaviors:** `min="0"`, `max="100"`, `step="1"`, default `value="50"`. Explicitly and redundantly carries `aria-valuenow`, `aria-valuemin`, `aria-valuemax` attributes in the DOM (confirmed via `outerHTML`), all three kept correctly in sync with the live value across every genuine keyboard/click/drag interaction tested (confirmed across a full ArrowRight/Home/End/PageUp/PageDown/click/drag sequence — never observed to drift). Has NO accessible name at all: `aria-label` and `aria-labelledby` are both confirmed `null`. Its adjacent display text is a plain sibling `<span class="text-secondary text-sm">Value: 50</span>`, not programmatically associated via `aria-describedby` — it updates correctly on every genuine interaction but is purely a visual/DOM-sibling relationship. **Keyboard (all confirmed live in Chromium):** `ArrowRight`/`ArrowUp` = +1 (the step size); `ArrowLeft`/`ArrowDown` = -1; `Home` jumps directly to 0 in one keypress; `End` jumps directly to 100 in one keypress; `PageUp`/`PageDown` = +/-10 each; at either extreme, a further press in the same direction leaves the value unchanged (natively clamped, no overflow/underflow, no error). **Click:** a real, trusted Playwright `.click()` with no position override lands at the horizontal center of the element's full-width bounding box, setting the value to exactly 50 (confirmed by first moving the value away from 50 via `End`, then clicking, landing back at exactly 50) — a genuine native `input[type=range]` click-to-position behavior, distinct from typical MUI Slider behavior which usually requires interacting with a thumb sub-element. **Drag:** a real trusted mouse drag (mousedown + mousemove + mouseup) from the current thumb position to a different target position correctly moves the value toward that target (confirmed live: a drag toward a far-left page element landed the value at exactly 0, with `aria-valuenow`/text both correctly in sync afterward).

**Range slider pair (`data-testid="min-slider"`/`"max-slider"`) — confirmed behaviors:** two SEPARATE, independent, full-width `input[type=range]` elements STACKED vertically (confirmed via `getBoundingClientRect()`: identical `x`/`width`, `y` offset by exactly 16px) — NOT a single shared track with two overlapping thumbs as MUI's range Slider typically renders. Both have `min="0"`, `max="100"`, no explicit `step` attribute (native default of 1 confirmed live via single-step keyboard increments). Defaults: min slider `value="20"` (`aria-label="Minimum value"`), max slider `value="80"` (`aria-label="Maximum value"`). **Neither carries any `aria-valuenow`/`aria-valuemin`/`aria-valuemax` attribute in the DOM at all** (confirmed `null` via `getAttribute`) — a direct, confirmed contrast with the basic slider — yet the accessibility tree still correctly reports each one's current value (confirmed via the accessibility snapshot), because browsers natively compute these ARIA values from the `value`/`min`/`max` IDL properties for `input[type=range]` even with no explicit attributes present; a test reading `getAttribute('aria-valuenow')` directly on either of these two would incorrectly conclude no value is exposed at all. The shared display text is a single `<div class="text-secondary text-sm">Min: 20 / Max: 80</div>` sibling of both inputs (exact format `Min: {min} / Max: {max}`, confirmed live across 6+ distinct value changes). **[Most significant finding] Strict cross-field constraint — min must always be STRICTLY less than max (not less-than-or-equal), enforced identically across keyboard, click, and (by extension) drag interaction:** incremental single-step changes (`ArrowRight`/`ArrowLeft`/`ArrowUp`/`ArrowDown`) are permitted right up to the boundary and rejected with NO effect exactly at the point of violation (confirmed live, reproducibly: driving the min slider up via 59 consecutive `ArrowRight` presses from 20 successfully reached exactly 79 — one below the max slider's 80 — and a 60th `ArrowRight` press left it unchanged at 79; symmetrically, `ArrowLeft` on the max slider at 80 attempting to reach 79 left it unchanged at 80). Large discrete jumps (`Home`, `End`, `PageUp`, `PageDown`) that would land beyond the opposing boundary are FULLY REJECTED, leaving the value completely unchanged at its pre-press value — NOT clamped to the nearest valid boundary (confirmed live: pressing `End` on the min slider at 20, attempting to jump to 100 against a max of 80, left it unchanged at exactly 20, not clamped to 79; and a `PageUp` press that would land exactly at 80, e.g. from 70, was likewise fully rejected, value remaining unchanged at 70). A click that would place either slider's value in violation is also fully rejected (confirmed live: with min=79/max=80, a default center-click on the max slider — which per the click-quirk above targets value 50, well below the min of 79 — left the max slider unchanged at exactly 80).

**Cross-widget independence and reload persistence:** the basic slider and the range slider pair were confirmed fully independent — extensive interaction with either produced zero observable change in the other. **No state persists across a page reload for either widget:** after setting the basic slider to 100 and both range sliders to non-default values, reloading returned the basic slider to exactly 50, the min slider to exactly 20, and the max slider to exactly 80, with both display texts reverted to their exact default strings — confirmed via direct DOM re-inspection after `page.goto()`, matching the "no localStorage/sessionStorage/URL state" pattern documented across every other component plan in this repo.

**Purely client-side; no API coverage needed.** `browser_network_requests` was checked after extensive interaction across both widgets (every keyboard key, click, and a drag on the basic slider; boundary-triggering keyboard sequences on both range sliders) and zero XHR/fetch requests specific to any slider action were observed — only the same pre-existing Next.js RSC prefetch requests for unrelated nav links (`/`, `/components`, `/faq`) documented on every other component page in this suite. `browser_console_messages` with `level: error` and `all: true` returned 0 total messages after the entire exploration pass.

**Known bugs / notable quirks:**
1. **[Confirmed, most significant finding, not a bug]** The min/max range slider pair enforces a STRICT min-less-than-max constraint (a gap of 0 is never achievable) uniformly across keyboard single-step, keyboard large-jump, and click interaction — but large jumps (`Home`/`End`/`PageUp`/`PageDown`) that would violate it are fully REJECTED with the value left completely unchanged, while incremental single-step changes (`ArrowRight`/`ArrowLeft`) are permitted to climb right up to the boundary (stopping exactly at max-1 or min+1). A test author assuming a "jump" key would clamp to the nearest valid boundary value (like some MUI-based sliders do) rather than being fully rejected would write an incorrect assertion.
2. **[Confirmed, significant, addressed directly in the Page Object design]** A default, unpositioned Playwright `.click()` or element-to-element `.dragTo()` on any of these sliders always lands at the horizontal center of the target element's full bounding box (value 50 for a 0-100 range) — because every slider here is a native, always-full-track-width `input[type=range]`, this is true regardless of the slider's current displayed value or which sibling slider element is passed as a drag target. `SliderPage.ts`'s `setValueViaClick()` helper computes an explicit pixel offset for this reason; no scenario in this plan relies on a bare `.click()`/`.dragTo()` to reach any value other than 50.
3. **[Confirmed, testing-methodology guardrail, not a user-facing bug]** Directly setting the basic slider's `.value` DOM property via `page.evaluate()` and dispatching synthetic `input`/`change` events updates the `value` property itself but does NOT update `aria-valuenow` or the displayed `Value:` text, which remain driven exclusively by React's own controlled-input state and only update on a genuine trusted browser interaction. No real user can trigger this desync; it matters only because a test author might mistakenly reach for raw value-assignment (or Playwright's `.fill()`, which Playwright itself refuses to run against `input[type="range"]`) as a shortcut for "setting" a slider's value — this plan's scenarios never do so, using only real click/drag/keyboard interactions.
4. **[Confirmed, not a bug]** The basic slider has no accessible name (`aria-label`/`aria-labelledby` both `null`), while the min/max sliders each have a clear one (`"Minimum value"`/`"Maximum value"`) — a real, confirmed asymmetry worth asserting explicitly rather than assuming all three follow the same labeling convention.
5. **[Confirmed, not a bug]** The min/max sliders carry no `aria-valuenow`/`aria-valuemin`/`aria-valuemax` attributes in the DOM at all (unlike the basic slider, which explicitly sets all three) — yet their accessible current value is still correctly computed and exposed natively by the browser from the `value`/`min`/`max` IDL properties. A test reading `getAttribute('aria-valuenow')` on the min/max sliders to check "is a value exposed to assistive tech" would incorrectly conclude no value exists; the accessibility tree/snapshot must be used instead for these two specifically.

**Ambiguous/unverified areas explicitly flagged for testers:**
- This repo's `playwright.config.ts` runs three projects (`chromium`, `firefox`, `webkit`); all keyboard-increment findings above (especially the exact `PageUp`/`PageDown` = ±10 increment, and the `Home`/`End` full-jump behavior) were confirmed live only in a Chromium-based MCP session (`navigator.userAgent` confirmed `Chrome/151.0.7922.34`). Native `input[type=range]` keyboard-step behavior is known to vary somewhat by browser engine; the exact PageUp/PageDown increment and Home/End support should be independently verified per engine (or asserted tolerantly) before treating these as universal across all three configured browser projects.
- During one early exploration pass, an anomalous state was observed once (after a rapid, unchecked sequence of focus + two `PageUp` presses on the min slider): both the min and max sliders read `0`/`100` respectively and focus had moved to `<body>` instead of the expected `min=70`/`max=80`/focus-retained-on-min-slider outcome. Two separate, deliberate reproduction attempts afterward (one checking state after every single keypress, one replaying the exact original rapid-fire sequence) both completed normally to the expected state every time. Since this could not be reliably reproduced, it is flagged here as an observed-once anomaly rather than asserted as a confirmed, reproducible bug — testers should be aware it was seen, but this plan's scenarios do not assert against it as fact.
- Touch/mobile-specific interaction (tapping/dragging on an emulated touch viewport) was not independently exercised during this pass.
- The "BACK" button in the shared page header was not exercised, consistent with the treatment of this same shared control in every other component plan in this repo.
- Whether `Tab` continues in the expected natural DOM order from the max slider onward to the Insight section's Github link was only confirmed for the first hop (basic slider → min slider, confirmed live); the remainder of the tab sequence was not exhaustively walked.
- The precise pixel-rounding tolerance for drag-to-approximate-position scenarios (e.g. scenario 3.2 in the Click/Drag suite) was not characterized beyond a single live example (a full-track drag landing at exactly 0); a partial-track drag's exact resulting value for a given pixel offset was not independently reproduced multiple times to characterize rounding behavior precisely.

## Test Scenarios

### 1. Slider - Initial Load and Default State

**Seed:** `tests/seed.spec.ts`

#### 1.1. 1.1. Slider page loads with heading, both exercise sections, and Insight section correctly rendered — Priority: Critical

**File:** `tests/components/slider/slider-load.spec.ts`

**Steps:**
  1. Navigate to '/components/slider' on a fresh browser context
    - expect: Page loads successfully (HTTP 200, no console errors)
    - expect: Heading 'Slider' (level 1) is visible
  2. Inspect both 'form-label' elements in DOM order
    - expect: The two labels read exactly, in order: 'Adjust the slider to test min/max constraints' and 'Validate that the minimum value is always less than the maximum value'
  3. Inspect the 'Insight' section without performing any click/expand interaction
    - expect: Heading 'Insight' (level 2) is visible immediately with no interaction required
    - expect: The concept list contains exactly, in order: 'Drag a slider to a specific value', 'Validate min/max constraints', 'Validate range slider min/max relationship', 'Read current slider value', 'Update slider with keyboard'
    - expect: A 'Github solution' link is visible with href 'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/slider/slider.spec.ts'

#### 1.2. 1.2. Basic slider loads with its exact default value, bounds, and display text — Priority: Critical

**File:** `tests/components/slider/slider-load.spec.ts`

**Steps:**
  1. Navigate to '/components/slider'. Without interacting, read the basic slider's (data-testid='slider') value, min, max, step and its adjacent display text
    - expect: The input's value equals exactly '50'
    - expect: min='0', max='100', step='1'
    - expect: The adjacent 'Value: ' text reads exactly 'Value: 50'
    - expect: aria-valuenow, aria-valuemin, aria-valuemax attributes are present directly on the input and equal '50', '0', '100' respectively (confirmed live — this input, unlike the two range sliders below, explicitly sets these ARIA attributes in the DOM rather than relying purely on the browser's native computation from value/min/max)

#### 1.3. 1.3. Range slider pair loads with exact default values, bounds, and combined display text — Priority: Critical

**File:** `tests/components/slider/slider-load.spec.ts`

**Steps:**
  1. Navigate to '/components/slider'. Without interacting, read the min slider (data-testid='min-slider') and max slider (data-testid='max-slider') values, min/max, and the shared display text
    - expect: The min slider's value equals exactly '20'; the max slider's value equals exactly '80'
    - expect: Both inputs have min='0' and max='100'; step attribute is absent/empty on both (native default step of 1 applies — confirmed live via single-step keyboard presses moving the value by exactly 1)
    - expect: The shared display text reads exactly 'Min: 20 / Max: 80'
    - expect: Neither the min slider nor the max slider has an aria-valuenow, aria-valuemin, or aria-valuemax attribute present in the DOM at all (getAttribute returns null for each) — a direct, confirmed contrast with the basic slider in scenario 1.2, which explicitly sets all three. The accessible value is still correctly exposed to assistive tech via the browser's native computation from the value/min/max IDL properties (confirmed via the accessibility tree reporting slider 'Minimum value': '20'), so a test reading the accessible/computed value must not rely on the aria-valuenow attribute for these two sliders specifically — only for the basic slider from 1.2.

#### 1.4. 1.4. The component is confirmed to be built on native input[type=range] elements, not a MUI Slider, and all three data-testids are globally unique on the page — Priority: High

**File:** `tests/components/slider/slider-load.spec.ts`

**Steps:**
  1. Navigate to '/components/slider'. Query the DOM for '.MuiSlider-root' and '.MuiSlider-thumb', and separately query for every element matching '[data-testid="slider"]', '[data-testid="min-slider"]', '[data-testid="max-slider"]'
    - expect: Zero elements match '.MuiSlider-root' and zero match '.MuiSlider-thumb' anywhere on the page, confirming this component is NOT built on MUI's Slider (a direct, confirmed contrast with this repo's Window and Calendar components, both of which are MUI-based)
    - expect: Exactly one element matches each of '[data-testid="slider"]', '[data-testid="min-slider"]', '[data-testid="max-slider"]' (all three are globally unique on the page — unlike the duplicate-testid situations documented in this repo's Window, Calendar, and Radio plans, no '.first()'/'.last()' or accessible-name fallback locator pattern is required here; page.getByTestId() resolves each unambiguously)

### 2. Slider - Keyboard Interaction (Basic Slider)

**Seed:** `tests/seed.spec.ts`

#### 2.1. 2.1. ArrowRight and ArrowLeft change the value by exactly the step size (1) — Priority: Critical

**File:** `tests/components/slider/slider-keyboard.spec.ts`

**Steps:**
  1. Navigate to '/components/slider'. Focus the basic slider (data-testid='slider', starts at 50) and press 'ArrowRight' once
    - expect: The input's value equals exactly '51'
  2. Press 'ArrowLeft' twice
    - expect: The input's value equals exactly '49' (51 - 1 - 1), confirming ArrowLeft decreases by exactly 1 per press, matching ArrowRight's increment magnitude in the opposite direction

#### 2.2. 2.2. ArrowUp and ArrowDown behave identically to ArrowRight and ArrowLeft respectively (+1/-1) — Priority: Medium

**File:** `tests/components/slider/slider-keyboard.spec.ts`

**Steps:**
  1. Navigate to '/components/slider'. Focus the basic slider (value 50) and press 'ArrowUp' once, then 'ArrowDown' twice
    - expect: After ArrowUp: value equals exactly '51'
    - expect: After the two ArrowDown presses: value equals exactly '49', confirming ArrowUp/ArrowDown are functionally equivalent to ArrowRight/ArrowLeft for this horizontal slider (both move by exactly 1 per press)

#### 2.3. 2.3. Home jumps directly to the minimum (0); End jumps directly to the maximum (100) — Priority: Critical

**File:** `tests/components/slider/slider-keyboard.spec.ts`

**Steps:**
  1. Navigate to '/components/slider'. Focus the basic slider (value 50) and press 'Home'
    - expect: The input's value equals exactly '0' in a single keypress (not a gradual decrement)
  2. Press 'End'
    - expect: The input's value equals exactly '100' in a single keypress
  3. Press 'ArrowLeft' once while at value 0 (after a fresh Home press), and separately press 'ArrowRight' once while at value 100 (after a fresh End press)
    - expect: Pressing ArrowLeft at value 0 leaves the value unchanged at exactly '0' (clamped at the minimum, no negative overflow)
    - expect: Pressing ArrowRight at value 100 leaves the value unchanged at exactly '100' (clamped at the maximum, no overflow past 100)

#### 2.4. 2.4. PageUp and PageDown change the value by exactly 10 (confirmed live in Chromium; see Ambiguous section for cross-engine caveat) — Priority: High

**File:** `tests/components/slider/slider-keyboard.spec.ts`

**Steps:**
  1. Navigate to '/components/slider'. Focus the basic slider (value 50) and press 'PageDown' once
    - expect: The input's value equals exactly '40' (50 - 10)
  2. Press 'PageUp' twice
    - expect: The input's value equals exactly '60' (40 + 10 + 10), confirming PageUp/PageDown move by exactly 10 per press in this browser engine — if this repo's firefox/webkit projects report a different increment, treat the increment as engine-dependent (see this plan's Ambiguous section) rather than assuming this exact value holds universally

#### 2.5. 2.5. aria-valuenow and the displayed 'Value:' text remain in sync with the input's value after every keyboard interaction — Priority: High

**File:** `tests/components/slider/slider-keyboard.spec.ts`

**Steps:**
  1. Navigate to '/components/slider'. Focus the basic slider and perform a sequence of keyboard interactions: ArrowRight x3, Home, End, PageDown, checking after each individual keypress
    - expect: After every single keypress in the sequence, the input's 'aria-valuenow' attribute exactly equals its current 'value' property (as a string), and the adjacent text node reads exactly 'Value: ' followed by that same value — confirmed never to drift out of sync at any point in the sequence

### 3. Slider - Click and Drag Interaction (Basic Slider)

**Seed:** `tests/seed.spec.ts`

#### 3.1. 3.1. Clicking at the horizontal center of the track sets the value to 50 regardless of the slider's current value — Priority: Critical

**File:** `tests/components/slider/slider-click-drag.spec.ts`

**Steps:**
  1. Navigate to '/components/slider'. Focus the basic slider and press 'End' to move it to 100 (away from center), then click the slider element using Playwright's default center-of-element click (no explicit position offset)
    - expect: After the click, the input's value equals exactly '50' (the value corresponding to the exact horizontal midpoint of the 0-100 range) — confirming native input[type=range] click-to-position behavior: a real, trusted click jumps the value directly to the position clicked, unlike a MUI Slider which typically requires interacting with a thumb element
    - expect: aria-valuenow and the 'Value:' text both read '50' as well, confirming a real trusted click correctly updates React's controlled state (a direct, confirmed contrast with scenario 3.4's raw-DOM-manipulation quirk, which does NOT keep these in sync)

#### 3.2. 3.2. Dragging the slider to a specific screen position moves the value toward that position, staying in sync throughout — Priority: Critical

**File:** `tests/components/slider/slider-click-drag.spec.ts`

**Steps:**
  1. Navigate to '/components/slider' (basic slider starts at 50). Perform a real Playwright drag from the basic slider's current thumb position to a point at approximately 10% of the way along the track's own bounding box (computed via boundingBox(), not a fixed pixel offset), using page.mouse down/move/up so the drag is a genuine trusted pointer sequence
    - expect: After the drag completes, the input's value is approximately 10 (within a small tolerance for pixel-rounding, e.g. 8-12), confirmed via reading the 'value' property directly — a materially different, correctly-lower value than the starting 50, and not equal to 0 or 100 (ruling out a click-only jump-to-extreme fallback)
    - expect: aria-valuenow and the 'Value:' text both equal the input's final 'value' exactly, confirming the drag's final drop position correctly updated React's state end-to-end (matching the deliberately full-viewport-drag confirmation done live during this plan's own exploration, which dragged from center to a far-left target and observed the value land at exactly 0 with aria-valuenow/text both in sync)

#### 3.3. 3.3. [QUIRK] Default center-targeted click()/dragTo(otherElement) interactions always land at value 50, regardless of the current thumb position or which element is passed as a drag target — Priority: High

**File:** `tests/components/slider/slider-click-drag.spec.ts`

**Steps:**
  1. Navigate to '/components/slider'. On the min/max range slider pair (min=20, max=80 by default), perform a default (no position override) Playwright drag from the min slider to the max slider element (dragTo an entirely different, non-overlapping-in-value element)
    - expect: The min slider's resulting value equals exactly '50' — NOT a value near 80 (the max slider's own current value) — confirming that because both are native input[type=range] elements always spanning the FULL track width regardless of their current thumb position, a default element-to-element dragTo() or a plain .click() always resolves to the horizontal CENTER of the target element's bounding box, i.e. always value 50 for a 0-100 range, irrespective of which slider element is referenced as the target or what value it currently displays
    - expect: Note for implementation: any scenario needing to set an EXACT non-50 value via click/drag must compute the target pixel x-offset manually from the slider's boundingBox() and the value-to-fraction formula (targetX = box.x + (targetValue - min) / (max - min) * box.width) and use a positioned click/mouse action — this is exactly the pattern SliderPage.ts's setValueViaClick()/dragSliderToValue() helpers must implement, per this plan's Page Object section

#### 3.4. 3.4. [QUIRK, informational, testing-methodology guardrail] Programmatically setting the input's .value property via a raw DOM/page.evaluate call, bypassing React's synthetic event handling, desynchronizes aria-valuenow and the displayed text from the actual value — Priority: Low

**File:** `tests/components/slider/slider-click-drag.spec.ts`

**Steps:**
  1. Navigate to '/components/slider'. Via page.evaluate, directly set the basic slider's '.value' property to a new value and dispatch synthetic 'input' and 'change' Events (bubbles: true) on it, WITHOUT any real trusted click/keyboard/drag interaction
    - expect: The input's 'value' DOM property/attribute reflects the newly-assigned value
    - expect: aria-valuenow and the adjacent 'Value:' text remain UNCHANGED at whatever value they held before this evaluate call (confirmed live: setting .value to '50' via evaluate while React's own last-known state was '99' left aria-valuenow/text reading '99', not '50') — confirming these two are driven exclusively by React's own controlled-input state, which only updates on a genuine trusted browser interaction event, not a synthetic one dispatched from page.evaluate. This is a testing-methodology finding, not a user-facing bug (no real user can bypass React's event system this way) — documented so no test in this suite is ever written using direct .value assignment or Playwright's unsupported locator.fill() (which Playwright itself refuses to run against input[type="range"]) as a shortcut for 'setting' a slider's value; only real click/drag/keyboard interactions may be used.

### 4. Slider - Range Slider Min/Max Constraint

**Seed:** `tests/seed.spec.ts`

#### 4.1. 4.1. Incrementing the min slider via ArrowRight is hard-blocked exactly one step below the max slider's current value, never reaching or exceeding it — Priority: Critical

**File:** `tests/components/slider/slider-range-constraint.spec.ts`

**Steps:**
  1. Navigate to '/components/slider' (min=20, max=80 by default). Focus the min slider and press 'ArrowRight' repeatedly (59 times) to drive it up toward the max slider's value
    - expect: The min slider's value increases by exactly 1 per press for every press that keeps it strictly below 80, ultimately reaching exactly '79' (max - 1) — confirmed reproducible live during this plan's own exploration across this exact climb
  2. Press 'ArrowRight' one more time (an attempt to reach 80, equal to the max slider's value)
    - expect: The min slider's value remains unchanged at exactly '79' — the keypress has NO effect, confirming the app enforces a STRICT inequality (min must be less than max, not less-than-or-equal), and that the max slider's own value (80) remains unchanged at '80' throughout, confirmed unaffected by this rejected attempt on the min slider

#### 4.2. 4.2. Decrementing the max slider via ArrowLeft is hard-blocked exactly one step above the min slider's current value, never reaching or going below it — Priority: Critical

**File:** `tests/components/slider/slider-range-constraint.spec.ts`

**Steps:**
  1. Navigate to '/components/slider' (min=20, max=80). Drive the min slider up to exactly 79 via repeated ArrowRight presses (per scenario 4.1's confirmed climb). Then focus the max slider (still at 80) and press 'ArrowLeft' once, attempting to reach 79 (equal to the min slider's value)
    - expect: The max slider's value remains unchanged at exactly '80' — the keypress has NO effect, confirming the same strict-inequality constraint is enforced symmetrically from the max side, and the min slider's value remains unchanged at '79' throughout

#### 4.3. 4.3. A large keyboard jump (Home/End, PageUp/PageDown) that would land beyond the opposing boundary is fully rejected with the value left completely unchanged — not clamped to the nearest valid value — Priority: High

**File:** `tests/components/slider/slider-range-constraint.spec.ts`

**Steps:**
  1. Navigate to '/components/slider' (min=20, max=80). Focus the min slider and press 'End' (an attempt to jump directly to 100, the native absolute maximum, which would badly violate the min<max constraint against max=80)
    - expect: The min slider's value remains completely unchanged at exactly '20' (its pre-press value) — NOT clamped to 79 (max - 1, the nearest theoretically-valid value) — confirming this app's constraint-enforcement fully rejects an out-of-bounds discrete jump rather than clamping it to the nearest valid boundary, a distinct behavior from the incremental single-step ArrowRight case in scenario 4.1, which DOES let the value climb all the way up to the boundary
  2. Focus the min slider (still at 20) and press 'PageUp' three times in sequence (20 -> 30 -> 40 -> 50, each individually valid since max is 80), then press 'PageUp' a fourth time (an attempt to jump from 50 to 60, still valid) and continue until an attempted PageUp would land at or past 80
    - expect: Each PageUp press that keeps the resulting value strictly below 80 succeeds, advancing by exactly 10 each time (confirmed live for the 50->60->70 portion of this exact climb)
    - expect: The specific PageUp press that would land the value at exactly 80 (equal to max) is fully rejected — the value remains unchanged at its pre-press value (e.g. 70), confirmed live during this plan's own exploration

#### 4.4. 4.4. A click on the track that would place a slider's value in violation of the min<max constraint is also fully rejected — Priority: High

**File:** `tests/components/slider/slider-range-constraint.spec.ts`

**Steps:**
  1. Navigate to '/components/slider' (min=20, max=80). Drive the min slider up to exactly 79 via repeated ArrowRight presses (min=79, max=80). Then perform a default (center-of-element) click directly on the max slider — which, per scenario 3.3's confirmed quirk, targets value 50 (well below the current min of 79)
    - expect: The max slider's value remains unchanged at exactly '80' after the click — the click has NO effect, confirming click-based (not just keyboard-based) attempts to violate the strict min<max constraint are equally rejected, and the min slider's value remains unchanged at '79'

#### 4.5. 4.5. Both sliders can be freely repositioned to any pair of values as long as min remains strictly less than max (happy path) — Priority: Critical

**File:** `tests/components/slider/slider-range-constraint.spec.ts`

**Steps:**
  1. Navigate to '/components/slider'. Using the min slider's ArrowRight/ArrowLeft keys, move it from 20 to exactly 30 (10 presses). Using the max slider's ArrowLeft/ArrowRight keys, move it from 80 to exactly 70 (10 presses)
    - expect: The min slider's final value equals exactly '30'
    - expect: The max slider's final value equals exactly '70'
    - expect: Both changes succeed with no rejection at any intermediate step (since 30 < 70 holds throughout the entire sequence, regardless of the order the two sliders are adjusted in)
    - expect: The shared display text reads exactly 'Min: 30 / Max: 70'

### 5. Slider - Bounds and Edge Cases (Boundary Value Analysis)

**Seed:** `tests/seed.spec.ts`

#### 5.1. 5.1. Basic slider: value cannot go below its absolute minimum (0) or above its absolute maximum (100), confirmed at, just-below (via clamping), and just-above the limits — Priority: High

**File:** `tests/components/slider/slider-bounds.spec.ts`

**Steps:**
  1. Navigate to '/components/slider'. Focus the basic slider, press 'Home' (value becomes 0 — AT the minimum boundary), then press 'ArrowLeft' once (an attempt to go just-below the minimum)
    - expect: Value is exactly '0' after Home
    - expect: Value remains exactly '0' after the ArrowLeft attempt (clamped, no negative value ever produced, no error thrown)
  2. Press 'End' (value becomes 100 — AT the maximum boundary), then press 'ArrowRight' once (an attempt to go just-above the maximum)
    - expect: Value is exactly '100' after End
    - expect: Value remains exactly '100' after the ArrowRight attempt (clamped, no value exceeding 100 ever produced)

#### 5.2. 5.2. Range slider pair: the min slider cannot go below the absolute floor (0) and the max slider cannot exceed the absolute ceiling (100), independent of the cross-field constraint — Priority: Medium

**File:** `tests/components/slider/slider-bounds.spec.ts`

**Steps:**
  1. Navigate to '/components/slider'. Focus the min slider (starts at 20) and press 'Home'
    - expect: The min slider's value equals exactly '0' (the native absolute floor is reachable, since the max slider's value of 80 poses no obstruction at the low end)
  2. Focus the max slider (starts at 80) and press 'End'
    - expect: The max slider's value equals exactly '100' (the native absolute ceiling is reachable, since the min slider's value of 0 — or whatever it holds after the prior step — poses no obstruction at the high end)

#### 5.3. 5.3. The smallest valid gap between min and max is exactly 1 (the step size); a gap of 0 is never achievable via keyboard stepping — Priority: High

**File:** `tests/components/slider/slider-bounds.spec.ts`

**Steps:**
  1. Navigate to '/components/slider' (min=20, max=80). Drive the min slider up via 59 consecutive ArrowRight presses to reach exactly 79 (one below the max slider's 80)
    - expect: The min slider's value equals exactly '79' — a valid, accepted state with a gap of exactly 1 between min (79) and max (80)
  2. Attempt one further ArrowRight press on the min slider (which would close the gap to 0, min=max=80)
    - expect: The min slider's value remains unchanged at exactly '79' — confirming a gap of 0 between min and max is never achievable via single-step keyboard interaction, and 1 (the step size) is the smallest valid gap this component allows

### 6. Slider - Accessibility / ARIA

**Seed:** `tests/seed.spec.ts`

#### 6.1. 6.1. The basic slider's role is 'slider' but it has NO accessible name (no aria-label or aria-labelledby) — Priority: Medium

**File:** `tests/components/slider/slider-aria.spec.ts`

**Steps:**
  1. Navigate to '/components/slider'. Inspect the basic slider's role (implicit from input[type=range]), and its 'aria-label' and 'aria-labelledby' attributes
    - expect: The element's implicit ARIA role is 'slider' (confirmed via the accessibility tree, since no explicit role attribute is present — role='slider' is the native implicit role of input[type=range])
    - expect: getAttribute('aria-label') returns null and getAttribute('aria-labelledby') returns null — confirming this slider has NO accessible name at all, a real, confirmed accessibility gap distinct from the two range sliders in scenario 6.2 below, which DO have one

#### 6.2. 6.2. The min and max range sliders each have a distinct, correct accessible name via aria-label — Priority: High

**File:** `tests/components/slider/slider-aria.spec.ts`

**Steps:**
  1. Navigate to '/components/slider'. Locate sliders by accessible role+name: getByRole('slider', { name: 'Minimum value', exact: true }) and getByRole('slider', { name: 'Maximum value', exact: true })
    - expect: Each resolves to exactly 1 element (unique, unambiguous accessible names)
    - expect: The 'Minimum value'-named slider's data-testid equals exactly 'min-slider', and the 'Maximum value'-named slider's data-testid equals exactly 'max-slider', confirming the aria-label values correctly correspond to their respective inputs

#### 6.3. 6.3. All three sliders' accessible min/max/current-value are always correct, whether exposed via explicit ARIA attributes or the browser's native computation — Priority: Critical

**File:** `tests/components/slider/slider-aria.spec.ts`

**Steps:**
  1. Navigate to '/components/slider'. For the basic slider, read its aria-valuenow/aria-valuemin/aria-valuemax attributes directly. For the min and max sliders, read the accessibility tree's reported current value via the accessibility snapshot (role=slider, since no aria-valuenow attribute exists on these two per scenario 1.3) instead of the attribute
    - expect: Basic slider: aria-valuenow='50', aria-valuemin='0', aria-valuemax='100' (matching its DOM value/min/max exactly, on fresh load)
    - expect: Min slider: accessibility-tree-reported value is '20' (matching its 'value' property, computed natively by the browser from the absent-aria-valuenow input, not from any explicit attribute)
    - expect: Max slider: accessibility-tree-reported value is '80', likewise natively computed
    - expect: After changing the basic slider's value via a real ArrowRight press (per scenario 2.1), its aria-valuenow attribute updates to match the new value exactly — confirming this explicit-attribute approach stays correctly synced with genuine interaction, not merely correct on initial load

### 7. Slider - Reload Persistence

**Seed:** `tests/seed.spec.ts`

#### 7.1. 7.1. No slider value persists across a page reload — all three inputs reset to their documented fresh-load defaults — Priority: Critical

**File:** `tests/components/slider/slider-persistence.spec.ts`

**Steps:**
  1. Navigate to '/components/slider'. Change the basic slider to 100 (via 'End'), the min slider to a different value via ArrowRight presses, and the max slider to a different value via ArrowLeft presses
    - expect: Before reload: the basic slider's value equals '100', and the min/max sliders both reflect the just-performed non-default changes
  2. Reload the page (page.reload())
    - expect: The basic slider's value is exactly '50' again (the documented fresh-load default), with its 'Value: 50' text and aria-valuenow='50' restored
    - expect: The min slider's value is exactly '20' again and the max slider's value is exactly '80' again, with the shared 'Min: 20 / Max: 80' text restored — confirming no localStorage/sessionStorage/URL state is involved for any of the three sliders, matching the pattern documented across every other component plan in this repo

### 8. Slider - Console Behavior

**Seed:** `tests/seed.spec.ts`

#### 8.1. [DROPPED — not implemented] 8.1. No console errors are logged during extensive interaction with either exercise — Priority: Medium

Dropped from implementation per explicit product decision (the file was removed after initial implementation). No console-error test is maintained for this component.

**File (removed):** `tests/components/slider/slider-console.spec.ts`

**Steps:**
  1. Navigate to '/components/slider', begin tracking console errors, then perform a broad interaction sequence: all keyboard keys on the basic slider (Arrow x4, Home, End, PageUp, PageDown), a click and a drag on the basic slider, and enough min/max slider ArrowRight/ArrowLeft presses on the range pair to trigger the constraint-rejection boundary at least twice (once from each side)
    - expect: Zero console error messages are logged throughout the entire sequence, matching the clean-console baseline (0 errors) observed live during this plan's own exploration of this exact interaction breadth, including during the boundary-rejection attempts

#### 8.2. [DROPPED — not implemented] 8.2. No XHR/fetch network requests fire as a result of any slider interaction (purely client-side component) — Priority: Medium

Dropped from implementation per explicit product decision: this component has zero backing API calls of any kind (confirmed via browser_network_requests during planning — see Application Overview), so a standalone network-request-count test was judged to add no value beyond what's already established.

**File (removed):** `tests/components/slider/slider-network-console.spec.ts`

**Steps:**
  1. Navigate to '/components/slider', begin recording network requests, then interact broadly across both exercises (keyboard, click, and drag on the basic slider; boundary-testing keyboard presses on both range sliders)
    - expect: No XHR/fetch network request specific to any slider action is observed — only the same pre-existing Next.js RSC prefetch requests for unrelated nav links documented on every other component page in this suite, confirming this plan requires no API-level test coverage (consistent with the live observation made during this plan's own exploration: only 3 pre-existing prefetch GET requests for '/', '/components', '/faq' were present, none newly triggered by any slider interaction)
