# Test Plan – Automation Playground (automationplayground.dev)

## 1. Objective

Validate core UI functionality, component behavior, and API interactions of automationplayground.dev using Playwright.

## 2. Scope

- Pages: Home (implemented below), Components, FAQ
- All 16 components under `/components/*`
- API calls triggered by components (data fetch/submit)

## 3. Test Environment

- Browser: Chromium, Firefox, WebKit (via Playwright projects)
- Base URL: `https://www.automationplayground.dev/`
- Framework: Playwright Test (TS)

## 4. Conventions

- Use `test.describe()` per suite, matching the section titles below
- One `test-file` per suite; one `test()` per scenario
- Seed reference: `tests/seed.spec.ts` (baseline patterns for new specs)
- Naming: `<area>-<topic>.spec.ts` under `tests/<area>/`

## 5. CI/CD

All specs run on push/PR via the existing GitHub Actions workflow (`.github/workflows/`).

---

## 6. Home Page — Implemented

**Status:** Implemented. 14 scenarios, 4 spec files, all passing across chromium/firefox/webkit.

**Application Overview:** Automation Playground is a demo/practice site for automation testing learners. The home page ("/") is a mostly static marketing/landing page consisting of: a header with branding link and primary navigation (Home, Components, F.A.Q — collapsed behind a hamburger menu on mobile viewports), a hero section with a heading, tagline, "Browse all components" CTA, and a "Scroll down" anchor link (#learn-more); an "Automation newbie?" section with a "Get started" CTA linking to /components; a "Got a feature in Mind?" informational section; a "Like the project?" section containing a mailto contact link and an external "Buy Me A Coffee" link (opens in a new tab); and a footer with copyright text.

**Seed:** `tests/seed.spec.ts`

### 6.1. Home Page - Load and Branding

**File:** `tests/home/home-load.spec.ts`

#### 6.1.1. Home page loads with correct title, heading, and branding

**Steps:**
  1. Navigate to the base URL '/'
    - expect: Page loads successfully (HTTP 200, no console errors)
    - expect: Page title is 'Automation playground'
    - expect: Header logo/heading link 'Automation Playground' is visible in the banner and links to '/'
  2. Verify the hero section is visible
    - expect: Hero heading 'The Library of Components for Automation Testing' (level 1) is visible
    - expect: Hero subtitle paragraph 'Sharpen Your Automation Skills Through Real Examples' is visible
    - expect: 'Browse all components' call-to-action link is visible
  3. Verify the footer is visible at the bottom of the page
    - expect: Footer contains copyright text '© 2026 Automation Playground.' and 'All rights reserved.'

#### 6.1.2. Header navigation links are present and correctly targeted

**Steps:**
  1. Navigate to '/' and locate the header navigation region
    - expect: Navigation contains exactly three links: 'Home', 'Components', 'F.A.Q'
  2. Inspect the href attributes of the 'Home', 'Components', and 'F.A.Q' links without clicking
    - expect: 'Home' link href resolves to '/'
    - expect: 'Components' link href resolves to '/components'
    - expect: 'F.A.Q' link href resolves to '/faq'

### 6.2. Home Page - Navigation Journeys

**File:** `tests/home/home-navigation.spec.ts`

#### 6.2.1. Clicking the logo/branding link navigates to (or stays on) the home page

**Steps:**
  1. Navigate to '/components' first (to ensure not already on home), then click the 'Automation Playground' branding link in the header
    - expect: Browser navigates to '/' (baseURL root)
    - expect: Hero heading 'The Library of Components for Automation Testing' is visible confirming home page loaded

#### 6.2.2. Clicking header 'Components' nav link navigates to Components page

**Steps:**
  1. Navigate to '/' and click the 'Components' link in the header navigation
    - expect: URL changes to '/components'
    - expect: Components page loads without error (basic landmark such as a heading or main content is visible)

#### 6.2.3. Clicking header 'F.A.Q' nav link navigates to FAQ page

**Steps:**
  1. Navigate to '/' and click the 'F.A.Q' link in the header navigation
    - expect: URL changes to '/faq'
    - expect: FAQ page loads without error (basic landmark such as a heading or main content is visible)

#### 6.2.4. Clicking header 'Home' nav link while already on home page keeps user on home page

**Steps:**
  1. Navigate to '/' and click the 'Home' link in the header navigation
    - expect: URL remains '/' (or resolves to baseURL root)
    - expect: Hero section content is still visible, page did not error or blank out

#### 6.2.5. 'Browse all components' hero CTA navigates to Components page

**Steps:**
  1. Navigate to '/' and click the 'Browse all components' link in the hero section
    - expect: URL changes to '/components'
    - expect: Destination page loads successfully with visible content

#### 6.2.6. 'Get started' CTA in 'Automation newbie?' section navigates to Components page

**Steps:**
  1. Navigate to '/' and scroll to the 'Automation newbie?' section, then click the 'Get started' link
    - expect: URL changes to '/components'
    - expect: Destination page loads successfully with visible content

#### 6.2.7. 'Scroll down' hero anchor scrolls to the 'learn-more' section on the same page

**Steps:**
  1. Navigate to '/' and click the 'Scroll down' link in the hero section
    - expect: URL updates to include the fragment '#learn-more'
    - expect: Page does not navigate away (stays on '/'), and the viewport scrolls so the section following the hero (e.g. 'Automation newbie?' heading) becomes visible/in view
    - expect: No full page reload occurs (in-page anchor navigation only)

### 6.3. Home Page - Content Sections and External Links

**File:** `tests/home/home-content.spec.ts`

#### 6.3.1. 'Automation newbie?' section displays expected copy and illustration

**Steps:**
  1. Navigate to '/' and scroll to the 'Automation newbie?' section
    - expect: Heading 'Automation newbie?' (level 2) is visible
    - expect: Descriptive paragraph mentioning 'Automation Playground is a testing space for new automation engineers...' is visible
    - expect: 'Automation Testing Illustration' image is visible and has a non-empty alt attribute
    - expect: 'Get started' link is visible within this section

#### 6.3.2. 'Got a feature in Mind?' section displays expected copy

**Steps:**
  1. Navigate to '/' and scroll to the 'Got a feature in Mind?' section
    - expect: Heading 'Got a feature in Mind?' (level 2) is visible
    - expect: Paragraph text 'Drop us a message — we're always open to improvements and experiments!' is visible
    - expect: Associated illustration image is visible

#### 6.3.3. 'Like the project?' section: mailto contact link has correct address

**Steps:**
  1. Navigate to '/' and scroll to the 'Like the project?' section, then inspect the contact link's href attribute (do not click, to avoid launching a mail client)
    - expect: Heading 'Like the project?' (level 2) is visible with paragraph 'Feedback or coffee — both help us build better, faster!'
    - expect: Contact link text is 'qa.automation.playground@gmail.com'
    - expect: Link href equals 'mailto:qa.automation.playground@gmail.com' exactly (correct address, no typos)

#### 6.3.4. 'Buy Me A Coffee' external link opens correct destination in a new tab

**Steps:**
  1. Navigate to '/', scroll to the 'Like the project?' section, and verify the 'Buy Me A Coffee' image link's href and target attributes before interacting
    - expect: Link href equals 'https://www.buymeacoffee.com/automationplayground'
    - expect: Link target attribute equals '_blank' (opens in a new tab)
  2. Click the 'Buy Me A Coffee' link and capture the newly opened page/tab
    - expect: A new browser tab/page opens
    - expect: The new tab's URL starts with 'https://www.buymeacoffee.com/automationplayground'
    - expect: The original home page tab remains open and unchanged at '/'

#### 6.3.5. No broken links: all home page links respond successfully

**Steps:**
  1. Navigate to '/' and collect all anchor tag hrefs on the page (internal: '/', '/components', '/faq', '#learn-more'; external: buymeacoffee.com; mailto is excluded from HTTP checks)
    - expect: Each internal link, when requested, returns a successful response (status < 400) and renders a non-error page
    - expect: The external 'buymeacoffee.com' link, when requested via API/HEAD request, returns a successful or redirect response (status < 400)
    - expect: No link href is empty, '#', or javascript:void(0)

### 6.4. Home Page - Responsive and Accessibility Checks

**File:** `tests/home/home-responsive.spec.ts`

#### 6.4.1. Home page renders correctly on mobile viewport

**Steps:**
  1. Set viewport to a mobile size (e.g. 375x812) and navigate to '/'
    - expect: Header, hero heading, and CTA buttons remain visible and are not overlapping or clipped
    - expect: Navigation is accessible via the mobile hamburger menu button; opening it reveals Home/Components/F.A.Q links
    - expect: Footer remains visible and readable at the bottom of the page

#### 6.4.2. Home page renders correctly on tablet and desktop viewports

**Steps:**
  1. Set viewport to tablet size (e.g. 768x1024) and navigate to '/'; then repeat with a desktop size (e.g. 1440x900)
    - expect: At each viewport size, the hero section, content sections, and footer are visible without horizontal scrollbars or overlapping elements
    - expect: All key CTAs ('Browse all components', 'Get started') remain clickable and correctly positioned

#### 6.4.3. Key images on the home page have accessible alt text

**Steps:**
  1. Navigate to '/' and inspect all `<img>` elements rendered on the page
    - expect: The 'Automation Testing Illustration' images have non-empty, descriptive alt attributes
    - expect: The 'Buy Me A Coffee' image has a non-empty alt attribute
    - expect: No image is missing an alt attribute entirely (decorative images use alt="" intentionally, content images have descriptive alt text)

#### 6.4.4. Home page heading hierarchy is valid

**Steps:**
  1. Navigate to '/' and inspect the document heading structure
    - expect: There is exactly one level-1 heading region for branding ('Automation Playground' in the banner) and one level-1 heading for the hero ('The Library of Components for Automation Testing'), or headings otherwise follow a logical, non-skipping hierarchy
    - expect: Section headings ('Automation newbie?', 'Got a feature in Mind?', 'Like the project?') are level-2 headings

---

## 7. Components Listing Page (`/components`) — Implemented

**Status:** Implemented. 5 scenarios across 3 spec files, all passing across chromium/firefox/webkit, all grouped under `tests/components/components-listing/`. `components-navigation.spec.ts` implements 1 comprehensive scenario that reads every component card's href directly off the live page (so it does not need updating as components are added), then walks into each of the 16+ component pages and back via the header "BACK" button, verifying the URL changes correctly on both legs of the round trip — each component's card-to-page navigation is wrapped in its own `test.step()` so the HTML report shows per-component pass/fail rather than one opaque pass/fail for the whole loop. `components-card-integrity.spec.ts` adds 1 scenario verifying every rendered card (read live, never hardcoded) has a non-empty name, non-empty description, and a validly-formed, unique `components/<slug>` href. `components-filters.spec.ts` adds 3 scenarios proving the Difficulty and Type filter controls are genuinely functional, not decorative.

- [x] Each card link navigates to the correct component page, and back — covered by `tests/components/components-listing/components-navigation.spec.ts`
- [x] All 16 component cards render with correct name + description + link — covered by `tests/components/components-listing/components-card-integrity.spec.ts`
- [x] Difficulty/Type filters (if functional) filter the list correctly — confirmed functional and covered by `tests/components/components-listing/components-filters.spec.ts`

**Seed:** `tests/seed.spec.ts`

Notable quirks confirmed during planning (see `specs/components-listing.plan.md` for full detail): no card-related element (container, heading, paragraph, or link) carries a `data-testid`, so the new `ComponentsPage.ts` Page Object's `cards` locator is necessarily CSS-class-dependent (`.rounded-xl.shadow-md`), the same fragile-but-best-available pattern already accepted for `WindowPage.ts`'s `modalBackdrop`; a card's own link text frequently does not match its `<h2>` name (e.g. the "Input" card's link reads "Edit") — not asserted on, confirmed quirk only; both filters are purely client-side (zero network requests on change) and reset to "All"/"All" on a fresh navigation; Difficulty (Beginner/Advanced) cleanly partitions all 16 cards into two disjoint, non-empty sets; Type currently only has "Static" populated (all 16 cards) with "API" correctly rendering a genuine, distinct empty state (0 cards, "No components found") rather than being a no-op — this is a real, working filter applied to a currently 16/0-split catalog, not a defect; and the two filters combine with AND semantics, confirmed via a combined Difficulty=Advanced + Type=Static selection.

