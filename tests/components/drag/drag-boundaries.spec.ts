// spec: specs/drag.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { DragPage } from '../../pages/DragPage';

test.describe('Drag - Boundary Clamping at All Corners and Edges', () => {
  test("Dragging far past the bottom-right corner clamps the box exactly at the container's bottom-right edge", async ({
    page,
  }) => {
    const dragPage = new DragPage(page);

    // 1. Navigate to '/components/drag'. Read the container's bounding box. Drag from the box's center
    // to a point 500px beyond the container's right edge and 500px beyond its bottom edge, then release
    await dragPage.gotoDrag();
    const containerBox = await dragPage.container.boundingBox();
    if (!containerBox) throw new Error('Container not found');

    await dragPage.dragBy(500, 500, 15);

    const endBox = await dragPage.draggable.boundingBox();
    if (!endBox) throw new Error('Draggable element not found after drag');

    // expect: The box's final right edge does not exceed the container's right edge by more than 2px
    expect(endBox.x + endBox.width).toBeLessThanOrEqual(containerBox.x + containerBox.width + 2);
    // expect: The box's final bottom edge does not exceed the container's bottom edge by more than 2px
    expect(endBox.y + endBox.height).toBeLessThanOrEqual(containerBox.y + containerBox.height + 2);

    // expect: The box's inline style transform reflects approximately (320px, 256px), +/- 2px
    const transform = await dragPage.getTransform();
    expect(transform.x).toBeGreaterThanOrEqual(318);
    expect(transform.x).toBeLessThanOrEqual(322);
    expect(transform.y).toBeGreaterThanOrEqual(254);
    expect(transform.y).toBeLessThanOrEqual(258);
  });

  test("Dragging far past the top-left corner clamps the box exactly at the container's top-left edge (translate 0,0)", async ({
    page,
  }) => {
    const dragPage = new DragPage(page);

    // 1. Navigate to '/components/drag'. First drag the box away from its starting corner so the clamp
    // is genuinely exercised. Then drag far past the top-left corner
    await dragPage.gotoDrag();
    const containerBox = await dragPage.container.boundingBox();
    if (!containerBox) throw new Error('Container not found');

    await dragPage.dragBy(150, 120);
    await dragPage.dragBy(-500, -500, 15);

    const endBox = await dragPage.draggable.boundingBox();
    if (!endBox) throw new Error('Draggable element not found after drag');

    // expect: The box's final left edge is not less than the container's left edge by more than 2px
    expect(endBox.x).toBeGreaterThanOrEqual(containerBox.x - 2);
    // expect: The box's final top edge is not less than the container's top edge by more than 2px
    expect(endBox.y).toBeGreaterThanOrEqual(containerBox.y - 2);

    // expect: The box's inline style transform reflects approximately (0px, 0px), +/- 2px
    const transform = await dragPage.getTransform();
    expect(transform.x).toBeGreaterThanOrEqual(-2);
    expect(transform.x).toBeLessThanOrEqual(2);
    expect(transform.y).toBeGreaterThanOrEqual(-2);
    expect(transform.y).toBeLessThanOrEqual(2);
  });

  test('Dragging far past the top-right corner clamps the box exactly at the top-right edge (max-x, min-y)', async ({
    page,
  }) => {
    const dragPage = new DragPage(page);

    // 1. Navigate to '/components/drag' (fresh load, box starts at translate(0,0)). Drag from the box's
    // center to a point well beyond the container's right edge and above its top edge — the box starts
    // at x=0 and the clamp is at x=320, so the x delta must exceed 320 to actually overshoot the edge
    await dragPage.gotoDrag();
    const containerBox = await dragPage.container.boundingBox();
    if (!containerBox) throw new Error('Container not found');

    await dragPage.dragBy(500, -300, 15);

    const endBox = await dragPage.draggable.boundingBox();
    if (!endBox) throw new Error('Draggable element not found after drag');

    // expect: The box's final right edge does not exceed the container's right edge by more than 2px
    expect(endBox.x + endBox.width).toBeLessThanOrEqual(containerBox.x + containerBox.width + 2);
    // expect: The box's final top edge is not less than the container's top edge by more than 2px
    expect(endBox.y).toBeGreaterThanOrEqual(containerBox.y - 2);

    // expect: The box's inline style transform reflects approximately (320px, 0px), +/- 2px
    const transform = await dragPage.getTransform();
    expect(transform.x).toBeGreaterThanOrEqual(318);
    expect(transform.x).toBeLessThanOrEqual(322);
    expect(transform.y).toBeGreaterThanOrEqual(-2);
    expect(transform.y).toBeLessThanOrEqual(2);
  });

  test('Dragging far past the bottom-left corner clamps the box exactly at the bottom-left edge (min-x, max-y)', async ({
    page,
  }) => {
    const dragPage = new DragPage(page);

    // 1. Navigate to '/components/drag' (fresh load, box starts at translate(0,0)). Drag from the box's
    // center to a point 300px before the container's left edge and 300px beyond the container's bottom edge
    await dragPage.gotoDrag();
    const containerBox = await dragPage.container.boundingBox();
    if (!containerBox) throw new Error('Container not found');

    await dragPage.dragBy(-300, 300, 15);

    const endBox = await dragPage.draggable.boundingBox();
    if (!endBox) throw new Error('Draggable element not found after drag');

    // expect: The box's final left edge does not go left of the container's left edge by more than 2px
    // (box started already at x=0, so x should remain unchanged from its start)
    expect(endBox.x).toBeGreaterThanOrEqual(containerBox.x - 2);
    // expect: The box's final bottom edge does not exceed the container's bottom edge by more than 2px
    expect(endBox.y + endBox.height).toBeLessThanOrEqual(containerBox.y + containerBox.height + 2);

    // expect: The box's inline style transform reflects approximately (0px, 256px), +/- 2px
    const transform = await dragPage.getTransform();
    expect(transform.x).toBeGreaterThanOrEqual(-2);
    expect(transform.x).toBeLessThanOrEqual(2);
    expect(transform.y).toBeGreaterThanOrEqual(254);
    expect(transform.y).toBeLessThanOrEqual(258);
  });

  test("A drag ending exactly at the container's edge (not far beyond it) does not overshoot the boundary", async ({
    page,
  }) => {
    const dragPage = new DragPage(page);

    // 1. Navigate to '/components/drag'. Compute the exact target translate that would place the box's
    // right edge flush with the container's right edge (translate x = 320px, y = 0). Drag the box to
    // precisely that computed on-screen position
    await dragPage.gotoDrag();
    const containerBox = await dragPage.container.boundingBox();
    if (!containerBox) throw new Error('Container not found');

    await dragPage.dragBy(320, 0, 20);

    const endBox = await dragPage.draggable.boundingBox();
    if (!endBox) throw new Error('Draggable element not found after drag');

    // expect: The box's final position matches the computed target within +/- 3px on both axes
    const transform = await dragPage.getTransform();
    expect(transform.x).toBeGreaterThanOrEqual(317);
    expect(transform.x).toBeLessThanOrEqual(323);
    expect(transform.y).toBeGreaterThanOrEqual(-3);
    expect(transform.y).toBeLessThanOrEqual(3);

    // expect: The box's right edge does not exceed the container's right edge by more than 2px tolerance
    expect(endBox.x + endBox.width).toBeLessThanOrEqual(containerBox.x + containerBox.width + 2);
  });
});
