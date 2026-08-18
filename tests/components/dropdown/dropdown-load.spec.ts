// spec: specs/dropdown.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { DropdownPage } from '../../pages/DropdownPage';

test.describe('Dropdown - Initial Load and Default State', () => {
  test('Dropdown page loads with all four selects, labels, result text, and Insight section correctly rendered', async ({
    page,
  }) => {
    const dropdownPage = new DropdownPage(page);

    // 1. Navigate to '/components/dropdown' on a fresh browser context
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    const response = await dropdownPage.gotoDropdown();

    // expect: Page loads successfully (HTTP 200, no console errors)
    expect(response?.status()).toBe(200);
    // expect: Heading 'Dropdown' (level 1) is visible
    await expect(page.getByRole('heading', { name: 'Dropdown', level: 1 })).toBeVisible();
    expect(consoleErrors).toEqual([]);

    // 2. Inspect the fruit dropdown block
    // expect: Label text 'Select the apple using visible text' is visible
    await expect(page.getByText('Select the apple using visible text')).toBeVisible();
    // expect: fruit select is visible/enabled, required, NOT multiple
    await expect(dropdownPage.fruitSelect).toBeVisible();
    await expect(dropdownPage.fruitSelect).toBeEnabled();
    await expect(dropdownPage.fruitSelect).toHaveAttribute('required', '');
    await expect(dropdownPage.fruitSelect).not.toHaveAttribute('multiple');
    // expect: fruit result text equals exactly 'No fruit selected'
    await expect(dropdownPage.fruitResult).toHaveText('No fruit selected');

    // 3. Inspect the superhero dropdown block
    // expect: Label text 'Select your super hero' is visible
    await expect(page.getByText('Select your super hero')).toBeVisible();
    // expect: superhero select is visible/enabled, required, multiple
    await expect(dropdownPage.superheroSelect).toBeVisible();
    await expect(dropdownPage.superheroSelect).toBeEnabled();
    await expect(dropdownPage.superheroSelect).toHaveAttribute('required', '');
    await expect(dropdownPage.superheroSelect).toHaveAttribute('multiple', '');
    // expect: superhero result text equals exactly 'None selected'
    await expect(dropdownPage.superheroResult).toHaveText('None selected');

    // 4. Inspect the language dropdown block
    // expect: Label text is visible
    await expect(page.getByText('Select the last programming language and print all the options')).toBeVisible();
    // expect: language select is visible/enabled, required, not multiple, value ''
    await expect(dropdownPage.langSelect).toBeVisible();
    await expect(dropdownPage.langSelect).toBeEnabled();
    await expect(dropdownPage.langSelect).toHaveAttribute('required', '');
    await expect(dropdownPage.langSelect).toHaveValue('');

    // 5. Inspect the country dropdown block
    // expect: Label text is visible
    await expect(page.getByText('Select India using value & print the selected value')).toBeVisible();
    // expect: country select is visible/enabled, required, not multiple, value ''
    await expect(dropdownPage.countrySelect).toBeVisible();
    await expect(dropdownPage.countrySelect).toBeEnabled();
    await expect(dropdownPage.countrySelect).toHaveAttribute('required', '');
    await expect(dropdownPage.countrySelect).toHaveValue('');

    // 6. Inspect the 'Insight' section without performing any click/expand interaction
    // expect: Heading 'Insight' (level 2) is visible immediately
    await expect(page.getByRole('heading', { name: 'Insight', level: 2 })).toBeVisible();
    // expect: The concept list contains the documented items
    const conceptList = page.getByRole('list').filter({ hasText: 'Select an option from a dropdown' });
    await expect(conceptList).toBeVisible();
    await expect(conceptList.getByText('Select an option from a dropdown')).toBeVisible();
    await expect(conceptList.getByText('Select multiple options from a multi-select dropdown')).toBeVisible();
    await expect(conceptList.getByText('Verify displayed selected value')).toBeVisible();
    // expect: A 'Github solution' link is visible with the expected href
    const githubLink = page.getByRole('link', { name: 'Github solution' });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/dropdown/dropdown.spec.ts'
    );
  });

  test("Every option's underlying value and visible label matches the confirmed live inventory for all four dropdowns", async ({
    page,
  }) => {
    const dropdownPage = new DropdownPage(page);
    await dropdownPage.gotoDropdown();

    // 1. Read .options from the fruit select
    const fruitOptions = await dropdownPage.fruitSelect.locator('option').evaluateAll((opts) =>
      opts.map((o) => ({ value: (o as HTMLOptionElement).value, label: o.textContent?.trim() }))
    );
    // expect: exactly 6 options in this exact order
    expect(fruitOptions).toEqual([
      { value: '', label: 'Select an option' },
      { value: 'Apple', label: 'Apple' },
      { value: 'Mango', label: 'Mango' },
      { value: 'Orange', label: 'Orange' },
      { value: 'Banana', label: 'Banana' },
      { value: 'Pineapple', label: 'Pineapple' },
    ]);
    // expect: only the placeholder option carries the hidden attribute on fresh load
    const hiddenFlags = await dropdownPage.fruitSelect.locator('option').evaluateAll((opts) =>
      opts.map((o) => ({ value: (o as HTMLOptionElement).value, hidden: o.hasAttribute('hidden') }))
    );
    expect(hiddenFlags.find((o) => o.value === '')?.hidden).toBe(true);
    expect(hiddenFlags.filter((o) => o.value !== '').every((o) => !o.hidden)).toBe(true);

    // 2. Read .options from the superhero select
    const superheroOptions = await dropdownPage.superheroSelect.locator('option').evaluateAll((opts) =>
      opts.map((o) => ({ value: (o as HTMLOptionElement).value, label: o.textContent?.trim() }))
    );
    // expect: exactly 10 options, value===label, in this exact order, no placeholder
    expect(superheroOptions).toEqual(
      ['Ant-Man', 'Aquaman', 'Batman', 'Superman', 'Spiderman', 'Venom', 'Ironman', 'Thor', 'Hulk', 'Black Panther'].map(
        (name) => ({ value: name, label: name })
      )
    );

    // 3. Read .options from the language select
    const langOptions = await dropdownPage.langSelect.locator('option').evaluateAll((opts) =>
      opts.map((o) => ({ value: (o as HTMLOptionElement).value, label: o.textContent?.trim() }))
    );
    // expect: exactly 6 options in this exact order, values differ from labels
    expect(langOptions).toEqual([
      { value: '', label: 'Select an option' },
      { value: 'js', label: 'Javascript' },
      { value: 'java', label: 'Java' },
      { value: 'py', label: 'Python' },
      { value: 'swift', label: 'Swift' },
      { value: 'sharp', label: 'C#' },
    ]);

    // 4. Read .options from the country select
    const countryOptions = await dropdownPage.countrySelect.locator('option').evaluateAll((opts) =>
      opts.map((o) => ({ value: (o as HTMLOptionElement).value, label: o.textContent?.trim() }))
    );
    // expect: 13 options, leading placeholder + 12 real countries, value === label
    expect(countryOptions).toEqual([
      { value: '', label: 'Select an option' },
      ...[
        'Argentina',
        'Bolivia',
        'Brazil',
        'Chile',
        'Colombia',
        'Ecuador',
        'India',
        'Paraguay',
        'Peru',
        'Suriname',
        'Uruguay',
        'Venezuela',
      ].map((name) => ({ value: name, label: name })),
    ]);
  });
});
