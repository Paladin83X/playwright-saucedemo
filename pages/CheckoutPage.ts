import { Page, expect } from '@playwright/test';

export class CheckoutPage {
  constructor(private page: Page) {}

  private readonly sel = {
    firstName: '[data-test="firstName"]',
    lastName: '[data-test="lastName"]',
    postalCode: '[data-test="postalCode"]',
    continueBtn: '[data-test="continue"]',
    cancelBtn: '[data-test="cancel"]',
    backHomeBtn: '[data-test="back-to-products"]',
    finishBtn: '[data-test="finish"]',
    thankYouHeader: '.complete-header',
    title: '[data-test="title"]'
  };

  async expectLoaded() {
    const titleLocator = this.page.locator(this.sel.title);
    await expect(titleLocator).toBeVisible();
    await expect(titleLocator).toHaveText('Checkout: Your Information');
  }

   async expectLoadedOverview() {
    const titleLocator = this.page.locator(this.sel.title);
    await expect(titleLocator).toBeVisible();
    await expect(titleLocator).toHaveText('Checkout: Overview');
  }

  async continue() {
    const btn = this.page.locator(this.sel.continueBtn);
    await btn.waitFor({ state: 'visible' });
    await expect(btn).toBeEnabled();
    await btn.click();
  }

  async cancel() {
    const btn = this.page.locator(this.sel.cancelBtn);
    await btn.waitFor({ state: 'visible' });
    await expect(btn).toBeEnabled();
    await btn.click();
  }

  async backHome() {
    const btn = this.page.locator(this.sel.backHomeBtn);
    await btn.waitFor({ state: 'visible' });
    await expect(btn).toBeEnabled();
    await btn.click();
  }

  async fillCustomerInfo(firstName: string, lastName: string, postalCode: string) {
    const firstNameInput = this.page.locator(this.sel.firstName);
    const lastNameInput = this.page.locator(this.sel.lastName);
    const postalCodeInput = this.page.locator(this.sel.postalCode);
    const continueButton = this.page.locator(this.sel.continueBtn);

    await firstNameInput.waitFor({ state: 'visible' });
    await firstNameInput.fill(firstName);

    await lastNameInput.waitFor({ state: 'visible' });
    await lastNameInput.fill(lastName);

    await postalCodeInput.waitFor({ state: 'visible' });
    await postalCodeInput.fill(postalCode);

    await continueButton.waitFor({ state: 'visible' });
    await expect(continueButton).toBeEnabled();
    await continueButton.click();
  }

  async finish() {
    const finishButton = this.page.locator(this.sel.finishBtn);
    await finishButton.waitFor({ state: 'visible' });
    await expect(finishButton).toBeEnabled();
    await finishButton.click();
  }

  async expectThankYouMessage() {
    await expect(this.page.locator(this.sel.thankYouHeader)).toContainText(/Thank you/i);
  }
}
