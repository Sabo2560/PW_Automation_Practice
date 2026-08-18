// spec: specs/drag.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { DragPage } from '../../pages/DragPage';

test.describe('Drag - State Persistence and Repeated Interaction', () => {
  test('The box\'s dragged position does NOT persist across a page reload — it resets to the top-left default', async ({
    page,
  }) => {
    const dragPage = new DragPage(page);

    // 1. Navigate to '/components/drag'. Drag the box to a new position clearly away from its default,
    // and confirm its inline style transform reflects the new position
    await dragPage.gotoDrag();
    await dragPage.dragBy(100, 80);

    const afterDrag = await dragPage.getTransform();
    // expect: After the drag, the box's transform is NOT translate(0px, 0px)
    expect(afterDrag).not.toEqual({ x: 0, y: 0 });

    // 2. Reload the page
    await page.reload();
    await expect(dragPage.draggable).toBeVisible();

    // expect: After reload, the draggable box's inline style transform equals exactly translate(0px, 0px)
    const afterReload = await dragPage.getTransform();
    expect(afterReload).toEqual({ x: 0, y: 0 });
  });

  test('Multiple sequential drags in different directions accumulate correctly from the box\'s current position, not from its original starting position', async ({
    page,
  }) => {
    const dragPage = new DragPage(page);

    // 1. Navigate to '/components/drag'. Perform a first drag of +60px x / +30px y from the box's
    // current center, and record the resulting bounding box position
    await dragPage.gotoDrag();
    const startBox = await dragPage.draggable.boundingBox();
    if (!startBox) throw new Error('Draggable element not found');

    await dragPage.dragBy(60, 30);
    const afterFirstDrag = await dragPage.draggable.boundingBox();
    if (!afterFirstDrag) throw new Error('Draggable element not found after first drag');

    // expect: The box's position after this first drag has moved by approximately (+60, +30)
    // relative to its starting position, +/- 3px
    expect(afterFirstDrag.x - startBox.x).toBeGreaterThanOrEqual(57);
    expect(afterFirstDrag.x - startBox.x).toBeLessThanOrEqual(63);
    expect(afterFirstDrag.y - startBox.y).toBeGreaterThanOrEqual(27);
    expect(afterFirstDrag.y - startBox.y).toBeLessThanOrEqual(33);

    // 2. Immediately perform a second drag of -20px x / +40px y, starting from the box's NEW current center
    await dragPage.dragBy(-20, 40);
    const afterSecondDrag = await dragPage.draggable.boundingBox();
    if (!afterSecondDrag) throw new Error('Draggable element not found after second drag');

    // expect: The box's position after this second drag has moved by approximately (-20, +40) relative
    // to where it was after the FIRST drag (not relative to the box's original page-load position)
    expect(afterSecondDrag.x - afterFirstDrag.x).toBeGreaterThanOrEqual(-23);
    expect(afterSecondDrag.x - afterFirstDrag.x).toBeLessThanOrEqual(-17);
    expect(afterSecondDrag.y - afterFirstDrag.y).toBeGreaterThanOrEqual(37);
    expect(afterSecondDrag.y - afterFirstDrag.y).toBeLessThanOrEqual(43);
  });
});
