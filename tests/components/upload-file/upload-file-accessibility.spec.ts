// spec: specs/upload-file.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { UploadFilePage } from '../../pages/UploadFilePage';

test.describe('Upload File - Accessibility / Keyboard', () => {
  let uploadFilePage: UploadFilePage;

  test.beforeEach(async ({ page }) => {
    uploadFilePage = new UploadFilePage(page);
    await uploadFilePage.gotoUploadFile();
  });

  test('The Upload file trigger button is a real native button that is keyboard-focusable and activatable', async ({
    page,
  }) => {
    // 1. Navigate to '/components/uploadFile'. Focus '[data-testid="button-upload-file-btn"]'
    //    directly and confirm its tag/type
    await uploadFilePage.uploadButton.focus();

    // expect: The element's tag name is 'BUTTON' with 'type="button"' (a real native button, not
    //         a styled div/span) with accessible role 'button' and accessible name 'Upload file'
    //         derived from its visible text content
    expect(await uploadFilePage.uploadButton.evaluate((el) => el.tagName)).toBe('BUTTON');
    await expect(uploadFilePage.uploadButton).toHaveAttribute('type', 'button');
    await expect(uploadFilePage.uploadButton).toHaveRole('button');
    await expect(uploadFilePage.uploadButton).toHaveAccessibleName('Upload file');
    await expect(uploadFilePage.uploadButton).toBeFocused();

    // 2. With the button focused, press 'Enter', listening for a filechooser event
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.keyboard.press('Enter');
    const fileChooser = await fileChooserPromise;

    // expect: A native file chooser is triggered as a direct result of the Enter keypress (the
    //         page emits a 'filechooser' event), identical in outcome to a mouse click on the
    //         same button — confirming Enter is a fully equivalent activation method for this
    //         native button
    expect(fileChooser).toBeTruthy();
  });

  test("The Remove file button has an explicit aria-label distinct from its visible 'x' text, and is keyboard-activatable", async () => {
    // 1. Navigate to '/components/uploadFile'. Upload a valid file to reach the uploaded state,
    //    then inspect the Remove file button's 'aria-label' attribute and visible text content
    await uploadFilePage.uploadFile('valid-test.txt', 'hello world', 'text/plain');
    await expect(uploadFilePage.removeFileButton).toBeVisible();

    // expect: 'aria-label' equals exactly 'Remove file' while the button's rendered visible text
    //         is exactly 'x' — confirming assistive technology announces the fuller, clearer
    //         'Remove file' label rather than the terse visual 'x' glyph
    await expect(uploadFilePage.removeFileButton).toHaveAttribute('aria-label', 'Remove file');
    await expect(uploadFilePage.removeFileButton).toHaveText('x');

    // 2. Focus the Remove file button directly and press 'Enter'
    await uploadFilePage.removeFileButton.focus();
    await expect(uploadFilePage.removeFileButton).toBeFocused();
    await uploadFilePage.page.keyboard.press('Enter');

    // expect: The widget reverts to its default 'Upload file' button state as a direct result of
    //         the Enter keypress, identical in outcome to a mouse click, confirming Enter is a
    //         fully equivalent activation method for this button too
    await uploadFilePage.expectDefaultState();
  });
});
