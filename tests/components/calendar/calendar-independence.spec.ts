// spec: specs/calendar.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { CalendarPage } from '../../pages/CalendarPage';

/**
 * Interacts broadly across all three calendar widgets — Basic Date (typed), Start/End Date range
 * (including an explicit month-navigation click and a year-view click, per the confirmed
 * "year-view commits a new date" quirk documented in specs/calendar.plan.md), and Select Time —
 * then triggers the one deterministic negative-path signal on this page (typing an End Date
 * earlier than the selected Start Date). Shared by the network-requests and console-errors
 * scenarios below, which both require the exact same broad interaction sequence per
 * specs/calendar.plan.md section 9.
 */
async function performBroadInteractionSequence(calendarPage: CalendarPage) {
  // Type into Basic Date.
  const basicDate = calendarPage.getDateOffsetDDMMYYYY(1);
  await calendarPage.basicDateInput.click();
  await calendarPage.basicDateInput.pressSequentially(basicDate);

  // Select Start Date via the picker, targeting the 1st of next month so a real month-navigation
  // click is always required, regardless of today's day-of-month. Routed through selectDateViaPicker
  // (not hand-rolled) since it already carries the MUI transition-animation synchronization waits —
  // hand-rolling this inline previously hit the day-grid's own version of that same quirk (a stale,
  // still-disabled "1" cell from the outgoing month resolving before the incoming month's grid settled).
  const startDialog = calendarPage.startDateDialog();
  const today = calendarPage.getOffsetDate(0);
  const startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  await calendarPage.selectDateViaPicker(calendarPage.startDateChooseButton, startDialog, startDate);

  // Select End Date via a year-view click (the confirmed "commits a new date" quirk) rather than a
  // day-cell click.
  const endDialog = calendarPage.endDateDialog();
  await calendarPage.openDialog(calendarPage.endDateChooseButton, endDialog);
  await calendarPage.yearViewSwitchButton(endDialog).click();
  const yearAfterStart = startDate.getFullYear() + 1;
  await calendarPage.yearRadio(endDialog, yearAfterStart).click();
  await calendarPage.page.keyboard.press('Escape');
  await expect(endDialog).not.toBeVisible();

  // Select a time via the picker.
  const timeDialog = await calendarPage.openTimeDialog();
  await calendarPage.selectTime(timeDialog, 14, 35);

  // Trigger the invalid-range typed scenario: type an End Date earlier than Start Date directly,
  // bypassing the picker's disabled-cell prevention.
  const earlierEndDate = calendarPage.getDateOffsetDDMMYYYY(3);
  await calendarPage.endDateInput.click();
  await calendarPage.page.keyboard.press('Control+a');
  await calendarPage.endDateInput.pressSequentially(earlierEndDate);
}

test.describe('Calendar - Cross-Widget Independence and Network/Console Behavior', () => {
  let calendarPage: CalendarPage;

  test.beforeEach(async ({ page }) => {
    calendarPage = new CalendarPage(page);
    await calendarPage.gotoCalendar();
  });

  test('Interacting with the Basic Date, Date Range, and Time widgets produces zero cross-contamination between them', async () => {
    // 1. Set the Basic Date field to a dynamically-computed date via typing. Record the Start/End Date
    // fields' and Select Time field's current state (all still default/empty).
    const basicDate = calendarPage.getDateOffsetDDMMYYYY(1);
    await calendarPage.basicDateInput.click();
    await calendarPage.basicDateInput.pressSequentially(basicDate);

    // expect: Start Date, End Date, and Select Time all remain at their documented default empty
    // states, unaffected by the Basic Date field change
    await expect(calendarPage.startDateInput).toHaveValue('');
    await expect(calendarPage.endDateInput).toHaveValue('');
    await expect(calendarPage.timeInput).toHaveValue('');
    await expect(calendarPage.startDateHelperText).toHaveText('Please select a start date');
    await expect(calendarPage.endDateHelperText).toHaveText('Please select an end date');
    await expect(calendarPage.selectedTimeText).toHaveCount(0);

    // 2. Now select Start Date and End Date via the picker (today and today+5, computed dynamically),
    // and re-check the Basic Date field and Select Time field.
    const startDialog = calendarPage.startDateDialog();
    await calendarPage.selectDateViaPicker(calendarPage.startDateChooseButton, startDialog, calendarPage.getOffsetDate(0));
    const endDialog = calendarPage.endDateDialog();
    await calendarPage.selectDateViaPicker(calendarPage.endDateChooseButton, endDialog, calendarPage.getOffsetDate(5));

    // expect: The Basic Date field's value is unchanged from what was set in the first step
    await expect(calendarPage.basicDateInput).toHaveValue(basicDate);
    // expect: The Select Time field remains empty with no 'Selected Time:' paragraph present,
    // unaffected by the date-range selections
    await expect(calendarPage.timeInput).toHaveValue('');
    await expect(calendarPage.selectedTimeText).toHaveCount(0);

    // 3. Finally set the Select Time field to 14:35 via the picker, and re-check the Basic Date field
    // and both Date Range fields.
    const timeDialog = await calendarPage.openTimeDialog();
    await calendarPage.selectTime(timeDialog, 14, 35);

    // expect: The Basic Date field's value is still unchanged
    await expect(calendarPage.basicDateInput).toHaveValue(basicDate);
    // expect: Start Date and End Date's values and helper texts are still exactly what was set in the
    // second step, confirming all three widgets remained fully independent throughout this entire
    // sequence
    await expect(calendarPage.startDateInput).toHaveValue(calendarPage.getDateOffsetDDMMYYYY(0));
    await expect(calendarPage.endDateInput).toHaveValue(calendarPage.getDateOffsetDDMMYYYY(5));
    await expect(calendarPage.startDateHelperText).toHaveText(`Selected: ${calendarPage.getDateOffsetToDateString(0)}`);
    await expect(calendarPage.endDateHelperText).toHaveText(`Selected: ${calendarPage.getDateOffsetToDateString(5)}`);
  });

  test('No API/network requests fire as a result of any calendar interaction (purely client-side component)', async () => {
    // 1. Begin recording network requests, then interact broadly across all three widgets (type into
    // Basic Date, select Start/End Date via the picker including a month-navigation click and a
    // year-view click, select a time via the picker, and trigger the invalid-range typed scenario by
    // typing an earlier End Date directly).
    const apiRequests = calendarPage.trackApiRequests('/components/calendar');

    await performBroadInteractionSequence(calendarPage);

    // expect: No XHR/fetch network request specific to any calendar action is observed (only the
    // pre-existing Next.js RSC prefetch requests for unrelated nav links, the same pattern documented
    // on every other component page in this suite) — confirming this plan requires no API-level test
    // coverage
    expect(apiRequests).toEqual([]);
  });

  test('No console errors are logged during extensive interaction across all three widgets', async () => {
    // 1. Begin tracking console errors, then perform the same broad interaction sequence as the
    // network-requests scenario (all three widgets, including the invalid-range and malformed-input
    // negative paths).
    const consoleErrors = calendarPage.trackConsoleErrors();

    await performBroadInteractionSequence(calendarPage);

    // expect: Zero console error messages are logged throughout the entire sequence of interactions,
    // matching the clean-console baseline observed live during this plan's exploration
    expect(consoleErrors).toEqual([]);
  });
});
