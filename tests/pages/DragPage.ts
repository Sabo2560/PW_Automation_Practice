import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type Transform = { x: number; y: number };

export class DragPage extends BasePage {
  // No data-testid exists on either element (verified live, see specs/drag.plan.md) —
  // these Tailwind-class selectors are the most stable option currently available and
  // are a documented longevity risk (see plan's "notable gaps" section).
  readonly container: Locator;
  readonly draggable: Locator;

  constructor(page: Page) {
    super(page);
    this.container = page.locator(
      'div.relative.h-80.w-full.max-w-md.overflow-hidden.border-2.border-dashed.border-gray-500'
    );
    this.draggable = page.locator('div.absolute.h-16.w-16.cursor-grab.bg-blue-500');
  }

  async gotoDrag() {
    const response = await this.goto('/components/drag');
    // Ensure client-side content has actually rendered before any caller queries the
    // page — page.goto() resolves on the load event, which can land before React
    // hydration finishes on slower browsers.
    await expect(this.draggable).toBeVisible();
    return response;
  }

  /**
   * Parses the draggable box's `transform: translate(...)` inline style into numbers.
   * Browsers may render a single-argument form (`translate(Xpx)`, implying y=0) when
   * the y offset is zero, so both one- and two-argument forms are handled.
   */
  async getTransform(): Promise<Transform> {
    const style = await this.draggable.getAttribute('style');
    const match = style?.match(/translate\(([-\d.]+)px(?:,\s*([-\d.]+)px)?\)/);
    if (!match) throw new Error(`Could not parse transform from style: ${style}`);
    return { x: Number(match[1]), y: match[2] !== undefined ? Number(match[2]) : 0 };
  }

  /**
   * Simulates a real drag by (dx, dy) pixels from the box's current center, using
   * multiple intermediate mouse-move steps so the drag library actually registers
   * movement events instead of teleporting. Small settle delays around mousedown/
   * mouseup guard against the drag library's listeners not yet being attached (or
   * a pending state update not yet flushed) when the very next event fires —
   * observed as flaky partial/missed drags without them, especially on firefox/webkit.
   */
  async dragBy(dx: number, dy: number, steps = 20) {
    const box = await this.draggable.boundingBox();
    if (!box) throw new Error('Draggable element not found');

    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    // Clamp the target to the actual viewport (mirrors a real mouse, which can't move
    // past the screen edge). Firefox in particular doesn't reliably generate synthetic
    // mousemove events for coordinates outside the visible viewport — an uncapped large
    // delta (e.g. +500px on a container positioned far down the page) can silently fail
    // to register the drag at all.
    const viewport = this.page.viewportSize();
    const margin = 2;
    let targetX = startX + dx;
    let targetY = startY + dy;
    if (viewport) {
      targetX = Math.min(Math.max(targetX, margin), viewport.width - margin);
      targetY = Math.min(Math.max(targetY, margin), viewport.height - margin);
    }

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.waitForTimeout(50);
    await this.page.mouse.move(targetX, targetY, { steps });
    await this.page.waitForTimeout(50);
    await this.page.mouse.up();
    await this.page.waitForTimeout(50);
  }
}
