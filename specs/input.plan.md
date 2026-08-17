# Input Component Test Plan

## Application Overview

The Input component (https://www.automationplayground.dev/components/input) is a static page (page heading "Input", level 1) presenting six independent, unrelated `<input type="text">` fields, each demonstrating a different input-handling behavior. There is no surrounding `<form>` element, no Submit button, and no cross-field interaction — each field is its own isolated exercise. All six inputs carry the native HTML `required` attribute, but since there is no submit action on the page, this attribute has no visible enforcement effect (confirmed: `validity.valueMissing` can be inspected directly on each field, but nothing on the page ever triggers constraint validation). A collapsible-looking "Insight" (h2) section is also present on the page but its content was not able to be expanded/read during exploration (see Ambiguous/unverified areas).

Key elements (verified via `data-testid` attributes and live DOM inspection):
- `[data-testid="full-name"]` — `name="input1"`, `type="text"`, `required`, not disabled/readonly, no `maxlength`/`minlength`/`pattern`, placeholder "Enter first & last name", default value `""` (empty), labeled "Enter your full Name".
- `[data-testid="append-text"]` — `name="input2"`, `type="text"`, `required`, no placeholder, default value `"TestingBeLike"` on fresh load (confirmed not persisted via localStorage/sessionStorage — this is the page's genuine baked-in default, not leftover test state), labeled "Append a text and press keyboard tab".
- `[data-testid="inside-text"]` — `name="input3"`, `type="text"`, `required`, no placeholder, default value `"HelloWorld123"`, labeled "What is inside the text box".
- `[data-testid="clear-text"]` — `name="input4"`, `type="text"`, `required`, placeholder "Enter", default value `"DefaultText"`, labeled "Clear the text".
- `[data-testid="disabled-field"]` — `name="input5"`, `type="text"`, `required`, `disabled` attribute present (confirmed `.disabled === true`), default value `"Disabled text"`, labeled "Confirm edit field is disabled".
- `[data-testid="readonly-field"]` — `name="input6"`, `type="text"`, `required`, `readonly` attribute present, not disabled, default value `"This text is readonly"`, labeled "Confirm text is readonly".

No other interactive elements exist on the page besides these six inputs, the shared site header (branding, nav, "BACK" button) and an "Insight" section. Exactly 6 `<input>` elements total exist in the DOM — confirmed no hidden/extra fields.

Confirmed default/fresh state (page reload, no interaction): `full-name` is the only empty field; the other five (`append-text`, `inside-text`, `clear-text`, `disabled-field`, `readonly-field`) load pre-filled with their respective default text shown above. None of the six fields are focused by default.

Confirmed behaviors:
- All six inputs are plain `type="text"` — no `type="email"`, no `pattern`, no `maxlength`/`minlength` on any of them, so there is no format or length constraint enforced by the browser on any field (consistent with the Form component's Email field gap — a site-wide pattern of `required`-only validation).
- `full-name`, `append-text`, `inside-text`, and `clear-text` are all freely editable via `.fill()`/typing; typed values replace or extend the field's content exactly as entered, with no client-side sanitization, trimming, or escaping observed (confirmed by injecting a leading/trailing-whitespace value directly and reading it back verbatim).
- Whitespace-only input (e.g. three space characters) in the required `full-name` field satisfies the native `required` constraint (`validity.valueMissing === false`) — the same native-browser edge case documented for the Form component's Name/Email/Message fields. Not a custom app bug; standard HTML5 `required` behavior.
- `disabled-field` has the `disabled` HTML property set to `true`; disabled inputs are inherently non-interactive/non-focusable per browser behavior (cannot be clicked into or typed into).
- `readonly-field` has the `readonly` attribute (not `disabled` — it remains focusable/clickable and included in tab order, but its `.value` cannot be changed via keyboard typing), per standard HTML5 `readonly` semantics.
- Tab order across the page proceeds `full-name` → `append-text` → `inside-text` (confirmed for the first three editable fields; order for the remaining three fields relative to each other and to disabled/readonly fields was not independently re-verified in this exploration pass, see Ambiguous/unverified areas).

Known bugs / notable gaps: none identified as functional defects. The absence of any format/length validation on all six fields is a validation gap consistent with the rest of the site's "native `required`-only" pattern (same spirit as the Form component's Email field), not flagged as a bug here since no field's label implies a specific format (e.g. no field is labeled "Email").

Ambiguous/unverified areas explicitly flagged for testers:
- The "Insight" (h2) section's actual content/purpose was not determined during exploration — it may be a collapsed/expandable panel requiring a click to reveal text, or it may render conditionally based on an interaction with one of the fields. Requires a dedicated follow-up pass (e.g. try clicking the heading, or trigger each field's exercise and re-inspect) before writing any assertion against it.
- Behavior with very long input strings (e.g. 5,000+ characters) and special/non-ASCII/emoji characters was not tested against any of the six fields, since none declare a `maxlength` to test a boundary against.
- Whitespace-only-input behavior was only verified on `full-name`; it was not independently re-confirmed on `append-text`, `inside-text`, or `clear-text`, though the same native-browser mechanism would be expected to apply identically since none of the four editable fields differ in type/attributes relevant to this behavior.
- Full six-field tab order (including where `disabled-field` and `readonly-field` sit in the sequence — disabled fields are always skipped in tab order per browser spec, but this was not directly re-confirmed here) was not independently re-verified beyond the first three fields.
- Copy/paste behavior into any field was not exercised.
- The unlabeled icon button present in the header (likely a mobile hamburger-menu toggle, consistent with the Home page's responsive nav) was not exercised as part of this plan since it is not specific to the Input component.

## Test Scenarios

### 1. Input - Initial Load and Default State

**Seed:** `tests/seed.spec.ts`

#### 1.1. Input page loads with all six fields showing correct default values and attributes

**File:** `tests/components/input/input-load.spec.ts`

**Steps:**
  1. Navigate to '/components/input' on a fresh browser context
    - expect: Page loads successfully (HTTP 200, no console errors)
    - expect: Heading 'Input' (level 1) is visible
  2. Inspect each of the six fields' default value and relevant attributes
    - expect: '[data-testid="full-name"]' value equals '' and placeholder equals 'Enter first & last name'
    - expect: '[data-testid="append-text"]' value equals 'TestingBeLike'
    - expect: '[data-testid="inside-text"]' value equals 'HelloWorld123'
    - expect: '[data-testid="clear-text"]' value equals 'DefaultText' and placeholder equals 'Enter'
    - expect: '[data-testid="disabled-field"]' value equals 'Disabled text' and the field is disabled
    - expect: '[data-testid="readonly-field"]' value equals 'This text is readonly' and has the readonly attribute
    - expect: All six fields individually have the required HTML attribute present

#### 1.2. Tab order proceeds through the editable fields in document order

**File:** `tests/components/input/input-load.spec.ts`

**Steps:**
  1. Navigate to '/components/input', click into '[data-testid="full-name"]', then press Tab
    - expect: '[data-testid="append-text"]' becomes focused
  2. Press Tab again
    - expect: '[data-testid="inside-text"]' becomes focused

### 2. Input - Editable Field Behavior

**Seed:** `tests/seed.spec.ts`

#### 2.1. Typing into the empty full-name field sets its value exactly

**File:** `tests/components/input/input-fields.spec.ts`

**Steps:**
  1. Navigate to '/components/input' and fill '[data-testid="full-name"]' with 'Test Tester'
    - expect: '[data-testid="full-name"]' value equals 'Test Tester' exactly

#### 2.2. Appending text before the pre-filled append-text field's default value

**File:** `tests/components/input/input-fields.spec.ts`

**Steps:**
  1. Navigate to '/components/input', read the current value of '[data-testid="append-text"]' (its live default, expected 'TestingBeLike'), then fill the field with the literal string 'Prepended' immediately followed by that captured default value, and press Tab
    - expect: '[data-testid="append-text"]' value equals 'Prepended' + the captured default value (not hardcoded, to remain resilient if the default text ever changes)

#### 2.3. Reading and overwriting the pre-filled inside-text field

**File:** `tests/components/input/input-fields.spec.ts`

**Steps:**
  1. Navigate to '/components/input' and read '[data-testid="inside-text"]'
    - expect: The field is visible and its initial value is a non-empty string (expected 'HelloWorld123')
  2. Fill the field with a new value 'Overwritten123'
    - expect: '[data-testid="inside-text"]' value equals 'Overwritten123', confirming the pre-filled field is fully editable

#### 2.4. Whitespace-only input satisfies the required constraint on a text field (native browser edge case)

**File:** `tests/components/input/input-fields.spec.ts`

**Steps:**
  1. Navigate to '/components/input' and set '[data-testid="full-name"]' to a whitespace-only value (e.g. three space characters)
    - expect: The field's validity.valueMissing equals false (native HTML5 `required` does not treat whitespace-only content as empty) — documented as a known browser-native edge case, mirroring the same behavior confirmed on the Form component's text fields, not a defect in this app

### 3. Input - Clear Behavior

**Seed:** `tests/seed.spec.ts`

#### 3.1. Selecting and clearing the pre-filled clear-text field empties it

**File:** `tests/components/input/input-fields.spec.ts`

**Steps:**
  1. Navigate to '/components/input' and confirm '[data-testid="clear-text"]' is not empty (expected default 'DefaultText')
    - expect: '[data-testid="clear-text"]' value does not equal ''
  2. Select all and clear the field's content
    - expect: '[data-testid="clear-text"]' value equals '' after clearing

### 4. Input - Disabled and Readonly States

**Seed:** `tests/seed.spec.ts`

#### 4.1. Disabled field cannot be focused, clicked into, or edited

**File:** `tests/components/input/input-states.spec.ts`

**Steps:**
  1. Navigate to '/components/input' and inspect '[data-testid="disabled-field"]'
    - expect: The field is disabled (Playwright's `toBeDisabled()` assertion passes)
    - expect: The field's value remains 'Disabled text' (unchanged, untouched default)
    - expect: The field is excluded from keyboard tab order (attempting to reach it via Tab from an adjacent field does not focus it) — scope this assertion carefully given tab order across all six fields was not fully re-verified in exploration; confirm actual adjacent-field tab behavior before asserting a specific Tab-sequence expectation

#### 4.2. Readonly field is focusable but its value cannot be changed via keyboard input

**File:** `tests/components/input/input-states.spec.ts`

**Steps:**
  1. Navigate to '/components/input', click '[data-testid="readonly-field"]', and attempt to type additional text into it
    - expect: '[data-testid="readonly-field"]' has the readonly HTML attribute
    - expect: The field's value remains exactly 'This text is readonly' (typed text is not appended/inserted), since readonly inputs accept focus but reject value mutation via user input
