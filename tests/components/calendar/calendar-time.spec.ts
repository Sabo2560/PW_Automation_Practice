// spec: specs/calendar.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { CalendarPage } from '../../pages/CalendarPage';

test.describe('Calendar - Time Picker', () => {
  let calendarPage: CalendarPage;

  test.beforeEach(async ({ page }) => {
    calendarPage = new CalendarPage(page);
    await calendarPage.gotoCalendar();
  });

  test('Selecting 14 hours then 35 minutes matches the exercise\'s exact stated goal of 14:35', async () => {
    // 1. Navigate to '/components/calendar'. Open the Select Time popup, click the '14 hours' option,
    // then click the '35 minutes' option.
    const dialog = await calendarPage.openTimeDialog();
    await calendarPage.hourOption(dialog, 14).click();

    // expect: After clicking '14 hours': the Select Time input's value reads exactly '14:00' (minutes
    // defaulted)
    await expect(calendarPage.timeInput).toHaveValue('14:00');

    // A brief settle pause before the minute click avoids a confirmed Firefox race: the listbox
    // re-renders again after the input's value update lands, and clicking too soon after that
    // assertion can land mid-re-render, silently dropping the click.
    await calendarPage.page.waitForTimeout(150);
    await calendarPage.minuteOption(dialog, 35).click();

    // expect: After clicking '35 minutes': the Select Time input's value reads exactly '14:35'
    await expect(calendarPage.timeInput).toHaveValue('14:35');
    // expect: The 'Selected Time:' paragraph reads exactly 'Selected Time: 14:35:00' — matching the
    // exercise's literal stated goal of setting the time to 14:35
    await expect(calendarPage.selectedTimeText).toHaveText('Selected Time: 14:35:00');
  });

  test('Selecting only an hour immediately updates the display with minutes defaulted to 00, without closing the popup', async () => {
    // 1. Navigate to '/components/calendar'. Open the Select Time popup and click the '09 hours' option
    // only (do not click any minute option yet).
    const dialog = await calendarPage.openTimeDialog();
    await calendarPage.hourOption(dialog, 9).click();

    // expect: The Select Time input's value updates immediately to exactly '09:00'
    await expect(calendarPage.timeInput).toHaveValue('09:00');
    // expect: The 'Selected Time:' paragraph reads exactly 'Selected Time: 09:00:00'
    await expect(calendarPage.selectedTimeText).toHaveText('Selected Time: 09:00:00');
    // expect: The dialog with role=dialog name='Select Time' is STILL present/visible in the DOM
    // immediately after this single click, confirming selecting only an hour does not auto-close the
    // popup
    await expect(dialog).toBeVisible();
  });

  test('Selecting a minute closes the popup automatically with no separate confirm step required', async () => {
    // 1. Navigate to '/components/calendar'. Open the Select Time popup, click '09 hours', then click
    // '20 minutes'.
    const dialog = await calendarPage.openTimeDialog();
    await calendarPage.selectTime(dialog, 9, 20);

    // expect: Immediately after the '20 minutes' click, the dialog with role=dialog name='Select Time'
    // is no longer present in the DOM — no click on a separate 'OK' button was required to dismiss it
    await expect(dialog).not.toBeVisible();
    // expect: The Select Time input's value reads exactly '09:20'
    await expect(calendarPage.timeInput).toHaveValue('09:20');
  });

  test('The minutes listbox offers exactly 12 five-minute-increment options while the hours listbox offers all 24 unrestricted hours', async () => {
    // 1. Navigate to '/components/calendar'. Open the Select Time popup and enumerate every option's
    // accessible name in both the 'Select hours' and 'Select minutes' listboxes.
    const dialog = await calendarPage.openTimeDialog();

    const hoursListbox = dialog.getByRole('listbox', { name: 'Select hours' });
    const minutesListbox = dialog.getByRole('listbox', { name: 'Select minutes' });

    // expect: The 'Select hours' listbox contains exactly 24 options with accessible names '0 hours'
    // through '23 hours' (every hour 00-23 represented, no restriction)
    await expect(hoursListbox.getByRole('option')).toHaveCount(24);
    for (let hour = 0; hour < 24; hour++) {
      await expect(calendarPage.hourOption(dialog, hour)).toBeVisible();
    }

    // expect: The 'Select minutes' listbox contains exactly 12 options with accessible names
    // '0 minutes', '5 minutes', '10 minutes', ..., '55 minutes' — every value is a multiple of 5, with
    // no options for any other minute value
    await expect(minutesListbox.getByRole('option')).toHaveCount(12);
    for (let minute = 0; minute < 60; minute += 5) {
      await expect(calendarPage.minuteOption(dialog, minute)).toBeVisible();
    }
  });

  test("Manually typing a time directly into the input bypasses the picker's 5-minute-increment restriction", async () => {
    // 1. Navigate to '/components/calendar'. Click the Select Time textbox directly (without opening the
    // picker popup) and type '14:37' character by character (37 is a minute value never offered by the
    // minutes listbox).
    await calendarPage.timeInput.click();
    await calendarPage.timeInput.pressSequentially('14:37');

    // expect: The Select Time input's value equals exactly '14:37'
    await expect(calendarPage.timeInput).toHaveValue('14:37');
    // expect: The 'Selected Time:' paragraph reads exactly 'Selected Time: 14:37:00'
    await expect(calendarPage.selectedTimeText).toHaveText('Selected Time: 14:37:00');
    // expect: aria-invalid on the input is exactly 'false' — confirming the 5-minute-increment
    // restriction is a picker-UI-only convenience, not a rule enforced on the underlying value
    await expect(calendarPage.timeInput).toHaveAttribute('aria-invalid', 'false');
  });
});
