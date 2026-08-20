# Simple Table Component Test Plan

## Application Overview

**Page Object:** `SimpleTablePage.ts` (new — does not yet exist in `tests/pages/`, unlike Button/Alert/Form/Input/AdvancedTable/Drag/Dropdown/Multiselect/Radio, all of which already have one). A related but structurally different `AdvancedTablePage.ts` already exists for the separate "Advanced Table" component (pagination, search, page-size selector) — none of its locators or helpers apply here, since Simple Table has no pagination/search/page-size controls at all; it is three small, fully static-data tables. `SimpleTablePage.ts` should expose: a `gotoSimpleTable()` navigation helper; `shoppingTable`/`taskTable`/`salaryTable` container locators via `getByTestId('shopping-table'|'task-table'|'salary-table')`; `shoppingRows` (`shoppingTable.locator('tbody tr')`) and `shoppingTotalCell` (`shoppingTable.locator('tfoot td').last()`) plus a `computeExpectedShoppingTotal()` helper that reads quantity×price from every row in the DOM and sums it live, so the total-assertion scenario never hardcodes the currently-observed value of 590; a `taskRow(name)` helper (`taskTable.getByRole('row', { name: new RegExp(name) })`) and `taskCheckbox(name)` (`taskRow(name).getByRole('checkbox')`) for the three named tasks ('Design Landing Page', 'Write Blog Post', 'Develop API'); `sortHeader(column)` (`getByTestId('sort-column-' + column)`) for the four sortable columns (`name`/`department`/`hireDate`/`salary`), `salaryRows` (`salaryTable.locator('tbody tr')`), a `readColumnValues(column)` helper that extracts and parses each column's raw cell text per column (salary stripped of its leading '$' and parsed as a number; the other three columns compared as raw strings, which for `hireDate`'s ISO `YYYY-MM-DD` format sorts identically whether treated as a string or a date), and an `expectAriaSort(column, value)` wrapper — centralizing the shared parsed-column-value pattern the legacy spec already used per-column, but through the Page Object rather than duplicated inline across spec files, per this project's convention.

