
/**
 * NOTE: This test intentionally does NOT use the user-pool fixture.
 *
 * Rationale:
 * 1) Controlled subject: We specifically benchmark the performance_glitch_user because this
 *    account is designed to expose latency issues. Running with a pool would mix different
 *    user profiles and dilute the signal we want to measure.
 * 2) Deterministic runs: A single-user, single-worker run reduces variability (CPU contention,
 *    parallel navigation, shared network bandwidth) and yields more repeatable timings.
 * 3) No accidental reuse: User-pool assigns users by worker index. If workers > pool size or
 *    multiple projects run, users can repeat, which skews measurements and complicates analysis.
 * 4) Clear baselines: Performance baselines should be established per user in isolation. If we
 *    want cross-user comparisons, we run this test separately per user and compare reports after.
 * 5) Simpler reporting: The HTML attachment and console timings directly reflect this single
 *    user’s journey without aggregating or merging measurements across workers.
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

  // --- Sortieren (Preis low→high) ---
  await measure('Sort by Price (low→high)', async () => {
    await inventory.sortBy('lohi');
  });

  // --- In den Warenkorb (Icon) ---
  await measure('Open Cart', async () => {
    await inventory.openCart();
    await cart.expectLoaded();
  });

  // --- Zurück zum Shoppen ---
  await measure('Continue Shopping', async () => {
    await cart.continueShopping();
    await inventory.expectLoaded();
  });

  // --- Erneut Warenkorb öffnen ---
  await measure('Open Cart Again', async () => {
    await inventory.openCart();
    await cart.expectLoaded();
  });

  // --- Checkout starten ---
  await measure('Checkout Begin', async () => {
    await cart.checkout();
  });

  // --- Customer Info + Continue ---
  await measure('Fill Info + Continue', async () => {
    await checkout.fillCustomerInfo('John', 'Doe', '10115');
    await checkout.continue();
  });

  // --- Cancel zurück ---
  await measure('Cancel Checkout', async () => {
    await checkout.cancel();
    await cart.expectLoaded();
  });

  // --- Erneut Checkout → Continue ---
  await measure('Checkout Again + Continue', async () => {
    await cart.checkout();
    await checkout.continue();
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
  // eslint-disable-next-line no-console
  console.table(steps);

  // Optional soft assertions for max duration of each step
  /* for (const s of steps) {
    expect.soft(s.duration, `${s.action} took too long`).toBeLessThan(7000);
  } */

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