import { Page, expect } from '@playwright/test';

export class InventoryPage {
  constructor(private readonly page: Page) {}

  // --- Centralized selectors for consistency ---
  private readonly sel = {
    inventoryList: '[data-test="inventory-list"]',
    inventoryItem: '[data-test="inventory-item"]',
    inventoryItemName: '[data-test="inventory-item-name"]',
    inventoryItemPrice: '[data-test="inventory-item-price"]',
    inventoryItemImg: '[data-test="inventory-item-image"] img',
    shoppingCartLink: '[data-test="shopping-cart-link"]',
    productSortContainer: '[data-test="product-sort-container"]',
    addToCartButton: 'button[data-test^="add-to-cart"]',
    removeButton: 'button[data-test^="remove"]',
    addToCartBtn: (name: string) =>
      `[data-test="add-to-cart-${name.toLowerCase().replace(/\s+/g, '-')}"]`,
    removeFromCartBtn: (name: string) =>
      `[data-test="remove-${name.toLowerCase().replace(/\s+/g, '-')}"]`
  };

  public getSelectors() {
    return this.sel;
  }

  async expectLoaded() {
    await expect(this.page.locator(this.sel.inventoryList)).toBeVisible();
  }

  async addToCartByName(productName: string) {
    await this.page.locator(this.sel.addToCartBtn(productName)).click();
  }

  async removeFromCartByName(productName: string) {
    await this.page.locator(this.sel.removeFromCartBtn(productName)).click();
  }

  async openCart() {
    await this.page.locator(this.sel.shoppingCartLink).click();
  }

  async sortBy(optionValue: 'az' | 'za' | 'lohi' | 'hilo') {
    const sortDropdown = this.page.locator(this.sel.productSortContainer);
    // Wait dynamically until dropdown is visible
    await sortDropdown.waitFor({ state: 'visible' });

    await sortDropdown.selectOption(optionValue);
  }
}
