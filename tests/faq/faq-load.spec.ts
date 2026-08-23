// spec: specs/faq.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { FaqPage } from '../pages/FaqPage';

test.describe('FAQ - Initial Load and Default State', () => {
  let faqPage: FaqPage;

  test.beforeEach(async ({ page }) => {
    faqPage = new FaqPage(page);
  });

  test('FAQ page loads with intro paragraph, no page-specific heading, and only the shared header h1', async ({
    page,
  }) => {
    // 1. Navigate to '/faq' on a fresh browser context via FaqPage.gotoFaq()
    await faqPage.gotoFaq();

    // expect: The intro paragraph is visible and reads exactly the documented welcome text
    await expect(faqPage.introParagraph).toHaveText(
      'Welcome to the Automation Playground FAQ! Here you’ll find answers to the most common questions about how the Playground works, who it’s for, and what you can do here.'
    );
    // expect: Zero heading elements (h1-h6) exist anywhere within <main> - this page has no
    //         page-specific heading at all, a direct contrast with every component page
    await expect(page.locator('main').getByRole('heading')).toHaveCount(0);
    // expect: The only h1 present anywhere on the page is the shared header's 'Automation
    //         Playground' branding link heading (present identically on every page in this app)
    const pageH1 = page.getByRole('heading', { level: 1 });
    await expect(pageH1).toHaveCount(1);
    await expect(pageH1).toHaveText('Automation Playground');
  });

  test('All 9 FAQ items load collapsed by default, in the exact documented question order', async () => {
    // 1. Navigate to '/faq' fresh
    await faqPage.gotoFaq();

    // 2. Query FaqPage.items (the 9 item wrapper elements) and, for each, read its button's
    //    aria-expanded attribute and its answer panel's class attribute
    // expect: Exactly 9 item wrapper elements are present (read live via the count of matched
    //         elements, not hardcoded as an assumed constant)
    const itemCount = await faqPage.items.count();
    expect(itemCount).toBe(9);

    for (let i = 0; i < itemCount; i++) {
      const item = faqPage.items.nth(i);
      // expect: Every one of the 9 buttons has aria-expanded exactly equal to the string 'false'
      await expect(item.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
      // expect: Every one of the 9 answer panels has a class attribute containing exactly
      //         'hidden' and not containing 'block' - confirming all 9 items load fully
      //         collapsed by default with no exceptions
      const panel = item.locator('> div');
      await expect(panel).toHaveClass(/\bhidden\b/);
      await expect(panel).not.toHaveClass(/\bblock\b/);
    }

    // 3. Read the 9 question texts live via FaqPage.getAllQuestionTexts(), in DOM order
    const questionTexts = await faqPage.getAllQuestionTexts();
    // expect: The 9 questions read exactly, in this order
    expect(questionTexts).toEqual([
      'Do I need to install anything to use the Playground?',
      'How can I try the Automation Playground framework?',
      'What is the Automation Playground?',
      'Can I run real automation tests here?',
      'Is the Automation Playground free to use?',
      'Can I contribute or suggest new features?',
      'I found a bug — what should I do?',
      'Will there be more content or pages in the future?',
      'Is my data saved anywhere?',
    ]);
  });

  test('No search/filter input, textbox, or search-role control exists anywhere on the page', async ({ page }) => {
    // 1. On a fresh '/faq' load, query the entire page (not just <main>) for any input,
    //    textbox-role, or search-role element
    await faqPage.gotoFaq();

    // expect: Zero such elements are found anywhere on the page - confirming no search/filter
    //         control of any kind exists on this FAQ page
    await expect(page.locator('input')).toHaveCount(0);
    await expect(page.getByRole('textbox')).toHaveCount(0);
    await expect(page.getByRole('searchbox')).toHaveCount(0);
  });
});