This suite lives at `tests/components/components-listing/` and reuses `tests/pages/ComponentsPage.ts` (new).

Fully planned separately (see linked doc): Components Listing (`specs/components-listing.plan.md`).

## 8. Upload File Component (`/components/uploadFile`) — Implemented

**Status:** Fully implemented (`tests/components/upload-file/`, 16 scenarios across 8 spec files, all passing across chromium/firefox/webkit). The page presents a single click-to-browse file-upload widget: a native, visually-hidden `input[type=file]` (`accept=".txt"`, no `multiple`) triggered by a visible "Upload file" button; a successful `.txt` upload swaps the button + input entirely for a file icon, the filename, and a "Remove file" button. This is a fully separate, simpler component from the drag-and-drop file widget on `/components/dragAndDrop` (no `drop-zone`/`file` testids or `draggable` elements exist on this page at all). All interactions are purely client-side with no backing API calls — the on-page disclaimer "No file is sent to server, everything stays in your browser" was directly confirmed accurate via network monitoring, falsifying this table's own prior "likely backend interaction" guess.

Notable quirks confirmed during planning and test implementation (see `specs/upload-file.plan.md` for full detail): the real route is the camelCase `/components/uploadFile` — the hyphenated `/components/upload-file` 404s; **[QUIRK — design choice, not tracked in README]** the `.txt` extension check is case-sensitive and exact — an uppercase `UPPER-TEST.TXT` is rejected with the identical "Only .txt files are allowed." alert as a wholly wrong file type, so only a literal lowercase `.txt` suffix is ever accepted; no file-size limit of any kind exists (only the filename extension is validated — a 0-byte file uploads successfully); and rejecting an invalid file resets the underlying input's `files`/`value` to empty even though the visible UI never changes, allowing the same invalid file to be re-selected and re-rejected repeatably. A generator pass initially shipped `UploadFilePage.getUploadedFileName()` reading only `icon.nextSibling`, which returned `''` instead of the filename in all 3 browsers (12 failures) — live DOM inspection during healing found the filename actually sits behind an extra whitespace-only text node sibling; the healer fixed the helper to concatenate all direct text-node children of the icon's parent instead of assuming a single sibling. A cleanup pass afterward added the plan's originally-specified `expectDefaultState()`/`expectUploadedState()` Page Object helpers (not implemented during initial generation) and consolidated the same repeated 3-4-assertion state checks that had been duplicated inline across four spec files.

