import { Page, expect } from '@playwright/test';

export class CheckoutPage {
  constructor(private page: Page) {}

  private readonly sel = {
    firstName: '[data-test="firstName"]',
    lastName: '[data-test="lastName"]',
    postalCode: '[data-test="postalCode"]',
    continueBtn: '[data-test="continue"]',
    finishBtn: '[data-test="finish"]',
    thankYouHeader: '.complete-header',
  };

  // to do --> einheitlich
  async continue() {
  await this.page.locator('[data-test="continue"]').click();
}

async cancel() {
  await this.page.locator('[data-test="cancel"]').click();
}
async backHome() {
  await this.page.locator('[data-test="back-to-products"]').click();
}

  async fillCustomerInfo(firstName: string, lastName: string, postalCode: string) {
    await this.page.locator(this.sel.firstName).fill(firstName);
    await this.page.locator(this.sel.lastName).fill(lastName);
    await this.page.locator(this.sel.postalCode).fill(postalCode);

    const continueButton = this.page.locator(this.sel.continueBtn);
    await expect(continueButton).toBeVisible();
    await continueButton.click();
  }

  async finish() {
    const finishButton = this.page.locator(this.sel.finishBtn);
    await expect(finishButton).toBeVisible();
    await finishButton.click();
  }

  async expectThankYouMessage() {
    await expect(this.page.locator(this.sel.thankYouHeader)).toContainText(/Thank you/i);
  }
}