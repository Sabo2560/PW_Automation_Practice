import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Page Object for the Calendar component (https://www.automationplayground.dev/components/calendar),
 * an MUI X Date/Time Pickers page presenting three independent exercises: a Basic Date field
 * (fully unconstrained), a Start/End Date range picker (min-today, cross-field constrained), and
 * a Time picker. Almost none of the interactive controls carry a custom `data-testid` — only the
 * Basic Date field's outer wrapper (`data-testid="basic-date"`) does — so controls are located
 * primarily via accessible role+name, per specs/calendar.plan.md's "Application Overview".
 */
export class CalendarPage extends BasePage {
  readonly basicDateInput: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly startDateChooseButton: Locator;
  readonly endDateChooseButton: Locator;
  readonly timeInput: Locator;
  readonly timeChooseButton: Locator;
  readonly startDateHelperText: Locator;
  readonly endDateHelperText: Locator;
  readonly selectedTimeText: Locator;

  constructor(page: Page) {
    super(page);
    this.basicDateInput = page.getByRole('textbox', { name: 'Basic date field' });
    // exact: true avoids substring ambiguity — 'Start Date'/'End Date' would otherwise also
    // match each other's accessible name via partial matching.
    this.startDateInput = page.getByRole('textbox', { name: 'Start Date', exact: true });
    this.endDateInput = page.getByRole('textbox', { name: 'End Date', exact: true });
    // Both buttons share the identical accessible name "Choose date" before any date is picked,
    // and the regex additionally matches the post-selection format
    // "Choose date, selected date is D MMM YYYY" (e.g. "Choose date, selected date is 21 Aug 2026").
    this.startDateChooseButton = page.getByRole('button', { name: /^Choose date/ }).first();
    this.endDateChooseButton = page.getByRole('button', { name: /^Choose date/ }).last();
    this.timeInput = page.getByRole('textbox', { name: 'Select Time' });
    this.timeChooseButton = page.getByRole('button', { name: /^Choose time/ });
    // These are the ONLY two <p class="MuiFormHelperText-root"> elements on the page, always
    // present from first load, in fixed DOM order Start-then-End.
    this.startDateHelperText = page.locator('p.MuiFormHelperText-root').first();
    this.endDateHelperText = page.locator('p.MuiFormHelperText-root').last();
    // Unlike the two helper-text paragraphs above, this paragraph does NOT exist in the DOM at
    // all until a time is first chosen. Scoped to <p> elements specifically (not bare getByText)
    // because the paragraph's own static label is itself an inner <span>Selected Time: </span>
    // whose text already satisfies a getByText prefix-match — an ambiguity that silently picked
    // that inner span instead of the full "Selected Time: HH:MM:SS" paragraph (confirmed live: this
    // broke every toHaveText() assertion against a populated value, always reading back just the
    // static label prefix). Filtering candidates to <p> tags first avoids the ambiguity entirely.
    this.selectedTimeText = page.locator('p').filter({ hasText: /^Selected Time:/ });
  }

  async gotoCalendar() {
    const response = await this.goto('/components/calendar');
    await expect(this.basicDateInput).toBeVisible();
    return response;
  }

  startDateDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Start Date' });
  }

  endDateDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'End Date' });
  }

  timeDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Select Time' });
  }

  dayCell(dialog: Locator, day: number): Locator {
    return dialog.getByRole('gridcell', { name: String(day), exact: true });
  }

  previousMonthButton(dialog: Locator): Locator {
    return dialog.getByRole('button', { name: 'Previous month' });
  }

  nextMonthButton(dialog: Locator): Locator {
    return dialog.getByRole('button', { name: 'Next month' });
  }

  yearViewSwitchButton(dialog: Locator): Locator {
    return dialog.getByRole('button', { name: /switch to year view/ });
  }

  yearRadio(dialog: Locator, year: number): Locator {
    return dialog.getByRole('radio', { name: String(year), exact: true });
  }

  // exact: true is required — e.g. "0 hours" is a substring of "10 hours"/"20 hours", and
  // "0 minutes"/"5 minutes" are substrings of every "N0 minutes"/"N5 minutes" option (confirmed
  // live: without it, hourOption(dialog, 0) resolved to 3 elements instead of 1).
  hourOption(dialog: Locator, hour: number): Locator {
    return dialog.getByRole('option', { name: `${hour} hours`, exact: true });
  }

  minuteOption(dialog: Locator, minute: number): Locator {
    return dialog.getByRole('option', { name: `${minute} minutes`, exact: true });
  }

  /**
   * Clicks `openButton` to open one of this page's three Popper-based dialogs (Start Date, End
   * Date, Select Time) and waits until it's fully settled, not merely visible. MUI's Popper
   * entrance (Grow) transition satisfies toBeVisible() well before the popup is actually settled —
   * confirmed live on Firefox, reproducible even serially (--workers=1, not merely under parallel
   * load): clicking anything inside the dialog immediately after it becomes visible can silently
   * miss, landing mid-transform with no thrown error and no resulting interaction. A short settle
   * pause after opening, before any click inside it, closes that window.
   */
  async openDialog(openButton: Locator, dialog: Locator): Promise<void> {
    await openButton.click();
    await expect(dialog).toBeVisible();
    await this.page.waitForTimeout(300);
  }

  /** Opens the Select Time popup and returns its dialog locator once fully settled (see `openDialog`). */
  async openTimeDialog(): Promise<Locator> {
    const dialog = this.timeDialog();
    await this.openDialog(this.timeChooseButton, dialog);
    return dialog;
  }

  /**
   * Clicks `hour` then `minute` in an already-open, settled Select Time popup (see
   * `openTimeDialog`). A brief settle pause between the two clicks avoids a second, related race:
   * the listbox re-renders again after the input's value update lands (an MUI selection-state
   * update distinct from the input's own update), and an immediate minute click can land mid that
   * second re-render, silently dropping it.
   */
  async selectTime(dialog: Locator, hour: number, minute: number) {
    await this.hourOption(dialog, hour).click();
    await expect(this.timeInput).toHaveValue(`${String(hour).padStart(2, '0')}:00`);
    await this.page.waitForTimeout(150);
    await this.minuteOption(dialog, minute).click();
  }

  /** The calendar popup's clickable month/year header label (e.g. "August 2026"), confirmed live. */
  calendarHeaderLabel(dialog: Locator): Locator {
    return dialog.locator('.MuiPickersCalendarHeader-label');
  }

  /**
   * Clicks 'Next month'/'Previous month' inside `dialog` until the header label matches
   * `targetDate`'s month/year. Shared by `selectDateViaPicker` below (which navigates then commits
   * a day) and by any test that only needs a target month brought into view without selecting a day
   * (e.g. inspecting a paired field's dynamically-shifted min/max boundaries in a specific month).
   */
  async navigateToMonth(dialog: Locator, targetDate: Date) {
    const targetMonthYear = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const header = this.calendarHeaderLabel(dialog);

    // Safety cap: comfortably covers many years of forward/backward navigation without looping forever.
    for (let guard = 0; guard < 1200; guard++) {
      // MUI's month-transition animation briefly keeps both the outgoing and incoming header labels
      // (and day-grids) mounted at once — wait for exactly one header to remain before reading its
      // text, otherwise the locator can transiently resolve to two elements (confirmed live: a
      // strict-mode violation), matching the same synchronization already required in
      // calendar-date-range-navigation.spec.ts's "Next month" click loop.
      await expect(header).toHaveCount(1);
      const currentLabel = (await header.textContent())?.trim() ?? '';
      if (currentLabel === targetMonthYear) break;

      const currentMonthDate = new Date(`1 ${currentLabel}`);
      if (currentMonthDate < targetDate) {
        await this.nextMonthButton(dialog).click();
      } else {
        await this.previousMonthButton(dialog).click();
      }
    }

    // The header label settles one step ahead of the day-grid: MUI's grid slide-in
    // keeps the outgoing month's grid mounted alongside the incoming one for the
    // duration of the animation, so a day cell read immediately after this loop can
    // transiently resolve to two elements sharing the same day number (same
    // strict-mode violation guarded in selectDateViaPicker). Day 15 exists in every
    // month — wait for exactly one before returning so direct cell reads by callers
    // (e.g. the min/max boundary specs' disabled-day loops) are safe.
    await expect(dialog.getByRole('gridcell', { name: '15', exact: true })).toHaveCount(1);
  }

  /**
   * Opens `dialog` via `chooseButton`, navigates to `targetDate`'s month, then clicks the target
   * day cell — closing the popup in the same click (confirmed live: a single day-cell click both
   * commits and closes).
   */
  async selectDateViaPicker(chooseButton: Locator, dialog: Locator, targetDate: Date) {
    await this.openDialog(chooseButton, dialog);

    await this.navigateToMonth(dialog, targetDate);

    // The day-grid's own slide-out animation can outlast the header settling (confirmed live: a
    // disabled day cell from the outgoing month sharing the same day number, e.g. both a fading-out
    // "1" from the previous month and the incoming month's own "1", causing a strict-mode violation
    // on click) — wait for exactly one matching day cell to remain before clicking it.
    const targetDayCell = this.dayCell(dialog, targetDate.getDate());
    await expect(targetDayCell).toHaveCount(1);
    await targetDayCell.click();
  }

  /** Returns a new Date offset from "now" (at call time) by `days` (may be negative). */
  getOffsetDate(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  private formatDDMMYYYY(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  /** Computes "today", formatted DD/MM/YYYY, live at call time — never a hardcoded date literal. */
  getTodayDDMMYYYY(): string {
    return this.getDateOffsetDDMMYYYY(0);
  }

  /** Computes "today + days" (may be negative), formatted DD/MM/YYYY, live at call time. */
  getDateOffsetDDMMYYYY(days: number): string {
    return this.formatDDMMYYYY(this.getOffsetDate(days));
  }

  /** Computes "today"'s native `Date.prototype.toDateString()` output live at call time. */
  getTodayToDateString(): string {
    return this.getDateOffsetToDateString(0);
  }

  /** Computes "today + days"'s native `Date.prototype.toDateString()` output live at call time. */
  getDateOffsetToDateString(days: number): string {
    return this.getOffsetDate(days).toDateString();
  }
}