This page (https://www.automationplayground.dev/components/simple-table) is a static page (heading "Simple Table", level 1) presenting THREE fully independent exercises, each preceded by a `<label data-testid="form-label">` instructional line, with no shared state and no `<form>`/submit action anywhere on the page. All interactions on this page are purely client-side: `browser_network_requests` was checked before and after extensive interaction with all three tables (sorting every column repeatedly, checking/unchecking every checkbox, reloading) and zero XHR/fetch requests specific to any table action were observed — only the same pre-existing Next.js RSC prefetch requests for unrelated nav links documented on every other component page in this suite. This plan therefore contains no API-level test coverage. No JavaScript console errors or warnings were observed during any exploration flow.

**Data-testid inventory (verified live via `document.querySelectorAll('[data-testid]')` — only 10 elements exist on the whole page):**
- `[data-testid="form-label"]` (×3) — exact text: "Add all the prices and check if the total is correct", "Ensure \"Write Blog Post\" is completed and mark \"Develop API\" as finished", "Ensure sorting works for all columns".
- `[data-testid="shopping-table"]` — the first `<table>`. Columns: 'Product Name', 'Quantity', 'Price (each)'. 4 static data rows in a `<tbody>`, plus a single `<tfoot><tr>` with a 'Total' label cell and one `colspan="2"` cell (spanning the Quantity+Price columns) holding the numeric total. Row data confirmed live via `outerHTML`, in this exact order: Notebook (qty 3, price 120), Pen (qty 10, price 10), Eraser (qty 5, price 5), Pencil (qty 7, price 15). Row totals: 360, 100, 25, 105 — sum 590, matching the displayed tfoot total exactly (590), confirming the total is a simple Σ(quantity×price), not e.g. a discounted or tax-adjusted figure.
- `[data-testid="task-table"]` — the second `<table>`. Columns: 'Task Name', 'Assigned To', 'Due Date', 'Completed'. Exactly 3 rows, in this DOM order: 'Design Landing Page' (Alice Johnson, 2025-01-20, checkbox unchecked), 'Write Blog Post' (Bob Smith, 2025-01-18, checkbox **checked by default**, confirmed reproducible on fresh navigation), 'Develop API' (Charlie Brown, 2025-01-22, checkbox unchecked). Each checkbox is a plain standalone `<input class="form-checkbox h-4 w-4 text-blue-600" type="checkbox">` with no `id`/`name`/`required` attribute and, critically, NOT wrapped in a `<label>` — confirmed live that dispatching a click on a row's name cell does NOT toggle that row's checkbox (unlike the Radio plan's T&C checkbox, which does toggle via its associated label).
- `[data-testid="salary-table"]` — the third `<table>`, structurally and semantically distinct from (and independently testid'd from) `shopping-table`/`task-table`, confirming the sortable table is not merely an alias of either. Columns: 'Name', 'Department', 'Hire Date', 'Salary'. A `[data-testid="table-header-row"]` marks its header `<tr>` (the only one of the three tables' header rows carrying its own testid). 4 static data rows, original DOM order confirmed live: Alice Johnson (Engineering, 2022-01-15, $80000), Bob Smith (Marketing, 2020-09-01, $60000), Charlie Brown (HR, 2021-03-12, $50000), Diana Prince (Engineering, 2019-06-25, $90000).
- `[data-testid="sort-column-name"]`, `[data-testid="sort-column-department"]`, `[data-testid="sort-column-hireDate"]`, `[data-testid="sort-column-salary"]` — the four `<th>` elements in `salary-table`, each `class="cursor-pointer ... hover:bg-gray-100"`, `tabindex="0"`, and carrying a live `aria-sort` attribute whose value is always explicitly one of the literal strings `"none"`, `"ascending"`, or `"descending"` (never an absent attribute) — confirmed `aria-sort="none"` on all four on fresh load, before any interaction. Each header also contains a generic bidirectional `lucide-arrow-up-down` SVG icon that was not confirmed to visually change between sort directions (see Ambiguous section) — `aria-sort` is the reliable, tested signal, not the icon.

**Confirmed behaviors (all independently re-verified live during this exploration pass, not assumed from the legacy spec):**
- Shopping table total: manually summing quantity×price for all 4 rows (360+100+25+105) equals exactly the displayed tfoot total of 590 — confirmed by direct arithmetic against the live DOM values, not merely visual comparison.
- Task table: 'Write Blog Post' is checked and the other two are unchecked on fresh load (confirmed reproducible across repeated navigations); checking any one of the three has zero effect on the other two (confirmed by checking 'Develop API' and re-reading 'Design Landing Page' and 'Write Blog Post', both unchanged).
- Sorting IS still "descending-first" today, confirmed independently and live on all four columns: the very first click on any column (whether it is the first sort interaction on the whole table, or the first click on a newly-selected column after a different column was already sorted) always produces DESCENDING order and sets that header's `aria-sort` to `"descending"`. A second click on the same column produces ASCENDING order (`aria-sort="ascending"`). Exact confirmed orderings: Name descending = Diana, Charlie, Bob, Alice / ascending = Alice, Bob, Charlie, Diana. Department descending (from fresh load) = Bob (Marketing), Charlie (HR), Alice (Engineering), Diana (Engineering) / ascending (immediately after, i.e. second click) = Alice, Diana, Charlie, Bob. Hire Date descending (most recent first) = Alice (2022-01-15), Charlie (2021-03-12), Bob (2020-09-01), Diana (2019-06-25) / ascending = Diana, Bob, Charlie, Alice. Salary descending = Diana ($90000), Alice ($80000), Bob ($60000), Charlie ($50000) / ascending = Charlie, Bob, Alice, Diana.
- **[Confirmed, not in legacy spec] Toggle-forever, never resets to unsorted:** a THIRD click on the same already-sorted column returns to descending again (confirmed live on the Name column: click1 desc → click2 asc → click3 produced the exact same row order and `aria-sort` as click1) — sorting toggles strictly between ascending/descending forever once a column has been clicked at least once; it never reverts that column back to `aria-sort="none"`/unsorted order on any subsequent click.
- **[Confirmed] Switching the active sort column resets the previously-active column back to `aria-sort="none"`:** only one column can show a non-`"none"` `aria-sort` value at any time (confirmed live: after Name was left sorted descending, clicking Department set Department to `"descending"` and Name back to `"none"`, with Hire Date and Salary remaining `"none"` throughout).
- **[Confirmed quirk, not documented by the legacy spec] Tie-break order for equal values depends on the CURRENT on-screen row order at the moment of the click, not a fixed canonical original-data order.** This is only observable on the 'Department' column, the only column with a duplicate value ('Engineering', shared by Alice Johnson and Diana Prince). Three independently confirmed live experiments: (a) sorting Department directly from a fresh page load (descending) placed the Engineering tie in original-data order — Alice before Diana; (b) immediately toggling that same column to ascending (second click, same session) preserved Alice-before-Diana, because that was already the row order on screen; (c) sorting Department (descending) immediately AFTER Name had already been sorted descending (which had reordered the rows to Diana, Charlie, Bob, Alice) produced the OPPOSITE tie order — Diana before Alice — for the exact same descending direction, because the underlying stable sort was applied to the row order that was on screen at the time of the click, not a fresh re-derivation from the original dataset. Any scenario asserting an exact row order for the Department column's tied rows must therefore explicitly control the preceding sort-history state rather than assume a fixed tie order.
- Keyboard: with a sortable header focused (all four carry `tabindex="0"`), pressing `Enter` triggers the same sort as a mouse click (confirmed live on the Salary header: focused via `.focus()`, `Enter` pressed, resulting in `aria-sort="descending"` and the correct descending row order). Pressing `Space` on a focused header does the same (confirmed independently on the Hire Date header, producing `aria-sort="descending"` and the correct descending order).
- No state persists across a page reload for ANY of the three tables: after checking 'Develop API' and sorting the salary table by Hire Date, a fresh reload reverted the task table to its exact documented default (only 'Write Blog Post' checked) and the salary table to its original unsorted DOM order with all four headers' `aria-sort` back to `"none"` — confirmed by direct DOM re-inspection after `page.goto()` following prior interaction, not merely assumed. The shopping table has no interactive state to begin with (purely static display).
- All three tables are fully independent: interacting with the task-table's checkboxes or sorting the salary-table produced no observable change in either of the other two tables throughout this entire exploration pass.
- The "Insight" section (heading level 2, concept list: 'Count rows or elements in a table', 'Extract all text content from elements', 'Verify checkbox states', 'Sort table columns', 'Validate calculated totals'; Github solution link to `https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/table/simpleTable.spec.ts`) is visible immediately with no expand/interaction required, matching every other component page's pattern.

**Known bugs / notable quirks:**
1. **[Confirmed quirk, most significant finding of this exploration]** Sort tie-break order for the Department column's duplicate 'Engineering' value is NOT fixed — it depends on whatever row order was on screen at the moment that column's header was clicked, because the underlying sort is applied to the current display order (which a prior sort on a different column, or a prior toggle on the same column, may have already changed), not freshly re-derived from a canonical original dataset each time. This is a genuine, reproducible, non-obvious behavior that any test asserting exact row order for tied values must account for.
2. **[Confirmed, not a bug but a real deviation from a common UI pattern]** Sorting on a given column never returns to an "unsorted"/`aria-sort="none"` state once that column has been clicked — it is a strict two-state (ascending/descending) toggle forever, unlike a common three-state "ascending → descending → unsorted" cycle. No scenario in this plan should assume a third click reaches "unsorted".
3. **[Not a bug]** Task-table checkboxes are standalone inputs with no associated `<label>`; clicking a row's other cells does not toggle its checkbox. Flagged so no scenario mistakenly assumes row-click-to-toggle behavior (a real pattern that DOES exist elsewhere in this suite, e.g. the Radio plan's T&C checkbox label).

**Ambiguous/unverified areas explicitly flagged for testers:**
- `ArrowUp`/`ArrowLeft`/`ArrowRight`/`Home`/`End` on a focused sortable header, and standard `Tab`-order traversal across all four headers, were not independently exercised — only `Enter` and `Space` were directly confirmed to trigger a sort via keyboard.
- The Department-column tie-break quirk was only confirmed with the single 2-way 'Engineering' tie present in this dataset; no 3-way tie exists in the data to further verify whether the same "sorts current display order" behavior generalizes beyond a simple pair.
- Whether the bidirectional `lucide-arrow-up-down` SVG icon inside each header visually changes appearance (e.g. rotates, swaps to distinct up/down variants) between ascending and descending states, versus remaining the same generic icon throughout, was not visually confirmed — only its DOM presence was checked. This plan's scenarios therefore assert on the `aria-sort` attribute, a reliable and directly testable signal, rather than on icon appearance.
- Touch/mobile-specific interaction (tapping checkboxes or sortable headers on an emulated touch viewport) was not independently exercised during this pass.
- The "BACK" button in the shared page header was not exercised, consistent with the treatment of this same shared control in the Button, Alert, Form, Input, Drag, Dropdown, Multiselect, and Radio plans.
- Whether `Array.prototype.sort`'s stability guarantee (and therefore the exact tie-break behavior documented above) holds identically across different browser engines was not cross-checked; this exploration used a single Chromium-based session. Modern engines guarantee stable sort per spec, so this is a low-risk assumption, but it was not independently re-verified outside Chromium.

## Test Scenarios

### 1. Simple Table - Initial Load and Default State

**Seed:** `tests/seed.spec.ts`

#### 1.1. Simple Table page loads with all three tables, labels, and Insight section correctly rendered

**File:** `tests/components/simple-table/simple-table-load.spec.ts`

**Steps:**
  1. Navigate to '/components/simple-table' on a fresh browser context
    - expect: Page loads successfully (HTTP 200, no console errors)
    - expect: Heading 'Simple Table' (level 1) is visible
  2. Inspect all three 'form-label' elements in DOM order
    - expect: The three labels read exactly, in order: 'Add all the prices and check if the total is correct', 'Ensure "Write Blog Post" is completed and mark "Develop API" as finished', 'Ensure sorting works for all columns'
  3. Inspect the 'Insight' section without performing any click/expand interaction
    - expect: Heading 'Insight' (level 2) is visible immediately with no interaction required
    - expect: The concept list contains exactly the items 'Count rows or elements in a table', 'Extract all text content from elements', 'Verify checkbox states', 'Sort table columns', 'Validate calculated totals'
    - expect: A 'Github solution' link is visible with href 'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/table/simpleTable.spec.ts'

#### 1.2. Shopping table renders exactly 4 static data rows with the confirmed live product/quantity/price values, in DOM order

**File:** `tests/components/simple-table/simple-table-load.spec.ts`

**Steps:**
  1. Navigate to '/components/simple-table'. Inspect '[data-testid="shopping-table"] tbody tr' without any interaction
    - expect: Exactly 4 rows are present, in this exact order with these exact cell values: ('Notebook', '3', '120'), ('Pen', '10', '10'), ('Eraser', '5', '5'), ('Pencil', '7', '15')
    - expect: The tfoot contains exactly 1 row with a 'Total' label cell and a single data cell with colspan='2' showing the text '590'

#### 1.3. Task table's checkbox default states match the confirmed live baseline: only 'Write Blog Post' checked

**File:** `tests/components/simple-table/simple-table-load.spec.ts`

**Steps:**
  1. Navigate to '/components/simple-table'. Without any interaction, read the '.checked' property of all 3 checkboxes in '[data-testid="task-table"]', matched by their row's task name
    - expect: 'Design Landing Page' row checkbox: checked=false
    - expect: 'Write Blog Post' row checkbox: checked=true
    - expect: 'Develop API' row checkbox: checked=false

#### 1.4. Salary table renders its 4 rows in original (unsorted) order with all four headers showing aria-sort='none' on fresh load

**File:** `tests/components/simple-table/simple-table-load.spec.ts`

**Steps:**
  1. Navigate to '/components/simple-table'. Without any interaction, read '[data-testid="salary-table"] tbody tr' cell values and the 'aria-sort' attribute of all four 'sort-column-*' headers
    - expect: Rows appear in exactly this order: ('Alice Johnson','Engineering','2022-01-15','$80000'), ('Bob Smith','Marketing','2020-09-01','$60000'), ('Charlie Brown','HR','2021-03-12','$50000'), ('Diana Prince','Engineering','2019-06-25','$90000')
    - expect: 'sort-column-name', 'sort-column-department', 'sort-column-hireDate', and 'sort-column-salary' all have aria-sort exactly equal to the literal string 'none'

### 2. Simple Table - Shopping Table Total Calculation

**Seed:** `tests/seed.spec.ts`

#### 2.1. The displayed total equals the sum of (quantity × price) computed live from every row, not a hardcoded value

**File:** `tests/components/simple-table/simple-table-shopping.spec.ts`

**Steps:**
  1. Navigate to '/components/simple-table'. For every row in '[data-testid="shopping-table"] tbody tr', read the Quantity and Price cells, parse them as numbers, and sum (quantity × price) across all rows to compute an expected total live from the DOM (do not hardcode 590 in the assertion)
    - expect: The computed expected total equals exactly the sum of each row's quantity×price (360 + 100 + 25 + 105)
    - expect: The tfoot's total cell's numeric text content equals the computed expected total exactly (both currently resolve to 590, confirmed live, but the assertion must compare against the freshly-computed sum, not a literal)

#### 2.2. Each individual row's quantity×price line value is independently correct, including the smallest-value and largest-value rows (boundary rows)

**File:** `tests/components/simple-table/simple-table-shopping.spec.ts`

**Steps:**
  1. Navigate to '/components/simple-table'. Read the Quantity and Price cells for the 'Eraser' row (the smallest line total: qty 5 × price 5) and the 'Notebook' row (the largest line total: qty 3 × price 120)
    - expect: 'Eraser' row: quantity cell = '5', price cell = '5', so quantity × price = 25
    - expect: 'Notebook' row: quantity cell = '3', price cell = '120', so quantity × price = 360, confirming the highest-value row (by unit price) and lowest-value row (by line total) both parse and compute correctly

#### 2.3. The tfoot total row has exactly one data cell spanning both the Quantity and Price columns via colspan, and there is exactly one total row

**File:** `tests/components/simple-table/simple-table-shopping.spec.ts`

**Steps:**
  1. Navigate to '/components/simple-table'. Inspect '[data-testid="shopping-table"] tfoot'
    - expect: Exactly 1 '<tr>' exists inside 'tfoot'
    - expect: That row contains exactly 2 '<td>' cells: the first with text 'Total', the second with the 'colspan' attribute equal to '2' holding the numeric total text

### 3. Simple Table - Task Table Checkbox Verification

**Seed:** `tests/seed.spec.ts`

#### 3.1. Checking 'Develop API' while 'Write Blog Post' stays checked leaves 'Design Landing Page' unaffected

**File:** `tests/components/simple-table/simple-table-tasks.spec.ts`

**Steps:**
  1. Navigate to '/components/simple-table'. Confirm baseline: 'Write Blog Post' checked, 'Design Landing Page' and 'Develop API' unchecked
    - expect: Baseline matches the documented defaults exactly
  2. Check the 'Develop API' row's checkbox
    - expect: 'Develop API' checkbox is now checked
    - expect: 'Design Landing Page' checkbox remains unchecked (unaffected)
    - expect: 'Write Blog Post' checkbox remains checked (unaffected)

#### 3.2. Unchecking the only pre-checked task ('Write Blog Post') and re-checking it round-trips cleanly with no effect on the other two rows

**File:** `tests/components/simple-table/simple-table-tasks.spec.ts`

**Steps:**
  1. Navigate to '/components/simple-table'. Uncheck the 'Write Blog Post' checkbox
    - expect: 'Write Blog Post' checkbox is now unchecked
    - expect: 'Design Landing Page' and 'Develop API' checkboxes remain unchecked (unaffected, no accidental state coupling)
  2. Check 'Write Blog Post' again
    - expect: 'Write Blog Post' checkbox is checked again, confirming a full round-trip back to its documented default
    - expect: 'Design Landing Page' and 'Develop API' remain unchecked throughout

#### 3.3. Clicking a task row's non-checkbox cell (e.g. the task name) does not toggle that row's checkbox

**File:** `tests/components/simple-table/simple-table-tasks.spec.ts`

**Steps:**
  1. Navigate to '/components/simple-table'. Confirm 'Design Landing Page' checkbox is unchecked, then click directly on the 'Design Landing Page' text cell (not the checkbox itself)
    - expect: 'Design Landing Page' checkbox remains unchecked after the cell click, confirming the checkbox has no associated <label> wrapping the row and clicking elsewhere in the row has no toggle side effect

#### 3.4. Boundary states: checking all three task checkboxes simultaneously, then unchecking all three, both work correctly with no stuck/coupled state

**File:** `tests/components/simple-table/simple-table-tasks.spec.ts`

**Steps:**
  1. Navigate to '/components/simple-table'. Check 'Design Landing Page' and 'Develop API' (in addition to the already-checked 'Write Blog Post')
    - expect: All three task checkboxes ('Design Landing Page', 'Write Blog Post', 'Develop API') are now checked simultaneously — the 3-checked boundary state
  2. Uncheck all three checkboxes
    - expect: All three task checkboxes are now unchecked simultaneously — the 0-checked boundary state, confirming both extremes of the 3-independent-checkbox state space work with no leftover/stuck checked state

### 4. Simple Table - Sortable Table Descending-First Behavior (per column)

**Seed:** `tests/seed.spec.ts`

#### 4.1. Name column: first click sorts descending (Z-to-A), second click sorts ascending (A-to-Z), aria-sort reflects each state

**File:** `tests/components/simple-table/simple-table-sorting.spec.ts`

**Steps:**
  1. Navigate to '/components/simple-table'. Click the 'sort-column-name' header once
    - expect: 'sort-column-name' has aria-sort='descending'
    - expect: Row order (by Name column) is exactly: 'Diana Prince', 'Charlie Brown', 'Bob Smith', 'Alice Johnson'
  2. Click the 'sort-column-name' header a second time
    - expect: 'sort-column-name' has aria-sort='ascending'
    - expect: Row order is exactly: 'Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince'

#### 4.2. Department column (from a fresh page load): first click sorts descending with the Engineering tie in original-data order (Alice before Diana), second click sorts ascending preserving that same tie order

**File:** `tests/components/simple-table/simple-table-sorting.spec.ts`

**Steps:**
  1. Navigate to '/components/simple-table' on a fresh context (no prior sort on any column). Click the 'sort-column-department' header once
    - expect: 'sort-column-department' has aria-sort='descending'
    - expect: Row order (by Department) is exactly: 'Bob Smith' (Marketing), 'Charlie Brown' (HR), 'Alice Johnson' (Engineering), 'Diana Prince' (Engineering) — confirming Marketing > HR > Engineering alphabetically descending, and that the Engineering tie resolves Alice before Diana when sorted directly from a fresh, never-before-sorted load
  2. Click the 'sort-column-department' header a second time
    - expect: 'sort-column-department' has aria-sort='ascending'
    - expect: Row order is exactly: 'Alice Johnson' (Engineering), 'Diana Prince' (Engineering), 'Charlie Brown' (HR), 'Bob Smith' (Marketing) — confirming the Engineering tie still resolves Alice before Diana on this immediate second click, since the row order on screen at the moment of this click was unchanged from the prior (first) click's tie order

#### 4.3. Hire Date column: first click sorts descending (most recent first), second click sorts ascending (oldest first)

**File:** `tests/components/simple-table/simple-table-sorting.spec.ts`

**Steps:**
  1. Navigate to '/components/simple-table'. Click the 'sort-column-hireDate' header once
    - expect: 'sort-column-hireDate' has aria-sort='descending'
    - expect: Row order (by Hire Date) is exactly: 'Alice Johnson' (2022-01-15), 'Charlie Brown' (2021-03-12), 'Bob Smith' (2020-09-01), 'Diana Prince' (2019-06-25)
  2. Click the 'sort-column-hireDate' header a second time
    - expect: 'sort-column-hireDate' has aria-sort='ascending'
    - expect: Row order is exactly: 'Diana Prince' (2019-06-25), 'Bob Smith' (2020-09-01), 'Charlie Brown' (2021-03-12), 'Alice Johnson' (2022-01-15)

#### 4.4. Salary column: first click sorts descending (highest salary first, parsed as a number after stripping the '$' prefix), second click sorts ascending (lowest first)

**File:** `tests/components/simple-table/simple-table-sorting.spec.ts`

**Steps:**
  1. Navigate to '/components/simple-table'. Click the 'sort-column-salary' header once
    - expect: 'sort-column-salary' has aria-sort='descending'
    - expect: Row order (by Salary, parsed as a number) is exactly: 'Diana Prince' ($90000), 'Alice Johnson' ($80000), 'Bob Smith' ($60000), 'Charlie Brown' ($50000)
  2. Click the 'sort-column-salary' header a second time
    - expect: 'sort-column-salary' has aria-sort='ascending'
    - expect: Row order is exactly: 'Charlie Brown' ($50000), 'Bob Smith' ($60000), 'Alice Johnson' ($80000), 'Diana Prince' ($90000), confirming numeric parsing (not lexicographic string comparison, though both happen to coincide for this specific 5-digit dataset)

### 5. Simple Table - Sortable Table Toggle-Forever, Column-Switch Reset, and Tie-Break Quirk

**Seed:** `tests/seed.spec.ts`

#### 5.1. A third click on the same column returns to descending again — sorting never reaches an 'unsorted' state again once a column has been clicked

**File:** `tests/components/simple-table/simple-table-sorting.spec.ts`

**Steps:**
  1. Navigate to '/components/simple-table'. Click 'sort-column-name' three times in a row, recording aria-sort and row order after each click
    - expect: After click 1: aria-sort='descending', order = Diana, Charlie, Bob, Alice
    - expect: After click 2: aria-sort='ascending', order = Alice, Bob, Charlie, Diana
    - expect: After click 3: aria-sort='descending' again (NOT 'none'), and the row order is identical to the click-1 result (Diana, Charlie, Bob, Alice) — confirming the toggle cycles strictly between descending/ascending forever and never reverts to an unsorted state

#### 5.2. Switching the sort to a different column resets the previously-active column's aria-sort back to 'none', and only one column shows a non-'none' aria-sort at a time

**File:** `tests/components/simple-table/simple-table-sorting.spec.ts`

**Steps:**
  1. Navigate to '/components/simple-table'. Click 'sort-column-name' (now descending), then read aria-sort on all four headers
    - expect: 'sort-column-name' = 'descending'; 'sort-column-department', 'sort-column-hireDate', 'sort-column-salary' all = 'none'
  2. Click 'sort-column-department', then read aria-sort on all four headers again
    - expect: 'sort-column-department' = 'descending'; 'sort-column-name' has reverted to 'none'; 'sort-column-hireDate' and 'sort-column-salary' remain 'none' — confirming at most one column ever shows a non-'none' aria-sort value simultaneously

#### 5.3. [QUIRK] Sorting Department immediately after Name was already sorted descending flips the Engineering tie order, because the sort operates on the currently-displayed row order, not a fixed original dataset order

**File:** `tests/components/simple-table/simple-table-sorting.spec.ts`

**Steps:**
  1. Navigate to '/components/simple-table'. Click 'sort-column-name' three times total (ending on descending: Diana, Charlie, Bob, Alice — confirmed by the toggle-forever behavior in the prior scenario), then click 'sort-column-department' once
    - expect: 'sort-column-department' has aria-sort='descending'
    - expect: Row order (by Department) is exactly: 'Bob Smith' (Marketing), 'Charlie Brown' (HR), 'Diana Prince' (Engineering), 'Alice Johnson' (Engineering) — note the Engineering tie now resolves DIANA BEFORE ALICE, the OPPOSITE order from the 'fresh load, no prior sort' scenario in the previous suite, because the underlying stable sort was applied to the row order that was on screen (Diana, Charlie, Bob, Alice) at the moment 'sort-column-department' was clicked, not a fresh re-derivation from the original dataset order

### 6. Simple Table - Sortable Table Keyboard Interaction

**Seed:** `tests/seed.spec.ts`

#### 6.1. Pressing Enter on a keyboard-focused sortable header triggers the same descending sort as a mouse click

**File:** `tests/components/simple-table/simple-table-sorting-keyboard.spec.ts`

**Steps:**
  1. Navigate to '/components/simple-table'. Focus the 'sort-column-salary' header (e.g. via repeated Tab or direct .focus()) without clicking it, then press 'Enter'
    - expect: 'sort-column-salary' has aria-sort='descending' after Enter is pressed
    - expect: Row order (by Salary) is exactly: 'Diana Prince' ($90000), 'Alice Johnson' ($80000), 'Bob Smith' ($60000), 'Charlie Brown' ($50000) — identical to the mouse-click result documented in the Descending-First Behavior suite, confirming Enter is a fully equivalent activation method

#### 6.2. Pressing Space on a keyboard-focused sortable header triggers the same descending sort as a mouse click

**File:** `tests/components/simple-table/simple-table-sorting-keyboard.spec.ts`

**Steps:**
  1. Navigate to '/components/simple-table'. Focus the 'sort-column-hireDate' header without clicking it, then press 'Space'
    - expect: 'sort-column-hireDate' has aria-sort='descending' after Space is pressed
    - expect: Row order (by Hire Date) is exactly: 'Alice Johnson' (2022-01-15), 'Charlie Brown' (2021-03-12), 'Bob Smith' (2020-09-01), 'Diana Prince' (2019-06-25) — identical to the mouse-click result documented in the Descending-First Behavior suite, confirming Space is a fully equivalent activation method

### 7. Simple Table - Cross-Table Independence and Network Behavior

**Seed:** `tests/seed.spec.ts`

#### 7.1. Sorting the salary table and checking a task checkbox produce zero observable effect on either of the other two tables

**File:** `tests/components/simple-table/simple-table-independence.spec.ts`

**Steps:**
  1. Navigate to '/components/simple-table'. Record the shopping table's tfoot total (590) and the task table's baseline checkbox states as a reference
    - expect: Baseline recorded: shopping total = 590; task table = only 'Write Blog Post' checked
  2. Sort the salary table by clicking 'sort-column-salary' twice (ending ascending), and separately check the 'Develop API' task checkbox
    - expect: 'sort-column-salary' has aria-sort='ascending' and the salary table's row order has changed from its original order
    - expect: 'Develop API' checkbox is now checked
  3. Re-read the shopping table's tfoot total and the full row contents of the shopping table
    - expect: The shopping table's total is still exactly 590 and its 4 rows are still in their original order with unchanged values — confirming zero cross-contamination from sorting the salary table or checking a task checkbox

#### 7.2. No API/network requests fire as a result of any table interaction on this page (purely client-side component)

**File:** `tests/components/simple-table/simple-table-independence.spec.ts`

**Steps:**
  1. Navigate to '/components/simple-table', begin recording network requests, then interact broadly across all three tables (sort every column of the salary table at least twice each, check and uncheck every task checkbox)
    - expect: No XHR/fetch network request specific to any table action is observed (only the pre-existing Next.js RSC prefetch requests for unrelated nav links, the same pattern documented on every other component page in this suite) — confirming this plan requires no API-level test coverage

### 8. Simple Table - Reload Persistence

**Seed:** `tests/seed.spec.ts`

#### 8.1. No sort state or checkbox state persists across a page reload; both the salary table and task table reset to their documented fresh-load defaults

**File:** `tests/components/simple-table/simple-table-persistence.spec.ts`

**Steps:**
  1. Navigate to '/components/simple-table'. Sort the salary table by 'sort-column-hireDate' (one click, descending), and change the task table away from its default by unchecking 'Write Blog Post' and checking 'Develop API'
    - expect: Before reload: 'sort-column-hireDate' has aria-sort='descending' with the corresponding sorted row order; 'Write Blog Post' is unchecked and 'Develop API' is checked
  2. Reload the page (page.reload())
    - expect: All four salary-table headers ('sort-column-name', 'sort-column-department', 'sort-column-hireDate', 'sort-column-salary') have aria-sort='none' again
    - expect: The salary table's rows are back in their original DOM order: Alice Johnson, Bob Smith, Charlie Brown, Diana Prince
    - expect: The task table has reverted to its documented default: only 'Write Blog Post' is checked; 'Design Landing Page' and 'Develop API' are both unchecked again
    - expect: The shopping table's total is still exactly 590 (it has no interactive state to begin with, included here to confirm reload doesn't corrupt static content either) — confirming no localStorage/sessionStorage/URL state is involved anywhere on this page
