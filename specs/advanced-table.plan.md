# Advanced Table Component Test Plan

## Application Overview

The Advanced Table component (https://www.automationplayground.dev/components/advanced-table) displays a paginated, searchable table of 64 university records with columns ID, Name, Country, and Website. All data is loaded once and all interactions (search filtering, page-size selection, and pagination) are performed entirely client-side — no XHR/fetch network calls were observed firing in response to search input, page-size change, or pagination clicks (only Next.js RSC prefetch requests for site navigation links were seen, unrelated to the table). Consequently this plan contains no API-level test coverage for the table itself; all scenarios are UI/DOM-state assertions.

Key elements (verified via `data-testid` attributes during exploration):
- Search input: `[data-testid="advanced-table-filter"]` — type="search", placeholder "Search universities (ID, Name, Country, Website)...", has a `required` HTML attribute (though it is not inside a native <form> being submitted, so this has no visible enforcement effect within this component).
- Table: standard HTML table with a `<thead>` row of 4 column headers (ID, Name, Country, Website) — headers are NOT clickable/sortable; clicking a header produces no visible reordering of rows (verified for both "ID" and "Name" headers).
- Results summary text: e.g. "Showing 1 to 10 of 64 entries" (unfiltered) or "Showing 1 to 8 of 8 entries (filtered from 64 total entries)" (filtered).
- Page-size selector: `[data-testid="items-per-page-selector"]`, a native <select> labeled "Show:" with options 5, 10, 25. Default/initial selected value on fresh page load is confirmed to be **10**.
- Pagination controls: `[data-testid="pagination-first"]` ("First"), `[data-testid="pagination-previous"]` (labeled "Previous" — inferred name, not directly tested by ref but present alongside First/Next/Last), `[data-testid="pagination-next"]` ("Next"), `[data-testid="pagination-last"]` ("Last"), plus a page indicator text "current / total" (e.g. "1 / 7").
- Website column cells contain external links that open in a new tab (`target="_blank"`, `rel="noopener noreferrer"`).

Confirmed default/fresh state (page reload, no interaction): search box empty, page size = 10, page 1 of 7, 64 total entries, First/Previous buttons disabled, Next/Last buttons enabled, rows sorted by ascending ID (1–10) matching original data order (this is the natural/insertion order — there is no active "sort" feature, so this is simply unsorted/default order, not a sort applied by the component).

Confirmed behaviors:
- Search is case-insensitive and matches substrings across ID, Name, Country, and Website columns simultaneously (e.g. "CANADA" matches country "Canada"; "India" matches 8 rows where "India" appears in the Country column).
- Search filtering is instantaneous (no visible debounce delay, no loading spinner) as characters are typed, and always resets the page indicator to page 1 of however many pages the filtered result set requires.
- A search with zero matches shows "Showing 0 to 0 of 0 entries (filtered from 64 total entries)" and an empty table body (header row only). Note an observed quirk: with 0 filtered pages the page indicator initially shows "1 / 0" with First/Previous disabled and Next/Last enabled; clicking Next in this state causes no error and no console errors, but the indicator changes to "0 / 0" and First/Previous become enabled while Next/Last become disabled — this is a UI quirk worth asserting on directly (does not throw, but the enabled/disabled state of navigation buttons is inconsistent immediately after that first Next click on an empty result set).
- Changing the page size preserves the current page NUMBER (not the currently-visible record range) where possible, recalculating the visible record range for the new page size; e.g. going from page 2 of 7 (page size 10, showing records 11-20) to page size 25 results in page 2 of 3 (showing records 26-50) — the page number "2" was preserved, not the item offset "11". **[BUG, see 3.6]** If the previously active page number does not exist for the new page size (e.g. page 7 of 7 at size 10, changed to size 25 which only has 3 pages), the page number is preserved verbatim without clamping, producing an invalid state: page indicator "7 / 3", a mathematically incorrect "Showing 151 to 64 of 64 entries" summary, and zero rendered rows. Clicking "First" from this broken state does recover correctly.
- "First"/"Previous"/"Next"/"Last" pagination buttons correctly enable/disable at the natural boundaries (page 1 -> First & Previous disabled; last page -> Next & Last disabled), and clicking Last on page size 25 (64 entries -> 3 pages) correctly jumps to page 3 showing records 51-64 (14 records, since 64 = 25+25+14).
- Column headers (ID, Name, Country, Website) are NOT interactive for sorting — clicking them produces no reordering of the rendered rows (confirmed for ID and Name headers).
- Website links have href equal to the visible link text/URL, target="_blank", and rel="noopener noreferrer" (safe external link pattern).
- Search input treats whitespace-only input as equivalent to no search term: typing a single space renders the default unfiltered 10-row page, with no "(filtered from...)" suffix in the summary text. (Not a bug — confirmed intentional/consistent behavior, documented for certainty rather than left ambiguous.)

Known bugs (see numbered scenarios below for full repro steps and dev recommendation):
1. **[BUG, scenario 3.6]** Page-size changes do not clamp the current page number to the new maximum page count, producing an invalid pagination state (e.g. "7 / 3" with a nonsensical "Showing 151 to 64" summary and zero rendered rows) whenever the user is on a page number that doesn't exist at the newly selected page size.

Ambiguous/unverified areas explicitly flagged for testers:
- Exact accessible name/testid of the "Previous" button was not independently clicked in isolation during exploration (First/Next/Last were); assume `data-testid="pagination-previous"` by pattern consistency with the other three buttons, but verify this selector when implementing.
- No maxlength was observed on the search input; very long search strings (e.g. 500+ characters) were not tested against actual browser/DOM limits.
- Keyboard-only navigation and screen-reader semantics (e.g. focus order between search box, table, page-size select, and pagination buttons) were not exercised.

## Test Scenarios

### 1. Advanced Table - Initial Load and Default State

**Seed:** `tests/seed.spec.ts`

#### 1.1. Advanced Table page loads with correct default state

**File:** `tests/components/advanced-table/advanced-table-load.spec.ts`

**Steps:**
  1. Navigate to '/components/advanced-table' on a fresh browser context
    - expect: Page loads successfully (HTTP 200, no console errors)
    - expect: Heading 'Advanced Table' (level 1) is visible
    - expect: The search input with placeholder 'Search universities (ID, Name, Country, Website)...' is visible and empty (value === '')
  2. Inspect the table header row
    - expect: Exactly 4 column headers are present with text, in order: 'ID', 'Name', 'Country', 'Website'
  3. Inspect the table body rows on initial load
    - expect: Exactly 10 data rows are rendered
    - expect: The first row's ID cell equals '1' and Name cell equals 'Engineering Institute of Technology'
    - expect: The last (10th) row's ID cell equals '10' and Name cell equals 'Bhagwan Parshuram Institute of Technology'
    - expect: Row IDs in the visible page are sequential ascending integers 1 through 10 (default/original data order, confirming no sort is pre-applied)
  4. Inspect the results summary text and pagination controls
    - expect: Results summary text equals exactly 'Showing 1 to 10 of 64 entries'
    - expect: The 'Show:' page-size select has value '10' selected (confirmed default)
    - expect: The page indicator text equals '1 / 7' (64 entries at 10/page = 7 pages)
    - expect: 'First' and 'Previous' pagination buttons are disabled (page 1 is the first page)
    - expect: 'Next' and 'Last' pagination buttons are enabled

#### 1.2. Website links in the table open the correct external URL in a new, safe tab

**File:** `tests/components/advanced-table/advanced-table-load.spec.ts`

**Steps:**
  1. On the freshly loaded page, inspect the first row's Website cell link (should be 'https://www.eit.edu.au/') without clicking
    - expect: The link's visible text equals its href, both equal to 'https://www.eit.edu.au/'
    - expect: The link's target attribute equals '_blank'
    - expect: The link's rel attribute equals 'noopener noreferrer' (safe cross-origin new-tab pattern, preventing window.opener access)
  2. Click the first row's Website link and capture the newly opened tab/page
    - expect: A new browser tab opens (original table page remains open, unnavigated, still on '/components/advanced-table')
    - expect: The new tab's URL starts with 'https://www.eit.edu.au'

### 2. Advanced Table - Search / Filtering

**Seed:** `tests/seed.spec.ts`

#### 2.1. Searching by a country name filters rows to only matching entries and updates the summary count

**File:** `tests/components/advanced-table/advanced-table-search.spec.ts`

**Steps:**
  1. Navigate to '/components/advanced-table' (fresh state) and type 'India' into the search input
    - expect: The table body renders exactly 8 rows
    - expect: Every rendered row's Country cell equals 'India' OR at least one of ID/Name/Country/Website contains the substring 'india' (case-insensitive) — for this specific dataset, verify precisely that all 8 rows have Country === 'India'
    - expect: Results summary text equals exactly 'Showing 1 to 8 of 8 entries (filtered from 64 total entries)'
    - expect: The page indicator resets to '1 / 1'
    - expect: 'First', 'Previous', 'Next', and 'Last' pagination buttons are all disabled (only one page of filtered results)

#### 2.2. Search is case-insensitive

**File:** `tests/components/advanced-table/advanced-table-search.spec.ts`

**Steps:**
  1. Navigate to '/components/advanced-table' and type the fully-uppercase string 'CANADA' into the search input
    - expect: The table body renders exactly 2 rows: ID 7 ('Toronto Baptist Seminary and Bible College') and ID 29 ('Cégep de Saint-Jérôme'), both with Country 'Canada'
    - expect: Results summary text equals exactly 'Showing 1 to 2 of 2 entries (filtered from 64 total entries)'
  2. Clear the search box and instead type the lowercase string 'canada'
    - expect: The same 2 rows (ID 7 and ID 29) are rendered, identical result set to the uppercase search, confirming the match is case-insensitive

#### 2.3. Search matches across ID, Name, Country, and Website fields (equivalence classes)

**File:** `tests/components/advanced-table/advanced-table-search.spec.ts`

**Steps:**
  1. Navigate to '/components/advanced-table'. Search for a value expected to match only in the Name column, e.g. 'Ashoka'
    - expect: Exactly 1 row is returned with Name 'Ashoka University' (ID 27)
    - expect: Results summary text equals 'Showing 1 to 1 of 1 entries (filtered from 64 total entries)'
  2. Clear and search for a value expected to match only in the Website column, e.g. 'karazin'
    - expect: Exactly 1 row is returned: ID 15, Name 'Kharkiv National University', Website containing 'karazin.ua'
  3. Clear and search for a value expected to match a specific ID, e.g. '27' (note: this will also match any Name/Country/Website substrings containing '27', so assert against the full known result set rather than assuming a single match)
    - expect: The result set includes the row with ID exactly 27 ('Ashoka University')
    - expect: Every row in the result set has '27' appearing as a substring in at least one of its ID, Name, Country, or Website field values (validating the multi-field OR-search behavior, not a false-positive filter)

#### 2.4. Search with no matching results shows an empty table and correct zero-state messaging

**File:** `tests/components/advanced-table/advanced-table-search.spec.ts`

**Steps:**
  1. Navigate to '/components/advanced-table' and type a string guaranteed not to exist in the dataset, e.g. 'zzzznotfound'
    - expect: The table body contains zero data rows (only the header row remains)
    - expect: Results summary text equals exactly 'Showing 0 to 0 of 0 entries (filtered from 64 total entries)'
    - expect: The page indicator shows '1 / 0'
    - expect: 'Next' and 'Last' pagination buttons are enabled while 'First' and 'Previous' are disabled (observed quirk on the empty-result initial state)
  2. With the zero-result search still active, click the 'Next' pagination button
    - expect: No JavaScript console errors are thrown as a result of the click
    - expect: The table body remains empty (zero data rows)
    - expect: The page indicator updates to '0 / 0'
    - expect: 'Next' and 'Last' become disabled while 'First' and 'Previous' become enabled (documenting the observed post-click button-state quirk on an empty filtered set)

#### 2.5. Clearing the search input restores the full unfiltered dataset

**File:** `tests/components/advanced-table/advanced-table-search.spec.ts`

**Steps:**
  1. Navigate to '/components/advanced-table', type 'India' into the search box (reducing to 8 filtered rows), then clear the search box back to an empty string
    - expect: The table body renders 10 rows again (back to default page size)
    - expect: Results summary text returns to exactly 'Showing 1 to 10 of 64 entries' (no 'filtered from' suffix)
    - expect: The page indicator returns to '1 / 7'

#### 2.6. Search input does not filter on whitespace-only input — behaves identically to an empty search

**File:** `tests/components/advanced-table/advanced-table-search.spec.ts`

**Steps:**
  1. Navigate to '/components/advanced-table' and type a single space character into the search input
    - expect: the table body renders 10 rows (default page size), identical to the unfiltered default state — first row ID === 1 ('Engineering Institute of Technology'), confirming the space character does not act as a filter term
    - expect: results summary text equals exactly 'Showing 1 to 10 of 64 entries' (no '(filtered from...)' suffix, confirming the component treats whitespace-only input as equivalent to no search term)
    - expect: the page indicator equals '1 / 7', matching the default unfiltered state exactly

### 3. Advanced Table - Page Size Selector

**Seed:** `tests/seed.spec.ts`

#### 3.1. Changing page size to 25 recalculates rows-per-page and total page count correctly

**File:** `tests/components/advanced-table/advanced-table-pagesize.spec.ts`

**Steps:**
  1. Navigate to '/components/advanced-table' (default page size 10) and select '25' from the 'Show:' dropdown
    - expect: The table body renders exactly 25 rows (IDs 1 through 25, in original order)
    - expect: Results summary text equals exactly 'Showing 1 to 25 of 64 entries'
    - expect: The page indicator equals '1 / 3' (ceil(64/25) = 3 pages)
    - expect: 'First' and 'Previous' remain disabled (still page 1); 'Next' and 'Last' are enabled

#### 3.2. Changing page size to 5 recalculates rows-per-page and total page count correctly

**File:** `tests/components/advanced-table/advanced-table-pagesize.spec.ts`

**Steps:**
  1. Navigate to '/components/advanced-table' (default page size 10) and select '5' from the 'Show:' dropdown
    - expect: The table body renders exactly 5 rows (IDs 1 through 5)
    - expect: Results summary text equals exactly 'Showing 1 to 5 of 64 entries'
    - expect: The page indicator equals '1 / 13' (ceil(64/5) = 13 pages)

#### 3.3. Changing page size while on a non-first page preserves the current page NUMBER, not the item offset

**File:** `tests/components/advanced-table/advanced-table-pagesize.spec.ts`

**Steps:**
  1. Navigate to '/components/advanced-table', click 'Next' once to move to page 2 of 7 (page size 10, showing records 11-20), then select '25' from the 'Show:' dropdown
    - expect: The page indicator equals '2 / 3' (page number 2 preserved, total pages recalculated for size 25)
    - expect: The table body shows records 26 through 50 (i.e., page 2 at a page size of 25 = records 26-50), NOT records 11-20 (confirming the component preserves the page NUMBER rather than the previously-visible item range)
    - expect: Results summary text equals exactly 'Showing 26 to 50 of 64 entries'

#### 3.4. Changing page size while on the last page of a larger page size clamps correctly on a smaller page size

**File:** `tests/components/advanced-table/advanced-table-pagesize.spec.ts`

**Steps:**
  1. Navigate to '/components/advanced-table', select page size '25', click 'Last' to reach page 3 of 3 (showing records 51-64), then select page size '5' from the dropdown
    - expect: The page indicator equals '3 / 13' (page number 3 preserved; 13 = ceil(64/5))
    - expect: The table body shows records 11 through 15 (page 3 at page size 5 = records 11-15)
    - expect: Results summary text equals exactly 'Showing 11 to 15 of 64 entries'

#### 3.5. Page size change combined with an active search re-paginates the filtered result set, not the full dataset

**File:** `tests/components/advanced-table/advanced-table-pagesize.spec.ts`

**Steps:**
  1. Navigate to '/components/advanced-table', type 'United States' in the search box to filter the dataset, note the filtered total shown in the results summary, then change page size from 10 to 5
    - expect: The results summary's 'of N total entries' and '(filtered from 64 total entries)' values remain based on the filtered set (N stays the same before and after the page-size change; only the 'Showing X to Y' range and page indicator's denominator change)
    - expect: The table body renders at most 5 rows after the page-size change (never more than the newly selected page size, even though the filtered set is likely larger than 5)

