import { test, expect } from '@playwright/test';

test.describe('Dropdown component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/dropdown');
  });

  test('should select fruit by visible text and display selection', async ({ page }) => {
    const fruitDropdown = page.getByTestId('dropdown-fruit');
    await fruitDropdown.selectOption({ label: 'Mango' });
    await expect(page.getByTestId('user-selected-fruit')).toContainText('Mango');
  });

  test('should select multiple superheroes and display all selections', async ({ page }) => {
    const superheroDropdown = page.getByTestId('dropdown-superhero');
    await superheroDropdown.selectOption(['Batman', 'Superman', 'Thor']);
    const resultText = await page.getByTestId('user-selected-superhero').textContent();
    expect(resultText).toContain('Batman');
    expect(resultText).toContain('Superman');
    expect(resultText).toContain('Thor');
  });

  test('should select programming language by value', async ({ page }) => {
    // "value" here means we're selecting by the option's underlying value
    // attribute (e.g. "py"), not by its visible label ("Python").
    const langDropdown = page.getByTestId('dropdown-lang');
    await langDropdown.selectOption('py');
    await expect(langDropdown).toHaveValue('py');
  });

  test('should select country by value', async ({ page }) => {
    const countryDropdown = page.getByTestId('dropdown-country');
    await countryDropdown.selectOption('India');
    await expect(countryDropdown).toHaveValue('India');
  });

  test('should show placeholder text by default with no selection', async ({ page }) => {
    // Confirms the "empty state" of every dropdown on this page —
    // useful as a baseline so we know these results text elements
    // aren't just always showing something regardless of selection.
    await expect(page.getByTestId('user-selected-fruit')).toContainText('No fruit selected');
    await expect(page.getByTestId('user-selected-superhero')).toContainText('None selected');
    await expect(page.getByTestId('dropdown-lang')).toHaveValue('');
    await expect(page.getByTestId('dropdown-country')).toHaveValue('');
  });
});