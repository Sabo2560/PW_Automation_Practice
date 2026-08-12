import { test, expect } from '@playwright/test';

test.describe('Radio component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/radio');
  });

  test('should only allow one option checked at a time in the "Select any one" group', async ({ page }) => {
    // Scoping by data-testid instead of class — .mb-4 is reused across every
    // group on this page so it wasn't reliably narrowing things down.
    const yesRadio = page.getByTestId('answer-radio').first();
    const noRadio = page.getByTestId('answer-radio').nth(1);

    // Neither option is pre-selected by default, so we drive the state
    // ourselves rather than assuming a starting value.
    await yesRadio.check();
    await expect(yesRadio).toBeChecked();
    await expect(noRadio).not.toBeChecked();

    await noRadio.check();
    await expect(noRadio).toBeChecked();
    await expect(yesRadio).not.toBeChecked();
  });

  test('should enforce mutual exclusivity in the "one-radio" group', async ({ page }) => {
    const yesRadio = page.getByTestId('one-radio').first();
    const noRadio = page.getByTestId('one-radio').nth(1);

    await noRadio.check();
    await expect(noRadio).toBeChecked();
    await expect(yesRadio).not.toBeChecked();

    await yesRadio.check();
    await expect(yesRadio).toBeChecked();
    await expect(noRadio).not.toBeChecked();
  });

  test('"Find the bug" — both options can end up checked at once', async ({ page }) => {
    // The two inputs here use different "name" attributes (nobug vs bug),
    // so the browser doesn't treat them as one radio group — that's the bug
    // this exercise wants us to catch. Instead of asserting normal radio
    // behavior, we confirm the broken behavior actually happens.
    const yesRadio = page.locator('#nobug');
    const noRadio = page.locator('#bug');

    await yesRadio.check();
    await noRadio.check();

    await expect(yesRadio).toBeChecked();
    await expect(noRadio).toBeChecked(); // both checked — this is the bug
  });

  test('should identify which option is selected by default and allow changing it', async ({ page }) => {
    const fooRadio = page.locator('#Foo');
    const barRadio = page.locator('#Bar');

    // Bar is pre-selected on page load
    await expect(barRadio).toBeChecked();
    await expect(fooRadio).not.toBeChecked();

    await fooRadio.check();
    await expect(fooRadio).toBeChecked();
    await expect(barRadio).not.toBeChecked();
  });

  test('should confirm the last radio option is disabled', async ({ page }) => {
    const goingRadio = page.locator('input[id="Going"]');
    const notGoingRadio = page.locator('input[id="Not going"]');
    const maybeRadio = page.locator('input[id="Maybe"]');

    await expect(maybeRadio).toBeDisabled();

    // Sanity check the other two still work normally
    await goingRadio.check();
    await expect(goingRadio).toBeChecked();
    await notGoingRadio.check();
    await expect(notGoingRadio).toBeChecked();
  });

  test('should confirm the "Remember me" checkbox state and toggling', async ({ page }) => {
    const rememberCheckbox = page.getByTestId('checkbox-checked');

    // Checked by default on page load
    await expect(rememberCheckbox).toBeChecked();

    await rememberCheckbox.uncheck();
    await expect(rememberCheckbox).not.toBeChecked();

    await rememberCheckbox.check();
    await expect(rememberCheckbox).toBeChecked();
  });

  test('should toggle the T&C checkbox state', async ({ page }) => {
    const termsCheckbox = page.getByTestId('termsConditions-checkbox');

    // Not checked by default (confirmed this the same way as the earlier
    // "Select any one" test — don't assume, drive the state yourself).
    await expect(termsCheckbox).not.toBeChecked();
    await termsCheckbox.check();
    await expect(termsCheckbox).toBeChecked();

    await termsCheckbox.uncheck();
    await expect(termsCheckbox).not.toBeChecked();
    await termsCheckbox.check();
    await expect(termsCheckbox).toBeChecked();
  });

  test('should open the Terms and Conditions link in a new tab', async ({ page }) => {
    // The "Terms and Conditions" text is a link that opens a new tab —
    // we catch that new tab via waitForEvent before clicking.
    const [newTab] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('link', { name: 'Terms and Conditions' }).click(),
    ]);
    await newTab.waitForLoadState();
    await expect(newTab).toHaveURL('/testing-terms-conditions');
    await newTab.close();
  });
});