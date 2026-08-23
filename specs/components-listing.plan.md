# Components Listing Page - Card Integrity & Filter Coverage

## Application Overview

The Components Listing Page (`/components`) presents a "Component Showcase" heading, two client-side filter controls (`Difficulty: All` / `Type: All`, each a button opening a menu/menuitem dropdown, not a native `<select>`), and a responsive grid of 16 component cards (each: an `<h2>` name, a decorative icon, a `<p>` description, and an `a[href^="components/<slug>"]` link). All filtering is purely client-side against the existing 16-card dataset — no network requests are made when filters change.

## Scope note

This plan EXTENDS the existing coverage of the Components Listing Page (`https://www.automationplayground.dev/components`), it does not replace it. `tests/components/components-listing/components-navigation.spec.ts` already contains one scenario — "should open every component card and return to the listing via Back" — which walks every card's live-read href, opens it, and returns via the 'BACK' button (a full round-trip navigation test across all cards). That scenario is NOT re-planned or duplicated here; it is referenced as prior art for the "read hrefs live off the page, don't hardcode them" convention this plan continues to follow. This plan adds exactly two new scenario areas: (1) card content/link integrity for every rendered card, and (2) the Difficulty/Type filter controls.

**Page Object decision:** No Page Object currently exists for this page (`tests/pages/` has no `ComponentsPage.ts`; `components-navigation.spec.ts` (now at `tests/components/components-listing/`) uses raw `page.locator('a[href^="components/"]')` calls directly). Given this page will now have 1 (existing, unconverted) + 3 new scenarios all reusing the same "read every card's data live" and "operate the filter controls" logic, **a new `ComponentsPage.ts` should be created**, extending `BasePage.ts`, following the `readonly Locator` fields + helper-method style established in `WindowPage.ts`/`UploadFilePage.ts`. The existing `components-navigation.spec.ts` test is NOT required to be migrated to it as part of this plan (out of scope — it works and is not being touched), but the new spec files this plan describes must use `ComponentsPage.ts`, not raw locators, per this project's convention.

## Confirmed DOM structure (live-verified, no data-testid attributes exist anywhere on this page's cards)

The grid container (`main`, class `grid grid-cols-1 gap-8 pb-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`) holds one direct-child `<div>` per component, each carrying the class combination `rounded-xl shadow-md` (confirmed live via `document.querySelectorAll('.rounded-xl.shadow-md')` to resolve to exactly the 16 card containers currently on the page, and to no other element anywhere on the page) — this is the only available stable selector for "one card" since no `data-testid` exists on any card-related element (container, heading, paragraph, or link), so `ComponentsPage.ts`'s `cards` locator is necessarily CSS-class-dependent, the same fragile-but-best-available situation already documented and accepted for `WindowPage.ts`'s `modalBackdrop` (`.MuiBackdrop-root`). Each card root's structure (confirmed via `outerHTML`): an inner `<div>` holding an `<h2>` (the component name, e.g. "Input") and a decorative `<svg>` icon, a sibling `<p>` (the description, e.g. "Interact with different types of input fields"), and a second inner `<div>` wrapping an `<a href="components/<slug>">` (e.g. `href="components/input"`, no leading slash — same convention `components-navigation.spec.ts` already relies on). **Confirmed, not a bug:** the link's own visible/accessible text frequently does NOT match the card's `<h2>` name — e.g. the "Input" card's link reads "Edit", "Button"'s reads "Click", "Radio"'s reads "Toggle", while several others do match ("Dropdown", "Multiselect", "Form", etc.). This plan's card-integrity scenario does not assert the link's visible text (not requested), only that `href` is present and correctly formed — the name/text mismatch is noted here as a confirmed quirk so it isn't mistaken for a bug if later work touches link text.

## Confirmed filter behavior (live-verified)

Two filter controls exist above the card grid: a "Difficulty: All" button and a "Type: All" button, each opening a `menu`/`menuitem` dropdown on click (not a native `<select>`). Difficulty options: All / Beginner / Advanced. Type options: All / Static / API. Both are **purely client-side** — `browser_network_requests` was checked before and throughout the entire filter-interaction pass (Difficulty and Type, in isolation and combined) and zero new XHR/fetch/document requests were observed beyond the same pre-existing Next.js prefetch traffic seen on every other page in this suite; filtering re-renders the existing 16-card dataset already present in the page, it does not fetch anything. No filter selection is reflected in the URL (confirmed: address bar stays exactly `/components` throughout); a fresh `page.goto('/components')` always resets both filters back to their "All"/"All" default (confirmed via two independent fresh loads).

