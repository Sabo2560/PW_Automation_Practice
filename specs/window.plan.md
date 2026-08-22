# Window Component Test Plan

## Application Overview

**No prior coverage exists for this component.** `Glob` on `specs/*.plan.md` and `tests/components/**`, plus a repo-wide `Grep` for "window", confirmed there is no `window.plan.md` and no `tests/components/window/` directory anywhere in the repo before this plan (the only pre-existing hits for "window" were unrelated: `page.on('dialog'...)` and generic "window" mentions in the Wait and Alert plans, plus a `window` reference in `scripts/discover-api.js`). Everything below was derived from scratch through live exploration; no assumption was carried over from any prior legacy spec.

**Page Object:** `WindowPage.ts` (new — does not yet exist in `tests/pages/`, unlike Button/Alert/Form/Input/AdvancedTable/Drag/Dropdown/Multiselect/Radio/SimpleTable/Wait/Calendar, all of which already have one), extending `BasePage.ts` like every other page object in this repo. The Window component (https://www.automationplayground.dev/components/window, heading "Window", level 1) presents TWO independent exercises stacked vertically, each preceded by a `<label data-testid="form-label">` instructional line: (1) "Click the button below and verify that new page has been opened." — a real `<a target="_blank" href="/new-tab-page">` anchor wrapping a `<button data-testid="button-button">Open New Tab</button>` (confirmed via `outerHTML`: this is a genuine `target="_blank"` link to a real Next.js route, NOT a `window.open()` JS call with custom dimensions/features — no onclick handler exists, only native anchor behavior); (2) "Click the button below and verify that modal window has been opened" — a `<button data-testid="button-button">Open Modal</button>` that opens an in-page MUI Modal overlay (`data-testid="window-modal"`), NOT a native browser window/popup at all.

**Terminology clarification (important):** despite the exercise being named "modal window", it is confirmed to be a same-page React overlay (MUI Modal/Backdrop, class names `MuiModal-root`, `MuiBackdrop-root`, `MuiBox-root`), not any kind of native browser window, `window.open()` popup, or separate tab — it never involves multi-page/multi-tab Playwright handling, only DOM/ARIA overlay assertions on the single existing page. The "Open New Tab" exercise, conversely, IS a genuine new browser tab (native `target="_blank"` navigation), and DOES require `context.waitForEvent('page')`/`browser_new_tab`-style multi-page handling. A test author conflating the two ("modal window" sounding like it might also be a new browser window) would build the wrong kind of test — this plan treats them as fundamentally different mechanisms requiring different Playwright APIs.

**`WindowPage.ts` should expose:** a `gotoWindow()` navigation helper; `openNewTabButton` (`page.getByRole('button', { name: 'Open New Tab' })` — chosen over raw `data-testid` because BOTH trigger buttons on this page share the identical `data-testid="button-button"` value, confirmed via `document.querySelectorAll('[data-testid="button-button"]')` returning 2 elements — the same duplicate-testid situation this repo's Radio and Calendar plans already established a fallback pattern for; accessible name is unique and reliable here since the two buttons' visible text differs); `openModalButton` (`page.getByRole('button', { name: 'Open Modal' })`); `openNewTabAndGetNewPage()` — a helper that wraps `context.waitForEvent('page')` paired with the click and returns the resulting `Page` object (confirmed live: each click opens a genuinely NEW, independent browser tab — repeated clicks do not reuse/replace an already-open tab, confirmed across 3 separate clicks producing 3 separate tab objects); `modal` (`page.getByTestId('window-modal')`); `modalTitleText` (`modal.getByText('Good job!', { exact: true })` — note this is a plain `<span class="underline">`, not a heading-role element); `modalBodyText` (`modal.getByText(/This modal is now ready for its coffee break/)` — a regex match is used deliberately because the raw HTML source contains an embedded newline and extra indentation whitespace inside the text node, e.g. `"...close it;\n               it won't mind.)"`, which Playwright's built-in whitespace-normalization handles for `toHaveText`/`getByText` matching, but a byte-exact string match should not be relied on); `closeModalButton` (`page.getByTestId('close-modal')`, `aria-label="Close modal"`); `modalBackdrop` (`page.locator('.MuiBackdrop-root')` — the only available locator for the backdrop, since it carries no `data-testid`; flagged as CSS-class-dependent/fragile, the best available option); `openModalAndWait()` / `closeModalViaX()` / `closeModalViaEscape()` / `closeModalViaBackdropClick()` thin wrapper helpers, each asserting the modal reaches the expected open/closed state before returning; and an `isElementObscuredByBackdrop(locator)` helper built on `page.evaluate` (checking `document.elementFromPoint()` at the target locator's bounding-box center against the backdrop element) — added specifically because a REAL Playwright `.click()` attempt on a background element while the modal remains open was directly observed during this exploration to hang indefinitely rather than fail fast (a live click attempt on the "Open New Tab" button while the modal backdrop was confirmed on top via `elementFromPoint` did not resolve — the attempt was manually aborted after exceeding a 1800s/30-minute idle timeout) — so this plan's corresponding scenario (5.2) uses the safe, fast, deterministic `elementFromPoint` check instead of ever issuing a real, unbounded click on an obscured background element.

All interactions on this page are purely client-side except the "Open New Tab" exercise's own real page navigation. `browser_network_requests` was checked before and after extensive interaction with both exercises (opening the modal and closing it via all three mechanisms repeatedly, opening the new tab 4 times, keyboard-activating both buttons, reloading) and zero XHR/fetch requests specific to any modal-open/close action were observed — only the same pre-existing Next.js RSC prefetch requests for unrelated nav links (plus a prefetch specifically for `/new-tab-page`, present even before any click, consistent with Next.js's automatic `<Link>`-style prefetch-on-render behavior) documented on every other component page in this suite. The "Open New Tab" action itself is a real, full browser navigation to a genuine Next.js route (`/new-tab-page`) — this is expected page-load traffic, not an "API call" in the sense this repo's other plans mean when they say "no API-level test coverage is needed" for a purely client-side widget; this plan explicitly distinguishes the two. Zero console errors or warnings were observed during any exploration flow (`browser_console_messages` with `level: error` returned 0 total messages after the full exploration pass, including the 30-minute-hang incident, which produced no console error either).

