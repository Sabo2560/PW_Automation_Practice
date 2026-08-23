// spec: specs/faq.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { FaqPage } from '../pages/FaqPage';

test.describe('FAQ - Single Item Toggle and Multi-Item Expand', () => {
  let faqPage: FaqPage;

  test.beforeEach(async ({ page }) => {
    faqPage = new FaqPage(page);
  });

  test('Single item round-trip toggle: expand then collapse restores exact original state', async () => {
    // 1. Navigate to '/faq' fresh. Using FaqPage.getItem(), locate the first item
    //    ('Do I need to install anything to use the Playground?') and click its button via
    //    FaqPage.toggleItem()
    await faqPage.gotoFaq();

    const item1 = faqPage.getItem('Do I need to install anything to use the Playground?');
    const item1Button = item1.getByRole('button');
    const item1Panel = item1.locator('> div');
    const item1Chevron = item1Button.locator('span').last();

    await faqPage.toggleItem('Do I need to install anything to use the Playground?');

    // expect: The button's aria-expanded attribute becomes exactly 'true'
    await expect(item1Button).toHaveAttribute('aria-expanded', 'true');
    // expect: The item's answer panel becomes visible and its text reads exactly the documented
    //         answer
    await expect(item1Panel).toBeVisible();
    await expect(item1Panel).toHaveText(
      'No installation is required to explore the examples here.\nHowever, if you want to run tests or build your own automation suite, you’ll need to install the relevant framework on your local machine.'
    );
    // expect: The chevron span's class attribute now contains 'rotate-0' and no longer contains
    //         'rotate-90'
    await expect(item1Chevron).toHaveClass(/\brotate-0\b/);
    await expect(item1Chevron).not.toHaveClass(/\brotate-90\b/);

    // 2. Click the same item's button again (toggling it closed)
    await faqPage.toggleItem('Do I need to install anything to use the Playground?');

    // expect: The button's aria-expanded attribute returns to exactly 'false'
    await expect(item1Button).toHaveAttribute('aria-expanded', 'false');
    // expect: The item's answer panel is no longer visible
    await expect(item1Panel).toBeHidden();
    await expect(item1Panel).toHaveClass('hidden');
    // expect: The chevron span's class attribute now contains 'rotate-90' and no longer contains
    //         'rotate-0' - confirming a full round-trip toggle back to the exact original
    //         collapsed state
    await expect(item1Chevron).toHaveClass(/\brotate-90\b/);
    await expect(item1Chevron).not.toHaveClass(/\brotate-0\b/);
  });

  test('Toggling one item leaves all 8 other items untouched throughout open and close', async () => {
    // 1. On a fresh '/faq' load, verify all 8 OTHER items (every item except the one directly
    //    toggled) remain untouched throughout the open/close sequence
    await faqPage.gotoFaq();

    const toggledQuestion = 'Do I need to install anything to use the Playground?';
    const otherQuestions = (await faqPage.getAllQuestionTexts()).filter((q) => q !== toggledQuestion);
    expect(otherQuestions).toHaveLength(8);

    const assertOthersCollapsed = async () => {
      for (const question of otherQuestions) {
        // expect: Every one of the other 8 items' aria-expanded attribute remains exactly 'false'
        expect(await faqPage.isExpanded(question)).toBe(false);
      }
    };

    await assertOthersCollapsed();

    await faqPage.toggleItem(toggledQuestion);
    await assertOthersCollapsed();

    await faqPage.toggleItem(toggledQuestion);
    await assertOthersCollapsed();
  });

  test('Opening a second item while the first stays open expands both simultaneously (multi-open)', async () => {
    // 1. Navigate to '/faq' fresh. Open item 1 ('Do I need to install anything to use the
    //    Playground?') via FaqPage.toggleItem(), then WITHOUT closing it, open item 3 ('What is
    //    the Automation Playground?') as well
    await faqPage.gotoFaq();

    const questions = await faqPage.getAllQuestionTexts();
    const question1 = 'Do I need to install anything to use the Playground?';
    const question3 = 'What is the Automation Playground?';
    const remainingQuestions = questions.filter((q) => q !== question1 && q !== question3);
    expect(remainingQuestions).toHaveLength(7);

    await faqPage.toggleItem(question1);
    await faqPage.toggleItem(question3);

    // expect: Both item 1's and item 3's buttons simultaneously read aria-expanded exactly 'true'
    //         at the same time
    await expect(faqPage.getItem(question1).getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    await expect(faqPage.getItem(question3).getByRole('button')).toHaveAttribute('aria-expanded', 'true');

    // expect: Both item 1's and item 3's answer panels are simultaneously visible, each with
    //         their own exact text
    await expect(faqPage.getItem(question1).locator('> div')).toBeVisible();
    expect(await faqPage.getAnswerText(question1)).toBe(
      'No installation is required to explore the examples here.\nHowever, if you want to run tests or build your own automation suite, you’ll need to install the relevant framework on your local machine.'
    );
    await expect(faqPage.getItem(question3).locator('> div')).toBeVisible();
    expect(await faqPage.getAnswerText(question3)).toBe(
      'The Automation Playground is a testing space for new automation engineers and anyone curious about frameworks. It’s a safe environment to explore and practice automation concepts without needing a full project setup.'
    );

    // expect: All remaining 7 items still read aria-expanded exactly 'false' - confirming this
    //         widget allows multiple items open at once (a multi-open widget), not a
    //         single-open-at-a-time accordion
    for (const question of remainingQuestions) {
      expect(await faqPage.isExpanded(question)).toBe(false);
    }
  });
});
