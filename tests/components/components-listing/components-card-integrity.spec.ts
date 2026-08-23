// spec: specs/components-listing.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { ComponentsPage } from '../../pages/ComponentsPage';

test.describe('Components Listing - Card Content Integrity', () => {
  let componentsPage: ComponentsPage;

  test.beforeEach(async ({ page }) => {
    componentsPage = new ComponentsPage(page);
  });

  test('All rendered component cards have a non-empty name, non-empty description, and a valid components/<slug> href, with no duplicate links', async () => {
    // 1. Navigate to '/components' on a fresh browser context (assume no prior filter selection —
    //    this is the default/only state this scenario exercises)
    await componentsPage.gotoComponents();

    // expect: Heading 'Component Showcase' (level 1) is visible
    await expect(componentsPage.heading).toBeVisible();
    // expect: Both filter buttons read exactly 'Difficulty: All' and 'Type: All' (confirming the
    //         default/unfiltered baseline)
    await expect(componentsPage.difficultyFilterButton).toHaveText('Difficulty: All');
    await expect(componentsPage.typeFilterButton).toHaveText('Type: All');

    // 2. Using the Page Object's card-reading helper, query all card root elements via the
    //    '.rounded-xl.shadow-md' selector (read live, not hardcoded to any fixed number)
    const cardCount = await componentsPage.cards.count();

    // expect: The number of matched card-root elements is greater than 0
    expect(cardCount).toBeGreaterThan(0);
    // expect: This same count exactly equals both the count of 'main h2' elements and the count of
    //         'a[href^="components/"]' elements on the page — confirming a 1:1:1 correspondence
    //         between card containers, headings, and links (no orphaned heading or link, no card
    //         missing one of the three)
    await expect(componentsPage.cardHeadings).toHaveCount(cardCount);
    await expect(componentsPage.cardLinks).toHaveCount(cardCount);

    // 3. For each card root (looped, each iteration wrapped in its own test.step for per-card
    //    pass/fail reporting), read its own child '<h2>' text, child '<p>' text, and descendant
    //    'a[href^="components/"]' href attribute
    const cards = await componentsPage.readCards();
    expect(cards.length).toBe(cardCount);

    for (const [index, card] of cards.entries()) {
      await test.step(`card ${index + 1} (${card.name || '<unnamed>'}) has valid name, description, and href`, async () => {
        // expect: The card's name (h2 text, trimmed) is a non-empty string
        expect(card.name.length).toBeGreaterThan(0);
        // expect: The card's description (p text, trimmed) is a non-empty string
        expect(card.description.length).toBeGreaterThan(0);
        // expect: The card's href attribute is present and matches the pattern
        //         '^components/[A-Za-z0-9-]+$' (a valid, non-empty slug directly after the
        //         'components/' prefix, no leading slash — consistent with the convention already
        //         relied on in tests/componentsnavigation.spec.ts)
        expect(card.href).toMatch(/^components\/[A-Za-z0-9-]+$/);
      });
    }

    // 4. Collect the full list of hrefs read across all cards in the loop above
    const hrefs = cards.map((card) => card.href);

    // expect: Every href in the collected list is unique — no two cards share the same href
    //         (verified by comparing the list's length to the length of a de-duplicated Set built
    //         from the same list; they must be equal)
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
