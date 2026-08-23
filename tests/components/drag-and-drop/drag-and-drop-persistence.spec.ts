// spec: specs/drag-and-drop.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { DragAndDropPage } from '../../pages/DragAndDropPage';

test.describe('Drag and Drop - State Persistence Across Reload', () => {
  test('Reloading the page after extensive interaction with both widgets fully resets everything to its exact original default state', async ({
    page,
  }) => {
    const dragAndDropPage = new DragAndDropPage(page);

    // 1. Navigate to '/components/dragAndDrop'. Rearrange the board: drag 'task-1', 'task-2', 'task-3' into
    // 'finished-column' (task-4 already starts there). Complete a file drop: drag file onto drop-zone
    await dragAndDropPage.gotoDragAndDrop();
    await dragAndDropPage.dragTaskTo('task-1', dragAndDropPage.finishedColumn);
    await dragAndDropPage.dragTaskTo('task-2', dragAndDropPage.finishedColumn);
    await dragAndDropPage.dragTaskTo('task-3', dragAndDropPage.finishedColumn);
    await dragAndDropPage.dragFileToDropZone();

    // expect: 'todo-column' has 0 tasks and 'finished-column' has all 4, confirming the board is now non-default
    expect(await dragAndDropPage.getColumnTaskTexts(dragAndDropPage.todoColumn)).toEqual([]);
    expect(await dragAndDropPage.getColumnTaskTexts(dragAndDropPage.finishedColumn)).toEqual([
      'Deploy app',
      'Design web',
      'Fix bug',
      'Review code',
    ]);
    // expect: 'drop-zone' reads 'Uploading...' with a Reset button present, confirming the file widget is
    // also now non-default
    await expect(dragAndDropPage.dropZone).toHaveText('Uploading...');
    await expect(dragAndDropPage.resetFileButton).toBeVisible();

    // 2. Reload the page (page.reload() is preferred over a fresh goto since this is specifically testing that
    // a reload doesn't preserve state via any client-side reload path)
    await page.reload();
    // page.reload() resolves on the load event, which can land before React hydration finishes — wait for the
    // file element to reappear/be visible before asserting on post-reload state, mirroring gotoDragAndDrop()
    await expect(dragAndDropPage.file).toBeVisible();

    // expect: 'todo-column' contains exactly ['Review code', 'Deploy app', 'Fix bug'] again, in that exact order
    expect(await dragAndDropPage.getColumnTaskTexts(dragAndDropPage.todoColumn)).toEqual([
      'Review code',
      'Deploy app',
      'Fix bug',
    ]);
    // expect: 'finished-column' contains exactly ['Design web'] again
    expect(await dragAndDropPage.getColumnTaskTexts(dragAndDropPage.finishedColumn)).toEqual(['Design web']);
    // expect: '[data-testid="file"]' is present again (count = 1) and '[data-testid="drop-zone"]' reads exactly
    // 'Drop file here' again
    await expect(dragAndDropPage.file).toHaveCount(1);
    await expect(dragAndDropPage.dropZone).toHaveText('Drop file here');
    // expect: '[data-testid="button-reset-file-button"]' is absent again (0 elements), confirming no state
    // persisted via localStorage, sessionStorage, or URL across the reload
    await expect(dragAndDropPage.resetFileButton).toHaveCount(0);
  });
});
