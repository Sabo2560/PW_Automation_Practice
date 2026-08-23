// spec: specs/upload-file.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { UploadFilePage } from '../../pages/UploadFilePage';

test.describe('Upload File - Initial Load and Default State', () => {
  let uploadFilePage: UploadFilePage;

  test.beforeEach(async ({ page }) => {
    uploadFilePage = new UploadFilePage(page);
  });

  test('Upload File page loads with heading, label, client-side disclaimer, Upload button, and Insight section correctly rendered', async ({
    page,
  }) => {
    // 1. Navigate to '/components/uploadFile' (the real camelCase route — the hyphenated
    //    '/components/upload-file' returns HTTP 404) on a fresh browser context
    const consoleErrors = uploadFilePage.trackConsoleErrors();
    const response = await uploadFilePage.gotoUploadFile();

    // expect: Page loads successfully (HTTP 200, no console errors)
    expect(response?.status()).toBe(200);
    // expect: Heading 'Upload File' (level 1) is visible
    await expect(page.getByRole('heading', { name: 'Upload File', level: 1 })).toBeVisible();
    expect(consoleErrors).toEqual([]);

    // 2. Inspect the 'form-label' element and the adjacent disclaimer text
    // expect: The 'form-label' element reads exactly 'Upload random txt file and check that only .txt file can be uploaded'
    await expect(uploadFilePage.formLabel).toHaveText(
      'Upload random txt file and check that only .txt file can be uploaded'
    );
    // expect: The adjacent disclaimer span reads exactly 'No file is sent to server, everything stays in your browser'
    await expect(uploadFilePage.clientSideNote).toBeVisible();

    // 3. Inspect the widget's default (pre-upload) state and the Insight section without performing any upload
    // expect: A button with data-testid 'button-upload-file-btn' and accessible name 'Upload file' is visible and enabled
    await expect(uploadFilePage.uploadButton).toBeVisible();
    await expect(uploadFilePage.uploadButton).toBeEnabled();
    await expect(uploadFilePage.uploadButton).toHaveAccessibleName('Upload file');
    // expect: '[data-testid="remove-file-btn"]' resolves to 0 elements (no file is uploaded by default)
    await expect(page.getByTestId('remove-file-btn')).toHaveCount(0);
    // expect: Heading 'Insight' (level 2) is visible immediately with no interaction required; its concept
    //         list contains exactly, in order: 'Upload file', 'Remove uploaded file', 'Verify file type restrictions'
    await expect(page.getByRole('heading', { name: 'Insight', level: 2 })).toBeVisible();
    const conceptList = page.getByRole('list').filter({ hasText: 'Upload file' });
    await expect(conceptList.getByRole('listitem')).toHaveText([
      'Upload file',
      'Remove uploaded file',
      'Verify file type restrictions',
    ]);
    // expect: A 'Github solution' link is visible with the expected href
    const githubLink = page.getByRole('link', { name: 'Github solution' });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/uploadFile/uploadFile.spec.ts'
    );
  });

  test('The underlying file input is a native, hidden, single-file, .txt-only input element', async () => {
    // 1. Navigate to '/components/uploadFile'. Inspect the native input[type=file] element nested inside
    //    '[data-testid="upload-file"]' directly via its DOM attributes, without opening the file chooser
    await uploadFilePage.gotoUploadFile();

    // expect: The input's 'type' attribute is exactly 'file'
    await expect(uploadFilePage.fileInput).toHaveAttribute('type', 'file');
    // expect: The input's 'accept' attribute is exactly '.txt'
    await expect(uploadFilePage.fileInput).toHaveAttribute('accept', '.txt');
    // expect: The input has no 'multiple' attribute (getAttribute('multiple') returns null), confirming
    //         this widget supports selecting only ONE file at a time, never a batch/multi-file selection
    await expect(uploadFilePage.fileInput).not.toHaveAttribute('multiple');
    // expect: The input is visually hidden (its class list includes 'hidden') — it is never intended to be
    //         interacted with directly by a real user, only via the visible 'Upload file' button
    await expect(uploadFilePage.fileInput).toHaveClass(/hidden/);
  });
});
