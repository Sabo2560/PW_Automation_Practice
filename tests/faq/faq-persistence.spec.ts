// spec: specs/faq.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { FaqPage } from '../pages/FaqPage';

test.describe('FAQ - No State Persists Across a Page Reload', () => {
  let faqPage: FaqPage;

  test.beforeEach(async ({ page }) => {
    faqPage = new FaqPage(page);
  });

  test('Expanded items collapse back to the fresh-load default after a page reload', async () => {
    // 1. Navigate to '/faq' fresh. Open items 2, 4, and 7 via FaqPage.toggleItem() (leaving them
    //    expanded)
    await faqPage.gotoFaq();

    const questions = await faqPage.getAllQuestionTexts();
    expect(questions).toHaveLength(9);

    const expandedQuestions = [
      'How can I try the Automation Playground framework?',
      'Can I run real automation tests here?',
      'I found a bug — what should I do?',
    ];
    const collapsedQuestions = questions.filter((q) => !expandedQuestions.includes(q));
    expect(collapsedQuestions).toHaveLength(6);

    for (const question of expandedQuestions) {
      await faqPage.toggleItem(question);
    }

    // expect: Before reload, items 2, 4, and 7 all read aria-expanded exactly 'true'
    for (const question of expandedQuestions) {
      expect(await faqPage.isExpanded(question)).toBe(true);
    }
    // expect: The remaining 6 items read aria-expanded exactly 'false'
    for (const question of collapsedQuestions) {
      expect(await faqPage.isExpanded(question)).toBe(false);
    }

    // 2. Reload the page (page.reload())
    await faqPage.page.reload();

    // expect: After reload, ALL 9 items - including items 2, 4, and 7 which were expanded
    //         immediately before the reload - read aria-expanded exactly 'false' again, and every
    //         answer panel's class attribute is exactly 'hidden' again, matching the exact
    //         fresh-load default - confirming no localStorage/sessionStorage/URL-based state
    //         persistence exists for this widget
    for (const question of questions) {
      expect(await faqPage.isExpanded(question)).toBe(false);
      await expect(faqPage.getItem(question).locator('> div')).toHaveClass('hidden');
    }
  });
});
