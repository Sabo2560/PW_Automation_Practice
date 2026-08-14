// spec: specs/form.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { FormPage } from '../../pages/FormPage';

test.describe('Form - Required Field Validation (native HTML5 constraints)', () => {
  let form: FormPage;

  test.beforeEach(async ({ page }) => {
    form = new FormPage(page);
    await form.gotoForm();
  });

  test('Submitting a completely empty form is blocked and focuses the first invalid field (dropdown)', async () => {
    // 1. Navigate to '/components/form' (all fields at default/blank state) and click '[data-testid="button-submit"]' without filling anything
    await form.submit();

    await form.expectSuccessAbsent();
    const dropdownValidity = await form.getValidity(form.dropdown);
    expect(dropdownValidity.valueMissing).toBe(true);
    expect(dropdownValidity.validationMessage).not.toBe('');
  });

  test('Dropdown required constraint alone blocks submission when every other field is valid', async () => {
    // 1. Navigate to '/components/form'. Fill Name with 'Test User', Email with 'test@example.com', Message with 'Test message',
    // select radio 'Yes', and check the Terms checkbox — leave the dropdown at its default 'Select an option' value. Click Submit
    await form.fillValid({ dropdown: '' });
    await form.submit();

    await form.expectSuccessAbsent();
    const dropdownValidity = await form.getValidity(form.dropdown);
    expect(dropdownValidity.valueMissing).toBe(true);
    expect(dropdownValidity.validationMessage).not.toBe('');

    await expect(form.nameInput).toHaveValue('Test User');
    await expect(form.emailInput).toHaveValue('test@example.com');
    await expect(form.messageInput).toHaveValue('Test message');
    await expect(form.radioYes).toBeChecked();
    await expect(form.checkbox).toBeChecked();
  });

  test('Name required constraint alone blocks submission when every other field is valid', async () => {
    // 1. Navigate to '/components/form'. Select dropdown option 'Software', leave Name empty, fill Email with 'test@example.com',
    // fill Message with 'Test message', select radio 'Yes', check the Terms checkbox. Click Submit
    await form.fillValid({ name: '' });
    await form.submit();

    await form.expectSuccessAbsent();
    const nameValidity = await form.getValidity(form.nameInput);
    expect(nameValidity.valueMissing).toBe(true);
    expect(nameValidity.validationMessage).not.toBe('');

    await expect(form.dropdown).toHaveValue('Software');
    await expect(form.emailInput).toHaveValue('test@example.com');
    await expect(form.messageInput).toHaveValue('Test message');
    await expect(form.radioYes).toBeChecked();
    await expect(form.checkbox).toBeChecked();
  });

  test('Email required constraint alone blocks submission when every other field is valid', async () => {
    // 1. Navigate to '/components/form'. Select dropdown option 'Software', fill Name with 'Test User', leave Email empty,
    // fill Message with 'Test message', select radio 'Yes', check the Terms checkbox. Click Submit
    await form.fillValid({ email: '' });
    await form.submit();

    await form.expectSuccessAbsent();
    const emailValidity = await form.getValidity(form.emailInput);
    expect(emailValidity.valueMissing).toBe(true);
    expect(emailValidity.validationMessage).not.toBe('');
  });

  test('Message required constraint alone blocks submission when every other field is valid', async () => {
    // 1. Navigate to '/components/form'. Select dropdown option 'Software', fill Name with 'Test User', fill Email with 'test@example.com',
    // leave Message empty, select radio 'Yes', check the Terms checkbox. Click Submit
    await form.fillValid({ message: '' });
    await form.submit();

    await form.expectSuccessAbsent();
    const messageValidity = await form.getValidity(form.messageInput);
    expect(messageValidity.valueMissing).toBe(true);
    expect(messageValidity.validationMessage).not.toBe('');
  });

  test('Radio group required constraint alone blocks submission when every other field is valid', async () => {
    // 1. Navigate to '/components/form'. Select dropdown option 'Software', fill Name with 'Test User', fill Email with 'test@example.com',
    // fill Message with 'Test message', leave BOTH radio options unselected, check the Terms checkbox. Click Submit
    await form.fillValid({ radio: undefined });
    await form.submit();

    await form.expectSuccessAbsent();
    const radioValidity = await form.getValidity(form.radioYes);
    expect(radioValidity.valueMissing).toBe(true);
    expect(radioValidity.validationMessage).not.toBe('');

    await expect(form.radioYes).not.toBeChecked();
    await expect(form.radioNo).not.toBeChecked();
  });

  test('Terms checkbox required constraint alone blocks submission when every other field is valid', async () => {
    // 1. Navigate to '/components/form'. Select dropdown option 'Software', fill Name with 'Test User', fill Email with 'test@example.com',
    // fill Message with 'Test message', select radio 'Yes', leave the Terms checkbox UNCHECKED. Click Submit
    await form.fillValid({ checkTerms: false });
    await form.submit();

    await form.expectSuccessAbsent();
    const checkboxValidity = await form.getValidity(form.checkbox);
    expect(checkboxValidity.valueMissing).toBe(true);
    expect(checkboxValidity.validationMessage).not.toBe('');

    await expect(form.checkbox).not.toBeChecked();
    await expect(form.dropdown).toHaveValue('Software');
    await expect(form.nameInput).toHaveValue('Test User');
    await expect(form.emailInput).toHaveValue('test@example.com');
    await expect(form.messageInput).toHaveValue('Test message');
    await expect(form.radioYes).toBeChecked();
  });
});
