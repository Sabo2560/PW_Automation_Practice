# Upload File Component Test Plan

## Application Overview

**No prior coverage exists for this component.** `Glob` on `specs/upload-file.plan.md`, `tests/pages/UploadFilePage.ts`, and `tests/components/upload-file/**` confirmed none of the three exist anywhere in the repo before this plan. The placeholder hint at `specs/test-plan.md` line ~224 ("Upload valid file, upload invalid type/size, remove uploaded file") and the "likely backend interaction" assumption at line ~359 were both treated as unverified guesses, not facts, and independently re-confirmed (or corrected) through live exploration below — the "size" half of the placeholder's "invalid type/size" phrasing was specifically investigated and found to have NO implemented size-limit behavior at all (see Ambiguous section), and the "likely backend interaction" guess was directly falsified (see Network section).

**Route correction (important, confirmed live):** the component's real route is `/components/uploadFile` (camelCase, matching this repo's `/components/dragAndDrop` casing convention) — the hyphenated `/components/upload-file` implied by this plan's own filename and by `specs/test-plan.md`'s table entry returns a genuine HTTP 404 (confirmed live by navigating directly to it before finding the correct link via `/components`'s own anchor `href="components/uploadFile"`). `UploadFilePage.ts`'s `gotoUploadFile()` must navigate to the camelCase path; this plan's own filename (`upload-file.plan.md`) intentionally keeps the repo's kebab-case file-naming convention (matching `drag-and-drop.plan.md` for the differently-cased `/components/dragAndDrop` route) and should not be read as implying the URL is also hyphenated.

**Page Object:** `UploadFilePage.ts` (new — does not yet exist in `tests/pages/`), extending `BasePage.ts` with `readonly Locator` fields and helper methods, matching the conventions established in `AlertPage.ts` (particularly its `triggerDialog()` pattern, reused here for this component's own native `alert()`) and `WindowPage.ts`/`SliderPage.ts`. It should expose: a `gotoUploadFile()` navigation helper (asserting the 'Upload File' level-1 heading is visible); `root` (`page.getByTestId('upload-file')`, the single container wrapping both the default and uploaded states); `formLabel` (`page.getByTestId('form-label')`); `clientSideNote` (`page.getByText('No file is sent to server, everything stays in your browser', { exact: true })` — a plain sibling `<span>` with no dedicated testid); `uploadButton` (`page.getByTestId('button-upload-file-btn')` — globally unique on this page, no duplicate-testid workaround needed, a simpler story than Window/Radio/Calendar); `fileInput` (`root.locator('input[type="file"]')` — visually hidden via `class="hidden"` but still fully usable via Playwright's `setInputFiles()`, which does not require element visibility); `removeFileButton` (`page.getByTestId('remove-file-btn')`, `aria-label="Remove file"`); `getUploadedFileName(): Promise<string | null>` (a `page.evaluate`-based helper reading the text node adjacent to the file-icon `<svg class="lucide-file-text">` inside `root` and trimming it — required because this text carries no dedicated `data-testid` of its own, the same category of gap this repo's Window/Slider plans solved with sibling-locator or evaluate-based helpers for untestid'd text); `uploadFile(fileName: string, content: string, mimeType?: string)` (wraps `fileInput.setInputFiles([{ name: fileName, mimeType: mimeType ?? 'text/plain', buffer: Buffer.from(content) }])` — Playwright's own in-memory-buffer form, requiring NO real file on disk at all); `uploadFileExpectingAlert(fileName: string, content: string, mimeType?: string): Promise<string>` (mirrors `AlertPage.triggerDialog()`'s register-before-trigger pattern: registers a one-shot `page.once('dialog', ...)` handler BEFORE calling `setInputFiles()`, accepts the dialog, and returns its message text — required for every invalid-file scenario, since this app's rejection is a real native `window.alert()` that blocks until handled); `removeFile()` (clicks `removeFileButton`); `expectDefaultState()` / `expectUploadedState(fileName: string)` thin assertion helpers, each checking the full observable state (button presence/absence, filename text, remove-button presence/absence) in one place rather than duplicating the same four assertions across every scenario.

**Methodology note on how this plan's exploration obtained file-upload behavior (does not apply to the generated tests):** the MCP planning tool's `browser_file_upload` only accepts real file paths inside its own allowed roots (confirmed live: this repo's project root and `.playwright-mcp/` only — a path under `node_modules/` was explicitly rejected as "outside allowed roots" despite nesting under the project root, and no `.txt` fixture file existed anywhere in an allowed location at plan time). This plan's live exploration therefore used a synthetic `File` + `DataTransfer` + dispatched `'change'` `Event` via `page.evaluate()` to simulate real file selection instead. This is NOT how the generated spec tests should work — Playwright's own `locator.setInputFiles()` API accepts an in-memory `{ name, mimeType, buffer }` object directly with no real file needed on disk at all, dispatches genuine native browser events indistinguishable from a real OS file-chooser selection, and is the idiomatic, fully-supported approach `UploadFilePage.ts` must use; no behavioral difference between the two techniques is expected or was observed.

**Confirmed behaviors — default state:** a single `[data-testid="upload-file"]` container holds a `[data-testid="form-label"]` reading exactly `"Upload random txt file and check that only .txt file can be uploaded"`, a sibling `<span>` (no testid) reading exactly `"No file is sent to server, everything stays in your browser"`, and (in the default state only) a visible `<button type="button" data-testid="button-upload-file-btn">Upload file</button>` sitting alongside a visually-hidden `<input type="file" accept=".txt" class="hidden">` with NO `multiple` attribute (single-file selection only, confirmed via `getAttribute`). Clicking (or `Enter`-activating, confirmed live) the button opens a genuine native OS file chooser (confirmed via the MCP tool's own "File chooser" modal-state detection after the click); cancelling that chooser with no file selected leaves the widget fully unchanged in its default state (confirmed live, no error/alert). The Insight section (heading level 2; concept list confirmed exactly: `'Upload file'`, `'Remove uploaded file'`, `'Verify file type restrictions'`; Github solution link to `https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/uploadFile/uploadFile.spec.ts`) is visible immediately with no interaction required, matching every other component page's pattern.

**Confirmed behaviors — successful upload (valid .txt file):** selecting a file whose name ends in a literal, lowercase `.txt` extension removes BOTH the `button-upload-file-btn` button AND the file input from the DOM entirely (confirmed via full `innerHTML` inspection of the container both before and after — this is a full conditional re-render, not merely a hidden/shown toggle), replacing them with a `lucide-file-text` SVG icon, the filename as plain text (raw HTML source has one leading space before the text node, e.g. `"...</svg> valid-test.txt<button..."`, normalized away by whitespace-collapsing text matchers), and a `<button aria-label="Remove file" data-testid="remove-file-btn">x</button>`. Because the file input is entirely removed from the DOM in this state, a new file cannot be selected again until the file is first removed. File content size was not found to be a validation criterion at all — a genuinely empty (0-byte) `.txt` file was accepted identically to a non-empty one (confirmed live). Filenames containing spaces and special characters (parentheses, etc.) are displayed verbatim with no sanitization or truncation observed.

**Confirmed behaviors — invalid file type rejection:** selecting a file whose name does NOT end in a literal lowercase `.txt` extension (confirmed with a `.png`-named file) fires a genuine, blocking native `window.alert()` with message text exactly `"Only .txt files are allowed."`. The widget's visible state never changes (the default `Upload file` button remains, the uploaded state is never entered) — but the underlying `<input>`'s `files`/`value` properties ARE reset to empty immediately after the alert is dismissed (confirmed via direct property inspection), even though the visible React-rendered UI never changed — meaning the exact same invalid file can be re-selected and will be re-rejected identically and repeatably, rather than being silently ignored due to a stale reference. **[Most significant finding] Extension matching is case-sensitive:** a file named `UPPER-TEST.TXT` (uppercase extension) triggered the IDENTICAL rejection alert with the identical message — confirmed live, reproducible — meaning only an exact, literal lowercase `.txt` suffix is ever accepted; `.TXT`, `.Txt`, or any other casing is treated the same as a wholly wrong file type like `.png`.

**Confirmed distinctness from the `/components/dragAndDrop` file widget:** this page's full DOM was inspected and contains zero elements matching `[data-testid="drop-zone"]`, zero matching `[data-testid="file"]` (both testids belong exclusively to the separate file-drag widget documented in `specs/drag-and-drop.plan.md`, on the different `/components/dragAndDrop` page), and zero elements anywhere with `draggable="true"` — this component offers ONLY a click-to-browse native file chooser, no drag-and-drop affordance of any kind, and the two must never share a Page Object or be conflated.

**Purely client-side; no API coverage needed.** `browser_network_requests` was checked after a full interaction pass (valid upload, remove, rejected invalid upload with two different invalid files, re-upload) and zero XHR/fetch requests specific to any upload/remove/reject action were observed — only the same pre-existing Next.js static-asset/RSC-prefetch requests (23 total, all standard page-load/navigation-prefetch traffic) documented on every other component page in this suite. This directly confirms the on-page disclaimer text ("No file is sent to server, everything stays in your browser") is accurate, and directly falsifies `specs/test-plan.md` line ~359's guess that this component "likely" has backend interaction. `browser_console_messages` with `level: error` and `all: true` returned exactly 1 error across the whole session, and it was an artifact of this plan's OWN exploratory misstep (a 404 from initially navigating to the wrong, hyphenated URL before discovering the correct camelCase route) — zero real application console errors were observed during any genuine interaction with the widget itself.

**Known bugs / notable quirks:**
1. **[Confirmed, most significant finding, not a bug]** Extension validation is case-sensitive and exact — only a literal lowercase `.txt` suffix passes; an uppercase `.TXT` extension is rejected with the identical alert as a wholly different file type. A test author assuming case-insensitive extension matching (the common convention on many real-world upload widgets) would write an incorrect assertion here.
2. **[Confirmed, not a bug, testing-methodology note]** This plan's own exploration had to use a synthetic `File`/`DataTransfer`/`change`-event technique via `page.evaluate()` because the MCP planning tool's `browser_file_upload` only accepts real file paths inside a narrow set of allowed roots, and no `.txt` fixture existed there. The generated spec tests must instead use Playwright's own `locator.setInputFiles([{ name, mimeType, buffer }])` with in-memory buffers — no fixture files need to be created on disk for this suite at all.
3. **[Confirmed, not a bug]** Rejecting an invalid file resets the underlying `<input>`'s `value`/`files` to empty even though the visible UI never leaves its default state — a test asserting only visible button state after a rejection would miss this; it specifically enables the same invalid file to be re-selected and re-rejected on a subsequent attempt.
4. **[Confirmed, not a bug]** This page has NO drag-and-drop affordance and no `drop-zone`/`file` testids at all — a fully separate, simpler widget from the `/components/dragAndDrop` page's own distinct file-drop widget (see `specs/drag-and-drop.plan.md`). The two must never share a Page Object or be tested as if they were the same component.
5. **[Confirmed, not a bug]** The real route is `/components/uploadFile` (camelCase) — `/components/upload-file` (hyphenated) 404s. This plan's own filename intentionally stays kebab-case per this repo's file-naming convention; only the actual browser navigation target must use the camelCase URL.
6. **[Confirmed, not a bug]** Successfully uploading a file removes the file input from the DOM entirely (not merely hides it) — a test must click "Remove file" before it can select a second file in the same session; there is no way to "replace" an uploaded file directly without first removing it.

**Ambiguous/unverified areas explicitly flagged for testers:**
- No file SIZE limit of any kind was found or triggered during exploration (only filename extension drives the rejection alert) — the Insight concept list itself only lists `'Verify file type restrictions'`, never a size restriction, and the placeholder hint's "invalid type/size" phrasing appears to only be half-implemented (type only). Testing a genuinely very large file (e.g. many MB/GB) to see whether an unhandled performance issue or crash occurs was not attempted (impractical in this environment) — this plan's scenarios test the empty/0-byte boundary only, not an upper size boundary, since none was found to exist.
- Whether the app performs any content/MIME-sniffing validation in addition to filename-extension checking was not tested — every file used during exploration (valid and invalid) contained arbitrary plain-text bytes regardless of its declared name/MIME type (e.g. the "invalid" `.png`-named file did not contain real PNG magic bytes); this plan's scenarios likewise only vary the filename extension, never real binary content, and assert only on extension-driven behavior.
- Repeated/rapid consecutive invalid-file rejections were only tested twice in the same session (a `.png` file, then an uppercase-`.TXT` file), both cleanly resolving back to the default state; a longer stress sequence of many consecutive rejections was not exercised.
- Whether a native `alert()` dialog can be dismissed any way other than its single acknowledgement action (unlike `confirm()`/`prompt()` dialogs, `alert()` has no cancel/dismiss distinction) was not independently re-verified via a real `Escape` keypress — only Playwright's programmatic `dialog.accept()` equivalent was exercised.
- Touch/mobile-specific interaction (tapping the Upload/Remove buttons on an emulated touch viewport) was not independently exercised.
- The "BACK" button in the shared page header was not exercised, consistent with the treatment of this same shared control in every other component plan in this repo.
- The precise internal mechanism connecting the visible "Upload file" button's click to opening the native OS chooser (presumably a proxied `.click()` on the hidden input via a React ref) was not confirmed via source inspection — only the observed black-box behavior (a genuine "File chooser" modal state appears after the click) is asserted by this plan.

## Test Scenarios

### 1. Upload File - Initial Load and Default State

**Seed:** `tests/seed.spec.ts`

#### 1.1. Upload File page loads with heading, label, client-side disclaimer, Upload button, and Insight section correctly rendered — Priority: Critical

**File:** `tests/components/upload-file/upload-file-load.spec.ts`

**Steps:**
  1. Navigate to '/components/uploadFile' (the real camelCase route — the hyphenated '/components/upload-file' returns HTTP 404) on a fresh browser context
    - expect: Page loads successfully (HTTP 200, no console errors)
    - expect: Heading 'Upload File' (level 1) is visible
  2. Inspect the 'form-label' element and the adjacent disclaimer text
    - expect: The 'form-label' element reads exactly 'Upload random txt file and check that only .txt file can be uploaded'
    - expect: The adjacent disclaimer span reads exactly 'No file is sent to server, everything stays in your browser'
  3. Inspect the widget's default (pre-upload) state and the Insight section without performing any upload
    - expect: A button with data-testid 'button-upload-file-btn' and accessible name 'Upload file' is visible and enabled
    - expect: '[data-testid="remove-file-btn"]' resolves to 0 elements (no file is uploaded by default)
    - expect: Heading 'Insight' (level 2) is visible immediately with no interaction required; its concept list contains exactly, in order: 'Upload file', 'Remove uploaded file', 'Verify file type restrictions'
    - expect: A 'Github solution' link is visible with href 'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/uploadFile/uploadFile.spec.ts'

#### 1.2. The underlying file input is a native, hidden, single-file, .txt-only input element — Priority: High

**File:** `tests/components/upload-file/upload-file-load.spec.ts`

**Steps:**
  1. Navigate to '/components/uploadFile'. Inspect the native input[type=file] element nested inside '[data-testid="upload-file"]' directly via its DOM attributes, without opening the file chooser
    - expect: The input's 'type' attribute is exactly 'file'
    - expect: The input's 'accept' attribute is exactly '.txt'
    - expect: The input has no 'multiple' attribute (getAttribute('multiple') returns null), confirming this widget supports selecting only ONE file at a time, never a batch/multi-file selection
    - expect: The input is visually hidden (its class list includes 'hidden') — it is never intended to be interacted with directly by a real user, only via the visible 'Upload file' button

### 2. Upload File - Valid File Upload

**Seed:** `tests/seed.spec.ts`

#### 2.1. Uploading a valid .txt file transitions the widget from the default Upload button to the uploaded-file state, showing the exact filename and a Remove file control — Priority: Critical

**File:** `tests/components/upload-file/upload-file-valid.spec.ts`

**Steps:**
  1. Navigate to '/components/uploadFile'. Using the file input's setInputFiles() with an in-memory buffer (no real file needed on disk), select a file named 'valid-test.txt' with MIME type 'text/plain' and non-empty text content
    - expect: '[data-testid="button-upload-file-btn"]' (the 'Upload file' button) is no longer present in the DOM (0 elements)
    - expect: '[data-testid="remove-file-btn"]' becomes visible, with accessible name/aria-label exactly 'Remove file' and visible text exactly 'x'
    - expect: The filename text displayed next to the file icon reads exactly 'valid-test.txt' (leading/trailing whitespace trimmed before comparison, per the raw HTML source's leading space before the text node)

#### 2.2. An empty (0-byte) .txt file is accepted identically to a non-empty one — boundary value: minimum file size — Priority: Medium

**File:** `tests/components/upload-file/upload-file-valid.spec.ts`

**Steps:**
  1. Navigate to '/components/uploadFile'. Select a file named 'empty-test.txt' with MIME type 'text/plain' and an EMPTY (zero-byte) buffer via setInputFiles()
    - expect: The widget transitions to the uploaded state identically to the previous scenario: 'button-upload-file-btn' is absent, 'remove-file-btn' is visible, and the displayed filename reads exactly 'empty-test.txt' — confirming file content size is not a rejection criterion for this widget (only the filename's extension is validated, per Section 3)

#### 2.3. A .txt filename containing spaces and special characters is displayed verbatim, unmodified — Priority: Low

**File:** `tests/components/upload-file/upload-file-valid.spec.ts`

**Steps:**
  1. Navigate to '/components/uploadFile'. Select a file named 'my report (final) v2.txt' with MIME type 'text/plain' via setInputFiles()
    - expect: The widget transitions to the uploaded state, and the displayed filename text reads exactly 'my report (final) v2.txt' — confirming the app does not sanitize, truncate, or otherwise transform the filename before displaying it

### 3. Upload File - Invalid File Type Rejection

**Seed:** `tests/seed.spec.ts`

#### 3.1. Selecting a non-.txt file triggers a native browser alert with the exact rejection message, and the widget remains in its unchanged default state — Priority: Critical

**File:** `tests/components/upload-file/upload-file-invalid.spec.ts`

**Steps:**
  1. Navigate to '/components/uploadFile'. Register a native 'dialog' event handler BEFORE selecting the file (required — Playwright auto-dismisses unregistered dialogs), then select a file named 'invalid-test.png' with MIME type 'image/png' via setInputFiles()
    - expect: A native 'alert' dialog fires as a direct result of the file selection, with message text exactly 'Only .txt files are allowed.'
    - expect: After accepting/dismissing the dialog, '[data-testid="button-upload-file-btn"]' (the 'Upload file' button) is still visible and enabled — the widget never entered the uploaded state
    - expect: '[data-testid="remove-file-btn"]' is not present in the DOM (0 elements), confirming the rejected file was never accepted

#### 3.2. [QUIRK] Extension validation is case-sensitive — an uppercase .TXT extension is rejected identically to a wrong file type — Priority: High

**File:** `tests/components/upload-file/upload-file-invalid.spec.ts`

**Steps:**
  1. Navigate to '/components/uploadFile'. Register a dialog handler, then select a file named 'UPPER-TEST.TXT' (uppercase extension) with MIME type 'text/plain' via setInputFiles()
    - expect: The identical native alert fires with message exactly 'Only .txt files are allowed.', confirming the app's extension check performs an exact, case-sensitive match against a literal lowercase '.txt' suffix — only an exact lowercase '.txt' extension is ever accepted, never '.TXT', '.Txt', or any other casing variant
    - expect: After the dialog is accepted, the widget remains in its default state ('Upload file' button visible, no filename/remove button present)

#### 3.3. After an invalid file is rejected, the underlying file input is cleared, allowing the exact same invalid file to be re-selected and re-rejected consistently — Priority: Medium

**File:** `tests/components/upload-file/upload-file-invalid.spec.ts`

**Steps:**
  1. Navigate to '/components/uploadFile'. Register a dialog handler, select an invalid file ('invalid-test.png'), accept the resulting alert, then read the file input's 'files.length' and 'value' properties directly
    - expect: Immediately after the alert is dismissed, the file input's 'files' collection has length exactly 0 and its 'value' property is an empty string — confirming the input is genuinely reset, not merely left holding a stale/rejected file reference
  2. Register a second dialog handler, then select the SAME invalid file ('invalid-test.png') a second time via setInputFiles()
    - expect: The identical native alert fires again with the same exact message, and the widget remains in its default state — confirming rejection is consistently re-triggered on repeat attempts with the same invalid file, not silently ignored due to any stale/duplicate-selection state

### 4. Upload File - Remove File

**Seed:** `tests/seed.spec.ts`

#### 4.1. Clicking Remove file after a successful upload reverts the widget exactly to its original default pre-upload state — Priority: Critical

**File:** `tests/components/upload-file/upload-file-remove.spec.ts`

**Steps:**
  1. Navigate to '/components/uploadFile'. Upload a valid file ('valid-test.txt') via setInputFiles(), confirm the uploaded state is reached, then click '[data-testid="remove-file-btn"]'
    - expect: '[data-testid="button-upload-file-btn"]' (the 'Upload file' button) reappears, visible and enabled, with its original accessible name exactly 'Upload file'
    - expect: '[data-testid="remove-file-btn"]' is no longer present in the DOM (0 elements)
    - expect: No filename text is present anywhere in the widget's container ('[data-testid="upload-file"]')

#### 4.2. After removing a file, a new valid file can be uploaded successfully — full remove-then-reupload round trip — Priority: High

**File:** `tests/components/upload-file/upload-file-remove.spec.ts`

**Steps:**
  1. Navigate to '/components/uploadFile'. Upload 'first.txt', click Remove file, then upload a DIFFERENT valid file 'second.txt' via setInputFiles()
    - expect: After the second upload, the widget reaches the uploaded state again: 'remove-file-btn' is visible and the displayed filename reads exactly 'second.txt' — NOT 'first.txt' — confirming no stale filename or upload-blocked state persists across a remove-then-reupload cycle

### 5. Upload File - Single-File-Only Scope and Distinctness from Drag-and-Drop Component

**Seed:** `tests/seed.spec.ts`

#### 5.1. This widget supports only single click-to-browse file selection — no 'multiple' support and no drag-and-drop affordance, confirming it is a fully separate component from the file-drop widget on /components/dragAndDrop — Priority: Medium

**File:** `tests/components/upload-file/upload-file-scope.spec.ts`

**Steps:**
  1. Navigate to '/components/uploadFile'. Query the full page DOM for any drag-and-drop-related testids or attributes: '[data-testid="drop-zone"]', '[data-testid="file"]', and any element with 'draggable="true"'
    - expect: Zero elements match '[data-testid="drop-zone"]' and zero match '[data-testid="file"]' anywhere on this page — those testids belong exclusively to the separate file-drop widget documented in 'specs/drag-and-drop.plan.md' for the different '/components/dragAndDrop' page, confirming the two are not the same component and must never share a Page Object
    - expect: Zero elements on this page have a 'draggable="true"' attribute
    - expect: The file input's 'multiple' attribute is absent (per the load-scenario in Section 1), confirming this widget accepts exactly one file per selection, never a batch

### 6. Upload File - Accessibility / Keyboard

**Seed:** `tests/seed.spec.ts`

#### 6.1. The Upload file trigger button is a real native button that is keyboard-focusable and activatable — Priority: High

**File:** `tests/components/upload-file/upload-file-accessibility.spec.ts`

**Steps:**
  1. Navigate to '/components/uploadFile'. Focus '[data-testid="button-upload-file-btn"]' directly and confirm its tag/type
    - expect: The element's tag name is 'BUTTON' with 'type="button"' (a real native button, not a styled div/span) with accessible role 'button' and accessible name 'Upload file' derived from its visible text content
  2. With the button focused, press 'Enter', listening for a filechooser event
    - expect: A native file chooser is triggered as a direct result of the Enter keypress (the page emits a 'filechooser' event), identical in outcome to a mouse click on the same button — confirming Enter is a fully equivalent activation method for this native button

#### 6.2. The Remove file button has an explicit aria-label distinct from its visible 'x' text, and is keyboard-activatable — Priority: Medium

**File:** `tests/components/upload-file/upload-file-accessibility.spec.ts`

**Steps:**
  1. Navigate to '/components/uploadFile'. Upload a valid file to reach the uploaded state, then inspect the Remove file button's 'aria-label' attribute and visible text content
    - expect: 'aria-label' equals exactly 'Remove file' while the button's rendered visible text is exactly 'x' — confirming assistive technology announces the fuller, clearer 'Remove file' label rather than the terse visual 'x' glyph
  2. Focus the Remove file button directly and press 'Enter'
    - expect: The widget reverts to its default 'Upload file' button state as a direct result of the Enter keypress, identical in outcome to a mouse click, confirming Enter is a fully equivalent activation method for this button too

### 7. Upload File - Network and Console Behavior

**Seed:** `tests/seed.spec.ts`

#### 7.1. No XHR/fetch network request is triggered by uploading, rejecting, or removing a file — purely client-side, matching the on-page disclaimer — Priority: Medium

**File:** `tests/components/upload-file/upload-file-network-console.spec.ts`

**Steps:**
  1. Navigate to '/components/uploadFile', begin recording network requests, then perform a full interaction sequence: upload a valid file, remove it, attempt an invalid file upload (accepting the resulting alert), and upload a valid file again
    - expect: No XHR/fetch network request specific to any upload/remove/reject action is observed at any point in the sequence — only the same pre-existing Next.js static-asset/RSC-prefetch requests documented on every other component page in this suite, confirming the on-page text 'No file is sent to server, everything stays in your browser' is accurate and this component needs no API-level test coverage

#### 7.2. No console errors are logged during the full upload/reject/remove interaction sequence — Priority: Medium

**File:** `tests/components/upload-file/upload-file-network-console.spec.ts`

**Steps:**
  1. Navigate to '/components/uploadFile', begin tracking console errors, then repeat the same broad interaction sequence as the network scenario above (valid upload, remove, rejected invalid upload with alert accepted, valid re-upload)
    - expect: Zero console error messages are logged throughout the entire sequence, matching the clean-console baseline observed live during this plan's own exploration of this exact interaction breadth

### 8. Upload File - Reload Persistence

**Seed:** `tests/seed.spec.ts`

#### 8.1. No uploaded-file state persists across a page reload — the widget always resets to its default Upload button state — Priority: High

**File:** `tests/components/upload-file/upload-file-persistence.spec.ts`

**Steps:**
  1. Navigate to '/components/uploadFile'. Upload a valid file ('reload-test.txt') and confirm the uploaded state is reached (remove-file-btn visible)
    - expect: Before reload: '[data-testid="remove-file-btn"]' is visible (sanity check that the widget is genuinely in a non-default state going into the reload)
  2. Reload the page (page.reload())
    - expect: After the reload completes, '[data-testid="button-upload-file-btn"]' (the default 'Upload file' button) is visible and enabled again
    - expect: '[data-testid="remove-file-btn"]' is absent (0 elements) and no filename text remains anywhere in the widget, confirming no localStorage/sessionStorage/URL state is involved — matching the pattern documented across every other component plan in this repo