#### 3.6. [BUG] Changing page size while on a page number that doesn't exist at the new size produces an invalid state

**Priority:** Critical — this corrupts the pagination state and shows the user a nonsensical entry range; likely to occur naturally any time a user browses to the end of the list and then changes page size.

**File:** `tests/components/advanced-table/advanced-table-pagesize.spec.ts`

**Steps:**
  1. Navigate to '/components/advanced-table' (default page size 10), click 'Last' to reach page 7/7 (the final page, showing records 61-64), then select page size '25' from the 'Show:' dropdown (which only has 3 total pages at that size)
    - expect (documenting actual/current behavior — this is a defect, not intended design): the page indicator displays the invalid state '7 / 3' (current page number 7 exceeds the new max of 3 pages, and is not clamped)
    - expect: the results summary text displays 'Showing 151 to 64 of 64 entries' — the starting value 151 is mathematically incorrect for a 64-row, 25-per-page dataset (valid ranges only go up to 51-64) and does not correspond to any real page
    - expect: the table body renders zero data rows in this state (no rows exist for the invalid page reference)
  2. From this broken state, click 'First'
    - expect: the page indicator recovers to '1 / 3' and the table body renders 25 rows (IDs 1-25), i.e. 'First' correctly recovers from the broken state even though arriving at it was itself a bug

