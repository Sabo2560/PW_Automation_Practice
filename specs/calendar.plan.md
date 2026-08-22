# Calendar Component Test Plan

## Application Overview

**No prior coverage exists for this component.** `Glob` on `specs/*.plan.md` and `tests/components/**` confirmed there is no `calendar.plan.md` and no `tests/components/calendar/` directory anywhere in the repo before this plan. Everything below was derived from scratch through live exploration on 2026-08-21 (Friday); no assumption was carried over from any prior legacy spec (none exists) or from any particular calendar-widget library's typical behavior — every claim below was independently verified live via the accessibility snapshot, `document.querySelectorAll`/`outerHTML` inspection, and direct interaction, including exploring the underlying HTML/class names to identify the library in use (confirmed to be MUI X Date/Time Pickers via `MuiDateCalendar-root`, `MuiPickersDay-root`, `MuiPickersPopper-root`, etc. class names — noted here only because it explains several confirmed behaviors below, not assumed a priori).

**Page Object:** `CalendarPage.ts` (new — does not yet exist in `tests/pages/`). This page (https://www.automationplayground.dev/components/calendar, heading "Calendar", level 1) is structurally very different from every other exercise page planned so far in this repo: it presents THREE independent exercises, each preceded by a `<label data-testid="form-label">` instructional line, but almost none of the interactive controls themselves carry a custom `data-testid` — only the Basic Date field's outer wrapper (`data-testid="basic-date"`) and the library's own icon SVGs (`data-testid="CalendarIcon"` ×2, `data-testid="ClockIcon"` ×1) carry any `data-testid` at all. `CalendarPage.ts` must therefore locate controls primarily via accessible role+name (confirmed unique per control) rather than `data-testid`, the same fallback pattern already established in this repo's Radio plan (which used `.first()`/`.last()` scoping to work around duplicate ids) — it should expose: a `gotoCalendar()` navigation helper; `basicDateInput` (`getByRole('textbox', { name: 'Basic date field' })`); `startDateInput`/`endDateInput` (`getByRole('textbox', { name: 'Start Date'/'End Date', exact: true })` — both accessible names are confirmed unique); `startDateChooseButton`/`endDateChooseButton` (`getByRole('button', { name: /^Choose date/ }).first()`/`.last()` — confirmed necessary because both buttons share the identical accessible name `"Choose date"` before any date is picked, exactly the duplicate-accessible-name situation the Radio plan's `.first()/.last()` pattern was built for; the regex additionally matches the accessible name's live, confirmed post-selection format `"Choose date, selected date is D MMM YYYY"`, e.g. `"Choose date, selected date is 21 Aug 2026"`); `timeInput` (`getByRole('textbox', { name: 'Select Time' })`) and `timeChooseButton` (`getByRole('button', { name: /^Choose time/ })`, confirmed unique, becomes `"Choose time, selected time is HH:MM"` once set); `startDateHelperText`/`endDateHelperText` (`page.locator('p.MuiFormHelperText-root').first()`/`.last()` — confirmed these are the ONLY two `<p class="MuiFormHelperText-root...">` elements on the page, always present from first load, in fixed DOM order Start-then-End); `selectedTimeText` (`page.getByText(/^Selected Time:/)` — confirmed this paragraph, unlike the two helper-text paragraphs above, does NOT exist in the DOM at all until a time is first chosen, and is a plain `<p class="text-secondary mt-2">`, not a `MuiFormHelperText-root`, so it is not conflated with the date fields' helper text by the shared-class locator); `startDateDialog`/`endDateDialog`/`timeDialog` (`getByRole('dialog', { name: 'Start Date'/'End Date'/'Select Time' })` — each popup's accessible dialog name was confirmed live to exactly equal its field's label); `dayCell(dialog, day)` (`dialog.getByRole('gridcell', { name: String(day), exact: true })`); `previousMonthButton(dialog)`/`nextMonthButton(dialog)` (`dialog.getByRole('button', { name: 'Previous month'/'Next month' })`); `yearViewSwitchButton(dialog)` (`dialog.getByRole('button', { name: /switch to year view/ })`); `yearRadio(dialog, year)` (`dialog.getByRole('radio', { name: String(year), exact: true })`); `hourOption(dialog, hour)`/`minuteOption(dialog, minute)` (`dialog.getByRole('option', { name: \`${hour} hours\`/\`${minute} minutes\` })`); a `selectDateViaPicker(chooseButton, dialog, targetDate)` helper that opens the picker and clicks Next/Previous month as needed by comparing the header label text to the target month/year before clicking the target day cell; and — critically, since "today"/"tomorrow"/"5 days from today" are all exercise instructions tied to the real calendar date, not fixed values — a set of pure date-computation helpers (`getTodayDDMMYYYY()`, `getDateOffsetDDMMYYYY(days)`, `getTodayToDateString()`, `getDateOffsetToDateString(days)`) that compute values live via `new Date()` at test-run time, so no scenario in this plan hardcodes today's exploration-time date (2026-08-21) or any date derived from it — exactly the same "never hardcode an observed instant-in-time value" principle this repo's Wait plan established for randomized delays, applied here to the calendar's real-date dependency instead.

All interactions on this page are purely client-side: `browser_network_requests` was checked after extensive interaction across all three widgets (opening/closing every popup, selecting dozens of dates/times, navigating ~900 months forward, typing directly into every input, reloading) and zero XHR/fetch requests specific to any calendar action were observed — only the same pre-existing Next.js RSC prefetch requests for unrelated nav links documented on every other component page in this suite. This plan therefore contains no API-level test coverage. Zero console errors or warnings were observed during any exploration flow (`browser_console_messages` with `level: error` returned 0 total messages after the full exploration pass).

**Page structure and exact labels (verified live, DOM order):** three `[data-testid="form-label"]` elements read exactly: `"Set date input to tomorrow"` (Basic Date field), `"Select start date as today and end date as 5 days from today"` (Start/End Date range), `"Set time input to 14:35 and verify the text"` (Time picker). The "Insight" section (heading level 2; paragraph `"On completion of this exercise, you can learn the following concepts:"`; concept list, confirmed exactly: `'Fill basic date fields with date values'`, `'Select a date range with start and end date'`, `'Validate error for invalid date range'`, `'Select and verify time using time picker'`; Github solution link to `https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/calendar/calendar.spec.ts`) is visible immediately with no interaction required, matching every other component page's pattern.

**Basic Date field — confirmed behaviors (fully unconstrained, no date-range restriction at all):** placeholder `"DD/MM/YYYY"`, empty by default, no helper/error text element exists anywhere for this field (confirmed via full `outerHTML` inspection of its container both before and after triggering an invalid value — only `aria-invalid` on the `<input>` and a `Mui-error` CSS class on the input/label wrapper change; no visible message text ever appears). Typing a fully valid date (e.g. tomorrow) sets the value and leaves `aria-invalid="false"`. Typing a CLEARLY PAST date (confirmed live with `01/01/2020`) is accepted with `aria-invalid="false"` and no restriction whatsoever — a deliberate, confirmed contrast with the Start/End Date fields below, which DO enforce a minimum of today. Typing a digit sequence that cannot form a valid calendar date (confirmed live with `32/13/2026`) sets `aria-invalid="true"` (and adds the `Mui-error` class), but the resulting displayed VALUE is not a clean rejection — it becomes a reformatted/shifted value (confirmed live: `32/13/2026` typed character-by-character resulted in a stored value of `13/02/0026`) due to the underlying MUI segment-masking input behavior; see Known Quirks #3 below — this exact reformatted output should not be asserted as a general rule, only the resulting `aria-invalid="true"` state is reliable. Retyping a clean valid value after an invalid one clears `aria-invalid` back to `"false"` (confirmed full round-trip).

**Start/End Date range — confirmed behaviors:** both fields share placeholder `"DD/MM/YYYY"`, both empty by default, and BOTH always render a `MuiFormHelperText-root` `<p>` from first load — default text exactly `"Please select a start date"` / `"Please select an end date"` — which changes, once a date is picked (via click OR direct typing), to exactly `"Selected: "` + that date's native JS `Date.prototype.toDateString()` output (confirmed live across 6+ distinct selections, e.g. `"Selected: Fri Aug 21 2026"`, `"Selected: Wed Aug 26 2026"`, `"Selected: Sat Aug 21 2027"`, `"Selected: Wed Jan 01 2020"` — always exactly the pattern `Ddd Mmm DD YYYY`, matching `toDateString()` byte-for-byte). The trigger button's accessible name similarly changes from the generic `"Choose date"` to `"Choose date, selected date is D MMM YYYY"` (a DIFFERENT date format than the input value or helper text — no leading zero on the day, abbreviated month, e.g. `"Choose date, selected date is 21 Aug 2026"`) — confirmed live and a useful, distinct assertion target from the input's own `DD/MM/YYYY` value. Clicking any enabled day cell in the popup grid immediately (a) sets the field's typed value, (b) updates the helper text, (c) updates the button's accessible name, AND (d) closes the popup — all in one click, with no separate "confirm/OK" step (confirmed live on multiple selections in both the Start and End Date popups). **Min-date constraint (today):** on a completely fresh load, BOTH pickers independently disable every day before today in their grid (confirmed live for both Start Date and End Date popups opened before the other field had any value — days 1-20 of the exploration month were all `disabled` while day 21, today, was enabled) — confirmed via inspecting the real HTML `disabled` attribute (`<button ... disabled="" role="gridcell" ...>`), not merely a CSS/visual state, so Playwright's actionability check will correctly refuse to interact with them. Today's own cell carries the class `MuiPickersDay-today` and `aria-current="date"` but — **this is the "today" visual-state quirk flagged as a required exploration target** — is NOT `aria-selected="true"` merely for being today on a fresh, nothing-yet-picked popup (confirmed live: `aria-selected="false"` on today's cell before any click); a naive test asserting "today comes pre-selected" would be wrong — it is only visually/semantically marked as "today", not selected. **Dynamic cross-field constraint (this IS the "Validate error for invalid date range" concept from the Insight list, expressed via disabled cells in the normal picker flow):** once Start Date has a value, the End Date popup's minimum dynamically rises to that Start Date value (days between today and the new Start Date become newly disabled in the End Date grid — confirmed live: after Start=24 Aug, End Date's grid showed 1-23 Aug all disabled, versus only 1-20 disabled before Start was set). Symmetrically, once End Date has a value, the Start Date popup's maximum dynamically caps at that End Date value (days after End Date, and following months once fully out of range, become disabled in the Start Date grid — confirmed live: after End=28 Aug, Start Date's own grid showed 29-31 Aug newly disabled and both "Previous month" and "Next month" disabled simultaneously, since the entire viable range collapsed to within the currently-displayed month). **Typed-value invalid-range validation (the only reliable, exactly-reproducible "invalid" negative-path state on this page):** typing an End Date value earlier than the currently-selected Start Date directly into the End Date textbox (bypassing the picker's disabled-cell prevention entirely) is ACCEPTED as a typed value but sets `aria-invalid="true"` AND adds the `Mui-error` class to BOTH fields' inputs and BOTH helper-text paragraphs simultaneously (confirmed live: typing `10/08/2026` into End Date while Start Date held `21/08/2026` marked both `_r_1_` and `_r_4_` inputs `aria-invalid="true"`, both helper texts gained `Mui-error`) — critically, the helper text CONTENT itself is unchanged (still reads `"Selected: <date>"` for each field, not replaced by an error message) — the only observable signal of the invalid-range error is the `aria-invalid` attribute and the `Mui-error` CSS class, never a distinct error message string. Fixing the range (typing a valid later End Date) clears `aria-invalid` back to `"false"` on both fields (confirmed full round-trip). Typing a clearly past Start Date directly (bypassing the picker, e.g. `01/01/2020`) similarly sets `aria-invalid="true"` on that field alone, confirming the min-today constraint is enforced for typed input too, not merely for the picker UI (a direct, confirmed contrast with the Basic Date field, which has no such constraint under typing at all).

**Month navigation and year view — confirmed behaviors:** `"Previous month"` is disabled (real `disabled` HTML attribute) whenever the displayed month is the current (today's) month, since the min-date floor makes an earlier month entirely unreachable — confirmed on fresh load for both Start and End Date pickers. `"Next month"` is enabled by default (confirmed on a picker with no paired-field constraint yet) and was driven forward programmatically ~900 times with real state-settling delays between clicks; navigation proceeded cleanly month-by-month with no artificial short-term cap, ultimately reaching **December 2099** where `"Next month"` became disabled (real HTML `disabled` attribute) — this is MUI X Date Pickers' own library-default `maxDate` (2099-12-31), not a custom app-level restriction, and is the true, confirmed upper boundary of this component. The calendar header (e.g. `"August 2026"`) is clickable and reveals a `radiogroup` "year view" via a dedicated `"...switch to year view"` button; the year-view radios were confirmed to span exactly the current year (2026 at exploration time) through 2099 inclusive (74 options), consistent with the same library-default max. **[Significant, non-obvious quirk — most important finding of this exploration]** Clicking a year radio in year-view does NOT merely navigate to a different year for further browsing — it immediately COMMITS a new selected date, reusing the same day-of-month/month as whatever was previously selected but in the newly clicked year, and this becomes the field's actual live value (confirmed live: End Date was `21/08/2026`; opening year-view and clicking the `"2027"` radio immediately changed the End Date input to `21/08/2027` and its helper text to `"Selected: Sat Aug 21 2027"`, BEFORE any day cell was subsequently clicked); the popup remains open afterward showing the day-grid for the new year (allowing further refinement by clicking a different day), but if the popup is dismissed (Escape, or clicking away) at that point without further interaction, the year-only change is what persists (confirmed: value remained `21/08/2027` after pressing Escape with no further click). A test author naively assuming year-selection is purely a "navigation aid" with no selection side effect would be wrong.

**Keyboard interaction — confirmed behaviors:** with a day-grid popup open and a day cell focused (the currently-selected day is focused by default when the popup opens, confirmed live), `ArrowRight` moves FOCUS to the next day cell without changing the SELECTED date (confirmed live: Start Date remained selected/shown as `21` while `22` became merely `[active]`-focused after one `ArrowRight`); `ArrowLeft` was independently confirmed to move focus back the other direction. Pressing `Enter` on a focused (but not yet selected) day cell commits that cell as the new selection and closes the popup, exactly matching a mouse click's outcome (confirmed live both directions: ArrowRight+Enter advanced the selection by one day, and a subsequent ArrowLeft+Enter reverted it).

**Time picker — confirmed behaviors:** placeholder `"hh:mm"`, empty by default, and — unlike Start/End Date — **no helper-text-equivalent paragraph exists in the DOM at all until a time is first chosen** (confirmed via full DOM inspection before interaction: zero matching elements). Once a time is set, a distinct, plain `<p class="text-secondary mt-2">` (NOT a `MuiFormHelperText-root`, not tied via `aria-describedby`) appears reading exactly `"Selected Time: HH:MM:SS"` — always with `:00` seconds appended even though seconds are never independently selectable (confirmed on 3 distinct selections: `"14:00:00"`, `"14:35:00"`, `"14:37:00"`). The popup presents two `listbox`es: `"Select hours"` with all 24 hours `00`-`23` enabled/unrestricted, and `"Select minutes"` with only 12 options in 5-minute increments (`00, 05, 10, ..., 55`) — confirmed live, exhaustively enumerated. Clicking an hour option immediately updates the input/would-be paragraph to that hour with minutes defaulting to `"00"`, WITHOUT closing the popup (confirmed live: after clicking `"14 hours"`, input read `"14:00"` and the popup remained open, still showing the minutes listbox for further selection). Clicking a minute option immediately updates the input/paragraph AND auto-closes the popup (confirmed: after clicking `"35 minutes"`, popup closed and input showed `"14:35"`) — no separate "OK" confirm click is required for the auto-close/commit behavior, though a visible `"OK"` button also exists in the popup and was not separately exercised (see Ambiguous section). **Manual typing bypasses the 5-minute-increment UI restriction entirely:** typing `14:37` directly into the input (a minute value never offered by the dropdown) was accepted as fully valid — `"Selected Time: 14:37:00"`, `aria-invalid="false"` (confirmed live) — confirming the 5-minute restriction is a picker-UI-only convenience, not a validation rule enforced on the underlying value. Typing a clearly impossible time (confirmed live with `25:99`) triggered the same MUI segment-masking quirk documented for the Basic Date field (resulting stored value became `05:09`, with `aria-invalid` remaining `"false"`, not `"true"`) — flagged as the same Known Quirk #3 below; not to be relied on for a general "invalid time is rejected" assertion. No min/max time-of-day restriction was observed or expected (this exercise's time picker is independent of the date-range exercise; no evidence links them).

**Cross-widget independence and reload persistence:** the Basic Date field, the Start/End Date range, and the Time picker were confirmed fully independent of one another throughout this exploration — interacting extensively with any one produced zero observable change in the other two. **No state persists across a page reload for ANY of the three widgets:** after setting all three widgets to non-default values and reloading, the Basic Date field returned to empty, Start/End Date both returned to empty with their original default helper text (`"Please select a start date"`/`"Please select an end date"`) and default `"Choose date"` button names, and the Time field returned to empty with its `"Selected Time:"` paragraph entirely ABSENT from the DOM again (not merely cleared) — confirmed via direct DOM re-inspection after `page.goto()` following prior interaction, exactly the same "no localStorage/sessionStorage/URL state involved" pattern documented across every other component plan in this repo.

**Known bugs / notable quirks:**
1. **[Confirmed, most significant finding]** Selecting a year in the calendar popup's year-view is not a pure navigation action — it immediately commits a new selected date (same day-of-month/month, new year) as the field's live value, persisting even if the popup is dismissed without any further day-cell click. See the Month navigation section above for the full confirmed repro.
2. **[Confirmed, a real and easily-missed distinction]** The Basic Date field enforces NO date-range restriction whatsoever (past dates freely accepted), while the Start/End Date fields both enforce a hard minimum of today (enforced both in the picker's disabled cells AND against direct typed input via `aria-invalid`). A test author assuming all three "date" inputs on this page share the same validation rules would be wrong.
3. **[Confirmed, moderate-complexity quirk, deliberately NOT relied on for exact-value assertions in this plan]** Typing a digit sequence into any of the Basic Date, Start Date, End Date, or Select Time fields that cannot form a valid value (e.g. day `32`, month `13`, or an out-of-range time) does not cleanly reject the input — MUI's internal segment-masking logic reformats/shifts the digits into a different, hard-to-predict-in-advance value (two confirmed live examples: `32/13/2026` → `13/02/0026`; `25:99` → `05:09`) while `aria-invalid` may or may not become `true` depending on the specific case (confirmed `true` for the date-field example, confirmed still `false` for the time-field example). This plan's negative-path scenarios rely exclusively on the ONE clean, fully deterministic, confirmed-reliable negative-path signal on this page — the cross-field End-before-Start invalid-range check — rather than on these masking-dependent single-field cases.
4. **[Confirmed, not a bug]** Today's calendar cell is visually/semantically marked distinctly (`MuiPickersDay-today` class, `aria-current="date"`) but is never itself pre-selected (`aria-selected="false"`) on a fresh, nothing-yet-picked popup — a naive test asserting today comes pre-selected by default would be wrong.
5. **[Confirmed, not a bug]** The Time picker's minutes dropdown only offers 5-minute increments, but this is a UI-only convenience — direct typing accepts arbitrary minute values with no validation error. A test asserting the underlying value can only ever be a multiple of 5 would be wrong.

**Ambiguous/unverified areas explicitly flagged for testers:**
- The exact general algorithm behind the MUI segment-masking/reformatting quirk (Known Quirk #3) was not characterized beyond the two confirmed input/output pairs documented above; scenarios in this plan deliberately avoid asserting exact reformatted output for any OTHER malformed input than the two specifically confirmed cases.
- The popup's visible `"OK"` button (present alongside the hour/minute listboxes in the Time picker) was observed but not independently exercised as an alternative confirm/close mechanism — only the "click a minute option auto-closes" path was directly confirmed live. Whether `"OK"` behaves identically, or has some distinct effect (e.g. confirming a partially-selected hour-only state), was not tested.
- Touch/mobile-specific interaction (tapping day cells, listbox options, or navigation buttons on an emulated touch viewport) was not independently exercised during this pass.
- Whether `ArrowUp`/`ArrowDown`/`Home`/`End`/`PageUp`/`PageDown` (standard MUI DateCalendar keyboard shortcuts for week-jump/month-jump) work as the library typically implements them was not independently exercised — only `ArrowLeft`/`ArrowRight`/`Enter` were directly confirmed live in this pass.
- The Time picker's hour/minute `listbox`es were not independently keyboard-tested (e.g. Arrow-key navigation within the listbox, or Enter to select a focused-but-unclicked option) — only direct mouse clicks were confirmed.
- The "BACK" button in the shared page header was not exercised, consistent with the treatment of this same shared control in every other component plan in this repo.
- Whether the confirmed December-2099 upper navigation boundary and the confirmed 2026-2099 year-view range would shift correctly in a future year's test run (e.g. becoming 2027-2099, 2028-2099, etc. as real time advances) is expected but not something this exploration could verify beyond the single 2026 exploration date — any scenario asserting the year-view's exact set of options should compute the expected lower bound as the current year at test-run time, not hardcode 2026.


## Test Scenarios

### 1. Calendar - Initial Load and Default State

**Seed:** `tests/seed.spec.ts`

#### 1.1. 1.1. Calendar page loads with all three exercise sections, labels, and Insight section correctly rendered — Priority: Critical

**File:** `tests/components/calendar/calendar-load.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar' on a fresh browser context
    - expect: Page loads successfully (HTTP 200, no console errors)
    - expect: Heading 'Calendar' (level 1) is visible
  2. Inspect all three 'form-label' elements in DOM order
    - expect: The three labels read exactly, in order: 'Set date input to tomorrow', 'Select start date as today and end date as 5 days from today', 'Set time input to 14:35 and verify the text'
  3. Inspect the 'Insight' section without performing any click/expand interaction
    - expect: Heading 'Insight' (level 2) is visible immediately with no interaction required
    - expect: The concept list contains exactly the items 'Fill basic date fields with date values', 'Select a date range with start and end date', 'Validate error for invalid date range', 'Select and verify time using time picker'
    - expect: A 'Github solution' link is visible with href 'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/calendar/calendar.spec.ts'

#### 1.2. 1.2. The Basic Date field is empty by default with no helper/error text present anywhere — Priority: High

**File:** `tests/components/calendar/calendar-load.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Without interacting, read the Basic Date field's value, placeholder, and aria-invalid attribute, and check for any helper/error text element in its container
    - expect: The input's value is exactly an empty string
    - expect: The placeholder reads exactly 'DD/MM/YYYY'
    - expect: aria-invalid is exactly 'false'
    - expect: No paragraph/helper-text element of any kind exists inside the Basic Date field's container

#### 1.3. 1.3. Start Date and End Date fields are both empty by default with their documented placeholder helper text — Priority: Critical

**File:** `tests/components/calendar/calendar-load.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Without interacting, read the Start Date and End Date inputs' values and their associated helper-text paragraphs
    - expect: Both inputs' values are exactly an empty string, both placeholders read exactly 'DD/MM/YYYY'
    - expect: The Start Date helper text reads exactly 'Please select a start date'
    - expect: The End Date helper text reads exactly 'Please select an end date'
    - expect: Both 'Choose date' trigger buttons have the accessible name exactly 'Choose date' (not yet suffixed with a selected-date description)

#### 1.4. 1.4. The Select Time field is empty by default with NO 'Selected Time' paragraph present in the DOM at all — Priority: High

**File:** `tests/components/calendar/calendar-load.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Without interacting, read the Select Time input's value and search the page for any element containing the text 'Selected Time:'
    - expect: The input's value is exactly an empty string, placeholder reads exactly 'hh:mm'
    - expect: Zero elements matching text 'Selected Time:' exist anywhere in the DOM (the paragraph is entirely absent, not merely empty or hidden), confirming this differs from the Start/End Date fields which always render a default helper-text paragraph even before any selection
    - expect: The 'Choose time' trigger button has the accessible name exactly 'Choose time'

### 2. Calendar - Basic Date Field (Free-form, Unconstrained)

**Seed:** `tests/seed.spec.ts`

#### 2.1. 2.1. Typing tomorrow's date (computed dynamically) into the Basic Date field sets the exact DD/MM/YYYY value with no validation error — Priority: Critical

**File:** `tests/components/calendar/calendar-basic-date.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Compute 'tomorrow' dynamically at test-run time (new Date() + 1 day) and format it as DD/MM/YYYY with zero-padding. Click the Basic Date field and type the computed value
    - expect: The Basic Date input's value equals exactly the dynamically-computed DD/MM/YYYY string for tomorrow (never a hardcoded date literal)
    - expect: aria-invalid on the input is exactly 'false' after typing

#### 2.2. 2.2. Typing a clearly past date (computed dynamically, e.g. 10 years before today) into the Basic Date field is accepted with no restriction — Priority: High

**File:** `tests/components/calendar/calendar-basic-date.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Compute a date 10 years before today dynamically, format as DD/MM/YYYY, type it into the Basic Date field
    - expect: The Basic Date input's value equals exactly the computed past-date string
    - expect: aria-invalid remains exactly 'false' — confirming this field enforces no minimum-date restriction at all, in direct contrast with the Start/End Date fields covered in a later suite

#### 2.3. 2.3. Typing an impossible date (day 32, month 13) sets aria-invalid=true, with no visible error message text appearing anywhere near the field — Priority: Medium

**File:** `tests/components/calendar/calendar-basic-date.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Click the Basic Date field, select all, and type '32/13/2026' character by character
    - expect: aria-invalid on the input becomes exactly 'true'
    - expect: The input's wrapper gains the 'Mui-error' CSS class
    - expect: No visible error-message text element appears in the field's container at any point (search confirms zero new text nodes beyond the input's own reformatted value) — confirming this field, unlike Start/End Date, never surfaces a textual error message, only the aria-invalid attribute and error styling

#### 2.4. 2.4. Retyping a valid date after an invalid one clears aria-invalid back to false — Priority: Medium

**File:** `tests/components/calendar/calendar-basic-date.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Type '32/13/2026' into the Basic Date field to reach the invalid state (confirm aria-invalid='true'). Select all and retype a dynamically-computed valid date (today's date, formatted DD/MM/YYYY)
    - expect: Before the fix: aria-invalid is 'true'
    - expect: After retyping a valid date: the input's value equals exactly the newly-typed valid date string, and aria-invalid is exactly 'false' again, confirming a full round-trip

### 3. Calendar - Date Range Selection via Picker (Happy Path)

**Seed:** `tests/seed.spec.ts`

#### 3.1. 3.1. Selecting Start Date = today and End Date = today+5 via the calendar popups matches the exercise's exact stated goal — Priority: Critical

**File:** `tests/components/calendar/calendar-date-range-selection.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Open the Start Date popup and click today's day cell (the cell carrying aria-current='date')
    - expect: The Start Date input's value equals exactly today's date formatted DD/MM/YYYY (computed dynamically)
    - expect: The Start Date helper text equals exactly 'Selected: ' + today's Date.prototype.toDateString() output (computed dynamically, e.g. 'Selected: Fri Aug 21 2026' shaped)
    - expect: The popup closes automatically after the single click
  2. Open the End Date popup and click the day cell corresponding to today+5 days (computed dynamically, navigating month if the +5 offset crosses a month boundary)
    - expect: The End Date input's value equals exactly (today+5 days) formatted DD/MM/YYYY
    - expect: The End Date helper text equals exactly 'Selected: ' + (today+5 days).toDateString()
    - expect: The popup closes automatically after the single click

#### 3.2. 3.2. Clicking a day cell commits the selection and closes the popup in a single click, with no separate confirm step — Priority: High

**File:** `tests/components/calendar/calendar-date-range-selection.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Open the End Date popup (confirm it is visible via role=dialog name='End Date'), then click a single enabled day cell
    - expect: Immediately after the single click, the dialog with role=dialog name='End Date' is no longer present/visible in the DOM — no further click (e.g. an 'OK' button) was required to commit or dismiss it
    - expect: The End Date input and helper text both reflect the clicked day

#### 3.3. 3.3. [QUIRK] Today's cell is marked as 'today' but is NOT pre-selected on a fresh, nothing-yet-picked popup — Priority: High

**File:** `tests/components/calendar/calendar-date-range-selection.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar' on a fresh context (Start Date not yet set). Open the Start Date popup and, without clicking any day, inspect today's day cell's class list and aria-selected attribute
    - expect: Today's cell's class list includes 'MuiPickersDay-today' and it carries aria-current='date'
    - expect: Today's cell's aria-selected attribute is exactly 'false' — confirming being 'today' is a distinct visual/semantic marker, not an implicit pre-selection

### 4. Calendar - Date Range Min/Max Boundaries and Disabled Dates

**Seed:** `tests/seed.spec.ts`

#### 4.1. 4.1. Start Date's calendar disables every day before today on a fresh load — Priority: Critical

**File:** `tests/components/calendar/calendar-date-range-boundaries.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar' on a fresh context. Open the Start Date popup and inspect the disabled attribute of every day cell in the currently-displayed (today's) month
    - expect: Every day cell numbered less than today's day-of-month has the real HTML 'disabled' attribute present
    - expect: Today's own cell and every day cell after it in the current month do NOT have the disabled attribute (are clickable)
    - expect: The 'Previous month' navigation button is disabled (real HTML disabled attribute)

#### 4.2. 4.2. End Date's calendar independently disables every day before today, before any Start Date is set — Priority: High

**File:** `tests/components/calendar/calendar-date-range-boundaries.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar' on a fresh context (Start Date left unset). Open the End Date popup directly and inspect the disabled attribute of every day cell in the currently-displayed month
    - expect: Every day cell numbered less than today's day-of-month has the disabled attribute present, identical to the Start Date picker's own independent default floor of today
    - expect: 'Previous month' is disabled for the same reason

#### 4.3. 4.3. Once Start Date is selected, End Date's calendar dynamically raises its minimum to that Start Date value — Priority: Critical

**File:** `tests/components/calendar/calendar-date-range-boundaries.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Select a Start Date 3 days after today (computed dynamically) via the picker. Then open the End Date popup and inspect the disabled state of the day cells between today and the new Start Date
    - expect: Before Start Date was set, only days before today would have been disabled in End Date's grid
    - expect: After Start Date is set to today+3, every day cell strictly between today and (today+3) inclusive-of-today-exclusive-of-start is now ALSO disabled in the End Date popup, in addition to the original before-today days — confirming End Date's floor dynamically tracks the selected Start Date, not merely today

#### 4.4. 4.4. Once End Date is selected, Start Date's calendar dynamically caps its maximum to that End Date value — Priority: Critical

**File:** `tests/components/calendar/calendar-date-range-boundaries.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Select an End Date 3 days after today (computed dynamically) via the picker (leave Start Date unset or set to today). Then open the Start Date popup and inspect day cells after the selected End Date within the same displayed month, plus the 'Next month' button
    - expect: Every day cell after the selected End Date (within the currently-displayed month) is disabled
    - expect: 'Next month' is disabled as well, since the entire remaining viable range collapses to within the currently-displayed month — confirming Start Date's ceiling dynamically tracks the selected End Date

#### 4.5. 4.5. Attempting to interact with a disabled day cell has no effect on the field's value — Priority: Medium

**File:** `tests/components/calendar/calendar-date-range-boundaries.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Open the Start Date popup and attempt Playwright's .click() on a disabled day cell from a past date (e.g. day 1 of the current month, if before today)
    - expect: The click attempt on the disabled cell does not change the Start Date field's value (it remains empty/unchanged from before the attempt), since Playwright's actionability check refuses to interact with a genuinely disabled element

### 5. Calendar - Invalid Date Range Validation (Typed Values)

**Seed:** `tests/seed.spec.ts`

#### 5.1. 5.1. [Critical negative path] Typing an End Date earlier than the selected Start Date marks BOTH fields aria-invalid, without changing either helper text's content — Priority: Critical

**File:** `tests/components/calendar/calendar-date-range-validation.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Select Start Date = today+10 (computed dynamically) via the picker. Then click the End Date textbox, select all, and type today+1 (a date clearly earlier than the Start Date) directly, bypassing the picker's disabled-cell prevention
    - expect: The End Date input's value equals exactly the typed today+1 string (the typed value IS accepted, not rejected outright)
    - expect: aria-invalid on the Start Date input is exactly 'true'
    - expect: aria-invalid on the End Date input is exactly 'true'
    - expect: The Start Date helper text still reads exactly 'Selected: ' + Start Date's toDateString() (unchanged content, not replaced by an error message)
    - expect: The End Date helper text still reads exactly 'Selected: ' + End Date's toDateString() (unchanged content)
    - expect: Both helper-text paragraphs gain the 'Mui-error' CSS class

#### 5.2. 5.2. Typing a past Start Date directly marks only that field aria-invalid, confirming the min-today rule applies to typed input too — Priority: High

**File:** `tests/components/calendar/calendar-date-range-validation.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Click the Start Date textbox and type a date clearly before today (computed dynamically as today minus 30 days)
    - expect: The Start Date input's value equals exactly the typed past-date string
    - expect: aria-invalid on the Start Date input is exactly 'true' — confirming the min-today constraint is enforced against typed input, not merely against the picker's disabled cells (a direct, confirmed contrast with the Basic Date field's total lack of restriction)

#### 5.3. 5.3. Fixing an invalid range by typing a valid later End Date clears aria-invalid on both fields — Priority: High

**File:** `tests/components/calendar/calendar-date-range-validation.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Reproduce the invalid-range state from scenario 5.1 (Start = today+10, End typed as today+1, both aria-invalid='true'). Then click the End Date textbox, select all, and type a valid later date (today+15, computed dynamically)
    - expect: The End Date input's value equals exactly the newly-typed today+15 string
    - expect: aria-invalid on the End Date input is exactly 'false'
    - expect: aria-invalid on the Start Date input is exactly 'false' — confirming the cross-field error state clears symmetrically on both fields once the range becomes valid again

### 6. Calendar - Date Range Month Navigation and Year View

**Seed:** `tests/seed.spec.ts`

#### 6.1. 6.1. Previous month is disabled at the current month on a fresh load for both Start and End Date pickers — Priority: High

**File:** `tests/components/calendar/calendar-date-range-navigation.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar' on a fresh context. Open the Start Date popup and inspect the 'Previous month' button's disabled state, then close it and repeat for the End Date popup
    - expect: 'Previous month' has the disabled attribute in both the Start Date and End Date popups, since the current (today's) month is the earliest reachable month under the min-today floor

#### 6.2. 6.2. Next month is enabled and navigates forward with no short-term artificial cap — Priority: Medium

**File:** `tests/components/calendar/calendar-date-range-navigation.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar' on a fresh context (no End Date set yet, so Start Date's picker has no upper constraint from a paired field). Open the Start Date popup and click 'Next month' 12 times in a row, recording the header label after each click
    - expect: 'Next month' remains enabled (not disabled) throughout all 12 clicks
    - expect: The header label advances by exactly one calendar month with each click (e.g. from the current month/year through to 12 months later), confirming no short-term artificial cap exists within at least a 1-year forward window

#### 6.3. 6.3. Next month becomes disabled once navigation reaches December 2099, the library's confirmed far-future maximum — Priority: Low

**File:** `tests/components/calendar/calendar-date-range-navigation.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar' on a fresh context. Open the Start Date popup and programmatically click 'Next month' repeatedly (with brief waits between clicks for React state to settle) until the button becomes disabled or a safety cap of 1000 clicks is reached
    - expect: 'Next month' eventually becomes disabled (real HTML disabled attribute)
    - expect: The header label at the point it becomes disabled reads exactly 'December 2099' — confirming this is MUI X Date Pickers' own library-default maximum date, not a custom app-level restriction

#### 6.4. 6.4. [QUIRK, Critical] Selecting a year in year-view immediately commits a new selected date, not merely a navigation step — Priority: Critical

**File:** `tests/components/calendar/calendar-date-range-navigation.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Select an End Date of today (via the picker, to establish a known baseline value and its day-of-month). Reopen the End Date popup, click the 'switch to year view' button, then click the year radio for (current year + 1)
    - expect: Immediately after clicking the year radio — BEFORE clicking any day cell — the End Date input's value updates to today's same day-of-month/month but in (current year + 1), formatted DD/MM/YYYY
    - expect: The End Date helper text updates to 'Selected: ' + that new date's toDateString()
    - expect: The popup remains open afterward, now showing the day-grid view for the newly selected year (not closed, and not still showing the year-view radiogroup)
  2. Without clicking any further day cell, dismiss the popup by pressing Escape
    - expect: The End Date input's value remains exactly the (current year + 1) date set by the year-radio click alone — confirming the year selection alone was a fully committed value change, not merely a pending navigation state that required an additional day-cell click to take effect

#### 6.5. 6.5. Year view offers exactly the years from the current year through 2099 — Priority: Medium

**File:** `tests/components/calendar/calendar-date-range-navigation.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Open the Start Date popup, click 'switch to year view', and enumerate every year radio's accessible name
    - expect: The full set of year radio accessible names equals exactly every integer year from the current calendar year (computed dynamically via new Date().getFullYear()) through 2099 inclusive, with no gaps and no years outside that range

### 7. Calendar - Date Range Keyboard Interaction

**Seed:** `tests/seed.spec.ts`

#### 7.1. 7.1. ArrowRight moves focus without changing the selection; Enter then commits the newly focused day and closes the popup — Priority: High

**File:** `tests/components/calendar/calendar-date-range-keyboard.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Select Start Date = today via the picker (mouse click). Reopen the Start Date popup (today's cell is focused by default) and press 'ArrowRight'
    - expect: Today's cell (the original selection) still shows aria-selected='true' and its value in the input has NOT changed yet
    - expect: The cell for (today+1) now carries the focus (is the [active]/focused element in the grid), while its aria-selected remains 'false' — confirming ArrowRight moves keyboard focus only, without altering the committed selection
  2. Press 'Enter'
    - expect: The Start Date input's value updates to exactly (today+1) formatted DD/MM/YYYY
    - expect: The Start Date helper text updates to 'Selected: ' + (today+1).toDateString()
    - expect: The popup closes automatically after Enter, with no further click required — identical in outcome to a mouse click on that same day cell

#### 7.2. 7.2. ArrowLeft moves focus to the previous day cell — Priority: Medium

**File:** `tests/components/calendar/calendar-date-range-keyboard.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Select Start Date = today+2 (computed dynamically) via the picker. Reopen the Start Date popup and press 'ArrowLeft'
    - expect: The cell for (today+1) becomes the focused cell in the grid, while (today+2)'s cell remains the aria-selected='true' cell and the input value remains unchanged until a further Enter/click commits the new focus
  2. Press 'Enter' to commit the newly focused day
    - expect: The Start Date input's value updates to exactly (today+1) formatted DD/MM/YYYY, confirming ArrowLeft moved focus one day earlier and Enter committed it, mirroring the ArrowRight+Enter behavior in the previous scenario but in the opposite direction

### 8. Calendar - Time Picker

**Seed:** `tests/seed.spec.ts`

#### 8.1. 8.1. Selecting 14 hours then 35 minutes matches the exercise's exact stated goal of 14:35 — Priority: Critical

**File:** `tests/components/calendar/calendar-time.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Open the Select Time popup, click the '14 hours' option, then click the '35 minutes' option
    - expect: After clicking '14 hours': the Select Time input's value reads exactly '14:00' (minutes defaulted)
    - expect: After clicking '35 minutes': the Select Time input's value reads exactly '14:35'
    - expect: The 'Selected Time:' paragraph reads exactly 'Selected Time: 14:35:00' — matching the exercise's literal stated goal of setting the time to 14:35

#### 8.2. 8.2. Selecting only an hour immediately updates the display with minutes defaulted to 00, without closing the popup — Priority: High

**File:** `tests/components/calendar/calendar-time.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Open the Select Time popup and click the '09 hours' option only (do not click any minute option yet)
    - expect: The Select Time input's value updates immediately to exactly '09:00'
    - expect: The 'Selected Time:' paragraph reads exactly 'Selected Time: 09:00:00'
    - expect: The dialog with role=dialog name='Select Time' is STILL present/visible in the DOM immediately after this single click, confirming selecting only an hour does not auto-close the popup

#### 8.3. 8.3. Selecting a minute closes the popup automatically with no separate confirm step required — Priority: Medium

**File:** `tests/components/calendar/calendar-time.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Open the Select Time popup, click '09 hours', then click '20 minutes'
    - expect: Immediately after the '20 minutes' click, the dialog with role=dialog name='Select Time' is no longer present in the DOM — no click on a separate 'OK' button was required to dismiss it
    - expect: The Select Time input's value reads exactly '09:20'

#### 8.4. 8.4. The minutes listbox offers exactly 12 five-minute-increment options while the hours listbox offers all 24 unrestricted hours — Priority: Medium

**File:** `tests/components/calendar/calendar-time.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Open the Select Time popup and enumerate every option's accessible name in both the 'Select hours' and 'Select minutes' listboxes
    - expect: The 'Select hours' listbox contains exactly 24 options with accessible names '0 hours' through '23 hours' (every hour 00-23 represented, no restriction)
    - expect: The 'Select minutes' listbox contains exactly 12 options with accessible names '0 minutes', '5 minutes', '10 minutes', ..., '55 minutes' — every value is a multiple of 5, with no options for any other minute value

#### 8.5. 8.5. Manually typing a time directly into the input bypasses the picker's 5-minute-increment restriction — Priority: High

**File:** `tests/components/calendar/calendar-time.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Click the Select Time textbox directly (without opening the picker popup) and type '14:37' character by character (37 is a minute value never offered by the minutes listbox)
    - expect: The Select Time input's value equals exactly '14:37'
    - expect: The 'Selected Time:' paragraph reads exactly 'Selected Time: 14:37:00'
    - expect: aria-invalid on the input is exactly 'false' — confirming the 5-minute-increment restriction is a picker-UI-only convenience, not a rule enforced on the underlying value

### 9. Calendar - Cross-Widget Independence and Network/Console Behavior

**Seed:** `tests/seed.spec.ts`

#### 9.1. 9.1. Interacting with the Basic Date, Date Range, and Time widgets produces zero cross-contamination between them — Priority: High

**File:** `tests/components/calendar/calendar-independence.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Set the Basic Date field to a dynamically-computed date via typing. Record the Start/End Date fields' and Select Time field's current state (all still default/empty)
    - expect: Start Date, End Date, and Select Time all remain at their documented default empty states, unaffected by the Basic Date field change
  2. Now select Start Date and End Date via the picker (today and today+5, computed dynamically), and re-check the Basic Date field and Select Time field
    - expect: The Basic Date field's value is unchanged from what was set in the first step
    - expect: The Select Time field remains empty with no 'Selected Time:' paragraph present, unaffected by the date-range selections
  3. Finally set the Select Time field to 14:35 via the picker, and re-check the Basic Date field and both Date Range fields
    - expect: The Basic Date field's value is still unchanged
    - expect: Start Date and End Date's values and helper texts are still exactly what was set in the second step, confirming all three widgets remained fully independent throughout this entire sequence

#### 9.2. 9.2. No API/network requests fire as a result of any calendar interaction (purely client-side component) — Priority: Medium

**File:** `tests/components/calendar/calendar-independence.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar', begin recording network requests, then interact broadly across all three widgets (type into Basic Date, select Start/End Date via the picker including a month-navigation click and a year-view click, select a time via the picker, and trigger the invalid-range typed scenario)
    - expect: No XHR/fetch network request specific to any calendar action is observed (only the pre-existing Next.js RSC prefetch requests for unrelated nav links, the same pattern documented on every other component page in this suite) — confirming this plan requires no API-level test coverage

#### 9.3. 9.3. No console errors are logged during extensive interaction across all three widgets — Priority: Medium

**File:** `tests/components/calendar/calendar-independence.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar', begin tracking console errors, then perform the same broad interaction sequence as the network-requests scenario (all three widgets, including the invalid-range and malformed-input negative paths)
    - expect: Zero console error messages are logged throughout the entire sequence of interactions, matching the clean-console baseline observed live during this plan's exploration

### 10. Calendar - Reload Persistence

**Seed:** `tests/seed.spec.ts`

#### 10.1. 10.1. No state persists across a page reload; all three widgets reset to their documented fresh-load defaults — Priority: High

**File:** `tests/components/calendar/calendar-persistence.spec.ts`

**Steps:**
  1. Navigate to '/components/calendar'. Set the Basic Date field to a dynamically-computed date, select Start Date = today and End Date = today+5 via the picker, and set the Select Time field to 14:35 via the picker
    - expect: Before reload: all three widgets reflect the just-performed non-default interactions (Basic Date has a value, Start/End Date both show 'Selected: ...' helper text, Select Time shows 'Selected Time: 14:35:00')
  2. Reload the page (page.reload())
    - expect: The Basic Date field's value is exactly an empty string again
    - expect: The Start Date and End Date inputs are both empty again, with helper text reverted to exactly 'Please select a start date' / 'Please select an end date', and both 'Choose date' buttons reverted to the plain accessible name 'Choose date'
    - expect: The Select Time input is empty again, and zero elements matching text 'Selected Time:' exist in the DOM (the paragraph is entirely absent again, not merely cleared) — confirming no localStorage/sessionStorage/URL state is involved anywhere on this page for any of the three widgets
