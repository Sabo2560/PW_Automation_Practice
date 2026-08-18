// spec: specs/dropdown.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { DropdownPage } from '../../pages/DropdownPage';

test.describe('Dropdown - Cross-Dropdown Independence', () => {
  test('Selecting a value in one dropdown does not affect the state of any of the other three dropdowns', async ({
    page,
  }) => {
    const dropdownPage = new DropdownPage(page);

    // 1. Navigate to '/components/dropdown' and select a value in only the fruit dropdown
    await dropdownPage.gotoDropdown();
    await dropdownPage.selectFruit('Orange');

    // expect: Fruit result text equals 'Orange'
    await expect(dropdownPage.fruitResult).toHaveText('Orange');
    // expect: Superhero select still has 0 selections, result text still 'None selected'
    const selectedCount = await dropdownPage.superheroSelect.evaluate(
      (el: HTMLSelectElement) => el.selectedOptions.length
    );
    expect(selectedCount).toBe(0);
    await expect(dropdownPage.superheroResult).toHaveText('None selected');
    // expect: Language and country selects are still at their default ''
    await expect(dropdownPage.langSelect).toHaveValue('');
    await expect(dropdownPage.countrySelect).toHaveValue('');

    // 2. Additionally select the other three dropdowns, one at a time
    await dropdownPage.selectSuperheroes(['Ironman']);
    await dropdownPage.selectLang('js');
    await dropdownPage.selectCountry('Chile');

    // expect: fruit result text is still exactly 'Orange' (unchanged by the later interactions)
    await expect(dropdownPage.fruitResult).toHaveText('Orange');
    // expect: superhero result text is exactly 'Ironman'
    await expect(dropdownPage.superheroResult).toHaveText('Ironman');
    // expect: language value is exactly 'js'
    await expect(dropdownPage.langSelect).toHaveValue('js');
    // expect: country value is exactly 'Chile'
    await expect(dropdownPage.countrySelect).toHaveValue('Chile');
  });

  test('No API/network requests fire as a result of any dropdown selection (purely client-side component)', async ({
    page,
  }) => {
    const dropdownPage = new DropdownPage(page);

    // 1. Navigate to '/components/dropdown', begin recording network requests, then interact with all four dropdowns
    await dropdownPage.gotoDropdown();

    const apiRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (!url.includes('/components/dropdown') && request.resourceType() !== 'document') {
        // Only track requests that look like data/API calls, not standard page assets
        if (request.method() !== 'GET' || url.includes('/api/')) {
          apiRequests.push(url);
        }
      }
    });

    await dropdownPage.selectFruit('Apple');
    await dropdownPage.selectSuperheroes(['Batman', 'Thor']);
    await dropdownPage.selectLang('py');
    await dropdownPage.selectCountry('India');

    // expect: No XHR/fetch network request specific to any dropdown selection is observed
    expect(apiRequests).toEqual([]);
  });
});
