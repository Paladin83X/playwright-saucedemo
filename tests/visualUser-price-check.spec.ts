// tests/visualUser.prices.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

test.describe('visual_user – prices only (soft aggregation)', () => {
  test('All product prices match the expected baseline', async ({ page }) => {
    // Login as visual_user
    const login = new LoginPage(page);
    await login.goto();
    await login.login({ username: 'visual_user', password: 'secret_sauce' });

    // Inventory page + selectors
    const inventory = new InventoryPage(page);
    const sel = inventory.getSelectors();
    await inventory.expectLoaded();

    // Expected catalog baseline (authoritative prices from Sauce Demo)
    const expected: Record<string, { price: string }> = {
      'Sauce Labs Backpack': { price: '$29.99' },
      'Sauce Labs Bike Light': { price: '$9.99' },
      'Sauce Labs Bolt T-Shirt': { price: '$15.99' },
      'Sauce Labs Fleece Jacket': { price: '$49.99' },
      'Sauce Labs Onesie': { price: '$7.99' },
      'Test.allTheThings() T-Shirt (Red)': { price: '$15.99' },
    };

    // Collect mismatches (soft-assert style)
    const issues: { product: string; expected: string; received: string }[] = [];

    // Gather all cards
    const cards = page.locator(sel.inventoryItem);
    const count = await cards.count();

    // We still check all cards even if fewer/more than 6 appear
    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const name = (await card.locator(sel.inventoryItemName).textContent())?.trim() ?? `#${i + 1}`;
      const price = (await card.locator(sel.inventoryItemPrice).textContent())?.trim() ?? '(missing)';

      if (!expected[name]) {
        // Unknown product – record as an issue but continue
        issues.push({ product: name, expected: 'known product from baseline', received: 'unexpected product' });
        continue;
      }

      const expectedPrice = expected[name].price;
      if (price !== expectedPrice) {
        issues.push({ product: name, expected: expectedPrice, received: price });
      }
    }

    // Console overview (useful for local runs / CI logs)
    if (issues.length) {
      // eslint-disable-next-line no-console
      console.table(issues);
    }

    // Single hard assertion at the end with a clear summary
    expect(
      issues,
      issues.map(i => `[${i.product}] price mismatch: expected ${i.expected}, got ${i.received}`).join('\n')
    ).toHaveLength(0);
  });
});
