// spec: specs/drag-and-drop.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { DragAndDropPage } from '../../pages/DragAndDropPage';

test.describe('Drag and Drop - Accessibility Gap: No Keyboard Alternative', () => {
  test('[GAP - accessibility] Draggable task cards are not keyboard-focusable and have no keyboard-driven movement alternative', async ({
    page,
  }) => {
    const dragAndDropPage = new DragAndDropPage(page);

    // 1. Navigate to '/components/dragAndDrop'. Attempt to programmatically focus '[data-testid="task-1"]'
    // (locator.focus()) and check document.activeElement
    await dragAndDropPage.gotoDragAndDrop();
    const task1 = dragAndDropPage.task('task-1');
    await task1.focus();

    const isFocused = await task1.evaluate((el) => el === document.activeElement);
    // expect: 'task-1' does NOT become document.activeElement after the focus attempt
    expect(isFocused).toBe(false);

    // expect: 'task-1's computed tabIndex property equals -1, confirming it has no explicit tabindex and is
    // not part of the natural or programmatic tab order
    const tabIndex = await task1.evaluate((el) => el.tabIndex);
    expect(tabIndex).toBe(-1);

    // 2. With 'task-1' still unfocused, capture 'todo-column's task order beforehand, then press ArrowRight
    // and ArrowDown as a best-effort attempt to trigger any keyboard-based task movement
    const orderBefore = await dragAndDropPage.getColumnTaskTexts(dragAndDropPage.todoColumn);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');

    // expect: 'todo-column's task order after the key presses is unchanged from before, confirming there is
    // no keyboard equivalent to the native HTML5 drag-and-drop interaction on this page.
    // Accessibility defect-candidate for the dev team: task cards have no keyboard-driven movement
    // alternative to native HTML5 drag-and-drop, consistent with the same class of gap documented for
    // /components/drag (specs/drag.plan.md) and /components/button (specs/button.plan.md).
    const orderAfter = await dragAndDropPage.getColumnTaskTexts(dragAndDropPage.todoColumn);
    expect(orderAfter).toEqual(orderBefore);
  });
});
