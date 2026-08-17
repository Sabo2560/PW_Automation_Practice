# Button Component Test Plan

## Application Overview

The Button component (https://www.automationplayground.dev/components/button) is a static page (heading "Button", level 1) presenting six independent, unrelated buttons, each demonstrating a different button-interaction behavior, plus an "Insight" (h2) section that is fully visible without any expand/click interaction (unlike the Input component's ambiguous Insight section) listing the concepts the exercise covers and a "Github solution" reference link. All interactions on this page are purely client-side — no XHR/fetch network requests were observed firing during exploration of any button (only pre-existing Next.js RSC prefetch requests for unrelated site navigation links were present in the network log, the same pattern documented on the Form and Advanced Table pages) — so this plan contains no API-level test coverage.

Key elements (verified via `data-testid` attributes and live DOM inspection):
- `[data-testid="button-go-home"]` — `<button type="button">` text "Go Home", wrapped inside an `<a href="/">` link with NO `target` attribute (navigates in the same tab, not a new one). Preceded by label text "Go home and come back here using driver command".
- `[data-testid="button-find-location"]` — `<button type="button">` text "Find Location", not disabled. Preceded by label text "Get the X & Y co-ordinates".
- `[data-testid="button-find-color"]` — `<button type="button">` text "What is my color?", not disabled, class includes `bg-pink-400`, computed `backgroundColor` resolves to `rgb(244, 114, 182)`. Preceded by label text "Find the color of the button".
- `[data-testid="button-find-height-width"]` — `<button type="button">` text "What are my height and width?", not disabled. Preceded by label text "Find the height & width of the button".
- `[data-testid="button-disabled-button"]` — `<button type="button" disabled>` text "Disabled button", confirmed `.disabled === true` and `.onclick === null` (no click handler bound at all). Preceded by label text "Confirm button is disabled".
- `[data-testid="hold-button"]` — `<button>` (no `type` attribute) text "Click and Hold", not disabled. Preceded by label text "Click and Hold Button".

No other interactive elements are specific to this component besides these six buttons, the shared site header (branding, nav, "BACK" button), and the "Insight" section's "Github solution" link.

Confirmed default/fresh state (page reload, no interaction): all six buttons are visible and enabled except the disabled button; no result/feedback text (e.g. no "You held the button for..." text, no "Holding..." text) exists anywhere in the DOM; the Insight section and its 8-item concept list and "Github solution" link are already fully visible without needing any click/expand action.

Confirmed behaviors:
- Clicking "Go Home" (via its wrapping `<a href="/">`) navigates the browser to the home page in the SAME tab; the home page's hero heading becomes visible confirming successful navigation.
- "Find Location", "Find Color" (What is my color?), and "Find Height & Width" (What are my height and width?) buttons each produce ZERO visible DOM/text change when clicked (confirmed via accessibility-tree snapshot diff before/after each click) — these are "invisible-result" exercises where verification is meant to be done by reading the button's own properties directly (`boundingBox()` for position/size, computed `backgroundColor` + class list for color) rather than by any displayed feedback text.
- The disabled button has the native `disabled` HTML property set to `true` and no `onclick` handler bound; it is inherently non-interactive/non-focusable per standard browser semantics for disabled form controls.
- The "Click and Hold" button (`hold-button`) tracks mouse-hold duration via `mousedown`/`mouseup`/`mouseleave` listeners (confirmed to be mouse-event-driven, NOT keyboard-driven — see gap below):
  - On `mousedown`, the button's own visible text changes from "Click and Hold" to a "Holding..." message of the form "Holding... (N ms)", where N updates roughly every ~100ms (an interval-based tick, empirically observed, not read from source) reflecting elapsed hold time.
  - On `mouseup` while still positioned over the button, the text reverts to exactly "Click and Hold" and a new paragraph appears below it reading "You held the button for N ms" (N being the elapsed duration at release).
  - A near-instantaneous click (Playwright's default `.click()`, which fires `mousedown` immediately followed by `mouseup`) consistently reports "You held the button for 0 ms" (confirmed via repeated exploration) and does not visibly display a "Holding..." state (too fast to observe).
  - Repeated interactions correctly REPLACE the single result paragraph rather than appending/duplicating it — confirmed via `dblclick()` producing exactly one result paragraph in the DOM, not two.
  - **Confirmed edge-case behavior:** moving the mouse away from the button (`mouseleave`) while the mouse button is still physically held down ends the hold interaction immediately and identically to a `mouseup` — the button text reverts to "Click and Hold" and the "You held the button for N ms" result paragraph appears right away, using the elapsed value at the moment of leaving (not the value at the eventual real mouseup, which may occur later and/or elsewhere on the page). Releasing the physical mouse button afterwards — whether back over the button or elsewhere — produces no further change to the already-displayed result text. Confirmed reproducible across two independent exploration passes.
- No JavaScript console errors (warnings or errors) were observed during any exploration flow (simple clicks, hold/release, mouseleave-during-hold, keyboard-hold attempt, disabled-button inspection).

Known bugs / notable gaps:
1. **[GAP — accessibility]** The Click and Hold button's hold-tracking logic is implemented purely via mouse events (`mousedown`/`mouseup`/`mouseleave`) with no keyboard equivalent. Confirmed by focusing the button and holding the Enter key down for 300ms+: the button's text never changes to a "Holding..." state, and no "You held the button for..." result text ever appears. A keyboard-only user cannot trigger or complete this interaction at all. Documented as a defect-candidate for the dev team (recommend adding `keydown`/`keyup` handling equivalent to the mouse handlers).
2. **[Notable non-bug behavior, worth explicit regression coverage]** Moving the mouse off the Click and Hold button while still pressed down ends the hold immediately via `mouseleave` rather than continuing to track until the actual `mouseup` occurs. This may or may not be the intended design, but it is surprising enough (differs from a "hold anywhere until release" pattern one might expect) that it should be locked in with an explicit test rather than left undocumented, consistent with this project's practice of documenting confirmed non-obvious behaviors (e.g. the Advanced Table's whitespace-search behavior, the Form's whitespace-required-field behavior).

Ambiguous/unverified areas explicitly flagged for testers:
- The precise interval/tick rate driving the "Holding... (N ms)" text updates was empirically observed to be approximately 100ms per update across two sampling passes, but the exact interval value in the underlying implementation was not read from source. Tests should assert on approximate/bounded values (e.g. "greater than 0" and "within a reasonable tolerance of the wall-clock duration the test itself measured") rather than an exact millisecond figure, since exact timing is inherently non-deterministic in browser automation.
- The exact CSS classes/colors of the "Find Location" and "Find Height & Width" buttons were not individually captured during exploration (only "Find Color" was, since its own exercise is specifically about reading color) — if a future scenario needs to assert exact styling on those two buttons, capture their classes freshly at implementation time.
- Whether pressing the Space key (in addition to Enter) on a keyboard-focused hold button also fails to trigger the hold behavior was not independently tested (only Enter was tested) — expected to behave identically per standard button semantics, but not directly confirmed.
- Behavior on touch/mobile viewports (i.e., whether the hold interaction responds to `touchstart`/`touchend` in addition to or instead of mouse events) was not exercised during this exploration pass.
- The "BACK" button in the page header (shared across all component pages) was not exercised as part of this plan since it is not specific to the Button component's own functionality, consistent with the Form and Input plans' treatment of this same shared control.

## Test Scenarios

### 1. Button - Initial Load and Default State

**Seed:** `tests/seed.spec.ts`

#### 1.1. Button page loads with all six buttons, labels, and the Insight section correctly rendered

**File:** `tests/components/button/button-load.spec.ts`

**Steps:**
  1. Navigate to '/components/button' on a fresh browser context
    - expect: Page loads successfully (HTTP 200, no console errors)
    - expect: Heading 'Button' (level 1) is visible
  2. Inspect all six buttons and their preceding label text
    - expect: '[data-testid="button-go-home"]' is visible, enabled, with text 'Go Home', preceded by label text 'Go home and come back here using driver command'
    - expect: '[data-testid="button-find-location"]' is visible, enabled, with text 'Find Location', preceded by label text 'Get the X & Y co-ordinates'
    - expect: '[data-testid="button-find-color"]' is visible, enabled, with text 'What is my color?', preceded by label text 'Find the color of the button'
    - expect: '[data-testid="button-find-height-width"]' is visible, enabled, with text 'What are my height and width?', preceded by label text 'Find the height & width of the button'
    - expect: '[data-testid="button-disabled-button"]' is visible, DISABLED, with text 'Disabled button', preceded by label text 'Confirm button is disabled'
    - expect: '[data-testid="hold-button"]' is visible, enabled, with text exactly 'Click and Hold', preceded by label text 'Click and Hold Button'
  3. Inspect the 'Insight' section without performing any click/expand interaction
    - expect: Heading 'Insight' (level 2) is visible immediately, with no interaction required to reveal it
    - expect: The concept list is visible and contains at least the items 'Click buttons and verify results' and 'Verify disabled button state'
    - expect: A 'Github solution' link is visible with href 'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/button/button.spec.ts'

#### 1.2. No result/feedback text exists anywhere on the page before any button has been interacted with

**File:** `tests/components/button/button-load.spec.ts`

**Steps:**
  1. Navigate to '/components/button' and scan the full page for any pre-existing result or hold-state text
    - expect: No element containing the text 'You held the button for' exists anywhere in the DOM
    - expect: No element containing the text 'Holding...' exists anywhere in the DOM

### 2. Button - Go Home Navigation

**Seed:** `tests/seed.spec.ts`

#### 2.1. Clicking 'Go Home' navigates to the home page in the same tab

**File:** `tests/components/button/button-navigation.spec.ts`

**Steps:**
  1. Navigate to '/components/button' and inspect the wrapping '<a>' element around '[data-testid="button-go-home"]' without clicking
    - expect: The wrapping link's href attribute equals '/'
    - expect: The wrapping link has no 'target' attribute set (i.e., not '_blank'), confirming same-tab navigation is expected
  2. Click '[data-testid="button-go-home"]'
    - expect: The browser navigates to '/' within the SAME tab/page (no new tab or window is opened)
    - expect: The home page's hero heading 'The Library of Components for Automation Testing' (level 1) becomes visible, confirming successful navigation to the home page

### 3. Button - Informational Property Buttons (Find Location / Find Color / Find Height & Width)

**Seed:** `tests/seed.spec.ts`

#### 3.1. 'Find Location' button reports a position fully within the visible viewport, and clicking it produces no visible page change

**File:** `tests/components/button/button-info.spec.ts`

**Steps:**
  1. Navigate to '/components/button' and read '[data-testid="button-find-location"]''s bounding box via boundingBox(), along with the current viewport size
    - expect: The button's x coordinate is >= 0 and y coordinate is >= 0
    - expect: The sum of the button's x coordinate and its width is <= the viewport's width, i.e. the button lies entirely within the visible viewport horizontally
  2. Capture an accessibility-tree/DOM snapshot of the page, click '[data-testid="button-find-location"]', then capture the snapshot again
    - expect: The two snapshots are identical apart from the clicked button's own transient focus/active state — no new text, element, or visible feedback appears anywhere on the page as a result of the click

#### 3.2. 'Find Color' (What is my color?) button exposes its background color via CSS class and computed style, and clicking it produces no visible page change

**File:** `tests/components/button/button-info.spec.ts`

**Steps:**
  1. Navigate to '/components/button' and inspect '[data-testid="button-find-color"]''s class attribute and computed style
    - expect: The button's class attribute includes the substring 'bg-pink-400'
    - expect: The button's computed 'backgroundColor' style equals exactly 'rgb(244, 114, 182)'
  2. Click '[data-testid="button-find-color"]'
    - expect: No new text, element, or visible feedback appears anywhere on the page as a result of the click

#### 3.3. 'Find Height & Width' (What are my height and width?) button reports positive dimensions, and clicking it produces no visible page change

**File:** `tests/components/button/button-info.spec.ts`

**Steps:**
  1. Navigate to '/components/button' and read '[data-testid="button-find-height-width"]''s bounding box via boundingBox()
    - expect: The button's reported width is greater than 0
    - expect: The button's reported height is greater than 0
  2. Click '[data-testid="button-find-height-width"]'
    - expect: No new text, element, or visible feedback appears anywhere on the page as a result of the click

### 4. Button - Disabled State

**Seed:** `tests/seed.spec.ts`

#### 4.1. Disabled button cannot be focused or clicked, and has no click handler bound

**File:** `tests/components/button/button-disabled.spec.ts`

**Steps:**
  1. Navigate to '/components/button' and inspect '[data-testid="button-disabled-button"]'
    - expect: Playwright's toBeDisabled() assertion passes for this element
    - expect: The button's 'disabled' DOM property equals true
    - expect: The button's 'onclick' property equals null, confirming no click handler is bound to it at all
  2. Attempt to dispatch a forced click on '[data-testid="button-disabled-button"]' (bypassing Playwright's normal actionability check, e.g. via { force: true })
    - expect: No visible page/DOM change results anywhere on the page from the forced click attempt (no result text appears, no navigation occurs), confirming the disabled button performs no action even if a click event were somehow dispatched to it

### 5. Button - Click and Hold Timer

**Seed:** `tests/seed.spec.ts`

#### 5.1. An instantaneous click (no meaningful hold duration) reports 0 ms and does not leave the button stuck in a Holding state

**File:** `tests/components/button/button-hold.spec.ts`

**Steps:**
  1. Navigate to '/components/button' and perform a standard, instantaneous Playwright '.click()' on '[data-testid="hold-button"]'
    - expect: A paragraph of the form 'You held the button for N ms' becomes visible below the button, where N is a non-negative integer
    - expect: The captured numeric N value equals 0 (confirmed via repeated exploration: Playwright's default '.click()', which fires mousedown immediately followed by mouseup with no delay, consistently reports 0 ms)
    - expect: The button's own text is exactly 'Click and Hold' (not stuck showing 'Holding...')

#### 5.2. Holding the mouse down updates the button's own text with an increasing elapsed-time counter, and releasing over the button reports the held duration

**File:** `tests/components/button/button-hold.spec.ts`

**Steps:**
  1. Navigate to '/components/button', hover over '[data-testid="hold-button"]', press the mouse button down (mouse.down()), and wait approximately 150ms
    - expect: The button's text is now of the form 'Holding... (N ms)' (no longer 'Click and Hold')
    - expect: The numeric N value currently shown is greater than 0
  2. Continue holding for a further measured interval (recording the actual wall-clock time elapsed via the test's own timer, e.g. an additional ~500ms), then release the mouse button (mouse.up()) while the pointer is still positioned over the button
    - expect: The button's text reverts to exactly 'Click and Hold'
    - expect: A paragraph of the form 'You held the button for N ms' becomes visible
    - expect: The reported N value is within a reasonable tolerance (e.g. +/- 150ms, to account for the ~100ms update-tick interval and automation timing jitter) of the actual wall-clock duration the test measured between its own mouse.down() and mouse.up() calls — not asserted against a hardcoded constant, since exact timing is inherently non-deterministic

#### 5.3. [Edge case] Moving the mouse off the button while still held ends the hold immediately via mouseleave, independent of when the physical mouseup eventually occurs

**File:** `tests/components/button/button-hold.spec.ts`

**Steps:**
  1. Navigate to '/components/button', hover over and press down on '[data-testid="hold-button"]', wait ~150ms, then move the mouse away from the button (e.g. to coordinates 10,10) WITHOUT releasing the mouse button, and wait a further ~150ms
    - expect: Before any mouseup occurs, the button's text has already reverted to exactly 'Click and Hold' (no longer showing a 'Holding...' state)
    - expect: A result paragraph of the form 'You held the button for N ms' has already appeared, with N reflecting only the elapsed time up to the moment the mouse left the button (i.e., N is less than the full ~300ms the test waited in this step), confirming mouseleave — not the later mouseup — finalizes the interaction
  2. Release the mouse button (mouse.up()) at the current off-button location
    - expect: The result paragraph's text does not change again after this mouseup — it remains byte-for-byte identical to what it showed immediately after the mouseleave in the previous step, confirming the eventual physical mouseup has no further effect once mouseleave has already finalized the result

#### 5.4. Repeated hold interactions replace the single result paragraph rather than appending duplicates

**File:** `tests/components/button/button-hold.spec.ts`

**Steps:**
  1. Navigate to '/components/button' and double-click (dblclick()) '[data-testid="hold-button"]' (two rapid click cycles in immediate succession)
    - expect: Exactly one element on the page matches text of the form 'You held the button for N ms' (not two or more), confirming the component replaces its single result state on each interaction rather than accumulating a list of past results

#### 5.5. [GAP - accessibility] Keyboard-only activation (focus + hold Enter) does not trigger the hold-tracking behavior at all

**File:** `tests/components/button/button-hold.spec.ts`

**Steps:**
  1. Navigate to '/components/button', focus '[data-testid="hold-button"]' via keyboard/programmatic focus, then press and hold the Enter key down (keyboard.down('Enter')) for at least 300ms before releasing it (keyboard.up('Enter'))
    - expect: The button's text remains exactly 'Click and Hold' throughout the entire held-Enter period — it never changes to a 'Holding...' state at any point
    - expect: No paragraph of the form 'You held the button for N ms' appears anywhere on the page after releasing the Enter key
    - expect: This confirms the hold interaction is entirely inaccessible to keyboard-only users, since the component only listens for mouse events (mousedown/mouseup/mouseleave) with no keydown/keyup equivalent — flagged as an accessibility defect-candidate for the dev team
