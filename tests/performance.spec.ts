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

  // --- Zwei Artikel hinzufügen ---
  await measure('Add Two Items to Cart', async () => {
    await inventory.addToCartByName('Sauce Labs Backpack');
    await inventory.addToCartByName('Sauce Labs Bike Light');
  });

  // --- Einen Artikel entfernen ---
  await measure('Remove One Item from Cart', async () => {
    await inventory.removeFromCartByName('Sauce Labs Backpack');
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
    await checkout.expectLoaded();
  });

  // --- Cancel zurück ---
  await measure('Cancel Checkout', async () => {
    await checkout.cancel();
    await cart.expectLoaded();
  });

  // --- Checkout again ---
  await measure('Checkout Begin Again', async () => {
    await cart.checkout();
    await checkout.expectLoaded();
  });

  // --- Customer Info + Continue ---
  await measure('Fill Info + Continue', async () => {
    await checkout.fillCustomerInfo('John', 'Doe', '10115');
    await checkout.expectLoadedOverview();
  });

  // --- Cancel Checkout:Overview ---
  await measure('Cancel Checkout Overview', async () => {
    await checkout.cancel();
    await inventory.expectLoaded();
  });

  // --- Erneut Warenkorb öffnen ---
  await measure('Open Cart Again After Cancel', async () => {
    await inventory.openCart();
    await cart.expectLoaded();
  });

  // --- Checkout again ---
  await measure('Checkout Begin Final', async () => {
    await cart.checkout();
    await checkout.expectLoaded();
  });

  // --- Customer Info + Continue ---
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
