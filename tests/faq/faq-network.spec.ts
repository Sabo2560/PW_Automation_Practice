// spec: specs/faq.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { FaqPage } from '../pages/FaqPage';

test.describe('FAQ - Purely Client-Side Behavior (No Network Requests on Interaction)', () => {
  let faqPage: FaqPage;

  test.beforeEach(async ({ page }) => {
    faqPage = new FaqPage(page);
  });

  test('Toggling FAQ items triggers zero backend/API calls', async () => {
    // 1. Navigate to '/faq'. Before any interaction, begin tracking requests via
    //    BasePage.trackApiRequests('/faq'). Then open items 1, 5, and 9, close item 1, and leave
    //    items 5 and 9 open.
    await faqPage.gotoFaq();

    const apiRequests = faqPage.trackApiRequests('/faq');

    const question1 = 'Do I need to install anything to use the Playground?';
    const question5 = 'Is the Automation Playground free to use?';
    const question9 = 'Is my data saved anywhere?';

    await faqPage.toggleItem(question1);
    await faqPage.toggleItem(question5);
    await faqPage.toggleItem(question9);
    await faqPage.toggleItem(question1);

    // expect: The tracked API-request array remains empty (length 0) throughout the entire
    // interaction sequence - confirming toggling FAQ items triggers zero backend/API calls of any
    // kind, consistent with this being a purely static, client-side-rendered widget with all
    // content already present in the initial page load.
    expect(apiRequests).toEqual([]);

    // Confirm the intended end state was actually reached (item 1 closed, items 5 and 9 open),
    // so a zero-length request array can't be trivially explained by the interactions not firing.
    expect(await faqPage.isExpanded(question1)).toBe(false);
    expect(await faqPage.isExpanded(question5)).toBe(true);
    expect(await faqPage.isExpanded(question9)).toBe(true);
  });
});
