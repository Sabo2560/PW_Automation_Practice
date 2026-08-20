// spec: specs/multiselect.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { ALL_OPTIONS, MultiselectPage } from '../../pages/MultiselectPage';

test.describe('Multiselect - Initial Load and Default State', () => {
  test('Multiselect page loads with all three forms, labels, and Insight section correctly rendered', async ({
    page,
  }) => {
    const multiselectPage = new MultiselectPage(page);

    // 1. Navigate to '/components/multiselect' on a fresh browser context
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    const response = await multiselectPage.gotoMultiselect();

    // expect: Page loads successfully (HTTP 200, no console errors)
    expect(response?.status()).toBe(200);
    // expect: Heading 'Multiselect' (level 1) is visible
    await expect(page.getByRole('heading', { name: 'Multiselect', level: 1 })).toBeVisible();
    expect(consoleErrors).toEqual([]);

    // 2. Inspect form-1 ('[data-testid="multiselect-form-1"]')
    // expect: Label text is visible inside form-1
    await expect(
      multiselectPage.form1.getByText(
        'Select at least two items and verify that the selected items were actually chosen.'
      )
    ).toBeVisible();
    // expect: form-1's search textbox is visible and empty
    await expect(multiselectPage.searchInput(multiselectPage.form1)).toBeVisible();
    await expect(multiselectPage.searchInput(multiselectPage.form1)).toHaveValue('');
    // expect: form-1 has zero chip elements
    await expect(multiselectPage.chips(multiselectPage.form1)).toHaveCount(0);

    // 3. Inspect form-2 ('[data-testid="multiselect-form-2"]')
    // expect: Label text is visible inside form-2
    await expect(
      multiselectPage.form2.getByText(
        'Select all three items and verify that the dropdown displays a message indicating no further options are available.'
      )
    ).toBeVisible();
    // expect: form-2's search textbox is visible and empty
    await expect(multiselectPage.searchInput(multiselectPage.form2)).toBeVisible();
    await expect(multiselectPage.searchInput(multiselectPage.form2)).toHaveValue('');
    // expect: form-2 has zero chip elements
    await expect(multiselectPage.chips(multiselectPage.form2)).toHaveCount(0);

    // 4. Inspect form-3 ('[data-testid="multiselect-form-3"]')
    // expect: Label text is visible inside form-3
    await expect(
      multiselectPage.form3.getByText('Remove all pre-selected items and verify that no selections are present.')
    ).toBeVisible();
    // expect: form-3 has exactly 2 chip elements with text 'Option 4' and 'Option 5' (in that order), confirming the pre-selected default
    await expect(multiselectPage.chips(multiselectPage.form3)).toHaveText(['Option 4', 'Option 5']);

    // 5. Inspect the 'Insight' section without performing any click/expand interaction
    // expect: Heading 'Insight' (level 2) is visible immediately with no interaction required
    await expect(page.getByRole('heading', { name: 'Insight', level: 2 })).toBeVisible();
    // expect: The concept list contains exactly the documented items
    const conceptList = page.getByRole('list').filter({ hasText: 'Select multiple options from a list' });
    await expect(conceptList.getByRole('listitem')).toHaveText([
      'Select multiple options from a list',
      'Verify selected values',
      'Deselect pre-selected items',
      'Verify "no more options" state when all items are selected',
    ]);
    // expect: A 'Github solution' link is visible with the expected href
    const githubLink = page.getByRole('link', { name: 'Github solution' });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/multiselect/multiselect.spec.ts'
    );
  });

  test("Each form's underlying option inventory matches the confirmed live counts and labels, with option lists closed by default", async ({
    page,
  }) => {
    const multiselectPage = new MultiselectPage(page);

    // 1. Navigate to '/components/multiselect'. Without clicking any search box, read each form's '.optionListContainer' class
    await multiselectPage.gotoMultiselect();
    // expect: All three forms' option list containers carry class 'displayNone' (closed) on fresh load, before any interaction
    await expect(multiselectPage.optionListContainer(multiselectPage.form1)).toHaveClass(/displayNone/);
    await expect(multiselectPage.optionListContainer(multiselectPage.form2)).toHaveClass(/displayNone/);
    await expect(multiselectPage.optionListContainer(multiselectPage.form3)).toHaveClass(/displayNone/);

    // 2. Click form-1's search textbox to open its list, then read all '.optionContainer li' text values
    await multiselectPage.openForm(multiselectPage.form1);
    // expect: form-1's option list contains exactly these 10 items in this exact order
    await expect(multiselectPage.options(multiselectPage.form1)).toHaveText(ALL_OPTIONS);

    // 3. Click form-2's search textbox to open its list, then read all '.optionContainer li' text values
    await multiselectPage.closeOpenList();
    await multiselectPage.openForm(multiselectPage.form2);
    // expect: form-2's option list contains exactly these 3 items in this exact order, confirming a materially smaller option set than form-1/form-3
    await expect(multiselectPage.options(multiselectPage.form2)).toHaveText(['Option 1', 'Option 2', 'Option 3']);

    // 4. Click form-3's search textbox to open its list, then read all '.optionContainer li' text values
    await multiselectPage.closeOpenList();
    await multiselectPage.openForm(multiselectPage.form3);
    // expect: form-3's option list contains exactly these 8 remaining options (the 10-item full set minus the 2 already-selected chips),
    // confirming Option 4 and Option 5 are excluded from the open list precisely because they are already selected as chips
    await expect(multiselectPage.options(multiselectPage.form3)).toHaveText(
      ALL_OPTIONS.filter((o) => o !== 'Option 4' && o !== 'Option 5')
    );
  });
});
