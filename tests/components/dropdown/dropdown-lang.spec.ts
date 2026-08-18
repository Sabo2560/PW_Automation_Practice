// spec: specs/dropdown.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { DropdownPage } from '../../pages/DropdownPage';

test.describe('Dropdown - Programming Language (Single-Select by Value)', () => {
  test("Selecting a language by its underlying value updates the select's .value to that exact value", async ({
    page,
  }) => {
    const dropdownPage = new DropdownPage(page);

    // 1. Navigate to '/components/dropdown' and select the language select's value 'py'
    await dropdownPage.gotoDropdown();
    await dropdownPage.selectLang('py');

    // expect: .value equals exactly 'py' (selecting by value, not by visible label 'Python')
    await expect(dropdownPage.langSelect).toHaveValue('py');
  });

  test("Selecting the last programming language option in the list works correctly (upper boundary)", async ({
    page,
  }) => {
    const dropdownPage = new DropdownPage(page);

    // 1. Navigate to '/components/dropdown' and select value 'sharp' (C#, the last real option)
    await dropdownPage.gotoDropdown();
    await dropdownPage.selectLang('sharp');

    // expect: .value equals exactly 'sharp'
    await expect(dropdownPage.langSelect).toHaveValue('sharp');
    // expect: the select's displayed selected-option label reads 'C#'
    const selectedLabel = await dropdownPage.langSelect.evaluate(
      (el: HTMLSelectElement) => el.selectedOptions[0]?.textContent?.trim()
    );
    expect(selectedLabel).toBe('C#');
  });

  test('There is no separate result-text element for the language dropdown; the select\'s own value is the only observable selection state', async ({
    page,
  }) => {
    const dropdownPage = new DropdownPage(page);

    // 1. Navigate to '/components/dropdown', select value 'java', then scan the DOM for a result-text element
    await dropdownPage.gotoDropdown();
    await dropdownPage.selectLang('java');

    // expect: No [data-testid] result-text element exists for the language dropdown anywhere in the DOM
    await expect(page.getByTestId('user-selected-lang')).toHaveCount(0);
  });
});
