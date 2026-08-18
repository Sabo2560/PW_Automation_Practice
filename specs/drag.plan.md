# Drag Component Test Plan

## Application Overview

**Page Object:** `DragPage.ts` (new — does not yet exist in `tests/pages/`, unlike Button/Alert/Form/Input/AdvancedTable which already have one). Since this component has NO `data-testid` attributes on either the draggable box or its container (see inventory below), `DragPage.ts` should expose `container` and `draggable` locators built from the CSS class selectors documented below (following the same pattern already used in the legacy `tests/components/drag.spec.ts`), plus helper methods such as `gotoDrag()`, `getTransform()` (reads/parses the inline `style="transform: translate(Xpx, Ypx)"` attribute into `{x, y}` numbers), and a `dragBy(dx, dy, opts?)` helper that performs the mouse.move/down/move(steps)/up sequence relative to the box's current center — centralizing the fragile selectors and repeated drag-simulation boilerplate in one place per this project's Page Object convention.

The Drag component (https://www.automationplayground.dev/components/drag) is a static page (heading "Drag", level 1) presenting a single exercise: one 64x64px draggable box (blue, `bg-blue-500`) confined to a 384x320px dashed-border container. Above the container sits a label element reading "Drag me inside dotted container". All interactions are purely client-side: no XHR/fetch network requests specific to dragging were observed firing during exploration (only pre-existing Next.js RSC prefetch requests for unrelated nav links, the same pattern documented on every other component page), so this plan contains no API-level test coverage — this was directly verified via `browser_network_requests` during exploration, not merely assumed.

**Data-testid inventory (verified live via `page.locator('[data-testid]').all()`):**
- `[data-testid="form-label"]` — the ONLY testid on the entire page. A `<label class="mb-2 block text-lg font-medium text-primary">` with text exactly "Drag me inside dotted container" (shared markup pattern with the Form component's labels). It identifies the exercise instruction text, NOT the draggable box or its container.
- **NONE** exist on the draggable box or the container — confirmed live for this exploration pass, matching exactly what the legacy `tests/components/drag.spec.ts` already documented in its own code comment. The most stable selectors currently available are CSS class selectors:
  - Container: `div.relative.h-80.w-full.max-w-md.overflow-hidden.border-2.border-dashed.border-gray-500`
  - Draggable box: `div.absolute.h-16.w-16.cursor-grab.bg-blue-500` (current full class list on the live element is actually `absolute h-16 w-16 cursor-grab touch-none bg-blue-500 active:cursor-grabbing` — the legacy selector's subset of classes still matches correctly since Playwright's chained-class locator only requires the element to include all listed classes, not equal the full list exactly).

Confirmed default/fresh state (page reload, no interaction): the draggable box's inline `style` attribute reads exactly `transform: translate(0px, 0px); touch-action: none;`, placing it flush with the container's top-left corner (small ~1.6px visual offset from the container's own edge accounted for by the container's 2px border). No dragged position persists across a reload — verified directly by dragging the box away from origin, confirming its transform changed, then reloading and confirming it reverts to `translate(0px, 0px)` exactly.

Confirmed behaviors (all independently verified live during this exploration pass via direct DOM/style inspection, not just visual bounding-box comparison):
- The box's position is driven entirely by a CSS `transform: translate(Xpx, Ypx)` on its inline `style` attribute — not `top`/`left`. Dragging moves it by an amount closely matching the mouse's own displacement.
- Boundary clamping works correctly and independently on both axes at all four corners/directions, confirmed via exact transform values: dragging far past the bottom-right corner clamps to `translate(320px, 256px)` (= containerWidth(384) - boxWidth(64), containerHeight(320) - boxHeight(64)); far past top-left clamps to `translate(0px, 0px)`; far past top-right clamps to `translate(320px, 0px)`; far past bottom-left clamps to `translate(0px, 256px)`. All four were independently exercised and produced exact, non-overshooting clamped values (not merely "somewhere near the edge").
- A click with zero mouse movement (mousedown immediately followed by mouseup at the same coordinates, no intermediate mouse.move) produces ZERO position change — the inline style transform is byte-for-byte identical before and after. This confirms the interaction requires actual pointer movement while pressed, not just a press-release at any point on the box.
- A very small drag (5px x / 3px y) still registers a proportional, non-clamped movement — it is not swallowed as a no-op nor mistakenly treated as an out-of-bounds jump. A small discrepancy (~1-2px larger than the raw mouse delta) was observed between the exact mouse movement and the resulting transform value across repeated small-drag samples; treat exact small-drag transform values as approximate/tolerant rather than pixel-exact in assertions (see ambiguous area below).
- The box's `cursor` computed style changes from `grab` (default) to `grabbing` for the duration of an active drag (mousedown through mouseup, confirmed at multiple points during the hold), then reverts to `grab` immediately after release — driven by the `active:cursor-grabbing` Tailwind class, a native CSS `:active`-state effect, not JS-toggled.
- Sequential drags are cumulative/relative to the box's current position at the time each new drag begins, not reset from the page's original load position — confirmed by performing two consecutive drags in different directions and observing the second drag's delta applied on top of the first drag's resulting position, not on top of the origin.
- No JavaScript console errors (warnings or errors) were observed during any exploration flow (basic drags, boundary drags at all four corners, tiny drags, click-without-movement, cursor-state checks, reload, keyboard-focus attempts).

Known bugs / notable gaps:
1. **[GAP — accessibility]** The draggable box has no keyboard equivalent to the mouse-drag interaction. Confirmed live: the box cannot be given programmatic focus (`locator.focus()` does not make it `document.activeElement`), it has no `tabindex` attribute (confirmed `null`), and pressing arrow keys (ArrowRight/ArrowDown) produces no position change whatsoever. A keyboard-only user cannot move the box at all. Documented as a defect-candidate for the dev team, consistent with the Button component's Click-and-Hold keyboard gap already documented in `specs/button.plan.md`.
2. **[Notable non-bug fragile-selector situation, not a functional defect]** The complete absence of `data-testid` attributes on the container and draggable box (the only testid on the page belongs to an unrelated label) means all test coverage for this component must rely on Tailwind CSS class selectors, which are inherently more brittle to visual/styling refactors than testids. This was true in the legacy spec and remains true today. Flagged explicitly as a longevity risk for whoever builds `DragPage.ts` and the specs — a future styling change (even a purely cosmetic one, e.g. swapping `bg-blue-500` for a different shade) could silently break every scenario in this plan even though the underlying drag/clamp logic hasn't changed at all. Recommend flagging this to the dev team as a suggested improvement (adding testids), separately from any test implementation work.

Ambiguous/unverified areas explicitly flagged for testers:
- The small (~1-2px) discrepancy observed between a tiny drag's raw mouse-move delta and the resulting transform value (see confirmed behaviors above) was not traced to a specific root cause (could be Playwright's own event-coalescing during few-step moves, subpixel/DPI rounding in `getBoundingClientRect()`, or a genuine small offset in the drag library itself). Scenario 2.2 in this plan intentionally uses a generous tolerance band rather than asserting an exact pixel-for-pixel delta for this reason — do not tighten that tolerance without first re-confirming the root cause.
- Touch/mobile-specific drag gestures (the box does carry a `touch-none` Tailwind class and inline `touch-action: none`, suggesting deliberate touch-drag support via the same pointer-event handlers) were not independently exercised on an emulated touch viewport during this pass; expected to behave analogously to mouse drag per the `touch-action: none` styling, but not directly confirmed.
- The exact drag library/implementation in use (e.g. whether it's a hand-rolled pointer-event handler or a library like `@dnd-kit` / `react-draggable`) was not identified from source — all behaviors above were derived purely from black-box interaction and DOM/style inspection, not by reading the app's JS bundle.
- The "BACK" button in the page header (shared across all component pages) was not exercised as part of this plan, consistent with the Button, Alert, Form, and Input plans' treatment of this same shared control.
- Whether the container itself is scrollable/resizable at different viewport widths (i.e. whether its 384px max-width and 320px height are fixed regardless of viewport, or shrink on narrow/mobile viewports, which would change the valid clamp range) was not tested across multiple viewport sizes during this pass — all boundary-clamping figures in this plan (320px/256px max translate) assume the default desktop viewport size used throughout exploration.

## Test Scenarios

### 1. Drag - Initial Load and Default State

**Seed:** `tests/seed.spec.ts`

#### 1.1. Drag page loads with the container, draggable box, label, and Insight section correctly rendered

**File:** `tests/components/drag/drag-load.spec.ts`

**Steps:**
  1. Navigate to '/components/drag' on a fresh browser context
    - expect: Page loads successfully (HTTP 200, no console errors)
    - expect: Heading 'Drag' (level 1) is visible
  2. Inspect the label element preceding the container
    - expect: '[data-testid="form-label"]' is visible with text exactly 'Drag me inside dotted container'
  3. Inspect the container element (no data-testid; located via CSS class selector `div.relative.h-80.w-full.max-w-md.overflow-hidden.border-2.border-dashed.border-gray-500`)
    - expect: Exactly one element matches this selector and is visible
    - expect: Its bounding box width is approximately 384px and height is approximately 320px (allow +/- 2px tolerance for subpixel rendering)
  4. Inspect the draggable box element (no data-testid; located via CSS class selector `div.absolute.h-16.w-16.cursor-grab.bg-blue-500`, scoped inside the container)
    - expect: Exactly one element matches this selector and is visible, nested inside the container element
    - expect: Its bounding box width is approximately 64px and height is approximately 64px (allow +/- 2px tolerance)
    - expect: Its inline `style` attribute contains `transform: translate(0px, 0px)`, confirming the box starts at the container's top-left corner on a fresh load
  5. Inspect the 'Insight' section without performing any click/expand interaction
    - expect: Heading 'Insight' (level 2) is visible immediately, with no interaction required to reveal it
    - expect: The concept list is visible and contains at least the items 'Simulate drag actions', 'Verify element movement', 'Ensure boundary constraints', 'Verify element stays within defined boundaries'
    - expect: A 'Github solution' link is visible with href 'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/drag/drag.spec.ts'

#### 1.2. Confirm no data-testid exists on the draggable box or its container, documenting the fragile-selector situation

**File:** `tests/components/drag/drag-load.spec.ts`

**Steps:**
  1. Navigate to '/components/drag' and enumerate all `[data-testid]` elements on the page via `page.locator('[data-testid]').all()`
    - expect: The only `data-testid` value present anywhere on the page is 'form-label' (the exercise instruction label) — no testid exists on the container div or the draggable div, confirming the legacy spec's documented gap is still accurate as of this exploration

### 2. Drag - Basic Drag Movement

**Seed:** `tests/seed.spec.ts`

#### 2.1. Dragging the box a moderate distance within the container moves it by the expected delta

**File:** `tests/components/drag/drag-movement.spec.ts`

**Steps:**
  1. Navigate to '/components/drag'. Read the draggable box's starting bounding box (expected translate(0px, 0px), i.e. flush with the container's top-left corner, +/- 2px). Perform a real drag: mouse.move to box center, mouse.down(), mouse.move by +80px x / +40px y using multiple intermediate steps (e.g. steps: 10) so the drag library registers movement events, then mouse.up()
    - expect: After the drag, the box's new bounding box x coordinate differs from the starting x by approximately +80px (+/- 3px tolerance for step interpolation/subpixel rounding)
    - expect: The new y coordinate differs from the starting y by approximately +40px (+/- 3px tolerance)
    - expect: The box's inline `style` transform reflects a `translate(80px, 40px)`-equivalent value (+/- 3px) rather than `translate(0px, 0px)`, confirming the position genuinely changed and is driven by a CSS transform, not top/left

#### 2.2. A tiny drag distance still registers a proportional movement (lower boundary of meaningful drag)

**File:** `tests/components/drag/drag-movement.spec.ts`

**Steps:**
  1. Navigate to '/components/drag'. Perform a drag of only 5px horizontally and 3px vertically (mouse.down at box center, mouse.move by +5/+3 with steps: 5, mouse.up())
    - expect: The box's bounding box x coordinate increases from its starting value by a small positive amount consistent with the drag direction (greater than 0 and less than 15px, allowing for the observed small rendering-offset discrepancy between raw mouse delta and reported transform)
    - expect: The box's y coordinate similarly increases by a small positive amount less than 15px
    - expect: The box does NOT jump to a clamped boundary position (i.e. this small drag is not mistakenly treated as an out-of-bounds/edge-clamp case)

#### 2.3. A click without any mouse movement (mousedown immediately followed by mouseup at the same coordinates) does not move the box

**File:** `tests/components/drag/drag-movement.spec.ts`

**Steps:**
  1. Navigate to '/components/drag'. Capture the box's inline `style` attribute (expected `transform: translate(0px, 0px)`). Move the mouse to the box's center, call mouse.down() immediately followed by mouse.up() with no intermediate mouse.move() call
    - expect: The box's inline `style` attribute after the click is byte-for-byte identical to the value captured before the click — a click with zero movement produces exactly zero position change, confirming this is a real drag-threshold behavior and not a click-to-teleport interaction

#### 2.4. Cursor style changes from grab to grabbing during an active drag and reverts to grab on release

**File:** `tests/components/drag/drag-movement.spec.ts`

**Steps:**
  1. Navigate to '/components/drag' and read the draggable box's computed `cursor` CSS property before any interaction
    - expect: Computed cursor equals exactly 'grab'
  2. Move the mouse to the box's center and call mouse.down() (without releasing)
    - expect: Computed cursor equals exactly 'grabbing' while the mouse button is held down
  3. Move the mouse by a small amount while still held down, then call mouse.up() to release
    - expect: Computed cursor equals exactly 'grabbing' while still dragging
    - expect: After mouse.up(), computed cursor reverts to exactly 'grab'

### 3. Drag - Boundary Clamping at All Corners and Edges

**Seed:** `tests/seed.spec.ts`

#### 3.1. Dragging far past the bottom-right corner clamps the box exactly at the container's bottom-right edge

**File:** `tests/components/drag/drag-boundaries.spec.ts`

**Steps:**
  1. Navigate to '/components/drag'. Read the container's bounding box (width ~384px, height ~320px) and the draggable box's starting bounding box/size (~64x64px). Drag from the box's center to a point 500px beyond the container's right edge and 500px beyond its bottom edge (multi-step mouse.move, e.g. steps: 15), then release
    - expect: The box's final bounding box right edge (x + width) does not exceed the container's right edge (containerBox.x + containerBox.width) by more than 2px tolerance
    - expect: The box's final bounding box bottom edge (y + height) does not exceed the container's bottom edge (containerBox.y + containerBox.height) by more than 2px tolerance
    - expect: The box's inline style transform reflects a translate value of approximately (containerWidth - boxWidth, containerHeight - boxHeight) = (320px, 256px), +/- 2px, confirming an exact clamp rather than an arbitrary stopping point

#### 3.2. Dragging far past the top-left corner clamps the box exactly at the container's top-left edge (translate 0,0)

**File:** `tests/components/drag/drag-boundaries.spec.ts`

**Steps:**
  1. Navigate to '/components/drag'. First drag the box away from its starting corner (e.g. toward the center) so the clamp is genuinely exercised rather than trivially already true. Then drag from the box's current center to a point 500px before the container's left edge and 500px above its top edge (multi-step mouse.move), then release
    - expect: The box's final bounding box left edge (x) is not less than the container's left edge (containerBox.x) by more than 2px tolerance
    - expect: The box's final bounding box top edge (y) is not less than the container's top edge (containerBox.y) by more than 2px tolerance
    - expect: The box's inline style transform reflects a translate value of approximately (0px, 0px), +/- 2px

#### 3.3. Dragging far past the top-right corner clamps the box exactly at the top-right edge (max-x, min-y)

**File:** `tests/components/drag/drag-boundaries.spec.ts`

**Steps:**
  1. Navigate to '/components/drag' (fresh load, box starts at translate(0,0)). Read the container's bounding box. Drag from the box's center to a point 300px beyond the container's right edge and 300px above the container's top edge, then release
    - expect: The box's final bounding box right edge does not exceed the container's right edge by more than 2px tolerance (x-axis clamped at the maximum)
    - expect: The box's final bounding box top edge does not go below (i.e. is not less than) the container's top edge by more than 2px tolerance (y-axis clamped at the minimum)
    - expect: The box's inline style transform reflects a translate value of approximately (320px, 0px), +/- 2px, i.e. both axes are clamped independently and correctly at this mixed corner

#### 3.4. Dragging far past the bottom-left corner clamps the box exactly at the bottom-left edge (min-x, max-y)

**File:** `tests/components/drag/drag-boundaries.spec.ts`

**Steps:**
  1. Navigate to '/components/drag' (fresh load, box starts at translate(0,0)). Read the container's bounding box. Drag from the box's center to a point 300px before the container's left edge and 300px beyond the container's bottom edge, then release
    - expect: The box's final bounding box left edge does not go left of the container's left edge by more than 2px tolerance (x-axis clamped at the minimum, and since the box started already at x=0, the x position should remain unchanged from its start)
    - expect: The box's final bounding box bottom edge does not exceed the container's bottom edge by more than 2px tolerance (y-axis clamped at the maximum)
    - expect: The box's inline style transform reflects a translate value of approximately (0px, 256px), +/- 2px

#### 3.5. A drag ending exactly at the container's edge (not far beyond it) does not overshoot the boundary

**File:** `tests/components/drag/drag-boundaries.spec.ts`

**Steps:**
  1. Navigate to '/components/drag'. Compute the exact target translate that would place the box's right edge flush with the container's right edge (translate x = containerWidth - boxWidth = 320px, y = 0). Drag the box to precisely that computed on-screen position (not deliberately overshooting past it)
    - expect: The box's final position matches the computed target within +/- 3px on both axes
    - expect: The box's right edge does not exceed the container's right edge by more than 2px tolerance, confirming the boundary logic behaves correctly even when the drag target lands exactly at the limit rather than far past it

### 4. Drag - State Persistence and Repeated Interaction

**Seed:** `tests/seed.spec.ts`

#### 4.1. The box's dragged position does NOT persist across a page reload — it resets to the top-left default

**File:** `tests/components/drag/drag-persistence.spec.ts`

**Steps:**
  1. Navigate to '/components/drag'. Drag the box to a new position clearly away from its default (e.g. drag by +100px x / +80px y) and confirm its inline style transform reflects the new position (not translate(0px, 0px))
    - expect: After the drag, the box's transform is NOT `translate(0px, 0px)`
  2. Reload the page (page.reload())
    - expect: After reload, the draggable box's inline style transform equals exactly `translate(0px, 0px)`, confirming the dragged position is not persisted anywhere (no localStorage/sessionStorage/URL state) and a fresh load always starts the box at the container's top-left corner

#### 4.2. Multiple sequential drags in different directions accumulate correctly from the box's current position, not from its original starting position

**File:** `tests/components/drag/drag-persistence.spec.ts`

**Steps:**
  1. Navigate to '/components/drag'. Perform a first drag of +60px x / +30px y from the box's current center, and record the resulting bounding box position
    - expect: The box's position after this first drag has moved by approximately (+60, +30) relative to its starting position, +/- 3px
  2. Immediately perform a second drag of -20px x / +40px y, starting from the box's NEW current center (post first-drag position)
    - expect: The box's position after this second drag has moved by approximately (-20, +40) relative to where it was after the FIRST drag (not relative to the box's original page-load position) — confirming drags are cumulative/relative to current position rather than each drag resetting from the original starting point

