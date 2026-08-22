// spec: specs/window.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { WindowPage } from '../../pages/WindowPage';

/**
 * Opens and closes the modal via all three close mechanisms (the 'x' button, Escape, and a
 * backdrop click), reopening the modal before each one — the shared interaction sequence used by
 * both the network-requests and console-errors scenarios below, per specs/window.plan.md §6.
 */
async function performAllThreeCloseMechanisms(windowPage: WindowPage) {
  await windowPage.openModalAndWait();
  await windowPage.closeModalViaX();

  await windowPage.openModalAndWait();
  await windowPage.closeModalViaEscape();

  await windowPage.openModalAndWait();
  await windowPage.closeModalViaBackdropClick();
}

test.describe('Window - Cross-Widget Independence and Network/Console Behavior', () => {
  let windowPage: WindowPage;

  test.beforeEach(async ({ page }) => {
    windowPage = new WindowPage(page);
    await windowPage.gotoWindow();
  });

  test('Opening and closing the modal has no effect on the new-tab exercise\'s own subsequent behavior, and vice versa', async () => {
    // 1. Open the modal and close it via the 'x' button (openModalAndWait() + closeModalViaX() —
    // a full completed cycle). Then click 'Open New Tab' and await the resulting new page.
    await windowPage.openModalAndWait();
    await windowPage.closeModalViaX();
    const newPage = await windowPage.openNewTabAndGetNewPage();

    // expect: the new tab opens successfully with URL '/new-tab-page' and heading (level 1)
    // 'Congratulations! You opened new tab.', confirming the prior modal cycle left no residual
    // state interfering with the new-tab exercise.
    await expect(newPage).toHaveURL(/\/new-tab-page$/);
    await expect(windowPage.newTabPageHeading(newPage)).toHaveText('Congratulations! You opened new tab.');

    // 2. On the original tab, open the modal again.
    await windowPage.openModalAndWait();

    // expect: '[data-testid="window-modal"]' becomes visible again with title text exactly
    // 'Good job!' (modalTitleText), confirming the prior new-tab click left no residual state
    // interfering with the modal exercise, and the modal can be reopened correctly after a full
    // prior open/close cycle in the same session.
    await expect(windowPage.modal).toBeVisible();
    await expect(windowPage.modalTitleText).toHaveText('Good job!');
  });

  test('No API/network requests fire as a result of opening or closing the modal (purely client-side); the new-tab action is a real page navigation, not an API call', async () => {
    // 1. Begin recording network requests, then open the modal and close it via all three
    // mechanisms in turn (x button, Escape, backdrop click), each preceded by reopening the modal.
    const apiRequests = windowPage.trackApiRequests('/components/window');

    await performAllThreeCloseMechanisms(windowPage);

    // expect: no XHR/fetch network request specific to any modal open/close action is observed
    // (only pre-existing Next.js RSC prefetch requests for unrelated nav links and for
    // '/new-tab-page' are acceptable — trackApiRequests() already excludes document/asset GET
    // traffic, so any residual entry here would indicate a genuine API call).
    expect(apiRequests).toEqual([]);

    // 2. Continue recording, then click 'Open New Tab' and allow the resulting new page to finish
    // loading. trackApiRequests() deliberately excludes 'document' resourceType requests, so
    // trackDocumentRequests() is used here instead to confirm the new-tab click produces a real
    // page-navigation request rather than an API call.
    const newTabDocumentRequests = windowPage.trackDocumentRequests('/new-tab-page');
    const newPage = await windowPage.openNewTabAndGetNewPage();

    // expect: exactly one real page-navigation request (a full document GET) to '/new-tab-page' is
    // observed as a direct result of the click.
    expect(newTabDocumentRequests).toHaveLength(1);
    await expect(newPage).toHaveURL(/\/new-tab-page$/);
  });

  test('No console errors are logged during extensive interaction with either exercise, including focus-trap and backdrop-interception checks', async ({
    page,
  }) => {
    // 1. Begin tracking console errors, then perform a broad interaction sequence.
    const consoleErrors = windowPage.trackConsoleErrors();

    // Open/close the modal via all three close mechanisms, reopening between each.
    await performAllThreeCloseMechanisms(windowPage);

    // Tab through the focus trap: open modal, press Tab twice.
    await windowPage.openModalAndWait();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(windowPage.closeModalButton).toBeFocused();

    // Run the elementFromPoint background-obscuring check (modal open then closed).
    const obscuredWhileOpen = await windowPage.isElementObscuredByBackdrop(windowPage.openNewTabButton);
    expect(obscuredWhileOpen).toBe(true);
    await windowPage.closeModalViaEscape();
    const obscuredAfterClose = await windowPage.isElementObscuredByBackdrop(windowPage.openNewTabButton);
    expect(obscuredAfterClose).toBe(false);

    // Click 'Open New Tab' twice.
    await windowPage.openNewTabAndGetNewPage();
    await windowPage.openNewTabAndGetNewPage();

    // expect: zero console error messages are logged throughout the entire sequence.
    expect(consoleErrors).toEqual([]);
  });
});
