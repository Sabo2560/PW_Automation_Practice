// spec: specs/wait.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { WaitPage } from '../../pages/WaitPage';

test.describe('Wait - Initial Load and Default State', () => {
  let waitPage: WaitPage;

  test.beforeEach(async ({ page }) => {
    waitPage = new WaitPage(page);
  });

  test('Wait page loads with all four exercise sections, labels, and Insight section correctly rendered', async ({
    page,
  }) => {
    // 1. Navigate to '/components/wait' on a fresh browser context
    const consoleErrors = waitPage.trackConsoleErrors();
    const response = await waitPage.gotoWait();

    // expect: Page loads successfully (HTTP 200, no console errors)
    expect(response?.status()).toBe(200);
    // expect: Heading 'Wait' (level 1) is visible
    await expect(page.getByRole('heading', { name: 'Wait', level: 1 })).toBeVisible();
    expect(consoleErrors).toEqual([]);

    // 2. Inspect all four 'form-label' elements in DOM order
    // expect: The four labels read exactly, in order
    await expect(page.getByTestId('form-label')).toHaveText([
      'Wait and Accept the alert',
      'Wait for an element to appear',
      'Wait for text to change',
      'Wait for an element to disappear',
    ]);

    // 3. Inspect the 'Insight' section without performing any click/expand interaction
    // expect: Heading 'Insight' (level 2) is visible immediately with no interaction required
    await expect(page.getByRole('heading', { name: 'Insight', level: 2 })).toBeVisible();
    // expect: The concept list contains exactly the documented items
    const conceptList = page.getByRole('list').filter({ hasText: 'Wait for an alert dialog to appear after a delay' });
    await expect(conceptList.getByRole('listitem')).toHaveText([
      'Wait for an alert dialog to appear after a delay',
      'Wait for an element to appear in the DOM',
      'Wait for text content to change',
      'Wait for an element to disappear',
    ]);
    // expect: A 'Github solution' link is visible with the expected href
    const githubLink = page.getByRole('link', { name: 'Github solution' });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/wait/wait.spec.ts'
    );
  });

  test("Every widget's default state matches the confirmed live baseline on fresh load", async () => {
    // 1. Navigate to '/components/wait' on a fresh browser context. Without clicking any button, inspect all
    //    four buttons and the three dynamic targets
    await waitPage.gotoWait();

    // expect: All four buttons are visible and enabled
    await expect(waitPage.alertButton).toBeEnabled();
    await expect(waitPage.elementButton).toBeEnabled();
    await expect(waitPage.textButton).toBeEnabled();
    await expect(waitPage.disappearanceButton).toBeEnabled();

    // expect: '#dynamic-text' does not exist in the DOM (element count is exactly 0, not merely hidden)
    await expect(waitPage.dynamicElement).toHaveCount(0);
    // expect: '#update-text' exists and its text content equals exactly 'Initial text...'
    await expect(waitPage.updateTextSpan).toHaveText('Initial text...');
    // expect: '#disappearing-element' does not exist in the DOM (element count is exactly 0, not merely hidden)
    await expect(waitPage.disappearingElement).toHaveCount(0);
  });
});
