// spec: specs/dropdown.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { DropdownPage } from '../../pages/DropdownPage';

test.describe('Dropdown - Reload Persistence', () => {
  test('No selections persist across a page reload; all four dropdowns reset to their documented fresh-load defaults', async ({
    page,
  }) => {
    const dropdownPage = new DropdownPage(page);

    // 1. Navigate to '/components/dropdown'. Set a non-default value in all four dropdowns and confirm each reflects it
    await dropdownPage.gotoDropdown();
    await dropdownPage.selectFruit('Apple');
    await dropdownPage.selectSuperheroes(['Thor', 'Hulk']);
    await dropdownPage.selectLang('py');
    await dropdownPage.selectCountry('India');

    // expect: all four dropdowns show their newly-selected values before reloading
    await expect(dropdownPage.fruitSelect).toHaveValue('Apple');
    const selectedHeroes = await dropdownPage.superheroSelect.evaluate((el: HTMLSelectElement) =>
      Array.from(el.selectedOptions).map((o) => o.value)
    );
    expect(new Set(selectedHeroes)).toEqual(new Set(['Thor', 'Hulk']));
    await expect(dropdownPage.langSelect).toHaveValue('py');
    await expect(dropdownPage.countrySelect).toHaveValue('India');

    // 2. Reload the page
    await page.reload();
    await expect(dropdownPage.fruitSelect).toBeVisible();

    // expect: Fruit select value is exactly '' and result text is exactly 'No fruit selected'
    await expect(dropdownPage.fruitSelect).toHaveValue('');
    await expect(dropdownPage.fruitResult).toHaveText('No fruit selected');
    // expect: Superhero select has 0 selections and result text is exactly 'None selected'
    const selectedCountAfterReload = await dropdownPage.superheroSelect.evaluate(
      (el: HTMLSelectElement) => el.selectedOptions.length
    );
    expect(selectedCountAfterReload).toBe(0);
    await expect(dropdownPage.superheroResult).toHaveText('None selected');
    // expect: Language and country selects are back to ''
    await expect(dropdownPage.langSelect).toHaveValue('');
    await expect(dropdownPage.countrySelect).toHaveValue('');
  });
});
