// spec: specs/upload-file.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { UploadFilePage } from '../../pages/UploadFilePage';

test.describe('Upload File - Remove File', () => {
  let uploadFilePage: UploadFilePage;

  test.beforeEach(async ({ page }) => {
    uploadFilePage = new UploadFilePage(page);
    await uploadFilePage.gotoUploadFile();
  });

  test('Clicking Remove file after a successful upload reverts the widget exactly to its original default pre-upload state', async () => {
    // 1. Navigate to '/components/uploadFile'. Upload a valid file ('valid-test.txt') via
    //    setInputFiles(), confirm the uploaded state is reached, then click
    //    '[data-testid="remove-file-btn"]'
    await uploadFilePage.uploadFile('valid-test.txt', 'hello world', 'text/plain');
    await expect(uploadFilePage.removeFileButton).toBeVisible();
    await uploadFilePage.removeFile();

    // expect: '[data-testid="button-upload-file-btn"]' (the 'Upload file' button) reappears,
    //         visible and enabled, with its original accessible name exactly 'Upload file'
    // expect: '[data-testid="remove-file-btn"]' is no longer present in the DOM (0 elements)
    await uploadFilePage.expectDefaultState();
    // expect: No filename text is present anywhere in the widget's container
    //         ('[data-testid="upload-file"]')
    await expect(uploadFilePage.root).not.toContainText('valid-test.txt');
  });

  test('After removing a file, a new valid file can be uploaded successfully — full remove-then-reupload round trip', async () => {
    // 1. Navigate to '/components/uploadFile'. Upload 'first.txt', click Remove file, then
    //    upload a DIFFERENT valid file 'second.txt' via setInputFiles()
    await uploadFilePage.uploadFile('first.txt', 'first content', 'text/plain');
    await expect(uploadFilePage.removeFileButton).toBeVisible();
    await uploadFilePage.removeFile();
    await expect(uploadFilePage.uploadButton).toBeVisible();
    await uploadFilePage.uploadFile('second.txt', 'second content', 'text/plain');

    // expect: After the second upload, the widget reaches the uploaded state again:
    //         'remove-file-btn' is visible and the displayed filename reads exactly
    //         'second.txt' — NOT 'first.txt' — confirming no stale filename or upload-blocked
    //         state persists across a remove-then-reupload cycle
    await uploadFilePage.expectUploadedState('second.txt');
  });
});
