/**
 * NOTE: This test is an end-to-end performance validation for the 'performance_glitch_user'.
 * It measures the time taken for key user actions throughout the entire checkout workflow,
 * from login to order completion and returning to the home page.
 *
 * The test's primary goal is to identify and report on performance glitches, which are a known
 * characteristic of this specific user account. It logs the duration of each step and generates
 * a comprehensive HTML performance report at the end to provide a clear overview of any
 * observed delays.
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { renderPerfHtml, saveAndAttachPerfHtml, type PerfStep } from './helpers/perfReport';

test('E2E Performance – performance_glitch_user', async ({ page }, testInfo) => {
  const testStartedAt = new Date();

  const login = new LoginPage(page);
  const inventory = new InventoryPage(page);
  const cart = new CartPage(page);
  const checkout = new CheckoutPage(page);

  const steps: PerfStep[] = [];

  const measure = async (action: string, fn: () => Promise<void>) => {
    const start = Date.now();
    await fn();
    const duration = Date.now() - start;
    steps.push({ action, duration });
  };

  // --- Login ---
  await measure('Login', async () => {
    await login.goto();
    await login.login({ username: 'performance_glitch_user', password: 'secret_sauce' });
    await inventory.expectLoaded();
  });

  // --- Sort by Price (low→high) ---
  await measure('Sort by Price (low→high)', async () => {
    await inventory.sortBy('lohi');
  });

  // --- Add two items ---
  await measure('Add Two Items to Cart', async () => {
    await inventory.addToCartByName('Sauce Labs Backpack');
    await inventory.addToCartByName('Sauce Labs Bike Light');
  });

  // --- Remove one item ---
  await measure('Remove One Item from Cart', async () => {
    await inventory.removeFromCartByName('Sauce Labs Backpack');
  });

  // --- Open Cart (Icon) ---
  await measure('Open Cart', async () => {
    await inventory.openCart();
    await cart.expectLoaded();
  });

  // --- Continue Shopping ---
  await measure('Continue Shopping', async () => {
    await cart.continueShopping();
    await inventory.expectLoaded();
  });

  // --- Open Cart again ---
  await measure('Open Cart Again', async () => {
    await inventory.openCart();
    await cart.expectLoaded();
  });

  // --- Start Checkout ---
  await measure('Checkout Begin', async () => {
    await cart.checkout();
    await checkout.expectLoaded();
  });

  // --- Cancel back ---
  await measure('Cancel Checkout', async () => {
    await checkout.cancel();
    await cart.expectLoaded();
  });

  // --- Checkout again ---
  await measure('Checkout Begin Again', async () => {
    await cart.checkout();
    await checkout.expectLoaded();
  });

  // --- Fill Info + Continue ---
  await measure('Fill Info + Continue', async () => {
    await checkout.fillCustomerInfo('John', 'Doe', '10115');
    await checkout.expectLoadedOverview();
  });

  // --- Cancel Checkout:Overview ---
  await measure('Cancel Checkout Overview', async () => {
    await checkout.cancel();
    await inventory.expectLoaded();
  });

  // --- Open Cart again ---
  await measure('Open Cart Again After Cancel', async () => {
    await inventory.openCart();
    await cart.expectLoaded();
  });

  // --- Checkout again ---
  await measure('Checkout Begin Final', async () => {
    await cart.checkout();
    await checkout.expectLoaded();
  });

  // --- Fill Info + Continue ---
  await measure('Fill Info + Continue Final', async () => {
    await checkout.fillCustomerInfo('John', 'Doe', '10115');
    await checkout.expectLoadedOverview();
  });

  // --- Finish ---
  await measure('Finish', async () => {
    await checkout.finish();
    await checkout.expectThankYouMessage();
  });

  // --- Back Home ---
  await measure('Back Home', async () => {
    await checkout.backHome();
    await inventory.expectLoaded();
  });

  // Quick output to console for a fast overview
  console.table(steps);

  // Generate HTML performance report & attach to Playwright report
  const testEndedAt = new Date();
  const total = steps.reduce((acc, s) => acc + s.duration, 0);
  const html = renderPerfHtml(steps, {
    User: 'performance_glitch_user',
    Browser: testInfo.project.name,
    StartedAt: testStartedAt.toISOString(),
    EndedAt: testEndedAt.toISOString(),
    TotalDurationMs: String(total),
  });
  await saveAndAttachPerfHtml(testInfo, html, 'performance-report.html');
});