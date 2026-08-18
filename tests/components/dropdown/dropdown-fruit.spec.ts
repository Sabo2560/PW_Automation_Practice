// spec: specs/dropdown.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { DropdownPage } from '../../pages/DropdownPage';

test.describe('Dropdown - Fruit (Single-Select by Visible Text)', () => {
  test("Selecting a fruit by its visible label updates the result text to exactly that fruit's name", async ({ page }) => {
    const dropdownPage = new DropdownPage(page);

    // 1. Navigate to '/components/dropdown' and select the fruit option with visible label 'Mango'
    await dropdownPage.gotoDropdown();
    await dropdownPage.selectFruit('Mango');

    // expect: fruit select value equals exactly 'Mango'
    await expect(dropdownPage.fruitSelect).toHaveValue('Mango');
    // expect: result text equals exactly 'Mango' (not a longer prefixed string)
    await expect(dropdownPage.fruitResult).toHaveText('Mango');
  });

  test('Selecting the first and last real options in the fruit list (boundary options) both display correctly', async ({
    page,
  }) => {
    const dropdownPage = new DropdownPage(page);

    // 1. Navigate to '/components/dropdown' and select label 'Apple' (first real option)
    await dropdownPage.gotoDropdown();
    await dropdownPage.selectFruit('Apple');
    // expect: Result text equals exactly 'Apple'
    await expect(dropdownPage.fruitResult).toHaveText('Apple');

    // 2. Re-navigate fresh and select label 'Pineapple' (last real option)
    await dropdownPage.gotoDropdown();
    await dropdownPage.selectFruit('Pineapple');
    // expect: Result text equals exactly 'Pineapple'
    await expect(dropdownPage.fruitResult).toHaveText('Pineapple');
  });

  test('Selecting a different fruit after one is already selected replaces the result rather than appending', async ({
    page,
  }) => {
    const dropdownPage = new DropdownPage(page);

    // 1. Navigate to '/components/dropdown', select label 'Banana', confirm result, then select label 'Orange'
    await dropdownPage.gotoDropdown();
    await dropdownPage.selectFruit('Banana');
    await expect(dropdownPage.fruitResult).toHaveText('Banana');

    await dropdownPage.selectFruit('Orange');

    // expect: Result text equals exactly 'Orange' (no concatenation/duplication)
    await expect(dropdownPage.fruitResult).toHaveText('Orange');
  });

  test('[QUIRK] Once an option is selected, that same option element gains a hidden attribute, hiding it from the reopened native dropdown list', async ({
    page,
  }) => {
    const dropdownPage = new DropdownPage(page);

    // 1. Navigate to '/components/dropdown'. Confirm the Mango option has no hidden attribute before selection
    await dropdownPage.gotoDropdown();
    const mangoOption = dropdownPage.fruitSelect.locator('option[value="Mango"]');
    // expect: Before selection, the Mango option has NO hidden attribute
    await expect(mangoOption).not.toHaveAttribute('hidden');

    await dropdownPage.selectFruit('Mango');

    // expect: After selecting Mango, the Mango option now HAS a hidden attribute
    await expect(mangoOption).toHaveAttribute('hidden', '');
    // expect: the other real options remain un-hidden
    for (const value of ['Apple', 'Orange', 'Banana', 'Pineapple']) {
      await expect(dropdownPage.fruitSelect.locator(`option[value="${value}"]`)).not.toHaveAttribute('hidden');
    }
  });
});
