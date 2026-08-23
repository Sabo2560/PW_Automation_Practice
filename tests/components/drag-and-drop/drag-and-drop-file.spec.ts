// spec: specs/drag-and-drop.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { DragAndDropPage } from '../../pages/DragAndDropPage';

test.describe('Drag and Drop - File Widget: Successful Drop, Disappear, and Reset', () => {
  test('Dragging the file onto the drop-zone removes it from the DOM and transitions the zone to an Uploading state with a Reset button', async ({
    page,
  }) => {
    const dragAndDropPage = new DragAndDropPage(page);

    // 1. Navigate to '/components/dragAndDrop'. Confirm '[data-testid="file"]' is present (count = 1). Drag
    // '[data-testid="file"]' onto '[data-testid="drop-zone"]'
    await dragAndDropPage.gotoDragAndDrop();
    await expect(dragAndDropPage.file).toHaveCount(1);
    await dragAndDropPage.dragFileToDropZone();

    // expect: '[data-testid="file"]' is now fully absent from the DOM (count = 0), confirming it 'disappears'
    // rather than merely becoming hidden
    await expect(dragAndDropPage.file).toHaveCount(0);
    // expect: '[data-testid="drop-zone"]' text now reads exactly 'Uploading...'
    await expect(dragAndDropPage.dropZone).toHaveText('Uploading...');
    // expect: '[data-testid="button-reset-file-button"]' is now visible with text 'Reset'
    await expect(dragAndDropPage.resetFileButton).toBeVisible();
    await expect(dragAndDropPage.resetFileButton).toHaveText('Reset');

    // 2. Wait 3 seconds without further interaction, then re-inspect the drop-zone
    await page.waitForTimeout(3000);

    // expect: '[data-testid="drop-zone"]' text is still exactly 'Uploading...' (no automatic transition to a
    // different/completed state observed within this window)
    await expect(dragAndDropPage.dropZone).toHaveText('Uploading...');
  });

  test('Clicking Reset after a successful file drop restores the file widget to its exact original default state', async ({
    page,
  }) => {
    const dragAndDropPage = new DragAndDropPage(page);

    // 1. Navigate to '/components/dragAndDrop'. Drag the file onto the drop-zone, confirm the
    // 'Uploading...'/Reset state is reached. Click '[data-testid="button-reset-file-button"]'
    await dragAndDropPage.gotoDragAndDrop();
    await dragAndDropPage.dragFileToDropZone();
    await expect(dragAndDropPage.dropZone).toHaveText('Uploading...');
    await expect(dragAndDropPage.resetFileButton).toBeVisible();
    await dragAndDropPage.resetFileButton.click();

    // expect: '[data-testid="file"]' reappears in the DOM (count = 1)
    await expect(dragAndDropPage.file).toHaveCount(1);
    // expect: '[data-testid="drop-zone"]' text reverts to exactly 'Drop file here'
    await expect(dragAndDropPage.dropZone).toHaveText('Drop file here');
    // expect: '[data-testid="button-reset-file-button"]' is no longer present in the DOM (count = 0)
    await expect(dragAndDropPage.resetFileButton).toHaveCount(0);
  });

  test('Reset is scoped only to the file widget and has zero effect on independent Kanban task board state', async ({
    page,
  }) => {
    const dragAndDropPage = new DragAndDropPage(page);

    // 1. Navigate to '/components/dragAndDrop'. Drag 'task-3' ('Fix bug') into 'finished-column' (board now
    // non-default). Then drag the file onto the drop-zone and click Reset
    await dragAndDropPage.gotoDragAndDrop();
    await dragAndDropPage.dragTaskTo('task-3', dragAndDropPage.finishedColumn);
    await dragAndDropPage.dragFileToDropZone();
    await expect(dragAndDropPage.resetFileButton).toBeVisible();
    await dragAndDropPage.resetFileButton.click();

    // expect: 'finished-column's task order after Reset is still exactly ['Design web', 'Fix bug'] (from the
    // earlier board move) — completely unaffected by the file widget's drop-and-reset cycle
    expect(await dragAndDropPage.getColumnTaskTexts(dragAndDropPage.finishedColumn)).toEqual([
      'Design web',
      'Fix bug',
    ]);
    // expect: 'todo-column' still contains exactly ['Review code', 'Deploy app'], also unaffected
    expect(await dragAndDropPage.getColumnTaskTexts(dragAndDropPage.todoColumn)).toEqual([
      'Review code',
      'Deploy app',
    ]);
  });
});
