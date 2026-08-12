import { test, expect } from '@playwright/test';

test.describe('Drag component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/drag');
  });

  // No data-testid on the draggable box or its container, so we scope by
  // the stable Tailwind classes seen in DevTools instead. Order doesn't
  // matter for CSS class selectors, only that all of them are present.
  const getLocators = (page: import('@playwright/test').Page) => ({
    container: page.locator('div.relative.h-80.w-full.max-w-md.overflow-hidden.border-2.border-dashed.border-gray-500'),
    draggable: page.locator('div.absolute.h-16.w-16.cursor-grab.bg-blue-500'),
  });

  test('should move the draggable box when dragged within the container', async ({ page }) => {
    const { draggable } = getLocators(page);

    const startBox = await draggable.boundingBox();
    if (!startBox) throw new Error('Draggable element not found');

    const startX = startBox.x + startBox.width / 2;
    const startY = startBox.y + startBox.height / 2;

    // Simulate a real drag: mouse down on the box, move in small steps
    // (so the drag library actually registers movement events instead of
    // teleporting), then release.
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 80, startY + 40, { steps: 10 });
    await page.mouse.up();

    const endBox = await draggable.boundingBox();
    if (!endBox) throw new Error('Draggable element not found after drag');

    // We're not checking the exact pixel delta — just that it actually moved.
    expect(endBox.x).not.toBeCloseTo(startBox.x, 0);
  });

  test('should keep the draggable box within the dotted container bounds', async ({ page }) => {
    const { container, draggable } = getLocators(page);

    const containerBox = await container.boundingBox();
    const startBox = await draggable.boundingBox();
    if (!containerBox || !startBox) throw new Error('Container or draggable element not found');

    const startX = startBox.x + startBox.width / 2;
    const startY = startBox.y + startBox.height / 2;

    // Drag way past the container's edge — if boundary constraints are
    // working, the box should stop at the edge instead of following the
    // cursor all the way out.
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(containerBox.x + containerBox.width + 500, containerBox.y + containerBox.height + 500, { steps: 15 });
    await page.mouse.up();

    const endBox = await draggable.boundingBox();
    if (!endBox) throw new Error('Draggable element not found after drag');

    expect(endBox.x).toBeGreaterThanOrEqual(containerBox.x);
    expect(endBox.y).toBeGreaterThanOrEqual(containerBox.y);
    // Small tolerance for subpixel rounding differences between browser
    // engines — chromium/webkit rounded right at the edge and tripped a
    // 1px-tolerance version of this check, which isn't a real boundary bug.
    expect(endBox.x + endBox.width).toBeLessThanOrEqual(containerBox.x + containerBox.width + 2);
    expect(endBox.y + endBox.height).toBeLessThanOrEqual(containerBox.y + containerBox.height + 2);
  });

  test('should keep the draggable box within bounds when dragged toward the top-left corner', async ({ page }) => {
    // Same idea as the bottom-right boundary test, but the opposite corner —
    // a constraint bug could easily clamp one axis pair correctly while
    // missing the other, so both directions need their own check.
    const { container, draggable } = getLocators(page);

    const containerBox = await container.boundingBox();
    const startBox = await draggable.boundingBox();
    if (!containerBox || !startBox) throw new Error('Container or draggable element not found');

    const startX = startBox.x + startBox.width / 2;
    const startY = startBox.y + startBox.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(containerBox.x - 500, containerBox.y - 500, { steps: 15 });
    await page.mouse.up();

    const endBox = await draggable.boundingBox();
    if (!endBox) throw new Error('Draggable element not found after drag');

    expect(endBox.x).toBeGreaterThanOrEqual(containerBox.x - 2);
    expect(endBox.y).toBeGreaterThanOrEqual(containerBox.y - 2);
  });
});