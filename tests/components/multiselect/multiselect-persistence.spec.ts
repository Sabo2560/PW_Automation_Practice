// spec: specs/multiselect.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { ALL_OPTIONS, MultiselectPage } from '../../pages/MultiselectPage';

test.describe('Multiselect - Reload Persistence', () => {
  let multiselectPage: MultiselectPage;

  test.beforeEach(async ({ page }) => {
    multiselectPage = new MultiselectPage(page);
    await multiselectPage.gotoMultiselect();
  });

  test('No selection state persists across a page reload for any of the three forms; each resets to its documented fresh-load default', async ({
    page,
  }) => {
    // 1. In form-1, select 'Option 1' and 'Option 2'
    await multiselectPage.openForm(multiselectPage.form1);
    await multiselectPage.selectOption(multiselectPage.form1, 'Option 1');
    await multiselectPage.selectOption(multiselectPage.form1, 'Option 2');

    // In form-2, select all 3 options (triggering 'No Options Available')
    await multiselectPage.closeOpenList();
    await multiselectPage.openForm(multiselectPage.form2);
    await multiselectPage.selectOption(multiselectPage.form2, 'Option 1');
    await multiselectPage.selectOption(multiselectPage.form2, 'Option 2');
    await multiselectPage.selectOption(multiselectPage.form2, 'Option 3');

    // In form-3, remove both default chips ('Option 4', 'Option 5') so it has 0 chips
    await multiselectPage.closeOpenList();
    await multiselectPage.removeChip(multiselectPage.form3, 'Option 4');
    await multiselectPage.removeChip(multiselectPage.form3, 'Option 5');

    // expect: before reload, form-1 has 2 chips, form-2 has 3 chips with 'No Options Available' shown, form-3 has 0 chips
    await expect(multiselectPage.chips(multiselectPage.form1)).toHaveCount(2);
    await expect(multiselectPage.chips(multiselectPage.form2)).toHaveCount(3);
    await expect(multiselectPage.noOptionsAvailable(multiselectPage.form2)).toHaveText('No Options Available');
    await expect(multiselectPage.chips(multiselectPage.form3)).toHaveCount(0);

    // 2. Reload the page
    await page.reload();
    await expect(multiselectPage.searchInput(multiselectPage.form1)).toBeVisible();

    // expect: form-1 has exactly 0 chips and its full 10-item option list is available again
    await expect(multiselectPage.chips(multiselectPage.form1)).toHaveCount(0);
    await multiselectPage.openForm(multiselectPage.form1);
    const form1Options = await multiselectPage.getAvailableOptionTexts(multiselectPage.form1);
    expect(form1Options).toEqual(ALL_OPTIONS);

    // expect: form-2 has exactly 0 chips and its full 3-item option list is available again (no 'No Options Available' message)
    await expect(multiselectPage.chips(multiselectPage.form2)).toHaveCount(0);
    await expect(multiselectPage.noOptionsAvailable(multiselectPage.form2)).toHaveCount(0);
    await multiselectPage.closeOpenList();
    await multiselectPage.openForm(multiselectPage.form2);
    const form2Options = await multiselectPage.getAvailableOptionTexts(multiselectPage.form2);
    expect(form2Options).toEqual(['Option 1', 'Option 2', 'Option 3']);

    // expect: form-3 has exactly 2 chips again with exact text 'Option 4' and 'Option 5' — a static per-load default, not persisted state
    const form3ChipTexts = await multiselectPage.getChipTexts(multiselectPage.form3);
    expect(form3ChipTexts).toEqual(['Option 4', 'Option 5']);
  });
});
