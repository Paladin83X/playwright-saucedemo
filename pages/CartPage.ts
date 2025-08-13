import { Page, expect } from '@playwright/test';

export class CartPage {
  constructor(private readonly page: Page) {}

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
    await this.page.locator(this.sel.checkoutBtn).click();
  }

  async removeItem(productName: string) {
    await this.page.locator(this.sel.removeBtn(productName)).click();
  }

  async continueShopping() {
    await this.page.locator(this.sel.continueShoppingBtn).click();
  }

  getSelectors() {
    return this.sel;
  }
}
