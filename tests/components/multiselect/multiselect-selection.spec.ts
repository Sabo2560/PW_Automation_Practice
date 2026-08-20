// spec: specs/multiselect.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { ALL_OPTIONS, MultiselectPage } from '../../pages/MultiselectPage';

test.describe('Multiselect - Selecting Items (Form 1)', () => {
  let multiselectPage: MultiselectPage;

  test.beforeEach(async ({ page }) => {
    multiselectPage = new MultiselectPage(page);
    await multiselectPage.gotoMultiselect();
  });

  test('Selecting two items displays both as chips and removes them from the open option list', async () => {
    // 1. Navigate to '/components/multiselect', open form-1's dropdown, click the option with exact text 'Option 2'
    await multiselectPage.openForm(multiselectPage.form1);
    await multiselectPage.selectOption(multiselectPage.form1, 'Option 2');

    // expect: A chip with exact text 'Option 2' is visible inside form-1
    await expect(multiselectPage.chip(multiselectPage.form1, 'Option 2')).toBeVisible();
    // expect: 'Option 2' no longer appears in form-1's remaining '.optionContainer li' list
    await expect(multiselectPage.option(multiselectPage.form1, 'Option 2')).toHaveCount(0);
    // expect: The option list remains open ('.optionListContainer' class is 'displayBlock') after the selection
    await expect(multiselectPage.optionListContainer(multiselectPage.form1)).toHaveClass(/displayBlock/);

    // 2. Without reopening, click the option with exact text 'Option 4' in the still-open list
    await multiselectPage.selectOption(multiselectPage.form1, 'Option 4');

    // expect: form-1 now has exactly 2 chips with exact text 'Option 2' and 'Option 4' (in selection order)
    const chipTexts = await multiselectPage.getChipTexts(multiselectPage.form1);
    expect(chipTexts).toEqual(['Option 2', 'Option 4']);
    // expect: form-1's remaining option list no longer contains 'Option 2' or 'Option 4', but still contains the other 8 original options
    const remainingOptions = await multiselectPage.getAvailableOptionTexts(multiselectPage.form1);
    expect(remainingOptions).toEqual(ALL_OPTIONS.filter((o) => o !== 'Option 2' && o !== 'Option 4'));
  });

  test("Selecting a single option (lower boundary of 'at least two') still renders correctly as one chip", async () => {
    // 1. Navigate to '/components/multiselect', open form-1's dropdown, select only 'Option 5'
    await multiselectPage.openForm(multiselectPage.form1);
    await multiselectPage.selectOption(multiselectPage.form1, 'Option 5');

    // expect: form-1 has exactly 1 chip with exact text 'Option 5'
    await expect(multiselectPage.chips(multiselectPage.form1)).toHaveText(['Option 5']);
    // expect: The remaining option list contains exactly 9 items (all of Option 1-10 except Option 5)
    const remainingOptions = await multiselectPage.getAvailableOptionTexts(multiselectPage.form1);
    expect(remainingOptions).toEqual(ALL_OPTIONS.filter((o) => o !== 'Option 5'));
  });

  test('Selecting the first and last options in the list (boundary positions) both work correctly', async () => {
    // 1. Navigate to '/components/multiselect', open form-1, select 'Option 1' (first item in the list)
    await multiselectPage.openForm(multiselectPage.form1);
    await multiselectPage.selectOption(multiselectPage.form1, 'Option 1');

    // expect: A chip with exact text 'Option 1' is visible
    await expect(multiselectPage.chip(multiselectPage.form1, 'Option 1')).toBeVisible();

    // 2. Without reloading, reopen if needed and select 'Option 10' (last item in the list)
    await multiselectPage.selectOption(multiselectPage.form1, 'Option 10');

    // expect: form-1 now has exactly 2 chips: 'Option 1' and 'Option 10'
    const chipTexts = await multiselectPage.getChipTexts(multiselectPage.form1);
    expect(chipTexts).toEqual(['Option 1', 'Option 10']);
  });

  test('Live substring, case-insensitive search filtering narrows the option list without affecting existing chips', async () => {
    // 1. Navigate to '/components/multiselect', open form-1, type '10' into the search box
    await multiselectPage.openForm(multiselectPage.form1);
    await multiselectPage.filterOptions(multiselectPage.form1, '10');

    // expect: The option list narrows to exactly 1 item: 'Option 10'
    let remainingOptions = await multiselectPage.getAvailableOptionTexts(multiselectPage.form1);
    expect(remainingOptions).toEqual(['Option 10']);

    // 2. Clear the search box and type '1' instead
    await multiselectPage.clearSearch(multiselectPage.form1);
    await multiselectPage.filterOptions(multiselectPage.form1, '1');

    // expect: The option list narrows to exactly 2 items: 'Option 1' and 'Option 10'
    remainingOptions = await multiselectPage.getAvailableOptionTexts(multiselectPage.form1);
    expect(remainingOptions).toEqual(['Option 1', 'Option 10']);

    // 3. Clear the search box and type the lowercase, spaced string 'option 3'
    await multiselectPage.clearSearch(multiselectPage.form1);
    await multiselectPage.filterOptions(multiselectPage.form1, 'option 3');

    // expect: The option list narrows to exactly 1 item: 'Option 3', confirming case-insensitive matching
    remainingOptions = await multiselectPage.getAvailableOptionTexts(multiselectPage.form1);
    expect(remainingOptions).toEqual(['Option 3']);

    // 4. Clear the search box entirely and select 'Option 6', then type 'xyz' (a string matching no option label)
    await multiselectPage.clearSearch(multiselectPage.form1);
    await multiselectPage.selectOption(multiselectPage.form1, 'Option 6');
    await multiselectPage.filterOptions(multiselectPage.form1, 'xyz');

    // expect: The option list container displays the exact text 'No Options Available' in place of any '<li>' items
    await expect(multiselectPage.noOptionsAvailable(multiselectPage.form1)).toHaveText('No Options Available');
    // expect: The existing 'Option 6' chip remains visible and unaffected by the unmatched filter text
    await expect(multiselectPage.chip(multiselectPage.form1, 'Option 6')).toBeVisible();
  });

  test("Removing a self-selected chip via its cancel icon returns that option to the open list and clears the current search filter", async () => {
    // 1. Navigate to '/components/multiselect', open form-1, select 'Option 7', then type a non-matching filter string 'zzz'
    await multiselectPage.openForm(multiselectPage.form1);
    await multiselectPage.selectOption(multiselectPage.form1, 'Option 7');
    await multiselectPage.filterOptions(multiselectPage.form1, 'zzz');

    // expect: 'No Options Available' text is visible and the 'Option 7' chip is still present
    await expect(multiselectPage.noOptionsAvailable(multiselectPage.form1)).toHaveText('No Options Available');
    await expect(multiselectPage.chip(multiselectPage.form1, 'Option 7')).toBeVisible();

    // 2. Click the 'Option 7' chip's '.icon_cancel' image
    await multiselectPage.removeChip(multiselectPage.form1, 'Option 7');

    // expect: form-1 has exactly 0 chips
    await expect(multiselectPage.chips(multiselectPage.form1)).toHaveCount(0);
    // expect: The search box's value is now exactly '' (empty), confirming the filter is cleared as a side effect
    await expect(multiselectPage.searchInput(multiselectPage.form1)).toHaveValue('');
    // expect: The full original 10-item option list is visible again, including 'Option 7' back in its original position
    const remainingOptions = await multiselectPage.getAvailableOptionTexts(multiselectPage.form1);
    expect(remainingOptions).toEqual(ALL_OPTIONS);
  });
});
