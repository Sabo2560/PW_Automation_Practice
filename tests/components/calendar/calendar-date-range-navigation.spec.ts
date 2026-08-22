// spec: specs/calendar.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { CalendarPage } from '../../pages/CalendarPage';

test.describe('Calendar - Date Range Month Navigation and Year View', () => {
  let calendarPage: CalendarPage;

  test.beforeEach(async ({ page }) => {
    calendarPage = new CalendarPage(page);
    await calendarPage.gotoCalendar();
  });

  test('Previous month is disabled at the current month on a fresh load for both Start and End Date pickers', async () => {
    // 1. Open the Start Date popup and inspect the 'Previous month' button's disabled state, then close it
    //    and repeat for the End Date popup
    const startDialog = calendarPage.startDateDialog();
    await calendarPage.openDialog(calendarPage.startDateChooseButton, startDialog);

    // expect: 'Previous month' has the disabled attribute in the Start Date popup
    await expect(calendarPage.previousMonthButton(startDialog)).toBeDisabled();

    await calendarPage.page.keyboard.press('Escape');
    await expect(startDialog).not.toBeVisible();

    const endDialog = calendarPage.endDateDialog();
    await calendarPage.openDialog(calendarPage.endDateChooseButton, endDialog);

    // expect: 'Previous month' has the disabled attribute in the End Date popup too, since the current
    //         (today's) month is the earliest reachable month under the min-today floor
    await expect(calendarPage.previousMonthButton(endDialog)).toBeDisabled();
  });

  test('Next month is enabled and navigates forward with no short-term artificial cap', async () => {
    // 1. Open the Start Date popup and click 'Next month' 12 times in a row, recording the header label
    //    after each click
    const dialog = calendarPage.startDateDialog();
    await calendarPage.openDialog(calendarPage.startDateChooseButton, dialog);

    const header = calendarPage.calendarHeaderLabel(dialog);
    const startingLabel = (await header.textContent())?.trim() ?? '';
    const startingDate = new Date(`1 ${startingLabel}`);

    for (let i = 1; i <= 12; i++) {
      // expect: 'Next month' remains enabled (not disabled) throughout all 12 clicks
      await expect(calendarPage.nextMonthButton(dialog)).toBeEnabled();
      await calendarPage.nextMonthButton(dialog).click();

      // MUI's month-transition animation briefly keeps both the outgoing and incoming header labels
      // mounted at once — wait for exactly one to remain before reading its text, otherwise the
      // locator can transiently resolve to two elements (confirmed live: a strict-mode violation).
      await expect(header).toHaveCount(1);

      // expect: The header label advances by exactly one calendar month with each click
      const expectedDate = new Date(startingDate.getFullYear(), startingDate.getMonth() + i, 1);
      const expectedLabel = expectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      await expect(header).toHaveText(expectedLabel);
    }
  });

  test('Next month becomes disabled once navigation reaches December 2099, the library\'s confirmed far-future maximum', async () => {
    test.setTimeout(120000);

    // 1. Select a baseline date via the picker (today), then use the year-view's confirmed
    //    commit-on-click behavior to jump straight to 2099 in ~1 click instead of clicking 'Next month'
    //    ~880 times — the latter was confirmed live to occasionally hang WebKit's actionability check
    //    when MUI's month-transition animation is outrun by rapid clicks, even with a per-click delay.
    //    Jumping via year-view sidesteps that entirely while still reaching the same target month.
    const dialog = calendarPage.startDateDialog();
    await calendarPage.selectDateViaPicker(calendarPage.startDateChooseButton, dialog, calendarPage.getOffsetDate(0));

    await calendarPage.openDialog(calendarPage.startDateChooseButton, dialog);
    await calendarPage.yearViewSwitchButton(dialog).click();
    await calendarPage.yearRadio(dialog, 2099).click();

    // 2. From 2099 (whatever month today's date landed on), click 'Next month' the small remaining
    //    number of times needed to reach December — at most 11, never the ~880 the brute-force
    //    approach required.
    const nextButton = calendarPage.nextMonthButton(dialog);
    const header = calendarPage.calendarHeaderLabel(dialog);

    let reachedDisabled = false;
    for (let i = 0; i < 15; i++) {
      if (await nextButton.isDisabled()) {
        reachedDisabled = true;
        break;
      }
      await nextButton.click();
      await expect(header).toHaveCount(1);
    }

    // expect: 'Next month' eventually becomes disabled (real HTML disabled attribute)
    expect(reachedDisabled).toBe(true);
    await expect(nextButton).toBeDisabled();
    // expect: The header label at the point it becomes disabled reads exactly 'December 2099' —
    //         confirming this is MUI X Date Pickers' own library-default maximum date, not a custom
    //         app-level restriction
    await expect(header).toHaveText('December 2099');
  });

  test('[QUIRK, Critical] Selecting a year in year-view immediately commits a new selected date, not merely a navigation step', async () => {
    // 1. Select an End Date of today (via the picker, to establish a known baseline value and its
    //    day-of-month). Reopen the End Date popup, click the 'switch to year view' button, then click the
    //    year radio for (current year + 1)
    const dialog = calendarPage.endDateDialog();
    const today = calendarPage.getOffsetDate(0);
    await calendarPage.selectDateViaPicker(calendarPage.endDateChooseButton, dialog, today);

    await calendarPage.openDialog(calendarPage.endDateChooseButton, dialog);
    await calendarPage.yearViewSwitchButton(dialog).click();

    const nextYear = today.getFullYear() + 1;
    await calendarPage.yearRadio(dialog, nextYear).click();

    const expectedDate = new Date(nextYear, today.getMonth(), today.getDate());
    const expectedDDMMYYYY = [
      String(expectedDate.getDate()).padStart(2, '0'),
      String(expectedDate.getMonth() + 1).padStart(2, '0'),
      String(expectedDate.getFullYear()),
    ].join('/');

    // expect: Immediately after clicking the year radio — BEFORE clicking any day cell — the End Date
    //         input's value updates to today's same day-of-month/month but in (current year + 1)
    await expect(calendarPage.endDateInput).toHaveValue(expectedDDMMYYYY);
    // expect: The End Date helper text updates to 'Selected: ' + that new date's toDateString()
    await expect(calendarPage.endDateHelperText).toHaveText(`Selected: ${expectedDate.toDateString()}`);
    // expect: The popup remains open afterward, now showing the day-grid view for the newly selected year
    //         (not closed, and not still showing the year-view radiogroup)
    await expect(dialog).toBeVisible();
    await expect(calendarPage.dayCell(dialog, expectedDate.getDate())).toBeVisible();

    // 2. Without clicking any further day cell, dismiss the popup by pressing Escape
    await calendarPage.page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    // expect: The End Date input's value remains exactly the (current year + 1) date set by the
    //         year-radio click alone — confirming the year selection alone was a fully committed value
    //         change, not merely a pending navigation state that required an additional day-cell click
    await expect(calendarPage.endDateInput).toHaveValue(expectedDDMMYYYY);
  });

  test('Year view offers exactly the years from the current year through 2099', async () => {
    // 1. Open the Start Date popup, click 'switch to year view', and enumerate every year radio's
    //    accessible name
    const dialog = calendarPage.startDateDialog();
    await calendarPage.openDialog(calendarPage.startDateChooseButton, dialog);
    await calendarPage.yearViewSwitchButton(dialog).click();
    // The year-view's radiogroup mounts asynchronously after the switch-view click; wait for at least
    // one radio to actually appear (confirmed live: enumerating immediately raced ahead of this on
    // Firefox, briefly reading zero elements) before reading the full set.
    await expect(dialog.getByRole('radio').first()).toBeVisible();

    const currentYear = new Date().getFullYear();
    const expectedYears = [];
    for (let year = currentYear; year <= 2099; year++) {
      expectedYears.push(String(year));
    }

    // expect: The full set of year radio accessible names equals exactly every integer year from the
    //         current calendar year through 2099 inclusive, with no gaps and no years outside that range
    await expect(dialog.getByRole('radio')).toHaveText(expectedYears);
  });
});
