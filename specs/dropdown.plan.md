# Dropdown Component Test Plan

## Application Overview

**Page Object:** `DropdownPage.ts` (new — does not yet exist in `tests/pages/`, unlike Button/Alert/Form/Input/AdvancedTable/Drag which already have one). Since every interactive element on this page carries a real `data-testid`, `DropdownPage.ts` should expose locators for all four `<select>` elements (`fruitSelect`, `superheroSelect`, `langSelect`, `countrySelect`) plus the two result-text spans (`fruitResult`, `superheroResult` — note lang/country have no equivalent result span, see below), a `gotoDropdown()` navigation helper, and small selection helpers such as `selectFruit(label)`, `selectSuperheroes(labels[])`, `selectLang(value)`, `selectCountry(value)` that wrap Playwright's `selectOption()` so raw locators aren't scattered across spec files, per this project's Page Object convention.

The Dropdown component (https://www.automationplayground.dev/components/dropdown) is a static page (heading "Dropdown", level 1) presenting four independent native HTML `<select>` exercises: a single-select "fruit" dropdown (selected by visible label text), a multi-select "superhero" dropdown, a single-select "programming language" dropdown (selected by underlying value, which differs from its visible label), and a single-select "country" dropdown (selected by underlying value, which happens to equal its visible label). All four are plain native `<select>`/`<option>` elements styled with Tailwind — no custom JS-rendered listbox/combobox widget is used anywhere on this page. All interactions are purely client-side: no XHR/fetch network request specific to any dropdown selection was observed firing during exploration (only pre-existing Next.js RSC prefetch requests for unrelated nav links, the same pattern documented on every other component page), directly verified via `browser_network_requests` during exploration — so this plan contains no API-level test coverage.

**Data-testid inventory (verified live via `document.querySelectorAll('[data-testid]')`):**
- `[data-testid="form-label"]` (×4) — one `<label>` preceding each dropdown, with text 'Select the apple using visible text', 'Select your super hero', 'Select the last programming language and print all the options', and 'Select India using value & print the selected value' respectively.
- `[data-testid="dropdown-fruit"]` — native `<select name="fruit" required>`. 6 `<option>` elements: `{value:'', label:'Select an option'}` (hidden placeholder), `Apple`, `Mango`, `Orange`, `Banana`, `Pineapple` (value === label for all real options).
- `[data-testid="user-selected-fruit"]` — a `<span>` (nested inside a larger element whose surrounding static text reads "Selected Fruit: "). Default text exactly `No fruit selected`; after selection, text equals exactly the selected fruit's name (e.g. `Mango`), no prefix.
- `[data-testid="dropdown-superhero"]` — native `<select multiple name="superHero" required>`. 10 `<option>` elements, value === label for all, NO placeholder/empty option: `Ant-Man`, `Aquaman`, `Batman`, `Superman`, `Spiderman`, `Venom`, `Ironman`, `Thor`, `Hulk`, `Black Panther` (this exact DOM order).
- `[data-testid="user-selected-superhero"]` — default text exactly `None selected`; after selection(s), text is a comma-and-space-separated list of the selected heroes' names in their DOM/option-list order (NOT the order they were selected in — confirmed live, see Confirmed behaviors below).
- `[data-testid="dropdown-lang"]` — native `<select name="lang" required>`. 6 `<option>` elements: `{value:'', label:'Select an option'}` (hidden placeholder), then `{value:'js', label:'Javascript'}`, `{value:'java', label:'Java'}`, `{value:'py', label:'Python'}`, `{value:'swift', label:'Swift'}`, `{value:'sharp', label:'C#'}` — note the underlying values are abbreviated codes, distinct from the visible labels. **No separate result-text `data-testid` element exists for this dropdown** — its only observable state is the select's own `.value`/displayed option, confirmed absent from the DOM both before and after interaction.
- `[data-testid="dropdown-country"]` — native `<select name="countries" required>`. 13 `<option>` elements: `{value:'', label:'Select an option'}` (hidden placeholder), then 12 real countries where value === label exactly: `Argentina`, `Bolivia`, `Brazil`, `Chile`, `Colombia`, `Ecuador`, `India`, `Paraguay`, `Peru`, `Suriname`, `Uruguay`, `Venezuela`. **No separate result-text `data-testid` element exists for this dropdown either**, same as the language dropdown — only `.value` is observable.

Confirmed default/fresh state (page reload, no interaction, directly re-verified): `dropdown-fruit` value `''` with result text `No fruit selected`; `dropdown-superhero` has 0 selected options with result text `None selected`; `dropdown-lang` value `''`; `dropdown-country` value `''`. None of the four selects has a `disabled` attribute. All four carry a `required` attribute, but none of the four selects is wrapped in a `<form>` element and no submit button exists anywhere on the page (confirmed via `element.closest('form')` returning null and 0 `button[type="submit"]` elements) — so the `required` attribute has no functional/blocking effect on this page; it is effectively decorative for testing purposes since there is no submit event it could ever intercept.

Confirmed behaviors (all independently verified live during this exploration pass via direct DOM/value inspection, not just visual comparison):
- Fruit and superhero selections update their respective result `<span>` text live/immediately on selection (via the native `change` event) — no blur, submit, or additional action is needed to see the update reflected.
- The superhero multi-select's result text always lists selected heroes in the select's own DOM/option order, not the order `selectOption()` was called with — confirmed by selecting `['Thor', 'Ant-Man', 'Batman']` (in that call order) and observing the result text read exactly `Ant-Man, Batman, Thor`.
- Deselecting all superhero options (`selectOption([])`) reverts the result text to exactly `None selected` — confirmed reproducible, i.e. this is the genuine empty-selection state, not merely the untouched initial value.
- Re-selecting a different fruit after one is already selected fully replaces the result text (no concatenation/duplication) — confirmed by selecting `Banana` then `Orange` and observing the result end at exactly `Orange`.
- Keyboard interaction works via standard native `<select>` behavior: focusing the select and pressing `ArrowDown` moves to the next option in DOM order (skipping the hidden placeholder), and typing a letter (e.g. `m`) jumps directly to the first option whose label starts with that letter (type-ahead) — both confirmed live on the fruit dropdown, and both live-update the result span immediately, same as a mouse-driven selection.
- No selection state persists across a page reload for any of the four dropdowns — confirmed by setting non-default values in all four, reloading, and observing every one revert to its documented default (no localStorage/sessionStorage/URL state involved).
- The four dropdowns are fully independent: setting a value in one does not alter the state of any of the other three, confirmed by setting all four in sequence and re-checking each after every step.
- No JavaScript console errors or warnings were observed during any exploration flow (single-selects, multi-select in all combinations, keyboard navigation, reload, cross-dropdown sequences).

Known bugs / notable gaps:
1. **[QUIRK — not a functional bug, but a real, reproducible UX oddity]** Once a real option is selected in a single-select dropdown (confirmed on `dropdown-fruit`, e.g. selecting `Mango`), that specific `<option>` element gains a `hidden` HTML attribute that it did NOT have before selection (confirmed via `outerHTML` diff before/after, reproduced with two different fruits independently). This means a real mouse user who reopens the native dropdown after selecting a value cannot see or re-click that same already-selected option in the rendered list — though the value remains correctly selected and readable via `.value`, and Playwright's `selectOption()` API can still re-select it programmatically since it operates on the DOM value directly rather than simulating a real click on a rendered list item. This is flagged as a defect-candidate worth reporting to the dev team, not merely a cosmetic detail — it functionally blocks a real user from reselecting the same value via the mouse after selecting something else and coming back. Not independently confirmed on the superhero/lang/country selects during this pass, but the underlying select markup pattern is shared across all four, so it is reasonably likely to reproduce there too (see ambiguous areas below).
2. **[Notable, not a bug]** The `required` HTML attribute is present on all four selects but has zero functional effect on this page, since none of the selects are inside a `<form>` and there is no submit action anywhere that could trigger HTML5 required-field validation. Flagged so testers do not write a scenario asserting validation-blocking behavior that cannot exist on this page as built.

Ambiguous/unverified areas explicitly flagged for testers:
- Whether the "selected option gains `hidden`" quirk (see bug #1 above) also reproduces on the superhero, language, and country selects was not independently re-confirmed for all three during this pass — only the fruit dropdown was directly exercised for this specific check. Given the shared markup/styling pattern across all four selects, it is reasonably expected to reproduce identically, but this is an assumption carried into the plan rather than a directly-observed fact for those three.
- Touch/mobile-specific dropdown interaction (native mobile `<select>` picker UI) was not independently exercised on an emulated touch viewport during this pass.
- The exact framework/state-management implementation behind these selects (e.g. whether the `hidden`-on-selected-option quirk stems from a specific React controlled-component pattern) was not identified from source — all behaviors above were derived purely from black-box interaction and DOM inspection, not by reading the app's JS bundle.
- The "BACK" button in the page header (shared across all component pages) was not exercised as part of this plan, consistent with the Button, Alert, Form, Input, and Drag plans' treatment of this same shared control.
- Whether pressing `ArrowUp` (reverse direction) or `Home`/`End` keys on a focused select behaves as expected native-browser-standard behavior was not independently exercised during this pass; only `ArrowDown` and single-letter type-ahead were directly confirmed.

## Test Scenarios

### 1. Dropdown - Initial Load and Default State

**Seed:** `tests/seed.spec.ts`

#### 1.1. Dropdown page loads with all four selects, labels, result text, and Insight section correctly rendered

**File:** `tests/components/dropdown/dropdown-load.spec.ts`

**Steps:**
  1. Navigate to '/components/dropdown' on a fresh browser context
    - expect: Page loads successfully (HTTP 200, no console errors)
    - expect: Heading 'Dropdown' (level 1) is visible
  2. Inspect the fruit dropdown block
    - expect: Label text 'Select the apple using visible text' is visible
    - expect: '[data-testid="dropdown-fruit"]' is visible and enabled, a native <select> with `required` attribute present and NOT `multiple`
    - expect: '[data-testid="user-selected-fruit"]' text equals exactly 'No fruit selected'
  3. Inspect the superhero dropdown block
    - expect: Label text 'Select your super hero' is visible
    - expect: '[data-testid="dropdown-superhero"]' is visible and enabled, a native <select multiple> with `required` attribute present
    - expect: '[data-testid="user-selected-superhero"]' text equals exactly 'None selected'
  4. Inspect the language dropdown block
    - expect: Label text 'Select the last programming language and print all the options' is visible
    - expect: '[data-testid="dropdown-lang"]' is visible and enabled, a native <select> (not multiple) with `required` attribute present, and its `.value` property equals exactly '' (empty string)
  5. Inspect the country dropdown block
    - expect: Label text 'Select India using value & print the selected value' is visible
    - expect: '[data-testid="dropdown-country"]' is visible and enabled, a native <select> (not multiple) with `required` attribute present, and its `.value` property equals exactly '' (empty string)
  6. Inspect the 'Insight' section without performing any click/expand interaction
    - expect: Heading 'Insight' (level 2) is visible immediately, with no interaction required to reveal it
    - expect: The concept list contains exactly the items 'Select an option from a dropdown', 'Select multiple options from a multi-select dropdown', 'Verify displayed selected value'
    - expect: A 'Github solution' link is visible with href 'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/dropdown/dropdown.spec.ts'

#### 1.2. Every option's underlying value and visible label matches the confirmed live inventory for all four dropdowns

**File:** `tests/components/dropdown/dropdown-load.spec.ts`

**Steps:**
  1. Navigate to '/components/dropdown' and read `.options` (value + label) from the fruit select via DOM inspection
    - expect: Fruit select has exactly 6 <option> elements in this exact order: {value:'', label:'Select an option'}, {value:'Apple', label:'Apple'}, {value:'Mango', label:'Mango'}, {value:'Orange', label:'Orange'}, {value:'Banana', label:'Banana'}, {value:'Pineapple', label:'Pineapple'}
    - expect: Only the placeholder option (value '') carries the `hidden` attribute on fresh load; none of the 5 real fruit options are hidden
  2. Read `.options` from the superhero select
    - expect: Superhero select has exactly 10 <option> elements, all with value===label, in this exact order: Ant-Man, Aquaman, Batman, Superman, Spiderman, Venom, Ironman, Thor, Hulk, Black Panther
    - expect: There is NO placeholder/empty option in this select (unlike the three single-selects) — the first real option is the first option in the DOM
  3. Read `.options` from the language select
    - expect: Language select has exactly 6 <option> elements in this exact order: {value:'', label:'Select an option'}, {value:'js', label:'Javascript'}, {value:'java', label:'Java'}, {value:'py', label:'Python'}, {value:'swift', label:'Swift'}, {value:'sharp', label:'C#'} — confirming the underlying `value` attributes differ from their visible labels for every real option (e.g. Python's value is 'py', not 'Python')
  4. Read `.options` from the country select
    - expect: Country select has exactly 13 <option> elements: a leading {value:'', label:'Select an option'} placeholder followed by 12 real countries in this exact order: Argentina, Bolivia, Brazil, Chile, Colombia, Ecuador, India, Paraguay, Peru, Suriname, Uruguay, Venezuela — each option's `value` attribute equals its visible label exactly (unlike the language select)

### 2. Dropdown - Fruit (Single-Select by Visible Text)

**Seed:** `tests/seed.spec.ts`

#### 2.1. Selecting a fruit by its visible label updates the result text to exactly that fruit's name

**File:** `tests/components/dropdown/dropdown-fruit.spec.ts`

**Steps:**
  1. Navigate to '/components/dropdown' and select the fruit option with visible label 'Mango' via `selectOption({ label: 'Mango' })`
    - expect: '[data-testid="dropdown-fruit"]' `.value` equals exactly 'Mango'
    - expect: '[data-testid="user-selected-fruit"]' text equals exactly 'Mango' (not 'No fruit selected' and not a longer string like 'Selected Fruit: Mango' — the static 'Selected Fruit:' label text is a separate DOM node outside this test-id'd span)

#### 2.2. Selecting the first and last real options in the fruit list (boundary options) both display correctly

**File:** `tests/components/dropdown/dropdown-fruit.spec.ts`

**Steps:**
  1. Navigate to '/components/dropdown' and select label 'Apple' (first real option after the placeholder)
    - expect: Result text equals exactly 'Apple'
  2. Re-navigate fresh and select label 'Pineapple' (last real option in the list)
    - expect: Result text equals exactly 'Pineapple', confirming both boundary positions of the option list work correctly, not just a middle option

#### 2.3. Selecting a different fruit after one is already selected replaces the result rather than appending

**File:** `tests/components/dropdown/dropdown-fruit.spec.ts`

**Steps:**
  1. Navigate to '/components/dropdown', select label 'Banana', confirm result text equals 'Banana', then select label 'Orange'
    - expect: Result text equals exactly 'Orange' (the single result fully replaces the prior 'Banana' value, no concatenation or duplication)

#### 2.4. [QUIRK] Once an option is selected, that same <option> element gains a `hidden` attribute, hiding it from the reopened native dropdown list

**File:** `tests/components/dropdown/dropdown-fruit.spec.ts`

**Steps:**
  1. Navigate to '/components/dropdown'. Read the fruit select's outerHTML and confirm only the placeholder option (value '') carries `hidden` on fresh load. Select label 'Mango' via `selectOption`. Re-read the select's outerHTML
    - expect: Before selection: the <option value="Mango"> element has NO `hidden` attribute
    - expect: After selecting Mango: the <option value="Mango"> element now HAS a `hidden` attribute (confirmed via `getAttribute('hidden')` no longer returning null), while the four other real options (Apple, Orange, Banana, Pineapple) remain un-hidden — this is a genuine, reproducible app behavior (re-verified twice live during exploration with two different fruits), flagged as a notable UX quirk: a real mouse user who reopens the native dropdown after selecting a value cannot see or re-click that same already-selected option in the list (though the value remains correctly selected and Playwright's `selectOption` API can still re-select it programmatically regardless of the hidden attribute, since it operates on the DOM value directly rather than simulating a real click on a rendered option)

### 3. Dropdown - Superhero (Multi-Select)

**Seed:** `tests/seed.spec.ts`

#### 3.1. Selecting multiple superheroes displays all of them in the result text

**File:** `tests/components/dropdown/dropdown-superhero.spec.ts`

**Steps:**
  1. Navigate to '/components/dropdown' and select ['Batman', 'Superman', 'Thor'] via `selectOption`
    - expect: '[data-testid="dropdown-superhero"]' `.selectedOptions` values equal exactly the set {'Batman','Superman','Thor'} (3 items, order-independent for the underlying selection)
    - expect: '[data-testid="user-selected-superhero"]' text contains 'Batman', 'Superman', and 'Thor'

#### 3.2. Multi-select result text displays selected heroes in their DOM/option-list order, not the order they were selected in

**File:** `tests/components/dropdown/dropdown-superhero.spec.ts`

**Steps:**
  1. Navigate to '/components/dropdown' and select the three options in this specific call order: 'Thor', 'Ant-Man', 'Batman' (i.e. deliberately NOT in DOM order, to distinguish selection-order display from DOM-order display)
    - expect: '[data-testid="user-selected-superhero"]' text equals exactly 'Ant-Man, Batman, Thor' — comma-and-space-separated, in the SAME order the three options appear in the select's own DOM/option list (Ant-Man, then Batman, then Thor), NOT in the order they were passed to `selectOption` (Thor, Ant-Man, Batman) — this exact ordering behavior was independently confirmed live during exploration and must not be asserted as 'contains all three' alone, since a naive selection-order assumption would produce a false expectation

#### 3.3. Selecting a single superhero in the multi-select still displays correctly (lower boundary: one item)

**File:** `tests/components/dropdown/dropdown-superhero.spec.ts`

**Steps:**
  1. Navigate to '/components/dropdown' and select only ['Aquaman']
    - expect: Result text equals exactly 'Aquaman' with no trailing comma or separator artifacts, confirming the comma-join logic handles a single-item list correctly

#### 3.4. Selecting all ten superheroes displays all of them (upper boundary: full list)

**File:** `tests/components/dropdown/dropdown-superhero.spec.ts`

**Steps:**
  1. Navigate to '/components/dropdown' and select all 10 options: ['Ant-Man','Aquaman','Batman','Superman','Spiderman','Venom','Ironman','Thor','Hulk','Black Panther']
    - expect: Result text equals exactly 'Ant-Man, Aquaman, Batman, Superman, Spiderman, Venom, Ironman, Thor, Hulk, Black Panther' (full DOM-order, comma-separated list of all 10), confirming the display logic scales correctly to the maximum possible selection size

#### 3.5. Deselecting all superheroes reverts the result text to the default 'None selected' state

**File:** `tests/components/dropdown/dropdown-superhero.spec.ts`

**Steps:**
  1. Navigate to '/components/dropdown', select ['Hulk', 'Venom'], confirm result text contains both, then deselect all by calling `selectOption([])`
    - expect: '[data-testid="dropdown-superhero"]' `.selectedOptions` length equals exactly 0
    - expect: '[data-testid="user-selected-superhero"]' text equals exactly 'None selected' — confirmed reproducible live during exploration, i.e. the default text is not a one-time initial value but the genuine empty-selection state the component reverts to

### 4. Dropdown - Programming Language (Single-Select by Value)

**Seed:** `tests/seed.spec.ts`

#### 4.1. Selecting a language by its underlying value updates the select's `.value` to that exact value

**File:** `tests/components/dropdown/dropdown-lang.spec.ts`

**Steps:**
  1. Navigate to '/components/dropdown' and select the language select's value 'py' via `selectOption('py')`
    - expect: '[data-testid="dropdown-lang"]' `.value` equals exactly 'py' (confirms selecting by the underlying value attribute, not by visible label 'Python', which is a different string)

#### 4.2. Selecting the last programming language option in the list (per the exercise's own instruction wording) works correctly (upper boundary)

**File:** `tests/components/dropdown/dropdown-lang.spec.ts`

**Steps:**
  1. Navigate to '/components/dropdown' and select value 'sharp' (C#, the last real option in the DOM list, matching the exercise label text 'Select the last programming language')
    - expect: '[data-testid="dropdown-lang"]' `.value` equals exactly 'sharp'
    - expect: The select's visible/displayed text (its currently selected option's label) reads 'C#'

#### 4.3. There is no separate result-text element for the language dropdown; the select's own value is the only observable selection state

**File:** `tests/components/dropdown/dropdown-lang.spec.ts`

**Steps:**
  1. Navigate to '/components/dropdown', select value 'java', then scan the DOM for any element containing the text 'Java' outside the select itself (e.g. a result span like the fruit/superhero dropdowns have)
    - expect: No `[data-testid]` result-text element exists for the language dropdown anywhere in the DOM (confirmed absent both before and after selection) — unlike fruit/superhero, this dropdown's only observable outcome is the `<select>` element's own `.value` and displayed option text, which the legacy spec already asserts via `toHaveValue()`; this test documents that fact explicitly so a future test author does not go looking for a nonexistent result span

### 5. Dropdown - Country (Single-Select by Value)

**Seed:** `tests/seed.spec.ts`

#### 5.1. Selecting 'India' by its underlying value updates the select's `.value` to 'India'

**File:** `tests/components/dropdown/dropdown-country.spec.ts`

**Steps:**
  1. Navigate to '/components/dropdown' and select the country select's value 'India' via `selectOption('India')`
    - expect: '[data-testid="dropdown-country"]' `.value` equals exactly 'India' (matches the exercise's own instruction wording 'Select India using value')

#### 5.2. Selecting the first and last real country options (boundary values in a 12-item list) both work correctly

**File:** `tests/components/dropdown/dropdown-country.spec.ts`

**Steps:**
  1. Navigate to '/components/dropdown' and select value 'Argentina' (first real option after the placeholder)
    - expect: '.value' equals exactly 'Argentina'
  2. Re-navigate fresh and select value 'Venezuela' (last real option in the 12-item list)
    - expect: '.value' equals exactly 'Venezuela', confirming both ends of this longer option list work, not just options near the top

#### 5.3. For the country dropdown, each option's underlying `value` attribute equals its visible label exactly (unlike the language dropdown)

**File:** `tests/components/dropdown/dropdown-country.spec.ts`

**Steps:**
  1. Navigate to '/components/dropdown' and select by visible label 'Brazil' via `selectOption({ label: 'Brazil' })`
    - expect: '.value' equals exactly 'Brazil' — confirming label-based and value-based selection produce an identical result for this dropdown specifically, since its option values are the country names themselves rather than abbreviated codes

### 6. Dropdown - Keyboard Navigation

**Seed:** `tests/seed.spec.ts`

#### 6.1. Focusing the fruit select and pressing ArrowDown moves selection to the first real option and live-updates the result text

**File:** `tests/components/dropdown/dropdown-keyboard.spec.ts`

**Steps:**
  1. Navigate to '/components/dropdown', click/focus the fruit select ('[data-testid="dropdown-fruit"]', starting value ''), then press Escape to ensure no native popup is left open, then press 'ArrowDown' once via the keyboard
    - expect: The select's `.value` becomes exactly 'Apple' (the first real, non-placeholder option — ArrowDown from the hidden empty placeholder skips it and lands on the first visible option)
    - expect: '[data-testid="user-selected-fruit"]' text updates live to exactly 'Apple' immediately after the keypress, without requiring a blur or explicit change/submit action — confirming the result text is wired to the select's live `change` event, not a delayed/blur-triggered one

#### 6.2. Type-ahead: pressing the first letter of an option's label while the select is focused jumps directly to that option

**File:** `tests/components/dropdown/dropdown-keyboard.spec.ts`

**Steps:**
  1. Navigate to '/components/dropdown', focus the fruit select, then press the 'm' key (first letter of 'Mango', the only fruit option starting with 'm')
    - expect: The select's `.value` becomes exactly 'Mango'
    - expect: '[data-testid="user-selected-fruit"]' text updates to exactly 'Mango', confirming this is standard native `<select>` type-ahead behavior (not a custom-blocked or overridden keyboard handler)

#### 6.3. Pressing ArrowDown repeatedly on the focused fruit select cycles forward through the option list without skipping or wrapping unexpectedly

**File:** `tests/components/dropdown/dropdown-keyboard.spec.ts`

**Steps:**
  1. Navigate to '/components/dropdown', focus the fruit select, then press 'ArrowDown' four times in sequence, checking `.value` after each press
    - expect: After press 1: value is 'Apple'
    - expect: After press 2: value is 'Mango'
    - expect: After press 3: value is 'Orange'
    - expect: After press 4: value is 'Banana' — confirming ArrowDown moves exactly one option forward per keypress through the real options in DOM order, matching the option inventory documented in section 1

### 7. Dropdown - Cross-Dropdown Independence and Reload Persistence

**Seed:** `tests/seed.spec.ts`

#### 7.1. Selecting a value in one dropdown does not affect the state of any of the other three dropdowns

**File:** `tests/components/dropdown/dropdown-independence.spec.ts`

**Steps:**
  1. Navigate to '/components/dropdown' and select a value in only the fruit dropdown (label 'Orange')
    - expect: Fruit result text equals 'Orange'
    - expect: Superhero select `.selectedOptions` length is still 0 and result text is still exactly 'None selected'
    - expect: Language select `.value` is still exactly ''
    - expect: Country select `.value` is still exactly ''
  2. From that same page state, additionally select the superhero multi-select (['Ironman']), the language select (value 'js'), and the country select (value 'Chile'), one at a time
    - expect: After all four are set: fruit result text is still exactly 'Orange' (unchanged by the later interactions)
    - expect: Superhero result text is exactly 'Ironman'
    - expect: Language `.value` is exactly 'js'
    - expect: Country `.value` is exactly 'Chile' — confirming all four controls maintain fully independent state with no cross-contamination

#### 7.2. No selections persist across a page reload; all four dropdowns reset to their documented fresh-load defaults

**File:** `tests/components/dropdown/dropdown-persistence.spec.ts`

**Steps:**
  1. Navigate to '/components/dropdown'. Set a non-default value in all four dropdowns (fruit: 'Apple', superhero: ['Thor','Hulk'], lang: 'py', country: 'India') and confirm each reflects the new value
    - expect: All four dropdowns show their newly-selected values as expected before reloading
  2. Reload the page (page.reload())
    - expect: Fruit select `.value` is exactly '' and result text is exactly 'No fruit selected'
    - expect: Superhero select `.selectedOptions` length is exactly 0 and result text is exactly 'None selected'
    - expect: Language select `.value` is exactly ''
    - expect: Country select `.value` is exactly '' — confirming no selection state is persisted anywhere (no localStorage/sessionStorage/URL state) and every fresh load starts from the same documented default

#### 7.3. No API/network requests fire as a result of any dropdown selection (purely client-side component)

**File:** `tests/components/dropdown/dropdown-independence.spec.ts`

**Steps:**
  1. Navigate to '/components/dropdown', begin recording network requests, then interact with all four dropdowns (select a fruit, select multiple superheroes, select a language, select a country)
    - expect: No XHR/fetch network request specific to any dropdown selection is observed (only the pre-existing Next.js RSC prefetch requests for unrelated nav links, the same pattern documented on every other component page in this suite) — confirming this plan requires no API-level test coverage
