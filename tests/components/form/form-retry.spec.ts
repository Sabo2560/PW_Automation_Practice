// spec: specs/form.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { FormPage } from '../../pages/FormPage';

test.describe('Form - Retry / Reset Behavior', () => {
  let form: FormPage;

  test.beforeEach(async ({ page }) => {
    form = new FormPage(page);
    await form.gotoForm();
  });

  test('Clicking Retry after a successful submission removes the success panel and resets every field to its fresh-load default', async () => {
    // 1. Navigate to '/components/form', fill and submit the form completely and validly (dropdown 'Software', Name 'Test User',
    // Email 'test@example.com', Message 'Test message', radio 'Yes', Terms checkbox checked) so that '[data-testid="form-sent"]'
    // is visible, then click '[data-testid="button-form-retry"]'
    await form.fillValid();
    await form.submit();
    await form.expectSuccessVisible();

    await form.retry();

    await form.expectFormRestored();
  });

  test('After clicking Retry, the reset form can be filled and submitted again successfully', async () => {
    // 1. Navigate to '/components/form', submit the form once successfully, click Retry, then fill and submit the form a second
    // time with different valid values (dropdown 'Other', Name 'Second User', Email 'second@example.com', Message 'Second message',
    // radio 'No', Terms checkbox checked)
    await form.fillValid();
    await form.submit();
    await form.expectSuccessVisible();

    await form.retry();
    await form.expectFormRestored();

    await form.fillValid({
      dropdown: 'Other',
      name: 'Second User',
      email: 'second@example.com',
      message: 'Second message',
      radio: 'No',
    });
    await form.submit();

    await form.expectSuccessVisible();
  });
});
