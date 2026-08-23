// spec: specs/drag-and-drop.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { DragAndDropPage } from '../../pages/DragAndDropPage';

test.describe('Drag and Drop - File Widget: Cancelled/Invalid Drop', () => {
  test('Dragging the file onto an invalid target outside the drop-zone is a cancelled no-op — the file remains draggable and the zone is unaffected', async ({
    page,
  }) => {
    const dragAndDropPage = new DragAndDropPage(page);

    // 1. Navigate to '/components/dragAndDrop'. Drag '[data-testid="file"]' onto the first 'form-label' element
    // (an invalid target well outside 'drop-zone')
    await dragAndDropPage.gotoDragAndDrop();
    await dragAndDropPage.dragFileTo(dragAndDropPage.formLabels.nth(0));

    // expect: '[data-testid="file"]' is still present in the DOM (count = 1), confirming the drop was
    // cancelled rather than consumed
    await expect(dragAndDropPage.file).toHaveCount(1);
    // expect: '[data-testid="drop-zone"]' text remains exactly 'Drop file here', unchanged
    await expect(dragAndDropPage.dropZone).toHaveText('Drop file here');
    // expect: '[data-testid="button-reset-file-button"]' is NOT present in the DOM (0 elements) — the
    // Uploading/Reset state was never entered
    await expect(dragAndDropPage.resetFileButton).toHaveCount(0);
  });
});
