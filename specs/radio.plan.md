# Radio Component Test Plan

## Application Overview

**Page Object:** `RadioPage.ts` (new — does not yet exist in `tests/pages/`, unlike Button/Alert/Form/Input/AdvancedTable/Drag/Dropdown/Multiselect, all of which already have one). The Radio component (https://www.automationplayground.dev/components/radio) is a static page (heading "Radio", level 1) presenting SEVEN independent exercises stacked vertically in a single column, each preceded by a `<label data-testid="form-label">` instructional line: (1) "Select any one" — a 2-option boolean radio group (`answer-radio`), (2) "Cofirm you can select only one radio button" [sic — genuine live typo, not a transcription error] — a second, structurally identical 2-option group (`one-radio`), (3) "Find the bug" — two radio inputs with NO shared `data-testid` and, critically, DIFFERENT `name` attributes (`nobug`/`bug`), so the browser does not enforce mutual exclusivity between them — a real, reproducible, intentional bug, (4) "Find which one is selected" — a Foo/Bar group (`foobar-radio`) where Bar is checked by default, (5) "Confirm last field is disabled" — a Going/Not going/Maybe group (`event-radio`) where Maybe carries the `disabled` attribute, (6) "Find if the checkbox is selected?" — a standalone "Remember me" checkbox (`checkbox-checked`) checked by default, (7) "Accept the T&C" — a "Terms and Conditions" checkbox (`termsConditions-checkbox`), unchecked by default, whose label wraps a nested `<a target="_blank" href="/testing-terms-conditions">Terms and Conditions</a>` link. `RadioPage.ts` should expose: a `gotoRadio()` navigation helper; locators for every input scoped safely per the duplicate-id findings below (`answerYes`/`answerNo` via `getByTestId('answer-radio').first()/.last()`, `oneYes`/`oneNo` via `getByTestId('one-radio').first()/.last()`, `findBugOptionA` (`#nobug`, labeled "Yes") / `findBugOptionB` (`#bug`, labeled "No") via unique CSS id since those two ids are NOT duplicated elsewhere, `fooRadio`/`barRadio` via `#Foo`/`#Bar`, `goingRadio`/`notGoingRadio`/`maybeRadio` via `#Going`/`input[id="Not going"]`/`#Maybe` (the middle id contains a literal space requiring an attribute selector, not a bare CSS id), `rememberCheckbox` via `getByTestId('checkbox-checked')`, `termsCheckbox` via `getByTestId('termsConditions-checkbox')`, and `termsLink` via `getByRole('link', { name: 'Terms and Conditions' })`; plus small helpers such as `expectOnlyChecked(checkedLocator, uncheckedLocators[])` to wrap the shared "select one, verify siblings deselect" pattern reused across scenarios 2 and 4, since this project's convention is that every component's specs interact through a Page Object, not raw `page.getByTestId()`/`page.locator()` calls scattered across test files.

All interactions on this page are purely client-side: `browser_network_requests` was checked before and after extensive interaction with every group (checking/unchecking radios and checkboxes, triggering the mismatched-name bug, clicking the disabled option, reloading) and zero XHR/fetch requests specific to any radio/checkbox action were observed — only the same pre-existing Next.js RSC prefetch requests for unrelated nav links documented on every other component page, plus the expected navigation request when the Terms and Conditions link is followed. This plan therefore contains no API-level test coverage. No JavaScript console errors or warnings were observed during any exploration flow.

**Data-testid / id inventory (verified live via `document.querySelectorAll` and `outerHTML` inspection):**
- `[data-testid="form-label"]` (×7) — one per exercise, exact text: `Select any one`, `Cofirm you can select only one radio button` (typo confirmed live, not a transcription error), `Find the bug`, `Find which one is selected`, `Confirm last field is disabled`, `Find if the checkbox is selected?`, `Accept the T&C`.
- `[data-testid="answer-radio"]` (×2) — `<input type="radio" name="answer" required>`, `id="Yes"`/`value="Yes"` and `id="No"`/`value="No"`. Neither checked by default.
- `[data-testid="one-radio"]` (×2) — `<input type="radio" name="one" required>`, `id="Yes"`/`value="Yes"` and `id="No"`/`value="No"`. Neither checked by default. **[DUPLICATE-ID DEFECT]** These ids (`Yes`/`No`) are byte-for-byte identical to the ids used in the `answer-radio` group above — confirmed via `document.querySelectorAll('#Yes')` returning 2 elements (one per group) and likewise for `#No`. This is invalid HTML (duplicate ids across the whole document, not just within a widget) and has an observable side effect: the accessibility-tree snapshot shows `answer-radio`'s two radios with accessible names `"Yes Yes"` / `"No No"` (doubled), while `one-radio`'s two radios end up with NO accessible name at all (confirmed via accessibility snapshot: bare `radio [ref=...]` with no name). This makes `page.getByRole('radio', { name: 'Yes' })` unreliable/ambiguous for both groups — locate exclusively via `data-testid` + `.first()`/`.last()`, never by role name or bare `#Yes`/`#No` CSS id, for these two groups specifically.
- Two `<input type="radio">` in the "Find the bug" section carry NO `data-testid` at all (only the section's label does) — `id="nobug"` `name="nobug"` (visibly labeled "Yes") and `id="bug"` `name="bug"` (visibly labeled "No"). Both ids are unique standalone strings not duplicated elsewhere in the DOM, so `#nobug`/`#bug` CSS id selectors are safe here. **[CONFIRMED BUG — different `name` attributes]** Because `nobug` and `bug` do not share a `name`, the browser treats them as two independent single-member radio groups rather than one mutually-exclusive pair: both can be checked simultaneously (confirmed live by clicking each in turn: `nobugChecked: true, bugChecked: true`).
- `[data-testid="foobar-radio"]` (×2) — `<input type="radio" name="foobar" required>`, `id="Foo"`/`value="Foo"` (unchecked by default) and `id="Bar"`/`value="Bar"` (**checked by default**, confirmed reproducible on fresh navigation).
- `[data-testid="event-radio"]` (×3) — `<input type="radio" name="two" required>`, `id="Going"`, `id="Not going"` (id contains a literal space), `id="Maybe"` (carries `disabled` attribute; also still carries `required`, though moot since it's disabled). None checked by default.
- `[data-testid="checkbox-checked"]` — `<input type="checkbox">` with no `id`/`name` attributes at all (`value="on"`), labeled "Remember me". **Checked by default** (confirmed reproducible on fresh navigation). Not `required`.
- `[data-testid="termsConditions-checkbox"]` — `<input type="checkbox" id="termsAndConditions" name="termsConditions" required>`, `value="on"`. Unchecked by default. Its `<label for="termsAndConditions">I agree to the <a target="_blank" href="/testing-terms-conditions">Terms and Conditions</a></label>` nests the link INSIDE the label associated with the checkbox.

**Confirmed behaviors (all independently re-verified live during this exploration pass, not assumed from the legacy spec):**
- `answer-radio` and `one-radio` both enforce standard native mutual exclusivity: checking one immediately unchecks the other within the same group (confirmed both directions, Yes→No and No→Yes, on both groups independently).
- The "Find the bug" mismatched-name issue IS still reproducible today: clicking `#nobug` then `#bug` leaves both checked simultaneously. Additionally confirmed: clicking an already-checked single-member radio a second time does NOT uncheck it (`afterFirstClick: true, afterSecondClick: true`) — standard native `<input type="radio">` behavior (unlike a checkbox, a lone radio cannot be toggled off by re-clicking it), which is a direct, testable consequence of the same underlying defect (each of `nobug`/`bug` is effectively its own isolated one-member group).
- `foobar-radio`: `Bar` is checked and `Foo` is unchecked on fresh load; clicking `Foo` checks it and unchecks `Bar`, and clicking `Bar` again reverses it — full round-trip confirmed.
- `event-radio`: `Maybe` is disabled and clicking it (even via a direct JS `.click()` call, not just simulated user interaction) has zero effect — `checked` remains `false` before and after. `Going` and `Not going` remain fully interactive and mutually exclusive with each other.
- `checkbox-checked` ("Remember me") starts checked; unchecking then re-checking it round-trips correctly with no side effects on any other control.
- `termsConditions-checkbox`: clicking the nested "Terms and Conditions" `<a>` link does NOT toggle the checkbox as a side effect (confirmed: checkbox `checked` remained `false` immediately after the link was clicked and a new tab opened) — the anchor's own navigation activation behavior takes precedence over the label's checkbox-toggle behavior. By contrast, clicking the surrounding label text (e.g. "I agree to the", not the link itself) DOES toggle the checkbox as expected (confirmed: `label.click()` on the label element flipped `checked` from `false` to `true`).
- The "Terms and Conditions" link opens `/testing-terms-conditions` in a new tab (`target="_blank"`, no `rel` attribute present), confirmed via the popup/new-tab mechanism; the original `/components/radio` tab's state and URL are unaffected.
- `required` is present on 10 of the 13 inputs (`answer-radio`×2, `one-radio`×2, `foobar-radio`×2, `event-radio`×3 including the disabled `Maybe`, `termsConditions-checkbox`) but absent on the "Find the bug" radios (×2) and `checkbox-checked`. No `<form>` element wraps any input on this page and there is no submit button anywhere (confirmed via `document.querySelectorAll('form').length === 0` and inspecting all `<button>` text, which is just the empty icon button and "BACK"), so `required` has zero functional/blocking effect on this page — it is decorative only, the same finding pattern documented in the sibling Dropdown plan.
- Keyboard: with a radio focused, `ArrowDown` moves both focus AND the checked state to the next radio in that same-`name` group (confirmed live on `answer-radio`: focusing `Yes` then pressing `ArrowDown` immediately checked `No` and unchecked `Yes`) — this is standard native browser radio-group behavior. It was only directly re-confirmed on `answer-radio` during this pass; it is reasonably expected to generalize identically to `one-radio`, `foobar-radio`, and `event-radio` (all are plain native radio inputs sharing a `name`), but this generalization was not independently exercised on those three groups.
- No selection state persists across a page reload for ANY group or checkbox: after broadly interacting with every group, a fresh reload reverted every control to its exact documented default (`answer-radio`: neither checked; `one-radio`: neither checked; Find-the-bug: neither checked; `foobar-radio`: `Bar` checked only; `event-radio`: none checked, `Maybe` still disabled; `checkbox-checked`: checked; `termsConditions-checkbox`: unchecked) — confirmed by direct DOM re-inspection after `page.goto()` following prior interaction, not merely assumed.
- All seven exercises are fully independent: interacting with any one group/checkbox produced no observable change in any other group's or checkbox's state throughout this entire exploration pass.
- The "Insight" section (heading level 2, concept list: 'Select a radio button option', 'Verify the selected state', 'Verify disabled option cannot be selected', 'Interact with a checkbox'; Github solution link to `https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/radio/radio.spec.ts`) is visible immediately with no expand/interaction required, matching every other component page's pattern.

**Known bugs / notable gaps:**
1. **[Confirmed real bug, the page's featured exercise]** The "Find the bug" radio pair (`#nobug`/`#bug`) uses mismatched `name` attributes (`nobug` vs `bug`), so the browser does not enforce mutual exclusivity — both can be checked at once. Still reproducible today.
2. **[Duplicate HTML ids — a second, separate defect from #1, not called out by the legacy spec]** `id="Yes"` and `id="No"` are each used twice in the DOM — once in `answer-radio`, once in `one-radio` — a genuine document-wide id-uniqueness violation with an observable accessible-name side effect (see inventory above). Flagged as a real defect worth reporting, and as a concrete trap for any test author reaching for a bare `#Yes`/`#No` CSS id or `getByRole('radio', {name:'Yes'})` instead of scoping through `data-testid` first.
3. **[Notable, not a bug]** `required` is present on 10 of 13 inputs but has no functional effect anywhere on this page, since nothing is wrapped in a `<form>` and no submit action exists. Flagged so no scenario asserts HTML5 validation-blocking behavior that cannot occur here.

**Ambiguous/unverified areas explicitly flagged for testers:**
- ArrowDown/keyboard radio-group cycling was only directly confirmed on `answer-radio`; it was not independently re-exercised on `one-radio`, `foobar-radio`, or `event-radio`, though standard native `<select>`-adjacent radio-group behavior is expected to generalize.
- Whether `ArrowUp`, `Home`/`End`, `Space` (to check a focused-but-unchecked radio without arrow-cycling), or `Tab`-based focus traversal produce standard expected behavior was not independently exercised during this pass.
- Touch/mobile-specific interaction (tapping radios/checkboxes on an emulated touch viewport) was not independently exercised during this pass.
- The "BACK" button in the shared page header was not exercised, consistent with the treatment of this same shared control in the Button, Alert, Form, Input, Drag, Dropdown, and Multiselect plans.
- Whether the duplicate-id accessible-name anomaly (`"Yes Yes"` vs. unnamed) reproduces identically across different browser engines (this exploration used one Chromium-based session) was not cross-checked; the ids/DOM facts themselves are engine-independent and were confirmed via direct attribute inspection, but accessible-name computation in particular can be engine-specific.

## Test Scenarios

### 1. Radio - Initial Load and Default State

**Seed:** `tests/seed.spec.ts`

#### 1.1. Radio page loads with all seven exercise sections, labels, and Insight section correctly rendered

**File:** `tests/components/radio/radio-load.spec.ts`

**Steps:**
  1. Navigate to '/components/radio' on a fresh browser context
    - expect: Page loads successfully (HTTP 200, no console errors)
    - expect: Heading 'Radio' (level 1) is visible
  2. Inspect all seven 'form-label' elements in DOM order
    - expect: The seven labels read exactly, in order: 'Select any one', 'Cofirm you can select only one radio button', 'Find the bug', 'Find which one is selected', 'Confirm last field is disabled', 'Find if the checkbox is selected?', 'Accept the T&C' — including the live 'Cofirm' typo exactly as rendered, not a corrected spelling
  3. Inspect the 'Insight' section without performing any click/expand interaction
    - expect: Heading 'Insight' (level 2) is visible immediately with no interaction required
    - expect: The concept list contains exactly the items 'Select a radio button option', 'Verify the selected state', 'Verify disabled option cannot be selected', 'Interact with a checkbox'
    - expect: A 'Github solution' link is visible with href 'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/radio/radio.spec.ts'

#### 1.2. Every control's default checked/disabled state matches the confirmed live baseline on fresh load

**File:** `tests/components/radio/radio-load.spec.ts`

**Steps:**
  1. Navigate to '/components/radio' on a fresh browser context. Without any interaction, read the '.checked' and '.disabled' properties of all 13 radio/checkbox inputs via DOM inspection
    - expect: 'answer-radio' group ([data-testid='answer-radio']): both the 'Yes' (id='Yes') and 'No' (id='No') radios have checked=false
    - expect: 'one-radio' group: both radios have checked=false
    - expect: Find-the-bug group: '#nobug' and '#bug' both have checked=false
    - expect: 'foobar-radio' group: '#Foo' has checked=false AND '#Bar' has checked=true (Bar pre-selected by default)
    - expect: 'event-radio' group: 'Going', 'Not going', and 'Maybe' (input[id='Maybe']) all have checked=false; 'Maybe' additionally has disabled=true while 'Going' and 'Not going' both have disabled=false
    - expect: '[data-testid="checkbox-checked"]' (Remember me) has checked=true
    - expect: '[data-testid="termsConditions-checkbox"]' has checked=false

### 2. Radio - Mutual Exclusivity (answer-radio and one-radio groups)

**Seed:** `tests/seed.spec.ts`

#### 2.1. 'Select any one' group (answer-radio) allows only one option checked at a time, in both switch directions

**File:** `tests/components/radio/radio-single-select-groups.spec.ts`

**Steps:**
  1. Navigate to '/components/radio' and check the 'Yes' radio in the 'answer-radio' group (getByTestId('answer-radio').first())
    - expect: 'Yes' radio is checked
    - expect: 'No' radio (getByTestId('answer-radio').last()) is NOT checked
  2. Now check the 'No' radio in the same group
    - expect: 'No' radio is checked
    - expect: 'Yes' radio is now NOT checked, confirming the switch reversed cleanly with no state where both or neither is checked

#### 2.2. 'Cofirm you can select only one radio button' group (one-radio) independently enforces the same mutual exclusivity

**File:** `tests/components/radio/radio-single-select-groups.spec.ts`

**Steps:**
  1. Navigate to '/components/radio' and check the 'No' radio in the 'one-radio' group (getByTestId('one-radio').last()) first, deliberately testing the reverse order from the answer-radio scenario
    - expect: 'No' radio is checked
    - expect: 'Yes' radio (getByTestId('one-radio').first()) is NOT checked
  2. Now check the 'Yes' radio in the same group
    - expect: 'Yes' radio is checked
    - expect: 'No' radio is now NOT checked

#### 2.3. Checking a radio in answer-radio has zero effect on one-radio's state, despite both groups sharing duplicate 'Yes'/'No' element ids

**File:** `tests/components/radio/radio-single-select-groups.spec.ts`

**Steps:**
  1. Navigate to '/components/radio'. Record one-radio's baseline state (both unchecked). Check 'Yes' in the answer-radio group only, scoped via getByTestId('answer-radio').first()
    - expect: answer-radio's 'Yes' is checked and its 'No' is unchecked
    - expect: one-radio's 'Yes' and 'No' (getByTestId('one-radio')) both remain unchecked, exactly matching the pre-interaction baseline — confirming the two groups are fully independent in application state despite their underlying elements sharing the literal ids 'Yes'/'No' in the raw DOM (a real, confirmed duplicate-id defect that must not be conflated with an actual state-sharing bug)

### 3. Radio - 'Find the Bug' Exercise (Mismatched Name Attributes)

**Seed:** `tests/seed.spec.ts`

#### 3.1. [BUG] Both options in the 'Find the bug' pair can end up checked simultaneously because they use different name attributes

**File:** `tests/components/radio/radio-find-the-bug.spec.ts`

**Steps:**
  1. Navigate to '/components/radio'. Confirm via DOM inspection that '#nobug' has name='nobug' and '#bug' has name='bug' (different, non-matching name attributes) before interacting
    - expect: '#nobug' name attribute equals exactly 'nobug'
    - expect: '#bug' name attribute equals exactly 'bug' — confirming the two inputs do not share a common 'name' and therefore cannot be a real mutually-exclusive native radio group
  2. Check '#nobug' (the 'Yes'-labeled option), then check '#bug' (the 'No'-labeled option)
    - expect: '#nobug' is checked
    - expect: '#bug' is ALSO checked at the same time — both true simultaneously — reproducing the intentional bug this exercise is designed to surface, since a correctly-implemented mutually-exclusive pair would have unchecked '#nobug' the moment '#bug' was checked

#### 3.2. Clicking an already-checked option in this pair a second time does not uncheck it (standard native single-radio behavior, a direct consequence of the same defect)

**File:** `tests/components/radio/radio-find-the-bug.spec.ts`

**Steps:**
  1. Navigate to '/components/radio', check '#nobug' once, confirm it is checked, then click '#nobug' again (second click on the same, already-checked radio)
    - expect: '#nobug' remains checked=true after the second click (not toggled off) — this is expected native <input type="radio"> behavior, distinct from a checkbox, and demonstrates that each of '#nobug'/'#bug' functions as its own isolated one-member group rather than a real either/or pair

### 4. Radio - Pre-Selected Default (Foo/Bar group)

**Seed:** `tests/seed.spec.ts`

#### 4.1. Bar is checked by default on fresh load and Foo is not

**File:** `tests/components/radio/radio-preselected.spec.ts`

**Steps:**
  1. Navigate to '/components/radio' on a fresh context and, without any interaction, inspect the foobar-radio group
    - expect: '#Bar' is checked
    - expect: '#Foo' is NOT checked — confirming this is a genuine static default rendered on every fresh load, not leftover state from a prior test

#### 4.2. Selecting Foo switches the checked state away from Bar, and the switch is fully reversible

**File:** `tests/components/radio/radio-preselected.spec.ts`

**Steps:**
  1. Navigate to '/components/radio', check '#Foo'
    - expect: '#Foo' is checked
    - expect: '#Bar' is NOT checked
  2. Check '#Bar' again
    - expect: '#Bar' is checked
    - expect: '#Foo' is NOT checked, confirming a full round-trip back to the original default state

### 5. Radio - Disabled Option (Going/Not going/Maybe group)

**Seed:** `tests/seed.spec.ts`

#### 5.1. The 'Maybe' option is disabled and cannot be checked via any interaction, while the other two options remain fully usable

**File:** `tests/components/radio/radio-disabled.spec.ts`

**Steps:**
  1. Navigate to '/components/radio' and inspect the event-radio group
    - expect: 'input[id="Maybe"]' has the disabled attribute/property set to true
    - expect: '#Going' and 'input[id="Not going"]' both have disabled=false
  2. Attempt to interact with the disabled 'Maybe' radio (e.g. via Playwright's .check() or .click(), which should fail actionability/be a no-op since Playwright will not force-interact with a disabled element)
    - expect: 'input[id="Maybe"]' remains unchecked (checked=false) after the attempted interaction — it cannot be selected by any standard interaction
  3. Check '#Going'
    - expect: '#Going' is checked
    - expect: 'input[id="Not going"]' and 'input[id="Maybe"]' are both NOT checked
  4. Check 'input[id="Not going"]'
    - expect: 'input[id="Not going"]' is checked
    - expect: '#Going' is NOT checked, confirming Going/Not going remain mutually exclusive with each other despite the third group member being disabled
    - expect: 'input[id="Maybe"]' remains unchecked and disabled throughout

### 6. Radio - Checkboxes ('Remember me' and 'Accept the T&C')

**Seed:** `tests/seed.spec.ts`

#### 6.1. The 'Remember me' checkbox is checked by default and toggles cleanly in both directions

**File:** `tests/components/radio/radio-checkboxes.spec.ts`

**Steps:**
  1. Navigate to '/components/radio' and inspect '[data-testid="checkbox-checked"]' without interacting
    - expect: The checkbox is checked by default
  2. Uncheck it, then check it again
    - expect: After unchecking: checkbox is NOT checked
    - expect: After re-checking: checkbox IS checked again, confirming a full, clean round-trip

#### 6.2. The T&C checkbox is unchecked by default and toggles cleanly in both directions

**File:** `tests/components/radio/radio-checkboxes.spec.ts`

**Steps:**
  1. Navigate to '/components/radio' and inspect '[data-testid="termsConditions-checkbox"]' without interacting
    - expect: The checkbox is NOT checked by default
  2. Check it, then uncheck it, then check it again
    - expect: After checking: checkbox IS checked
    - expect: After unchecking: checkbox is NOT checked
    - expect: After the final check: checkbox IS checked again, confirming the full three-step round-trip works correctly with no stuck state

#### 6.3. Clicking the nested 'Terms and Conditions' link does not toggle the T&C checkbox, but clicking the surrounding label text does

**File:** `tests/components/radio/radio-checkboxes.spec.ts`

**Steps:**
  1. Navigate to '/components/radio', confirm '[data-testid="termsConditions-checkbox"]' is unchecked, then click the 'Terms and Conditions' link (handling the resulting new-tab popup so the test doesn't hang) and close the new tab
    - expect: Back on the original tab, '[data-testid="termsConditions-checkbox"]' is STILL unchecked immediately after the link click — clicking the nested anchor's own navigation activation behavior does not also toggle the checkbox as a side effect of label-click behavior
  2. On the same page (no reload), click on the label's plain text portion 'I agree to the' (not the link itself)
    - expect: '[data-testid="termsConditions-checkbox"]' becomes checked=true, confirming clicking the non-link portion of the label DOES toggle the checkbox as expected, in contrast to the link click in the prior step

#### 6.4. The 'Terms and Conditions' link opens '/testing-terms-conditions' in a new tab without navigating the original page

**File:** `tests/components/radio/radio-checkboxes.spec.ts`

**Steps:**
  1. Navigate to '/components/radio'. Record the current tab's URL, then click the 'Terms and Conditions' link and wait for the resulting popup
    - expect: A new tab/popup opens with URL exactly '/testing-terms-conditions' (path, host may vary by environment)
    - expect: The original tab's URL remains exactly '/components/radio', unchanged — confirming this is a genuine new-tab navigation (target="_blank"), not an in-place redirect

### 7. Radio - Cross-Group Independence and Reload Persistence

**Seed:** `tests/seed.spec.ts`

#### 7.1. Interacting with any one group/checkbox produces zero observable change in the other six exercises' state

**File:** `tests/components/radio/radio-independence.spec.ts`

**Steps:**
  1. Navigate to '/components/radio'. Record baseline state for all seven exercises (expect: answer-radio none checked; one-radio none checked; find-the-bug none checked; foobar Bar checked/Foo unchecked; event-radio none checked; checkbox-checked=true; termsConditions=false)
    - expect: Baseline recorded matches the documented defaults exactly for all 7 exercises
  2. Interact broadly with ONLY the answer-radio and foobar-radio groups: check 'No' in answer-radio, and check 'Foo' in foobar-radio
    - expect: answer-radio: 'No' is checked, 'Yes' is not
    - expect: foobar-radio: 'Foo' is checked, 'Bar' is not
  3. Re-read the state of the remaining five exercises (one-radio, find-the-bug, event-radio, checkbox-checked, termsConditions-checkbox) without navigating away
    - expect: one-radio: both radios still unchecked (unchanged from baseline)
    - expect: find-the-bug: both '#nobug' and '#bug' still unchecked (unchanged)
    - expect: event-radio: all three radios still unchecked and 'Maybe' still disabled (unchanged)
    - expect: checkbox-checked: still checked=true (unchanged)
    - expect: termsConditions-checkbox: still checked=false (unchanged) — confirming zero cross-contamination from the answer-radio/foobar-radio interactions

#### 7.2. No selection state persists across a page reload; every group/checkbox resets to its documented fresh-load default

**File:** `tests/components/radio/radio-persistence.spec.ts`

**Steps:**
  1. Navigate to '/components/radio'. Change every control away from its default: check 'Yes' in answer-radio, check 'No' in one-radio, check both '#nobug' and '#bug', check 'Foo' in foobar-radio (switching away from the default Bar), check 'Going' in event-radio, uncheck 'Remember me', check the T&C checkbox
    - expect: Before reload: all seven exercises reflect the just-performed non-default interactions
  2. Reload the page (page.reload())
    - expect: answer-radio: neither 'Yes' nor 'No' is checked
    - expect: one-radio: neither is checked
    - expect: find-the-bug: neither '#nobug' nor '#bug' is checked
    - expect: foobar-radio: '#Bar' is checked again and '#Foo' is not, confirming the pre-selected default is a static per-load render, not persisted/remembered prior state
    - expect: event-radio: none of the three is checked, and 'Maybe' is still disabled
    - expect: checkbox-checked (Remember me): checked=true again (reverted from the manually-unchecked state)
    - expect: termsConditions-checkbox: checked=false again (reverted from the manually-checked state) — confirming no localStorage/sessionStorage/URL state is involved anywhere on this page

#### 7.3. No API/network requests fire as a result of any radio/checkbox interaction on this page (purely client-side component)

**File:** `tests/components/radio/radio-independence.spec.ts`

**Steps:**
  1. Navigate to '/components/radio', begin recording network requests, then interact broadly across all seven exercises (check/uncheck radios in every group, trigger the find-the-bug double-check, toggle both checkboxes)
    - expect: No XHR/fetch network request specific to any radio/checkbox action is observed (only the pre-existing Next.js RSC prefetch requests for unrelated nav links, the same pattern documented on every other component page in this suite) — confirming this plan requires no API-level test coverage

### 8. Radio - Keyboard Interaction

**Seed:** `tests/seed.spec.ts`

#### 8.1. ArrowDown within a focused native radio group moves both focus and the checked state to the next radio in that group

**File:** `tests/components/radio/radio-keyboard.spec.ts`

**Steps:**
  1. Navigate to '/components/radio', click the 'Yes' radio in the answer-radio group to focus and check it, then press 'ArrowDown'
    - expect: Before ArrowDown: 'Yes' is checked and 'No' is not
    - expect: After ArrowDown: 'No' becomes checked and 'Yes' becomes unchecked — confirming standard native browser radio-group keyboard-cycling behavior (this was independently confirmed on answer-radio only during exploration; it is expected, but not independently re-confirmed in this plan's own exploration pass, to generalize identically to one-radio/foobar-radio/event-radio since all are plain native same-name radio inputs)

#### 8.2. ArrowDown has no effect on the mismatched-name 'Find the bug' pair, since each option is its own isolated single-member group

**File:** `tests/components/radio/radio-keyboard.spec.ts`

**Steps:**
  1. Navigate to '/components/radio', click '#nobug' to focus and check it, then press 'ArrowDown'
    - expect: '#nobug' remains checked=true after ArrowDown
    - expect: '#bug' remains checked=false after ArrowDown — confirming ArrowDown does not move the checked state across to '#bug', since the two inputs do not share a 'name' and are therefore not treated as a single native keyboard-navigable group at all (a further, directly testable consequence of the same underlying mismatched-name defect documented in the 'Find the Bug' suite)
