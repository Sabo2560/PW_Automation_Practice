// spec: specs/drag.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { DragPage } from '../../pages/DragPage';

test.describe('Drag - Initial Load and Default State', () => {
  test('Drag page loads with the container, draggable box, label, and Insight section correctly rendered', async ({
    page,
  }) => {
    const dragPage = new DragPage(page);

    // 1. Navigate to '/components/drag' on a fresh browser context
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    const response = await dragPage.gotoDrag();

    // expect: Page loads successfully (HTTP 200, no console errors)
    expect(response?.status()).toBe(200);
    // expect: Heading 'Drag' (level 1) is visible
    await expect(page.getByRole('heading', { name: 'Drag', level: 1 })).toBeVisible();
    expect(consoleErrors).toEqual([]);

    // 2. Inspect the label element preceding the container
    // expect: '[data-testid="form-label"]' is visible with text exactly 'Drag me inside dotted container'
    await expect(page.getByTestId('form-label')).toHaveText('Drag me inside dotted container');

    // 3. Inspect the container element
    // expect: Exactly one element matches this selector and is visible
    await expect(dragPage.container).toHaveCount(1);
    await expect(dragPage.container).toBeVisible();
    const containerBox = await dragPage.container.boundingBox();
    expect(containerBox).not.toBeNull();
    // expect: Its bounding box width is approximately 384px and height is approximately 320px
    expect(containerBox!.width).toBeGreaterThanOrEqual(382);
    expect(containerBox!.width).toBeLessThanOrEqual(386);
    expect(containerBox!.height).toBeGreaterThanOrEqual(318);
    expect(containerBox!.height).toBeLessThanOrEqual(322);

    // 4. Inspect the draggable box element
    // expect: Exactly one element matches this selector and is visible, nested inside the container element
    await expect(dragPage.draggable).toHaveCount(1);
    await expect(dragPage.draggable).toBeVisible();
    const draggableBox = await dragPage.draggable.boundingBox();
    expect(draggableBox).not.toBeNull();
    // expect: Its bounding box width is approximately 64px and height is approximately 64px
    expect(draggableBox!.width).toBeGreaterThanOrEqual(62);
    expect(draggableBox!.width).toBeLessThanOrEqual(66);
    expect(draggableBox!.height).toBeGreaterThanOrEqual(62);
    expect(draggableBox!.height).toBeLessThanOrEqual(66);
    // expect: Its inline style attribute contains transform: translate(0px, 0px)
    const transform = await dragPage.getTransform();
    expect(transform).toEqual({ x: 0, y: 0 });

    // 5. Inspect the 'Insight' section without performing any click/expand interaction
    // expect: Heading 'Insight' (level 2) is visible immediately, with no interaction required to reveal it
    await expect(page.getByRole('heading', { name: 'Insight', level: 2 })).toBeVisible();

    // expect: The concept list is visible and contains at least the listed items
    const conceptList = page.getByRole('list').filter({ hasText: 'Simulate drag actions' });
    await expect(conceptList).toBeVisible();
    await expect(conceptList.getByText('Simulate drag actions')).toBeVisible();
    await expect(conceptList.getByText('Verify element movement')).toBeVisible();
    await expect(conceptList.getByText('Ensure boundary constraints')).toBeVisible();
    await expect(conceptList.getByText('Verify element stays within defined boundaries')).toBeVisible();

    // expect: A 'Github solution' link is visible with the expected href
    const githubLink = page.getByRole('link', { name: 'Github solution' });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/drag/drag.spec.ts'
    );
  });

  test('Confirm no data-testid exists on the draggable box or its container, documenting the fragile-selector situation', async ({
    page,
  }) => {
    const dragPage = new DragPage(page);

    // 1. Navigate to '/components/drag' and enumerate all [data-testid] elements on the page
    await dragPage.gotoDrag();
    const testIds = await page.locator('[data-testid]').evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-testid'))
    );

    // expect: The only data-testid value present anywhere on the page is 'form-label' — no testid
    // exists on the container div or the draggable div, confirming the legacy spec's documented gap
    // is still accurate as of this exploration
    expect(testIds).toEqual(['form-label']);
  });
});
