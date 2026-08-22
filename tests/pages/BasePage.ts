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

  /**
   * Registers a document-navigation request collector, scoped across the entire browser context
   * (not just this page) so it also catches requests made by pages opened afterward (e.g. a new
   * tab) — trackApiRequests() deliberately excludes 'document' resourceType requests and is scoped
   * to this page alone, so it isn't reusable for this case. Returns the backing array; call before
   * triggering the navigation so the request isn't missed.
   */
  trackDocumentRequests(pathSubstring: string): string[] {
    const documentRequests: string[] = [];
    this.page.context().on('request', (request) => {
      if (request.resourceType() === 'document' && request.url().includes(pathSubstring)) {
        documentRequests.push(request.url());
      }
    });
    return documentRequests;
  }
}