Fully planned separately (see linked doc): Upload File (`specs/upload-file.plan.md`).

## 9. Advanced Table Component (`/components/advanced-table`) — Implemented

**Status:** Implemented (`tests/components/advanced-table/`, 21 scenarios across 5 spec files). The page presents a paginated, searchable, client-side-only table of 64 university records (columns ID, Name, Country, Website) with a page-size selector (5/10/25) and First/Previous/Next/Last pagination controls.

Notable quirks confirmed during planning (see `specs/advanced-table.plan.md` for full detail): **[BUG]** changing the page size while on a page number that doesn't exist at the new size does not clamp the page number, producing an invalid state (e.g. page indicator "7 / 3" with a nonsensical "Showing 151 to 64 of 64 entries" summary and zero rendered rows) until "First" is clicked to recover — this is tracked in README's known-findings list; an empty search result's Next/Previous button enabled/disabled state is also inconsistent immediately after the first click on that empty state; and whitespace-only search input is treated as an active filter in the results summary text even though it matches all 64 records identically to no filter at all (cosmetic messaging quirk only).

Fully planned separately (see linked doc): Advanced Table (`specs/advanced-table.plan.md`).

## 10. Button Component (`/components/button`) — Implemented

**Status:** Implemented (`tests/components/button/`, 12 scenarios across 5 spec files). The page presents six independent buttons: "Go Home" (same-tab navigation), three "invisible-result" informational buttons (Find Location, Find Color, Find Height & Width — verified by reading the button's own properties rather than any displayed feedback), a disabled button, and a "Click and Hold" timer button. All interactions are purely client-side with no backing API calls.

Notable quirks confirmed during planning (see `specs/button.plan.md` for full detail): **[GAP — accessibility]** the Click and Hold button's hold-tracking is implemented purely via mouse events (`mousedown`/`mouseup`/`mouseleave`) with no keyboard equivalent — holding Enter down produces no "Holding..." state and no result text at all; and moving the mouse off the button while still pressed ends the hold immediately via `mouseleave` (using the elapsed time at that moment), rather than continuing to track until the eventual real `mouseup`, which may occur later and/or elsewhere on the page.

Fully planned separately (see linked doc): Button (`specs/button.plan.md`).

## 11. Drag Component (`/components/drag`) — Implemented

**Status:** Implemented (`tests/components/drag/`, 14 scenarios across 5 spec files). The page presents a single exercise: a 64x64px draggable box confined to a 384x320px dashed-border container, positioned via a CSS `transform: translate(Xpx, Ypx)` on its inline style, with independent boundary clamping confirmed exactly at all four corners. All interactions are purely client-side with no backing API calls.

Notable quirks confirmed during planning (see `specs/drag.plan.md` for full detail): **[GAP — accessibility]** the draggable box has no keyboard equivalent to the mouse-drag interaction — it cannot be given programmatic focus, has no `tabindex`, and arrow keys produce no movement at all; and neither the container nor the draggable box carries any `data-testid` (the page's only testid belongs to an unrelated label), so all locators in `DragPage.ts` rely on Tailwind CSS class selectors, a more brittle pattern than the testid-based locators used elsewhere in this suite.

Fully planned separately (see linked doc): Drag (`specs/drag.plan.md`).

## 12. Dropdown Component (`/components/dropdown`) — Implemented

**Status:** Implemented (`tests/components/dropdown/`, 23 scenarios across 8 spec files). The page presents four independent native `<select>` exercises: a single-select fruit dropdown (selected by visible label), a multi-select superhero dropdown (10 options), a single-select programming-language dropdown (selected by an underlying value distinct from its visible label), and a single-select country dropdown (value equals label). All interactions are purely client-side with no backing API calls.

Notable quirks confirmed during planning (see `specs/dropdown.plan.md` for full detail): **[QUIRK, tracked in README's known-findings list]** once a real option is selected in the fruit single-select, that specific `<option>` element gains a `hidden` HTML attribute it did not have before selection — a real mouse user who reopens the native dropdown afterward cannot see or re-click that same already-selected option in the rendered list (the value remains correctly selected, and Playwright's `selectOption()` can still re-select it programmatically since it operates on the DOM value directly); and the multi-select's result text always lists selected heroes in the select's own DOM/option order, never the order they were selected in.

Fully planned separately (see linked doc): Dropdown (`specs/dropdown.plan.md`).

## 13. Form Component (`/components/form`) — Implemented

**Status:** Implemented (`tests/components/form/`, 15 scenarios across 4 spec files). The page presents a single native `<form>` with six fields (dropdown, name, email, message, radio group, checkbox) validated entirely via native HTML5 `required` constraint validation — no custom JS validation and no app-rendered inline error text exist anywhere on the page. Successful submission swaps the form for a client-side-only success panel with a "Retry" button that fully resets every field to its fresh-load default.

Notable quirks confirmed during planning (see `specs/form.plan.md` for full detail): **[GAP]** the Email field has no email-format validation whatsoever (its `type` is plain `text`, no `pattern` attribute), so an obviously-invalid string like "notanemail" is accepted as a fully valid submission; **[GAP]** whitespace-only input in any required text field (Name, Email, Message) satisfies the native `required` constraint and allows successful submission, since HTML5 `required` does not trim/check for whitespace-only content; and all captured native `validationMessage` strings were observed in a French-locale browser session, so scenarios assert on validity state and page state rather than hardcoding those exact strings.

Fully planned separately (see linked doc): Form (`specs/form.plan.md`).

## 14. Input Component (`/components/input`) — Implemented

**Status:** Implemented (`tests/components/input/`, 9 scenarios across 3 spec files). The page presents six independent, unrelated `<input type="text">` fields outside any `<form>`, each demonstrating a different input-handling behavior: an empty required field, two pre-filled editable fields, a pre-filled field meant to be cleared, a disabled field, and a readonly field.

Notable quirks confirmed during planning (see `specs/input.plan.md` for full detail): none of the six fields declares any format/length constraint (`maxlength`/`pattern`) beyond `required`, consistent with the same site-wide "native `required`-only" validation pattern documented on the Form component's Email field; whitespace-only input satisfies the `required` constraint on the empty field, the same native-browser edge case documented for Form; and the disabled field is confirmed excluded from keyboard tab order while the readonly field remains focusable but rejects value mutation via typing.

Fully planned separately (see linked doc): Input (`specs/input.plan.md`).

## 15. Alert Component (`/components/alert`) — Implemented

**Status:** Fully implemented (`tests/components/alert/`, 13 scenarios, all passing across chromium/firefox/webkit). The component presents four independent dialog-trigger buttons (native `alert()`, `confirm()`, `prompt()`, and a custom SweetAlert2 modal), all purely client-side with no backing API calls.

Fully planned separately (see linked doc): Alert (`specs/alert.plan.md`).

## 16. Multiselect Component (`/components/multiselect`) — Implemented

**Status:** Fully implemented (`tests/components/multiselect/`, 20 scenarios across 7 spec files, all passing across chromium/firefox/webkit). The page presents three independent instances of a searchable, chip-based multi-select widget (`multiselect-react-dropdown`): Form 1 (10 options, starts empty), Form 2 (3 options, starts empty — used to exercise the "all options selected" empty state), and Form 3 (10 options, starts with two pre-selected chips). All interactions are purely client-side with no backing API calls.

Notable quirks confirmed during planning (see `specs/multiselect.plan.md` for full detail): `Escape` does not close an open option list; the same "No Options Available" message covers two different triggers (all options selected vs. a search filter with zero matches); and `#search_input`/`#multiselectContainerReact` are non-unique HTML ids duplicated across all three widget instances (see README's known-findings list).

Fully planned separately (see linked doc): Multiselect (`specs/multiselect.plan.md`).

## 17. Radio Component (`/components/radio`) — Implemented

**Status:** Fully implemented (`tests/components/radio/`, 20 scenarios across 8 spec files, 56 passing + 1 correctly skipped across chromium/firefox/webkit — the skip is a genuine WebKit engine limitation, not a gap in coverage). The page presents seven independent exercises: two structurally-identical boolean radio groups, a deliberately-buggy "Find the bug" pair with mismatched `name` attributes, a pre-selected Foo/Bar group, a group with a disabled option, and two standalone checkboxes (one with a nested link). All interactions are purely client-side with no backing API calls.

Notable findings confirmed during planning (see `specs/radio.plan.md` for full detail): the "Find the bug" exercise's mismatched-`name` bug is still live and reproducible; `id="Yes"`/`id="No"` are duplicated document-wide across the two boolean radio groups (a genuine HTML defect, not just a testing trap); and WebKit does not move keyboard focus onto radio/checkbox inputs on click (matching real Safari's default behavior), which is why one ArrowDown-cycling test is skipped specifically on that browser.

Fully planned separately (see linked doc): Radio (`specs/radio.plan.md`).

## 18. Simple Table Component (`/components/simple-table`) — Implemented

**Status:** Fully implemented (`tests/components/simple-table/`, 20 scenarios across 7 spec files, all passing across chromium/firefox/webkit). The page presents three independent tables: a shopping table with a computed total, a task table with independent checkboxes, and a sortable salary table (four columns, descending-first on each column's initial click).

Notable quirks confirmed during planning (see `specs/simple-table.plan.md` for full detail): sorting a column never returns to an "unsorted" state once clicked — it toggles strictly between ascending/descending forever; and the Department column's tie-break order for its one duplicate value depends on whatever row order is currently on screen at the moment of the click, not a fixed original-dataset order — sorting the same column can produce opposite tie orders depending on prior sort history.

Fully planned separately (see linked doc): Simple Table (`specs/simple-table.plan.md`).

## 19. Wait Component (`/components/wait`) — Implemented

**Status:** Fully implemented (`tests/components/wait/`, 21 scenarios across 9 spec files, all passing across chromium/firefox/webkit). The page presents four independent asynchronous exercises, each driven by a randomized client-side delay (~2.1s-4.0s observed): a native `alert()` dialog, an element that appears, text that changes, and an element that appears near-instantly then disappears again after a further random delay.

Notable quirks confirmed during planning and test implementation (see `specs/wait.plan.md` for full detail): re-clicking any of the three multi-second-delay buttons while a previous click's delay is still pending schedules a fully independent second timer rather than cancelling/merging with the first (for the alert button this produces two separate sequential native dialogs a test must handle both of); and the displayed delay is rounded to one decimal digit, so two independent random delays can coincidentally render identical text — discovered via real test flakiness during implementation, this makes text-content comparison an unreliable way to prove "an independent second timer fired," which is why the relevant tests count DOM mutations directly or wait out a fixed generous timeout instead of polling for a content difference.

Fully planned separately (see linked doc): Wait (`specs/wait.plan.md`).

## 20. Calendar Component (`/components/calendar`) — Implemented

**Status:** Fully implemented (`tests/components/calendar/`, 35 scenarios across 10 spec files, all passing across chromium/firefox/webkit). The page presents three independent MUI X Date/Time Pickers exercises: a free-form Basic Date field (fully unconstrained), a Start/End Date range picker (floored at today, dynamically cross-field constrained), and a Select Time picker. All interactions are purely client-side with no backing API calls.

Notable quirks confirmed during planning and test implementation (see `specs/calendar.plan.md` for full detail): selecting a year in year-view immediately commits a new selected date rather than merely navigating; today's cell is marked "today" but is not pre-selected on a fresh popup; and MUI's Popper entrance (Grow) transition satisfies Playwright's `toBeVisible()` well before the popup is actually settled — clicking anything inside a freshly-opened dialog too early can silently miss, reproducible even under serial (`--workers=1`) execution, not merely parallel load. This is handled centrally via `CalendarPage.openDialog()`, used by every dialog-opening call site in the suite, rather than patched per-test.

Fully planned separately (see linked doc): Calendar (`specs/calendar.plan.md`).

## 21. Window Component (`/components/window`) — Implemented

**Status:** Fully implemented (`tests/components/window/`, 15 scenarios across 7 spec files, all passing across chromium/firefox/webkit). The page presents two independent exercises: "Open New Tab" (a real `target="_blank"` anchor producing genuine new browser tabs) and "Open Modal" (a same-page MUI Modal overlay — despite its name, never a native browser window/tab/popup). All interactions are purely client-side with no backing API calls; the new-tab action is a real page navigation to `/new-tab-page`, not an API call.

Notable quirks confirmed during planning and test implementation (see `specs/window.plan.md` for full detail): both trigger buttons share the identical `data-testid="button-button"`, located instead by accessible role+name; while the modal is open, its backdrop provably intercepts pointer-event hit-testing over the entire viewport (confirmed via `elementFromPoint`) — a real Playwright `.click()` on a background element obscured by the backdrop was confirmed to hang indefinitely rather than fail fast, so the suite uses a deterministic `elementFromPoint` check instead; MUI applies `aria-hidden="true"` to `<main>` for the modal's entire open duration, which makes Playwright's `getByRole()` locators for the two trigger buttons unresolvable unless constructed with `includeHidden: true` (`WindowPage.ts`'s locators account for this); and WebKit does not move focus onto the "Open Modal" button on a mouse click (matching real Safari's default behavior, the same precedented engine difference already documented for the Radio component), so the modal's close-time focus-restoration assertion is WebKit-aware rather than universally strict.

Fully planned separately (see linked doc): Window (`specs/window.plan.md`).

## 22. Slider Component (`/components/slider`) — Implemented

**Status:** Fully implemented (`tests/components/slider/`, 25 scenarios across 7 spec files, all passing across chromium/firefox/webkit — the plan's console-errors and network-requests scenarios were both dropped from implementation, see `specs/slider.plan.md` §8). The page presents two independent exercises: a Basic slider (native `<input type="range">`, range 0-100, default 50) and a Min/Max range slider pair (two independent native range inputs, defaults 20/80) enforcing a strict min-less-than-max constraint. All interactions are purely client-side with no backing API calls.

Notable quirks confirmed during planning and test implementation (see `specs/slider.plan.md` for full detail): unlike this repo's MUI-based components, the Slider is confirmed NOT built on MUI (zero `.MuiSlider-root`/`.MuiSlider-thumb` matches anywhere on the page) — all three controls are plain native range inputs, each carrying a globally unique `data-testid`, so unlike Window/Calendar/Radio no duplicate-testid workaround is needed here; the range pair's strict min-less-than-max constraint is enforced differently depending on interaction type — incremental single-step keyboard changes (ArrowRight/ArrowLeft) are permitted to climb right up to the boundary, while large discrete jumps (Home/End/PageUp/PageDown) or track clicks that would violate the constraint are fully rejected with the value left completely unchanged rather than clamped to the nearest valid boundary; and because every slider here is a native, always-full-track-width input rather than a narrow MUI-style thumb element, a default unpositioned `.click()`/`.dragTo()` always lands at the horizontal center of the target element's bounding box (value 50 for a 0-100 range) — `SliderPage.ts` computes exact pixel offsets via `boundingBox()` to reach any other target value. A planned standalone network-request-count scenario (originally 8.2 in the plan) was dropped from implementation per explicit decision, since this component has zero backing API calls of any kind — see `specs/slider.plan.md` §8.2 for the historical record of what was originally planned there.

Fully planned separately (see linked doc): Slider (`specs/slider.plan.md`).

## 23. Drag and Drop Component (`/components/dragAndDrop`) — Implemented

**Status:** Fully implemented (`tests/components/drag-and-drop/`, 15 scenarios across 7 spec files, all passing across chromium/firefox/webkit). The page presents two independent widgets built on the browser's native HTML5 drag-and-drop API (`draggable="true"` + `dragstart`/`dragover`/`drop`), explicitly distinct from the mouse-transform dragging used by the separate `/components/drag` component: (1) a 2-column Kanban task board ("To Do"/"Finished") holding 4 task cards, and (2) a single file-icon-to-drop-zone widget with an Uploading/Reset lifecycle. All interactions are purely client-side with no backing API calls.

Notable quirks confirmed during planning and test implementation (see `specs/drag-and-drop.plan.md` for full detail): Finished-column drops auto-sort alphabetically while To Do-column drops merely append at the end (asymmetric, not a bug); a confirmed cross-widget defect-candidate where dropping an unrelated Kanban task card onto the file widget's `drop-zone` triggers its full "Uploading..." state AND removes the unrelated `file` item from the DOM, corrected/widened from the plan's original scope during test implementation — the "uploaded" state is a single shared flag not scoped to the dragged item's identity; the task-board instruction label carries a live, verbatim "alphabeticall" (double-L) typo, asserted as-is rather than corrected; draggable task cards are not keyboard-focusable with no keyboard alternative (same accessibility-gap class as `/components/drag`); and `locator.dragTo()` proved unreliable for same-widget task-to-column drags on firefox/webkit (confirmed via instrumented event listeners to silently drop the gesture with no `drop` event ever firing once a column's layout shifted across sequential drags within a test) — `DragAndDropPage.ts`'s shared `drag()` helper was rebuilt on Playwright's documented "Dragging manually" pattern (manually dispatched `dragstart`/`dragenter`/`dragover`/`drop`/`dragend` DragEvents through a shared `DataTransfer`) to fix this, used by every drag call site in the suite rather than patched per-test.

Fully planned separately (see linked doc): Drag and Drop (`specs/drag-and-drop.plan.md`).

## 24. FAQ Page (`/faq`) — Implemented

**Status:** Fully implemented (`tests/faq/`, 9 scenarios across 5 spec files, all passing across chromium/firefox/webkit). The page is a top-level page (a peer of the Home page and Components Listing page, not a component under `/components/*`), presenting one intro paragraph followed by 9 independently-toggleable question/answer items — a custom div/button-based expand-collapse widget, confirmed NOT a native `<details>/<summary>` and NOT MUI-based. All content is purely static/client-side with zero backing API calls of any kind (confirmed via `trackApiRequests` across an extended interaction pass).

Notable quirks confirmed during planning and test implementation (see `specs/faq.plan.md` for full detail): this is a genuinely **multi-open** widget, not a single-open-at-a-time accordion — the prior placeholder hint's ambiguous "accordion" wording is corrected by this plan; the page has **no page-specific heading at all** (the only `<h1>` present is the shared header's "Automation Playground" branding link, a direct contrast with every component page in this suite), so the intro paragraph is used as the load-confirmation anchor instead; no search/filter control exists anywhere on the page; no state (expanded/collapsed) persists across a page reload; and no `<a>` link elements exist anywhere in the FAQ content — notably item 2's answer contains the literal string `https://playwright.dev/docs/intro` rendered as plain text, deliberately not a clickable hyperlink. The button's `aria-controls` value and its answer panel's matching `id` are React `useId()`-generated, unstable strings, so `FaqPage.ts` locates answer panels via DOM structure rather than that id.

Fully planned separately (see linked doc): FAQ (`specs/faq.plan.md`).

## 25. API Testing — Not Yet Planned

No public API docs exist. Before writing API tests:
1. Open each component page with DevTools → Network tab open.
2. Interact with the component (submit form, load table, upload file).
3. Record actual XHR/fetch endpoints, methods, and payloads.
4. Alternatively, use Playwright's `page.on('request')` / `page.route()` in a throwaway script against each page to log calls automatically.
5. Update this doc's API section once endpoints are confirmed.

For each component with backend interaction (likely: Form, Advanced Table — Upload File was directly confirmed purely client-side during its own planning pass, see §8, and needs no API-level coverage):
- Verify request method, URL, headers, payload shape
- Verify response status code and body schema
- Verify UI reflects API response (success/error states)
- Negative cases: malformed payload, server error simulation via `page.route()` mocking

## 26. Out of Scope

- Payment/donation flow completion on Buy Me a Coffee (external, 3rd-party — home page only verifies the outbound link target, not the checkout flow)
- Email client behavior (mailto link — home page only verifies the href, does not send mail)