**Difficulty filter — confirmed FUNCTIONAL:** selecting "Beginner" narrows the visible 16 cards down to exactly 8 (Input, Button, Dropdown, Alert, Radio, Drag, Wait, Simple Table); selecting "Advanced" narrows to the other, non-overlapping 8 (Multiselect, Advanced Table, Form, Calendar, Slider, Upload File, Drag and Drop, Window) — confirmed live that these two sets are disjoint and their union is exactly the full unfiltered 16-card set. **Important, confirmed constraint on how "correct" can be verified:** no card in the DOM carries any visible difficulty badge, attribute, or text of any kind (confirmed via full `outerHTML` inspection of a card) — there is nothing on an individual card to cross-check a filter's correctness against directly. This plan's scenario therefore verifies correctness via the only available invariant: the Beginner-set and Advanced-set (each captured live, never hardcoded) must be mutually exclusive and together exactly reconstitute the unfiltered "All" set — this is provable without hardcoding any specific card names or a fixed expected count.

**Type filter — confirmed FUNCTIONAL, not decorative, but currently a 100/0 partition:** selecting "Static" leaves the list unchanged at all 16 cards (confirmed identical href set to the unfiltered "All" state); selecting "API" narrows the list to exactly 0 cards, and a genuine empty-state UI renders in place of the grid: heading (level 3) "No components found" plus paragraph "Try adjusting your filters to see more results." (both confirmed live, exact text). This is confirmed to be real, working filter logic (not a no-op) — it correctly reflects that every component currently in this catalog is categorized as "Static" type and none are "API" type, and the empty-state path itself is a genuinely distinct, correctly-rendered UI state, not a silently-broken filter. This is NOT the "exists but does nothing" case the task asked to watch for (that would look like: selecting "API" still shows all 16, or shows a random/unchanged subset) — it is fully functional, just currently applied to a 16/0-split dataset.

**Filter combination — confirmed AND logic:** with Difficulty="Advanced" already selected (8 cards), additionally selecting Type="Static" left the same 8 cards visible unchanged (consistent with all 8 being Static-type) — confirming the two filters combine with AND semantics on the same underlying dataset rather than one overriding/resetting the other.

## Ambiguous/unverified areas flagged for testers
- Whether filter state persists across a page reload (`page.reload()`, as opposed to a fresh `page.goto()`) was not independently tested — only fresh navigations were used to confirm the default-reset behavior.
- Keyboard operability of the filter dropdowns (opening via Enter/Space, navigating options via arrow keys) was not exercised; only mouse clicks were used throughout this exploration.
- Because every current component is "Static" type, this plan's Type-filter scenario cannot demonstrate a *non-empty, non-full* narrowing the way the Difficulty scenario can — API always yields the empty state today. If the catalog ever gains an "API"-type component, this would become testable the same way Difficulty already is; noted here rather than assumed.
- Touch/mobile-specific interaction with the filter dropdowns was not exercised.

## Test Scenarios

### 1. Components Listing - Card Content Integrity

**Seed:** `tests/seed.spec.ts`

#### 1.1. All rendered component cards have a non-empty name, non-empty description, and a valid components/<slug> href, with no duplicate links — Priority: Critical

**File:** `tests/components/components-listing/components-card-integrity.spec.ts`

