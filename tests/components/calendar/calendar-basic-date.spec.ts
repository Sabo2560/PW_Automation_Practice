// spec: specs/calendar.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { CalendarPage } from '../../pages/CalendarPage';

test.describe('Calendar - Basic Date Field (Free-form, Unconstrained)', () => {
  let calendarPage: CalendarPage;

  test.beforeEach(async ({ page }) => {
    calendarPage = new CalendarPage(page);
  });

  test("Typing tomorrow's date (computed dynamically) into the Basic Date field sets the exact DD/MM/YYYY value with no validation error", async () => {
    // 1. Navigate to '/components/calendar'. Compute 'tomorrow' dynamically at test-run time (new Date()
    // + 1 day) and format it as DD/MM/YYYY with zero-padding. Click the Basic Date field and type the
    // computed value.
    await calendarPage.gotoCalendar();
    const tomorrow = calendarPage.getDateOffsetDDMMYYYY(1);
    await calendarPage.basicDateInput.click();
    await calendarPage.basicDateInput.pressSequentially(tomorrow);

    // expect: The Basic Date input's value equals exactly the dynamically-computed DD/MM/YYYY string for
    // tomorrow (never a hardcoded date literal)
    await expect(calendarPage.basicDateInput).toHaveValue(tomorrow);
    // expect: aria-invalid on the input is exactly 'false' after typing
    await expect(calendarPage.basicDateInput).toHaveAttribute('aria-invalid', 'false');
  });

  test('Typing a clearly past date (computed dynamically, e.g. 10 years before today) into the Basic Date field is accepted with no restriction', async () => {
    // 1. Navigate to '/components/calendar'. Compute a date 10 years before today dynamically, format as
    // DD/MM/YYYY, type it into the Basic Date field.
    await calendarPage.gotoCalendar();
    const tenYearsAgo = calendarPage.getDateOffsetDDMMYYYY(-3650);
    await calendarPage.basicDateInput.click();
    await calendarPage.basicDateInput.pressSequentially(tenYearsAgo);

    // expect: The Basic Date input's value equals exactly the computed past-date string
    await expect(calendarPage.basicDateInput).toHaveValue(tenYearsAgo);
    // expect: aria-invalid remains exactly 'false' — confirming this field enforces no minimum-date
    // restriction at all, in direct contrast with the Start/End Date fields covered in a later suite
    await expect(calendarPage.basicDateInput).toHaveAttribute('aria-invalid', 'false');
  });

  test('Typing an impossible date (day 32, month 13) sets aria-invalid=true, with no visible error message text appearing anywhere near the field', async () => {
    // 1. Navigate to '/components/calendar'. Click the Basic Date field, select all, and type
    // '32/13/2026' character by character.
    await calendarPage.gotoCalendar();
    await calendarPage.basicDateInput.click();
    await calendarPage.page.keyboard.press('Control+a');
    await calendarPage.basicDateInput.pressSequentially('32/13/2026');

    // expect: aria-invalid on the input becomes exactly 'true'
    await expect(calendarPage.basicDateInput).toHaveAttribute('aria-invalid', 'true');
    // expect: The input's wrapper gains the 'Mui-error' CSS class
    const inputWrapper = calendarPage.page.getByTestId('basic-date').locator('.MuiInputBase-root');
    await expect(inputWrapper).toHaveClass(/Mui-error/);
    // expect: No visible error-message text element appears in the field's container at any point (search
    // confirms zero new text nodes beyond the input's own reformatted value) — confirming this field,
    // unlike Start/End Date, never surfaces a textual error message, only the aria-invalid attribute and
    // error styling
    await expect(calendarPage.page.getByTestId('basic-date').locator('p')).toHaveCount(0);
  });

  test('Retyping a valid date after an invalid one clears aria-invalid back to false', async () => {
    // 1. Navigate to '/components/calendar'. Type '32/13/2026' into the Basic Date field to reach the
    // invalid state (confirm aria-invalid='true'). Select all and retype a dynamically-computed valid
    // date (today's date, formatted DD/MM/YYYY).
    await calendarPage.gotoCalendar();
    await calendarPage.basicDateInput.click();
    await calendarPage.basicDateInput.pressSequentially('32/13/2026');

    // expect: Before the fix: aria-invalid is 'true'
    await expect(calendarPage.basicDateInput).toHaveAttribute('aria-invalid', 'true');

    const validDate = calendarPage.getTodayDDMMYYYY();
    await calendarPage.basicDateInput.click();
    await calendarPage.page.keyboard.press('Control+a');
    await calendarPage.basicDateInput.pressSequentially(validDate);

    // expect: After retyping a valid date: the input's value equals exactly the newly-typed valid date
    // string, and aria-invalid is exactly 'false' again, confirming a full round-trip
    await expect(calendarPage.basicDateInput).toHaveValue(validDate);
    await expect(calendarPage.basicDateInput).toHaveAttribute('aria-invalid', 'false');
  });
});
