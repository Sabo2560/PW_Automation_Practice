// spec: specs/alert.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { AlertPage } from '../../pages/AlertPage';

test.describe('Alert - Cross-Trigger Independence', () => {
  test('All four alert triggers behave correctly and independently when exercised in sequence on a single page load', async ({
    page,
  }) => {
    const alertPage = new AlertPage(page);
    const consoleErrors = alertPage.trackConsoleErrors();
    await alertPage.gotoAlert();

    // (a) simple alert — accept — expect: no on-page text change
    const simple = await alertPage.captureTextAround(async () => {
      const dialog = await alertPage.triggerDialog(alertPage.simpleAlertBtn, { action: 'accept' });
      expect(dialog.type).toBe('alert');
    });
    expect(simple.after).toBe(simple.before);

    // (b) confirm — accept — expect: no on-page text change
    const confirm = await alertPage.captureTextAround(async () => {
      const dialog = await alertPage.triggerDialog(alertPage.confirmAlertBtn, { action: 'accept' });
      expect(dialog.type).toBe('confirm');
    });
    expect(confirm.after).toBe(confirm.before);

    // (c) prompt — accept with text 'Sequence Test' — expect: not stale/leaked text from earlier steps
    await alertPage.triggerDialog(alertPage.promptAlertBtn, { action: 'accept', value: 'Sequence Test' });
    await expect(page.getByText('You entered: Sequence Test')).toBeVisible();

    // (d) SweetAlert — open then click 'Yes' — expect: opens/closes cleanly, no residual state from the prior steps
    await alertPage.openSweetAlert();
    await alertPage.closeSweetAlertViaYes();
    await alertPage.expectSweetAlertClosed();

    // expect: No JavaScript console errors are logged at any point during the full sequence
    expect(consoleErrors).toEqual([]);
  });
});