**Recommendation for dev team:** the page-size change handler should clamp the current page number to the new maximum page count (i.e. `min(currentPage, newMaxPage)`) rather than preserving an out-of-range page number verbatim. This scenario should be re-run after a fix to confirm the corrected behavior, at which point the expected values above should be updated to reflect the clamped page (page 3/3, showing 51 to 64 of 64 entries) instead of the current broken state.

### 4. Advanced Table - Pagination Controls

**Seed:** `tests/seed.spec.ts`

#### 4.1. 'Next' button advances one page at a time and updates rows/summary/indicator

**File:** `tests/components/advanced-table/advanced-table-pagination.spec.ts`

**Steps:**
  1. Navigate to '/components/advanced-table' (default state: page 1/7, size 10) and click 'Next'
    - expect: The page indicator updates to '2 / 7'
    - expect: The table body shows records 11 through 20 (first row ID === 11, last row ID === 20)
    - expect: Results summary text equals exactly 'Showing 11 to 20 of 64 entries'
    - expect: 'First' and 'Previous' buttons become enabled (no longer on page 1)

#### 4.2. 'Previous' button moves back one page and correctly disables at page 1

**File:** `tests/components/advanced-table/advanced-table-pagination.spec.ts`

**Steps:**
  1. Navigate to '/components/advanced-table', click 'Next' twice to reach page 3/7, then click 'Previous' once
    - expect: The page indicator updates to '2 / 7'
    - expect: The table body shows records 11 through 20
  2. Click 'Previous' once more to return to page 1
    - expect: The page indicator equals '1 / 7'
    - expect: The table body shows records 1 through 10
    - expect: 'First' and 'Previous' buttons are disabled again (back at the first page boundary)

