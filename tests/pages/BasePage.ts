import { Page } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string) {
    return this.page.goto(path);
  }

  /**
   * Registers a console-error collector and returns the backing array. Call before
   * navigating so no early errors are missed; read the array's contents at any point.
   */
  trackConsoleErrors(): string[] {
    const consoleErrors: string[] = [];
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    return consoleErrors;
  }
}