// spec: specs/upload-file.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { UploadFilePage } from '../../pages/UploadFilePage';

test.describe('Upload File - Invalid File Type Rejection', () => {
  let uploadFilePage: UploadFilePage;

  test.beforeEach(async ({ page }) => {
    uploadFilePage = new UploadFilePage(page);
    await uploadFilePage.gotoUploadFile();
  });

  test('Selecting a non-.txt file triggers a native browser alert with the exact rejection message, and the widget remains in its unchanged default state', async () => {
    // 1. Register a native 'dialog' event handler BEFORE selecting the file (required —
    //    Playwright auto-dismisses unregistered dialogs), then select a file named
    //    'invalid-test.png' with MIME type 'image/png' via setInputFiles()
    const message = await uploadFilePage.uploadFileExpectingAlert(
      'invalid-test.png',
      'fake image bytes',
      'image/png'
    );

    // expect: A native 'alert' dialog fires as a direct result of the file selection, with
    //         message text exactly 'Only .txt files are allowed.'
    expect(message).toBe('Only .txt files are allowed.');
    // expect: After accepting/dismissing the dialog, '[data-testid="button-upload-file-btn"]'
    //         (the 'Upload file' button) is still visible and enabled — the widget never entered
    //         the uploaded state
    await expect(uploadFilePage.uploadButton).toBeVisible();
    await expect(uploadFilePage.uploadButton).toBeEnabled();
    // expect: '[data-testid="remove-file-btn"]' is not present in the DOM (0 elements),
    //         confirming the rejected file was never accepted
    await expect(uploadFilePage.removeFileButton).toHaveCount(0);
  });

  test('[QUIRK] Extension validation is case-sensitive — an uppercase .TXT extension is rejected identically to a wrong file type', async () => {
    // 1. Register a dialog handler, then select a file named 'UPPER-TEST.TXT' (uppercase
    //    extension) with MIME type 'text/plain' via setInputFiles()
    const message = await uploadFilePage.uploadFileExpectingAlert(
      'UPPER-TEST.TXT',
      'uppercase extension content',
      'text/plain'
    );

    // expect: The identical native alert fires with message exactly 'Only .txt files are
    //         allowed.', confirming the app's extension check performs an exact, case-sensitive
    //         match against a literal lowercase '.txt' suffix — only an exact lowercase '.txt'
    //         extension is ever accepted, never '.TXT', '.Txt', or any other casing variant
    expect(message).toBe('Only .txt files are allowed.');
    // expect: After the dialog is accepted, the widget remains in its default state ('Upload
    //         file' button visible, no filename/remove button present)
    await expect(uploadFilePage.uploadButton).toBeVisible();
    await expect(uploadFilePage.removeFileButton).toHaveCount(0);
  });

  test('After an invalid file is rejected, the underlying file input is cleared, allowing the exact same invalid file to be re-selected and re-rejected consistently', async () => {
    // 1. Register a dialog handler, select an invalid file ('invalid-test.png'), accept the
    //    resulting alert, then read the file input's 'files.length' and 'value' properties directly
    const firstMessage = await uploadFilePage.uploadFileExpectingAlert(
      'invalid-test.png',
      'fake image bytes',
      'image/png'
    );
    expect(firstMessage).toBe('Only .txt files are allowed.');

    // expect: Immediately after the alert is dismissed, the file input's 'files' collection has
    //         length exactly 0 and its 'value' property is an empty string — confirming the
    //         input is genuinely reset, not merely left holding a stale/rejected file reference
    const filesLength = await uploadFilePage.fileInput.evaluate(
      (input: HTMLInputElement) => input.files?.length ?? -1
    );
    const value = await uploadFilePage.fileInput.inputValue();
    expect(filesLength).toBe(0);
    expect(value).toBe('');

    // 2. Register a second dialog handler, then select the SAME invalid file
    //    ('invalid-test.png') a second time via setInputFiles()
    const secondMessage = await uploadFilePage.uploadFileExpectingAlert(
      'invalid-test.png',
      'fake image bytes',
      'image/png'
    );

    // expect: The identical native alert fires again with the same exact message, and the
    //         widget remains in its default state — confirming rejection is consistently
    //         re-triggered on repeat attempts with the same invalid file, not silently ignored
    //         due to any stale/duplicate-selection state
    expect(secondMessage).toBe('Only .txt files are allowed.');
    await expect(uploadFilePage.uploadButton).toBeVisible();
    await expect(uploadFilePage.removeFileButton).toHaveCount(0);
  });
});