#### 4.3. 'Last' button jumps directly to the final page and correctly shows a partial (non-full) final page

**File:** `tests/components/advanced-table/advanced-table-pagination.spec.ts`

**Steps:**
  1. Navigate to '/components/advanced-table', select page size '25' from the 'Show:' dropdown, then click 'Last'
    - expect: The page indicator equals '3 / 3'
    - expect: The table body renders exactly 14 rows (64 total - 25 - 25 = 14 remaining), with first row ID === 51 and last row ID === 64
    - expect: Results summary text equals exactly 'Showing 51 to 64 of 64 entries'
    - expect: 'Next' and 'Last' buttons are disabled (already on the last page); 'First' and 'Previous' are enabled

#### 4.4. 'First' button jumps directly back to page 1 from any later page

**File:** `tests/components/advanced-table/advanced-table-pagination.spec.ts`

**Steps:**
  1. Navigate to '/components/advanced-table', select page size '25', click 'Last' to reach page 3/3, then click 'First'
    - expect: The page indicator equals '1 / 3'
    - expect: The table body renders 25 rows with first row ID === 1 and last row ID === 25
    - expect: Results summary text equals exactly 'Showing 1 to 25 of 64 entries'
    - expect: 'First' and 'Previous' buttons are disabled again

#### 4.5. Pagination and search interact correctly: navigating to a later page then searching resets to page 1 of the filtered set

