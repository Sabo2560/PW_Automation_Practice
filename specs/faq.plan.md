# FAQ Page Test Plan

## Application Overview

The FAQ page (`/faq`) is a top-level page, a peer of the Home page (`/`) and the Components Listing page (`/components`), NOT a component under `/components/*`. It is reached via the shared header's "F.A.Q" nav link (confirmed already covered end-to-end by `tests/home/home-navigation.spec.ts`'s "Clicking header 'F.A.Q' nav link navigates to FAQ page" test — that round-trip is NOT re-planned here). The page consists of one intro paragraph and a list of 9 independently-toggleable question/answer items (a custom div/button-based expand-collapse widget, confirmed NOT a native `<details>/<summary>` and NOT MUI-based — no `Mui*` classes anywhere on the page). Content is purely static/client-side with no backing API of any kind, and no page-specific heading exists on this page at all (a real, confirmed absence worth testing directly).

## Test Scenarios

### 1. FAQ Page

**Seed:** `tests/seed.spec.ts`

#### 1.1. Page Object Decision and Scope Note (read first)

**File:** `N/A - planning note, not a spec file`

**Steps:**
  1. No existing plan or spec files cover this page before this plan. Glob confirmed: no `specs/faq.plan.md`, no `tests/faq/**`, and no `tests/pages/FaqPage.ts` exist anywhere in the repo prior to this work. `specs/test-plan.md` §24 previously contained only a 3-bullet placeholder hint ('Page loads / FAQ items expand/collapse (accordion) if present / Content matches expected copy') — not a real plan; this plan supersedes it with live-verified structure and behavior below. Scenarios in this plan live under `tests/faq/` (peer of `tests/home/` and `tests/components-listing/`), NOT under `tests/components/`, since this is a top-level page, not a component.
    - expect: Not a test scenario - documents scope and prior-art boundaries so the Generator does not duplicate coverage or misplace spec files.
  2. PAGE OBJECT DECISION: A new `FaqPage.ts` IS warranted and should be created, extending `BasePage.ts`, following the `readonly Locator` fields + helper-method style established in `WindowPage.ts`/`SliderPage.ts`/`ComponentsPage.ts`. Rationale: this page has one repeated interaction pattern (open/close/read one of 9 structurally-identical question/answer items) that every single scenario below reuses, exactly the same justification already used for `ComponentsPage.ts` in `specs/components-listing.plan.md`. It should expose: `readonly introParagraph: Locator` (the intro paragraph, for a load-confirmation anchor in place of a missing page-specific heading — see Confirmed DOM structure below for why); `readonly items: Locator` (all 9 item wrapper `<div>`s, located via the CSS class combination `.bg-gray-100.text-gray-600.py-2`, confirmed live via `document.querySelectorAll` to resolve to exactly 9 elements and to match the button count 1:1 — the same class-selector-is-the-only-option situation already accepted for `ComponentsPage.ts`'s card locator and `WindowPage.ts`'s `.MuiBackdrop-root`, since no `data-testid` exists anywhere on this page); `gotoFaq()` (navigates to `/faq` and asserts `introParagraph` is visible with its exact text, used as the load-confirmation anchor in place of a heading assertion); `getItem(questionText: string): Locator` (returns the single item wrapper `Locator` whose button's text contains `questionText`, via `this.items.filter({ has: this.page.getByRole('button', { name: questionText }) })` — NOTE the button's full accessible name is the question text PLUS a trailing ' v' chevron glyph, e.g. 'Do I need to install anything to use the Playground? v', so callers must either use a non-`exact` role-name match or match on `hasText` semantics, not an exact-string comparison against the bare question); `toggleItem(questionText: string)` (clicks the item's button); `isExpanded(questionText: string): Promise<boolean>` (reads the button's `aria-expanded` attribute, returns `=== 'true'`); `getAnswerText(questionText: string): Promise<string>` (reads the item's answer `<div class="whitespace-pre-line">` child's `textContent`, located via DOM structure/child-selector relative to the item wrapper returned by `getItem()` — explicitly NOT via the button's `aria-controls` id, see the confirmed quirk below on why that id must never be hardcoded or relied upon); `getAllQuestionTexts(): Promise<string[]>` (reads all 9 question `<span class="font-bold">` texts live, in DOM order).
    - expect: Not a test scenario - states the Page Object contract the Generator must build FaqPage.ts against, matching the reasoning style of the Page Object Decision note in specs/components-listing.plan.md.

#### 1.2. Confirmed DOM structure and behavior (live-verified 2026-08-23, no data-testid attributes exist anywhere on this page)

**File:** `N/A - reference notes, not a spec file`

**Steps:**
  1. Structure: `<main>` contains a single intro `<p>` reading exactly 'Welcome to the Automation Playground FAQ! Here you’ll find answers to the most common questions about how the Playground works, who it’s for, and what you can do here.', followed by a container of 9 item `<div class="bg-gray-100 text-gray-600 py-2 md:mx-6 rounded-2xl px-6 font-normal">` elements (confirmed exactly 9 via `document.querySelectorAll`). Each item contains: a `<button aria-expanded="false|true" aria-controls="<react-useid>">` wrapping two `<span>`s (question text with class `font-bold`, and a chevron glyph 'v' whose class list includes `rotate-90` when collapsed and `rotate-0` when expanded), and a sibling `<div id="<same react-useid>" class="hidden"|"block">` wrapping a `<div class="whitespace-pre-line">` holding the answer text.
    - expect: Confirmed live, informational - this is the authoritative DOM shape the Page Object and every scenario below is written against.
  2. CONFIRMED QUIRK - the button's `aria-controls` value and the answer div's matching `id` are React `useId()`-generated strings (observed format e.g. `_R_1inpfdb_`) - framework-internal identifiers, not authored, stable content. No scenario or Page Object method in this plan reads or hardcodes this id string directly; the answer text and visibility must always be located via DOM sibling/child structure relative to the item wrapper (see FaqPage.ts's `getAnswerText()` above), never by constructing or asserting against a specific `aria-controls`/`id` value.
    - expect: Confirmed live, informational quirk documented so no scenario or Page Object implementation is written against this unstable id.
  3. CONFIRMED - NO page-specific heading exists on this page at all. The only `<h1>` anywhere on `/faq` is the shared header's 'Automation Playground' branding link heading (identical on every page in this app, e.g. Home and Components Listing); `document.querySelectorAll` confirmed 0 `<h2>`-`<h6>` elements anywhere in `<main>`. This is a direct, confirmed contrast with every component page in this repo (which all carry a page-specific level-1 heading matching the component name, e.g. 'Slider', 'Window') and is explicitly NOT an oversight to route around with a wrong assumption - the intro paragraph is used as this plan's load-confirmation anchor instead.
    - expect: Confirmed live, informational - directly falsifies the possibility of a heading-based load assertion; asserted explicitly as its own scenario below rather than silently worked around.
  4. CONFIRMED default/fresh-load state: all 9 items load collapsed - every button's `aria-expanded` attribute is `'false'` and every answer `<div>`'s class is exactly `'hidden'` (no `'block'`). Confirmed via a completely fresh `page.goto('/faq')` with zero prior interaction.
    - expect: Confirmed live, informational baseline used by every scenario below that starts from a fresh navigation.
  5. CONFIRMED toggle behavior (both directions, one item, live-verified): clicking a collapsed item's button sets its `aria-expanded` to `'true'`, its answer div's class to `'block'` (removing `'hidden'`), and its chevron span's class to include `rotate-0` (removing `rotate-90`). Clicking the same button again while expanded reverses all three exactly back to the collapsed state (`aria-expanded='false'`, class `'hidden'`, chevron class includes `rotate-90`) - confirmed as a genuine toggle, not a one-way expand.
    - expect: Confirmed live, informational - basis for Scenario 2 below.
  6. CONFIRMED - this is a MULTI-OPEN widget, NOT a single-open-at-a-time accordion. Opening item 1 ('Do I need to install anything...') then, without closing it, opening item 3 ('What is the Automation Playground?') left BOTH buttons simultaneously reading `aria-expanded='true'` at the same time, while the remaining 7 untouched items stayed at `'false'` - confirmed live directly contradicts the vague 'accordion (expand/collapse)' language in the prior placeholder hint in specs/test-plan.md §24, which could have implied single-open behavior; it does not.
    - expect: Confirmed live, informational - basis for Scenario 3 below, and directly corrects the ambiguity in the pre-existing placeholder hint.
  7. CONFIRMED - all 9 exact question texts (DOM order) and their exact answer texts (read via each panel's `textContent`, confirmed present in the DOM at all times regardless of expanded/collapsed state - the panel is never conditionally unmounted, only visually hidden via the `hidden` CSS utility class toggling to `block`): (1) 'Do I need to install anything to use the Playground?' -> 'No installation is required to explore the examples here.\nHowever, if you want to run tests or build your own automation suite, you’ll need to install the relevant framework on your local machine.' (2) 'How can I try the Automation Playground framework?' -> 'You can quickly get started by installing Playwright or any other testing framework of your choice.\nTo try Playwright, follow the official setup guide here: https://playwright.dev/docs/intro' (3) 'What is the Automation Playground?' -> 'The Automation Playground is a testing space for new automation engineers and anyone curious about frameworks. It’s a safe environment to explore and practice automation concepts without needing a full project setup.' (4) 'Can I run real automation tests here?' -> 'No.\nThis page is designed for learning and experimentation only. You can explore examples and understand how things work, but to actually execute tests, you’ll need to have your framework (like Cypress, Playwright, or Selenium) installed locally.' (5) 'Is the Automation Playground free to use?' -> 'Yes — the Automation Playground is completely free.\nYou can explore, learn, and experiment as much as you like. There are no hidden fees, subscriptions, or sign-ups required.' (6) 'Can I contribute or suggest new features?' -> 'Absolutely!\nWe’re open to ideas and community contributions. If you have an idea for a new feature or improvement, head to the “Got a feature in mind?” section and let us know.' (7) 'I found a bug — what should I do?' -> 'You can report issues or bugs through our feedback form from home page.\nPlease include as much detail as possible so we can fix it quickly.' (8) 'Will there be more content or pages in the future?' -> 'For now, the Playground is a single-page testing environment. We plan to expand based on community feedback and usage.' (9) 'Is my data saved anywhere?' -> 'No — any input or code you write here stays in your browser. We don’t store user data or test results.'
    - expect: Confirmed live, informational - authoritative exact copy for Scenario 4's content-integrity assertions.
  8. CONFIRMED - zero `<a>` link elements exist inside any of the 9 answer panels (checked all 9 via `panel.querySelectorAll('a')`, every result empty). Notably, item 2's answer text contains the literal string 'https://playwright.dev/docs/intro' rendered as PLAIN TEXT, not as a clickable hyperlink - confirmed via the same query returning 0 anchors for that specific panel. No mailto link, no internal `/components`-style link, and no external docs link of any kind exists anywhere in the FAQ content itself (item 7's answer references 'our feedback form from home page' only as plain text, not as a link).
    - expect: Confirmed live, informational - answers the task's explicit question about outbound/internal links: there are none, including one plain-text URL that is deliberately not a working hyperlink.
  9. CONFIRMED - no search/filter control of any kind exists on this page. The accessibility snapshot and a full DOM query for `input`, `textbox`, and `search`-role elements within `<main>` returned zero matches.
    - expect: Confirmed live, informational - answers the task's explicit question about search/filter controls: none exist.
  10. CONFIRMED purely static/client-side, no backend interaction. `browser_network_requests` was checked before and throughout an extended interaction pass (opening item 1, opening item 3 while item 1 stayed open, closing item 1, and a full page reload) and zero new XHR/fetch/document requests specific to any FAQ interaction were observed - only the same pre-existing Next.js RSC prefetch requests for unrelated nav links ('/', '/components') seen on every other page in this suite (same pattern already documented for the Slider and Upload File components). `browser_console_messages` with `level: error` and `all: true` returned 0 total messages throughout.
    - expect: Confirmed live, informational - this page requires no API-level test coverage; all scenarios below are pure client-side/DOM assertions.
  11. CONFIRMED no state persists across a page reload. After opening several items, a fresh `page.reload()`-equivalent (`page.goto('/faq')` again) reset all 9 items back to the exact fresh-load default (`aria-expanded='false'` on every button, class `'hidden'` on every panel) - confirming no localStorage/sessionStorage/URL state is involved, matching the pattern already documented across every other component plan in this repo (e.g. Slider).
    - expect: Confirmed live, informational - basis for the reload-persistence scenario below.

#### 1.3. Ambiguous/unverified areas flagged for testers

**File:** `N/A - reference notes, not a spec file`

**Steps:**
  1. Keyboard operability of the 9 toggle buttons (activating via Enter/Space while focused, and the natural Tab order across all 9) was not exercised during this exploration pass - only mouse clicks were used throughout.
    - expect: Flagged, not asserted as fact - out of scope for this plan's scenarios unless separately requested.
  2. Touch/mobile-specific interaction with the toggle buttons (and whether the chevron span, which carries a `hidden md:inline-flex` class making it invisible below the `md` breakpoint, affects tap-target behavior on narrow viewports) was not independently exercised.
    - expect: Flagged, not asserted as fact.
  3. Whether opening all 9 items simultaneously (rather than just 2, as confirmed) continues to behave correctly with no interference was not exhaustively verified - only a 2-item simultaneous-open case was confirmed live. Scenario 3 below tests the 2-item case that was actually confirmed; a full 9-item-simultaneous-open assertion would be extrapolating beyond what was directly observed and is intentionally not included as a 'confirmed' fact, though Scenario 4 does open all 9 (one at a time, verifying each independently) for content-integrity purposes.
    - expect: Flagged, not asserted as fact.

#### 1.4. 1. FAQ - Initial Load and Default State

**File:** `tests/faq/faq-load.spec.ts`

**Steps:**
  1. SCENARIO 1.1 (Priority: Critical) - Navigate to '/faq' on a fresh browser context via FaqPage.gotoFaq().
    - expect: The intro paragraph is visible and reads exactly 'Welcome to the Automation Playground FAQ! Here you’ll find answers to the most common questions about how the Playground works, who it’s for, and what you can do here.'
    - expect: Zero heading elements (h1 through h6) exist anywhere within <main> - confirming this page has no page-specific heading at all, a direct, confirmed contrast with every component page in this suite.
    - expect: The only h1 present anywhere on the page is the shared header's 'Automation Playground' branding link heading (present identically on every page in this app).
  2. SCENARIO 1.1 continued - Query FaqPage.items (the 9 item wrapper elements) and, for each, read its button's aria-expanded attribute and its answer panel's class attribute.
    - expect: Exactly 9 item wrapper elements are present (read live via the count of matched elements, not hardcoded as an assumed constant before being confirmed by the query itself within the test).
    - expect: Every one of the 9 buttons has aria-expanded exactly equal to the string 'false'.
    - expect: Every one of the 9 answer panels has a class attribute containing exactly 'hidden' and not containing 'block' - confirming all 9 items load fully collapsed by default with no exceptions.
  3. SCENARIO 1.1 continued - Read the 9 question texts live via FaqPage.getAllQuestionTexts(), in DOM order.
    - expect: The 9 questions read exactly, in this order: 'Do I need to install anything to use the Playground?', 'How can I try the Automation Playground framework?', 'What is the Automation Playground?', 'Can I run real automation tests here?', 'Is the Automation Playground free to use?', 'Can I contribute or suggest new features?', 'I found a bug — what should I do?', 'Will there be more content or pages in the future?', 'Is my data saved anywhere?'
  4. SCENARIO 1.2 (Priority: Medium) - On the same fresh load, query the entire page (not just <main>) for any input, textbox-role, or search-role element.
    - expect: Zero such elements are found anywhere on the page - confirming no search/filter control of any kind exists on this FAQ page, directly answering (in the negative) the open question raised by the prior placeholder plan hint about whether such a control might be present.

#### 1.5. 2. FAQ - Single Item Toggle (Expand and Collapse)

**File:** `tests/faq/faq-toggle.spec.ts`

**Steps:**
  1. SCENARIO 2.1 (Priority: Critical) - Navigate to '/faq' fresh. Using FaqPage.getItem(), locate the first item ('Do I need to install anything to use the Playground?') and click its button via FaqPage.toggleItem().
    - expect: The button's aria-expanded attribute becomes exactly 'true'.
    - expect: The item's answer panel becomes visible (Playwright's toBeVisible() passes on it) and its text reads exactly 'No installation is required to explore the examples here.\nHowever, if you want to run tests or build your own automation suite, you’ll need to install the relevant framework on your local machine.'
    - expect: The chevron span's class attribute now contains 'rotate-0' and no longer contains 'rotate-90'.
  2. SCENARIO 2.1 continued - Click the same item's button again (toggling it closed).
    - expect: The button's aria-expanded attribute returns to exactly 'false'.
    - expect: The item's answer panel is no longer visible (toBeHidden() passes on it, or its class attribute equals exactly 'hidden').
    - expect: The chevron span's class attribute now contains 'rotate-90' and no longer contains 'rotate-0' - confirming a full round-trip toggle back to the exact original collapsed state, matching all three attributes observed on initial load in Scenario 1.1.
  3. SCENARIO 2.2 (Priority: Medium) - On a fresh '/faq' load, verify all 8 OTHER items (every item except the one directly toggled) remain untouched throughout the open/close sequence in 2.1.
    - expect: Every one of the other 8 items' aria-expanded attribute remains exactly 'false' throughout both the open and close steps above - confirming toggling one item has zero effect on any other item's state.

#### 1.6. 3. FAQ - Multiple Items Can Be Expanded Simultaneously

**File:** `tests/faq/faq-toggle.spec.ts`

**Steps:**
  1. SCENARIO 3.1 (Priority: High) - Navigate to '/faq' fresh. Open item 1 ('Do I need to install anything to use the Playground?') via FaqPage.toggleItem(), then WITHOUT closing it, open item 3 ('What is the Automation Playground?') as well.
    - expect: Both item 1's and item 3's buttons simultaneously read aria-expanded exactly 'true' at the same time.
    - expect: Both item 1's and item 3's answer panels are simultaneously visible, each with their own exact text (item 1's as recorded in Scenario 2.1; item 3's reading exactly 'The Automation Playground is a testing space for new automation engineers and anyone curious about frameworks. It’s a safe environment to explore and practice automation concepts without needing a full project setup.').
    - expect: All remaining 7 items (items 2, 4, 5, 6, 7, 8, 9) still read aria-expanded exactly 'false' - confirming this widget allows multiple items open at once (a multi-open widget), directly correcting the ambiguity in the prior placeholder plan hint's use of the word 'accordion', which could have implied single-open-at-a-time behavior; it does not behave that way.

#### 1.7. 4. FAQ - Answer Content Integrity Across All 9 Items

**File:** `tests/faq/faq-content.spec.ts`

**Steps:**
  1. SCENARIO 4.1 (Priority: High) - Navigate to '/faq' fresh. Looping through all 9 items in DOM order (each iteration wrapped in its own test.step for per-item pass/fail reporting), open each item individually via FaqPage.toggleItem() and read its visible answer text via FaqPage.getAnswerText().
    - expect: For every one of the 9 items, the visible answer text (trimmed) exactly matches its corresponding expected string as recorded in the 'Confirmed DOM structure' notes above (all 9 Q&A pairs listed verbatim there) - every item's copy is verified individually, not just spot-checked.
  2. SCENARIO 4.1 continued - For each of the 9 opened answer panels, query for any descendant <a> (link) element.
    - expect: Zero <a> elements are found within any of the 9 answer panels - confirming no outbound/internal/mailto links exist anywhere in the FAQ content.
    - expect: Specifically for item 2's panel ('How can I try the Automation Playground framework?'), confirm its text contains the literal substring 'https://playwright.dev/docs/intro' as plain text, AND that getByRole('link') scoped to that panel resolves to 0 elements - confirming this URL is deliberately NOT a clickable hyperlink, a specific, confirmed quirk worth asserting explicitly rather than assuming a plain-looking URL is inert without checking.

#### 1.8. 5. FAQ - Purely Client-Side Behavior (No Network Requests on Interaction)

**File:** `tests/faq/faq-network.spec.ts`

**Steps:**
  1. SCENARIO 5.1 (Priority: Medium) - Navigate to '/faq'. Before any interaction, begin tracking requests via BasePage.trackApiRequests('/faq'). Then open items 1, 5, and 9, close item 1, and leave items 5 and 9 open.
    - expect: The tracked API-request array remains empty (length 0) throughout the entire interaction sequence - confirming toggling FAQ items triggers zero backend/API calls of any kind, consistent with this being a purely static, client-side-rendered widget with all content already present in the initial page load.

#### 1.9. 6. FAQ - No State Persists Across a Page Reload

**File:** `tests/faq/faq-persistence.spec.ts`

**Steps:**
  1. SCENARIO 6.1 (Priority: Medium) - Navigate to '/faq' fresh. Open items 2, 4, and 7 via FaqPage.toggleItem() (leaving them expanded).
    - expect: Before reload: items 2, 4, and 7 all read aria-expanded exactly 'true'; the remaining 6 items read 'false'.
  2. SCENARIO 6.1 continued - Reload the page (page.reload()).
    - expect: After reload, ALL 9 items - including items 2, 4, and 7 which were expanded immediately before the reload - read aria-expanded exactly 'false' again, and every answer panel's class attribute is exactly 'hidden' again, matching the exact fresh-load default confirmed in Scenario 1.1 - confirming no localStorage/sessionStorage/URL-based state persistence exists for this widget, matching the pattern already documented across every other component plan in this repo (e.g. Slider).
