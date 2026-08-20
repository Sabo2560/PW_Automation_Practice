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

  /**
   * Registers a request collector for calls that look like data/API traffic — excludes the page's
   * own document request and standard GET asset requests — and returns the backing array. Call
   * before interacting so no early requests are missed; read the array's contents at any point.
   */
  trackApiRequests(excludePathSubstring: string): string[] {
    const apiRequests: string[] = [];
    this.page.on('request', (request) => {
      const url = request.url();
      const looksLikeApiCall = request.method() !== 'GET' || url.includes('/api/');
      if (!url.includes(excludePathSubstring) && request.resourceType() !== 'document' && looksLikeApiCall) {
        apiRequests.push(url);
      }
    });
    return apiRequests;
  }
}