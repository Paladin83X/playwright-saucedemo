import { Page, expect } from '@playwright/test';

export class InventoryPage {
  constructor(private page: Page) {}

  async expectLoaded() {
    await expect(this.page.locator('.inventory_list')).toBeVisible();
  }

  async addToCartByName(productName: string) {
    const productCard = this.page.locator('.inventory_item').filter({ hasText: productName });
    await productCard.getByRole('button', { name: /add to cart/i }).click();
  }

  async removeFromCartByName(productName: string) {
    const productCard = this.page.locator('.inventory_item').filter({ hasText: productName });
    await productCard.getByRole('button', { name: /remove/i }).click();
  }

  async openCart() {
    await this.page.locator('.shopping_cart_link').click();
  }

  async sortBy(optionLabel: 'Name (A to Z)' | 'Name (Z to A)' | 'Price (low to high)' | 'Price (high to low)') {
    await this.page.locator('[data-test="product_sort_container"]').selectOption({ label: optionLabel });
  }
}