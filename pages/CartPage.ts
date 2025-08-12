import { Page, expect } from '@playwright/test';

export class CartPage {
  constructor(private page: Page) {}

  async expectLoaded() {
    await expect(this.page.locator('.cart_list')).toBeVisible();
  }

  async checkout() {
    await this.page.getByRole('button', { name: 'Checkout' }).click();
  }

  async removeItem(productName: string) {
    const item = this.page.locator('.cart_item').filter({ hasText: productName });
    await item.getByRole('button', { name: /remove/i }).click();
  }
}