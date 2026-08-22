// spec: specs/calendar.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { CalendarPage } from '../../pages/CalendarPage';

test.describe('Calendar - Date Range Keyboard Interaction', () => {
  let calendarPage: CalendarPage;

  test.beforeEach(async ({ page }) => {
    calendarPage = new CalendarPage(page);
    await calendarPage.gotoCalendar();
  });

  test('ArrowRight moves focus without changing the selection; Enter then commits the newly focused day and closes the popup', async () => {
    // 1. Select Start Date = today via the picker (mouse click). Reopen the Start Date popup
    //    (today's cell is focused by default) and press 'ArrowRight'
    const dialog = calendarPage.startDateDialog();
    const today = calendarPage.getOffsetDate(0);
    await calendarPage.selectDateViaPicker(calendarPage.startDateChooseButton, dialog, today);

    await calendarPage.openDialog(calendarPage.startDateChooseButton, dialog);

    const todayCell = calendarPage.dayCell(dialog, today.getDate());
    const tomorrowDate = calendarPage.getOffsetDate(1);
    const tomorrowCell = calendarPage.dayCell(dialog, tomorrowDate.getDate());

    await calendarPage.page.keyboard.press('ArrowRight');

    // expect: Today's cell (the original selection) still shows aria-selected='true' and its value
    //         in the input has NOT changed yet
    await expect(todayCell).toHaveAttribute('aria-selected', 'true');
    await expect(calendarPage.startDateInput).toHaveValue(calendarPage.getDateOffsetDDMMYYYY(0));
    // expect: The cell for (today+1) now carries the focus, while its aria-selected remains 'false'
    await expect(tomorrowCell).toBeFocused();
    await expect(tomorrowCell).toHaveAttribute('aria-selected', 'false');

    // 2. Press 'Enter'
    await calendarPage.page.keyboard.press('Enter');

    // expect: The Start Date input's value updates to exactly (today+1) formatted DD/MM/YYYY
    await expect(calendarPage.startDateInput).toHaveValue(calendarPage.getDateOffsetDDMMYYYY(1));
    // expect: The Start Date helper text updates to 'Selected: ' + (today+1).toDateString()
    await expect(calendarPage.startDateHelperText).toHaveText(`Selected: ${calendarPage.getDateOffsetToDateString(1)}`);
    // expect: The popup closes automatically after Enter, with no further click required
    await expect(dialog).not.toBeVisible();
  });

  test('ArrowLeft moves focus to the previous day cell', async () => {
    // 1. Select Start Date = today+2 (computed dynamically) via the picker. Reopen the Start Date
    //    popup and press 'ArrowLeft'
    const dialog = calendarPage.startDateDialog();
    const targetDate = calendarPage.getOffsetDate(2);
    await calendarPage.selectDateViaPicker(calendarPage.startDateChooseButton, dialog, targetDate);

    await calendarPage.openDialog(calendarPage.startDateChooseButton, dialog);

    const dayPlus2Cell = calendarPage.dayCell(dialog, targetDate.getDate());
    const dayPlus1Date = calendarPage.getOffsetDate(1);
    const dayPlus1Cell = calendarPage.dayCell(dialog, dayPlus1Date.getDate());

    await calendarPage.page.keyboard.press('ArrowLeft');

    // expect: The cell for (today+1) becomes the focused cell in the grid, while (today+2)'s cell
    //         remains the aria-selected='true' cell and the input value remains unchanged
    await expect(dayPlus1Cell).toBeFocused();
    await expect(dayPlus2Cell).toHaveAttribute('aria-selected', 'true');
    await expect(calendarPage.startDateInput).toHaveValue(calendarPage.getDateOffsetDDMMYYYY(2));

    // 2. Press 'Enter' to commit the newly focused day
    await calendarPage.page.keyboard.press('Enter');

    // expect: The Start Date input's value updates to exactly (today+1) formatted DD/MM/YYYY, confirming
    //         ArrowLeft moved focus one day earlier and Enter committed it
    await expect(calendarPage.startDateInput).toHaveValue(calendarPage.getDateOffsetDDMMYYYY(1));
  });
});
