// spec: specs/drag-and-drop.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { DragAndDropPage } from '../../pages/DragAndDropPage';

test.describe('Drag and Drop - Task Board: Moving Items Between Zones', () => {
  test('Dragging a single task from To Do into Finished moves it there and the Finished column re-sorts alphabetically', async ({
    page,
  }) => {
    const dragAndDropPage = new DragAndDropPage(page);

    // 1. Navigate to '/components/dragAndDrop'. Drag 'task-3' ('Fix bug') from 'todo-column' onto 'finished-column'
    await dragAndDropPage.gotoDragAndDrop();
    await dragAndDropPage.dragTaskTo('task-3', dragAndDropPage.finishedColumn);

    // expect: 'todo-column' now contains exactly 2 task cards in order: 'Review code', 'Deploy app'
    expect(await dragAndDropPage.getColumnTaskTexts(dragAndDropPage.todoColumn)).toEqual([
      'Review code',
      'Deploy app',
    ]);
    // expect: 'finished-column' now contains exactly 2 task cards in alphabetical order: 'Design web', 'Fix bug'
    // (NOT drop order)
    expect(await dragAndDropPage.getColumnTaskTexts(dragAndDropPage.finishedColumn)).toEqual([
      'Design web',
      'Fix bug',
    ]);
  });

  test('Dragging a second task into an already-populated Finished column re-sorts all items alphabetically together', async ({
    page,
  }) => {
    const dragAndDropPage = new DragAndDropPage(page);

    // 1. Navigate to '/components/dragAndDrop'. Drag 'task-3' ('Fix bug') into 'finished-column', then drag
    // 'task-2' ('Deploy app') into 'finished-column'
    await dragAndDropPage.gotoDragAndDrop();
    await dragAndDropPage.dragTaskTo('task-3', dragAndDropPage.finishedColumn);
    await dragAndDropPage.dragTaskTo('task-2', dragAndDropPage.finishedColumn);

    // expect: 'finished-column' contains exactly 3 cards in alphabetical order: 'Deploy app', 'Design web',
    // 'Fix bug'
    expect(await dragAndDropPage.getColumnTaskTexts(dragAndDropPage.finishedColumn)).toEqual([
      'Deploy app',
      'Design web',
      'Fix bug',
    ]);
    // expect: 'todo-column' contains exactly 1 remaining card: 'Review code'
    expect(await dragAndDropPage.getColumnTaskTexts(dragAndDropPage.todoColumn)).toEqual(['Review code']);
  });

  test('Moving all four tasks into Finished produces the fully correct alphabetical order and empties To Do with no placeholder text or error', async ({
    page,
  }) => {
    const dragAndDropPage = new DragAndDropPage(page);
    const consoleErrors = dragAndDropPage.trackConsoleErrors();

    // 1. Navigate to '/components/dragAndDrop'. Sequentially drag 'task-1', 'task-2', 'task-3' from
    // 'todo-column' into 'finished-column' (task-4 already starts there)
    await dragAndDropPage.gotoDragAndDrop();
    await dragAndDropPage.dragTaskTo('task-1', dragAndDropPage.finishedColumn);
    await dragAndDropPage.dragTaskTo('task-2', dragAndDropPage.finishedColumn);
    await dragAndDropPage.dragTaskTo('task-3', dragAndDropPage.finishedColumn);

    // expect: 'finished-column' contains exactly 4 cards in alphabetical order: 'Deploy app', 'Design web',
    // 'Fix bug', 'Review code'
    expect(await dragAndDropPage.getColumnTaskTexts(dragAndDropPage.finishedColumn)).toEqual([
      'Deploy app',
      'Design web',
      'Fix bug',
      'Review code',
    ]);
    // expect: 'todo-column' contains 0 task cards, renders with only its 'To Do' heading visible, no
    // placeholder/empty-state text, and no console error is produced
    await expect(dragAndDropPage.todoColumn.locator('[data-testid^="task-"]')).toHaveCount(0);
    await expect(dragAndDropPage.todoColumn.getByRole('heading', { name: 'To Do', level: 3 })).toBeVisible();
    await expect(dragAndDropPage.todoColumn).toHaveText('To Do');
    expect(consoleErrors).toEqual([]);
  });

  test('Dragging a task from Finished back into To Do appends it at the end WITHOUT alphabetical sorting', async ({
    page,
  }) => {
    const dragAndDropPage = new DragAndDropPage(page);

    // 1. Navigate to '/components/dragAndDrop'. Drag 'task-1' ('Review code') into 'finished-column', confirm
    // To Do now holds ['Deploy app', 'Fix bug']. Then drag 'task-4' ('Design web') from 'finished-column' back
    // into 'todo-column'
    await dragAndDropPage.gotoDragAndDrop();
    await dragAndDropPage.dragTaskTo('task-1', dragAndDropPage.finishedColumn);
    expect(await dragAndDropPage.getColumnTaskTexts(dragAndDropPage.todoColumn)).toEqual(['Deploy app', 'Fix bug']);
    await dragAndDropPage.dragTaskTo('task-4', dragAndDropPage.todoColumn);

    // expect: 'todo-column' contains exactly this order: 'Deploy app', 'Fix bug', 'Design web' (appended at
    // END, NOT alphabetically inserted)
    expect(await dragAndDropPage.getColumnTaskTexts(dragAndDropPage.todoColumn)).toEqual([
      'Deploy app',
      'Fix bug',
      'Design web',
    ]);
    // expect: 'finished-column' contains exactly 1 remaining card: 'Review code'
    expect(await dragAndDropPage.getColumnTaskTexts(dragAndDropPage.finishedColumn)).toEqual(['Review code']);
  });

  test('Task data-testid identity remains stable and tied to original card content regardless of which column currently contains it', async ({
    page,
  }) => {
    const dragAndDropPage = new DragAndDropPage(page);

    // 1. Navigate to '/components/dragAndDrop'. Drag 'task-2' ('Deploy app') into 'finished-column'
    await dragAndDropPage.gotoDragAndDrop();
    await dragAndDropPage.dragTaskTo('task-2', dragAndDropPage.finishedColumn);

    // expect: '[data-testid="task-2"]' still resolves to exactly 1 element, still reading text 'Deploy app',
    // now located inside 'finished-column' rather than 'todo-column'
    await expect(dragAndDropPage.task('task-2')).toHaveCount(1);
    await expect(dragAndDropPage.task('task-2')).toHaveText('Deploy app');
    await expect(dragAndDropPage.finishedColumn.getByTestId('task-2')).toHaveCount(1);
    await expect(dragAndDropPage.todoColumn.getByTestId('task-2')).toHaveCount(0);
  });
});
