import { Page, Locator, Dialog, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Upload File component
 * (https://www.automationplayground.dev/components/uploadFile). See specs/upload-file.plan.md
 * for full detail.
 *
 * Route correction (confirmed live): the real route is the camelCase '/components/uploadFile' —
 * the hyphenated '/components/upload-file' returns a genuine HTTP 404.
 *
 * This is a purely client-side widget (no backend interaction) with two states rendered inside a
 * single '[data-testid="upload-file"]' container: a default (pre-upload) state and an
 * uploaded-file state (upload button + hidden file input replaced entirely by a file-text icon,
 * the filename, and a Remove file button). expectDefaultState()/expectUploadedState() thin
 * assertion helpers consolidate the repeated state checks used across this suite's spec files.
 */
export class UploadFilePage extends BasePage {
  readonly root: Locator;
  readonly formLabel: Locator;
  readonly clientSideNote: Locator;
  readonly uploadButton: Locator;
  readonly fileInput: Locator;
  readonly removeFileButton: Locator;

  constructor(page: Page) {
    super(page);
    this.root = page.getByTestId('upload-file');
    this.formLabel = page.getByTestId('form-label');
    // No dedicated testid — a plain sibling <span> of the form label.
    this.clientSideNote = page.getByText('No file is sent to server, everything stays in your browser', {
      exact: true,
    });
    // Globally unique testid on this page — no duplicate-testid workaround needed.
    this.uploadButton = page.getByTestId('button-upload-file-btn');
    // Visually hidden via class="hidden" but still fully usable via setInputFiles(), which does
    // not require element visibility.
    this.fileInput = this.root.locator('input[type="file"]');
    // Only present in the uploaded-file state; absent (0 elements) in the default state.
    this.removeFileButton = page.getByTestId('remove-file-btn');
  }

  async gotoUploadFile() {
    const response = await this.goto('/components/uploadFile');
    await expect(this.page.getByRole('heading', { name: 'Upload File', level: 1 })).toBeVisible();
    return response;
  }

  /**
   * Selects a file via the hidden file input's setInputFiles(), using Playwright's own
   * in-memory-buffer form — no real file needs to exist on disk. Works for both valid (.txt)
   * and invalid (e.g. .png) files; callers handle the resulting alert (invalid) or DOM
   * transition (valid) themselves.
   */
  async uploadFile(fileName: string, content: string, mimeType?: string) {
    await this.fileInput.setInputFiles([
      { name: fileName, mimeType: mimeType ?? 'text/plain', buffer: Buffer.from(content) },
    ]);
  }

  /**
   * Selects a file expected to be REJECTED by the app's filename-extension check, which fires a
   * genuine, blocking native window.alert(). Mirrors AlertPage.triggerDialog()'s register-before-
   * trigger convention: the one-shot 'dialog' handler is registered BEFORE setInputFiles() is
   * called (required — Playwright auto-dismisses any dialog with no registered handler), and the
   * dialog is accepted from *within* the handler because the native dialog blocks the page's
   * render process until it is actually resolved. Returns the dialog's message text.
   */
  async uploadFileExpectingAlert(fileName: string, content: string, mimeType?: string): Promise<string> {
    let message: string | null = null;
    const handled = new Promise<void>((resolve) => {
      this.page.once('dialog', async (dialog: Dialog) => {
        message = dialog.message();
        await dialog.accept();
        resolve();
      });
    });
    await this.uploadFile(fileName, content, mimeType);
    await handled;
    return message!;
  }

  /**
   * Clicks the Remove file button (present only in the uploaded-file state), reverting the
   * widget back to its default pre-upload state.
   */
  async removeFile() {
    await this.removeFileButton.click();
  }

  /**
   * Reads the filename text displayed next to the file-icon SVG (`svg.lucide-file-text`) in the
   * uploaded state. This text carries no dedicated data-testid of its own — confirmed live, the
   * icon's parent has TWO separate text-node siblings after the icon: a whitespace-only one
   * (`" "`) immediately followed by a second one holding the actual filename (e.g.
   * `[svg, " ", "valid-test.txt", <button>]`), so reading only `icon.nextSibling` lands on the
   * whitespace node and yields `''`. page.evaluate() is used deliberately here, consistent with
   * WindowPage.ts's isFocusInsideModal()/isBackdropAtPoint() pattern for untestid'd state with no
   * locator equivalent. Concatenates all direct text-node children of the icon's parent (skipping
   * the icon/button elements themselves) and trims, so it's resilient to how many text nodes the
   * whitespace/filename end up split across. Returns null if the icon (and therefore the uploaded
   * state) isn't present.
   */
  async getUploadedFileName(): Promise<string | null> {
    return this.page.evaluate(() => {
      const icon = document.querySelector('[data-testid="upload-file"] svg.lucide-file-text');
      const parent = icon?.parentElement;
      if (!parent) return null;
      const text = Array.from(parent.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent ?? '')
        .join('');
      return text.trim();
    });
  }

  /**
   * Asserts the widget is in its default (pre-upload) state: the 'Upload file' trigger button is
   * visible, enabled, and correctly labeled, and no Remove-file button is present. Consolidates
   * the same 4 checks that were previously duplicated inline across several spec files.
   */
  async expectDefaultState() {
    await expect(this.uploadButton).toBeVisible();
    await expect(this.uploadButton).toBeEnabled();
    await expect(this.uploadButton).toHaveAccessibleName('Upload file');
    await expect(this.removeFileButton).toHaveCount(0);
  }

  /**
   * Asserts the widget is in its uploaded-file state for the given filename: the trigger button
   * is gone, the Remove-file button is visible with its expected aria-label/text, and the
   * displayed filename matches exactly. Consolidates the same checks that were previously
   * duplicated inline across several spec files.
   */
  async expectUploadedState(fileName: string) {
    await expect(this.uploadButton).toHaveCount(0);
    await expect(this.removeFileButton).toBeVisible();
    await expect(this.removeFileButton).toHaveAttribute('aria-label', 'Remove file');
    await expect(this.removeFileButton).toHaveText('x');
    expect(await this.getUploadedFileName()).toBe(fileName);
  }
}
