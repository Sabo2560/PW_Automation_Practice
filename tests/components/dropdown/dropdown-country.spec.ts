// spec: specs/dropdown.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { DropdownPage } from '../../pages/DropdownPage';

test.describe('Dropdown - Country (Single-Select by Value)', () => {
  test("Selecting 'India' by its underlying value updates the select's .value to 'India'", async ({ page }) => {
    const dropdownPage = new DropdownPage(page);

    // 1. Navigate to '/components/dropdown' and select the country select's value 'India'
    await dropdownPage.gotoDropdown();
    await dropdownPage.selectCountry('India');

    // expect: .value equals exactly 'India'
    await expect(dropdownPage.countrySelect).toHaveValue('India');
  });

  test('Selecting the first and last real country options (boundary values in a 12-item list) both work correctly', async ({
    page,
  }) => {
    const dropdownPage = new DropdownPage(page);

    // 1. Navigate to '/components/dropdown' and select value 'Argentina' (first real option)
    await dropdownPage.gotoDropdown();
    await dropdownPage.selectCountry('Argentina');
    // expect: .value equals exactly 'Argentina'
    await expect(dropdownPage.countrySelect).toHaveValue('Argentina');

    // 2. Re-navigate fresh and select value 'Venezuela' (last real option)
    await dropdownPage.gotoDropdown();
    await dropdownPage.selectCountry('Venezuela');
    // expect: .value equals exactly 'Venezuela'
    await expect(dropdownPage.countrySelect).toHaveValue('Venezuela');
  });

  test("For the country dropdown, each option's underlying value attribute equals its visible label exactly (unlike the language dropdown)", async ({
    page,
  }) => {
    const dropdownPage = new DropdownPage(page);

    // 1. Navigate to '/components/dropdown' and select by visible label 'Brazil'
    await dropdownPage.gotoDropdown();
    await dropdownPage.countrySelect.selectOption({ label: 'Brazil' });

    // expect: .value equals exactly 'Brazil' (label-based and value-based selection produce an identical result)
    await expect(dropdownPage.countrySelect).toHaveValue('Brazil');
  });
});
