// spec: specs/upload-file.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { UploadFilePage } from '../../pages/UploadFilePage';

test.describe('Upload File - Valid File Upload', () => {
  let uploadFilePage: UploadFilePage;

  test.beforeEach(async ({ page }) => {
    uploadFilePage = new UploadFilePage(page);
    await uploadFilePage.gotoUploadFile();
  });

  test('Uploading a valid .txt file transitions the widget from the default Upload button to the uploaded-file state, showing the exact filename and a Remove file control', async () => {
    // 1. Navigate to '/components/uploadFile'. Using the file input's setInputFiles() with an
    //    in-memory buffer (no real file needed on disk), select a file named 'valid-test.txt'
    //    with MIME type 'text/plain' and non-empty text content
    await uploadFilePage.uploadFile('valid-test.txt', 'hello world', 'text/plain');

    // expect: '[data-testid="button-upload-file-btn"]' (the 'Upload file' button) is no longer
    //         present in the DOM (0 elements)
    // expect: '[data-testid="remove-file-btn"]' becomes visible, with accessible name/aria-label
    //         exactly 'Remove file' and visible text exactly 'x'
    // expect: The filename text displayed next to the file icon reads exactly 'valid-test.txt'
    //         (leading/trailing whitespace trimmed before comparison, per the raw HTML source's
    //         leading space before the text node)
    await uploadFilePage.expectUploadedState('valid-test.txt');
  });

  test('An empty (0-byte) .txt file is accepted identically to a non-empty one — boundary value: minimum file size', async () => {
    // 1. Navigate to '/components/uploadFile'. Select a file named 'empty-test.txt' with MIME
    //    type 'text/plain' and an EMPTY (zero-byte) buffer via setInputFiles()
    await uploadFilePage.uploadFile('empty-test.txt', '', 'text/plain');

    // expect: The widget transitions to the uploaded state identically to the previous scenario:
    //         'button-upload-file-btn' is absent, 'remove-file-btn' is visible, and the displayed
    //         filename reads exactly 'empty-test.txt' — confirming file content size is not a
    //         rejection criterion for this widget (only the filename's extension is validated)
    await uploadFilePage.expectUploadedState('empty-test.txt');
  });

  test('A .txt filename containing spaces and special characters is displayed verbatim, unmodified', async () => {
    // 1. Navigate to '/components/uploadFile'. Select a file named 'my report (final) v2.txt'
    //    with MIME type 'text/plain' via setInputFiles()
    await uploadFilePage.uploadFile('my report (final) v2.txt', 'report content', 'text/plain');

    // expect: The widget transitions to the uploaded state, and the displayed filename text reads
    //         exactly 'my report (final) v2.txt' — confirming the app does not sanitize, truncate,
    //         or otherwise transform the filename before displaying it
    await uploadFilePage.expectUploadedState('my report (final) v2.txt');
  });
});
