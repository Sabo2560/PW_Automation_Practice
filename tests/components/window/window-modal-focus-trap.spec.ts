// spec: specs/window.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { WindowPage } from '../../pages/WindowPage';

test.describe('Window - Modal Focus Trap and Background Interaction Blocking', () => {
  let windowPage: WindowPage;

  test.beforeEach(async ({ page }) => {
    windowPage = new WindowPage(page);
    // 1. Navigate to '/components/window' and open the modal.
    await windowPage.gotoWindow();
    await windowPage.openModalAndWait();
  });

  test('Tab key presses keep focus cycling within the modal and never escape to background page content', async ({
    page,
  }) => {
    // expect: Immediately after opening, document.activeElement is inside the modal (a
    // descendant of '[data-testid="window-modal"]').
    expect(await windowPage.isFocusInsideModal()).toBe(true);
    await expect(windowPage.closeModalButton).not.toBeFocused();

    // 2. Press 'Tab' once.
    await page.keyboard.press('Tab');

    // expect: document.activeElement is now exactly the 'close-modal' button (the only focusable
    // descendant of the modal besides its own non-tabbable container).
    await expect(windowPage.closeModalButton).toBeFocused();

    // 3. Press 'Tab' a second time.
    await page.keyboard.press('Tab');

    // expect: document.activeElement is STILL exactly the 'close-modal' button (unchanged from
    // after the first Tab press) — confirming focus cycles back within the modal via its
    // sentinel boundary elements rather than escaping to any element on the page behind it (e.g.
    // header nav links or the 'Open New Tab' button).
    await expect(windowPage.closeModalButton).toBeFocused();
  });

  test('[QUIRK] While modal is open, background page content is provably obscured from pointer-event hit-testing at its exact coordinates', async () => {
    // 1. Call windowPage.isElementObscuredByBackdrop(windowPage.openNewTabButton) while the modal
    // is open. This helper uses document.elementFromPoint() internally and NEVER issues a real
    // click — a real Playwright .click() attempt on this background button while the modal is
    // open was confirmed during planning to hang indefinitely rather than fail fast, so no real
    // click is ever performed against it in this test.
    const obscuredWhileOpen = await windowPage.isElementObscuredByBackdrop(windowPage.openNewTabButton);

    // expect: document.elementFromPoint() at the 'Open New Tab' button's bounding-box center
    // returns the backdrop element (class list includes 'MuiBackdrop-root'), not the button or
    // its descendants, while the modal is open.
    expect(obscuredWhileOpen).toBe(true);

    // 2. Close the modal (via Escape), then re-run the same check at the same target.
    await windowPage.closeModalViaEscape();
    const obscuredAfterClose = await windowPage.isElementObscuredByBackdrop(windowPage.openNewTabButton);

    // expect: it now returns false — confirming background content becomes interactive again
    // (elementFromPoint would now resolve to the button itself or a descendant) once the modal is
    // closed, i.e. this is a modal-open-specific state, not a permanent condition.
    expect(obscuredAfterClose).toBe(false);
  });
});
