/**
 * ### CartPage
 * This Page Object represents the shopping cart page of the application.
 * It contains all the selectors and methods needed to interact with the cart,
 * such as verifying its content, removing items, and proceeding to checkout.
 *
 * NOTE: This version extends BasePage to reuse unified interaction helpers.
 * Public API stays the same to avoid breaking existing tests.
 */
import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class CartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // --- Selectors ---
  private readonly sel = {
    cartList: '[data-test="cart-list"]',
    cartItem: '[data-test="inventory-item"]',
    cartItemName: '[data-test="inventory-item-name"]',
    checkoutBtn: '[data-test="checkout"]',
    continueShoppingBtn: '[data-test="continue-shopping"]',
    removeBtn: (name: string) =>
      `[data-test="remove-${name.toLowerCase().replace(/\s+/g, '-')}"]`,
  };

  async expectLoaded() {
    await expect(this.page.locator(this.sel.cartList)).toBeVisible();
  }

  async checkout() {
    // guarded click from BasePage
    await this.click(this.sel.checkoutBtn);
  }

  async removeItem(productName: string) {
    // guarded click from BasePage
    await this.click(this.sel.removeBtn(productName));
  }

  async continueShopping() {
    // guarded click from BasePage
    await this.click(this.sel.continueShoppingBtn);
  }

  getSelectors() {
    return this.sel;
  }
}
