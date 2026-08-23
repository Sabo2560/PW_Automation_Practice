# Drag and Drop Component Test Plan

## Application Overview

**Confirmed URL:** https://www.automationplayground.dev/components/dragAndDrop (camelCase path segment — NOT `/components/drag-and-drop`, which does not exist as a listed card; the real href was read directly off the "Drag and Drop" card on https://www.automationplayground.dev/components, whose link target is literally `components/dragAndDrop`). Page heading: "Drag and Drop" (level 1).

**Distinctness from `/components/drag` — explicitly confirmed live, NOT the same component under a different label:**
- `/components/drag` (see `specs/drag.plan.md`): ONE 64x64px div with NO `draggable` HTML attribute, positioned via a custom mouse-event handler that writes an inline `transform: translate(Xpx, Ypx)` style — i.e. a hand-rolled pointer-drag implementation confined to a single dashed container. Only 1 `data-testid` exists on the whole page (`form-label`), and it belongs to the instruction text, not the draggable element.
- `/components/dragAndDrop` (this plan): uses the browser's **native HTML5 drag-and-drop API** — every draggable element carries `draggable="true"` (confirmed via live attribute inspection: `task-1`..`task-4` and `file` all have it; `todo-column`/`finished-column`/`drop-zone` do not, correctly marking them as drop targets rather than draggables) and responds to native `dragstart`/`dragover`/`drop` events (Playwright's `locator.dragTo()` — the standard API for native HTML5 DnD — worked correctly against it in every scenario tested, whereas the `/components/drag` page requires raw `mouse.move/down/move/up` sequencing instead, confirmed in `DragPage.dragBy()`). The page contains **two independent widgets** with **multiple drop zones and multiple draggable items**: (1) a 2-column Kanban task board ("To Do" / "Finished") holding 4 distinct task cards that move between zones, and (2) a single file-icon-to-drop-zone widget with an Uploading/Reset lifecycle. It exposes **10 distinct `data-testid` elements** (vs. 1 on `/components/drag`). This is unambiguously a different DOM structure, different interaction model (native HTML5 DnD vs. custom pointer-transform dragging), and different heading/copy — confirmed via live side-by-side inspection of both pages during this exploration pass, not merely inferred from the listing-page label. No mismatch to escalate; proceeding with a full, distinct plan was correct.

