// spec: specs/drag-and-drop.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { DragAndDropPage } from '../../pages/DragAndDropPage';

test.describe('Drag and Drop - Task Board: Self-Drop and Cross-Widget Drop Bug', () => {
  test('Dragging a task onto its own current column is a safe no-op — order and membership are unchanged', async ({
    page,
  }) => {
    const dragAndDropPage = new DragAndDropPage(page);
    const consoleErrors = dragAndDropPage.trackConsoleErrors();

    // 1. Navigate to '/components/dragAndDrop'. Capture 'todo-column's task text order (expected
    // ['Review code', 'Deploy app', 'Fix bug']). Drag 'task-3' ('Fix bug') onto 'todo-column' (its own
    // current column)
    await dragAndDropPage.gotoDragAndDrop();
    const orderBeforeSelfDrop = await dragAndDropPage.getColumnTaskTexts(dragAndDropPage.todoColumn);
    expect(orderBeforeSelfDrop).toEqual(['Review code', 'Deploy app', 'Fix bug']);
    await dragAndDropPage.dragTaskTo('task-3', dragAndDropPage.todoColumn);

    // expect: 'todo-column's task text order after the self-drop is byte-for-byte identical to the order
    // captured before it: ['Review code', 'Deploy app', 'Fix bug']
    expect(await dragAndDropPage.getColumnTaskTexts(dragAndDropPage.todoColumn)).toEqual(orderBeforeSelfDrop);
    // expect: No console error is produced by the self-drop
    expect(consoleErrors).toEqual([]);
  });

  test('[BUG-CANDIDATE] Dropping an unrelated Kanban task card onto the file widget\'s drop-zone incorrectly triggers its Uploading state', async ({
    page,
  }) => {
    const dragAndDropPage = new DragAndDropPage(page);

    // 1. Navigate to '/components/dragAndDrop'. Drag 'task-1' ('Review code') from 'todo-column' onto
    // '[data-testid="drop-zone"]' (the file widget's target, unrelated to the task board)
    await dragAndDropPage.gotoDragAndDrop();
    const todoOrderBeforeDrop = await dragAndDropPage.getColumnTaskTexts(dragAndDropPage.todoColumn);
    await dragAndDropPage.dragTaskTo('task-1', dragAndDropPage.dropZone);

    // expect: 'task-1' remains in 'todo-column' at its original position, unmoved
    await expect(dragAndDropPage.todoColumn.getByTestId('task-1')).toHaveCount(1);
    expect(await dragAndDropPage.getColumnTaskTexts(dragAndDropPage.todoColumn)).toEqual(todoOrderBeforeDrop);

    // expect: '[data-testid="drop-zone"]' text changes to 'Uploading...' and
    // '[data-testid="button-reset-file-button"]' appears, DESPITE no actual 'file' item having been dropped.
    // BUG-CANDIDATE: the drop-zone's drop handler does not validate the identity/type of the dropped item
    // before transitioning state — it reacts as if the file widget's own draggable icon had been dropped,
    // even though the item actually carried was an unrelated Kanban task card. Documented per
    // specs/drag-and-drop.plan.md as a confirmed defect-candidate, asserted here as observed behavior.
    await expect(dragAndDropPage.dropZone).toHaveText('Uploading...');
    await expect(dragAndDropPage.resetFileButton).toBeVisible();

    // expect: '[data-testid="file"]' is ALSO removed from the DOM, exactly as it would be on a genuine
    // file drop, even though the actually-dropped item was 'task-1', not 'file'. Corrected from the plan's
    // original assumption that the file item is left untouched: live re-verification (both via a real
    // dragTo() drag and independently via manually dispatched dragstart/dragenter/dragover/drop DragEvents)
    // confirms 'file' consistently disappears too. This indicates the widget's "uploaded" state is a single
    // shared flag driving both drop-zone text/Reset-button AND file visibility — ANY accepted drop on
    // drop-zone flips it, regardless of the dragged item's identity. Widens the scope of the bug-candidate
    // beyond what specs/drag-and-drop.plan.md currently documents (see plan update).
    await expect(dragAndDropPage.file).toHaveCount(0);
  });
});