### 5. Drag - Accessibility Gap: No Keyboard Alternative

**Seed:** `tests/seed.spec.ts`

#### 5.1. [GAP - accessibility] The draggable box is not keyboard-focusable and has no keyboard-driven movement alternative

**File:** `tests/components/drag/drag-accessibility.spec.ts`

**Steps:**
  1. Navigate to '/components/drag'. Attempt to programmatically focus the draggable box element (locator.focus()) and check `document.activeElement`
    - expect: The draggable box element does NOT become `document.activeElement` after the focus attempt
    - expect: The draggable box has no `tabindex` attribute (confirming it is not part of the natural or explicit tab order and has no keyboard interaction affordance)
  2. With the draggable box still not focused, press ArrowRight then ArrowDown as a best-effort attempt to trigger any keyboard-based movement. (A further Tab+Enter step was considered but deliberately excluded from the implementation: with the box confirmed non-focusable, Tab moves focus into the page's real tab order and Enter on a focused link navigates away entirely, which would break the test rather than exercise the drag box — the focus/tabindex checks in step 1 already establish the gap without this risk.)
    - expect: The box's inline style transform remains completely unchanged after these key presses (still `translate(0px, 0px)` from the fresh load), confirming there is no keyboard equivalent to the mouse-drag interaction — flagged as an accessibility defect-candidate for the dev team, consistent with this project's practice of documenting such gaps (see the Button component's Click-and-Hold keyboard gap in `specs/button.plan.md`)
