import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';


test.describe('E2E Test with Soft Assertions for error_user', () => {
  test('Completes checkout flow and aggregates issues', async ({ page }) => {
    // Pages
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    // Collect all soft issues here
    const issues: string[] = [];

    // 1) Login
    await loginPage.goto();
    await loginPage.login({ username: 'error_user', password: 'secret_sauce' });

    try {
      await loginPage.expectLoggedIn();
      await inventoryPage.expectLoaded();
    } catch (e: any) {
      issues.push(`Login or inventory load failed: ${e?.message ?? e}`);
    }

    // 2) Sort (low → high) and verify prices are sorted ascending
    try {
      await inventoryPage.sortBy('lohi');
      const sel = inventoryPage.getSelectors();
      const rawPrices = await page.locator(sel.inventoryItemPrice).allTextContents();
      const toNum = (s: string) => Number((s.match(/[\d.]+/) ?? ['0'])[0]);
      const nums = rawPrices.map(toNum);
      const sorted = [...nums].sort((a, b) => a - b);
      if (JSON.stringify(nums) !== JSON.stringify(sorted)) {
        issues.push(`Price sorting failed. Expected ascending: ${sorted.join(', ')} | Got: ${nums.join(', ')}`);
      }
    } catch (e: any) {
      issues.push(`Sorting check failed: ${e?.message ?? e}`);
    }

    // 3) Add & remove items, verify cart badge count
    const firstItemName = 'Sauce Labs Backpack';
    const secondItemName = 'Sauce Labs Bike Light';
    try {
      await inventoryPage.addToCartByName(firstItemName);
      await inventoryPage.addToCartByName(secondItemName);

      // Badge is not a data-test on SauceDemo; use class for count
      const badge = page.locator('.shopping_cart_badge');
      const badgeText = (await badge.isVisible()) ? (await badge.textContent())?.trim() : null;
      if (badgeText !== '2') {
        issues.push(`Cart badge after adding 2 items expected "2" but got "${badgeText ?? '(none)'}".`);
      }

      await inventoryPage.removeFromCartByName(firstItemName);
      const badgeTextAfterRemove = (await badge.isVisible()) ? (await badge.textContent())?.trim() : null;
      if (badgeTextAfterRemove !== '1') {
        issues.push(`Cart badge after removing 1 item expected "1" but got "${badgeTextAfterRemove ?? '(none)'}".`);
      }
    } catch (e: any) {
      issues.push(`Add/Remove or badge check failed: ${e?.message ?? e}`);
    }

    // 4) Go to cart and verify contents
    try {
      await inventoryPage.openCart();
      await cartPage.expectLoaded();

      // Expect only the second item remains
      const remainingName = (await page.locator('[data-test="inventory-item-name"]').first().textContent())?.trim();
      if (remainingName !== secondItemName) {
        issues.push(`Cart item mismatch. Expected "${secondItemName}" but saw "${remainingName ?? '(none)'}".`);
      }
    } catch (e: any) {
      issues.push(`Cart checks failed: ${e?.message ?? e}`);
    }

    // 5) Checkout: fill info and try to finish
    try {
      await cartPage.checkout();
      await checkoutPage.fillCustomerInfo('Dennis', 'Tester', '12345');

      // error_user can misbehave here; try to continue & finish but do not hard-fail
      try {
        await checkoutPage.continue();
      } catch (e: any) {
        issues.push(`Continue failed on checkout step: ${e?.message ?? e}`);
      }

      try {
        await checkoutPage.finish();
      } catch (e: any) {
        issues.push(`Finish failed (known for error_user): ${e?.message ?? e}`);
      }

      // Thank you page (may fail for error_user)
      try {
        await checkoutPage.expectThankYouMessage();
      } catch (e: any) {
        issues.push(`Thank you message missing after finish: ${e?.message ?? e}`);
      }
    } catch (e: any) {
      issues.push(`Checkout flow failed: ${e?.message ?? e}`);
    }

    // Final aggregated assertion
    const summary = issues.join('\n');
    expect(issues, `Test failed with the following issues:\n${summary}`).toHaveLength(0);
  });
});
