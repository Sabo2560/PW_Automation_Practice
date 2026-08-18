// spec: specs/drag.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { DragPage } from '../../pages/DragPage';

test.describe('Drag - Accessibility Gap: No Keyboard Alternative', () => {
  test('[GAP - accessibility] The draggable box is not keyboard-focusable and has no keyboard-driven movement alternative', async ({
    page,
  }) => {
    const dragPage = new DragPage(page);

    // 1. Navigate to '/components/drag'. Attempt to programmatically focus the draggable box element
    // and check document.activeElement
    await dragPage.gotoDrag();
    await dragPage.draggable.focus();

    const isFocused = await dragPage.draggable.evaluate((el) => el === document.activeElement);
    // expect: The draggable box element does NOT become document.activeElement after the focus attempt
    expect(isFocused).toBe(false);

    // expect: The draggable box has no tabindex attribute
    await expect(dragPage.draggable).not.toHaveAttribute('tabindex');

    // 2. With the draggable box still not focused, press ArrowRight then ArrowDown as a best-effort
    // attempt to trigger any keyboard-based movement.
    // Note: a real Tab+Enter follow-up was deliberately NOT added here — with the box confirmed
    // non-focusable/no tabindex above, Tab moves focus into the page's real tab order (nav links,
    // the Github solution link, etc.), and Enter on a focused link navigates away entirely, which
    // would leave this test waiting forever for a draggable element that no longer exists on the
    // new page. The focus/tabindex checks above already fully establish the keyboard gap.
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');

    // expect: The box's inline style transform remains completely unchanged after these key presses
    // (still translate(0px, 0px) from the fresh load), confirming there is no keyboard equivalent to
    // the mouse-drag interaction
    const transform = await dragPage.getTransform();
    expect(transform).toEqual({ x: 0, y: 0 });
  });
});
