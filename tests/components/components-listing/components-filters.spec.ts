// spec: specs/components-listing.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { ComponentsPage } from '../../pages/ComponentsPage';

test.describe('Components Listing - Difficulty and Type Filters', () => {
  let componentsPage: ComponentsPage;

  test.beforeEach(async ({ page }) => {
    componentsPage = new ComponentsPage(page);
  });

  test("Selecting a Difficulty filter value narrows the visible cards to a correct, non-overlapping, exhaustive subset", async () => {
    // 1. Navigate to '/components' on a fresh browser context. Read the full unfiltered set of card
    //    hrefs live (the 'All' baseline) before touching any filter
    await componentsPage.gotoComponents();
    const baselineHrefs = await componentsPage.getVisibleHrefs();

    // expect: The unfiltered baseline set contains more than 0 hrefs (read live, not hardcoded to a
    //         fixed count)
    expect(baselineHrefs.length).toBeGreaterThan(0);

    // 2. Open the 'Difficulty: All' dropdown and select 'Beginner'. Read the resulting visible set of
    //    card hrefs live
    await componentsPage.selectDifficulty('Beginner');
    const beginnerHrefs = await componentsPage.getVisibleHrefs();

    // expect: The filter button's own label updates to read exactly 'Difficulty: Beginner'
    //         (asserted inside selectDifficulty())
    // expect: The resulting Beginner-filtered href set is a strict, non-empty, proper subset of the
    //         unfiltered baseline set captured in step 1 (its size is greater than 0 and strictly
    //         less than the baseline's size)
    expect(beginnerHrefs.length).toBeGreaterThan(0);
    expect(beginnerHrefs.length).toBeLessThan(baselineHrefs.length);

    // 3. Without reloading the page, open the 'Difficulty: Beginner' dropdown again and select
    //    'Advanced' instead. Read the resulting visible set of card hrefs live
    await componentsPage.selectDifficulty('Advanced');
    const advancedHrefs = await componentsPage.getVisibleHrefs();

    // expect: The filter button's label updates to read exactly 'Difficulty: Advanced' (asserted
    //         inside selectDifficulty())
    // expect: The resulting Advanced-filtered href set is also a strict, non-empty, proper subset of
    //         the unfiltered baseline set
    expect(advancedHrefs.length).toBeGreaterThan(0);
    expect(advancedHrefs.length).toBeLessThan(baselineHrefs.length);

    // expect: The Beginner-filtered set (from step 2) and this Advanced-filtered set share NO common
    //         hrefs (their intersection is empty) — this is how 'correct' filtering is verified here,
    //         since no individual card exposes any visible difficulty attribute/badge in the DOM to
    //         check against directly
    const beginnerSet = new Set(beginnerHrefs);
    const intersection = advancedHrefs.filter((href) => beginnerSet.has(href));
    expect(intersection).toEqual([]);

    // expect: The union of the Beginner-filtered set and this Advanced-filtered set, treated as a
    //         combined set of unique hrefs, is exactly equal (same members, same count) to the
    //         unfiltered baseline set captured in step 1 — confirming the two difficulty values
    //         partition the full catalog completely, with nothing left uncategorized
    const unionHrefs = new Set([...beginnerHrefs, ...advancedHrefs]);
    expect(unionHrefs.size).toBe(baselineHrefs.length);
    expect([...unionHrefs].sort()).toEqual([...baselineHrefs].sort());
  });

  test("The Type filter genuinely filters (not a no-op) - 'Static' preserves the full list while 'API' correctly narrows to zero results with a real empty-state message", async () => {
    // 1. Navigate to '/components' on a fresh browser context (Difficulty and Type both at their
    //    default 'All'). Read the full unfiltered set of card hrefs live as the baseline
    await componentsPage.gotoComponents();
    const baselineHrefs = await componentsPage.getVisibleHrefs();

    // expect: The unfiltered baseline set contains more than 0 hrefs
    expect(baselineHrefs.length).toBeGreaterThan(0);

    // 2. Open the 'Type: All' dropdown and select 'Static'. Read the resulting visible set of card
    //    hrefs live
    await componentsPage.selectType('Static');
    const staticHrefs = await componentsPage.getVisibleHrefs();

    // expect: The filter button's label updates to read exactly 'Type: Static' (asserted inside
    //         selectType())
    // expect: The resulting Static-filtered href set is exactly equal (same members, same count —
    //         order-independent) to the unfiltered baseline set from step 1, confirming every
    //         cataloged component is presently categorized as 'Static' type and that selecting this
    //         value does not erroneously drop any card
    expect(staticHrefs.length).toBe(baselineHrefs.length);
    expect([...staticHrefs].sort()).toEqual([...baselineHrefs].sort());

    // 3. Without reloading, open the 'Type: Static' dropdown again and select 'API' instead
    await componentsPage.selectType('API');

    // expect: The filter button's label updates to read exactly 'Type: API' (asserted inside
    //         selectType())
    // expect: Zero card elements ('.rounded-xl.shadow-md') are present in the DOM
    await expect(componentsPage.cards).toHaveCount(0);
    // expect: A heading (level 3) reading exactly 'No components found' is visible in place of the
    //         card grid
    await expect(componentsPage.emptyStateHeading).toBeVisible();
    // expect: A paragraph reading exactly 'Try adjusting your filters to see more results.' is
    //         visible directly beneath that heading
    await expect(componentsPage.emptyStateMessage).toBeVisible();
  });

  test('Difficulty and Type filters combine using AND logic, not OR', async () => {
    // 1. Navigate to '/components' on a fresh browser context. Select Difficulty='Advanced' first,
    //    and read the resulting Advanced-only href set live (as established in the Difficulty
    //    scenario above, this is a strict non-empty proper subset of the full catalog)
    await componentsPage.gotoComponents();
    const baselineHrefs = await componentsPage.getVisibleHrefs();
    await componentsPage.selectDifficulty('Advanced');
    const advancedOnlyHrefs = await componentsPage.getVisibleHrefs();

    // expect: The Advanced-only href set is non-empty and strictly smaller than the full unfiltered
    //         catalog
    expect(advancedOnlyHrefs.length).toBeGreaterThan(0);
    expect(advancedOnlyHrefs.length).toBeLessThan(baselineHrefs.length);

    // 2. Without resetting the Difficulty selection, additionally open the 'Type: All' dropdown and
    //    select 'Static'. Read the resulting visible href set live
    await componentsPage.selectType('Static');
    const combinedHrefs = await componentsPage.getVisibleHrefs();

    // expect: Both filter buttons now read exactly 'Difficulty: Advanced' and 'Type: Static'
    //         simultaneously (confirming both selections are retained together, not one replacing
    //         the other)
    await expect(componentsPage.difficultyFilterButton).toHaveText('Difficulty: Advanced');
    await expect(componentsPage.typeFilterButton).toHaveText('Type: Static');

    // expect: The resulting combined-filter href set is exactly equal (same members, same count) to
    //         the Advanced-only set captured in step 1 — confirming the two filters combine with AND
    //         semantics (every Advanced-difficulty component is also Static-type today, so adding the
    //         Static filter on top of Advanced narrows nothing further), not OR semantics (which would
    //         instead show the union of Advanced-difficulty and Static-type cards, i.e. the full
    //         16-card catalog, since Static alone already matches everything)
    expect(combinedHrefs.length).toBe(advancedOnlyHrefs.length);
    expect([...combinedHrefs].sort()).toEqual([...advancedOnlyHrefs].sort());
  });
});
