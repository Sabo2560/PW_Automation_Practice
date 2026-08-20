// spec: specs/radio.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { RadioPage } from '../../pages/RadioPage';

test.describe('Radio - Initial Load and Default State', () => {
  let radioPage: RadioPage;

  test.beforeEach(async ({ page }) => {
    radioPage = new RadioPage(page);
  });

  test('Radio page loads with all seven exercise sections, labels, and Insight section correctly rendered', async ({
    page,
  }) => {
    // 1. Navigate to '/components/radio' on a fresh browser context
    const consoleErrors = radioPage.trackConsoleErrors();
    const response = await radioPage.gotoRadio();

    // expect: Page loads successfully (HTTP 200, no console errors)
    expect(response?.status()).toBe(200);
    // expect: Heading 'Radio' (level 1) is visible
    await expect(page.getByRole('heading', { name: 'Radio', level: 1 })).toBeVisible();
    expect(consoleErrors).toEqual([]);

    // 2. Inspect all seven 'form-label' elements in DOM order
    // expect: The seven labels read exactly, in order, including the live 'Cofirm' typo exactly as rendered
    await expect(page.getByTestId('form-label')).toHaveText([
      'Select any one',
      'Cofirm you can select only one radio button',
      'Find the bug',
      'Find which one is selected',
      'Confirm last field is disabled',
      'Find if the checkbox is selected?',
      'Accept the T&C',
    ]);

    // 3. Inspect the 'Insight' section without performing any click/expand interaction
    // expect: Heading 'Insight' (level 2) is visible immediately with no interaction required
    await expect(page.getByRole('heading', { name: 'Insight', level: 2 })).toBeVisible();
    // expect: The concept list contains exactly the documented items
    const conceptList = page.getByRole('list').filter({ hasText: 'Select a radio button option' });
    await expect(conceptList.getByRole('listitem')).toHaveText([
      'Select a radio button option',
      'Verify the selected state',
      'Verify disabled option cannot be selected',
      'Interact with a checkbox',
    ]);
    // expect: A 'Github solution' link is visible with the expected href
    const githubLink = page.getByRole('link', { name: 'Github solution' });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/radio/radio.spec.ts'
    );
  });

  test("Every control's default checked/disabled state matches the confirmed live baseline on fresh load", async () => {
    // 1. Navigate to '/components/radio' on a fresh browser context. Without any interaction, read the
    //    '.checked' and '.disabled' properties of all 13 radio/checkbox inputs
    await radioPage.gotoRadio();

    // expect: every control matches its documented fresh-load default (answer-radio/one-radio/find-the-bug
    // all unchecked; foobar-radio Bar checked, Foo not; event-radio all unchecked with Maybe disabled;
    // Remember-me checked; T&C unchecked)
    await radioPage.expectDefaultState();
  });
});
