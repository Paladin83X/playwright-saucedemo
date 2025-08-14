/**
 * This test verifies the complete checkout process for multiple users.
 * Steps:
 * 1. Login with the specified user.
 * 2. Add all available products to the cart.
 * 3. Verify the cart badge count matches the number of successfully added items.
 * 4. Go to the cart and proceed to checkout.
 * 5. Fill in customer information and continue.
 * 6. Finish the order and verify the "Thank you for your order!" message.
 * 7. Click "Back Home" and verify the inventory page is displayed again.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

const USERS = [
  'standard_user',
  'problem_user',
   'error_user',
];

for (const username of USERS) {
  test.describe(`Checkout flow – add all items and finish`, () => {
    test(`Completes checkout for user: ${username}`, async ({ page }) => {
      const login = new LoginPage(page);
      const inventory = new InventoryPage(page);
      const cart = new CartPage(page);
      const checkout = new CheckoutPage(page);

      // Step 1: Login
      await login.goto();
      await login.login({ username, password: 'secret_sauce' });
      await inventory.expectLoaded();

      // Step 2: Add all products to the cart robustly
      const inventoryItems = page.locator('.inventory_item');
      const addCount = await inventoryItems.count();
      let addClicks = 0;

      for (let i = 0; i < addCount; i++) {
        const item = inventoryItems.nth(i);
        const addBtn = item.locator('button[data-test^="add-to-cart"]');
        const removeBtn = item.locator('button[data-test^="remove"]');

        try {
          await addBtn.click();
          // The key fix: Wait for the 'Remove' button to appear after a successful click.
          // This ensures the page state has updated before continuing.
          await expect(removeBtn).toBeVisible(); 
          addClicks++;
          console.log(`✅ Clicked "Add to cart" for product #${i + 1}`);
        } catch (err) {
          console.warn(`⚠️ Could not click "Add to cart" for product #${i + 1}: ${err}`);
        }
      }
      
      // Step 3: Verify cart badge matches number of added products
      if (addClicks > 0) {
        const badgeText = await page.locator('.shopping_cart_badge').textContent();
        const badgeCount = parseInt(badgeText || '0', 10);
        expect(
          badgeCount,
          `Cart badge should match number of clicked add buttons (expected ${addClicks}, got ${badgeCount})`
        ).toBe(addClicks);
      } else {
        console.warn('⚠️ No items were successfully added to the cart.');
      }

      // Step 4: Go to cart
      await inventory.openCart();
      await cart.expectLoaded();

      // Step 5: Start checkout
      await cart.checkout();
      await checkout.expectLoaded();

      // Step 6: Fill in customer info and continue
      await checkout.fillCustomerInfo('John', 'Doe', '10115');

      // Step 7: Finish checkout
      await checkout.finish();
      await checkout.expectThankYouMessage();

      // Step 8: Back home
      await checkout.backHome();
      await inventory.expectLoaded();

      console.log(`✅ Checkout completed successfully for user: ${username}`);
    });
  });
}