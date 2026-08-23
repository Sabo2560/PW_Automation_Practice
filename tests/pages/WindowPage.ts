import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Window component (https://www.automationplayground.dev/components/window),
 * which presents two independent exercises: "Open New Tab" (a real `target="_blank"` anchor —
 * genuine multi-tab browser behavior) and "Open Modal" (a same-page MUI Modal overlay — despite
 * its name, NOT a native browser window/popup at all). See specs/window.plan.md for full detail.
 *
 * Both trigger buttons share the identical `data-testid="button-button"` (confirmed live:
 * `document.querySelectorAll('[data-testid="button-button"]')` returns 2 elements), so they must
 * always be located by accessible role+name here, never by that shared data-testid alone.
 */
export class WindowPage extends BasePage {
  readonly openNewTabButton: Locator;
  readonly openModalButton: Locator;
  readonly modal: Locator;
  readonly modalTitleText: Locator;
  readonly modalBodyText: Locator;
  readonly closeModalButton: Locator;
  readonly modalBackdrop: Locator;
  readonly header: Locator;
  readonly main: Locator;

  constructor(page: Page) {
    super(page);
    // Both buttons share the identical data-testid="button-button" — located by accessible
    // role+name instead, which is unique since the two buttons' visible text differs.
    // `includeHidden: true` is required because MUI applies `aria-hidden="true"` to <main> (which
    // contains both buttons) for the entire duration the modal is open (see specs/window.plan.md
    // §3.2) — getByRole() excludes elements hidden from the accessibility tree by default, which
    // would otherwise make these locators fail to resolve at all (not merely read as hidden)
    // whenever the modal is open. The buttons are never actually inaccessible except via this one
    // aria-hidden-ancestor mechanism, so this doesn't loosen matching in any other situation.
    this.openNewTabButton = page.getByRole('button', { name: 'Open New Tab', includeHidden: true });
    this.openModalButton = page.getByRole('button', { name: 'Open Modal', includeHidden: true });
    this.modal = page.getByTestId('window-modal');
    // A plain <span class="underline">, not a heading-role element.
    this.modalTitleText = this.modal.getByText('Good job!', { exact: true });
    // Regex match deliberately used: the raw HTML source contains an embedded newline and extra
    // indentation whitespace inside the text node, which Playwright's whitespace-normalizing text
    // matcher handles, but a byte-exact string should not be relied on.
    this.modalBodyText = this.modal.getByText(/This modal is now ready for its coffee break/);
    this.closeModalButton = page.getByTestId('close-modal');
    // Only available locator for the backdrop — it carries no data-testid. CSS-class-dependent
    // and fragile, but the best available option (documented in specs/window.plan.md).
    this.modalBackdrop = page.locator('.MuiBackdrop-root');
    this.header = page.locator('header');
    this.main = page.locator('main');
  }

  async gotoWindow() {
    const response = await this.goto('/components/window');
    await expect(this.page.getByRole('heading', { name: 'Window', level: 1 })).toBeVisible();
    return response;
  }

  /**
   * Locator for the '/new-tab-page' route's own heading, scoped to the given Page (a new tab
   * opened via openNewTabAndGetNewPage()). That page shares the site's header chrome, which
   * itself renders an `<h1>Automation Playground</h1>` branding link — the same two-`<h1>`
   * heading-hierarchy issue already documented in README.md's known-findings for the home page.
   * An unqualified `getByRole('heading', { level: 1 })` therefore matches 2 elements and throws a
   * strict-mode violation; filtering by name resolves to exactly the page's own heading.
   */
  newTabPageHeading(newTabPage: Page): Locator {
    return newTabPage.getByRole('heading', { level: 1, name: 'Congratulations! You opened new tab.' });
  }

  /**
   * Clicks 'Open New Tab' and waits for the resulting new browser tab (a genuine
   * `target="_blank"` navigation, confirmed live — not a `window.open()` popup), returning its
   * Page object once it has finished loading. Each click opens an entirely new, independent tab;
   * repeated calls never reuse or replace a previously-opened tab (confirmed live across 3
   * separate clicks producing 3 separate tab objects).
   */
  async openNewTabAndGetNewPage(): Promise<Page> {
    const [newPage] = await Promise.all([this.page.context().waitForEvent('page'), this.openNewTabButton.click()]);
    await newPage.waitForLoadState();
    return newPage;
  }

  /** Clicks 'Open Modal' and waits until the modal is visible before returning. */
  async openModalAndWait() {
    await this.openModalButton.click();
    await expect(this.modal).toBeVisible();
  }

  /** Clicks the close ('x') button and waits until the modal is fully removed from the DOM. */
  async closeModalViaX() {
    await this.closeModalButton.click();
    await expect(this.modal).toHaveCount(0);
  }

  /** Presses Escape and waits until the modal is fully removed from the DOM. */
  async closeModalViaEscape() {
    await this.page.keyboard.press('Escape');
    await expect(this.modal).toHaveCount(0);
  }

  /**
   * Clicks the backdrop at a point clearly outside the modal's centered content box (near the
   * backdrop's own top-left corner, since the backdrop spans the full viewport) and waits until
   * the modal is fully removed from the DOM — a same-tick synchronous DOM check can read React's
   * pre-flush state, confirmed during this plan's own exploration, so this polls via a web-first
   * assertion rather than asserting synchronously right after the click.
   */
  async closeModalViaBackdropClick() {
    await this.modalBackdrop.click({ position: { x: 10, y: 10 } });
    await expect(this.modal).toHaveCount(0);
  }

  /**
   * Asserts that, after closing the modal via any of its three close mechanisms (the 'x' button,
   * Escape, or a backdrop click), the pre-open page state has been fully restored: the modal is
   * removed from the DOM, focus has returned to the 'Open Modal' trigger button (chromium/firefox
   * only — see the `browserName` param doc below for the WebKit exception), <header>/<main> no
   * longer carry aria-hidden='true', and document.body's inline style.overflow is reset to its
   * pre-open (empty string) value. All three close mechanisms are confirmed live
   * (specs/window.plan.md §4) to restore identical state, so this single helper is shared by each
   * corresponding close-mechanism test rather than repeating the same assertion block three times.
   *
   * @param browserName When `'webkit'`, the focus-restoration assertion is skipped entirely rather
   * than asserted either way. WebKit's focus-on-click behavior for buttons is OS-dependent, not
   * just engine-dependent: local Windows Playwright WebKit was confirmed live to never focus the
   * button on click (document.activeElement stayed `<body>` throughout, a 1.8s/6-poll check ruled
   * out a timing race) — but CI's Linux WebKit build was confirmed, deterministically across
   * multiple runs and retries, to focus the button instead (the exact opposite outcome from the
   * same test code). Since this genuinely differs by environment, not just by engine, no single
   * expected state is portable — asserting either specific state is a real, recurring CI-failure
   * risk, unlike the analogous WebKit skip in specs/radio.plan.md (that one is a stable per-engine
   * difference, not one that flips by OS). The other 3 checks below remain strict on all 3
   * browsers since they don't depend on this platform-specific quirk.
   */
  async expectClosedStateFullyRestored(browserName?: string) {
    await expect(this.modal).toHaveCount(0);
    if (browserName !== 'webkit') {
      await expect(this.openModalButton).toBeFocused();
    }
    await expect(this.header).not.toHaveAttribute('aria-hidden', 'true');
    await expect(this.main).not.toHaveAttribute('aria-hidden', 'true');
    // No Playwright locator equivalent exists for reading an element's inline style property, so
    // page.evaluate() is used deliberately here, consistent with window-modal-open.spec.ts.
    const bodyOverflow = await this.page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).toBe('');
  }

  /**
   * Checks, via `document.activeElement`, whether focus currently sits inside the modal container
   * (a descendant of '[data-testid="window-modal"]'). No Playwright locator equivalent exists for
   * reading document.activeElement directly, so page.evaluate() is used deliberately here.
   */
  async isFocusInsideModal(): Promise<boolean> {
    return this.page.evaluate(() => {
      const modal = document.querySelector('[data-testid="window-modal"]');
      const active = document.activeElement;
      return !!(modal && active && modal.contains(active));
    });
  }

  /**
   * Checks, via `document.elementFromPoint()` at `locator`'s bounding-box center, whether the
   * modal backdrop is the element intercepting pointer-event hit-testing at that point.
   *
   * Exists specifically because a REAL Playwright `.click()` on a background element obscured by
   * the modal's backdrop was confirmed to hang indefinitely (30+ minutes) rather than fail fast —
   * callers must use this check instead of ever attempting a real click on obscured background
   * content while the modal is open.
   */
  async isElementObscuredByBackdrop(locator: Locator): Promise<boolean> {
    const box = await locator.boundingBox();
    if (!box) throw new Error('isElementObscuredByBackdrop: target locator has no bounding box.');
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    return this.page.evaluate(
      ({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        return !!el?.closest('.MuiBackdrop-root');
      },
      { x, y }
    );
  }
}
