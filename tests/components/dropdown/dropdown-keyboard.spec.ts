// spec: specs/dropdown.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { DropdownPage } from '../../pages/DropdownPage';

test.describe('Dropdown - Keyboard Navigation', () => {
  test('Focusing the fruit select and pressing ArrowDown moves selection to the first real option and live-updates the result text', async ({
    page,
  }) => {
    const dropdownPage = new DropdownPage(page);

    // 1. Navigate to '/components/dropdown', focus the fruit select, press Escape, then press ArrowDown once
    await dropdownPage.gotoDropdown();
    await dropdownPage.fruitSelect.focus();
    await page.keyboard.press('Escape');
    await page.keyboard.press('ArrowDown');

    // expect: .value becomes exactly 'Apple' (first real option, placeholder skipped)
    await expect(dropdownPage.fruitSelect).toHaveValue('Apple');
    // expect: result text updates live to exactly 'Apple' without any blur/submit action
    await expect(dropdownPage.fruitResult).toHaveText('Apple');
  });

  test("Type-ahead: pressing the first letter of an option's label while the select is focused jumps directly to that option", async ({
    page,
  }) => {
    const dropdownPage = new DropdownPage(page);

    // 1. Navigate to '/components/dropdown', focus the fruit select, then press 'm' (first letter of 'Mango')
    await dropdownPage.gotoDropdown();
    await dropdownPage.fruitSelect.focus();
    await page.keyboard.press('m');

    // expect: .value becomes exactly 'Mango'
    await expect(dropdownPage.fruitSelect).toHaveValue('Mango');
    // expect: result text updates to exactly 'Mango'
    await expect(dropdownPage.fruitResult).toHaveText('Mango');
  });

  test('Pressing ArrowDown repeatedly on the focused fruit select cycles forward through the option list without skipping or wrapping unexpectedly', async ({
    page,
  }) => {
    const dropdownPage = new DropdownPage(page);

    // 1. Navigate to '/components/dropdown', focus the fruit select, then press ArrowDown four times, checking value after each
    await dropdownPage.gotoDropdown();
    await dropdownPage.fruitSelect.focus();

    await page.keyboard.press('ArrowDown');
    // expect: After press 1, value is 'Apple'
    await expect(dropdownPage.fruitSelect).toHaveValue('Apple');

    await page.keyboard.press('ArrowDown');
    // expect: After press 2, value is 'Mango'
    await expect(dropdownPage.fruitSelect).toHaveValue('Mango');

    await page.keyboard.press('ArrowDown');
    // expect: After press 3, value is 'Orange'
    await expect(dropdownPage.fruitSelect).toHaveValue('Orange');

    await page.keyboard.press('ArrowDown');
    // expect: After press 4, value is 'Banana'
    await expect(dropdownPage.fruitSelect).toHaveValue('Banana');
  });
});
