// spec: specs/calendar.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { CalendarPage } from '../../pages/CalendarPage';

test.describe('Calendar - Date Range Selection via Picker (Happy Path)', () => {
  let calendarPage: CalendarPage;

  test.beforeEach(async ({ page }) => {
    calendarPage = new CalendarPage(page);
  });

  test("Selecting Start Date = today and End Date = today+5 via the calendar popups matches the exercise's exact stated goal", async () => {
    // 1. Navigate to '/components/calendar'. Open the Start Date popup and click today's day cell
    // (the cell carrying aria-current='date').
    await calendarPage.gotoCalendar();
    const startDialog = calendarPage.startDateDialog();
    await calendarPage.selectDateViaPicker(calendarPage.startDateChooseButton, startDialog, calendarPage.getOffsetDate(0));

    // expect: The Start Date input's value equals exactly today's date formatted DD/MM/YYYY
    // (computed dynamically)
    await expect(calendarPage.startDateInput).toHaveValue(calendarPage.getTodayDDMMYYYY());
    // expect: The Start Date helper text equals exactly 'Selected: ' + today's Date.prototype.toDateString()
    // output (computed dynamically)
    await expect(calendarPage.startDateHelperText).toHaveText(`Selected: ${calendarPage.getTodayToDateString()}`);
    // expect: The popup closes automatically after the single click
    await expect(startDialog).not.toBeVisible();

    // 2. Open the End Date popup and click the day cell corresponding to today+5 days (computed
    // dynamically, navigating month if the +5 offset crosses a month boundary).
    const endDialog = calendarPage.endDateDialog();
    await calendarPage.selectDateViaPicker(calendarPage.endDateChooseButton, endDialog, calendarPage.getOffsetDate(5));

    // expect: The End Date input's value equals exactly (today+5 days) formatted DD/MM/YYYY
    await expect(calendarPage.endDateInput).toHaveValue(calendarPage.getDateOffsetDDMMYYYY(5));
    // expect: The End Date helper text equals exactly 'Selected: ' + (today+5 days).toDateString()
    await expect(calendarPage.endDateHelperText).toHaveText(`Selected: ${calendarPage.getDateOffsetToDateString(5)}`);
    // expect: The popup closes automatically after the single click
    await expect(endDialog).not.toBeVisible();
  });

  test('Clicking a day cell commits the selection and closes the popup in a single click, with no separate confirm step', async () => {
    // 1. Navigate to '/components/calendar'. Open the End Date popup (confirm it is visible via
    // role=dialog name='End Date'), then click a single enabled day cell.
    await calendarPage.gotoCalendar();
    const endDialog = calendarPage.endDateDialog();
    await calendarPage.openDialog(calendarPage.endDateChooseButton, endDialog);

    const today = calendarPage.getOffsetDate(0);
    await calendarPage.dayCell(endDialog, today.getDate()).click();

    // expect: Immediately after the single click, the dialog with role=dialog name='End Date' is no
    // longer present/visible in the DOM — no further click (e.g. an 'OK' button) was required to
    // commit or dismiss it
    await expect(endDialog).not.toBeVisible();
    // expect: The End Date input and helper text both reflect the clicked day
    await expect(calendarPage.endDateInput).toHaveValue(calendarPage.getTodayDDMMYYYY());
    await expect(calendarPage.endDateHelperText).toHaveText(`Selected: ${calendarPage.getTodayToDateString()}`);
  });

  test("[QUIRK] Today's cell is marked as 'today' but is NOT pre-selected on a fresh, nothing-yet-picked popup", async () => {
    // 1. Navigate to '/components/calendar' on a fresh context (Start Date not yet set). Open the
    // Start Date popup and, without clicking any day, inspect today's day cell's class list and
    // aria-selected attribute.
    await calendarPage.gotoCalendar();
    const startDialog = calendarPage.startDateDialog();
    await calendarPage.openDialog(calendarPage.startDateChooseButton, startDialog);

    const today = calendarPage.getOffsetDate(0);
    const todayCell = calendarPage.dayCell(startDialog, today.getDate());

    // expect: Today's cell's class list includes 'MuiPickersDay-today' and it carries aria-current='date'
    await expect(todayCell).toHaveClass(/MuiPickersDay-today/);
    await expect(todayCell).toHaveAttribute('aria-current', 'date');
    // expect: Today's cell's aria-selected attribute is exactly 'false' — confirming being 'today' is a
    // distinct visual/semantic marker, not an implicit pre-selection
    await expect(todayCell).toHaveAttribute('aria-selected', 'false');
  });
});
