// spec: specs/form.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { FormPage } from '../../pages/FormPage';

test.describe('Form - Successful Submission, Equivalence Classes, and Boundary Values', () => {
  let form: FormPage;

  test.beforeEach(async ({ page }) => {
    form = new FormPage(page);
    await form.gotoForm();
  });

  test('Submitting the form with all required fields validly filled shows the success panel and fires no network request', async ({ page }) => {
    // 1. Navigate to '/components/form', begin recording network requests, then select dropdown 'Software', fill Name 'Test User',
    // fill Email 'test@example.com', fill Message 'This is a test message.', select radio 'Yes', check the Terms checkbox, and click Submit
    await form.fillValid({ dropdown: 'Software', name: 'Test User', email: 'test@example.com', message: 'This is a test message.', radio: 'Yes' });

    const xhrOrFetchRequests: string[] = [];
    page.on('request', (request) => {
      const type = request.resourceType();
      if (type === 'xhr' || type === 'fetch') xhrOrFetchRequests.push(request.url());
    });

    await form.submit();

    await form.expectSuccessVisible();
    await expect(form.successPanel.getByRole('heading', { name: 'Form submitted', level: 1, exact: true })).toBeVisible();
    await expect(form.successPanel.getByRole('heading', { name: 'Good job!', level: 2, exact: true })).toBeVisible();
    await expect(form.retryBtn).toBeVisible();
    await expect(form.retryBtn).toHaveText('Retry');

    await expect(form.dropdown).toHaveCount(0);
    await expect(form.nameInput).toHaveCount(0);
    await expect(form.emailInput).toHaveCount(0);
    await expect(form.messageInput).toHaveCount(0);
    await expect(form.radioYes).toHaveCount(0);
    await expect(form.checkbox).toHaveCount(0);
    await expect(form.submitBtn).toHaveCount(0);

    // No XHR/fetch request fired as a result of clicking Submit — this is a client-side-only submission
    expect(xhrOrFetchRequests).toEqual([]);
  });

  test("[GAP] Email field accepts a value with no '@' or domain — no email-format validation exists", async () => {
    // 1. Navigate to '/components/form'. Select dropdown 'Hardware', fill Name 'A', fill Email with the non-email string 'notanemail'
    // (no '@', no domain), fill Message 'x', select radio 'No', check the Terms checkbox, and click Submit
    await form.fillValid({ dropdown: 'Hardware', name: 'A', email: 'notanemail', message: 'x', radio: 'No' });

    const emailValidity = await form.getValidity(form.emailInput);
    expect(emailValidity.typeMismatch).toBe(false);

    await form.submit();

    await form.expectSuccessVisible();
  });

  test('[GAP] Whitespace-only value in the required Name field satisfies the required constraint and allows submission', async () => {
    // 1. Navigate to '/components/form'. Select dropdown 'Other', fill Name with exactly three space characters '   ', fill Email
    // 'test@example.com', fill Message 'Test message', select radio 'Yes', check the Terms checkbox, and click Submit
    await form.fillValid({ dropdown: 'Other', name: '   ', email: 'test@example.com', message: 'Test message', radio: 'Yes' });

    const nameValidity = await form.getValidity(form.nameInput);
    expect(nameValidity.valueMissing).toBe(false);

    await form.submit();

    await form.expectSuccessVisible();
  });

  test("Submission succeeds for every dropdown option and every radio option (equivalence classes for 'valid selection')", async () => {
    // 1. Navigate to '/components/form'. Fill Name 'Test User', Email 'test@example.com', Message 'Test message', check the Terms
    // checkbox. Select dropdown option 'Hardware' and radio option 'No'. Click Submit
    await form.fillValid({ dropdown: 'Hardware', radio: 'No' });
    await form.submit();

    await form.expectSuccessVisible();

    // 2. Reload '/components/form' fresh, repeat with dropdown option 'Other' and radio option 'Yes' (all other fields filled
    // validly as above), and click Submit
    await form.gotoForm();
    await form.fillValid({ dropdown: 'Other', radio: 'Yes' });
    await form.submit();

    await form.expectSuccessVisible();
  });
});
