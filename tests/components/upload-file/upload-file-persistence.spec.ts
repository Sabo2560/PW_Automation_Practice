// spec: specs/upload-file.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { UploadFilePage } from '../../pages/UploadFilePage';

test.describe('Upload File - Reload Persistence', () => {
  let uploadFilePage: UploadFilePage;

  test.beforeEach(async ({ page }) => {
    uploadFilePage = new UploadFilePage(page);
    await uploadFilePage.gotoUploadFile();
  });

  test('No uploaded-file state persists across a page reload — the widget always resets to its default Upload button state', async ({
    page,
  }) => {
    // 1. Navigate to '/components/uploadFile'. Upload a valid file ('reload-test.txt') and
    //    confirm the uploaded state is reached (remove-file-btn visible)
    await uploadFilePage.uploadFile('reload-test.txt', 'reload persistence content', 'text/plain');

    // expect: Before reload: '[data-testid="remove-file-btn"]' is visible with the expected
    //         filename (sanity check that the widget is genuinely in a non-default state going
    //         into the reload)
    await uploadFilePage.expectUploadedState('reload-test.txt');

    // 2. Reload the page (page.reload())
    await page.reload();

    // expect: After the reload completes, '[data-testid="button-upload-file-btn"]' (the default
    //         'Upload file' button) is visible and enabled again
    // expect: '[data-testid="remove-file-btn"]' is absent (0 elements) and no filename text
    //         remains anywhere in the widget, confirming no localStorage/sessionStorage/URL
    //         state is involved — matching the pattern documented across every other component
    //         plan in this repo
    await uploadFilePage.expectDefaultState();
    await expect(uploadFilePage.root).not.toContainText('reload-test.txt');
  });
});
