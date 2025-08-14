/**
 * ### E2E – Console & Network Error Collector (Multi-User)
 *
 * Purpose:
 * Collect **console errors** and **failed network responses** while running a realistic
 * end-to-end user workflow (mirrors the performance test flow) across multiple users.
 *
 * Why this is useful (and non-redundant):
 * - Focuses on **runtime health signals** (JS console errors, HTTP 4xx/5xx) that functional
 *   tests might not catch even when all assertions pass.
 * - Runs a full cross-page flow to exercise many code paths, maximizing the chance to surface
 *   warnings/errors tied to timing, resources, or 3rd-party requests.
 *
 * Behavior:
 * - Creates one test per user (excluding users that cannot log in).
 * - Aggregates all observed issues and fails once at the end with a single, readable summary.
 *
 * Suggested usage:
 * - Tag as `@health @errors` and run on nightly or pre-release pipelines.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

const USERS = [
  'standard_user',
  //'problem_user',
  // 'error_user',     
] as const;

test.describe('@health @errors E2E – console & network collector', () => {
  for (const username of USERS) {
    test(`Collect console/network errors – ${username}`, async ({ page }) => {
      // ---- collectors ----
      const consoleErrors: string[] = [];
      const httpErrors: string[] = [];
      const issues: string[] = [];

      // console: capture only "error" level (ignore log/info/warn to reduce noise)
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(`[console:${msg.type()}] ${msg.text()}`);
        }
      });

      // network: capture HTTP status >= 400
      page.on('response', (resp) => {
        if (resp.status() >= 400) {
          httpErrors.push(`[${resp.status()}] ${resp.url()}`);
        }
      });

      // ---- POs ----
      const login = new LoginPage(page);
      const inventory = new InventoryPage(page);
      const cart = new CartPage(page);
      const checkout = new CheckoutPage(page);

      // ---- Workflow (mirrors the performance test steps, but without timing) ----
      // 1) Login
      try {
        await login.goto();
        await login.login({ username, password: 'secret_sauce' });
        await inventory.expectLoaded();
      } catch (e: any) {
        issues.push(`Login/inventory failed: ${e?.message ?? e}`);
      }

      // 2) Sort by Price (low→high)
      try {
        await inventory.sortBy('lohi');
      } catch (e: any) {
        issues.push(`Sorting (lo→hi) failed: ${e?.message ?? e}`);
      }

      // 3) Add two items
      try {
        await inventory.addToCartByName('Sauce Labs Backpack');
        await inventory.addToCartByName('Sauce Labs Bike Light');
      } catch (e: any) {
        issues.push(`Add items failed: ${e?.message ?? e}`);
      }

      // 4) Remove one item
      try {
        await inventory.removeFromCartByName('Sauce Labs Backpack');
      } catch (e: any) {
        issues.push(`Remove item failed: ${e?.message ?? e}`);
      }

      // 5) Open Cart
      try {
        await inventory.openCart();
        await cart.expectLoaded();
      } catch (e: any) {
        issues.push(`Open cart failed: ${e?.message ?? e}`);
      }

      // 6) Continue Shopping
      try {
        await cart.continueShopping();
        await inventory.expectLoaded();
      } catch (e: any) {
        issues.push(`Continue shopping failed: ${e?.message ?? e}`);
      }

      // 7) Open Cart again
      try {
        await inventory.openCart();
        await cart.expectLoaded();
      } catch (e: any) {
        issues.push(`Open cart (again) failed: ${e?.message ?? e}`);
      }

      // 8) Start Checkout
      try {
        await cart.checkout();
        await checkout.expectLoaded();
      } catch (e: any) {
        issues.push(`Checkout begin failed: ${e?.message ?? e}`);
      }

      // 9) Cancel back to Cart
      try {
        await checkout.cancel();
        await cart.expectLoaded();
      } catch (e: any) {
        issues.push(`Checkout cancel failed: ${e?.message ?? e}`);
      }

      // 10) Checkout again
      try {
        await cart.checkout();
        await checkout.expectLoaded();
      } catch (e: any) {
        issues.push(`Checkout begin (again) failed: ${e?.message ?? e}`);
      }

      // 11) Fill Info + Continue to Overview
      try {
        await checkout.fillCustomerInfo('John', 'Doe', '10115');
        await checkout.expectLoadedOverview();
      } catch (e: any) {
        issues.push(`Fill info/continue failed: ${e?.message ?? e}`);
      }

      // 12) Cancel Checkout:Overview back to Inventory
      try {
        await checkout.cancel();
        await inventory.expectLoaded();
      } catch (e: any) {
        issues.push(`Cancel from overview failed: ${e?.message ?? e}`);
      }

      // 13) Open Cart again
      try {
        await inventory.openCart();
        await cart.expectLoaded();
      } catch (e: any) {
        issues.push(`Open cart (post-cancel) failed: ${e?.message ?? e}`);
      }

      // 14) Checkout final → Overview
      try {
        await cart.checkout();
        await checkout.expectLoaded();
        await checkout.fillCustomerInfo('John', 'Doe', '10115');
        await checkout.expectLoadedOverview();
      } catch (e: any) {
        issues.push(`Checkout final to overview failed: ${e?.message ?? e}`);
      }

      // 15) Finish → Thank you → Back Home
      try {
        await checkout.finish();
        await checkout.expectThankYouMessage();
        await checkout.backHome();
        await inventory.expectLoaded();
      } catch (e: any) {
        issues.push(`Finish/thank-you/back-home failed: ${e?.message ?? e}`);
      }

      // ---- Summarize runtime health signals ----
      if (consoleErrors.length) {
        issues.push(`Console errors observed (${consoleErrors.length}):\n${consoleErrors.join('\n')}`);
      }
      if (httpErrors.length) {
        issues.push(`HTTP errors observed (${httpErrors.length}):\n${httpErrors.join('\n')}`);
      }

      // ---- Hard assertion at the end with a readable summary ----
      const summary = issues.join('\n\n');
      expect(issues, `Runtime issues for user "${username}":\n${summary}`).toHaveLength(0);
    });
  }
});
