// spec: specs/calendar.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { CalendarPage } from '../../pages/CalendarPage';

test.describe('Calendar - Invalid Date Range Validation (Typed Values)', () => {
  let calendarPage: CalendarPage;

  test.beforeEach(async ({ page }) => {
    calendarPage = new CalendarPage(page);
  });

  test('[Critical negative path] Typing an End Date earlier than the selected Start Date marks BOTH fields aria-invalid, without changing either helper text\'s content', async () => {
    // 1. Navigate to '/components/calendar'. Select Start Date = today+10 (computed dynamically) via
    // the picker. Then click the End Date textbox, select all, and type today+1 (a date clearly
    // earlier than the Start Date) directly, bypassing the picker's disabled-cell prevention.
    await calendarPage.gotoCalendar();
    const startDialog = calendarPage.startDateDialog();
    await calendarPage.selectDateViaPicker(calendarPage.startDateChooseButton, startDialog, calendarPage.getOffsetDate(10));

    const endDateEarlierThanStart = calendarPage.getDateOffsetDDMMYYYY(1);
    await calendarPage.endDateInput.click();
    await calendarPage.page.keyboard.press('Control+a');
    await calendarPage.endDateInput.pressSequentially(endDateEarlierThanStart);

    // expect: The End Date input's value equals exactly the typed today+1 string (the typed value IS
    // accepted, not rejected outright)
    await expect(calendarPage.endDateInput).toHaveValue(endDateEarlierThanStart);
    // expect: aria-invalid on the Start Date input is exactly 'true'
    await expect(calendarPage.startDateInput).toHaveAttribute('aria-invalid', 'true');
    // expect: aria-invalid on the End Date input is exactly 'true'
    await expect(calendarPage.endDateInput).toHaveAttribute('aria-invalid', 'true');
    // expect: The Start Date helper text still reads exactly 'Selected: ' + Start Date's toDateString()
    // (unchanged content, not replaced by an error message)
    await expect(calendarPage.startDateHelperText).toHaveText(`Selected: ${calendarPage.getDateOffsetToDateString(10)}`);
    // expect: The End Date helper text still reads exactly 'Selected: ' + End Date's toDateString()
    // (unchanged content)
    await expect(calendarPage.endDateHelperText).toHaveText(`Selected: ${calendarPage.getDateOffsetToDateString(1)}`);
    // expect: Both helper-text paragraphs gain the 'Mui-error' CSS class
    await expect(calendarPage.startDateHelperText).toHaveClass(/Mui-error/);
    await expect(calendarPage.endDateHelperText).toHaveClass(/Mui-error/);
  });

  test('Typing a past Start Date directly marks only that field aria-invalid, confirming the min-today rule applies to typed input too', async () => {
    // 1. Navigate to '/components/calendar'. Click the Start Date textbox and type a date clearly
    // before today (computed dynamically as today minus 30 days).
    await calendarPage.gotoCalendar();
    const pastStartDate = calendarPage.getDateOffsetDDMMYYYY(-30);
    await calendarPage.startDateInput.click();
    await calendarPage.startDateInput.pressSequentially(pastStartDate);

    // expect: The Start Date input's value equals exactly the typed past-date string
    await expect(calendarPage.startDateInput).toHaveValue(pastStartDate);
    // expect: aria-invalid on the Start Date input is exactly 'true' — confirming the min-today
    // constraint is enforced against typed input, not merely against the picker's disabled cells (a
    // direct, confirmed contrast with the Basic Date field's total lack of restriction)
    await expect(calendarPage.startDateInput).toHaveAttribute('aria-invalid', 'true');
  });

  test('Fixing an invalid range by typing a valid later End Date clears aria-invalid on both fields', async () => {
    // 1. Navigate to '/components/calendar'. Reproduce the invalid-range state from scenario 5.1
    // (Start = today+10, End typed as today+1, both aria-invalid='true'). Then click the End Date
    // textbox, select all, and type a valid later date (today+15, computed dynamically).
    await calendarPage.gotoCalendar();
    const startDialog = calendarPage.startDateDialog();
    await calendarPage.selectDateViaPicker(calendarPage.startDateChooseButton, startDialog, calendarPage.getOffsetDate(10));

    const endDateEarlierThanStart = calendarPage.getDateOffsetDDMMYYYY(1);
    await calendarPage.endDateInput.click();
    await calendarPage.page.keyboard.press('Control+a');
    await calendarPage.endDateInput.pressSequentially(endDateEarlierThanStart);
    await expect(calendarPage.startDateInput).toHaveAttribute('aria-invalid', 'true');
    await expect(calendarPage.endDateInput).toHaveAttribute('aria-invalid', 'true');

    const validLaterEndDate = calendarPage.getDateOffsetDDMMYYYY(15);
    await calendarPage.endDateInput.click();
    await calendarPage.page.keyboard.press('Control+a');
    await calendarPage.endDateInput.pressSequentially(validLaterEndDate);

    // expect: The End Date input's value equals exactly the newly-typed today+15 string
    await expect(calendarPage.endDateInput).toHaveValue(validLaterEndDate);
    // expect: aria-invalid on the End Date input is exactly 'false'
    await expect(calendarPage.endDateInput).toHaveAttribute('aria-invalid', 'false');
    // expect: aria-invalid on the Start Date input is exactly 'false' — confirming the cross-field
    // error state clears symmetrically on both fields once the range becomes valid again
    await expect(calendarPage.startDateInput).toHaveAttribute('aria-invalid', 'false');
  });
});
