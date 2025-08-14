/**
 * NOTE: This is a comprehensive end-to-end test for the 'standard_user' following a full "happy path" workflow.
 * It validates a complete user journey, starting from login and proceeding through several key stages:
 * 1.  Adding multiple items to the shopping cart and verifying the cart's content and badge count.
 * 2.  Modifying the cart by removing and adding items to ensure dynamic updates are handled correctly.
 * 3.  Proceeding through the entire checkout process, including filling out customer information.
 * 4.  Verifying the final order summary and the successful completion message.
 * 5.  Ensuring the cart is correctly cleared after the order is finished.
 * This test uses hard assertions to guarantee that each step of the user flow functions exactly as expected.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

test.describe('E2E – standard_user full happy path', () => {
  test('adds multiple items, verifies cart, and completes checkout', async ({ page }) => {
    // Pages
    const login = new LoginPage(page);
    const inventory = new InventoryPage(page);
    const cart = new CartPage(page);
    const checkout = new CheckoutPage(page);

    // Navigate to login and sign in as standard_user
    // (We do not use the user-pool here to keep the test deterministic and isolated)
    await login.goto();
    await login.login({ username: 'standard_user', password: 'secret_sauce' });
    await inventory.expectLoaded();

    // Choose items to add
    const initialItems = [
      'Sauce Labs Backpack',
      'Sauce Labs Bike Light',
      'Sauce Labs Bolt T-Shirt',
    ];

    // Add initial items to cart
    for (const name of initialItems) {
      await inventory.addToCartByName(name);
    }

    // Assert the cart badge shows 3
    const cartBadge = page.locator('.shopping_cart_badge'); // SauceDemo exposes badge via class
    await expect(cartBadge).toHaveText('3');

    // Go to cart and verify items present (order-agnostic check)
    await inventory.openCart();
    await cart.expectLoaded();

    const cartItemNames = (await page
      .locator('[data-test="inventory-item-name"]')
      .allTextContents())
      .map(s => s.trim());

    const sortedCartNames = [...cartItemNames].sort();
    const sortedInitial = [...initialItems].sort();

    expect(sortedCartNames, 'Cart contents do not match items added').toEqual(sortedInitial);

    // Remove one item in the cart
    const itemToRemove = 'Sauce Labs Bike Light';
    await cart.removeItem(itemToRemove);

    // Badge should now be 2 (badge is still visible on cart page header)
    await expect(cartBadge).toHaveText('2');

    // Continue shopping and add another item
    await cart.continueShopping();
    await inventory.expectLoaded();

    const extraItem = 'Sauce Labs Fleece Jacket';
    await inventory.addToCartByName(extraItem);

    // Badge should be 3 again
    await expect(cartBadge).toHaveText('3');

    // Open cart again and verify the new expected set
    await inventory.openCart();
    await cart.expectLoaded();

    const expectedNow = [...initialItems.filter(n => n !== itemToRemove), extraItem];
    const cartItemNames2 = (await page
      .locator('[data-test="inventory-item-name"]')
      .allTextContents())
      .map(s => s.trim());

    const sortedCart2 = [...cartItemNames2].sort();
    const sortedExpected2 = [...expectedNow].sort();
    expect(sortedCart2, 'Cart contents after changes do not match expected set').toEqual(sortedExpected2);

    // Proceed to checkout
    await cart.checkout();

    // Fill info, go to overview
    await checkout.fillCustomerInfo('Max', 'Mustermann', '10115');
    await checkout.continue();

    // On overview page, verify items match expected set before finishing
    const overviewItemNames = (await page
      .locator('[data-test="inventory-item-name"]')
      .allTextContents())
      .map(s => s.trim());
    const sortedOverview = [...overviewItemNames].sort();
    expect(sortedOverview, 'Overview items do not match expected cart items').toEqual(sortedExpected2);

    // Finish order and verify thank you
    await checkout.finish();
    await checkout.expectThankYouMessage();

    // Back home → cart should be cleared
    await checkout.backHome();
    await inventory.expectLoaded();
    await expect(cartBadge, 'Cart badge should disappear after successful order').toHaveCount(0);
  });
});