**File:** `tests/components/advanced-table/advanced-table-pagination.spec.ts`

**Steps:**
  1. Navigate to '/components/advanced-table', click 'Next' twice to reach page 3/7 (default page size 10), then type 'United States' into the search box
    - expect: The page indicator resets to page 1 of however many pages the 'United States' filtered result set produces at the current page size (i.e., current page number does NOT remain 3 — search always resets pagination to the first page of the new filtered set)
    - expect: The table's first visible row belongs to the filtered ('United States') result set, not to whatever was on page 3 of the unfiltered set

### 5. Advanced Table - Non-Interactive Elements and Content Integrity

**Seed:** `tests/seed.spec.ts`

#### 5.1. Column headers are static labels and do not trigger row sorting when clicked

**File:** `tests/components/advanced-table/advanced-table-headers.spec.ts`

**Steps:**
  1. Navigate to '/components/advanced-table' and capture the text content of all 10 ID cells in their default rendered order (expected: '1','2','3','4','5','6','7','8','9','10')
    - expect: The captured order matches exactly '1' through '10' ascending
  2. Click the 'ID' column header
    - expect: The rendered row order is unchanged (still '1' through '10' ascending) — no sort indicator (e.g. arrow icon or aria-sort attribute) appears on the header, confirming this is not an interactive sort control
  3. Click the 'Name' column header
    - expect: The rendered row order remains '1' through '10' by ID (unchanged), confirming Name header clicks also do not trigger sorting

#### 5.2. Total record count (64) and per-country distribution remain constant regardless of pagination/search cycling

**File:** `tests/components/advanced-table/advanced-table-headers.spec.ts`

**Steps:**
  1. Navigate to '/components/advanced-table'. Without searching, cycle through all 7 pages (default page size 10) using 'Next' repeatedly, collecting every row's ID cell value into a list
    - expect: The collected list contains exactly 64 unique ID values, forming the complete set 1 through 64 with no duplicates and no gaps
  2. Search for 'India' (8 matches) and separately search for 'United States' (largest expected subset), summing their filtered counts alongside a manual scan of the full unfiltered dataset for sanity
    - expect: The filtered count shown in the results summary for 'India' equals 8, matching the count independently observed during initial search exploration (regression-style check against a known-good baseline captured during planning)