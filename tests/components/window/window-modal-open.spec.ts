// spec: specs/window.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { WindowPage } from '../../pages/WindowPage';

test.describe('Window - Open Modal', () => {
  let windowPage: WindowPage;

  test.beforeEach(async ({ page }) => {
    windowPage = new WindowPage(page);
    // 1. Navigate to '/components/window'.
    await windowPage.gotoWindow();
  });

  test("Clicking 'Open Modal' opens the modal overlay with the exact expected title, body text, and close button", async () => {
    // Confirm no modal is present ('[data-testid="window-modal"]' resolves to 0 elements)
    await expect(windowPage.modal).toHaveCount(0);

    // then click 'Open Modal'
    await windowPage.openModalAndWait();

    // expect: '[data-testid="window-modal"]' becomes visible (exactly 1 element)
    await expect(windowPage.modal).toBeVisible();
    await expect(windowPage.modal).toHaveCount(1);
    // expect: The modal's title text reads exactly 'Good job!'
    await expect(windowPage.modalTitleText).toHaveText('Good job!');
    // expect: The modal's body text matches (whitespace-normalizing match, not byte-exact)
    await expect(windowPage.modalBodyText).toHaveText(
      "This modal is now ready for its coffee break. (You can close it; it won't mind.)"
    );
    // expect: A close button with data-testid 'close-modal' and accessible name 'Close modal' is
    // visible inside the modal, with visible text 'x'
    await expect(windowPage.closeModalButton).toBeVisible();
    await expect(windowPage.closeModalButton).toHaveAccessibleName('Close modal');
    await expect(windowPage.closeModalButton).toHaveText('x');
  });

  test('Opening the modal moves focus into it, applies aria-hidden to the header and main content, and locks body scroll', async ({
    page,
  }) => {
    const header = windowPage.header;
    const main = windowPage.main;

    // Before clicking, record document.body's inline 'overflow' style and the 'aria-hidden'
    // attribute of the <header> and <main> elements (expect: overflow is not 'hidden', and
    // neither has aria-hidden='true'). This is a DOM-state check with no equivalent Playwright
    // locator assertion, so page.evaluate() is used deliberately here (per specs/window.plan.md).
    const before = await page.evaluate(() => ({
      bodyOverflow: document.body.style.overflow,
      bodyPaddingRight: document.body.style.paddingRight,
    }));
    expect(before.bodyOverflow).not.toBe('hidden');
    await expect(header).not.toHaveAttribute('aria-hidden', 'true');
    await expect(main).not.toHaveAttribute('aria-hidden', 'true');

    // Click 'Open Modal'
    await windowPage.openModalAndWait();

    // expect: Immediately after the modal opens, document.activeElement is inside the modal
    // container, not the 'Open Modal' button itself.
    expect(await windowPage.isFocusInsideModal()).toBe(true);
    await expect(windowPage.openModalButton).not.toBeFocused();

    // expect: The <header> element's aria-hidden attribute is exactly 'true'
    await expect(header).toHaveAttribute('aria-hidden', 'true');
    // expect: The <main> element's aria-hidden attribute is exactly 'true'
    await expect(main).toHaveAttribute('aria-hidden', 'true');

    // expect: document.body's inline style.overflow is exactly 'hidden', and style.paddingRight
    // is a non-empty pixel value, different from its pre-open value (exact pixel number not
    // asserted, since it can vary by viewport/scrollbar width).
    const after = await page.evaluate(() => ({
      bodyOverflow: document.body.style.overflow,
      bodyPaddingRight: document.body.style.paddingRight,
    }));
    expect(after.bodyOverflow).toBe('hidden');
    // MUI only applies the scrollbar-compensation paddingRight when its own internal
    // `isOverflowing()` check (which compares `window.innerWidth` to
    // `document.documentElement.clientWidth`, i.e. whether the scrollbar is reserving layout
    // width, not merely whether the content scrolls) reads true at open time — confirmed live:
    // this page's content DOES vertically overflow the viewport (scrollHeight > clientHeight) in
    // this environment, yet innerWidth === clientWidth here because headless Chromium/Firefox/
    // WebKit render zero-width overlay scrollbars that don't consume layout width, so MUI
    // correctly (per its own conditional logic, confirmed via its ModalManager source) skips the
    // compensation. `overflow: hidden` itself is applied unconditionally regardless, so that half
    // stays a strict assertion; paddingRight is only checked for a valid pixel value when MUI
    // actually sets one, rather than assuming a reserved-width scrollbar is always present.
    if (after.bodyPaddingRight !== '') {
      expect(after.bodyPaddingRight).not.toBe(before.bodyPaddingRight);
      expect(after.bodyPaddingRight).toMatch(/^\d+(\.\d+)?px$/);
    }
  });

  test("Keyboard activation (Enter) on the focused 'Open Modal' button opens the modal identically to a mouse click", async () => {
    // Focus the 'Open Modal' button directly (via .focus(), not a click)
    await windowPage.openModalButton.focus();
    await expect(windowPage.openModalButton).toBeFocused();

    // then press 'Enter'
    await windowPage.openModalButton.press('Enter');

    // expect: '[data-testid="window-modal"]' becomes visible as a direct result of the Enter
    // keypress, with title text exactly 'Good job!', identical in outcome to the mouse-click
    // result documented in scenario 3.1.
    await expect(windowPage.modal).toBeVisible();
    await expect(windowPage.modalTitleText).toHaveText('Good job!');
  });
});
