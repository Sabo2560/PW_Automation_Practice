// spec: specs/button.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { ButtonPage } from '../../pages/ButtonPage';

test.describe('Button - Go Home Navigation', () => {
  test("Clicking 'Go Home' navigates to the home page in the same tab", async ({ page, context }) => {
    const buttonPage = new ButtonPage(page);

    // 1. Navigate to '/components/button' and inspect the wrapping '<a>' element around '[data-testid="button-go-home"]' without clicking
    await buttonPage.gotoButton();

    const goHomeLink = page.locator('a', { has: buttonPage.goHomeBtn });

    // expect: The wrapping link's href attribute equals '/'
    await expect(goHomeLink).toHaveAttribute('href', '/');
    // expect: The wrapping link has no 'target' attribute set (i.e., not '_blank'), confirming same-tab navigation is expected
    await expect(goHomeLink).not.toHaveAttribute('target', /.+/);

    // 2. Click '[data-testid="button-go-home"]'
    const pagesBeforeClick = context.pages().length;
    await buttonPage.goHomeBtn.click();

    // expect: The browser navigates to '/' within the SAME tab/page (no new tab or window is opened)
    expect(context.pages().length).toBe(pagesBeforeClick);
    await expect(page).toHaveURL('https://www.automationplayground.dev/');
    // expect: The home page's hero heading 'The Library of Components for Automation Testing' (level 1) becomes visible, confirming successful navigation to the home page
    await expect(
      page.getByRole('heading', { name: 'The Library of Components for Automation Testing', level: 1 })
    ).toBeVisible();
  });
});
