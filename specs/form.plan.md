# Form Component Test Plan

## Application Overview

The Form component (https://www.automationplayground.dev/components/form) is a single native HTML `<form>` containing six fields (dropdown, name, email, message, radio group, checkbox) plus a submit button. All validation observed during exploration is enforced entirely by native browser HTML5 constraint validation (the `required` attribute on each field) — no custom JavaScript validation, no visible inline error text/styling was found anywhere on the page, and clicking Submit with any required field empty triggers the browser's own built-in validation UI (focuses the first invalid field and exposes a native `validationMessage` on that element) rather than any app-rendered error message. Consequently the exact wording of validation messages (e.g. "Veuillez renseigner ce champ.") is supplied by the browser itself and is locale-dependent — the messages captured in this plan were observed in a French-locale browser session and will differ (e.g. to English) in a different locale/browser configuration. Tests should assert on validity state (e.g. `element.validity.valueMissing === true`, or that the page has NOT transitioned to the "Form submitted" success state) rather than hardcoding this plan's exact French strings, unless the project's Playwright config is confirmed to pin a specific locale.

On successful submission (all required constraints satisfied), the entire form is replaced client-side with a success panel (`data-testid="form-sent"`) showing heading "Form submitted", sub-heading "Good job!", a checkmark icon, and a "Retry" button (`data-testid="button-form-retry"`). No XHR/fetch network request was observed firing as a result of clicking Submit (only pre-existing Next.js RSC prefetch requests for unrelated nav links were present in the network log, identical in nature to what was observed on the Advanced Table page) — this is a fully client-side simulated submission with no backend call, so this plan contains no API-level test coverage for form submission itself.

Key elements (verified via `data-testid` attributes during exploration):
- Dropdown/select: `[data-testid="form-dropdown"]`, native `<select>`, `name="dropdown"`, `required`. Options in order: value `""` text "Select an option" (default selected on fresh load), value "Software" text "Software", value "Hardware" text "Hardware", value "Other" text "Other". Preceded by label text "Select one of the given options".
- Name input: `[data-testid="form-name"]`, `<input type="text">`, `name="name"`, `required`, no `maxlength`/`minlength`/`pattern` attribute present, no placeholder text, labeled "Name:".
- Email input: `[data-testid="form-email"]`, `<input type="text">` (NOT `type="email"`), `name="email"`, `required`, no `maxlength`/`pattern`, no placeholder, labeled "Email:". Because the input type is plain text with no `pattern`, the browser performs no email-format validation at all (confirmed: submitting the literal string "notanemail" in this field, with every other field valid, succeeds and reaches the "Form submitted" state).
- Message textarea: `[data-testid="form-message"]`, `<textarea>`, `name="message"`, `required`, no `maxlength`, no placeholder, labeled "Message:".
- Radio group: two `<input type="radio">` elements sharing `data-testid="form-radio"` and `name="radio"`, `id="Yes"`/`id="No"`, `value="Yes"`/`value="No"`, both carry the `required` attribute. Label text "Do you like this exercise?", options "Yes" and "No". Neither is selected by default.
- Terms checkbox: `[data-testid="termsConditions-checkbox"]`, `<input type="checkbox">`, `name="termsConditions"`, `required`, unchecked by default. Adjacent text "I agree to the Terms and Conditions" where "Terms and Conditions" is a link to `/testing-terms-conditions` with `target="_blank"` (opens in a new tab — confirmed by running the corresponding test against the live site; an earlier exploration pass had mis-recorded this as same-tab navigation, corrected here).
- Submit button: `[data-testid="button-submit"]`, `<button type="submit">`, text "Submit", inside the native `<form>` element (so a native form-level submit/validation cycle applies).
- Success state (post-submit) container: `[data-testid="form-sent"]`, contains heading "Form submitted" (h1), sub-heading "Good job!" (h2), and Retry button `[data-testid="button-form-retry"]`.

Confirmed default/fresh state (page reload, no interaction): dropdown shows "Select an option" (value ""), Name/Email/Message all empty strings, neither Yes/No radio checked, Terms checkbox unchecked, Submit button enabled (not disabled) and visible, no success panel present, no inline error text visible anywhere on the page.

Confirmed behaviors:
- Clicking Submit with the dropdown at its default "" value (or any other required field empty) does not transition to the success state and does not clear/alter any already-entered values in OTHER fields; the browser's native validation intercepts the form submission, scrolls to and focuses the first invalid field in DOM order, and does not fire any client or server-side handler tied to actual submission logic.
- All six required constraints are validated independently — confirmed individually by isolating each one (dropdown alone unfilled, checkbox alone unchecked, radio group alone unselected) that each blocks submission on its own with the browser reporting `validity.valueMissing === true` and a non-empty `validationMessage` for that specific control.
- Once every required field is satisfied (dropdown any value, non-empty Name, non-empty Email in ANY string format, non-empty Message, one radio selected, checkbox checked), clicking Submit always succeeds and shows the success panel — regardless of the actual content/format of Name, Email, or Message (no content-format validation exists beyond "not literally empty").
- Native HTML5 `required` validation for text-type fields (Name, Email, Message) only checks for a fully empty string; a value consisting solely of whitespace (e.g. three space characters) is NOT treated as empty and satisfies the `required` constraint, allowing the form to submit successfully with a whitespace-only Name field. **[Notable equivalence-class edge case, not flagged as a functional break since it is standard native browser behavior, but worth explicit regression coverage — same spirit as the Advanced Table's whitespace-search behavior.]**
- Clicking the "Retry" button on the success panel removes the success panel and re-renders the original blank form with ALL fields reset to their fresh-load defaults (dropdown back to "Select an option", Name/Email/Message empty, no radio selected, checkbox unchecked) — confirmed by direct DOM inspection of `.value`/`.checked` on every field immediately after clicking Retry.
- The "Terms and Conditions" link opens in a new browser tab (`target="_blank"`) to `/testing-terms-conditions`, a static page with heading "Testing terms & conditions" and placeholder body text; it is a plain link, not a modal/popup. The original page remains open, unnavigated, on `/components/form`.
- No JavaScript console errors were observed during any of the exploration flows (empty submit, invalid submit, valid submit, whitespace submit, Retry).

Known bugs / notable gaps (see numbered scenarios below for full repro steps and dev recommendation):
1. **[GAP, scenario 3.2]** The Email field has no email-format validation whatsoever (input type is plain `text`, no `pattern` attribute) — any non-empty string, including one with no "@" or domain at all (e.g. "notanemail"), is accepted as a fully valid submission. This is not a JS/rendering bug in the traditional sense but is a functional validation gap relative to the field's labeled purpose, and is documented as a defect-candidate for the dev team.
2. **[GAP, scenario 3.3]** Whitespace-only input in required text fields (Name, Email, Message) passes the `required` constraint and allows successful submission, because native HTML5 `required` validation does not trim/check for whitespace-only content. Documented as a known edge-case behavior (inherent to native browser validation, not a custom app bug) that should still have explicit regression coverage.

Ambiguous/unverified areas explicitly flagged for testers:
- All captured `validationMessage` strings (e.g. "Veuillez renseigner ce champ.", "Sélectionnez un élément dans la liste.", "Veuillez cocher cette case si vous souhaitez continuer.", "Veuillez sélectionner l'une de ces options.") were observed in a French-locale browser session during exploration. The project's `playwright.config.ts` does not pin a `locale`, so these exact strings may NOT reproduce in CI or on a different machine/browser locale (e.g. English Chromium would show different text such as "Please fill out this field."). Scenarios below assert on validity state and page state (still-on-form vs success panel) rather than hardcoding these exact strings; if exact-string assertions are desired, the locale must first be pinned in the Playwright project config.
- No `maxlength` attribute was found on any text input/textarea; behavior with very long input (e.g. 5,000+ characters) was not tested against real DOM/storage limits, since there is no visible cap to test against.
- The "BACK" button in the page header (shared across all component pages, likely a generic `router.back()` control) was not exercised as part of this plan since it is not specific to the Form component's own functionality.
- It was not verified whether pressing Enter inside a text field (rather than clicking the Submit button directly) also triggers the native form submission/validation cycle; this is standard HTML form behavior but was not independently confirmed by interaction during exploration.
- Keyboard-only navigation and screen-reader semantics (tab order across dropdown, Name, Email, Message, radio group, checkbox, Submit) were not exercised.
- Multiple/rapid double-clicks on Submit (to check for double-submission or duplicate success panels) were not tested.

## Test Scenarios

### 1. Form - Initial Load and Default State

**Seed:** `tests/seed.spec.ts`

#### 1.1. Form page loads with correct default state

**File:** `tests/components/form/form-load.spec.ts`

**Steps:**
  1. Navigate to '/components/form' on a fresh browser context
    - expect: Page loads successfully (HTTP 200, no console errors)
    - expect: Heading 'Form' (level 1) is visible
    - expect: Label text 'Select one of the given options' is visible above the dropdown
  2. Inspect the dropdown field '[data-testid="form-dropdown"]'
    - expect: The select's current value equals '' (empty string) and the visibly selected option text equals 'Select an option'
    - expect: The select contains exactly 4 options in order with text 'Select an option', 'Software', 'Hardware', 'Other' and values '', 'Software', 'Hardware', 'Other' respectively
    - expect: The select has the required HTML attribute present
  3. Inspect the Name, Email, and Message fields
    - expect: '[data-testid="form-name"]' value equals '' and is visible, preceded by label text 'Name:'
    - expect: '[data-testid="form-email"]' value equals '' and is visible, preceded by label text 'Email:'
    - expect: '[data-testid="form-message"]' value equals '' and is visible, preceded by label text 'Message:'
  4. Inspect the radio group and checkbox
    - expect: Radio input with id 'Yes' (value 'Yes') is unchecked
    - expect: Radio input with id 'No' (value 'No') is unchecked
    - expect: '[data-testid="termsConditions-checkbox"]' is unchecked
    - expect: Label text 'Do you like this exercise?' is visible above the radio group
    - expect: Text 'I agree to the Terms and Conditions' is visible next to the checkbox, with 'Terms and Conditions' rendered as a link
  5. Inspect the Submit button and overall page state
    - expect: '[data-testid="button-submit"]' is visible, enabled, and has text 'Submit'
    - expect: No element with '[data-testid="form-sent"]' exists in the DOM (success panel not shown on fresh load)

#### 1.2. 'Terms and Conditions' link navigates to the correct page in a new tab

**File:** `tests/components/form/form-load.spec.ts`

**Steps:**
  1. Navigate to '/components/form' and inspect the 'Terms and Conditions' link without clicking
    - expect: The link's href attribute equals '/testing-terms-conditions'
    - expect: The link's target attribute equals '_blank' (confirmed by test run against the live site — same pattern as the Advanced Table's external website links; an earlier exploration pass had mis-recorded this field as same-tab)
  2. Click the 'Terms and Conditions' link
    - expect: A new browser tab opens (original form page remains open, unnavigated, still on '/components/form')
    - expect: The new tab's URL ends with '/testing-terms-conditions'
    - expect: A heading 'Testing terms & conditions' (level 1) is visible on the new tab's page

### 2. Form - Required Field Validation (native HTML5 constraints)

**Seed:** `tests/seed.spec.ts`

#### 2.1. Submitting a completely empty form is blocked and focuses the first invalid field (dropdown)

**File:** `tests/components/form/form-validation.spec.ts`

**Steps:**
  1. Navigate to '/components/form' (all fields at default/blank state) and click '[data-testid="button-submit"]' without filling anything
    - expect: The page does NOT transition to the success state: no '[data-testid="form-sent"]' element appears in the DOM after the click
    - expect: The dropdown's validity state has valueMissing === true and validationMessage is a non-empty string

  **Note:** an earlier draft of this scenario also asserted that '[data-testid="form-dropdown"]' becomes `document.activeElement` after the blocked submit. That check is dropped here — the project's `playwright.config.ts` runs all three of chromium, firefox, and webkit, and WebKit in particular is inconsistent about which element receives focus after a native constraint-validation failure, so the assertion would be flaky on 1-2 of 3 browsers for reasons unrelated to the app. If focus-after-blocked-submit behavior needs coverage later, scope it to a chromium-only test rather than the shared cross-browser scenario.

#### 2.2. Dropdown required constraint alone blocks submission when every other field is valid

**File:** `tests/components/form/form-validation.spec.ts`

**Steps:**
  1. Navigate to '/components/form'. Fill Name with 'Test User', Email with 'test@example.com', Message with 'Test message', select radio 'Yes', and check the Terms checkbox — leave the dropdown at its default 'Select an option' value. Click Submit
    - expect: The page does NOT show '[data-testid="form-sent"]' (submission is blocked)
    - expect: The dropdown's validity.valueMissing equals true and its validationMessage is a non-empty string
    - expect: All previously entered field values (Name 'Test User', Email 'test@example.com', Message 'Test message', radio 'Yes' checked, Terms checkbox checked) remain unchanged after the blocked submit attempt

#### 2.3. Name required constraint alone blocks submission when every other field is valid

**File:** `tests/components/form/form-validation.spec.ts`

**Steps:**
  1. Navigate to '/components/form'. Select dropdown option 'Software', leave Name empty, fill Email with 'test@example.com', fill Message with 'Test message', select radio 'Yes', check the Terms checkbox. Click Submit
    - expect: The page does NOT show '[data-testid="form-sent"]'
    - expect: '[data-testid="form-name"]' validity.valueMissing equals true and validationMessage is a non-empty string
    - expect: The dropdown value remains 'Software' and the Email/Message/radio/checkbox values entered before the blocked submit remain unchanged

#### 2.4. Email required constraint alone blocks submission when every other field is valid

**File:** `tests/components/form/form-validation.spec.ts`

**Steps:**
  1. Navigate to '/components/form'. Select dropdown option 'Software', fill Name with 'Test User', leave Email empty, fill Message with 'Test message', select radio 'Yes', check the Terms checkbox. Click Submit
    - expect: The page does NOT show '[data-testid="form-sent"]'
    - expect: '[data-testid="form-email"]' validity.valueMissing equals true and validationMessage is a non-empty string

#### 2.5. Message required constraint alone blocks submission when every other field is valid

**File:** `tests/components/form/form-validation.spec.ts`

**Steps:**
  1. Navigate to '/components/form'. Select dropdown option 'Software', fill Name with 'Test User', fill Email with 'test@example.com', leave Message empty, select radio 'Yes', check the Terms checkbox. Click Submit
    - expect: The page does NOT show '[data-testid="form-sent"]'
    - expect: '[data-testid="form-message"]' validity.valueMissing equals true and validationMessage is a non-empty string

#### 2.6. Radio group required constraint alone blocks submission when every other field is valid

**File:** `tests/components/form/form-validation.spec.ts`

**Steps:**
  1. Navigate to '/components/form'. Select dropdown option 'Software', fill Name with 'Test User', fill Email with 'test@example.com', fill Message with 'Test message', leave BOTH radio options unselected, check the Terms checkbox. Click Submit
    - expect: The page does NOT show '[data-testid="form-sent"]'
    - expect: The radio input with id 'Yes' has validity.valueMissing equal to true and a non-empty validationMessage (the required constraint applies to the whole same-named radio group)
    - expect: Neither the 'Yes' nor 'No' radio input is checked after the blocked submit

#### 2.7. Terms checkbox required constraint alone blocks submission when every other field is valid

**File:** `tests/components/form/form-validation.spec.ts`

**Steps:**
  1. Navigate to '/components/form'. Select dropdown option 'Software', fill Name with 'Test User', fill Email with 'test@example.com', fill Message with 'Test message', select radio 'Yes', leave the Terms checkbox UNCHECKED. Click Submit
    - expect: The page does NOT show '[data-testid="form-sent"]'
    - expect: '[data-testid="termsConditions-checkbox"]' validity.valueMissing equals true and validationMessage is a non-empty string
    - expect: '[data-testid="termsConditions-checkbox"]' remains unchecked after the blocked submit, and the dropdown/Name/Email/Message/radio values entered before the click remain unchanged (equals 'Software', 'Test User', 'test@example.com', 'Test message', 'Yes' checked respectively)

### 3. Form - Successful Submission, Equivalence Classes, and Boundary Values

**Seed:** `tests/seed.spec.ts`

#### 3.1. Submitting the form with all required fields validly filled shows the success panel and fires no network request

**File:** `tests/components/form/form-submission.spec.ts`

**Steps:**
  1. Navigate to '/components/form', begin recording network requests, then select dropdown 'Software', fill Name 'Test User', fill Email 'test@example.com', fill Message 'This is a test message.', select radio 'Yes', check the Terms checkbox, and click Submit
    - expect: '[data-testid="form-sent"]' becomes visible in the DOM
    - expect: Within the success panel, a heading with text exactly 'Form submitted' (level 1) is visible
    - expect: Within the success panel, a sub-heading with text exactly 'Good job!' (level 2) is visible
    - expect: '[data-testid="button-form-retry"]' with text 'Retry' is visible
    - expect: The original form fields (dropdown/name/email/message/radio/checkbox/submit button) are no longer present in the DOM, replaced by the success panel
    - expect: No XHR or fetch network request was made as a result of the click (only pre-existing static/RSC-prefetch requests unrelated to form data may be present in the network log; no request contains the submitted form values in its URL or body)

#### 3.2. [GAP] Email field accepts a value with no '@' or domain — no email-format validation exists

**File:** `tests/components/form/form-submission.spec.ts`

**Steps:**
  1. Navigate to '/components/form'. Select dropdown 'Hardware', fill Name 'A', fill Email with the non-email string 'notanemail' (no '@', no domain), fill Message 'x', select radio 'No', check the Terms checkbox, and click Submit
    - expect: '[data-testid="form-sent"]' becomes visible (submission succeeds despite the Email field containing an obviously invalid email format)
    - expect: '[data-testid="form-email"]' validity.typeMismatch is false immediately before the click (confirming the browser applies no email-format constraint to this field, since its type attribute is 'text' not 'email')

#### 3.3. [GAP] Whitespace-only value in the required Name field satisfies the required constraint and allows submission

**File:** `tests/components/form/form-submission.spec.ts`

**Steps:**
  1. Navigate to '/components/form'. Select dropdown 'Other', fill Name with exactly three space characters '   ', fill Email 'test@example.com', fill Message 'Test message', select radio 'Yes', check the Terms checkbox, and click Submit
    - expect: Before clicking Submit, '[data-testid="form-name"]' validity.valueMissing equals false (the browser does not treat the whitespace-only value as empty)
    - expect: '[data-testid="form-sent"]' becomes visible after clicking Submit (the form submits successfully with a Name field that visually appears blank but is technically three space characters)

#### 3.4. Submission succeeds for every dropdown option and every radio option (equivalence classes for 'valid selection')

**File:** `tests/components/form/form-submission.spec.ts`

**Steps:**
  1. Navigate to '/components/form'. Fill Name 'Test User', Email 'test@example.com', Message 'Test message', check the Terms checkbox. Select dropdown option 'Hardware' and radio option 'No'. Click Submit
    - expect: '[data-testid="form-sent"]' becomes visible, confirming 'Hardware' (a non-first, non-default dropdown option) and 'No' (the second radio option) are both accepted as valid selections satisfying their respective required constraints
  2. Reload '/components/form' fresh, repeat with dropdown option 'Other' and radio option 'Yes' (all other fields filled validly as above), and click Submit
    - expect: '[data-testid="form-sent"]' becomes visible, confirming the third dropdown option 'Other' is also accepted as a valid selection

### 4. Form - Retry / Reset Behavior

**Seed:** `tests/seed.spec.ts`

#### 4.1. Clicking Retry after a successful submission removes the success panel and resets every field to its fresh-load default

**File:** `tests/components/form/form-retry.spec.ts`

**Steps:**
  1. Navigate to '/components/form', fill and submit the form completely and validly (dropdown 'Software', Name 'Test User', Email 'test@example.com', Message 'Test message', radio 'Yes', Terms checkbox checked) so that '[data-testid="form-sent"]' is visible, then click '[data-testid="button-form-retry"]'
    - expect: '[data-testid="form-sent"]' is no longer present in the DOM after clicking Retry
    - expect: '[data-testid="form-dropdown"]' value equals '' (back to 'Select an option')
    - expect: '[data-testid="form-name"]' value equals ''
    - expect: '[data-testid="form-email"]' value equals ''
    - expect: '[data-testid="form-message"]' value equals ''
    - expect: Neither radio input (id 'Yes' nor id 'No') is checked
    - expect: '[data-testid="termsConditions-checkbox"]' is unchecked
    - expect: '[data-testid="button-submit"]' is visible and enabled again, i.e. the original blank form is fully restored

#### 4.2. After clicking Retry, the reset form can be filled and submitted again successfully

**File:** `tests/components/form/form-retry.spec.ts`

**Steps:**
  1. Navigate to '/components/form', submit the form once successfully, click Retry, then fill and submit the form a second time with different valid values (dropdown 'Other', Name 'Second User', Email 'second@example.com', Message 'Second message', radio 'No', Terms checkbox checked)
    - expect: '[data-testid="form-sent"]' becomes visible again after the second submission, confirming the form is fully reusable after a Retry cycle and not left in a broken/stale state from the first submission
