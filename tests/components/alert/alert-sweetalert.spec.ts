// spec: specs/alert.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { AlertPage } from '../../pages/AlertPage';

test.describe('Alert - Custom SweetAlert Modal', () => {
  test("SweetAlert modal opens with correct content and closes via its 'Yes' button", async ({ page }) => {
    const alertPage = new AlertPage(page);
    await alertPage.gotoAlert();

    // 1. Click the sweet-alert trigger (a custom in-page modal, not a native browser dialog)
    await alertPage.openSweetAlert();

    // expect: An element with role 'dialog' becomes visible
    await expect(alertPage.sweetAlertModal).toBeVisible();
    // expect: Heading 'Error!' (level 2) is visible within the modal
    await expect(alertPage.sweetAlertHeading).toBeVisible();
    // expect: Text 'Do you want to continue?' is visible within the modal
    await expect(page.getByText('Do you want to continue?')).toBeVisible();
    // expect: Exactly one button is present inside the modal, with text 'Yes' — no 'No'/Cancel button exists
    await expect(alertPage.sweetAlertModal.getByRole('button')).toHaveCount(1);
    await expect(alertPage.sweetAlertYesBtn).toBeVisible();

    // 2. Click the 'Yes' button
    await alertPage.closeSweetAlertViaYes();

    // expect: The modal is fully closed
    await alertPage.expectSweetAlertClosed();
  });

  test('SweetAlert modal dismisses via the Escape key', async ({ page }) => {
    const alertPage = new AlertPage(page);
    await alertPage.gotoAlert();

    // 1. Open the modal, confirm it is open, then press Escape
    await alertPage.openSweetAlert();
    await alertPage.closeSweetAlertViaEscape();

    // expect: The modal is fully closed, confirming Escape fully dismisses it
    await alertPage.expectSweetAlertClosed();
  });

  test('SweetAlert modal dismisses via outside/backdrop click', async ({ page }) => {
    const alertPage = new AlertPage(page);
    await alertPage.gotoAlert();

    // 1. Open the modal, confirm it is open, then click the backdrop outside the popup
    await alertPage.openSweetAlert();
    await alertPage.closeSweetAlertViaBackdropClick();

    // expect: The modal is fully closed, confirming an outside click fully dismisses it
    await alertPage.expectSweetAlertClosed();
  });
});
