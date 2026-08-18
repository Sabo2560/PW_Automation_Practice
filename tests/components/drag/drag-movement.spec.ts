// spec: specs/drag.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { DragPage } from '../../pages/DragPage';

test.describe('Drag - Basic Drag Movement', () => {
  test('Dragging the box a moderate distance within the container moves it by the expected delta', async ({ page }) => {
    const dragPage = new DragPage(page);

    // 1. Navigate to '/components/drag'. Read the draggable box's starting bounding box (expected
    // translate(0px, 0px)). Perform a real drag: +80px x / +40px y using multiple intermediate steps
    await dragPage.gotoDrag();
    const startBox = await dragPage.draggable.boundingBox();
    if (!startBox) throw new Error('Draggable element not found');

    await dragPage.dragBy(80, 40);

    const endBox = await dragPage.draggable.boundingBox();
    if (!endBox) throw new Error('Draggable element not found after drag');

    // expect: After the drag, the box's new bounding box x coordinate differs from the starting x by
    // approximately +80px (+/- 3px tolerance)
    expect(endBox.x - startBox.x).toBeGreaterThanOrEqual(77);
    expect(endBox.x - startBox.x).toBeLessThanOrEqual(83);
    // expect: The new y coordinate differs from the starting y by approximately +40px (+/- 3px)
    expect(endBox.y - startBox.y).toBeGreaterThanOrEqual(37);
    expect(endBox.y - startBox.y).toBeLessThanOrEqual(43);

    // expect: The box's inline style transform reflects a translate(80px, 40px)-equivalent value (+/- 3px)
    const transform = await dragPage.getTransform();
    expect(transform.x).toBeGreaterThanOrEqual(77);
    expect(transform.x).toBeLessThanOrEqual(83);
    expect(transform.y).toBeGreaterThanOrEqual(37);
    expect(transform.y).toBeLessThanOrEqual(43);
  });

  test('A tiny drag distance still registers a proportional movement (lower boundary of meaningful drag)', async ({
    page,
  }) => {
    const dragPage = new DragPage(page);

    // 1. Navigate to '/components/drag'. Perform a drag of only 5px horizontally and 3px vertically
    await dragPage.gotoDrag();
    const startBox = await dragPage.draggable.boundingBox();
    if (!startBox) throw new Error('Draggable element not found');

    await dragPage.dragBy(5, 3, 5);

    const endBox = await dragPage.draggable.boundingBox();
    if (!endBox) throw new Error('Draggable element not found after drag');

    // expect: The box's x coordinate increases by a small positive amount (0, 15) px
    const dx = endBox.x - startBox.x;
    expect(dx).toBeGreaterThan(0);
    expect(dx).toBeLessThan(15);
    // expect: The box's y coordinate similarly increases by a small positive amount (0, 15) px
    const dy = endBox.y - startBox.y;
    expect(dy).toBeGreaterThan(0);
    expect(dy).toBeLessThan(15);

    // expect: The box does NOT jump to a clamped boundary position
    const transform = await dragPage.getTransform();
    expect(transform.x).toBeLessThan(300);
    expect(transform.y).toBeLessThan(240);
  });

  test('A click without any mouse movement (mousedown immediately followed by mouseup at the same coordinates) does not move the box', async ({
    page,
  }) => {
    const dragPage = new DragPage(page);

    // 1. Navigate to '/components/drag'. Capture the box's inline style (expected translate(0px, 0px)).
    // Move the mouse to the box's center, mouse.down() immediately followed by mouse.up() with no
    // intermediate mouse.move() call
    await dragPage.gotoDrag();
    const before = await dragPage.draggable.getAttribute('style');

    const box = await dragPage.draggable.boundingBox();
    if (!box) throw new Error('Draggable element not found');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.up();

    const after = await dragPage.draggable.getAttribute('style');

    // expect: The box's inline style attribute after the click is byte-for-byte identical to the value
    // captured before the click
    expect(after).toBe(before);
  });

  test('Cursor style changes from grab to grabbing during an active drag and reverts to grab on release', async ({
    page,
  }) => {
    const dragPage = new DragPage(page);

    // 1. Navigate to '/components/drag' and read the draggable box's computed cursor property before any interaction
    await dragPage.gotoDrag();
    const cursorBefore = await dragPage.draggable.evaluate((el) => getComputedStyle(el).cursor);
    // expect: Computed cursor equals exactly 'grab'
    expect(cursorBefore).toBe('grab');

    // 2. Move the mouse to the box's center and call mouse.down() (without releasing)
    const box = await dragPage.draggable.boundingBox();
    if (!box) throw new Error('Draggable element not found');
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();

    // expect: Computed cursor equals exactly 'grabbing' while the mouse button is held down
    const cursorDuringDown = await dragPage.draggable.evaluate((el) => getComputedStyle(el).cursor);
    expect(cursorDuringDown).toBe('grabbing');

    // 3. Move the mouse by a small amount while still held down, then call mouse.up() to release
    await page.mouse.move(startX + 20, startY + 10, { steps: 5 });
    const cursorDuringMove = await dragPage.draggable.evaluate((el) => getComputedStyle(el).cursor);
    // expect: Computed cursor equals exactly 'grabbing' while still dragging
    expect(cursorDuringMove).toBe('grabbing');

    await page.mouse.up();

    // expect: After mouse.up(), computed cursor reverts to exactly 'grab'
    const cursorAfterUp = await dragPage.draggable.evaluate((el) => getComputedStyle(el).cursor);
    expect(cursorAfterUp).toBe('grab');
  });
});
