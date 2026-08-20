// spec: specs/multiselect.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { ALL_OPTIONS, MultiselectPage } from '../../pages/MultiselectPage';

test.describe('Multiselect - Removing Pre-Selected Items (Form 3)', () => {
  let multiselectPage: MultiselectPage;

  test.beforeEach(async ({ page }) => {
    multiselectPage = new MultiselectPage(page);
    await multiselectPage.gotoMultiselect();
  });

  test('Form-3 loads with exactly two pre-selected chips (Option 4, Option 5) and 8 remaining options, confirmed on fresh navigation', async () => {
    const form3 = multiselectPage.form3;

    // 1. Navigate to '/components/multiselect' on a fresh context and inspect form-3 without any interaction
    // expect: form-3 has exactly 2 chips with exact text 'Option 4' and 'Option 5' in that order
    await expect(multiselectPage.chips(form3)).toHaveText(['Option 4', 'Option 5']);

    // expect: Opening form-3's dropdown shows exactly these 8 remaining options, in this order
    await multiselectPage.openForm(form3);
    await expect(multiselectPage.optionListContainer(form3)).toHaveClass(/displayBlock/);
    await expect(multiselectPage.options(form3)).toHaveText(
      ALL_OPTIONS.filter((o) => o !== 'Option 4' && o !== 'Option 5')
    );
  });

  test('Removing both pre-selected chips one at a time returns both options to the list and leaves zero chips', async () => {
    const form3 = multiselectPage.form3;

    // 1. Click the 'Option 4' chip's '.icon_cancel' icon in form-3
    await multiselectPage.removeChip(form3, 'Option 4');

    // expect: form-3 now has exactly 1 chip: 'Option 5' only
    await expect(multiselectPage.chips(form3)).toHaveText(['Option 5']);

    // expect: Opening form-3's list shows 'Option 4' back among the 9 remaining options, in its original list-order position
    await multiselectPage.openForm(form3);
    await expect(multiselectPage.options(form3)).toHaveText(ALL_OPTIONS.filter((o) => o !== 'Option 5'));

    // 2. Click the remaining 'Option 5' chip's '.icon_cancel' icon
    await multiselectPage.removeChip(form3, 'Option 5');

    // expect: form-3 now has exactly 0 chips ('.chip' count is 0)
    await expect(multiselectPage.chips(form3)).toHaveCount(0);

    // expect: Opening form-3's list shows all 10 original options present again, confirming full reversibility
    await multiselectPage.openForm(form3);
    await expect(multiselectPage.options(form3)).toHaveText(ALL_OPTIONS);
  });

  test('Removing a chip using a bounded retry loop still results in exactly zero chips with no leftover/stuck chip', async ({ page }) => {
    const form3 = multiselectPage.form3;
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 1. In a loop capped at a small sane maximum (5 iterations), repeatedly read the current chip count in
    // form-3, break if it is 0, otherwise click the FIRST chip's cancel icon and wait for the chip count to
    // decrease by exactly 1 before the next iteration
    const chips = multiselectPage.chips(form3);
    const maxIterations = 5;

    for (let iterations = 0; iterations < maxIterations; iterations++) {
      const currentCount = await chips.count();
      if (currentCount === 0) break;
      await chips.first().locator('.icon_cancel').click();
      await expect(chips).toHaveCount(currentCount - 1);
    }

    // expect: The loop terminates (does not hit the iteration cap) with form-3's chip count at exactly 0
    await expect(chips).toHaveCount(0);

    // expect: No console errors were logged during the removal sequence
    expect(consoleErrors).toHaveLength(0);
  });

  test('Re-selecting a removed pre-selected option makes it reappear as a chip and disappear from the list again (round-trip)', async () => {
    const form3 = multiselectPage.form3;

    // 1. Remove the 'Option 4' pre-selected chip in form-3, then open the list and click 'Option 4' again to re-select it
    await multiselectPage.removeChip(form3, 'Option 4');
    await multiselectPage.openForm(form3);
    await multiselectPage.selectOption(form3, 'Option 4');

    // expect: form-3 has exactly 2 chips again: 'Option 5' and 'Option 4' (Option 4 now appears LAST since it was
    // re-added most recently, not restored to its original first position) — confirming chip order reflects
    // current selection order, not the original default order
    await expect(multiselectPage.chips(form3)).toHaveText(['Option 5', 'Option 4']);

    // expect: 'Option 4' no longer appears in the open option list
    await expect(multiselectPage.option(form3, 'Option 4')).toHaveCount(0);
  });
});
