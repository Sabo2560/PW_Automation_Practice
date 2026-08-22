// spec: specs/window.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { WindowPage } from '../../pages/WindowPage';

test.describe('Window - Initial Load and Default State', () => {
  let windowPage: WindowPage;

  test.beforeEach(async ({ page }) => {
    windowPage = new WindowPage(page);
  });

  test('Window page loads with both exercise sections, labels, and Insight section correctly rendered', async ({
    page,
  }) => {
    // 1. Navigate to '/components/window' on a fresh browser context
    const consoleErrors = windowPage.trackConsoleErrors();
    const response = await windowPage.gotoWindow();

    // expect: Page loads successfully (HTTP 200, no console errors)
    expect(response?.status()).toBe(200);
    // expect: Heading 'Window' (level 1) is visible
    await expect(page.getByRole('heading', { name: 'Window', level: 1 })).toBeVisible();
    expect(consoleErrors).toEqual([]);

    // 2. Inspect both 'form-label' elements in DOM order
    // expect: The two labels read exactly, in order (note: only the first carries a trailing period)
    await expect(page.getByTestId('form-label')).toHaveText([
      'Click the button below and verify that new page has been opened.',
      'Click the button below and verify that modal window has been opened',
    ]);

    // 3. Inspect the 'Insight' section without performing any click/expand interaction
    // expect: Heading 'Insight' (level 2) is visible immediately with no interaction required
    await expect(page.getByRole('heading', { name: 'Insight', level: 2 })).toBeVisible();
    // expect: The concept list contains exactly the documented items, in order
    const conceptList = page.getByRole('list').filter({ hasText: 'Open new tab' });
    await expect(conceptList.getByRole('listitem')).toHaveText(['Open new tab', 'Open modal window', 'Interact with modal window']);
    // expect: A 'Github solution' link is visible with the expected href
    const githubLink = page.getByRole('link', { name: 'Github solution' });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/window/window.spec.ts'
    );
  });

  test('Both trigger buttons are visible, enabled, and correctly labeled by accessible name despite sharing an identical data-testid', async ({
    page,
  }) => {
    // 1. Navigate to '/components/window'. Query all elements matching '[data-testid="button-button"]' and
    //    separately locate buttons by accessible role+name 'Open New Tab' and 'Open Modal'
    await windowPage.gotoWindow();

    // expect: Exactly 2 elements match '[data-testid="button-button"]' (confirming the duplicate-testid
    //         condition documented in this plan's overview)
    await expect(page.locator('[data-testid="button-button"]')).toHaveCount(2);
    // expect: getByRole('button', { name: 'Open New Tab', exact: true }) resolves to exactly 1 element, visible and enabled
    const openNewTabButton = page.getByRole('button', { name: 'Open New Tab', exact: true });
    await expect(openNewTabButton).toHaveCount(1);
    await expect(openNewTabButton).toBeVisible();
    await expect(openNewTabButton).toBeEnabled();
    // expect: getByRole('button', { name: 'Open Modal', exact: true }) resolves to exactly 1 element, visible and enabled
    const openModalButton = page.getByRole('button', { name: 'Open Modal', exact: true });
    await expect(openModalButton).toHaveCount(1);
    await expect(openModalButton).toBeVisible();
    await expect(openModalButton).toBeEnabled();
    // expect: No modal is present in the DOM before any interaction ('[data-testid="window-modal"]' resolves to 0 elements)
    await expect(page.getByTestId('window-modal')).toHaveCount(0);
  });
});
