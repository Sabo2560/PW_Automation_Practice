// spec: specs/window.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { WindowPage } from '../../pages/WindowPage';

test.describe('Window - Open New Tab', () => {
  let windowPage: WindowPage;

  test.beforeEach(async ({ page }) => {
    windowPage = new WindowPage(page);
  });

  test("Clicking 'Open New Tab' opens a genuine new browser tab at '/new-tab-page' with exact expected content, while original tab's state is fully preserved", async ({
    page,
  }) => {
    // 1. Navigate to '/components/window'. Use windowPage.openNewTabAndGetNewPage() to click and capture the new Page.
    await windowPage.gotoWindow();
    const newPage = await windowPage.openNewTabAndGetNewPage();

    // expect: The new page's URL resolves to the '/new-tab-page' route
    await expect(newPage).toHaveURL(/\/new-tab-page$/);
    // expect: The new page contains a heading (level 1) reading exactly 'Congratulations! You opened new tab.'
    await expect(windowPage.newTabPageHeading(newPage)).toHaveText('Congratulations! You opened new tab.');
    // expect: The new page contains a paragraph reading exactly the documented copy
    await expect(newPage.getByText('New tab, new you! (Just kidding. But you can learn something new, so, go for it!)')).toBeVisible();

    // 2. Without closing the new tab, switch back to the original page/tab and re-inspect its state
    // expect: The original page's URL is still exactly '/components/window' (unchanged — it was never navigated away)
    await expect(page).toHaveURL(/\/components\/window$/);
    // expect: The original page's heading 'Window', both 'form-label' elements, and the Insight section are all still present and unchanged
    await expect(page.getByRole('heading', { name: 'Window', level: 1 })).toBeVisible();
    await expect(page.getByTestId('form-label')).toHaveText([
      'Click the button below and verify that new page has been opened.',
      'Click the button below and verify that modal window has been opened',
    ]);
    await expect(page.getByRole('heading', { name: 'Insight', level: 2 })).toBeVisible();
  });

  test("Each click on 'Open New Tab' opens an independent, separate new tab rather than reusing or replacing a previously-opened one", async ({
    page,
  }) => {
    // 1. Navigate to '/components/window'. Click 'Open New Tab' three times in sequence, capturing each resulting Page.
    await windowPage.gotoWindow();
    const firstPage = await windowPage.openNewTabAndGetNewPage();
    const secondPage = await windowPage.openNewTabAndGetNewPage();
    const thirdPage = await windowPage.openNewTabAndGetNewPage();

    // expect: Exactly 3 distinct new Page objects are captured, one per click (not 1 reused object, not fewer than 3)
    const capturedPages = new Set([firstPage, secondPage, thirdPage]);
    expect(capturedPages.size).toBe(3);

    // expect: All 3 new pages simultaneously resolve to the '/new-tab-page' route and remain open and accessible
    //         at the same time (re-checked after all 3 clicks have completed)
    for (const capturedPage of capturedPages) {
      await expect(capturedPage).toHaveURL(/\/new-tab-page$/);
      await expect(windowPage.newTabPageHeading(capturedPage)).toHaveText('Congratulations! You opened new tab.');
    }

    // expect: The original tab remains on '/components/window' throughout, unaffected by any of the 3 clicks
    await expect(page).toHaveURL(/\/components\/window$/);
  });

  test("Keyboard activation (Enter) on the focused 'Open New Tab' button opens a new tab identically to a mouse click", async ({
    page,
  }) => {
    // 1. Navigate to '/components/window'. Focus the 'Open New Tab' button directly (via .focus(), not a click),
    //    then begin listening for a new 'page' event and press 'Enter'
    await windowPage.gotoWindow();
    await windowPage.openNewTabButton.focus();
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      page.keyboard.press('Enter'),
    ]);
    await newPage.waitForLoadState();

    // expect: A new Page object is created as a result of the Enter keypress
    expect(newPage).toBeTruthy();
    // expect: The new page's URL resolves to '/new-tab-page' and its heading (level 1) reads exactly the
    //         documented text, identical in outcome to the mouse-click result documented in scenario 2.1
    await expect(newPage).toHaveURL(/\/new-tab-page$/);
    await expect(windowPage.newTabPageHeading(newPage)).toHaveText('Congratulations! You opened new tab.');
  });

  test("The new-tab-page has no 'BACK' button and its own header navigation links function independently of the original tab", async ({
    page,
  }) => {
    // 1. Navigate directly to '/new-tab-page' in a fresh browser context (bypassing the click flow, to inspect
    //    the page's own baseline structure in isolation)
    await page.goto('/new-tab-page');

    // expect: No button with the accessible name 'BACK' exists anywhere on this page (0 matches)
    await expect(page.getByRole('button', { name: 'BACK' })).toHaveCount(0);
    // expect: The shared header/nav (links 'Home', 'Components', 'F.A.Q') and footer copyright text are present
    //         and structurally identical to every other page on the site
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Components' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'F.A.Q' })).toBeVisible();
    await expect(page.getByText('All rights reserved.')).toBeVisible();
  });
});
