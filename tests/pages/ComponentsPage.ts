import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/** A single component card's data, read live off the DOM (never hardcoded). */
export interface ComponentCard {
  name: string;
  description: string;
  href: string | null;
}

export type DifficultyOption = 'All' | 'Beginner' | 'Advanced';
export type TypeOption = 'All' | 'Static' | 'API';

/**
 * Page Object for the Components Listing page (https://www.automationplayground.dev/components),
 * which presents a "Component Showcase" heading, two client-side filter dropdown buttons
 * (Difficulty / Type), and a responsive grid of component cards. See
 * specs/components-listing.plan.md for full detail.
 *
 * No `data-testid` exists anywhere on the card container, heading, paragraph, or link (confirmed
 * live, see plan) — `cards` is therefore necessarily CSS-class-dependent on `.rounded-xl.shadow-md`,
 * the same fragile-but-best-available situation already documented/accepted for
 * `WindowPage.ts`'s `modalBackdrop` (`.MuiBackdrop-root`). Card hrefs come without a leading slash
 * (e.g. `components/input`, not `/components/input`) — the same convention already relied on in
 * `tests/components-listing/components-navigation.spec.ts`.
 */
export class ComponentsPage extends BasePage {
  readonly heading: Locator;
  readonly difficultyFilterButton: Locator;
  readonly typeFilterButton: Locator;
  readonly cards: Locator;
  readonly cardLinks: Locator;
  readonly cardHeadings: Locator;
  readonly emptyStateHeading: Locator;
  readonly emptyStateMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Component Showcase', level: 1 });
    // Matched by their leading label rather than an exact string, since their own accessible name
    // changes with the currently-selected option (e.g. 'Difficulty: All' -> 'Difficulty: Beginner').
    this.difficultyFilterButton = page.getByRole('button', { name: /^Difficulty:/ });
    this.typeFilterButton = page.getByRole('button', { name: /^Type:/ });
    // Confirmed live: resolves to exactly the 16 card containers currently on the page, and to no
    // other element anywhere on the page — the only available stable selector for "one card".
    this.cards = page.locator('.rounded-xl.shadow-md');
    this.cardLinks = page.locator('a[href^="components/"]');
    this.cardHeadings = page.locator('main h2');
    this.emptyStateHeading = page.getByRole('heading', { name: 'No components found', level: 3 });
    this.emptyStateMessage = page.getByText('Try adjusting your filters to see more results.');
  }

  async gotoComponents() {
    const response = await this.goto('/components');
    await expect(this.heading).toBeVisible();
    return response;
  }

  /**
   * Reads every currently-visible card's own name (`h2` text), description (`p` text), and link
   * `href`, live off the DOM — never hardcoded. Reused by both the card-integrity scenario (which
   * validates every field per card) and the filter scenarios (which only need the resulting `href`
   * set, via `getVisibleHrefs()` below).
   */
  async readCards(): Promise<ComponentCard[]> {
    return this.cards.evaluateAll((cards) =>
      cards.map((card) => ({
        name: (card.querySelector('h2')?.textContent ?? '').trim(),
        description: (card.querySelector('p')?.textContent ?? '').trim(),
        href: card.querySelector('a[href^="components/"]')?.getAttribute('href') ?? null,
      }))
    );
  }

  /** The `href` of every currently-visible card, live off the DOM. Convenience wrapper over `readCards()`. */
  async getVisibleHrefs(): Promise<string[]> {
    const cards = await this.readCards();
    return cards.map((card) => card.href).filter((href): href is string => !!href);
  }

  /**
   * Opens the Difficulty dropdown and selects `option`, waiting for the button's own label to
   * reflect the new selection before returning. The opened `menu`'s accessible name equals the
   * button's current label (which is about to change), so the `menuitem` is matched via role only.
   */
  async selectDifficulty(option: DifficultyOption) {
    await this.difficultyFilterButton.click();
    await this.page.getByRole('menuitem', { name: option, exact: true }).click();
    await expect(this.difficultyFilterButton).toHaveText(`Difficulty: ${option}`);
  }

  /** Opens the Type dropdown and selects `option`, waiting for the button's own label to update. */
  async selectType(option: TypeOption) {
    await this.typeFilterButton.click();
    await this.page.getByRole('menuitem', { name: option, exact: true }).click();
    await expect(this.typeFilterButton).toHaveText(`Type: ${option}`);
  }
}
