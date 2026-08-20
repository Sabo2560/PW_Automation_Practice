# Multiselect Component Test Plan

## Application Overview

**Page Object:** `MultiselectPage.ts` (new — does not yet exist in `tests/pages/`, unlike Button/Alert/Form/Input/AdvancedTable/Drag/Dropdown, all of which already have one). This page is built on the `multiselect-react-dropdown` library (a searchable, chip-based multi-select), rendered three independent times on the same page (`multiselect-form-1`, `multiselect-form-2`, `multiselect-form-3`). `MultiselectPage.ts` should expose: a `gotoMultiselect()` navigation helper; per-form container locators (`form1`, `form2`, `form3` via `page.getByTestId(...)`) scoped so that raw `input#search_input`/`#multiselectContainerReact` ids (which are duplicated verbatim across all three forms — confirmed live, invalid-but-real HTML — see quirks below) are never queried unscoped; helper methods such as `openForm(form)` (click the form's search textbox), `selectOption(form, label)` (click an option by exact text within that form's option list), `removeChip(form, label)` (click the specific chip's `.icon_cancel` icon), `getChipTexts(form)`, `getAvailableOptionTexts(form)`, and `filterOptions(form, text)` (type into the search box) — wrapping the shared interaction pattern so it is not duplicated raw across five+ spec files, per this project's Page Object convention.

The Multiselect component (https://www.automationplayground.dev/components/multiselect) is a static page (heading "Multiselect", level 1) presenting three independent exercises built on the same underlying searchable multi-select widget: Form 1 ("Select at least two items and verify that the selected items were actually chosen") starts empty with 10 options (`Option 1`..`Option 10`); Form 2 ("Select all three items and verify that the dropdown displays a message indicating no further options are available") starts empty with exactly 3 options (`Option 1`, `Option 2`, `Option 3`); Form 3 ("Remove all pre-selected items and verify that no selections are present") starts with 10 total options (`Option 1`..`Option 10`) and TWO already pre-selected as chips on fresh load: `Option 4` and `Option 5` (confirmed reproducible across repeated fresh navigations — this is a genuine static default, not leftover state from a prior test). All interactions are purely client-side: `browser_network_requests` was checked before and after extensive interaction across all three forms (opening dropdowns, selecting/deselecting/filtering/removing chips) and zero XHR/fetch requests specific to any multiselect action were observed — only the same pre-existing Next.js RSC prefetch requests for unrelated nav links documented on every other component page. This plan therefore contains no API-level test coverage.

**Data-testid inventory (verified live via `document.querySelectorAll('[data-testid]')` — only 6 elements exist on the whole page, notably no per-option, per-chip, or "selected values" summary testid anywhere):**
- `[data-testid="multiselect-form-1"]`, `[data-testid="multiselect-form-2"]`, `[data-testid="multiselect-form-3"]` — the three top-level `<div>` containers, one per exercise. All locating/scoping in this plan must go through these three testids, since no other testid distinguishes elements between forms.
- `[data-testid="form-label"]` (×3, one nested inside each form container) — a `<label>` with the exact instructional text quoted above for each form.
- No testid exists for: the search/textbox input, the options `<ul>`/`<li>` list, individual chips, or the "No Options Available" message. All of these must be located via role/text/class selectors scoped within the appropriate form testid.

**Confirmed DOM structure and classes (verified live via `innerHTML` inspection, not just visual comparison):**
- Each form's widget renders `<div class="multiselect-container multiSelectContainer" id="multiselectContainerReact">` containing a `.search-wrapper` (holding zero-or-more `<span class="chip">Label<img class="icon_cancel closeIcon"></span>` chip elements plus an `<input id="search_input" placeholder="Select" type="text">`), followed by `<div class="optionListContainer displayNone|displayBlock">` wrapping `<ul class="optionContainer">` which holds either `<li class="option">Label</li>` items (one per NOT-yet-selected option, in original list order minus any selected ones) or, when zero options remain in the current filtered/unfiltered view, a single `<span class="notFound">No Options Available</span>` in place of the `<li>` items.
- **[CONFIRMED DUPLICATE-ID QUIRK — real, reproducible HTML defect]** The ids `search_input` and `multiselectContainerReact` are used verbatim, unscoped, and duplicated across all three form widgets simultaneously in the live DOM (confirmed via `document.querySelectorAll('input#search_input')` returning 3 elements). This is invalid HTML (duplicate ids) and means any locator strategy using a bare `#search_input`/`#multiselectContainerReact` CSS id selector or an unscoped `page.getByRole('textbox', { name: 'Select' })` will resolve to the FIRST matching element across all three forms unless explicitly scoped inside the relevant `data-testid` form container first — this is exactly the trap the legacy spec avoided by always scoping through `form1`/`form2`/`form3` locators first, and this plan continues that pattern deliberately, not incidentally.
- The options list `<div class="optionListContainer">` and its full `<ul>` of every not-yet-selected option is ALWAYS present in the DOM regardless of open/closed visual state — visibility is toggled purely via a `displayNone`/`displayBlock` class swap on that container, not by conditional rendering/removal. This means a test asserting on option *visibility* must check the class or use Playwright's actual visibility assertions (`toBeVisible()`), not merely presence in the DOM.
- On open, the first item in the currently-visible option list always carries `class="option highlightOption highlight"` (confirmed reproducible on every open, including after filtering) — this is a default keyboard-navigation highlight state, not a selection; it updates as ArrowDown is pressed (confirmed: pressing ArrowDown once moves this highlight class from the 1st to the 2nd item in the current list) and has no bearing on which option gets clicked by mouse.

**Confirmed behaviors (all independently re-verified live during this exploration pass):**
- Clicking an option's text in the open list moves it from the `<li>` option list into a `<span class="chip">` immediately (live, no extra confirm/submit action needed) and the dropdown list REMAINS open (`displayBlock`) afterward, allowing multiple selections in one open session without reopening — confirmed by selecting Option 2 then Option 4 in form-1 in a single session.
- Clicking a chip's `.icon_cancel` `<img>` immediately removes that chip and the option reappears in the (still-scrollable) options list at its original position — confirmed on form-1 (self-selected chip) and form-3 (pre-populated chip), i.e. programmatically pre-selected and user-selected chips behave identically for removal.
- When ALL options in a form are selected (confirmed on form-2, selecting Option 1, then 2, then 3 in sequence) OR when a search filter matches zero remaining unselected options (confirmed on form-1 by typing `xyz`), the exact same `<span class="notFound">No Options Available</span>` message is rendered in place of the `<li>` list — this is a single shared "empty result" state for two different triggering conditions (exhausted selection vs. no filter match), not two distinct messages. A test must not assume this text implies "all options selected" without also checking the search box is empty, since the same text also appears from an unmatched filter with items still available.
- The search input performs live, case-insensitive substring filtering of the option list (not prefix-only) — confirmed live: typing `10` narrows form-1's list to only `Option 10`; typing `1` narrows it to `Option 1` AND `Option 10` (substring match, not exact); typing `option 3` (lowercase, with a space) still matches `Option 3` (case-insensitive).
- Removing a chip clears the search box's filter value as a side effect and returns the option immediately below where it was clicked back into the visible list — confirmed by filtering to `xyz` (0 results) in a state with an existing chip's cancel icon still clickable/present, clicking it, and observing the search box reset to empty with the full remaining unfiltered list shown.
- Keyboard support: with the search box focused, `ArrowDown` moves the highlight forward one option at a time in list order (confirmed reproducible); `Enter` selects the currently highlighted option, producing an identical chip/list-removal result as a mouse click (confirmed: ArrowDown once + Enter on form-1 selected exactly `Option 2`, matching the highlighted item). **`Escape` does NOT close the open option list** (confirmed: `optionListContainer` class remained `displayBlock` after pressing Escape) — this is a notable deviation from common combobox conventions and must not be assumed to work.
- Clicking anywhere outside an open widget (confirmed by clicking the page's "Multiselect" `<h1>`) closes that widget's option list (class reverts to `displayNone`) without altering its current chip selections.
- The three forms are fully independent: interacting with form-1 (selecting/deselecting, filtering, opening) has zero effect on form-2's or form-3's chip state or option list, confirmed by interacting with form-1 and re-reading form-2/form-3 state unchanged immediately after.
- No selection state persists across a page reload for any of the three forms: form-1 and form-2 always revert to zero chips/full option list on fresh navigation regardless of prior test interaction, and form-3 always reverts to its exact hardcoded default (`Option 4`, `Option 5` pre-selected as chips, 8 remaining options in the list) — confirmed by fully emptying form-3's chips, reloading, and observing the same two default chips reappear identically, i.e. this is a static per-load default, not any kind of persisted/remembered prior state.
- No JavaScript console errors or warnings were observed during any exploration flow (selection, deselection, filtering, keyboard nav, empty-state triggering via both exhaustion and filter-mismatch, reload, cross-form sequencing).

**Known bugs / notable gaps:**
1. **[Duplicate HTML ids across the three forms — see DOM structure notes above]** `#search_input` and `#multiselectContainerReact` are non-unique ids repeated identically in all three widget instances. Flagged as a real, reproducible HTML validity defect worth reporting, and as a concrete trap for any test author who reaches for a bare CSS id selector instead of scoping through the `data-testid` form container first.
2. **[Notable, not a bug]** `Escape` does not close the open option list, unlike many standard combobox/select-style widgets. Flagged so no scenario is written assuming Escape-to-close behavior.
3. **[Notable, not a bug]** The exact same "No Options Available" text/markup is used for two semantically different states (all options exhausted vs. filter yields zero matches). Flagged so scenarios explicitly distinguish which trigger they are testing rather than treating the message as proof of "fully selected."

**Ambiguous/unverified areas explicitly flagged for testers:**
- Whether pressing `ArrowUp` (reverse direction), `Home`/`End`, or `Tab` (to move focus away without a mouse click) produces standard expected behavior was not independently exercised during this pass; only `ArrowDown`, `Enter`, and `Escape` were directly confirmed.
- Touch/mobile-specific interaction (tapping chips' cancel icons, or the options list, on an emulated touch viewport) was not independently exercised during this pass.
- Whether there is any maximum-selection limit enforced by the widget was not tested, since form-1/form-3 top out at 10 options and form-2 at 3 — no scenario in this plan should assume an artificial cap exists beyond "all available options selected."
- The "BACK" button in the shared page header was not exercised, consistent with the treatment of this same shared control in the Button, Alert, Form, Input, Drag, and Dropdown plans.
- The precise debounce/timing (if any) behind the live search filter was not measured; filtering was observed to update effectively immediately for short strings during this pass, but no explicit timing assertion should be written into a scenario without first confirming there is no debounce delay under automated (fast) typing.

## Test Scenarios

### 1. Multiselect - Initial Load and Default State

**Seed:** `tests/seed.spec.ts`

#### 1.1. Multiselect page loads with all three forms, labels, and Insight section correctly rendered

**File:** `tests/components/multiselect/multiselect-load.spec.ts`

**Steps:**
  1. Navigate to '/components/multiselect' on a fresh browser context
    - expect: Page loads successfully (HTTP 200, no console errors)
    - expect: Heading 'Multiselect' (level 1) is visible
  2. Inspect form-1 ('[data-testid="multiselect-form-1"]')
    - expect: Label text 'Select at least two items and verify that the selected items were actually chosen.' is visible inside form-1
    - expect: form-1's search textbox (role textbox, name 'Select', scoped within form-1) is visible and empty (value '')
    - expect: form-1 has zero chip elements ('.chip' count is 0)
  3. Inspect form-2 ('[data-testid="multiselect-form-2"]')
    - expect: Label text 'Select all three items and verify that the dropdown displays a message indicating no further options are available.' is visible inside form-2
    - expect: form-2's search textbox is visible and empty
    - expect: form-2 has zero chip elements ('.chip' count is 0)
  4. Inspect form-3 ('[data-testid="multiselect-form-3"]')
    - expect: Label text 'Remove all pre-selected items and verify that no selections are present.' is visible inside form-3
    - expect: form-3 has exactly 2 chip elements ('.chip' count is 2) with text content exactly 'Option 4' and 'Option 5' (in that order), confirming the pre-selected default
  5. Inspect the 'Insight' section without performing any click/expand interaction
    - expect: Heading 'Insight' (level 2) is visible immediately with no interaction required
    - expect: The concept list contains exactly the items 'Select multiple options from a list', 'Verify selected values', 'Deselect pre-selected items', 'Verify "no more options" state when all items are selected'
    - expect: A 'Github solution' link is visible with href 'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/multiselect/multiselect.spec.ts'

#### 1.2. Each form's underlying option inventory matches the confirmed live counts and labels, with option lists closed by default

**File:** `tests/components/multiselect/multiselect-load.spec.ts`

**Steps:**
  1. Navigate to '/components/multiselect'. Without clicking any search box, read each form's '.optionListContainer' class via DOM inspection
    - expect: All three forms' option list containers carry class 'displayNone' (closed) on fresh load, before any interaction
  2. Click form-1's search textbox to open its list, then read all '.optionContainer li' text values
    - expect: form-1's option list contains exactly these 10 items in this exact order: 'Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5', 'Option 6', 'Option 7', 'Option 8', 'Option 9', 'Option 10'
  3. Click form-2's search textbox to open its list, then read all '.optionContainer li' text values
    - expect: form-2's option list contains exactly these 3 items in this exact order: 'Option 1', 'Option 2', 'Option 3' — confirming form-2 has a materially smaller option set than form-1/form-3, matching its exercise wording 'select all three items'
  4. Click form-3's search textbox to open its list, then read all '.optionContainer li' text values
    - expect: form-3's option list contains exactly these 8 items (the 10-item full set minus the 2 already-selected chips): 'Option 1', 'Option 2', 'Option 3', 'Option 6', 'Option 7', 'Option 8', 'Option 9', 'Option 10' — confirming Option 4 and Option 5 are excluded from the open list precisely because they are already selected as chips

### 2. Multiselect - Selecting Items (Form 1)

**Seed:** `tests/seed.spec.ts`

#### 2.1. Selecting two items displays both as chips and removes them from the open option list

**File:** `tests/components/multiselect/multiselect-selection.spec.ts`

**Steps:**
  1. Navigate to '/components/multiselect', open form-1's dropdown, click the option with exact text 'Option 2'
    - expect: A chip with exact text 'Option 2' is visible inside form-1
    - expect: 'Option 2' no longer appears in form-1's remaining '.optionContainer li' list
    - expect: The option list remains open ('.optionListContainer' class is 'displayBlock') after the selection, with no reopen action needed for the next selection
  2. Without reopening, click the option with exact text 'Option 4' in the still-open list
    - expect: form-1 now has exactly 2 chips with exact text 'Option 2' and 'Option 4' (order of appearance matches selection order: Option 2 first, then Option 4)
    - expect: form-1's remaining option list no longer contains 'Option 2' or 'Option 4', but still contains the other 8 original options

#### 2.2. Selecting a single option (lower boundary of 'at least two') still renders correctly as one chip

**File:** `tests/components/multiselect/multiselect-selection.spec.ts`

**Steps:**
  1. Navigate to '/components/multiselect', open form-1's dropdown, select only 'Option 5'
    - expect: form-1 has exactly 1 chip with exact text 'Option 5'
    - expect: The remaining option list contains exactly 9 items (all of Option 1-10 except Option 5)

#### 2.3. Selecting the first and last options in the list (boundary positions) both work correctly

**File:** `tests/components/multiselect/multiselect-selection.spec.ts`

**Steps:**
  1. Navigate to '/components/multiselect', open form-1, select 'Option 1' (first item in the list)
    - expect: A chip with exact text 'Option 1' is visible
  2. Without reloading, reopen if needed and select 'Option 10' (last item in the list)
    - expect: form-1 now has exactly 2 chips: 'Option 1' and 'Option 10', confirming both list-boundary positions are selectable, not just middle items

#### 2.4. Live substring, case-insensitive search filtering narrows the option list without affecting existing chips

**File:** `tests/components/multiselect/multiselect-selection.spec.ts`

**Steps:**
  1. Navigate to '/components/multiselect', open form-1, type '10' into the search box
    - expect: The option list narrows to exactly 1 item: 'Option 10' (substring match on the digit '10', not a prefix-only match)
  2. Clear the search box and type '1' instead
    - expect: The option list narrows to exactly 2 items: 'Option 1' and 'Option 10' (both contain the substring '1'), confirming substring matching rather than exact/prefix matching
  3. Clear the search box and type the lowercase, spaced string 'option 3'
    - expect: The option list narrows to exactly 1 item: 'Option 3', confirming the filter is case-insensitive
  4. Clear the search box entirely and select 'Option 6', then type 'xyz' (a string matching no option label)
    - expect: The option list container displays the exact text 'No Options Available' in place of any '<li>' items
    - expect: The existing 'Option 6' chip remains visible and unaffected by the unmatched filter text

#### 2.5. Removing a self-selected chip via its cancel icon returns that option to the open list and clears the current search filter

**File:** `tests/components/multiselect/multiselect-selection.spec.ts`

**Steps:**
  1. Navigate to '/components/multiselect', open form-1, select 'Option 7', then type a non-matching filter string 'zzz' into the search box (confirming 'No Options Available' is shown)
    - expect: 'No Options Available' text is visible and the 'Option 7' chip is still present
  2. Click the 'Option 7' chip's '.icon_cancel' image
    - expect: form-1 has exactly 0 chips
    - expect: The search box's value is now exactly '' (empty), confirming the filter is cleared as a side effect of chip removal
    - expect: The full original 10-item option list ('Option 1' through 'Option 10') is visible again, including 'Option 7' back in its original position

### 3. Multiselect - Exhausting All Options (Form 2)

**Seed:** `tests/seed.spec.ts`

#### 3.1. Selecting all three available options one at a time displays all three chips and progressively empties the list

**File:** `tests/components/multiselect/multiselect-exhaustion.spec.ts`

**Steps:**
  1. Navigate to '/components/multiselect', open form-2's dropdown, select 'Option 1'
    - expect: form-2 has exactly 1 chip ('Option 1')
    - expect: The remaining option list contains exactly 2 items: 'Option 2', 'Option 3'
  2. Select 'Option 2' from the still-open list
    - expect: form-2 has exactly 2 chips ('Option 1', 'Option 2')
    - expect: The remaining option list contains exactly 1 item: 'Option 3'
  3. Select the final remaining option 'Option 3'
    - expect: form-2 has exactly 3 chips: 'Option 1', 'Option 2', 'Option 3' (i.e. every available option in this form is now selected)
    - expect: The option list container now shows the exact text 'No Options Available' in place of any '<li>' items, confirming the full-exhaustion empty state

#### 3.2. Deselecting one chip after full exhaustion returns exactly that option to the list and clears the empty-state message

**File:** `tests/components/multiselect/multiselect-exhaustion.spec.ts`

**Steps:**
  1. Navigate to '/components/multiselect', open form-2, select all 3 options in order (Option 1, Option 2, Option 3), confirming 'No Options Available' is shown
    - expect: 'No Options Available' text is visible within form-2 and form-2 has exactly 3 chips
  2. Click the 'Option 2' chip's cancel icon
    - expect: form-2 now has exactly 2 chips: 'Option 1' and 'Option 3' (Option 2 specifically removed, the other two untouched)
    - expect: 'No Options Available' is no longer shown; the option list now shows exactly 1 item: 'Option 2', confirming the empty-state message correctly reverts the moment at least one option becomes available again

### 4. Multiselect - Removing Pre-Selected Items (Form 3)

**Seed:** `tests/seed.spec.ts`

#### 4.1. Form-3 loads with exactly two pre-selected chips (Option 4, Option 5) and 8 remaining options, confirmed on fresh navigation

**File:** `tests/components/multiselect/multiselect-removal.spec.ts`

**Steps:**
  1. Navigate to '/components/multiselect' on a fresh context and inspect form-3 without any interaction
    - expect: form-3 has exactly 2 chips with exact text 'Option 4' and 'Option 5' in that order
    - expect: Opening form-3's dropdown shows exactly these 8 remaining options, in this order: 'Option 1', 'Option 2', 'Option 3', 'Option 6', 'Option 7', 'Option 8', 'Option 9', 'Option 10'

#### 4.2. Removing both pre-selected chips one at a time returns both options to the list and leaves zero chips

**File:** `tests/components/multiselect/multiselect-removal.spec.ts`

**Steps:**
  1. Navigate to '/components/multiselect', click the 'Option 4' chip's '.icon_cancel' icon in form-3
    - expect: form-3 now has exactly 1 chip: 'Option 5' only
    - expect: Opening form-3's list shows 'Option 4' back among the 9 remaining options, in its original list-order position (before Option 5, Option 6, ...)
  2. Click the remaining 'Option 5' chip's '.icon_cancel' icon
    - expect: form-3 now has exactly 0 chips ('.chip' count is 0)
    - expect: Opening form-3's list shows all 10 original options ('Option 1' through 'Option 10') present again, confirming full reversibility

#### 4.3. Removing a chip using a bounded retry loop (defensive pattern from the legacy spec) still results in exactly zero chips with no leftover/stuck chip

**File:** `tests/components/multiselect/multiselect-removal.spec.ts`

**Steps:**
  1. Navigate to '/components/multiselect'. In a loop capped at a small sane maximum (e.g. 5 iterations, since form-3 never has more than 2 pre-selected chips), repeatedly read the current '.chip' count in form-3, break if it is 0, otherwise click the FIRST chip's cancel icon and wait for the chip count to decrease by exactly 1 before the next iteration
    - expect: The loop terminates (does not hit the iteration cap) with form-3's chip count at exactly 0
    - expect: No console errors were logged during the removal sequence

#### 4.4. Re-selecting a removed pre-selected option makes it reappear as a chip and disappear from the list again (round-trip)

**File:** `tests/components/multiselect/multiselect-removal.spec.ts`

**Steps:**
  1. Navigate to '/components/multiselect', remove the 'Option 4' pre-selected chip in form-3, then open the list and click 'Option 4' again to re-select it
    - expect: form-3 has exactly 2 chips again: 'Option 5' and 'Option 4' (Option 4 now appears LAST since it was re-added most recently, not restored to its original first position) — confirming chip order reflects current selection order, not the original default order
    - expect: 'Option 4' no longer appears in the open option list

### 5. Multiselect - Keyboard Interaction

**Seed:** `tests/seed.spec.ts`

#### 5.1. ArrowDown moves the keyboard highlight forward through the option list one item per keypress

**File:** `tests/components/multiselect/multiselect-keyboard.spec.ts`

**Steps:**
  1. Navigate to '/components/multiselect', click form-1's search textbox to open and focus it, then read the option list HTML
    - expect: The first option 'Option 1' carries classes including 'highlightOption' and 'highlight' by default; no other option does
  2. Press 'ArrowDown' once
    - expect: The highlight classes move to 'Option 2' specifically ('Option 1' no longer carries them, 'Option 2' now does)
  3. Press 'ArrowDown' two more times (three total)
    - expect: The highlight classes are now on 'Option 4', confirming each ArrowDown press advances the highlight exactly one position forward through the list in DOM order

#### 5.2. Enter selects the currently keyboard-highlighted option, producing an identical result to a mouse click

**File:** `tests/components/multiselect/multiselect-keyboard.spec.ts`

**Steps:**
  1. Navigate to '/components/multiselect', focus form-1's search textbox, press 'ArrowDown' once (moving highlight to 'Option 2'), then press 'Enter'
    - expect: form-1 now has exactly 1 chip with exact text 'Option 2', matching the item that was highlighted at the moment Enter was pressed
    - expect: 'Option 2' no longer appears in the remaining option list

#### 5.3. [QUIRK] Escape does not close the open option list, unlike common combobox conventions

**File:** `tests/components/multiselect/multiselect-keyboard.spec.ts`

**Steps:**
  1. Navigate to '/components/multiselect', click form-1's search textbox to open its option list (confirm '.optionListContainer' class is 'displayBlock'), then press 'Escape'
    - expect: '.optionListContainer' class is STILL 'displayBlock' immediately after pressing Escape (the list remains visibly open) — this is a genuine, reproducible deviation from typical combobox/select keyboard conventions and must not be asserted as closing behavior

#### 5.4. Clicking outside an open form's widget closes only that widget's list without altering its chip selections

**File:** `tests/components/multiselect/multiselect-keyboard.spec.ts`

**Steps:**
  1. Navigate to '/components/multiselect', open form-1's dropdown and select 'Option 3' (list remains open), then click the page's 'Multiselect' heading (an element clearly outside the widget)
    - expect: form-1's '.optionListContainer' class reverts to 'displayNone' (closed)
    - expect: form-1 still has exactly 1 chip: 'Option 3' (the click-outside action did not clear or alter the existing selection)

### 6. Multiselect - Cross-Form Independence and Reload Persistence

**Seed:** `tests/seed.spec.ts`

#### 6.1. Interacting with one form does not alter the chip state or option list of either other form

**File:** `tests/components/multiselect/multiselect-independence.spec.ts`

**Steps:**
  1. Navigate to '/components/multiselect'. Record form-2's and form-3's chip counts and text as a baseline (expect form-2: 0 chips; form-3: 2 chips, 'Option 4' and 'Option 5')
    - expect: Baseline recorded matches the documented defaults
  2. In form-1 only: open its dropdown, select 'Option 2' and 'Option 6', then filter with text 'zzz' to trigger 'No Options Available' within form-1
    - expect: form-1 shows exactly 2 chips ('Option 2', 'Option 6') and 'No Options Available' text scoped within form-1
  3. Re-read form-2's and form-3's state without navigating away
    - expect: form-2 still has exactly 0 chips (unchanged from baseline)
    - expect: form-3 still has exactly 2 chips: 'Option 4' and 'Option 5' (unchanged from baseline)
    - expect: confirming form-1's selection, filtering, and empty-state trigger had zero cross-contamination effect on the other two independent widgets

#### 6.2. No selection state persists across a page reload for any of the three forms; each resets to its documented fresh-load default

**File:** `tests/components/multiselect/multiselect-persistence.spec.ts`

**Steps:**
  1. Navigate to '/components/multiselect'. In form-1, select 'Option 1' and 'Option 2'. In form-2, select all 3 options (triggering 'No Options Available'). In form-3, remove both default chips ('Option 4', 'Option 5') so it has 0 chips
    - expect: Before reload: form-1 has 2 chips, form-2 has 3 chips with 'No Options Available' shown, form-3 has 0 chips — all reflecting the just-performed interactions
  2. Reload the page (page.reload())
    - expect: form-1 has exactly 0 chips and its full 10-item option list is available again
    - expect: form-2 has exactly 0 chips and its full 3-item option list is available again (no 'No Options Available' message present)
    - expect: form-3 has exactly 2 chips again with exact text 'Option 4' and 'Option 5' — confirming this is a static per-load default the app always re-renders, not any form of persisted state (no localStorage/sessionStorage/URL state involved)

#### 6.3. No API/network requests fire as a result of any multiselect interaction across all three forms (purely client-side component)

**File:** `tests/components/multiselect/multiselect-independence.spec.ts`

**Steps:**
  1. Navigate to '/components/multiselect', begin recording network requests, then interact with all three forms (select options in form-1, exhaust form-2, remove and re-add a chip in form-3, and type a search filter in form-1)
    - expect: No XHR/fetch network request specific to any multiselect action is observed (only the pre-existing Next.js RSC prefetch requests for unrelated nav links, the same pattern documented on every other component page in this suite) — confirming this plan requires no API-level test coverage
