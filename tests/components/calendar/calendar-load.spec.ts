// spec: specs/calendar.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { CalendarPage } from '../../pages/CalendarPage';

test.describe('Calendar - Initial Load and Default State', () => {
  let calendarPage: CalendarPage;

  test.beforeEach(async ({ page }) => {
    calendarPage = new CalendarPage(page);
  });

  test('Calendar page loads with all three exercise sections, labels, and Insight section correctly rendered', async ({
    page,
  }) => {
    // 1. Navigate to '/components/calendar' on a fresh browser context
    const consoleErrors = calendarPage.trackConsoleErrors();
    const response = await calendarPage.gotoCalendar();

    // expect: Page loads successfully (HTTP 200, no console errors)
    expect(response?.status()).toBe(200);
    // expect: Heading 'Calendar' (level 1) is visible
    await expect(page.getByRole('heading', { name: 'Calendar', level: 1 })).toBeVisible();
    expect(consoleErrors).toEqual([]);

    // 2. Inspect all three 'form-label' elements in DOM order
    // expect: The three labels read exactly, in order
    await expect(page.getByTestId('form-label')).toHaveText([
      'Set date input to tomorrow',
      'Select start date as today and end date as 5 days from today',
      'Set time input to 14:35 and verify the text',
    ]);

    // 3. Inspect the 'Insight' section without performing any click/expand interaction
    // expect: Heading 'Insight' (level 2) is visible immediately with no interaction required
    await expect(page.getByRole('heading', { name: 'Insight', level: 2 })).toBeVisible();
    // expect: The concept list contains exactly the documented items
    const conceptList = page.getByRole('list').filter({ hasText: 'Fill basic date fields with date values' });
    await expect(conceptList.getByRole('listitem')).toHaveText([
      'Fill basic date fields with date values',
      'Select a date range with start and end date',
      'Validate error for invalid date range',
      'Select and verify time using time picker',
    ]);
    // expect: A 'Github solution' link is visible with the expected href
    const githubLink = page.getByRole('link', { name: 'Github solution' });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute(
      'href',
      'https://github.com/The-Automation-Playground/Automation-Playground-Solution/blob/main/tests/calendar/calendar.spec.ts'
    );
  });

  test('The Basic Date field is empty by default with no helper/error text present anywhere', async () => {
    // 1. Navigate to '/components/calendar'. Without interacting, read the Basic Date field's value,
    //    placeholder, and aria-invalid attribute, and check for any helper/error text element in its container
    await calendarPage.gotoCalendar();

    // expect: The input's value is exactly an empty string
    await expect(calendarPage.basicDateInput).toHaveValue('');
    // expect: The placeholder reads exactly 'DD/MM/YYYY'
    await expect(calendarPage.basicDateInput).toHaveAttribute('placeholder', 'DD/MM/YYYY');
    // expect: aria-invalid is exactly 'false'
    await expect(calendarPage.basicDateInput).toHaveAttribute('aria-invalid', 'false');
    // expect: No paragraph/helper-text element of any kind exists inside the Basic Date field's container
    await expect(calendarPage.page.getByTestId('basic-date').locator('p')).toHaveCount(0);
  });

  test('Start Date and End Date fields are both empty by default with their documented placeholder helper text', async () => {
    // 1. Navigate to '/components/calendar'. Without interacting, read the Start Date and End Date inputs'
    //    values and their associated helper-text paragraphs
    await calendarPage.gotoCalendar();

    // expect: Both inputs' values are exactly an empty string, both placeholders read exactly 'DD/MM/YYYY'
    await expect(calendarPage.startDateInput).toHaveValue('');
    await expect(calendarPage.startDateInput).toHaveAttribute('placeholder', 'DD/MM/YYYY');
    await expect(calendarPage.endDateInput).toHaveValue('');
    await expect(calendarPage.endDateInput).toHaveAttribute('placeholder', 'DD/MM/YYYY');
    // expect: The Start Date helper text reads exactly 'Please select a start date'
    await expect(calendarPage.startDateHelperText).toHaveText('Please select a start date');
    // expect: The End Date helper text reads exactly 'Please select an end date'
    await expect(calendarPage.endDateHelperText).toHaveText('Please select an end date');
    // expect: Both 'Choose date' trigger buttons have the accessible name exactly 'Choose date'
    //         (not yet suffixed with a selected-date description)
    await expect(calendarPage.startDateChooseButton).toHaveAccessibleName('Choose date');
    await expect(calendarPage.endDateChooseButton).toHaveAccessibleName('Choose date');
  });

  test("The Select Time field is empty by default with NO 'Selected Time' paragraph present in the DOM at all", async () => {
    // 1. Navigate to '/components/calendar'. Without interacting, read the Select Time input's value and
    //    search the page for any element containing the text 'Selected Time:'
    await calendarPage.gotoCalendar();

    // expect: The input's value is exactly an empty string, placeholder reads exactly 'hh:mm'
    await expect(calendarPage.timeInput).toHaveValue('');
    await expect(calendarPage.timeInput).toHaveAttribute('placeholder', 'hh:mm');
    // expect: Zero elements matching text 'Selected Time:' exist anywhere in the DOM (the paragraph is
    //         entirely absent, not merely empty or hidden), confirming this differs from the Start/End
    //         Date fields which always render a default helper-text paragraph even before any selection
    await expect(calendarPage.selectedTimeText).toHaveCount(0);
    // expect: The 'Choose time' trigger button has the accessible name exactly 'Choose time'
    await expect(calendarPage.timeChooseButton).toHaveAccessibleName('Choose time');
  });
});
