import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class DropdownPage extends BasePage {
  readonly fruitSelect: Locator;
  readonly fruitResult: Locator;
  readonly superheroSelect: Locator;
  readonly superheroResult: Locator;
  readonly langSelect: Locator;
  readonly countrySelect: Locator;

  constructor(page: Page) {
    super(page);
    this.fruitSelect = page.getByTestId('dropdown-fruit');
    this.fruitResult = page.getByTestId('user-selected-fruit');
    this.superheroSelect = page.getByTestId('dropdown-superhero');
    this.superheroResult = page.getByTestId('user-selected-superhero');
    this.langSelect = page.getByTestId('dropdown-lang');
    this.countrySelect = page.getByTestId('dropdown-country');
  }

  async gotoDropdown() {
    const response = await this.goto('/components/dropdown');
    await this.fruitSelect.waitFor({ state: 'visible' });
    return response;
  }

  async selectFruit(label: string) {
    await this.fruitSelect.selectOption({ label });
  }

  async selectSuperheroes(labels: string[]) {
    await this.superheroSelect.selectOption(labels);
  }

  async selectLang(value: string) {
    await this.langSelect.selectOption(value);
  }

  async selectCountry(value: string) {
    await this.countrySelect.selectOption(value);
  }
}
