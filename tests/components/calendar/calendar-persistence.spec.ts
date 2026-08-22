// spec: specs/calendar.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { CalendarPage } from '../../pages/CalendarPage';

test.describe('Calendar - Reload Persistence', () => {
  let calendarPage: CalendarPage;

  test.beforeEach(async ({ page }) => {
    calendarPage = new CalendarPage(page);
    await calendarPage.gotoCalendar();
  });

  test('No state persists across a page reload; all three widgets reset to their documented fresh-load defaults', async ({ page }) => {
    // 1. Set the Basic Date field to a dynamically-computed date via typing, select Start Date =
    // today and End Date = today+5 via the picker, and set the Select Time field to 14:35 via the
    // picker.
    const basicDate = calendarPage.getDateOffsetDDMMYYYY(1);
    await calendarPage.basicDateInput.click();
    await calendarPage.basicDateInput.pressSequentially(basicDate);

    const startDialog = calendarPage.startDateDialog();
    await calendarPage.selectDateViaPicker(calendarPage.startDateChooseButton, startDialog, calendarPage.getOffsetDate(0));
    const endDialog = calendarPage.endDateDialog();
    await calendarPage.selectDateViaPicker(calendarPage.endDateChooseButton, endDialog, calendarPage.getOffsetDate(5));

    const timeDialog = await calendarPage.openTimeDialog();
    await calendarPage.selectTime(timeDialog, 14, 35);

    // expect: Before reload: all three widgets reflect the just-performed non-default interactions
    // (Basic Date has a value, Start/End Date both show 'Selected: ...' helper text, Select Time
    // shows 'Selected Time: 14:35:00')
    await expect(calendarPage.basicDateInput).toHaveValue(basicDate);
    await expect(calendarPage.startDateInput).toHaveValue(calendarPage.getDateOffsetDDMMYYYY(0));
    await expect(calendarPage.endDateInput).toHaveValue(calendarPage.getDateOffsetDDMMYYYY(5));
    await expect(calendarPage.startDateHelperText).toHaveText(`Selected: ${calendarPage.getDateOffsetToDateString(0)}`);
    await expect(calendarPage.endDateHelperText).toHaveText(`Selected: ${calendarPage.getDateOffsetToDateString(5)}`);
    await expect(calendarPage.selectedTimeText).toHaveText('Selected Time: 14:35:00');

    // 2. Reload the page (page.reload()).
    await page.reload();

    // expect: The Basic Date field's value is exactly an empty string again
    await expect(calendarPage.basicDateInput).toHaveValue('');
    // expect: The Start Date and End Date inputs are both empty again, with helper text reverted to
    // exactly 'Please select a start date' / 'Please select an end date', and both 'Choose date'
    // buttons reverted to the plain accessible name 'Choose date'
    await expect(calendarPage.startDateInput).toHaveValue('');
    await expect(calendarPage.endDateInput).toHaveValue('');
    await expect(calendarPage.startDateHelperText).toHaveText('Please select a start date');
    await expect(calendarPage.endDateHelperText).toHaveText('Please select an end date');
    await expect(calendarPage.startDateChooseButton).toHaveAccessibleName('Choose date');
    await expect(calendarPage.endDateChooseButton).toHaveAccessibleName('Choose date');
    // expect: The Select Time input is empty again, and zero elements matching text 'Selected Time:'
    // exist in the DOM (the paragraph is entirely absent again, not merely cleared) — confirming no
    // localStorage/sessionStorage/URL state is involved anywhere on this page for any of the three
    // widgets
    await expect(calendarPage.timeInput).toHaveValue('');
    await expect(calendarPage.selectedTimeText).toHaveCount(0);
  });
});