**Page Object:** `DragAndDropPage.ts` (new — must NOT reuse or extend `DragPage.ts`, whose `dragBy()`/`getTransform()` helpers are built specifically around `/components/drag`'s mouse-position/CSS-transform interaction model and its single container+box DOM shape; neither concept applies here). `DragAndDropPage.ts` should extend `BasePage.ts` and expose: a `gotoDragAndDrop()` navigation helper (navigates to `/components/dragAndDrop` and waits for the `file` element to be visible, confirming client-side hydration completed); locators `todoColumn` / `finishedColumn` (`getByTestId('todo-column')` / `getByTestId('finished-column')`); a `task(testId: 'task-1'|'task-2'|'task-3'|'task-4')` locator helper (task testids are confirmed STABLE and tied to original card identity/text regardless of which column currently contains them — never reassigned based on position); `file` (`getByTestId('file')`), `dropZone` (`getByTestId('drop-zone')`), `resetFileButton` (`getByTestId('button-reset-file-button')` — only present in the DOM after a successful file drop); a `getColumnTaskTexts(column: Locator): Promise<string[]>` helper that reads the visible text of all direct task-card children of a column in DOM order (for order/sort assertions — this is the single most load-bearing helper in this plan, since nearly every task-board scenario hinges on exact order, not just membership); `dragTaskTo(taskTestId, targetColumn: Locator)` and `dragFileToDropZone()` / `dragFileTo(targetLocator)` helpers built on Playwright's native `locator.dragTo()` (confirmed to work correctly and reliably against this page's real HTML5 DnD implementation throughout exploration — no custom mouse-step simulation was needed, unlike `DragPage.dragBy()`); and an `isFilePresent(): Promise<boolean>` helper (`file` locator's `.count()` — the file element is fully removed from the DOM on successful drop, not merely hidden).

**Data-testid inventory (verified live via `page.querySelectorAll('[data-testid]')`, 10 total on fresh load):**
- `form-label` (×2 — the ONLY duplicate testid on the page; first instance precedes the task board reading exactly "Move task to Finished and verify alphabeticall sort" [note: "alphabeticall" — confirmed exact live spelling with a double-L typo, not a transcription error — assert it verbatim, do not "correct" it in test code], second instance precedes the file widget reading exactly "Drag file to target location")
- `todo-column` / `finished-column` — the two Kanban drop-zone containers, each with an `<h3>` heading ("To Do" / "Finished") followed by zero or more task cards
- `task-1` ("Review code"), `task-2` ("Deploy app"), `task-3` ("Fix bug") — all three start inside `todo-column` on fresh load; `task-4` ("Design web") starts inside `finished-column` alone. All four carry `draggable="true"` and `style="touch-action: none;"`
- `file` — a draggable SVG-icon div (`draggable="true"`, no visible text), sibling of `drop-zone`, present only until a successful drop
- `drop-zone` — text reads "Drop file here" by default, changes to "Uploading..." after a successful drop; this testid persists in the DOM across both states (only its text content changes)
- `button-reset-file-button` — appears only after a successful file drop, alongside the "Uploading..." text; clicking it restores the file widget's exact default state

**Network activity:** confirmed via `browser_network_requests` (filtered for non-static/API-shaped traffic) across the full exploration pass — task moves, file drop, Reset click, invalid drops — that ZERO XHR/fetch requests fire for any drag-and-drop interaction on this page; only the standard pre-existing Next.js RSC prefetch requests for nav links (the same pattern on every other component page) were observed. This plan contains no API-level test coverage; all state is client-side (most likely React component state, not persisted anywhere — see State Persistence findings below).

**Confirmed behaviors — Kanban task board:**
- Dragging a task card from `todo-column` into `finished-column` moves it there AND `finished-column` re-sorts ALL its task cards alphabetically by their visible text immediately after the drop. Confirmed incrementally and precisely: dropping "Fix bug" alone into a Finished column containing only "Design web" produced order `[Design web, Fix bug]`; subsequently dropping "Deploy app" produced `[Deploy app, Design web, Fix bug]`; a later full run dropping all 4 tasks into Finished produced the fully correct alphabetical order `[Deploy app, Design web, Fix bug, Review code]`. Sorting is exact, not approximate.
- **[Confirmed, significant, asymmetric behavior]** The alphabetical auto-sort applies ONLY when a task is dropped into `finished-column`. Dropping a task INTO `todo-column` (e.g. moving one back from Finished) does NOT sort — it is simply appended to the end of To Do's existing list in whatever order it was dropped. Confirmed directly: with To Do already holding `[Deploy app, Fix bug]`, dragging "Design web" from Finished into To Do produced `[Deploy app, Fix bug, Design web]` — NOT the alphabetically-correct `[Deploy app, Design web, Fix bug]`. Any scenario touching To Do's resulting order must assert append-at-end, not alphabetical order.
- Dragging a task onto its OWN current column (a self-drop / no-op move) is confirmed to be a safe no-op: the column's task list and order are completely unchanged afterward, no console error is produced.
- Emptying a column entirely (dragging all of its tasks out) leaves it rendering just its `<h3>` heading with no placeholder/empty-state text and no error — confirmed by moving all 3 original To Do tasks into Finished and observing `todoColumn` render with only its heading.
- No task's `data-testid` is ever reassigned based on its current column or visual position — each testid stays permanently tied to its original card text (e.g. `task-4` is always "Design web" regardless of which column currently contains it).

**Confirmed behaviors — file widget:**
- Dragging `file` onto `drop-zone` (a valid drop): the `file` element is fully REMOVED from the DOM (confirmed via testid-count check going from 1 to 0 — "disappears", not merely hidden/faded), `drop-zone`'s text changes from "Drop file here" to "Uploading...", and a NEW `button-reset-file-button` ("Reset") appears alongside it. No further automatic state transition (e.g. a completion message or progress indicator) was observed within at least 3 seconds of waiting after the drop — "Uploading..." behaves as a static, terminal state within the timeframe tested, not an animated/timed simulation that completes on its own. [Flagged as unverified beyond 3s — see ambiguous areas below.]
- Clicking `button-reset-file-button` restores the file widget to its EXACT default state: `file` element reappears in the DOM with its original testid, `drop-zone` text reverts to "Drop file here" exactly, and the Reset button itself is removed. Confirmed this Reset is SCOPED ONLY to the file widget — it has zero effect on the Kanban task board's state (verified by having non-default board state present at the moment Reset was clicked, then confirming the board was completely unaffected afterward).
- Dragging `file` onto an INVALID target outside `drop-zone` (e.g. onto one of the page's `form-label` elements) is a cancelled/no-op drop: `file` remains fully present in the DOM (same testid, still draggable), and `drop-zone`'s text remains unchanged at "Drop file here" — nothing about the file widget's state changes.

**[Confirmed bug-candidate] Cross-widget drop-target validation gap:** dragging a Kanban task card (e.g. `task-1`) onto the unrelated `drop-zone` (the FILE widget's target, not a task-board target at all) was confirmed to trigger `drop-zone`'s full "Uploading..."/Reset-button state exactly as if the `file` item itself had been dropped there — even though the actually-dropped item was a task card, not the file. The task itself was correctly unaffected (remained in its original column, not moved/duplicated), but the drop-zone's own `drop` handler visibly reacted to ANY native HTML5 drop event landing on it, regardless of which draggable item was actually being carried. This indicates the handler does not validate `dataTransfer` payload identity/type before transitioning to the "Uploading..." state. **[Correction, re-verified live during test implementation via both a real `dragTo()` drag and independently via manually dispatched `dragstart`/`dragenter`/`dragover`/`drop` DragEvents]** the bug is wider than originally scoped: `[data-testid="file"]` is ALSO removed from the DOM by this cross-widget drop, exactly as it would be on a genuine file drop, despite `file` never having been the dragged item. This indicates the widget's "uploaded" state is a single shared flag driving both `drop-zone` text/Reset-button AND `file` visibility — ANY accepted drop event on `drop-zone` flips it, regardless of the dragged item's identity, not merely the text/button state as originally documented. Documented as a functional defect-candidate for the dev team, not treated as expected behavior in this plan's scenarios.

**State persistence:** reloading the page (`page.goto()`/`page.reload()`) fully resets BOTH widgets back to their exact original default state every time — Kanban board back to `todo-column: [Review code, Deploy app, Fix bug]` / `finished-column: [Design web]`, and file widget back to `file` present / `drop-zone` text "Drop file here". Confirmed across multiple reloads after various amounts of prior interaction (full board rearrangement, a completed file drop, a Reset click). No `localStorage`/`sessionStorage`/URL-based state persistence was detected.

**Accessibility gap — confirmed, same class of finding as `/components/drag` and Button's Click-and-Hold gap (see `specs/drag.plan.md`, `specs/button.plan.md`):** `task-1` (representative of all draggable items on this page, which share identical markup/attributes) cannot be given programmatic focus — after calling `.focus()` on it directly, `document.activeElement` is confirmed NOT to be the task element, and its computed `tabIndex` property is `-1` (the default for a non-focusable div with no explicit `tabindex` attribute). No keyboard-only alternative to drag-and-drop exists for either the task board or the file widget. Flagged as a defect-candidate for the dev team.

**Console errors:** zero console errors or warnings were observed across the entire exploration pass (`browser_console_messages`, `level: 'error'`, `all: true` returned 0 total messages after all interactions: multiple task moves in both directions, self-drops, cross-widget drops, file drops, Reset clicks, invalid drops, reloads, and focus/tabindex checks).

**Known bugs / notable gaps — summary:**
1. **[Bug-candidate]** `drop-zone`'s drop handler does not validate the identity/type of the dropped item — dropping an unrelated Kanban task card onto it still triggers the full "Uploading..." state AND removes the unrelated `file` item from the DOM, as if `file` itself had been dropped (see Cross-widget finding above, corrected/widened from initial scope).
2. **[Asymmetric behavior, not necessarily a bug but must be tested precisely]** Alphabetical auto-sort applies only on drop into `finished-column`, never on drop into `todo-column` (append-only there).
3. **[Accessibility gap]** No keyboard-driven alternative exists for any drag interaction on this page (same class of gap as `/components/drag`).
4. **[Not a bug]** The task-board instruction label contains a live, verbatim typo: "alphabeticall" (double-L) — assert it exactly, do not silently correct it.

**Ambiguous/unverified areas explicitly flagged for testers:**
- Whether "Uploading..." would ever transition to a different/completed state given a much longer wait (only ~3 seconds of waiting was tested) was not exhaustively confirmed — treat it as a static state for test purposes unless a scenario specifically re-verifies a longer wait.
- Whether dragging a task card onto the file `drop-zone` (the confirmed cross-widget bug) behaves identically for ALL four tasks, or whether the file widget in "Uploading..."/Reset state behaves differently if a task is then dropped onto it a second time, was only tested once (with `task-1`, from the default state) and not exhaustively re-tested across all task/state combinations.
- Touch/mobile-specific drag gestures were not independently exercised on an emulated touch viewport (both `file` and the task cards carry `style="touch-action: none;"`, suggesting deliberate touch-drag support, but this was not directly confirmed live).
- Whether `Shift`-clicking, right-clicking, or other modifier-key drag variants produce different behavior was not exercised — only plain left-button native HTML5 drags were tested.
- The exact drag-and-drop library/implementation in use (native browser DnD API directly vs. a thin wrapper library) was not identified from source; all behaviors above were derived purely from black-box interaction and DOM/attribute inspection.
- The "BACK" button in the shared page header was not exercised, consistent with every other component plan in this repo.
- Viewport-size sensitivity (whether column/drop-zone dimensions or drag behavior change at narrow/mobile viewport widths) was not tested across multiple viewport sizes — all findings assume the default desktop viewport used throughout exploration.

## Test Scenarios

### 1. Drag and Drop - Initial Load and Default State

**Seed:** `tests/seed.spec.ts`

#### 1.1. Page loads with both widgets, labels, and Insight section correctly rendered in their exact default states — Priority: Critical

**File:** `tests/components/drag-and-drop/drag-and-drop-load.spec.ts`

**Steps:**
  1. Navigate to '/components/dragAndDrop' on a fresh browser context
    - expect: Page loads successfully (HTTP 200, no console errors)
    - expect: Heading 'Drag and Drop' (level 1) is visible
  2. Inspect both 'form-label' elements in DOM order
    - expect: First label reads exactly 'Move task to Finished and verify alphabeticall sort' (verbatim, including the double-L typo in 'alphabeticall')
    - expect: Second label reads exactly 'Drag file to target location'
  3. Inspect the To Do column ('todo-column') and Finished column ('finished-column')
    - expect: 'todo-column' contains exactly 3 task cards with text, in DOM order: 'Review code', 'Deploy app', 'Fix bug'
    - expect: 'finished-column' contains exactly 1 task card with text 'Design web'
  4. Inspect the file widget area
    - expect: '[data-testid="file"]' is visible and present exactly once
    - expect: '[data-testid="drop-zone"]' is visible with text exactly 'Drop file here'
    - expect: '[data-testid="button-reset-file-button"]' is NOT present in the DOM (0 elements)
  5. Inspect the 'Insight' section without performing any click/expand interaction
    - expect: Heading 'Insight' (level 2) is visible immediately with no interaction required
    - expect: The concept list contains exactly the items 'Move task between columns', 'Verify task status update', 'Drop file into target area', 'Check file disappears on drop', 'Reset restores initial state', in that order
    - expect: A 'Github solution' link is visible with href 'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/dragAndDrop/dragAndDrop.spec.ts'

#### 1.2. Enumerate all data-testid elements on fresh load and confirm the exact inventory of 10, including the duplicate 'form-label' pair — Priority: Medium

**File:** `tests/components/drag-and-drop/drag-and-drop-load.spec.ts`

**Steps:**
  1. Navigate to '/components/dragAndDrop' and enumerate all '[data-testid]' elements via page.locator('[data-testid]').all()
    - expect: Exactly 10 elements are returned
    - expect: The set of distinct testid VALUES is exactly: 'form-label' (appearing twice), 'todo-column', 'finished-column', 'task-1', 'task-2', 'task-3', 'task-4', 'file', 'drop-zone' — with 'button-reset-file-button' correctly ABSENT from a fresh load

### 2. Drag and Drop - Task Board: Moving Items Between Zones

**Seed:** `tests/seed.spec.ts`

#### 2.1. Dragging a single task from To Do into Finished moves it there and the Finished column re-sorts alphabetically — Priority: Critical

**File:** `tests/components/drag-and-drop/drag-and-drop-move.spec.ts`

**Steps:**
  1. Navigate to '/components/dragAndDrop'. Drag 'task-3' ('Fix bug') from 'todo-column' onto 'finished-column'
    - expect: 'todo-column' now contains exactly 2 task cards, in order: 'Review code', 'Deploy app' (task-3 is fully removed from To Do)
    - expect: 'finished-column' now contains exactly 2 task cards, in alphabetical order: 'Design web', 'Fix bug' (NOT the drop order — 'Design web' comes first alphabetically even though it was already there before the drop)

#### 2.2. Dragging a second task into an already-populated Finished column re-sorts all items alphabetically together — Priority: Critical

**File:** `tests/components/drag-and-drop/drag-and-drop-move.spec.ts`

**Steps:**
  1. Navigate to '/components/dragAndDrop'. Drag 'task-3' ('Fix bug') into 'finished-column', then drag 'task-2' ('Deploy app') into 'finished-column'
    - expect: After both drags, 'finished-column' contains exactly 3 task cards in exact alphabetical order: 'Deploy app', 'Design web', 'Fix bug'
    - expect: 'todo-column' contains exactly 1 remaining task card: 'Review code'

#### 2.3. Moving all four tasks into Finished produces the fully correct alphabetical order and empties To Do with no placeholder text or error — Priority: High

**File:** `tests/components/drag-and-drop/drag-and-drop-move.spec.ts`

**Steps:**
  1. Navigate to '/components/dragAndDrop'. Sequentially drag 'task-1', 'task-2', then 'task-3' from 'todo-column' into 'finished-column' (task-4 already starts there)
    - expect: 'finished-column' contains exactly 4 task cards in exact alphabetical order: 'Deploy app', 'Design web', 'Fix bug', 'Review code'
    - expect: 'todo-column' contains 0 task cards and renders with only its 'To Do' heading visible, no placeholder/empty-state text, and no console error is produced

#### 2.4. Dragging a task from Finished back into To Do appends it at the end WITHOUT alphabetical sorting (asymmetric behavior) — Priority: Critical

**File:** `tests/components/drag-and-drop/drag-and-drop-move.spec.ts`

**Steps:**
  1. Navigate to '/components/dragAndDrop'. Drag 'task-1' ('Review code') into 'finished-column', confirm To Do now holds ['Deploy app', 'Fix bug']. Then drag 'task-4' ('Design web') from 'finished-column' back into 'todo-column'
    - expect: 'todo-column' contains exactly 3 task cards in this exact order: 'Deploy app', 'Fix bug', 'Design web' — i.e. 'Design web' is appended at the END, NOT inserted alphabetically (which would instead read 'Deploy app', 'Design web', 'Fix bug')
    - expect: 'finished-column' contains exactly 1 remaining task card: 'Review code'

#### 2.5. Task data-testid identity remains stable and tied to original card content regardless of which column currently contains it — Priority: Medium

**File:** `tests/components/drag-and-drop/drag-and-drop-move.spec.ts`

**Steps:**
  1. Navigate to '/components/dragAndDrop'. Drag 'task-2' ('Deploy app') into 'finished-column'
    - expect: '[data-testid="task-2"]' still resolves to exactly 1 element, still reading text 'Deploy app', now located inside 'finished-column' rather than 'todo-column' — the testid was never reassigned or duplicated based on the element's new position

### 3. Drag and Drop - Task Board: Self-Drop and Cross-Widget Drop Bug

**Seed:** `tests/seed.spec.ts`

#### 3.1. Dragging a task onto its own current column is a safe no-op — order and membership are unchanged — Priority: Medium

**File:** `tests/components/drag-and-drop/drag-and-drop-invalid.spec.ts`

**Steps:**
  1. Navigate to '/components/dragAndDrop'. Capture 'todo-column's task text order (expected ['Review code', 'Deploy app', 'Fix bug']). Drag 'task-3' ('Fix bug') onto 'todo-column' (its own current column)
    - expect: 'todo-column's task text order after the self-drop is byte-for-byte identical to the order captured before it: ['Review code', 'Deploy app', 'Fix bug']
    - expect: No console error is produced by the self-drop

#### 3.2. [BUG-CANDIDATE] Dropping an unrelated Kanban task card onto the file widget's drop-zone incorrectly triggers its Uploading state — Priority: High

**File:** `tests/components/drag-and-drop/drag-and-drop-invalid.spec.ts`

**Steps:**
  1. Navigate to '/components/dragAndDrop'. Drag 'task-1' ('Review code') from 'todo-column' onto '[data-testid="drop-zone"]' (the file widget's target, unrelated to the task board)
    - expect: 'task-1' remains in 'todo-column' at its original position, unmoved (confirming the task itself was correctly unaffected by this cross-widget drop)
    - expect: '[data-testid="drop-zone"]' text changes to 'Uploading...' and '[data-testid="button-reset-file-button"]' appears, DESPITE no actual 'file' item having been dropped — documenting this as a confirmed defect-candidate: the drop-zone does not validate the identity of the dropped item before transitioning state
    - expect: '[data-testid="file"]' is ALSO removed from the DOM (count = 0), exactly as it would be on a genuine file drop, DESPITE the actually-dropped item being 'task-1', not 'file' — corrected/widened from this plan's original assumption during test implementation (re-verified live via both a real `dragTo()` drag and independently via manually dispatched DragEvents): the "uploaded" state is a single shared flag driving both drop-zone text/Reset-button AND file visibility, not scoped to the file's own identity

### 4. Drag and Drop - File Widget: Successful Drop, Disappear, and Reset

**Seed:** `tests/seed.spec.ts`

#### 4.1. Dragging the file onto the drop-zone removes it from the DOM and transitions the zone to an Uploading state with a Reset button — Priority: Critical

**File:** `tests/components/drag-and-drop/drag-and-drop-file.spec.ts`

**Steps:**
  1. Navigate to '/components/dragAndDrop'. Confirm '[data-testid="file"]' is present (count = 1). Drag '[data-testid="file"]' onto '[data-testid="drop-zone"]'
    - expect: '[data-testid="file"]' is now fully absent from the DOM (count = 0), confirming it 'disappears' rather than merely becoming hidden
    - expect: '[data-testid="drop-zone"]' text now reads exactly 'Uploading...'
    - expect: '[data-testid="button-reset-file-button"]' is now visible with text 'Reset'
  2. Wait 3 seconds without further interaction, then re-inspect the drop-zone
    - expect: '[data-testid="drop-zone"]' text is still exactly 'Uploading...' (no automatic transition to a different/completed state observed within this window)

#### 4.2. Clicking Reset after a successful file drop restores the file widget to its exact original default state — Priority: Critical

**File:** `tests/components/drag-and-drop/drag-and-drop-file.spec.ts`

**Steps:**
  1. Navigate to '/components/dragAndDrop'. Drag the file onto the drop-zone, confirm the 'Uploading...'/Reset state is reached. Click '[data-testid="button-reset-file-button"]'
    - expect: '[data-testid="file"]' reappears in the DOM (count = 1)
    - expect: '[data-testid="drop-zone"]' text reverts to exactly 'Drop file here'
    - expect: '[data-testid="button-reset-file-button"]' is no longer present in the DOM (count = 0)

#### 4.3. Reset is scoped only to the file widget and has zero effect on independent Kanban task board state — Priority: High

**File:** `tests/components/drag-and-drop/drag-and-drop-file.spec.ts`

**Steps:**
  1. Navigate to '/components/dragAndDrop'. Drag 'task-3' ('Fix bug') into 'finished-column' (board now non-default). Then drag the file onto the drop-zone and click Reset
    - expect: 'finished-column's task order after Reset is still exactly ['Design web', 'Fix bug'] (from the earlier board move) — completely unaffected by the file widget's drop-and-reset cycle
    - expect: 'todo-column' still contains exactly ['Review code', 'Deploy app'], also unaffected

### 5. Drag and Drop - File Widget: Cancelled/Invalid Drop

**Seed:** `tests/seed.spec.ts`

#### 5.1. Dragging the file onto an invalid target outside the drop-zone is a cancelled no-op — the file remains draggable and the zone is unaffected — Priority: High

**File:** `tests/components/drag-and-drop/drag-and-drop-file-invalid.spec.ts`

**Steps:**
  1. Navigate to '/components/dragAndDrop'. Drag '[data-testid="file"]' onto the first 'form-label' element (an invalid target well outside 'drop-zone')
    - expect: '[data-testid="file"]' is still present in the DOM (count = 1), confirming the drop was cancelled rather than consumed
    - expect: '[data-testid="drop-zone"]' text remains exactly 'Drop file here', unchanged
    - expect: '[data-testid="button-reset-file-button"]' is NOT present in the DOM (0 elements) — the Uploading/Reset state was never entered

### 6. Drag and Drop - State Persistence Across Reload

**Seed:** `tests/seed.spec.ts`

#### 6.1. Reloading the page after extensive interaction with both widgets fully resets everything to its exact original default state — Priority: Critical

**File:** `tests/components/drag-and-drop/drag-and-drop-persistence.spec.ts`

**Steps:**
  1. Navigate to '/components/dragAndDrop'. Rearrange the board (drag all of 'task-1', 'task-2', 'task-3' into 'finished-column') and complete a file drop (drag file onto drop-zone). Confirm both widgets are now in non-default states
    - expect: 'todo-column' has 0 tasks and 'finished-column' has all 4, and 'drop-zone' reads 'Uploading...' with a Reset button present, confirming the pre-reload state is genuinely non-default
  2. Reload the page (page.goto('/components/dragAndDrop') or page.reload())
    - expect: 'todo-column' contains exactly ['Review code', 'Deploy app', 'Fix bug'] again, in that exact order
    - expect: 'finished-column' contains exactly ['Design web'] again
    - expect: '[data-testid="file"]' is present again (count = 1) and '[data-testid="drop-zone"]' reads exactly 'Drop file here' again
    - expect: '[data-testid="button-reset-file-button"]' is absent again (0 elements), confirming no state persisted via localStorage, sessionStorage, or URL across the reload

### 7. Drag and Drop - Accessibility Gap: No Keyboard Alternative

**Seed:** `tests/seed.spec.ts`

#### 7.1. [GAP - accessibility] Draggable task cards are not keyboard-focusable and have no keyboard-driven movement alternative — Priority: Medium

**File:** `tests/components/drag-and-drop/drag-and-drop-accessibility.spec.ts`

**Steps:**
  1. Navigate to '/components/dragAndDrop'. Attempt to programmatically focus '[data-testid="task-1"]' (locator.focus()) and check document.activeElement
    - expect: 'task-1' does NOT become 'document.activeElement' after the focus attempt
    - expect: 'task-1's computed tabIndex property equals -1, confirming it has no explicit tabindex and is not part of the natural or programmatic tab order
  2. With 'task-1' still unfocused, capture 'todo-column's task order beforehand, then press ArrowRight and ArrowDown as a best-effort attempt to trigger any keyboard-based task movement
    - expect: 'todo-column's task order after the key presses is unchanged from before, confirming there is no keyboard equivalent to the native HTML5 drag-and-drop interaction on this page — flagged as an accessibility defect-candidate for the dev team, consistent with the same class of gap documented in specs/drag.plan.md and specs/button.plan.md
