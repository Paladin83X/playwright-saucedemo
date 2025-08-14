/**
 * ### InventoryPage
 *
 * This Page Object represents the product inventory page of the application.
 * It provides methods to interact with and verify the inventory list,
 * add or remove products from the cart, open the shopping cart, and change
 * the product sorting order.
 * 
 */
import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class InventoryPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

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
    await this.click(this.sel.addToCartBtn(productName));
  }

  async removeFromCartByName(productName: string) {
    await this.click(this.sel.removeFromCartBtn(productName));
  }

  async openCart() {
    await this.click(this.sel.shoppingCartLink);
  }

  async sortBy(optionValue: 'az' | 'za' | 'lohi' | 'hilo') {
    const sortDropdown = this.page.locator(this.sel.productSortContainer);
    await expect(sortDropdown).toBeVisible();
    await sortDropdown.selectOption(optionValue);
  }
}
