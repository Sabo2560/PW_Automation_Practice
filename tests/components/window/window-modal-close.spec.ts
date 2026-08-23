// spec: specs/window.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { WindowPage } from '../../pages/WindowPage';

test.describe('Window - Modal Close Mechanisms', () => {
  let windowPage: WindowPage;

  test.beforeEach(async ({ page }) => {
    windowPage = new WindowPage(page);
    // 1. Navigate to '/components/window' and open the modal by clicking 'Open Modal'.
    await windowPage.gotoWindow();
    await windowPage.openModalAndWait();

    // Confirm the modal is visible.
    await expect(windowPage.modal).toBeVisible();
  });

  test("Clicking the close ('x') button closes the modal and fully restores the pre-open page state", async ({
    browserName,
  }) => {
    // Click the 'close-modal' (x) button.
    await windowPage.closeModalViaX();

    // expect: document.activeElement is exactly the 'Open Modal' button again (focus restored) —
    // skipped on WebKit, where this is OS-dependent (see expectClosedStateFullyRestored()'s doc
    // comment: opposite outcomes confirmed live on local Windows vs. CI's Linux WebKit build).
    // expect: <header> and <main> no longer carry aria-hidden='true' (removed or 'false').
    // expect: document.body's inline style.overflow is reset to its pre-open value (empty string).
    await windowPage.expectClosedStateFullyRestored(browserName);
  });

  test('Pressing Escape while the modal is open closes it with the same full state restoration as the close button', async ({
    browserName,
  }) => {
    // Close the modal via Escape.
    await windowPage.closeModalViaEscape();

    // Same expectations as the 'x' button: modal gone, focus restored to the 'Open Modal' button
    // (chromium/firefox; not WebKit — see expectClosedStateFullyRestored()'s doc comment),
    // header/main aria-hidden removed, body overflow reset.
    await windowPage.expectClosedStateFullyRestored(browserName);
  });

  test("Clicking the modal's backdrop closes it with the same full state restoration as the other two mechanisms", async ({
    browserName,
  }) => {
    // Click the modal's backdrop at a point clearly outside the modal's content box
    // (closeModalViaBackdropClick() clicks at a point outside the content box and polls for
    // removal internally, since a same-tick synchronous DOM check can read React's pre-flush
    // state — don't add a raw click).
    await windowPage.closeModalViaBackdropClick();

    // Same expectations as the other two close mechanisms: modal gone, focus restored to the
    // 'Open Modal' button (chromium/firefox; not WebKit — see expectClosedStateFullyRestored()'s
    // doc comment), header/main aria-hidden removed, body overflow reset.
    await windowPage.expectClosedStateFullyRestored(browserName);
  });
});