**Steps:**
  1. Navigate to '/components' on a fresh browser context (assume no prior filter selection — this is the default/only state this scenario exercises).
    - expect: Heading 'Component Showcase' (level 1) is visible.
    - expect: Both filter buttons read exactly 'Difficulty: All' and 'Type: All' (confirming the default/unfiltered baseline).
  2. Using the Page Object's card-reading helper, query all card root elements via the '.rounded-xl.shadow-md' selector (read live, not hardcoded to any fixed number).
    - expect: The number of matched card-root elements is greater than 0.
    - expect: This same count exactly equals both the count of 'main h2' elements and the count of 'a[href^="components/"]' elements on the page — confirming a 1:1:1 correspondence between card containers, headings, and links (no orphaned heading or link, no card missing one of the three).
  3. For each card root (looped, each iteration wrapped in its own test.step for per-card pass/fail reporting), read its own child '<h2>' text, child '<p>' text, and descendant 'a[href^="components/"]' href attribute.
    - expect: The card's name (h2 text, trimmed) is a non-empty string.
    - expect: The card's description (p text, trimmed) is a non-empty string.
    - expect: The card's href attribute is present and matches the pattern '^components/[A-Za-z0-9-]+$' (a valid, non-empty slug directly after the 'components/' prefix, no leading slash — consistent with the convention already relied on in tests/components-navigation.spec.ts).
  4. Collect the full list of hrefs read across all cards in the loop above.
    - expect: Every href in the collected list is unique — no two cards share the same href (verified by comparing the list's length to the length of a de-duplicated Set built from the same list; they must be equal).

### 2. Components Listing - Difficulty and Type Filters

**Seed:** `tests/seed.spec.ts`

#### 2.1. Selecting a Difficulty filter value narrows the visible cards to a correct, non-overlapping, exhaustive subset — Priority: High

**File:** `tests/components/components-listing/components-filters.spec.ts`

**Steps:**
  1. Navigate to '/components' on a fresh browser context. Read the full unfiltered set of card hrefs live (the 'All' baseline) before touching any filter.
    - expect: The unfiltered baseline set contains more than 0 hrefs (read live, not hardcoded to a fixed count).
  2. Open the 'Difficulty: All' dropdown and select 'Beginner'. Read the resulting visible set of card hrefs live.
    - expect: The filter button's own label updates to read exactly 'Difficulty: Beginner'.
    - expect: The resulting Beginner-filtered href set is a strict, non-empty, proper subset of the unfiltered baseline set captured in step 1 (its size is greater than 0 and strictly less than the baseline's size).
  3. Without reloading the page, open the 'Difficulty: Beginner' dropdown again and select 'Advanced' instead. Read the resulting visible set of card hrefs live.
    - expect: The filter button's label updates to read exactly 'Difficulty: Advanced'.
    - expect: The resulting Advanced-filtered href set is also a strict, non-empty, proper subset of the unfiltered baseline set.
    - expect: The Beginner-filtered set (from step 2) and this Advanced-filtered set share NO common hrefs (their intersection is empty) — this is how 'correct' filtering is verified here, since no individual card exposes any visible difficulty attribute/badge in the DOM to check against directly (confirmed absent during exploration).
    - expect: The union of the Beginner-filtered set and this Advanced-filtered set, treated as a combined set of unique hrefs, is exactly equal (same members, same count) to the unfiltered baseline set captured in step 1 — confirming the two difficulty values partition the full catalog completely, with nothing left uncategorized.

#### 2.2. The Type filter genuinely filters (not a no-op) — 'Static' preserves the full list while 'API' correctly narrows to zero results with a real empty-state message — Priority: High

**File:** `tests/components/components-listing/components-filters.spec.ts`

**Steps:**
  1. Navigate to '/components' on a fresh browser context (Difficulty and Type both at their default 'All'). Read the full unfiltered set of card hrefs live as the baseline.
    - expect: The unfiltered baseline set contains more than 0 hrefs.
  2. Open the 'Type: All' dropdown and select 'Static'. Read the resulting visible set of card hrefs live.
    - expect: The filter button's label updates to read exactly 'Type: Static'.
    - expect: The resulting Static-filtered href set is exactly equal (same members, same count — order-independent) to the unfiltered baseline set from step 1, confirming every cataloged component is presently categorized as 'Static' type and that selecting this value does not erroneously drop any card.
  3. Without reloading, open the 'Type: Static' dropdown again and select 'API' instead.
    - expect: The filter button's label updates to read exactly 'Type: API'.
    - expect: Zero card elements ('.rounded-xl.shadow-md') are present in the DOM.
    - expect: A heading (level 3) reading exactly 'No components found' is visible in place of the card grid.
    - expect: A paragraph reading exactly 'Try adjusting your filters to see more results.' is visible directly beneath that heading.
    - expect: This confirms the Type filter is genuinely functional (it correctly renders a distinct, real empty state for a value with zero matches) rather than being decorative/broken (which would instead look like the full unfiltered list remaining visible, or an unchanged/incorrect subset, under the 'API' selection).

#### 2.3. Difficulty and Type filters combine using AND logic, not OR — Priority: Medium

**File:** `tests/components/components-listing/components-filters.spec.ts`

**Steps:**
  1. Navigate to '/components' on a fresh browser context. Select Difficulty='Advanced' first, and read the resulting Advanced-only href set live (as established in the Difficulty scenario above, this is a strict non-empty proper subset of the full catalog).
    - expect: The Advanced-only href set is non-empty and strictly smaller than the full unfiltered catalog.
  2. Without resetting the Difficulty selection, additionally open the 'Type: All' dropdown and select 'Static'. Read the resulting visible href set live.
    - expect: Both filter buttons now read exactly 'Difficulty: Advanced' and 'Type: Static' simultaneously (confirming both selections are retained together, not one replacing the other).
    - expect: The resulting combined-filter href set is exactly equal (same members, same count) to the Advanced-only set captured in step 1 — confirming the two filters combine with AND semantics (every Advanced-difficulty component is also Static-type today, so adding the Static filter on top of Advanced narrows nothing further), not OR semantics (which would instead show the union of Advanced-difficulty and Static-type cards, i.e. the full 16-card catalog, since Static alone already matches everything).
