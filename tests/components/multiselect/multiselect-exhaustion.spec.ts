// spec: specs/multiselect.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { MultiselectPage } from '../../pages/MultiselectPage';

test.describe('Multiselect - Exhausting All Options (Form 2)', () => {
  let multiselectPage: MultiselectPage;

  test.beforeEach(async ({ page }) => {
    multiselectPage = new MultiselectPage(page);
    await multiselectPage.gotoMultiselect();
  });

  test('Selecting all three available options one at a time displays all three chips and progressively empties the list', async () => {
    // 1. Navigate to '/components/multiselect', open form-2's dropdown, select 'Option 1'
    await multiselectPage.openForm(multiselectPage.form2);
    await multiselectPage.selectOption(multiselectPage.form2, 'Option 1');

    // expect: form-2 has exactly 1 chip ('Option 1')
    await expect(multiselectPage.chips(multiselectPage.form2)).toHaveText(['Option 1']);
    // expect: The remaining option list contains exactly 2 items: 'Option 2', 'Option 3'
    let remainingOptions = await multiselectPage.getAvailableOptionTexts(multiselectPage.form2);
    expect(remainingOptions).toEqual(['Option 2', 'Option 3']);

    // 2. Select 'Option 2' from the still-open list
    await multiselectPage.selectOption(multiselectPage.form2, 'Option 2');

    // expect: form-2 has exactly 2 chips ('Option 1', 'Option 2')
    const chipTextsAfterTwo = await multiselectPage.getChipTexts(multiselectPage.form2);
    expect(chipTextsAfterTwo).toEqual(['Option 1', 'Option 2']);
    // expect: The remaining option list contains exactly 1 item: 'Option 3'
    remainingOptions = await multiselectPage.getAvailableOptionTexts(multiselectPage.form2);
    expect(remainingOptions).toEqual(['Option 3']);

    // 3. Select the final remaining option 'Option 3'
    await multiselectPage.selectOption(multiselectPage.form2, 'Option 3');

    // expect: form-2 has exactly 3 chips: 'Option 1', 'Option 2', 'Option 3' (every available option now selected)
    const chipTextsAfterThree = await multiselectPage.getChipTexts(multiselectPage.form2);
    expect(chipTextsAfterThree).toEqual(['Option 1', 'Option 2', 'Option 3']);
    // expect: The option list container now shows the exact text 'No Options Available' in place of any '<li>' items
    await expect(multiselectPage.noOptionsAvailable(multiselectPage.form2)).toHaveText('No Options Available');
  });

  test('Deselecting one chip after full exhaustion returns exactly that option to the list and clears the empty-state message', async () => {
    // 1. Navigate to '/components/multiselect', open form-2, select all 3 options in order (Option 1, Option 2, Option 3)
    await multiselectPage.openForm(multiselectPage.form2);
    await multiselectPage.selectOption(multiselectPage.form2, 'Option 1');
    await multiselectPage.selectOption(multiselectPage.form2, 'Option 2');
    await multiselectPage.selectOption(multiselectPage.form2, 'Option 3');

    // expect: 'No Options Available' text is visible within form-2 and form-2 has exactly 3 chips
    await expect(multiselectPage.noOptionsAvailable(multiselectPage.form2)).toHaveText('No Options Available');
    await expect(multiselectPage.chips(multiselectPage.form2)).toHaveCount(3);

    // 2. Click the 'Option 2' chip's cancel icon
    await multiselectPage.removeChip(multiselectPage.form2, 'Option 2');

    // expect: form-2 now has exactly 2 chips: 'Option 1' and 'Option 3' (Option 2 specifically removed, the other two untouched)
    const chipTexts = await multiselectPage.getChipTexts(multiselectPage.form2);
    expect(chipTexts).toEqual(['Option 1', 'Option 3']);
    // expect: 'No Options Available' is no longer shown; the option list now shows exactly 1 item: 'Option 2'
    await expect(multiselectPage.noOptionsAvailable(multiselectPage.form2)).toHaveCount(0);
    const remainingOptions = await multiselectPage.getAvailableOptionTexts(multiselectPage.form2);
    expect(remainingOptions).toEqual(['Option 2']);
  });
});
