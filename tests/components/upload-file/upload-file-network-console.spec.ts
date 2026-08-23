// spec: specs/upload-file.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { UploadFilePage } from '../../pages/UploadFilePage';

/**
 * Performs a full interaction sequence exercising all four widget actions in one pass — upload,
 * remove, rejected invalid upload (alert accepted), and re-upload — the shared sequence used by
 * both the network-requests and console-errors scenarios below, per specs/upload-file.plan.md §7.
 */
async function performFullUploadRemoveRejectReuploadSequence(uploadFilePage: UploadFilePage) {
  await uploadFilePage.uploadFile('valid-test.txt', 'hello world', 'text/plain');
  await expect(uploadFilePage.removeFileButton).toBeVisible();

  await uploadFilePage.removeFile();
  await expect(uploadFilePage.uploadButton).toBeVisible();

  await uploadFilePage.uploadFileExpectingAlert('invalid-test.png', 'not a text file', 'image/png');
  await expect(uploadFilePage.uploadButton).toBeVisible();

  await uploadFilePage.uploadFile('valid-test.txt', 'hello again', 'text/plain');
  await expect(uploadFilePage.removeFileButton).toBeVisible();
}

test.describe('Upload File - Network and Console Behavior', () => {
  let uploadFilePage: UploadFilePage;

  test.beforeEach(async ({ page }) => {
    uploadFilePage = new UploadFilePage(page);
    await uploadFilePage.gotoUploadFile();
  });

  test('No XHR/fetch network request is triggered by uploading, rejecting, or removing a file - purely client-side, matching the on-page disclaimer', async () => {
    // 1. Navigate to '/components/uploadFile', begin recording network requests, then perform a
    // full interaction sequence: upload a valid file, remove it, attempt an invalid file upload
    // (accepting the resulting alert), and upload a valid file again.
    const apiRequests = uploadFilePage.trackApiRequests('/components/uploadFile');

    await performFullUploadRemoveRejectReuploadSequence(uploadFilePage);

    // expect: no XHR/fetch network request specific to any upload/remove/reject action is
    // observed at any point in the sequence - only the same pre-existing Next.js static-asset/RSC-
    // prefetch requests documented on every other component page in this suite, confirming the
    // on-page text 'No file is sent to server, everything stays in your browser' is accurate.
    expect(apiRequests).toEqual([]);
  });

  test('No console errors are logged during the full upload/reject/remove interaction sequence', async () => {
    // 1. Navigate to '/components/uploadFile', begin tracking console errors, then repeat the
    // same broad interaction sequence as the network scenario above (valid upload, remove,
    // rejected invalid upload with alert accepted, valid re-upload).
    const consoleErrors = uploadFilePage.trackConsoleErrors();

    await performFullUploadRemoveRejectReuploadSequence(uploadFilePage);

    // expect: zero console error messages are logged throughout the entire sequence.
    expect(consoleErrors).toEqual([]);
  });
});
