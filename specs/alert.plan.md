# Alert Component Test Plan

## Application Overview

The Alert component (https://www.automationplayground.dev/components/alert) is a static page (heading "Alert", level 1) presenting four independent trigger buttons, each demonstrating a different dialog-handling pattern: a native browser `alert()`, a native `confirm()`, a native `prompt()`, and a custom in-page SweetAlert2 modal. All interactions are purely client-side — no XHR/fetch network requests specific to the Alert component were observed firing for any of the four triggers during exploration (only pre-existing Next.js RSC prefetch requests for unrelated nav links were present in the network log, the same pattern documented on the Button, Form, and Advanced Table pages) — so this plan contains no API-level test coverage.

Key elements (verified via `data-testid` attributes and live DOM inspection):
- `[data-testid="button-simple-alert"]` — `<button>` text "Simple Alert", preceded by label text "Accept the Alert". Triggers a native `window.alert()` with message exactly "Hey! Welcome to Automation Playground!" (confirmed via captured `dialog.message()`).
- `[data-testid="button-confirm-alert"]` — `<button>` text "Confirm Alert", preceded by label text "Dismiss the Alert & print the alert text". Triggers a native `window.confirm()` with message exactly "Are you happy with Automation Playground?".
- `[data-testid="button-prompt-alert"]` — `<button>` text "Prompt Alert", preceded by label text "Type your name & accept". Triggers a native `window.prompt()` with message "Please enter your name:".
- `[data-testid="button-sweet-alert"]` — `<button>` text "Modern Alert", preceded by label text "Sweet alert". Triggers a custom SweetAlert2 in-page modal (`role="dialog"`, class `swal2-popup swal2-modal swal2-icon-error`, container class `swal2-container swal2-center swal2-backdrop-show`), NOT a native browser dialog.

No other interactive elements are specific to this component besides these four buttons, the shared site header (branding, nav, "BACK" button), and the "Insight" section's "Github solution" link (already fully visible without any expand interaction, same pattern as the Button component's Insight section).

Confirmed default/fresh state (page reload, no interaction): all four trigger buttons are visible and enabled; no result/feedback text exists anywhere in the DOM for any trigger. In particular, the prompt's result paragraph ("You entered: ...") does not exist in the DOM at all until a prompt has been submitted (accepted or cancelled) at least once in that page instance — a reload fully resets this state, confirmed directly via DOM inspection before and after interaction.

Confirmed behaviors (all independently re-verified live during this exploration pass, not merely transcribed from the prior informal write-up in `specs/test-plan.md` section 9):
- Simple `alert()`: accepting it produces the type `"alert"` and message exactly "Hey! Welcome to Automation Playground!"; no on-page text/DOM change results from triggering or accepting it (confirmed via before/after snapshot diff).
- `confirm()` dismiss path: dialog type `"confirm"`, message exactly "Are you happy with Automation Playground?"; dismissing produces no on-page text change (matches implemented test).
- `confirm()` **accept path (re-verified live for this plan)**: accepting the confirm dialog also produces NO visible on-page text change — no "You entered..." or any other new text appears anywhere in the page's `<main>` content, confirmed via before/after snapshot diff. Both branches of `confirm()` are functionally silent on the page; the only way to observe the outcome of a `confirm()` call is via the dialog's own type/message, not via any rendered feedback.
- `prompt()` accept with typed text (e.g. "Saad Tested"): dialog type `"prompt"`, message "Please enter your name:"; accepting displays a paragraph reading exactly "You entered: Saad Tested" (matches implemented test).
- `prompt()` **cancel/dismiss path (re-verified live)**: dismissing the prompt (Cancel, equivalent to `dialog.dismiss()`) displays a paragraph reading exactly "You entered: No name provided." — confirmed reproducible; cancelling still produces result text, it does not leave the page blank.
- `prompt()` **accept with empty string (re-verified live)**: accepting the prompt with an empty string (`dialog.accept('')`, i.e. OK pressed with no text typed) produces the EXACT SAME text as the cancel path: "You entered: No name provided." — NOT "You entered: " as might naively be assumed. Confirmed by direct comparison of the resulting DOM: an empty accepted value and a cancelled prompt are treated identically by the component's own logic (both are falsy in a JS truthiness check, so the app cannot distinguish "cancelled" from "OK'd with nothing").
- SweetAlert2 modal: opening it shows heading "Error!" and text "Do you want to continue?", with an error-style icon ("X" mark) and a single "Yes" button — confirmed via DOM inspection that there is NO "No"/Cancel button anywhere in the modal markup, only "Yes" exists. Clicking "Yes" closes the modal (heading "Error!" is no longer visible, matches implemented test).
- SweetAlert2 modal **Escape-key dismiss (re-verified live)**: with the modal open, pressing the Escape key closes it — the modal element is fully removed from the DOM (0 `[role="dialog"]` elements remain), confirmed reproducible.
- SweetAlert2 modal **outside/backdrop-click dismiss (re-verified live)**: with the modal open, clicking on the `.swal2-container` backdrop area (outside the `.swal2-popup` itself, e.g. near its top-left corner at 5,5) closes the modal — 0 `[role="dialog"]` elements remain after the click, confirmed reproducible.
- **Sequential/no-cross-contamination (re-verified live)**: triggering all four alert types in sequence on a single fresh page load (simple accept, confirm accept, prompt accept with "Sequence Test", then SweetAlert open+Yes) — each resolved fully before the next was triggered — produced fully correct, isolated results: the prompt result paragraph showed exactly "You entered: Sequence Test" (not stale/leaked text from any earlier step), and the SweetAlert modal opened and closed cleanly via its own "Yes" button with no residual dialog element and no interference from the earlier native-dialog interactions.
- No JavaScript console errors were observed during any exploration flow (all four triggers, all branches, Escape dismiss, backdrop dismiss, sequential run).

