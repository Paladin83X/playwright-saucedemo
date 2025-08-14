/**
 * ### E2E – Soft-Aggregated Canary for `error_user`
 *
 * Purpose & Non-Redundancy:
 * - This test intentionally overlaps with unit-like checks covered in other specs (login, sorting, cart badge, checkout),
 *   but it is **not redundant** because it validates the **entire cross-page flow** for the
 *   specifically unstable `error_user` account and **aggregates all deviations** into a single report.
 * - Specialized specs focus on isolated behaviors (e.g., precise badge updates after each click).
 *   This E2E canary focuses on **milestones only** (added 2 → badge 2, removed 1 → badge 1, cart contents, thank-you),
 *   plus **transitions** (URL changes).
 * - Run policy: Tag as `@e2e @soft @error_user` and execute on **nightly / pre-release** pipelines rather than on every commit,
 *   to catch **integration or environment regressions** that isolated tests may miss.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

test.describe('@e2e @soft @error_user E2E canary', () => {
  test('Completes checkout flow and aggregates issues (milestone checks only)', async ({ page }) => {
    // --- Soft issue bucket (aggregated at the end) ---
    const issues: string[] = [];

    // --- POs ---
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    // Helper: cart badge (SauceDemo uses class instead of data-test)
    const getBadgeCount = async () => {
      const badge = page.locator('.shopping_cart_badge');
      if (!(await badge.count()) || !(await badge.isVisible())) return 0;
      const txt = (await badge.textContent())?.trim() ?? '0';
      const n = Number(txt);
      return Number.isFinite(n) ? n : 0;
    };

    // --- 1) Login + landing on Inventory ---
    await test.step('Login and expect inventory is visible', async () => {
      await loginPage.goto();
      await loginPage.login({ username: 'error_user', password: 'secret_sauce' });

      try {
        await loginPage.expectLoggedIn();
        await inventoryPage.expectLoaded();
        await expect(page).toHaveURL(/inventory\.html/);
      } catch (e: any) {
        issues.push(`Login or inventory load failed: ${e?.message ?? e}`);
      }
    });

    // --- 2) Sort (lo->hi) – milestone only ---
    await test.step('Apply sorting (low→high) – milestone only', async () => {
      try {
        await inventoryPage.sortBy('lohi');
      } catch (e: any) {
        issues.push(`Sorting interaction failed: ${e?.message ?? e}`);
      }
    });

    // --- 3) Add 2 items → badge == 2 ; remove 1 → badge == 1 ---
    await test.step('Add & remove items – badge milestone checks', async () => {
      const firstItem = 'Sauce Labs Backpack';
      const secondItem = 'Sauce Labs Bike Light';

      try {
        await inventoryPage.addToCartByName(firstItem);
        await inventoryPage.addToCartByName(secondItem);

        const badgeAfterTwo = await getBadgeCount();
        if (badgeAfterTwo !== 2) {
          issues.push(`Badge mismatch after adding 2 items: expected 2, received ${badgeAfterTwo}`);
        }

        await inventoryPage.removeFromCartByName(firstItem);
        const badgeAfterRemove = await getBadgeCount();
        if (badgeAfterRemove !== 1) {
          issues.push(`Badge mismatch after removing 1 item: expected 1, received ${badgeAfterRemove}`);
        }
      } catch (e: any) {
        issues.push(`Add/Remove or badge checks failed: ${e?.message ?? e}`);
      }
    });

    // --- 4) Open cart → expect remaining item present ---
    await test.step('Open cart and verify remaining contents', async () => {
      try {
        await inventoryPage.openCart();
        await expect(page).toHaveURL(/cart\.html/);
        await cartPage.expectLoaded();

        const name = (await page.locator('[data-test="inventory-item-name"]').first().textContent())?.trim();
        if (name !== 'Sauce Labs Bike Light') {
          issues.push(`Cart contents mismatch: expected "Sauce Labs Bike Light", received "${name ?? '(none)'}"`);
        }
      } catch (e: any) {
        issues.push(`Cart verification failed: ${e?.message ?? e}`);
      }
    });

    // --- 5) Checkout flow (information → overview → finish) ---
    await test.step('Checkout flow – milestone transitions and thank-you', async () => {
      try {
        await cartPage.checkout();
        await expect(page).toHaveURL(/checkout-step-one\.html/);

        await checkoutPage.fillCustomerInfo('Dennis', 'Tester', '12345');

        try {
          await checkoutPage.continue();
          await expect(page).toHaveURL(/checkout-step-two\.html/);
          await checkoutPage.expectLoadedOverview();
        } catch (e: any) {
          issues.push(`Continue to overview failed: ${e?.message ?? e}`);
        }

        try {
          await checkoutPage.finish();
          await expect(page).toHaveURL(/checkout-complete\.html/);
          await checkoutPage.expectThankYouMessage();
        } catch (e: any) {
          issues.push(`Finish/Thank-you failed (expected for error_user): ${e?.message ?? e}`);
        }
      } catch (e: any) {
        issues.push(`Checkout flow failed: ${e?.message ?? e}`);
      }
    });

    // --- Final aggregated assertion ---
    const summary = issues.join('\n');
    expect(issues, `E2E canary reported issues:\n${summary}`).toHaveLength(0);
  });
});
