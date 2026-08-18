// spec: specs/dropdown.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { DropdownPage } from '../../pages/DropdownPage';

test.describe('Dropdown - Superhero (Multi-Select)', () => {
  test('Selecting multiple superheroes displays all of them in the result text', async ({ page }) => {
    const dropdownPage = new DropdownPage(page);

    // 1. Navigate to '/components/dropdown' and select ['Batman', 'Superman', 'Thor']
    await dropdownPage.gotoDropdown();
    await dropdownPage.selectSuperheroes(['Batman', 'Superman', 'Thor']);

    // expect: selectedOptions values equal exactly the set {'Batman','Superman','Thor'}
    const selectedValues = await dropdownPage.superheroSelect.evaluate((el: HTMLSelectElement) =>
      Array.from(el.selectedOptions).map((o) => o.value)
    );
    expect(new Set(selectedValues)).toEqual(new Set(['Batman', 'Superman', 'Thor']));
    expect(selectedValues).toHaveLength(3);

    // expect: result text contains 'Batman', 'Superman', and 'Thor'
    const resultText = await dropdownPage.superheroResult.textContent();
    expect(resultText).toContain('Batman');
    expect(resultText).toContain('Superman');
    expect(resultText).toContain('Thor');
  });

  test('Multi-select result text displays selected heroes in their DOM/option-list order, not the order they were selected in', async ({
    page,
  }) => {
    const dropdownPage = new DropdownPage(page);

    // 1. Navigate to '/components/dropdown' and select in this specific call order: 'Thor', 'Ant-Man', 'Batman'
    await dropdownPage.gotoDropdown();
    await dropdownPage.selectSuperheroes(['Thor', 'Ant-Man', 'Batman']);

    // expect: result text equals exactly 'Ant-Man, Batman, Thor' (DOM order, not call order)
    await expect(dropdownPage.superheroResult).toHaveText('Ant-Man, Batman, Thor');
  });

  test('Selecting a single superhero in the multi-select still displays correctly (lower boundary: one item)', async ({
    page,
  }) => {
    const dropdownPage = new DropdownPage(page);

    // 1. Navigate to '/components/dropdown' and select only ['Aquaman']
    await dropdownPage.gotoDropdown();
    await dropdownPage.selectSuperheroes(['Aquaman']);

    // expect: Result text equals exactly 'Aquaman' with no trailing comma/separator artifacts
    await expect(dropdownPage.superheroResult).toHaveText('Aquaman');
  });

  test('Selecting all ten superheroes displays all of them (upper boundary: full list)', async ({ page }) => {
    const dropdownPage = new DropdownPage(page);

    // 1. Navigate to '/components/dropdown' and select all 10 options
    await dropdownPage.gotoDropdown();
    const allHeroes = [
      'Ant-Man',
      'Aquaman',
      'Batman',
      'Superman',
      'Spiderman',
      'Venom',
      'Ironman',
      'Thor',
      'Hulk',
      'Black Panther',
    ];
    await dropdownPage.selectSuperheroes(allHeroes);

    // expect: Result text equals exactly the full DOM-order, comma-separated list
    await expect(dropdownPage.superheroResult).toHaveText(allHeroes.join(', '));
  });

  test("Deselecting all superheroes reverts the result text to the default 'None selected' state", async ({ page }) => {
    const dropdownPage = new DropdownPage(page);

    // 1. Navigate to '/components/dropdown', select ['Hulk', 'Venom'], confirm, then deselect all
    await dropdownPage.gotoDropdown();
    await dropdownPage.selectSuperheroes(['Hulk', 'Venom']);
    const resultText = await dropdownPage.superheroResult.textContent();
    expect(resultText).toContain('Hulk');
    expect(resultText).toContain('Venom');

    await dropdownPage.selectSuperheroes([]);

    // expect: selectedOptions length equals exactly 0
    const selectedCount = await dropdownPage.superheroSelect.evaluate(
      (el: HTMLSelectElement) => el.selectedOptions.length
    );
    expect(selectedCount).toBe(0);
    // expect: result text equals exactly 'None selected'
    await expect(dropdownPage.superheroResult).toHaveText('None selected');
  });
});