Known bugs / notable gaps: none identified as functional defects. Every behavior documented in the prior informal plan (`specs/test-plan.md` section 9) was independently re-verified live during this exploration pass and reproduced exactly as previously described — no discrepancies were found. The one genuinely non-obvious behavior worth calling out for explicit regression coverage (not a bug, but surprising) is the prompt's empty-accept/cancel equivalence documented above.

Ambiguous/unverified areas explicitly flagged for testers:
- The precise SweetAlert2 configuration options in use (e.g. whether `allowEscapeKey`/`allowOutsideClick` are explicitly set `true` vs. simply left at the library's own default, which is also `true`) were not read from source — behavior was confirmed empirically (both dismiss paths work) rather than by inspecting the app's JS.
- Whether clicking the SweetAlert2 modal's small "X" close button (present in the DOM as `.swal2-close` but with inline `style="display: none;"`, i.e. hidden/not rendered) can be force-triggered or is truly unreachable by any user was not tested, since it is not visible/interactive in the rendered UI.
- Touch/mobile-specific dismiss gestures for the SweetAlert2 modal (e.g. tap-outside on a touch viewport) were not independently exercised; expected to behave identically to desktop click per standard SweetAlert2 behavior, but not directly confirmed.
- The "BACK" button in the page header (shared across all component pages) was not exercised as part of this plan, consistent with the Form, Input, and Button plans' treatment of this same shared control.
- Exact locale/wording of any browser-chrome-rendered dialog text outside the `dialog.message()` (e.g. OK/Cancel button labels on the native dialogs themselves) was not inspected, since Playwright's dialog API interacts with native dialogs programmatically rather than through their visible chrome.

## Test Scenarios

### 1. Alert - Initial Load and Default State

**Seed:** `tests/seed.spec.ts`

#### 1.1. Alert page loads with all four trigger buttons, labels, and the Insight section correctly rendered

**File:** `tests/components/alert/alert-load.spec.ts`

**Steps:**
  1. Navigate to '/components/alert' on a fresh browser context
    - expect: Page loads successfully (HTTP 200, no console errors)
    - expect: Heading 'Alert' (level 1) is visible
  2. Inspect all four trigger buttons and their preceding label text
    - expect: '[data-testid="button-simple-alert"]' is visible, enabled, with text 'Simple Alert', preceded by label text 'Accept the Alert'
    - expect: '[data-testid="button-confirm-alert"]' is visible, enabled, with text 'Confirm Alert', preceded by label text 'Dismiss the Alert & print the alert text'
    - expect: '[data-testid="button-prompt-alert"]' is visible, enabled, with text 'Prompt Alert', preceded by label text 'Type your name & accept'
    - expect: '[data-testid="button-sweet-alert"]' is visible, enabled, with text 'Modern Alert', preceded by label text 'Sweet alert'
  3. Inspect the 'Insight' section without performing any click/expand interaction
    - expect: Heading 'Insight' (level 2) is visible immediately, with no interaction required to reveal it
    - expect: The concept list is visible and contains at least the items 'Handle browser native alert dialogs' and 'Interact with custom alert components'
    - expect: A 'Github solution' link is visible with href 'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/alert/alert.spec.ts'

#### 1.2. No result/feedback text exists anywhere on the page before any trigger has been interacted with

**File:** `tests/components/alert/alert-load.spec.ts`

**Steps:**
  1. Navigate to '/components/alert' and scan the full page for any pre-existing result text or open dialogs
    - expect: No element containing the text 'You entered' exists anywhere in the DOM
    - expect: No element with role 'dialog' exists anywhere in the DOM (SweetAlert modal not open)
    - expect: No native browser dialog is open (page loads and settles without any dialog event firing)

### 2. Alert - Simple `alert()` Dialog

**Seed:** `tests/seed.spec.ts`

#### 2.1. Simple alert triggers a native alert dialog with the correct message and produces no on-page text change

**File:** `tests/components/alert/alert-simple.spec.ts`

**Steps:**
  1. Navigate to '/components/alert', register a dialog handler before clicking, then click '[data-testid="button-simple-alert"]' and accept the dialog
    - expect: The dialog's type equals exactly 'alert'
    - expect: The dialog's message equals exactly 'Hey! Welcome to Automation Playground!'
  2. Capture the page's `<main>` content text before and after this interaction
    - expect: The 'before' and 'after' text snapshots are identical — no new text, element, or visible feedback appears anywhere on the page as a result of triggering or accepting the simple alert

### 3. Alert - Native `confirm()` Dialog

**Seed:** `tests/seed.spec.ts`

#### 3.1. Confirm dialog dismiss path shows the correct message and produces no on-page text change

**File:** `tests/components/alert/alert-confirm.spec.ts`

**Steps:**
  1. Navigate to '/components/alert', register a dialog handler, click '[data-testid="button-confirm-alert"]', and dismiss the dialog (dialog.dismiss())
    - expect: The dialog's type equals exactly 'confirm'
    - expect: The dialog's message equals exactly 'Are you happy with Automation Playground?'
    - expect: No element containing text 'You entered' or any other new result text appears anywhere on the page after dismissing

#### 3.2. Confirm dialog accept path also produces no on-page text change

**File:** `tests/components/alert/alert-confirm.spec.ts`

**Steps:**
  1. Navigate to '/components/alert', register a dialog handler, click '[data-testid="button-confirm-alert"]', and accept the dialog (dialog.accept()) instead of dismissing it
    - expect: The dialog's type equals exactly 'confirm'
    - expect: Capture the page's `<main>` content text before and after this interaction — the two snapshots are byte-for-byte identical, confirming that accepting (like dismissing) produces zero visible on-page feedback; the only observable outcome of a `confirm()` call is the dialog object itself, not any rendered page state

### 4. Alert - Native `prompt()` Dialog

**Seed:** `tests/seed.spec.ts`

#### 4.1. Prompt dialog accept with typed text displays the entered value

**File:** `tests/components/alert/alert-prompt.spec.ts`

**Steps:**
  1. Navigate to '/components/alert', register a dialog handler, click '[data-testid="button-prompt-alert"]', and accept the dialog with typed text 'Saad Tested' (dialog.accept('Saad Tested'))
    - expect: The dialog's type equals exactly 'prompt'
    - expect: The dialog's message equals exactly 'Please enter your name:'
    - expect: A paragraph containing exactly 'You entered: Saad Tested' becomes visible on the page

#### 4.2. Prompt dialog cancel/dismiss path displays a fallback message, not blank text

**File:** `tests/components/alert/alert-prompt.spec.ts`

**Steps:**
  1. Navigate to '/components/alert', register a dialog handler, click '[data-testid="button-prompt-alert"]', and dismiss/cancel the dialog (dialog.dismiss())
    - expect: A paragraph containing exactly 'You entered: No name provided.' becomes visible on the page — confirming cancelling the prompt still produces explicit result text rather than no text at all, and that the wording differs from any typed-name case (locks in this non-obvious, previously-undertested behavior)

#### 4.3. Prompt dialog accept with an empty string produces the same fallback text as the cancel path

**File:** `tests/components/alert/alert-prompt.spec.ts`

**Steps:**
  1. Navigate to '/components/alert', register a dialog handler, click '[data-testid="button-prompt-alert"]', and accept the dialog with an empty string (dialog.accept(''))
    - expect: A paragraph containing exactly 'You entered: No name provided.' becomes visible on the page — NOT 'You entered: ' (empty suffix) — confirming the component treats an accepted-but-empty value identically to a cancelled prompt, a non-obvious equivalence explicitly re-verified live for this plan

#### 4.4. Repeated prompt interactions replace the single result paragraph rather than appending duplicates

**File:** `tests/components/alert/alert-prompt.spec.ts`

**Steps:**
  1. Navigate to '/components/alert', trigger the prompt and accept with text 'First Entry', then trigger the prompt again and accept with text 'Second Entry'
    - expect: Exactly one element on the page matches text of the form 'You entered: ...' after the second interaction (not two), and its text equals exactly 'You entered: Second Entry' — confirming the component replaces its single result state on each interaction rather than accumulating a list of past results

### 5. Alert - Custom SweetAlert Modal

**Seed:** `tests/seed.spec.ts`

#### 5.1. SweetAlert modal opens with correct content and closes via its 'Yes' button

**File:** `tests/components/alert/alert-sweetalert.spec.ts`

**Steps:**
  1. Navigate to '/components/alert' and click '[data-testid="button-sweet-alert"]' (a custom in-page modal, not a native browser dialog — no dialog event should fire)
    - expect: An element with role 'dialog' becomes visible
    - expect: Heading 'Error!' (level 2) is visible within the modal
    - expect: Text 'Do you want to continue?' is visible within the modal
    - expect: Exactly one button is present inside the modal, with text 'Yes' — no 'No'/Cancel button exists in the modal's DOM
  2. Click the 'Yes' button
    - expect: The 'Error!' heading is no longer visible (web-first `not.toBeVisible()` assertion)
    - expect: No element with role 'dialog' remains in the DOM

#### 5.2. SweetAlert modal dismisses via the Escape key

**File:** `tests/components/alert/alert-sweetalert.spec.ts`

**Steps:**
  1. Navigate to '/components/alert', click '[data-testid="button-sweet-alert"]' to open the modal, confirm it is open (heading 'Error!' visible), then press the Escape key
    - expect: The 'Error!' heading is no longer visible
    - expect: No element with role 'dialog' remains in the DOM (0 matching elements), confirming Escape fully dismisses the modal

#### 5.3. SweetAlert modal dismisses via outside/backdrop click

**File:** `tests/components/alert/alert-sweetalert.spec.ts`

**Steps:**
  1. Navigate to '/components/alert', click '[data-testid="button-sweet-alert"]' to open the modal, confirm it is open (heading 'Error!' visible), then click on the modal's backdrop container (`.swal2-container`) at a position outside the popup itself (e.g. near its top-left corner)
    - expect: The 'Error!' heading is no longer visible
    - expect: No element with role 'dialog' remains in the DOM (0 matching elements), confirming an outside click fully dismisses the modal

### 6. Alert - Cross-Trigger Independence

**Seed:** `tests/seed.spec.ts`

#### 6.1. All four alert triggers behave correctly and independently when exercised in sequence on a single page load

**File:** `tests/components/alert/alert-sequence.spec.ts`

**Steps:**
  1. On a single fresh navigation to '/components/alert', trigger and resolve each of the four alert types in sequence, fully resolving each before triggering the next: (a) simple alert — accept; (b) confirm — accept; (c) prompt — accept with text 'Sequence Test'; (d) SweetAlert — open then click 'Yes'
    - expect: Step (a) dialog type equals 'alert' and produces no on-page text
    - expect: Step (b) dialog type equals 'confirm' and produces no on-page text
    - expect: Step (c) produces a paragraph containing exactly 'You entered: Sequence Test' (not stale or leaked text from any earlier step, and not affected by the two preceding native dialogs)
    - expect: Step (d) modal opens (heading 'Error!' visible) and closes cleanly via 'Yes' (heading no longer visible, no role='dialog' element remains), with no residual dialog/modal state left over from the three prior native-dialog interactions
    - expect: No JavaScript console errors are logged at any point during the full sequence
