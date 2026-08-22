// spec: specs/window.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { WindowPage } from '../../pages/WindowPage';

test.describe('Window - Reload Persistence', () => {
  let windowPage: WindowPage;

  test.beforeEach(async ({ page }) => {
    windowPage = new WindowPage(page);
    // 1. Navigate to '/components/window'.
    await windowPage.gotoWindow();
  });

  test('No modal state persists across a page reload — the modal is always closed/absent on a freshly-loaded page', async ({
    page,
  }) => {
    const header = windowPage.header;
    const main = windowPage.main;

    // Open the modal.
    await windowPage.openModalAndWait();

    // Confirm it is visible (sanity check that the modal was genuinely open going into the
    // reload) before reloading WITHOUT first closing the modal.
    await expect(windowPage.modal).toBeVisible();
    await page.reload();

    // 2. After the reload completes:
    // expect: '[data-testid="window-modal"]' resolves to 0 elements (the modal does not persist
    // across a reload, regardless of whether it was open or closed at the moment of reload).
    await expect(windowPage.modal).toHaveCount(0);

    // expect: document.body's inline style.overflow is not 'hidden' (back to its default
    // fresh-load state). No Playwright locator equivalent exists for reading an element's inline
    // style property, so page.evaluate() is used deliberately here, consistent with the
    // established pattern in window-modal-open.spec.ts.
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).not.toBe('hidden');

    // expect: The <header> and <main> elements do not carry aria-hidden='true' (back to their
    // default fresh-load state).
    await expect(header).not.toHaveAttribute('aria-hidden', 'true');
    await expect(main).not.toHaveAttribute('aria-hidden', 'true');

    // expect: Both trigger buttons ('Open New Tab', 'Open Modal') are visible and enabled again,
    // confirming the page reloaded cleanly to its documented fresh-load default state.
    await expect(windowPage.openNewTabButton).toBeVisible();
    await expect(windowPage.openNewTabButton).toBeEnabled();
    await expect(windowPage.openModalButton).toBeVisible();
    await expect(windowPage.openModalButton).toBeEnabled();
  });
});
