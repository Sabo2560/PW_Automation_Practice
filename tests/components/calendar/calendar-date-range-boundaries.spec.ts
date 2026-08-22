// spec: specs/calendar.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { CalendarPage } from '../../pages/CalendarPage';

test.describe('Calendar - Date Range Min/Max Boundaries and Disabled Dates', () => {
  let calendarPage: CalendarPage;

  test.beforeEach(async ({ page }) => {
    calendarPage = new CalendarPage(page);
  });

  test("Start Date's calendar disables every day before today on a fresh load", async () => {
    // 1. Navigate to '/components/calendar' on a fresh context. Open the Start Date popup and
    // inspect the disabled attribute of every day cell in the currently-displayed (today's) month.
    await calendarPage.gotoCalendar();
    const dialog = calendarPage.startDateDialog();
    await calendarPage.openDialog(calendarPage.startDateChooseButton, dialog);

    const today = calendarPage.getOffsetDate(0);
    const todayDayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    // expect: Every day cell numbered less than today's day-of-month has the real HTML 'disabled'
    // attribute present
    for (let day = 1; day < todayDayOfMonth; day++) {
      await expect(calendarPage.dayCell(dialog, day)).toBeDisabled();
    }
    // expect: Today's own cell and every day cell after it in the current month do NOT have the
    // disabled attribute (are clickable)
    for (let day = todayDayOfMonth; day <= daysInMonth; day++) {
      await expect(calendarPage.dayCell(dialog, day)).toBeEnabled();
    }
    // expect: The 'Previous month' navigation button is disabled (real HTML disabled attribute)
    await expect(calendarPage.previousMonthButton(dialog)).toBeDisabled();
  });

  test("End Date's calendar independently disables every day before today, before any Start Date is set", async () => {
    // 1. Navigate to '/components/calendar' on a fresh context (Start Date left unset). Open the
    // End Date popup directly and inspect the disabled attribute of every day cell in the
    // currently-displayed month.
    await calendarPage.gotoCalendar();
    const dialog = calendarPage.endDateDialog();
    await calendarPage.openDialog(calendarPage.endDateChooseButton, dialog);

    const today = calendarPage.getOffsetDate(0);
    const todayDayOfMonth = today.getDate();

    // expect: Every day cell numbered less than today's day-of-month has the disabled attribute
    // present, identical to the Start Date picker's own independent default floor of today
    for (let day = 1; day < todayDayOfMonth; day++) {
      await expect(calendarPage.dayCell(dialog, day)).toBeDisabled();
    }
    // expect: 'Previous month' is disabled for the same reason
    await expect(calendarPage.previousMonthButton(dialog)).toBeDisabled();
  });

  test("Once Start Date is selected, End Date's calendar dynamically raises its minimum to that Start Date value", async () => {
    // 1. Navigate to '/components/calendar'. Select a Start Date 3 days after today (computed
    // dynamically) via the picker. Then open the End Date popup and inspect the disabled state of
    // the day cells between today and the new Start Date.
    await calendarPage.gotoCalendar();
    const startDialog = calendarPage.startDateDialog();
    const startTarget = calendarPage.getOffsetDate(3);
    await calendarPage.selectDateViaPicker(calendarPage.startDateChooseButton, startDialog, startTarget);

    const endDialog = calendarPage.endDateDialog();
    await calendarPage.openDialog(calendarPage.endDateChooseButton, endDialog);

    // The End Date popup's default view is today's month. If the dynamically-computed today+3
    // crossed into a later month, advance the displayed month to match before inspecting cells.
    await calendarPage.navigateToMonth(endDialog, startTarget);

    const today = calendarPage.getOffsetDate(0);
    const sameMonth = startTarget.getMonth() === today.getMonth() && startTarget.getFullYear() === today.getFullYear();
    const firstDayToCheck = sameMonth ? today.getDate() : 1;

    // expect: Every day cell strictly between today and (today+3), inclusive of today, exclusive of
    // the new Start Date itself, is now ALSO disabled in the End Date popup, in addition to the
    // original before-today days — confirming End Date's floor dynamically tracks the selected
    // Start Date, not merely today.
    for (let day = firstDayToCheck; day < startTarget.getDate(); day++) {
      await expect(calendarPage.dayCell(endDialog, day)).toBeDisabled();
    }
    // The newly-selected Start Date's own day remains the new, enabled floor.
    await expect(calendarPage.dayCell(endDialog, startTarget.getDate())).toBeEnabled();
  });

  test("Once End Date is selected, Start Date's calendar dynamically caps its maximum to that End Date value", async () => {
    // 1. Navigate to '/components/calendar'. Select an End Date 3 days after today (computed
    // dynamically) via the picker (leave Start Date unset or set to today). Then open the Start
    // Date popup and inspect day cells after the selected End Date within the same displayed
    // month, plus the 'Next month' button.
    await calendarPage.gotoCalendar();
    const endDialog = calendarPage.endDateDialog();
    const endTarget = calendarPage.getOffsetDate(3);
    await calendarPage.selectDateViaPicker(calendarPage.endDateChooseButton, endDialog, endTarget);

    const startDialog = calendarPage.startDateDialog();
    await calendarPage.openDialog(calendarPage.startDateChooseButton, startDialog);

    // The Start Date popup's default view is today's month. If the dynamically-computed today+3
    // crossed into a later month, advance the displayed month to match before inspecting cells.
    await calendarPage.navigateToMonth(startDialog, endTarget);

    const daysInDisplayedMonth = new Date(endTarget.getFullYear(), endTarget.getMonth() + 1, 0).getDate();

    // expect: Every day cell after the selected End Date (within the currently-displayed month) is
    // disabled
    for (let day = endTarget.getDate() + 1; day <= daysInDisplayedMonth; day++) {
      await expect(calendarPage.dayCell(startDialog, day)).toBeDisabled();
    }
    // The End Date's own day remains the new, enabled ceiling.
    await expect(calendarPage.dayCell(startDialog, endTarget.getDate())).toBeEnabled();
    // expect: 'Next month' is disabled as well, since the entire remaining viable range collapses
    // to within the currently-displayed month
    await expect(calendarPage.nextMonthButton(startDialog)).toBeDisabled();
  });

  test("Attempting to interact with a disabled day cell has no effect on the field's value", async () => {
    // 1. Navigate to '/components/calendar'. Open the Start Date popup and attempt Playwright's
    // .click() on a disabled day cell from a past date.
    await calendarPage.gotoCalendar();
    const dialog = calendarPage.startDateDialog();
    await calendarPage.openDialog(calendarPage.startDateChooseButton, dialog);

    // Scenario 4.1 confirmed every day before today's day-of-month is disabled in the currently
    // displayed month, so day 1 is reliably disabled whenever today is not itself the 1st of the
    // month. Compute this live rather than hardcoding a fixed day number.
    const today = calendarPage.getOffsetDate(0);
    test.skip(today.getDate() === 1, 'No day before today exists in the current month when today is the 1st.');

    const disabledCell = calendarPage.dayCell(dialog, 1);
    await expect(disabledCell).toBeDisabled();
    await expect(calendarPage.startDateInput).toHaveValue('');

    // Playwright's actionability check refuses to dispatch a click on a genuinely disabled
    // element and waits for it to become actionable, so bound the attempt with a short timeout
    // instead of the default (the click is expected to never complete).
    await disabledCell.click({ timeout: 3000 }).catch(() => {});

    // expect: The click attempt on the disabled cell does not change the Start Date field's value
    // (it remains empty/unchanged from before the attempt), since Playwright's actionability check
    // refuses to interact with a genuinely disabled element
    await expect(calendarPage.startDateInput).toHaveValue('');
    await expect(dialog).toBeVisible();
  });
});
