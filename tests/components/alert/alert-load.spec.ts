// spec: specs/alert.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { AlertPage } from '../../pages/AlertPage';

test.describe('Alert - Initial Load and Default State', () => {
  test('Alert page loads with all four trigger buttons, labels, and the Insight section correctly rendered', async ({
    page,
  }) => {
    const alertPage = new AlertPage(page);
    const consoleErrors = alertPage.trackConsoleErrors();

    // 1. Navigate to '/components/alert' on a fresh browser context
    const response = await alertPage.gotoAlert();

    // expect: Page loads successfully (HTTP 200, no console errors)
    expect(response?.status()).toBe(200);
    // expect: Heading 'Alert' (level 1) is visible
    await expect(page.getByRole('heading', { name: 'Alert', level: 1 })).toBeVisible();
    expect(consoleErrors).toEqual([]);

    // 2. Inspect all four trigger buttons and their preceding label text
    // expect: '[data-testid="button-simple-alert"]' is visible, enabled, with text 'Simple Alert', preceded by label text 'Accept the Alert'
    await expect(alertPage.simpleAlertBtn).toBeVisible();
    await expect(alertPage.simpleAlertBtn).toBeEnabled();
    await expect(alertPage.simpleAlertBtn).toHaveText('Simple Alert');
    await expect(page.getByText('Accept the Alert')).toBeVisible();

    // expect: '[data-testid="button-confirm-alert"]' is visible, enabled, with text 'Confirm Alert', preceded by label text 'Dismiss the Alert & print the alert text'
    await expect(alertPage.confirmAlertBtn).toBeVisible();
    await expect(alertPage.confirmAlertBtn).toBeEnabled();
    await expect(alertPage.confirmAlertBtn).toHaveText('Confirm Alert');
    await expect(page.getByText('Dismiss the Alert & print the alert text')).toBeVisible();

    // expect: '[data-testid="button-prompt-alert"]' is visible, enabled, with text 'Prompt Alert', preceded by label text 'Type your name & accept'
    await expect(alertPage.promptAlertBtn).toBeVisible();
    await expect(alertPage.promptAlertBtn).toBeEnabled();
    await expect(alertPage.promptAlertBtn).toHaveText('Prompt Alert');
    await expect(page.getByText('Type your name & accept')).toBeVisible();

    // expect: '[data-testid="button-sweet-alert"]' is visible, enabled, with text 'Modern Alert', preceded by label text 'Sweet alert'
    await expect(alertPage.sweetAlertBtn).toBeVisible();
    await expect(alertPage.sweetAlertBtn).toBeEnabled();
    await expect(alertPage.sweetAlertBtn).toHaveText('Modern Alert');
    await expect(page.getByText('Sweet alert')).toBeVisible();

    // 3. Inspect the 'Insight' section without performing any click/expand interaction
    // expect: Heading 'Insight' (level 2) is visible immediately, with no interaction required to reveal it
    await expect(page.getByRole('heading', { name: 'Insight', level: 2 })).toBeVisible();

    // expect: The concept list is visible and contains at least the items 'Handle browser native alert dialogs' and 'Interact with custom alert components'
    const conceptList = page.getByRole('list').filter({ hasText: 'Handle browser native alert dialogs' });
    await expect(conceptList).toBeVisible();
    await expect(conceptList.getByText('Handle browser native alert dialogs')).toBeVisible();
    await expect(conceptList.getByText('Interact with custom alert components')).toBeVisible();

    // expect: A 'Github solution' link is visible with href 'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/alert/alert.spec.ts'
    const githubLink = page.getByRole('link', { name: 'Github solution' });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/alert/alert.spec.ts'
    );
  });

  test('No result/feedback text exists anywhere on the page before any trigger has been interacted with', async ({
    page,
  }) => {
    const alertPage = new AlertPage(page);

    // 1. Navigate to '/components/alert' and scan the full page for any pre-existing result text or open dialogs
    // expect: No native browser dialog is open (page loads and settles without any dialog event firing)
    await alertPage.expectNoDialogFires(async () => {
      await alertPage.gotoAlert();
      await page.waitForLoadState('networkidle');
    });

    // expect: No element containing the text 'You entered' exists anywhere in the DOM
    await expect(page.getByText('You entered')).toHaveCount(0);
    // expect: No element with role 'dialog' exists anywhere in the DOM (SweetAlert modal not open)
    await expect(alertPage.sweetAlertModal).toHaveCount(0);
  });
});
