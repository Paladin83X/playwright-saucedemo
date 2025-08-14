/**
 * ### CheckoutPage
 *
 * This Page Object models the checkout process of the application.
 * It covers both the customer information step and the order overview,
 * providing methods to fill out required fields, navigate between steps,
 * and verify the completion message.
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class CheckoutPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private readonly sel = {
    firstName: '[data-test="firstName"]',
    lastName: '[data-test="lastName"]',
    postalCode: '[data-test="postalCode"]',
    continueBtn: '[data-test="continue"]',
    cancelBtn: '[data-test="cancel"]',
    backHomeBtn: '[data-test="back-to-products"]',
    finishBtn: '[data-test="finish"]',
    thankYouHeader: '.complete-header',
    title: '[data-test="title"]',
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
    await this.click(this.sel.continueBtn);
  }

  async cancel() {
    await this.click(this.sel.cancelBtn);
  }

  async backHome() {
    await this.click(this.sel.backHomeBtn);
  }

  async fillCustomerInfo(firstName: string, lastName: string, postalCode: string) {
    await this.fill(this.sel.firstName, firstName);
    await this.fill(this.sel.lastName, lastName);
    await this.fill(this.sel.postalCode, postalCode);
    await this.click(this.sel.continueBtn);
  }

  async finish() {
    await this.click(this.sel.finishBtn);
  }

  async expectThankYouMessage() {
    await expect(this.page.locator(this.sel.thankYouHeader)).toContainText(/Thank you/i);
  }
}
