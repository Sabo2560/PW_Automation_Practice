# Wait

## Application Overview

**Page Object:** `WaitPage.ts` (new — does not yet exist in `tests/pages/`, unlike Button/Alert/Form/Input/AdvancedTable/Drag/Dropdown/Multiselect/Radio/SimpleTable, all of which already have one). The Wait component (https://www.automationplayground.dev/components/wait) is a static page (heading "Wait", level 1) presenting FOUR independent, purely client-side asynchronous exercises stacked vertically, each preceded by a `<label data-testid="form-label">` instructional line: (1) "Wait and Accept the alert" — a button (`button-wait-for-alert`) that triggers a native `window.alert()` after a randomized delay, with message text `Alert after X.X seconds!`; (2) "Wait for an element to appear" — a button (`button-wait-for-element`) that inserts a new `<p id="dynamic-text">` reading `Element appeared after X.X seconds!` after a randomized delay; (3) "Wait for text to change" — a button (`button-wait-for-text`) that mutates an existing `<span id="update-text">` from its default `Initial text...` to `Text changed after X.X seconds!` after a randomized delay; (4) "Wait for an element to disappear" — a button (`button-wait-for-disappearance`) that inserts a `<div id="disappearing-element">I will disappear!</div>` almost instantly (~20-35ms, confirmed NOT a multi-second delay, unlike the other three), which then itself disappears again after a further randomized multi-second delay. `WaitPage.ts` should expose: a `gotoWait()` navigation helper; `alertButton`/`elementButton`/`textButton`/`disappearanceButton` locators via `getByTestId('button-wait-for-alert'|'button-wait-for-element'|'button-wait-for-text'|'button-wait-for-disappearance')`; `dynamicElement` (`page.locator('#dynamic-text')`), `updateTextSpan` (`page.locator('#update-text')`), `disappearingElement` (`page.locator('#disappearing-element')`); a shared `GENEROUS_TIMEOUT` constant of at least 10000ms (the maximum delay observed live across roughly 20 repeated trials of all three multi-second-delay widgets during this exploration was ~4.0 seconds, so 10000ms gives more than 2x safety margin — this constant must be used for every delay-dependent assertion in this plan, and no scenario may assert against a hardcoded/assumed exact delay value); a `triggerAlertAndGetMessage()` helper that registers `page.once('dialog', ...)` BEFORE clicking `alertButton`, accepts the dialog, and returns its message text, centralizing the dialog-registration pattern that must be set up before the click (not after) to avoid a race; and `waitForElementAppear()`/`waitForTextChange()`/`waitForDisappearance()` thin wrapper helpers that assert against the confirmed message regexes with `GENEROUS_TIMEOUT`, so no spec file hardcodes today's observed delay values, only the verified regex shape and a generous bound.

All interactions on this page are purely client-side: `browser_network_requests` was checked before and after extensive repeated interaction with all four widgets (roughly 20+ button clicks across every widget, including concurrent/rapid-fire clicks and page reloads) and zero XHR/fetch requests specific to any wait/delay action were observed — only the same pre-existing Next.js RSC prefetch requests for unrelated nav links documented on every other component page in this suite. This plan therefore contains no API-level test coverage; every delay is implemented client-side (almost certainly via `setTimeout`), confirmed by the complete absence of any network activity correlating with any of the four buttons' delayed effects. No JavaScript console errors or warnings were observed during any exploration flow, including during concurrent/overlapping-timer trials.

**Data-testid / id inventory (verified live via `document.querySelectorAll` and `outerHTML` inspection):**
- `[data-testid="form-label"]` (×4) — exact text, in DOM order: `Wait and Accept the alert`, `Wait for an element to appear`, `Wait for text to change`, `Wait for an element to disappear`.
- `[data-testid="button-wait-for-alert"]` — `<button>` reading exactly `Wait for alert!`. Not disabled by default; confirmed to remain NOT disabled (`.disabled === false`, no `aria-disabled`) even while its own delay is actively pending.
- `[data-testid="button-wait-for-element"]` — `<button>` reading exactly `Wait for element!`.
- `[data-testid="button-wait-for-text"]` — `<button>` reading exactly `Wait for text change!`. Sits directly above a static `<p class="text-secondary mt-1"><span class="text-md font-semibold">Text to update: </span><span id="update-text">Initial text...</span></p>` — only the inner `#update-text` span's content ever changes; the `Text to update: ` prefix and wrapping `<p>` are permanent/static.
- `[data-testid="button-wait-for-disappearance"]` — `<button>` reading exactly `Wait for disappearance!`.
- `#dynamic-text` — a `<p id="dynamic-text" class="mt-1 text-green-600">` that does NOT exist in the DOM at all on fresh load or after reload (confirmed via `document.getElementById('dynamic-text') === null`, not merely CSS-hidden). Appears only after `button-wait-for-element` is clicked, holding text matching `Element appeared after [\d.]+ seconds!` (every observed sample used exactly one decimal digit, e.g. `2.7`, `3.9`, `4.0`).
- `#update-text` — a `<span id="update-text">`, always present in the DOM (part of the static paragraph), reading exactly `Initial text...` on fresh load/after reload, and `Text changed after [\d.]+ seconds!` after `button-wait-for-text` is clicked and its delay elapses.
- `#disappearing-element` — a `<div id="disappearing-element" class="mt-4 bg-red-200 p-2 text-center">I will disappear!</div>` that does NOT exist in the DOM at all on fresh load or after reload (confirmed via `document.getElementById('disappearing-element') === null`). Its text is always the static literal string `I will disappear!` — it never contains a randomized-delay message (unlike the other three widgets' payloads).
- The "Insight" section (heading level 2; paragraph `On completion of this exercise, you can learn the following concepts:`; concept list: `Wait for an alert dialog to appear after a delay`, `Wait for an element to appear in the DOM`, `Wait for text content to change`, `Wait for an element to disappear`; Github solution link to `https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/wait/wait.spec.ts`) is visible immediately with no expand/interaction required, matching every other component page's pattern.

**Confirmed behaviors and verified delay bounds (all independently re-verified live during this exploration pass via precise `Date.now()`/`window.alert` monkey-patch instrumentation, NOT assumed from the legacy spec's stale ~2.1-3.1s comment):**
- The delayed alert's on-screen message text was cross-checked against real wall-clock elapsed time (via a monkey-patched `window.alert` recording `Date.now()` at the instant it fires, paired with a precisely recorded click timestamp) on two separate trials and matched within ~50ms both times (e.g. measured 2155ms elapsed vs. message `2.1 seconds`; measured 3323ms elapsed vs. message `3.3 seconds`) — confirming the app's self-reported "X.X seconds" message text is an accurate, trustworthy reflection of the real delay, not a cosmetic/unrelated number.
- **Alert button real observed delay range across 7 live trials:** 2.1s, 2.1s, 2.7s, 3.3s, 3.4s, 3.9s, 3.9s — i.e. roughly 2.1s to 3.9s observed, with genuine variation confirmed (not a fixed constant).
- **Element-appear button real observed delay range across 8 live trials:** 2.3s, 2.5s, 2.6s, 2.7s, 2.7s, 2.8s, 3.8s, 3.9s, 4.0s — roughly 2.3s to 4.0s observed.
- **Text-change button real observed delay range across 5 live trials:** 2.3s, 2.5s, 2.8s, 3.8s, 3.9s — roughly 2.3s to 3.9s observed.
- **Disappearance widget:** the initial appearance is near-instantaneous — 22ms, 31ms, 32ms measured across 3 trials (essentially not a meaningful randomized wait, unlike the other three widgets). The SUBSEQUENT disappearance (after appearing) is genuinely delayed and randomized: 2062ms, 2162ms, 2601ms, 3031ms, 3664ms measured across 5 trials — roughly 2.1s to 3.7s observed. Combining all widgets, every multi-second delay observed across this entire exploration pass (~20 trials total) fell between 2.1s and 4.0s; this plan's helpers use a 10000ms timeout (matching the legacy spec's convention) as a generous, non-flaky bound, and no scenario asserts a specific delay value.
- **[Confirmed, significant quirk] Clicking a delay-trigger button again while its OWN previous cycle is still pending does not cancel, reset, ignore, or merge with the prior click — each click schedules a fully independent, separately-randomized timer.** For the alert button, this was directly confirmed: two clicks made ~200ms apart produced TWO separate sequential native `alert()` dialogs — the second dialog only became visible immediately after the first was dismissed (queued by the browser's single-threaded JS execution, not merged into one), with each dialog showing its own independently-generated delay message (e.g. `Alert after 3.4 seconds!` then `Alert after 3.9 seconds!`). For the element-appear button, a rapid 3-click trial (clicks 0ms/100ms/200ms apart) produced exactly THREE distinct sequential text changes to `#dynamic-text` over the following ~4 seconds (`2.5 seconds!` at 2.66s, `2.7 seconds!` at 2.96s, `3.8 seconds!` at 3.86s) — confirming three independently-scheduled timers, where each one overwrites whatever `#dynamic-text` currently shows the moment it fires (last-to-fire wins; earlier text is real and observable for a window, not skipped).
- **[Confirmed]** Re-clicking the element-appear button after its element has ALREADY appeared does not remove/reset the element first — the existing (old) text remains visible for the full duration of the new delay, then updates directly to the new message with no intermediate blank/removed state (confirmed: `immediateText` read right after the second click equalled the pre-click text, unchanged, until the new delay elapsed).
- **[Confirmed]** Re-clicking the text-change button after the text has ALREADY changed once behaves identically — the previously-changed text remains displayed unchanged until the new delay elapses, then updates directly to the newly-generated message; it never reverts to `Initial text...` as an intermediate step.
- **[Confirmed]** Re-clicking the disappearance button while its element is already visible does not produce an observable second "appear" transition and does not extend/reset the pending disappearance — only a single disappearance transition was observed within the following ~9 second observation window in this trial.
- **[Confirmed]** The disappearance widget's full appear→disappear cycle can be repeated multiple times back-to-back on the same page load, with no reload required, and each fresh cycle independently reproduces the near-instant appearance (~20-30ms) followed by a randomized multi-second disappearance.
- **[Confirmed]** Triggering the element-appear, text-change, and disappearance widgets simultaneously (all three clicked within the same tick) completes all three independently and correctly with no observable cross-interference — final states and elapsed times for each matched their individually-observed behavior.
- **[Confirmed]** None of the four buttons become disabled while their own delay is pending (`.disabled` remains `false`, no `aria-disabled` attribute appears) — this is a direct, confirmed enabling factor behind the re-click/concurrent-timer quirk above, since nothing prevents a user (or a test) from clicking again mid-cycle.
- **[Confirmed]** Keyboard activation works for these native `<button>` elements: focusing `button-wait-for-element` directly and pressing `Enter` triggered its full delayed-appearance cycle exactly as a mouse click would; focusing `button-wait-for-text` and pressing `Space` triggered its full delayed-text-change cycle exactly as a mouse click would. Both were independently confirmed live.
- **[Confirmed] No state persists across a page reload for any of the four widgets:** after fully completing an element-appear cycle and a text-change cycle (both waited to full completion, not mid-flight, to avoid the reload race described below) and then reloading, `#dynamic-text` was absent again, `#update-text` read `Initial text...` again, and `#disappearing-element` was absent again — confirmed by direct DOM re-inspection after `page.goto()` following prior interaction.
- **[Confirmed] Reload-during-pending-timer race, alert button specifically (flagged as a timing race, not a deterministic guarantee — see Ambiguous section):** in one live trial, clicking the alert button and then immediately calling `page.goto()` to reload (well before the minimum ~2.1s observed delay had elapsed) did NOT reliably prevent the originally-scheduled `alert()` from surfacing — the dialog momentarily appeared post-navigation-call with its original delay message, before ultimately being auto-dismissed. This plan's scenarios deliberately avoid reloading while any multi-second-delay widget has a not-yet-fired pending timer, and only reload after a full cycle has completed, to sidestep this race entirely rather than assert an unreliable outcome.
- All four widgets are fully independent of one another: interacting with any one produced no observable change in any of the other three throughout this entire exploration pass.

**Known bugs / notable quirks:**
1. **[Confirmed, most significant finding, not a bug but a real non-obvious behavior]** Re-clicking any of the three multi-second-delay buttons (alert/element/text) while a previous click's delay for that SAME button is still pending schedules a fully independent, separately-timed second cycle rather than cancelling/replacing/queuing-into the first. For the alert button this produces two separate sequential native dialogs a test MUST handle both of (an un-awaited second dialog left unhandled will hang or fail the test). For element-appear/text-change, it produces a real, observable intermediate state from whichever timer fires first, later silently overwritten by whichever fires last — tests asserting a "final" value after multiple rapid clicks must not assume the first timer's result persists.
2. **[Confirmed, not a bug but easily misunderstood]** The disappearance widget's *appearance* is near-instant (~20-35ms) — it is only the *disappearance* that is meaningfully delayed/randomized (~2.1-3.7s observed). A test author naively assuming both transitions are equally "waited for" could mistakenly assert a generous wait on the appearance step where none is really needed, or (worse) miss that the disappearing element's own text never contains a delay message at all (always the static `I will disappear!`).
3. **[Confirmed, timing race]** Reloading immediately after clicking the alert button, before its delay has elapsed, does not reliably cancel the pending native `alert()` — the dialog can still transiently surface during/after the reload. This plan avoids scenarios that depend on a specific outcome here.
4. **[Confirmed, discovered during test implementation — resolves the decimal-precision ambiguity below]** The displayed "X.X seconds" delay is rounded to one decimal digit, giving only ~19-20 distinct possible values across the observed 2.1s-4.0s range. With that few buckets, two or more independently-randomized delays from separate clicks land on the exact same displayed text often enough to be a real, repeatable occurrence — not a rare edge case (observed directly in test runs: two separate alert/text-change trials both producing `"...3.0 seconds!"`). Any test logic comparing displayed message TEXT to distinguish "this is a new/different timer firing" from "this is the same timer's earlier value still showing" is unreliable for exactly this reason. Two of this plan's own scenarios (6.2, 6.3) were revised specifically to avoid content-equality as a completion/distinctness signal: 6.2 counts DOM mutations directly (a `MutationObserver`-based count, immune to the two written values coincidentally matching) rather than counting distinct text values, and 6.3 waits out `GENEROUS_TIMEOUT` unconditionally after the second click rather than polling for the text to differ from the first-recorded message. Any future scenario on this page that needs to prove "a second/independent write occurred" should use one of these two approaches, not text-content comparison.

**Ambiguous/unverified areas explicitly flagged for testers:**
- The exact statistical distribution of the randomized delay (e.g. uniform random between a fixed min/max) was not mathematically determined — only empirically observed to range roughly 2.1s-4.0s across ~20 total live trials in this pass. These are real observed bounds used to justify this plan's generous timeout recommendation, not a guaranteed hard min/max enforced by the app; a future run could in principle land slightly outside this window, which is exactly why every scenario in this plan uses a generous (≥10000ms) timeout rather than a tight one keyed to these specific numbers.
- Whether 4+ concurrent/rapid clicks on the same button compound further in the same "each click gets its own independent timer" pattern was not verified beyond the explicitly-tested 2-click (alert) and 3-click (element) cases.
- Whether `dialog.dismiss()` produces any different outcome than `dialog.accept()` for these `alert()`-type dialogs was not independently exercised — native `alert()` dialogs expose only a single "OK"-equivalent action in Chromium, so both are expected to be equivalent, but only `.accept()` was used live during this pass.
- The reload-during-pending-alert-timer race was only observed once, not repeated enough times to characterize deterministically (see Known Quirks #3); no scenario in this plan depends on its specific outcome.
- Touch/mobile-specific interaction (tapping buttons on an emulated touch viewport) was not independently exercised during this pass.
- `ArrowUp`/`ArrowDown`/`Tab`-order traversal across the four buttons was not exercised beyond directly confirming `Enter` (element button) and `Space` (text button) each activate a focused button; the other two buttons were not independently keyboard-tested, though standard native `<button>` keyboard-activation behavior is expected to generalize.
- The "BACK" button in the shared page header was not exercised, consistent with the treatment of this same shared control in the Button, Alert, Form, Input, Drag, Dropdown, Multiselect, Radio, and Simple Table plans.
- The observed decimal-precision format (always exactly one digit after the decimal point, e.g. `2.7`, never `2.73`) held consistently enough across implementation-phase testing that its practical consequence is now confirmed, not just theoretical: see Known Quirk #4 above for the resulting message-collision behavior between independent trials. Scenarios in this plan still match the permissive `[\d.]+ seconds` pattern (as the legacy spec did) rather than assuming exactly one decimal digit, to avoid an unnecessarily brittle assertion.

## Test Scenarios

### 1. Wait - Initial Load and Default State

**Seed:** `tests/seed.spec.ts`

#### 1.1. Wait page loads with all four exercise sections, labels, and Insight section correctly rendered — Priority: Critical

**File:** `tests/components/wait/wait-load.spec.ts`

**Steps:**
  1. Navigate to '/components/wait' on a fresh browser context
    - expect: Page loads successfully (HTTP 200, no console errors)
    - expect: Heading 'Wait' (level 1) is visible
  2. Inspect all four 'form-label' elements in DOM order
    - expect: The four labels read exactly, in order: 'Wait and Accept the alert', 'Wait for an element to appear', 'Wait for text to change', 'Wait for an element to disappear'
  3. Inspect the 'Insight' section without performing any click/expand interaction
    - expect: Heading 'Insight' (level 2) is visible immediately with no interaction required
    - expect: The concept list contains exactly the items 'Wait for an alert dialog to appear after a delay', 'Wait for an element to appear in the DOM', 'Wait for text content to change', 'Wait for an element to disappear'
    - expect: A 'Github solution' link is visible with href 'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/wait/wait.spec.ts'

#### 1.2. Every widget's default state matches the confirmed live baseline on fresh load — Priority: Critical

**File:** `tests/components/wait/wait-load.spec.ts`

**Steps:**
  1. Navigate to '/components/wait' on a fresh browser context. Without clicking any button, inspect all four buttons and the three dynamic targets ('#dynamic-text', '#update-text', '#disappearing-element')
    - expect: 'button-wait-for-alert', 'button-wait-for-element', 'button-wait-for-text', and 'button-wait-for-disappearance' are all visible and enabled (not disabled)
    - expect: '#dynamic-text' does not exist in the DOM (element count is exactly 0, not merely hidden)
    - expect: '#update-text' exists and its text content equals exactly 'Initial text...'
    - expect: '#disappearing-element' does not exist in the DOM (element count is exactly 0, not merely hidden)

### 2. Wait - Delayed Alert Dialog

**Seed:** `tests/seed.spec.ts`

#### 2.1. Clicking the alert button eventually triggers a native alert dialog whose message matches the expected pattern, within a generous timeout — Priority: Critical

**File:** `tests/components/wait/wait-alert.spec.ts`

**Steps:**
  1. Navigate to '/components/wait'. Register a 'dialog' handler BEFORE clicking (to avoid a race with the eventual alert), capturing the dialog's message and calling dialog.accept(). Click 'button-wait-for-alert'
    - expect: Within a generous timeout of at least 10000ms (the maximum delay observed live during this plan's exploration across all trials was ~4.0s; do not use a tighter timeout), a dialog appears and its captured message matches the regex /^Alert after [\d.]+ seconds!$/
    - expect: After acceptance, no dialog remains open and the page is otherwise unchanged (still on '/components/wait')

#### 2.2. The alert delay is genuinely randomized across repeated triggers, not a fixed constant — Priority: High

**File:** `tests/components/wait/wait-alert.spec.ts`

**Steps:**
  1. Navigate to '/components/wait'. Trigger the alert button, capture and accept the dialog message, then repeat two more times (3 total trials), recording each captured message's numeric seconds value each time
    - expect: All 3 captured messages match /^Alert after [\d.]+ seconds!$/
    - expect: The 3 parsed numeric delay values are not all identical to each other — i.e. at least two of the three trials produce a different numeric value, confirming the delay is genuinely randomized per click and not a fixed constant (this plan's own live exploration observed real variation across 7 trials ranging roughly 2.1s-3.9s, so requiring at least one differing pair among 3 trials is a safe, low-flakiness assertion)

#### 2.3. The alert button remains enabled and clickable while its own delay is still pending — Priority: Medium

**File:** `tests/components/wait/wait-alert.spec.ts`

**Steps:**
  1. Navigate to '/components/wait'. Click 'button-wait-for-alert' once (do not wait for the dialog), then immediately check the button's disabled state
    - expect: Immediately after the click, before the dialog has appeared, 'button-wait-for-alert' is still enabled (not disabled) — confirming the button does not lock itself while a delay is pending
  2. Register a dialog handler and wait for the pending dialog to appear (generous timeout ≥10000ms), then accept it to clean up
    - expect: The dialog eventually appears and is accepted without error, leaving the page in a clean state for subsequent tests

### 3. Wait - Element Appears After Delay

**Seed:** `tests/seed.spec.ts`

#### 3.1. '#dynamic-text' is absent by default and appears with the expected message after clicking, within a generous timeout — Priority: Critical

**File:** `tests/components/wait/wait-element.spec.ts`

**Steps:**
  1. Navigate to '/components/wait'. Confirm '#dynamic-text' does not exist in the DOM before interacting
    - expect: '#dynamic-text' locator resolves to 0 elements before any interaction
  2. Click 'button-wait-for-element'
    - expect: Within a generous timeout of at least 10000ms, '#dynamic-text' becomes visible with text content matching the regex /^Element appeared after [\d.]+ seconds!$/

#### 3.2. The element-appear delay is genuinely randomized across repeated triggers on fresh page loads — Priority: High

**File:** `tests/components/wait/wait-element.spec.ts`

**Steps:**
  1. On 3 separate fresh navigations to '/components/wait', click 'button-wait-for-element' once each time and record the numeric seconds value parsed from '#dynamic-text' once it appears (generous timeout ≥10000ms each trial)
    - expect: All 3 recorded texts match /^Element appeared after [\d.]+ seconds!$/
    - expect: The 3 parsed numeric delay values are not all identical — at least two of the three trials differ, confirming genuine randomization (this plan's own exploration observed real variation across 8 trials ranging roughly 2.3s-4.0s)

### 4. Wait - Text Content Change After Delay

**Seed:** `tests/seed.spec.ts`

#### 4.1. '#update-text' reads 'Initial text...' by default and changes to the expected message after clicking, within a generous timeout — Priority: Critical

**File:** `tests/components/wait/wait-text.spec.ts`

**Steps:**
  1. Navigate to '/components/wait'. Confirm '#update-text' reads exactly 'Initial text...' before interacting, and that the surrounding static prefix 'Text to update: ' is visible alongside it
    - expect: '#update-text' text content equals exactly 'Initial text...'
  2. Click 'button-wait-for-text'
    - expect: Within a generous timeout of at least 10000ms, '#update-text' text content changes to match the regex /^Text changed after [\d.]+ seconds!$/, and no longer equals 'Initial text...'

#### 4.2. The text-change delay is genuinely randomized across repeated triggers on fresh page loads — Priority: High

**File:** `tests/components/wait/wait-text.spec.ts`

**Steps:**
  1. On 3 separate fresh navigations to '/components/wait', click 'button-wait-for-text' once each time and record the numeric seconds value parsed from '#update-text' once it changes (generous timeout ≥10000ms each trial)
    - expect: All 3 recorded texts match /^Text changed after [\d.]+ seconds!$/
    - expect: The 3 parsed numeric delay values are not all identical — at least two of the three trials differ, confirming genuine randomization (this plan's own exploration observed real variation across 5 trials ranging roughly 2.3s-3.9s)

### 5. Wait - Element Disappearance Cycle

**Seed:** `tests/seed.spec.ts`

#### 5.1. '#disappearing-element' is absent by default, appears almost instantly after clicking with the exact static text, then disappears again after a further randomized delay — Priority: Critical

**File:** `tests/components/wait/wait-disappear.spec.ts`

**Steps:**
  1. Navigate to '/components/wait'. Confirm '#disappearing-element' does not exist in the DOM before interacting
    - expect: '#disappearing-element' locator resolves to 0 elements before any interaction
  2. Click 'button-wait-for-disappearance'
    - expect: '#disappearing-element' becomes visible within a short timeout (e.g. 2000ms — its appearance was measured live at only ~20-35ms, far faster than the other three widgets' multi-second delays, so a short timeout here is intentional and appropriate, not a mistake)
    - expect: '#disappearing-element' text content equals exactly the static string 'I will disappear!' — NOT a randomized-delay message (this element never displays a 'seconds' message, unlike the other three widgets)
  3. Continue waiting after the element becomes visible
    - expect: Within a generous timeout of at least 10000ms measured from when the element first became visible, '#disappearing-element' becomes hidden/removed from the DOM again (this plan's own exploration observed the disappearance-after-appearing delay ranging roughly 2.1s-3.7s across 5 trials)

#### 5.2. The full appear-then-disappear cycle can be repeated a second time on the same page load, with no reload required — Priority: Medium

**File:** `tests/components/wait/wait-disappear.spec.ts`

**Steps:**
  1. Navigate to '/components/wait'. Click 'button-wait-for-disappearance' and wait for the full cycle to complete (element appears, then disappears again, generous timeout ≥10000ms total)
    - expect: '#disappearing-element' is absent again after the first full cycle completes
  2. Without reloading, click 'button-wait-for-disappearance' a second time
    - expect: '#disappearing-element' becomes visible again within a short timeout (~2000ms), with text exactly 'I will disappear!', confirming the near-instant appearance reproduces correctly on a second cycle without needing a page reload
    - expect: Within a further generous timeout (≥10000ms), '#disappearing-element' becomes hidden/removed again, confirming the full round-trip repeats correctly

### 6. Wait - Concurrent and Repeated-Click Quirks

**Seed:** `tests/seed.spec.ts`

#### 6.1. [QUIRK] Clicking the alert button twice in quick succession while the first delay is still pending produces TWO separate sequential dialogs, not one merged/ignored click — Priority: High

**File:** `tests/components/wait/wait-concurrency.spec.ts`

**Steps:**
  1. Navigate to '/components/wait'. Register a dialog collector that records every dialog's message and accepts each one as it appears. Click 'button-wait-for-alert', wait ~200ms, then click 'button-wait-for-alert' again (a second, independent click while the first click's delay is still pending)
    - expect: Within a generous combined timeout (≥15000ms, since two sequential delayed dialogs must both surface), exactly 2 dialogs are captured in total — not 1 (proving the second click was not ignored/deduped) and not more than 2
    - expect: Both captured messages independently match the regex /^Alert after [\d.]+ seconds!$/
    - expect: The second dialog only becomes visible/handleable AFTER the first has been accepted (i.e. they are shown sequentially, one at a time, never simultaneously) — confirming the two independently-scheduled timers both resolve to a real, separately-handled native dialog rather than one click being discarded

#### 6.2. [QUIRK] Clicking the element-appear button three times in rapid succession while prior delays are still pending produces three distinct sequential text changes, with the LAST-firing timer's message as the final displayed state — Priority: High

**File:** `tests/components/wait/wait-concurrency.spec.ts`

**Steps:**
  1. Navigate to '/components/wait'. Start counting DOM mutations under `<body>` (via a `MutationObserver`), click 'button-wait-for-element' three times in rapid succession (roughly 100ms apart), then wait out the ~9 second observation window and stop counting
    - expect: More than 1 DOM mutation is observed (proving at least a second click's timer independently wrote to the DOM, not silently discarded or merged) — implemented via a mutation count, NOT a count of distinct text values, since the displayed delay is rounded to one decimal and two of the three independent random delays can coincidentally render identical text (confirmed live — see Known Quirk #4), which would make a distinct-values count unreliable
    - expect: The FINAL text present at the end of the observation window matches /^Element appeared after [\d.]+ seconds!$/ (i.e. whichever of the three independent timers fired last determines the settled end-state)

#### 6.3. [QUIRK] Re-clicking the text-change button after the text has already changed once does not revert it to 'Initial text...' as an intermediate step — it stays at the old changed value until the new delay elapses — Priority: High

**File:** `tests/components/wait/wait-concurrency.spec.ts`

**Steps:**
  1. Navigate to '/components/wait'. Click 'button-wait-for-text' and wait for '#update-text' to change from 'Initial text...' to its first delayed message (generous timeout ≥10000ms). Record this first message
    - expect: '#update-text' matches /^Text changed after [\d.]+ seconds!$/ after the first click's delay elapses
  2. Click 'button-wait-for-text' a second time. Immediately (within the same tick, before any further delay could plausibly have elapsed) re-read '#update-text'
    - expect: '#update-text' still equals the exact first-recorded message, unchanged — it does NOT revert to 'Initial text...' immediately after the second click
  3. Wait out a full GENEROUS_TIMEOUT (≥10000ms) unconditionally from the second click — NOT by polling for the text to differ from the first-recorded message, since the second click's independently-randomized delay can coincidentally render the exact same displayed text as the first (confirmed live — see Known Quirk #4), which would make an inequality-based wait spuriously fail
    - expect: '#update-text' matches /^Text changed after [\d.]+ seconds!$/ once the wait completes, confirming the second click's own independent delay completed and overwrote the display directly, without ever passing through 'Initial text...' as an intermediate state

#### 6.4. [QUIRK] Re-clicking the disappearance button while its element is already visible does not produce an observable duplicate appear/disappear cycle — Priority: Medium

**File:** `tests/components/wait/wait-concurrency.spec.ts`

**Steps:**
  1. Navigate to '/components/wait'. Click 'button-wait-for-disappearance' and wait for '#disappearing-element' to become visible (short timeout ~2000ms). Then, while it is still visible, click 'button-wait-for-disappearance' again
    - expect: '#disappearing-element' remains visible immediately after the second click (no flicker/removal as a side effect of the re-click)
  2. Poll '#disappearing-element' presence continuously over the following ~9 seconds, counting every present-to-absent transition
    - expect: Exactly 1 present-to-absent (disappearance) transition is observed within the window — not 0 (it must still disappear) and not 2+ (no duplicate/overlapping disappearance cycle observably fires as a result of the re-click), consistent with this plan's own live exploration of this exact scenario

### 7. Wait - Cross-Widget Independence and Network/Console Behavior

**Seed:** `tests/seed.spec.ts`

#### 7.1. Triggering the element-appear, text-change, and disappearance widgets simultaneously completes all three independently with no cross-interference — Priority: High

**File:** `tests/components/wait/wait-independence.spec.ts`

**Steps:**
  1. Navigate to '/components/wait'. Click 'button-wait-for-element', 'button-wait-for-text', and 'button-wait-for-disappearance' one immediately after another (within the same short window)
    - expect: All three clicks register without error and without any dialog/interaction blocking the next click
  2. Wait for all three widgets to reach their fully-settled end state (generous timeout ≥10000ms each): '#dynamic-text' appears, '#update-text' changes away from 'Initial text...', and '#disappearing-element' appears then disappears again
    - expect: '#dynamic-text' ends up visible with text matching /^Element appeared after [\d.]+ seconds!$/
    - expect: '#update-text' ends up matching /^Text changed after [\d.]+ seconds!$/
    - expect: '#disappearing-element' ends up absent again after having appeared, confirming its full cycle also completed
    - expect: All three reached their correct, independently-expected end states with no evidence of cross-widget interference (e.g. no widget's timer being blocked, delayed, or corrupted by the other two running concurrently)

#### 7.2. No API/network requests fire as a result of any wait-widget interaction on this page (purely client-side component) — Priority: Medium

**File:** `tests/components/wait/wait-independence.spec.ts`

**Steps:**
  1. Navigate to '/components/wait', begin recording network requests, then trigger and fully complete a cycle on all four widgets (accepting the alert dialog)
    - expect: No XHR/fetch network request specific to any wait-widget action is observed (only the pre-existing Next.js RSC prefetch requests for unrelated nav links, the same pattern documented on every other component page in this suite) — confirming this plan requires no API-level test coverage

#### 7.3. No console errors are logged during any of the four widgets' delay/reveal cycles, including overlapping/concurrent triggers — Priority: Medium

**File:** `tests/components/wait/wait-independence.spec.ts`

**Steps:**
  1. Navigate to '/components/wait', begin tracking console errors, then trigger and fully complete a cycle on all four widgets, including at least one rapid double-click on the alert button (accepting both resulting dialogs)
    - expect: Zero console error messages are logged throughout the entire sequence of interactions, matching the clean-console baseline observed live during this plan's exploration

### 8. Wait - Reload Persistence

**Seed:** `tests/seed.spec.ts`

#### 8.1. No widget state persists across a page reload; all four widgets reset to their documented fresh-load defaults after completing full cycles — Priority: High

**File:** `tests/components/wait/wait-persistence.spec.ts`

**Steps:**
  1. Navigate to '/components/wait'. Trigger 'button-wait-for-element' and 'button-wait-for-text' and wait for BOTH to reach their fully-settled changed state (generous timeout ≥10000ms each) — deliberately waiting for full completion before reloading, to avoid the reload-during-pending-timer race documented for this page
    - expect: Before reload: '#dynamic-text' is visible matching /^Element appeared after [\d.]+ seconds!$/, and '#update-text' matches /^Text changed after [\d.]+ seconds!$/
  2. Reload the page (page.reload())
    - expect: '#dynamic-text' does not exist in the DOM again (back to the fresh-load default of being entirely absent)
    - expect: '#update-text' reads exactly 'Initial text...' again
    - expect: '#disappearing-element' does not exist in the DOM (its own fresh-load default, unaffected by the other two widgets having been exercised)
    - expect: confirming no localStorage/sessionStorage/URL state is involved anywhere on this page for any of the three DOM-mutating widgets

### 9. Wait - Keyboard Interaction

**Seed:** `tests/seed.spec.ts`

#### 9.1. Pressing Enter on a keyboard-focused 'Wait for element!' button triggers the same delayed-appearance cycle as a mouse click — Priority: Medium

**File:** `tests/components/wait/wait-keyboard.spec.ts`

**Steps:**
  1. Navigate to '/components/wait'. Focus 'button-wait-for-element' directly (e.g. via .focus() or Tab navigation) without clicking it, then press 'Enter'
    - expect: Within a generous timeout of at least 10000ms, '#dynamic-text' becomes visible with text matching /^Element appeared after [\d.]+ seconds!$/, identical in shape to the mouse-click result documented in the Element Appears suite, confirming Enter is a fully equivalent activation method for this native <button>

#### 9.2. Pressing Space on a keyboard-focused 'Wait for text change!' button triggers the same delayed text-change cycle as a mouse click — Priority: Medium

**File:** `tests/components/wait/wait-keyboard.spec.ts`

**Steps:**
  1. Navigate to '/components/wait'. Confirm '#update-text' reads 'Initial text...'. Focus 'button-wait-for-text' directly without clicking it, then press 'Space'
    - expect: Within a generous timeout of at least 10000ms, '#update-text' changes to match /^Text changed after [\d.]+ seconds!$/, identical in shape to the mouse-click result documented in the Text Content Change suite, confirming Space is a fully equivalent activation method for this native <button>
