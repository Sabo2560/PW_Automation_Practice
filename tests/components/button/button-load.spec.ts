// spec: specs/button.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Button - Initial Load and Default State', () => {
  test('Button page loads with all six buttons, labels, and the Insight section correctly rendered', async ({ page }) => {
    // 1. Navigate to '/components/button' on a fresh browser context
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    const response = await page.goto('/components/button');

    // expect: Page loads successfully (HTTP 200, no console errors)
    expect(response?.status()).toBe(200);
    // expect: Heading 'Button' (level 1) is visible
    await expect(page.getByRole('heading', { name: 'Button', level: 1 })).toBeVisible();
    expect(consoleErrors).toEqual([]);

    // 2. Inspect all six buttons and their preceding label text
    const goHomeButton = page.locator('[data-testid="button-go-home"]');
    const findLocationButton = page.locator('[data-testid="button-find-location"]');
    const findColorButton = page.locator('[data-testid="button-find-color"]');
    const findHeightWidthButton = page.locator('[data-testid="button-find-height-width"]');
    const disabledButton = page.locator('[data-testid="button-disabled-button"]');
    const holdButton = page.locator('[data-testid="hold-button"]');

    // expect: '[data-testid="button-go-home"]' is visible, enabled, with text 'Go Home', preceded by label text 'Go home and come back here using driver command'
    await expect(goHomeButton).toBeVisible();
    await expect(goHomeButton).toBeEnabled();
    await expect(goHomeButton).toHaveText('Go Home');
    await expect(page.getByText('Go home and come back here using driver command')).toBeVisible();

    // expect: '[data-testid="button-find-location"]' is visible, enabled, with text 'Find Location', preceded by label text 'Get the X & Y co-ordinates'
    await expect(findLocationButton).toBeVisible();
    await expect(findLocationButton).toBeEnabled();
    await expect(findLocationButton).toHaveText('Find Location');
    await expect(page.getByText('Get the X & Y co-ordinates')).toBeVisible();

    // expect: '[data-testid="button-find-color"]' is visible, enabled, with text 'What is my color?', preceded by label text 'Find the color of the button'
    await expect(findColorButton).toBeVisible();
    await expect(findColorButton).toBeEnabled();
    await expect(findColorButton).toHaveText('What is my color?');
    await expect(page.getByText('Find the color of the button')).toBeVisible();

    // expect: '[data-testid="button-find-height-width"]' is visible, enabled, with text 'What are my height and width?', preceded by label text 'Find the height & width of the button'
    await expect(findHeightWidthButton).toBeVisible();
    await expect(findHeightWidthButton).toBeEnabled();
    await expect(findHeightWidthButton).toHaveText('What are my height and width?');
    await expect(page.getByText('Find the height & width of the button')).toBeVisible();

    // expect: '[data-testid="button-disabled-button"]' is visible, DISABLED, with text 'Disabled button', preceded by label text 'Confirm button is disabled'
    await expect(disabledButton).toBeVisible();
    await expect(disabledButton).toBeDisabled();
    await expect(disabledButton).toHaveText('Disabled button');
    await expect(page.getByText('Confirm button is disabled')).toBeVisible();

    // expect: '[data-testid="hold-button"]' is visible, enabled, with text exactly 'Click and Hold', preceded by label text 'Click and Hold Button'
    await expect(holdButton).toBeVisible();
    await expect(holdButton).toBeEnabled();
    await expect(holdButton).toHaveText('Click and Hold');
    await expect(page.getByText('Click and Hold Button')).toBeVisible();

    // 3. Inspect the 'Insight' section without performing any click/expand interaction
    // expect: Heading 'Insight' (level 2) is visible immediately, with no interaction required to reveal it
    await expect(page.getByRole('heading', { name: 'Insight', level: 2 })).toBeVisible();

    // expect: The concept list is visible and contains at least the items 'Click buttons and verify results' and 'Verify disabled button state'
    const conceptList = page.getByRole('list').filter({ hasText: 'Click buttons and verify results' });
    await expect(conceptList).toBeVisible();
    await expect(conceptList.getByText('Click buttons and verify results')).toBeVisible();
    await expect(conceptList.getByText('Verify disabled button state')).toBeVisible();

    // expect: A 'Github solution' link is visible with href 'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/button/button.spec.ts'
    const githubLink = page.getByRole('link', { name: 'Github solution' });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/button/button.spec.ts'
    );
  });

  test('No result/feedback text exists anywhere on the page before any button has been interacted with', async ({ page }) => {
    // 1. Navigate to '/components/button' and scan the full page for any pre-existing result or hold-state text
    await page.goto('/components/button');

    // expect: No element containing the text 'You held the button for' exists anywhere in the DOM
    await expect(page.getByText('You held the button for')).toHaveCount(0);
    // expect: No element containing the text 'Holding...' exists anywhere in the DOM
    await expect(page.getByText('Holding...')).toHaveCount(0);
  });
});