**Page structure and exact labels (verified live, DOM order):** two `[data-testid="form-label"]` elements read exactly: `"Click the button below and verify that new page has been opened."` (note the trailing period — present on this label only) and `"Click the button below and verify that modal window has been opened"` (no trailing period — confirmed live, not a transcription error). The "Insight" section (heading level 2; paragraph `"On completion of this exercise, you can learn the following concepts:"`; concept list, confirmed exactly: `'Open new tab'`, `'Open modal window'`, `'Interact with modal window'`; Github solution link to `https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/window/window.spec.ts`) is visible immediately with no interaction required, matching every other component page's pattern.

**"Open New Tab" — confirmed behaviors:** the anchor's `target="_blank"` triggers a genuine new browser tab, confirmed via the MCP tool's own "Open tabs" listing showing a new, separate tab entry at `/new-tab-page` after each click, while the original tab remains unchanged at `/components/window` (confirmed by re-inspecting the original tab's URL and DOM after the click — it was never navigated away, its heading/labels/Insight section all remained present and unchanged). The new tab's content (verified via direct navigation and snapshot): heading level 1 reading exactly `"Congratulations! You opened new tab."`, and a paragraph reading exactly `"New tab, new you! (Just kidding. But you can learn something new, so, go for it!)"`, inside the same shared header/nav/footer chrome as every other page on the site. The new tab page has NO "BACK" button (confirmed absent from its snapshot — a direct, confirmed contrast with `/components/window` and every other component exercise page, which all have one). **Repeated-click behavior (confirmed across 3 distinct clicks):** each click opens an entirely new, independent tab — clicking the button a second/third time does NOT reuse, focus, or replace a previously-opened `/new-tab-page` tab; 3 clicks produced 3 separate tab entries, all simultaneously open. **Keyboard activation confirmed:** directly focusing the button (via `.focus()`) and pressing `Enter` opened a new tab identically to a mouse click (confirmed live, produced a 4th simultaneously-open tab).

**"Open Modal" — confirmed behaviors:** clicking (or `Enter`-activating, confirmed live) the button renders a MUI Modal overlay (`data-testid="window-modal"`, `role="presentation"`) containing a backdrop (`.MuiBackdrop-root`, `aria-hidden="true"`) and a content box with the title text `"Good job!"`, a close button (`data-testid="close-modal"`, `aria-label="Close modal"`, visible text `"x"`), and body text `"This modal is now ready for its coffee break. (You can close it; it won't mind.)"`. **On open:** focus automatically moves into the modal (confirmed via `document.activeElement` — lands on the modal's own content `<div tabindex="-1">`, not the close button); the page's `<header>` and `<main>` both gain `aria-hidden="true"` (confirmed, removed again on close); `document.body` gains `style.overflow = "hidden"` and `style.paddingRight = "15px"` (scrollbar-compensation scroll-lock, confirmed, both reset to their default/empty values again on close). **Focus trap (confirmed via direct `Tab` presses):** pressing `Tab` once moves focus to the close button (the only focusable descendant inside the modal's two `sentinelStart`/`sentinelEnd` boundary divs); pressing `Tab` again keeps focus on the SAME close button (confirmed via `document.activeElement` re-check) — focus never escapes to any element behind the modal, confirming a real, working focus trap. **Close mechanisms — all three independently confirmed to close the modal and restore the pre-open state (focus returns to the "Open Modal" trigger button, `aria-hidden` removed from header/main, body `overflow`/`paddingRight` reset):** (a) clicking the `close-modal` (x) button, (b) pressing `Escape` while the modal is open, (c) clicking the backdrop (confirmed via a direct JS `.click()` call on `.MuiBackdrop-root` — note the very first such check read `false`/still-present due to checking `document.querySelector` synchronously in the same tick as the click, before React's re-render had flushed; a follow-up snapshot immediately after confirmed the modal was in fact closed, so this was a timing artifact of the check, not a real behavior difference from the other two mechanisms). **[Confirmed, significant quirk] Background elements are provably not receiving pointer events while the modal is open:** `document.elementFromPoint()` evaluated at the exact center coordinates of the (visually still-present, unclicked) "Open New Tab" button, while the modal was open, returned the `.MuiBackdrop-root` element, not the button or any of its descendants — confirming the backdrop's full-viewport overlay genuinely intercepts hit-testing over ALL background content, not merely visually. A real Playwright `.click()` attempt against that same obscured background button while the modal remained open was directly observed to hang past a 1800-second (30-minute) idle-timeout abort rather than resolve or throw a fast actionability-timeout error — this plan's corresponding scenario therefore uses the fast, deterministic `elementFromPoint` check (via the `isElementObscuredByBackdrop()` page-object helper) instead of ever issuing a real click in this situation, and explicitly warns against attempting one. **No state persists across a page reload:** opening the modal and then reloading the page (`page.goto()`) resulted in the modal being fully absent again on the freshly-loaded page (confirmed via direct DOM re-inspection) — expected, unsurprising, but explicitly confirmed live rather than assumed.

**Cross-widget independence:** the "Open New Tab" and "Open Modal" exercises were confirmed fully independent — opening the modal, then (while it was still logically "open" in terms of not yet having been closed by the user) separately triggering the new-tab exercise via a direct button click that landed correctly, was observed to close the modal as a side effect ONLY because that particular click happened to land on the backdrop area first (per the confirmed backdrop-interception behavior above), not because the two widgets share any hidden state — this is fully explained by the confirmed pointer-interception quirk, not a genuine cross-widget coupling bug; this plan's independence scenario verifies the two widgets do not share any observable STATE (e.g. opening then closing the modal has no effect on whether the new-tab button still works correctly afterward, and vice versa), while separately and explicitly documenting the physical click-interception quirk in its own scenario so the two distinct findings are not conflated.

**Known bugs / notable quirks:**
1. **[Confirmed, most significant finding, terminology only — not a functional bug]** The "Open Modal" exercise's name and its Insight-list concept ("Open modal window") both use the word "window", but the implementation is a same-page MUI Modal overlay, never a native browser window/tab/popup. Only the "Open New Tab" exercise involves genuine multi-tab browser behavior.
2. **[Confirmed, both trigger buttons share the identical `data-testid="button-button"`]** — this is the same category of duplicate-testid situation this repo's Radio and Calendar plans already document workarounds for; `WindowPage.ts` must locate both buttons by accessible name/role, never by bare `data-testid` selector alone (which would resolve to 2 elements ambiguously).
3. **[Confirmed, significant]** While the modal is open, the backdrop provably intercepts pointer-event hit-testing over the entire viewport, including background content that remains visually present and unstyled-as-disabled — a real Playwright click attempt against such an obscured background element hangs rather than failing fast, so tests must never attempt to interact with background content while the modal is open (close it first), and any assertion of this specific quirk should use `elementFromPoint`, not a real click-and-expect-timeout pattern.
4. **[Confirmed, not a bug]** The "Open New Tab" label carries a trailing period while the "Open Modal" label does not — a minor, confirmed-live text inconsistency worth asserting exactly, not normalizing away, since it is a real (if cosmetic) content-authoring inconsistency on the page.
5. **[Confirmed, not a bug]** The modal body text's raw HTML source contains an embedded newline and extra whitespace indentation inside the text node; the rendered/accessible text normalizes this to single spaces. Scenarios in this plan match this text via Playwright's built-in whitespace-normalizing text matchers (`getByText`/`toHaveText`), never a byte-exact `.innerHTML`/`.textContent` equality check against the raw source whitespace.

**Ambiguous/unverified areas explicitly flagged for testers:**
- The exact underlying mechanism used for the focus trap (e.g. a specific third-party focus-trap library vs. MUI's own built-in `disableEnforceFocus`/`Unstable_TrapFocus` implementation) was not identified beyond observing the `sentinelStart`/`sentinelEnd` boundary `data-testid`s and the confirmed Tab-cycling behavior; this plan asserts only the observed behavior (Tab stays within the modal), not the specific library/implementation responsible.
- Whether `Shift+Tab` (reverse tab order) exhibits the same trapped-cycling behavior was not independently exercised — only forward `Tab` was directly confirmed live.
- Whether opening the modal via keyboard (`Enter` on a focused "Open Modal" button) produces any different focus-management outcome than a mouse click was not exhaustively distinguished beyond confirming both trigger the modal to open; the specific `document.activeElement` immediately after a keyboard-triggered open was not independently re-verified (only the mouse-click case had its resulting `activeElement` directly inspected).
- The visible "OK"/confirm-style button pattern seen on some other MUI-based components on this site (e.g. the Calendar plan's time picker) does not exist on this page — the modal has only the "x" close button — confirmed by full `outerHTML` inspection, not merely assumed absent.
- Touch/mobile-specific interaction (tapping either trigger button, or tapping the backdrop, on an emulated touch viewport) was not independently exercised during this pass.
- The "BACK" button in the shared page header (on `/components/window` itself, not on `/new-tab-page` where it was confirmed absent) was not exercised, consistent with the treatment of this same shared control in every other component plan in this repo.
- What happens if the new tab (`/new-tab-page`) is closed by the test/user and then the original tab's "Open New Tab" button is clicked again was not independently exercised beyond confirming that multiple simultaneously-open tabs accumulate correctly; whether a fully independent new tab still opens correctly after a prior one has been closed is expected to behave identically (each click is independent) but was not separately re-confirmed after an explicit close.
- The precise reason the real Playwright click against the obscured background button hung indefinitely rather than raising Playwright's own default actionability-timeout error was not root-caused (e.g. whether this environment's Playwright client is configured with an unusually long or disabled default timeout) — the practical, actionable conclusion for this plan is unchanged either way: never attempt a real click on background content while the modal is open in a test.

## Test Scenarios

### 1. Window - Initial Load and Default State

**Seed:** `tests/seed.spec.ts`

#### 1.1. 1.1. Window page loads with both exercise sections, labels, and Insight section correctly rendered — Priority: Critical

**File:** `tests/components/window/window-load.spec.ts`

**Steps:**
  1. Navigate to '/components/window' on a fresh browser context
    - expect: Page loads successfully (HTTP 200, no console errors)
    - expect: Heading 'Window' (level 1) is visible
  2. Inspect both 'form-label' elements in DOM order
    - expect: The two labels read exactly, in order: 'Click the button below and verify that new page has been opened.' (with trailing period) and 'Click the button below and verify that modal window has been opened' (no trailing period)
  3. Inspect the 'Insight' section without performing any click/expand interaction
    - expect: Heading 'Insight' (level 2) is visible immediately with no interaction required
    - expect: The concept list contains exactly the items 'Open new tab', 'Open modal window', 'Interact with modal window', in that order
    - expect: A 'Github solution' link is visible with href 'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/window/window.spec.ts'

#### 1.2. 1.2. Both trigger buttons are visible, enabled, and correctly labeled by accessible name despite sharing an identical data-testid — Priority: High

**File:** `tests/components/window/window-load.spec.ts`

**Steps:**
  1. Navigate to '/components/window'. Query all elements matching '[data-testid="button-button"]' and separately locate buttons by accessible role+name 'Open New Tab' and 'Open Modal'
    - expect: Exactly 2 elements match '[data-testid="button-button"]' (confirming the duplicate-testid condition documented in this plan's overview)
    - expect: getByRole('button', { name: 'Open New Tab', exact: true }) resolves to exactly 1 element, visible and enabled
    - expect: getByRole('button', { name: 'Open Modal', exact: true }) resolves to exactly 1 element, visible and enabled
    - expect: No modal is present in the DOM before any interaction ('[data-testid="window-modal"]' resolves to 0 elements)

### 2. Window - Open New Tab

**Seed:** `tests/seed.spec.ts`

#### 2.1. 2.1. Clicking 'Open New Tab' opens a genuine new browser tab at '/new-tab-page' with the exact expected content, while the original tab's state is fully preserved — Priority: Critical

**File:** `tests/components/window/window-new-tab.spec.ts`

**Steps:**
  1. Navigate to '/components/window'. Begin listening for a new 'page' event on the browser context, then click 'Open New Tab', and await the resulting new Page object
    - expect: A new Page object is created as a direct result of the click (the context emits exactly one new 'page' event)
    - expect: The new page's URL resolves to the '/new-tab-page' route
    - expect: The new page contains a heading (level 1) reading exactly 'Congratulations! You opened new tab.'
    - expect: The new page contains a paragraph reading exactly 'New tab, new you! (Just kidding. But you can learn something new, so, go for it!)'
  2. Without closing the new tab, switch back to the original page/tab and re-inspect its state
    - expect: The original page's URL is still exactly '/components/window' (unchanged — it was never navigated away)
    - expect: The original page's heading 'Window' (level 1), both 'form-label' elements, and the Insight section are all still present and unchanged, confirming the original tab's state was fully preserved by the new-tab action

#### 2.2. 2.2. Each click on 'Open New Tab' opens an independent, separate new tab rather than reusing or replacing a previously-opened one — Priority: High

**File:** `tests/components/window/window-new-tab.spec.ts`

**Steps:**
  1. Navigate to '/components/window'. Click 'Open New Tab' three times in sequence, capturing the resulting new Page object from the context's 'page' event each time
    - expect: Exactly 3 distinct new Page objects are captured, one per click (not 1 reused object, not fewer than 3)
    - expect: All 3 new pages simultaneously resolve to the '/new-tab-page' route and remain open and accessible at the same time (confirmed by re-reading each captured page's URL after all 3 clicks have completed)
    - expect: The original tab remains on '/components/window' throughout, unaffected by any of the 3 clicks

#### 2.3. 2.3. Keyboard activation (Enter) on the focused 'Open New Tab' button opens a new tab identically to a mouse click — Priority: Medium

**File:** `tests/components/window/window-new-tab.spec.ts`

**Steps:**
  1. Navigate to '/components/window'. Focus the 'Open New Tab' button directly (e.g. via .focus(), not a click), then begin listening for a new 'page' event and press 'Enter'
    - expect: A new Page object is created as a result of the Enter keypress
    - expect: The new page's URL resolves to '/new-tab-page' and its heading (level 1) reads exactly 'Congratulations! You opened new tab.', identical in outcome to the mouse-click result documented in scenario 2.1, confirming Enter is a fully equivalent activation method for this native, link-wrapped button

#### 2.4. 2.4. The new-tab-page has no 'BACK' button and its own header navigation links function independently of the original tab — Priority: Low

**File:** `tests/components/window/window-new-tab.spec.ts`

**Steps:**
  1. Navigate directly to '/new-tab-page' in a fresh browser context (bypassing the click flow, to inspect the page's own baseline structure in isolation)
    - expect: No button with the accessible name 'BACK' exists anywhere on this page (0 matches) — a direct, confirmed contrast with '/components/window' and every other component exercise page in this suite, which all render a 'BACK' button
    - expect: The shared header/nav (links 'Home', 'Components', 'F.A.Q') and footer copyright text are present and structurally identical to every other page on the site

### 3. Window - Open Modal

**Seed:** `tests/seed.spec.ts`

#### 3.1. 3.1. Clicking 'Open Modal' opens the modal overlay with the exact expected title, body text, and close button — Priority: Critical

**File:** `tests/components/window/window-modal-open.spec.ts`

**Steps:**
  1. Navigate to '/components/window'. Confirm no modal is present ('[data-testid="window-modal"]' resolves to 0 elements), then click 'Open Modal'
    - expect: '[data-testid="window-modal"]' becomes visible (exactly 1 element)
    - expect: The modal's title text reads exactly 'Good job!'
    - expect: The modal's body text matches (via whitespace-normalizing text matching, not a byte-exact string) 'This modal is now ready for its coffee break. (You can close it; it won't mind.)'
    - expect: A close button with data-testid 'close-modal' and accessible name 'Close modal' is visible inside the modal, with visible text 'x'

#### 3.2. 3.2. Opening the modal moves focus into it, applies aria-hidden to the header and main content, and locks body scroll — Priority: High

**File:** `tests/components/window/window-modal-open.spec.ts`

**Steps:**
  1. Navigate to '/components/window'. Before clicking, record document.body's computed/inline 'overflow' style and the 'aria-hidden' attribute of the <header> and <main> elements (expected: overflow is not 'hidden', and neither has aria-hidden='true'). Click 'Open Modal'
    - expect: Immediately after the modal opens: document.activeElement is inside the modal container (a descendant of '[data-testid="window-modal"]'), not the 'Open Modal' button itself
    - expect: The <header> element's aria-hidden attribute is exactly 'true'
    - expect: The <main> element's aria-hidden attribute is exactly 'true'
    - expect: document.body's inline style.overflow is exactly 'hidden'
    - expect: document.body's inline style.paddingRight is a non-empty pixel value (scrollbar-compensation padding was added, e.g. '15px' — exact pixel value not asserted since it can vary by viewport/scrollbar width, but it must be non-empty and different from its pre-open value)

#### 3.3. 3.3. Keyboard activation (Enter) on the focused 'Open Modal' button opens the modal identically to a mouse click — Priority: Medium

**File:** `tests/components/window/window-modal-open.spec.ts`

**Steps:**
  1. Navigate to '/components/window'. Focus the 'Open Modal' button directly (via .focus(), not a click), then press 'Enter'
    - expect: '[data-testid="window-modal"]' becomes visible as a direct result of the Enter keypress, with title text exactly 'Good job!', identical in outcome to the mouse-click result documented in scenario 3.1, confirming Enter is a fully equivalent activation method for this native <button>

### 4. Window - Modal Close Mechanisms

**Seed:** `tests/seed.spec.ts`

#### 4.1. 4.1. Clicking the close ('x') button closes the modal and fully restores the pre-open page state — Priority: Critical

**File:** `tests/components/window/window-modal-close.spec.ts`

**Steps:**
  1. Navigate to '/components/window' and open the modal by clicking 'Open Modal'. Confirm the modal is visible, then click the 'close-modal' (x) button
    - expect: '[data-testid="window-modal"]' resolves to 0 elements immediately after the click (the modal is fully removed from the DOM, not merely hidden)
    - expect: document.activeElement is exactly the 'Open Modal' button again (focus restored to the original trigger)
    - expect: The <header> and <main> elements no longer carry aria-hidden='true' (attribute removed or set to 'false')
    - expect: document.body's inline style.overflow is reset to its pre-open value (empty string, not 'hidden')

#### 4.2. 4.2. Pressing Escape while the modal is open closes it with the same full state restoration as the close button — Priority: High

**File:** `tests/components/window/window-modal-close.spec.ts`

**Steps:**
  1. Navigate to '/components/window' and open the modal. Confirm it is visible, then press 'Escape'
    - expect: '[data-testid="window-modal"]' resolves to 0 elements immediately after the Escape keypress
    - expect: document.activeElement is exactly the 'Open Modal' button again
    - expect: The <header> and <main> elements no longer carry aria-hidden='true'
    - expect: document.body's inline style.overflow is reset to its pre-open value, identical in outcome to closing via the 'x' button in scenario 4.1

#### 4.3. 4.3. Clicking the modal's backdrop closes it with the same full state restoration as the other two mechanisms — Priority: High

**File:** `tests/components/window/window-modal-close.spec.ts`

**Steps:**
  1. Navigate to '/components/window' and open the modal. Confirm it is visible, then click the backdrop element ('.MuiBackdrop-root') at a point clearly outside the modal's content box
    - expect: '[data-testid="window-modal"]' resolves to 0 elements after the backdrop click and after allowing for React's render to settle (poll/wait briefly rather than asserting synchronously in the same tick, since a same-tick synchronous DOM check can read the pre-flush state — confirmed during this plan's own exploration)
    - expect: document.activeElement is exactly the 'Open Modal' button again
    - expect: The <header> and <main> elements no longer carry aria-hidden='true'
    - expect: document.body's inline style.overflow is reset to its pre-open value, identical in outcome to the other two close mechanisms

### 5. Window - Modal Focus Trap and Background Interaction Blocking

**Seed:** `tests/seed.spec.ts`

#### 5.1. 5.1. Tab key presses keep focus cycling within the modal and never escape to background page content — Priority: High

**File:** `tests/components/window/window-modal-focus-trap.spec.ts`

**Steps:**
  1. Navigate to '/components/window' and open the modal
    - expect: Immediately after opening, document.activeElement is inside the modal (a descendant of '[data-testid="window-modal"]')
  2. Press 'Tab' once
    - expect: document.activeElement is now exactly the 'close-modal' button (the only focusable descendant of the modal besides its own non-tabbable container)
  3. Press 'Tab' a second time
    - expect: document.activeElement is STILL exactly the 'close-modal' button (unchanged from after the first Tab press) — confirming focus cycles back within the modal via its sentinel boundary elements rather than escaping to any element on the page behind it (e.g. the header nav links or the 'Open New Tab' button)

#### 5.2. 5.2. [QUIRK] While the modal is open, background page content is provably obscured from pointer-event hit-testing at its exact coordinates — Priority: High

**File:** `tests/components/window/window-modal-focus-trap.spec.ts`

**Steps:**
  1. Navigate to '/components/window' and open the modal. Using page.evaluate, compute the bounding-box center coordinates of the (still visually present, unclicked) 'Open New Tab' button, then call document.elementFromPoint() at those exact coordinates
    - expect: The element returned by elementFromPoint() at those coordinates is the backdrop element (class list includes 'MuiBackdrop-root'), NOT the 'Open New Tab' button or any of its descendants — confirming the backdrop's full-viewport overlay genuinely intercepts pointer-event hit-testing over background content while the modal is open
    - expect: Note for implementation: do NOT attempt a real Playwright .click() on the obscured background button in this scenario — this plan's own exploration observed such an attempt hang well past a 30-minute timeout rather than resolve or fail fast; use only the elementFromPoint check above to verify this behavior deterministically and quickly
  2. Close the modal (e.g. via Escape), then re-run the same elementFromPoint check at the same coordinates
    - expect: With the modal closed, elementFromPoint() at those same coordinates now returns the 'Open New Tab' button itself (or one of its descendants), confirming the background content becomes interactive again once the modal is closed, i.e. this is a modal-open-specific state, not a permanent condition

### 6. Window - Cross-Widget Independence and Network/Console Behavior

**Seed:** `tests/seed.spec.ts`

#### 6.1. 6.1. Opening and closing the modal has no effect on the new-tab exercise's own subsequent behavior, and vice versa — Priority: Medium

**File:** `tests/components/window/window-independence.spec.ts`

**Steps:**
  1. Navigate to '/components/window'. Open the modal and close it again via the 'x' button (a full, completed cycle). Then click 'Open New Tab' and await the resulting new page
    - expect: The new tab opens successfully with the same expected content as scenario 2.1 (URL '/new-tab-page', heading 'Congratulations! You opened new tab.'), confirming the prior modal open/close cycle left no residual state that interferes with the new-tab exercise
  2. On the original tab, having just performed the above, open the modal again
    - expect: '[data-testid="window-modal"]' becomes visible again with the same expected title 'Good job!' and body text as scenario 3.1, confirming the prior new-tab click left no residual state that interferes with the modal exercise, and that the modal can be reopened correctly after a full prior open/close cycle in the same session

#### 6.2. 6.2. No API/network requests fire as a result of opening or closing the modal (purely client-side); the new-tab action is a real page navigation, not an API call — Priority: Medium

**File:** `tests/components/window/window-independence.spec.ts`

**Steps:**
  1. Navigate to '/components/window', begin recording network requests, then open the modal and close it via all three mechanisms in turn (x button, Escape, backdrop click), each preceded by reopening the modal
    - expect: No XHR/fetch network request specific to any modal open/close action is observed (only the pre-existing Next.js RSC prefetch requests for unrelated nav links and for '/new-tab-page', the same pattern documented on every other component page in this suite)
  2. Continue recording, then click 'Open New Tab' and allow the resulting new page to finish loading
    - expect: Exactly one real page-navigation request (a full document GET) to '/new-tab-page' is observed as a direct result of the click — this is expected, legitimate page-load traffic for a genuine route, not an unexpected/erroneous API call, and this plan does not treat it as requiring API-level test coverage in the sense the other purely-client-side scenarios on this page do

#### 6.3. 6.3. No console errors are logged during extensive interaction with either exercise, including the focus-trap and backdrop-interception checks — Priority: Medium

**File:** `tests/components/window/window-independence.spec.ts`

**Steps:**
  1. Navigate to '/components/window', begin tracking console errors, then perform a broad interaction sequence: open/close the modal via all three close mechanisms, Tab through the focus trap, run the elementFromPoint background-obscuring check, and click 'Open New Tab' twice
    - expect: Zero console error messages are logged throughout the entire sequence of interactions, matching the clean-console baseline observed live during this plan's exploration (including during the live 30-minute-hang incident encountered while exploring, which itself produced no console error)

### 7. Window - Reload Persistence

**Seed:** `tests/seed.spec.ts`

#### 7.1. 7.1. No modal state persists across a page reload — the modal is always closed/absent on a freshly-loaded page — Priority: High

**File:** `tests/components/window/window-persistence.spec.ts`

**Steps:**
  1. Navigate to '/components/window' and open the modal. Confirm it is visible, then reload the page (page.reload()) WITHOUT first closing the modal
    - expect: Before reload: '[data-testid="window-modal"]' is visible (sanity check that the modal was genuinely open going into the reload)
  2. After the reload completes
    - expect: '[data-testid="window-modal"]' resolves to 0 elements (the modal does not persist across a reload, regardless of whether it was open or closed at the moment of reload)
    - expect: document.body's inline style.overflow is not 'hidden' (back to its default fresh-load state)
    - expect: The <header> and <main> elements do not carry aria-hidden='true' (back to their default fresh-load state)
    - expect: Both trigger buttons ('Open New Tab', 'Open Modal') are visible and enabled again, confirming the page reloaded cleanly to its documented fresh-load default state
