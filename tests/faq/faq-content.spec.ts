// spec: specs/faq.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { FaqPage } from '../pages/FaqPage';

const QA_PAIRS: { question: string; answer: string }[] = [
  {
    question: 'Do I need to install anything to use the Playground?',
    answer:
      'No installation is required to explore the examples here.\nHowever, if you want to run tests or build your own automation suite, you’ll need to install the relevant framework on your local machine.',
  },
  {
    question: 'How can I try the Automation Playground framework?',
    answer:
      'You can quickly get started by installing Playwright or any other testing framework of your choice.\nTo try Playwright, follow the official setup guide here: https://playwright.dev/docs/intro',
  },
  {
    question: 'What is the Automation Playground?',
    answer:
      'The Automation Playground is a testing space for new automation engineers and anyone curious about frameworks. It’s a safe environment to explore and practice automation concepts without needing a full project setup.',
  },
  {
    question: 'Can I run real automation tests here?',
    answer:
      'No.\nThis page is designed for learning and experimentation only. You can explore examples and understand how things work, but to actually execute tests, you’ll need to have your framework (like Cypress, Playwright, or Selenium) installed locally.',
  },
  {
    question: 'Is the Automation Playground free to use?',
    answer:
      'Yes — the Automation Playground is completely free.\nYou can explore, learn, and experiment as much as you like. There are no hidden fees, subscriptions, or sign-ups required.',
  },
  {
    question: 'Can I contribute or suggest new features?',
    answer:
      'Absolutely!\nWe’re open to ideas and community contributions. If you have an idea for a new feature or improvement, head to the “Got a feature in mind?” section and let us know.',
  },
  {
    question: 'I found a bug — what should I do?',
    answer:
      'You can report issues or bugs through our feedback form from home page.\nPlease include as much detail as possible so we can fix it quickly.',
  },
  {
    question: 'Will there be more content or pages in the future?',
    answer:
      'For now, the Playground is a single-page testing environment. We plan to expand based on community feedback and usage.',
  },
  {
    question: 'Is my data saved anywhere?',
    answer:
      'No — any input or code you write here stays in your browser. We don’t store user data or test results.',
  },
];

test.describe('FAQ - Answer Content Integrity Across All 9 Items', () => {
  let faqPage: FaqPage;

  test.beforeEach(async ({ page }) => {
    faqPage = new FaqPage(page);
    await faqPage.gotoFaq();
  });

  test('Every item\'s answer text matches its expected copy exactly, and no item contains a clickable link', async () => {
    for (const { question, answer } of QA_PAIRS) {
      // 1. Navigate to '/faq' fresh. Looping through all 9 items in DOM order (each iteration
      //    wrapped in its own test.step for per-item pass/fail reporting), open each item
      //    individually via FaqPage.toggleItem() and read its visible answer text via
      //    FaqPage.getAnswerText()
      await test.step(question, async () => {
        await faqPage.toggleItem(question);

        // expect: For every one of the 9 items, the visible answer text (trimmed) exactly
        //         matches its corresponding expected string
        const panel = faqPage.getItem(question).locator('> div');
        await expect(panel).toBeVisible();
        expect((await faqPage.getAnswerText(question)).trim()).toBe(answer);

        // 2. For each of the 9 opened answer panels, query for any descendant <a> (link) element
        // expect: Zero <a> elements are found within any of the 9 answer panels
        await expect(panel.locator('a')).toHaveCount(0);

        if (question === 'How can I try the Automation Playground framework?') {
          // expect: Specifically for item 2's panel, confirm its text contains the literal
          //         substring 'https://playwright.dev/docs/intro' as plain text, AND that
          //         getByRole('link') scoped to that panel resolves to 0 elements - confirming
          //         this URL is deliberately NOT a clickable hyperlink
          await expect(panel).toContainText('https://playwright.dev/docs/intro');
          await expect(panel.getByRole('link')).toHaveCount(0);
        }
      });
    }
  });
});
