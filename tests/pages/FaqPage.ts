import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the FAQ page (https://www.automationplayground.dev/faq), a top-level page (a
 * peer of the Home page and the Components Listing page, NOT a component under /components/*)
 * presenting one intro paragraph followed by 9 independently-toggleable question/answer items
 * (a custom div/button-based expand-collapse widget — confirmed NOT a native <details>/<summary>
 * and NOT MUI-based). See specs/faq.plan.md for full detail.
 *
 * No `data-testid` attribute exists anywhere on this page (confirmed live). Item wrappers are
 * therefore located via the CSS class combination `.bg-gray-100.text-gray-600.py-2`, confirmed
 * live via `document.querySelectorAll` to resolve to exactly 9 elements matching the 9 buttons
 * 1:1 — the same class-selector-is-the-only-option situation already accepted for
 * `ComponentsPage.ts`'s card locator (`.rounded-xl.shadow-md`) and `WindowPage.ts`'s
 * `.MuiBackdrop-root`.
 *
 * CONFIRMED QUIRK: the button's `aria-controls` value and the answer panel's matching `id` are
 * React `useId()`-generated strings (e.g. `_R_1inpfdb_`) — framework-internal, unstable
 * identifiers, never authored/stable content. `getAnswerText()` below therefore always locates
 * the answer text via DOM child structure relative to the item wrapper, never by constructing or
 * relying on that id.
 */
export class FaqPage extends BasePage {
  readonly introParagraph: Locator;
  readonly items: Locator;

  constructor(page: Page) {
    super(page);
    this.introParagraph = page.getByText(
      'Welcome to the Automation Playground FAQ! Here you’ll find answers to the most common questions about how the Playground works, who it’s for, and what you can do here.',
      { exact: true }
    );
    // No data-testid exists anywhere on this page — the 9 item wrappers are located via this CSS
    // class combination instead (see class doc comment above).
    this.items = page.locator('.bg-gray-100.text-gray-600.py-2');
  }

  /** Navigates to '/faq' and asserts the intro paragraph is visible, as a load-confirmation
   * anchor in place of a page-specific heading (this page has none — confirmed live). */
  async gotoFaq() {
    const response = await this.goto('/faq');
    await expect(this.introParagraph).toBeVisible();
    return response;
  }

  /**
   * Returns the single item wrapper Locator whose button's accessible name contains
   * `questionText`. The button's full accessible name is the question text plus a trailing ' v'
   * chevron glyph (e.g. 'Do I need to install anything to use the Playground? v'), so this
   * deliberately relies on getByRole's default substring-match semantics, not an exact-string
   * comparison against the bare question.
   */
  getItem(questionText: string): Locator {
    return this.items.filter({ has: this.page.getByRole('button', { name: questionText }) });
  }

  /** Clicks the item's button, toggling its expanded/collapsed state. */
  async toggleItem(questionText: string) {
    await this.getItem(questionText).getByRole('button').click();
  }

  /** Reads the item's button `aria-expanded` attribute; true only when it is exactly 'true'. */
  async isExpanded(questionText: string): Promise<boolean> {
    const value = await this.getItem(questionText).getByRole('button').getAttribute('aria-expanded');
    return value === 'true';
  }

  /**
   * Reads the item's visible answer text, located via the `.whitespace-pre-line` descendant of
   * the item wrapper — deliberately NOT via the button's `aria-controls` id (see the CONFIRMED
   * QUIRK class doc comment above on why that id must never be hardcoded or relied upon). The
   * panel is present in the DOM regardless of expanded/collapsed state (only visually toggled via
   * a CSS class), so this resolves whether or not the item is currently open.
   */
  async getAnswerText(questionText: string): Promise<string> {
    const text = await this.getItem(questionText).locator('.whitespace-pre-line').textContent();
    return text ?? '';
  }

  /** Reads all 9 question texts (the `<span class="font-bold">` in each item) live, in DOM order. */
  async getAllQuestionTexts(): Promise<string[]> {
    return this.items.locator('.font-bold').allTextContents();
  }
}
