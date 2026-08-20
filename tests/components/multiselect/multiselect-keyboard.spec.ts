// spec: specs/multiselect.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { MultiselectPage } from '../../pages/MultiselectPage';

test.describe('Multiselect - Keyboard Interaction', () => {
  let multiselectPage: MultiselectPage;

  test.beforeEach(async ({ page }) => {
    multiselectPage = new MultiselectPage(page);
    await multiselectPage.gotoMultiselect();
  });

  test('ArrowDown moves the keyboard highlight forward through the option list one item per keypress', async ({ page }) => {
    // 1. Navigate to '/components/multiselect', click form-1's search textbox to open and focus it, then read the option list HTML
    await multiselectPage.openForm(multiselectPage.form1);
    const highlightedOption = multiselectPage.highlightedOption(multiselectPage.form1);
    await expect(highlightedOption).toHaveCount(1);
    await expect(highlightedOption).toHaveText('Option 1');

    // 2. Press 'ArrowDown' once
    await page.keyboard.press('ArrowDown');
    await expect(highlightedOption).toHaveCount(1);
    await expect(highlightedOption).toHaveText('Option 2');

    // 3. Press 'ArrowDown' two more times (three total)
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await expect(highlightedOption).toHaveCount(1);
    await expect(highlightedOption).toHaveText('Option 4');
  });

  test('Enter selects the currently keyboard-highlighted option, producing an identical result to a mouse click', async ({ page }) => {
    // 1. Navigate to '/components/multiselect', focus form-1's search textbox, press 'ArrowDown' once (moving highlight to 'Option 2'), then press 'Enter'
    await multiselectPage.openForm(multiselectPage.form1);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(multiselectPage.chips(multiselectPage.form1)).toHaveText(['Option 2']);
    await expect(multiselectPage.option(multiselectPage.form1, 'Option 2')).toHaveCount(0);
  });

  test('[QUIRK] Escape does not close the open option list, unlike common combobox conventions', async ({ page }) => {
    // 1. Navigate to '/components/multiselect', click form-1's search textbox to open its option list (confirm '.optionListContainer' class is 'displayBlock'), then press 'Escape'
    await multiselectPage.openForm(multiselectPage.form1);
    const optionListContainer = multiselectPage.optionListContainer(multiselectPage.form1);
    await expect(optionListContainer).toHaveClass(/displayBlock/);

    await page.keyboard.press('Escape');

    await expect(optionListContainer).toHaveClass(/displayBlock/);
  });

  test("Clicking outside an open form's widget closes only that widget's list without altering its chip selections", async () => {
    // 1. Navigate to '/components/multiselect', open form-1's dropdown and select 'Option 3' (list remains open), then click the page's 'Multiselect' heading (an element clearly outside the widget)
    await multiselectPage.openForm(multiselectPage.form1);
    await multiselectPage.selectOption(multiselectPage.form1, 'Option 3');
    await multiselectPage.closeOpenList();

    const optionListContainer = multiselectPage.optionListContainer(multiselectPage.form1);
    await expect(optionListContainer).toHaveClass(/displayNone/);
    await expect(multiselectPage.chips(multiselectPage.form1)).toHaveText(['Option 3']);
  });
});
