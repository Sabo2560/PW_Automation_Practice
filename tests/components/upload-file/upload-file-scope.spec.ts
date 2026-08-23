// spec: specs/upload-file.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { UploadFilePage } from '../../pages/UploadFilePage';

test.describe('Upload File - Single-File-Only Scope and Distinctness from Drag-and-Drop Component', () => {
  let uploadFilePage: UploadFilePage;

  test.beforeEach(async ({ page }) => {
    uploadFilePage = new UploadFilePage(page);
  });

  test('This widget supports only single click-to-browse file selection — no multiple support and no drag-and-drop affordance, confirming it is a fully separate component from the file-drop widget on /components/dragAndDrop', async ({
    page,
  }) => {
    // 1. Navigate to '/components/uploadFile'. Query the full page DOM for any drag-and-drop-related
    //    testids or attributes: '[data-testid="drop-zone"]', '[data-testid="file"]', and any element
    //    with 'draggable="true"'
    await uploadFilePage.gotoUploadFile();

    // expect: Zero elements match '[data-testid="drop-zone"]' and zero match '[data-testid="file"]'
    //         anywhere on this page — those testids belong exclusively to the separate file-drop
    //         widget documented in 'specs/drag-and-drop.plan.md' for the different
    //         '/components/dragAndDrop' page, confirming the two are not the same component and must
    //         never share a Page Object
    await expect(page.locator('[data-testid="drop-zone"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="file"]')).toHaveCount(0);
    // expect: Zero elements on this page have a 'draggable="true"' attribute
    await expect(page.locator('[draggable="true"]')).toHaveCount(0);
    // expect: The file input's 'multiple' attribute is absent (per the load-scenario in Section 1),
    //         confirming this widget accepts exactly one file per selection, never a batch
    await expect(uploadFilePage.fileInput).not.toHaveAttribute('multiple');
  });
});
