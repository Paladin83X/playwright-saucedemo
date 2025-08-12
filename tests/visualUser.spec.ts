import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

function median(nums: number[]) {
  const a = [...nums].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

test.describe('Visual sanity – visual_user (soft assertions)', () => {
  test('Collect all UI issues including misaligned buttons', async ({ page }) => {
    // Login as visual_user
    const login = new LoginPage(page);
    await login.goto();
    await login.login({ username: 'visual_user', password: 'secret_sauce' });

    // Inventory page + selectors
    const inventory = new InventoryPage(page);
    const sel = inventory.getSelectors();
    await inventory.expectLoaded();

    // Aggregate issues (soft-style)
    const issues: { product: string; field: string; expected: string; received: string }[] = [];

    // Page-level controls
    if (!(await page.locator(sel.shoppingCartLink).isVisible())) {
      issues.push({ product: 'PAGE', field: 'cart link', expected: 'visible', received: 'not visible' });
    }
    if (!(await page.locator(sel.productSortContainer).isVisible())) {
      issues.push({ product: 'PAGE', field: 'sort dropdown', expected: 'visible', received: 'not visible' });
    }

    // Expected catalog baseline (prices)
    const expected: Record<string, { price: string }> = {
      'Sauce Labs Backpack': { price: '$29.99' },
      'Sauce Labs Bike Light': { price: '$9.99' },
      'Sauce Labs Bolt T-Shirt': { price: '$15.99' },
      'Sauce Labs Fleece Jacket': { price: '$49.99' },
      'Sauce Labs Onesie': { price: '$7.99' },
      'Test.allTheThings() T-Shirt (Red)': { price: '$15.99' },
    };

    // Iterate all inventory cards
    const cards = page.locator(sel.inventoryItem);
    const count = await cards.count();
    if (count < 6) {
      issues.push({ product: 'PAGE', field: 'inventory count', expected: '>= 6', received: String(count) });
    }

    // Collect relative button positions for alignment analysis
    const relTopPositions: number[] = [];
    const relLeftPositions: number[] = [];
    const perCardMeta: { name: string; btnTopRel?: number; btnLeftRel?: number }[] = [];

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);

      const name =
        (await card.locator(sel.inventoryItemName).textContent())?.trim() ?? `#${i + 1}`;
      const price =
        (await card.locator(sel.inventoryItemPrice).textContent())?.trim() ?? '';
      const img = card.locator(sel.inventoryItemImg);
      const btn = card.locator(`${sel.addToCartButton}, ${sel.removeButton}`);

      // Name known?
      if (!expected[name]) {
        issues.push({ product: name, field: 'name', expected: 'known product', received: 'unexpected product' });
      } else {
        // Price
        const expectedPrice = expected[name].price;
        if (price !== expectedPrice) {
          issues.push({ product: name, field: 'price', expected: expectedPrice, received: price || '(missing)' });
        }
      }

      // Image visible + alt contains name
      const imgVisible = await img.isVisible();
      if (!imgVisible) {
        issues.push({ product: name, field: 'image', expected: 'visible', received: 'not visible' });
      } else {
        const imgAlt = (await img.getAttribute('alt')) ?? '';
        if (!imgAlt.toLowerCase().includes(name.toLowerCase())) {
          issues.push({ product: name, field: 'image alt', expected: `contains "${name}"`, received: imgAlt || '(missing)' });
        }
      }

      // Button present?
      const btnVisible = await btn.isVisible();
      if (!btnVisible) {
        issues.push({ product: name, field: 'action button', expected: 'visible', received: 'not visible' });
        perCardMeta.push({ name }); // keep index alignment
        continue;
      }

      // Layout sanity: inside card bounds
      const [cardBox, btnBox] = await Promise.all([card.boundingBox(), btn.boundingBox()]);
      if (!cardBox || !btnBox) {
        issues.push({
          product: name,
          field: 'layout',
          expected: 'button inside card bounds',
          received: 'missing bounding boxes'
        });
        perCardMeta.push({ name });
        continue;
      }
      const insideHorizontally =
        btnBox.x >= cardBox.x - 1 &&
        btnBox.x + btnBox.width <= cardBox.x + cardBox.width + 1;
      const insideVertically =
        btnBox.y >= cardBox.y - 1 &&
        btnBox.y + btnBox.height <= cardBox.y + cardBox.height + 1;

      if (!(insideHorizontally && insideVertically)) {
        issues.push({
          product: name,
          field: 'layout',
          expected: 'button inside card bounds',
          received: 'button appears shifted out of card'
        });
      }

      // NEW: cross-card alignment check (relative to card origin)
      const btnTopRel = btnBox.y - cardBox.y;
      const btnLeftRel = btnBox.x - cardBox.x;
      relTopPositions.push(btnTopRel);
      relLeftPositions.push(btnLeftRel);
      perCardMeta.push({ name, btnTopRel, btnLeftRel });
    }

    // Compute medians and flag misaligned buttons
    if (relTopPositions.length >= 2) {
      const medianTop = median(relTopPositions);
      const medianLeft = median(relLeftPositions);

      // Tolerances: vertical ±6px, horizontal ±12px (adjust if your UI spacing differs)
      const V_TOL = 6;
      const H_TOL = 12;

      perCardMeta.forEach(({ name, btnTopRel, btnLeftRel }) => {
        if (btnTopRel == null || btnLeftRel == null) return;
        const vDelta = Math.abs(btnTopRel - medianTop);
        const hDelta = Math.abs(btnLeftRel - medianLeft);
        if (vDelta > V_TOL || hDelta > H_TOL) {
          issues.push({
            product: name,
            field: 'layout alignment',
            expected: `~top=${medianTop.toFixed(1)}px ±${V_TOL}, ~left=${medianLeft.toFixed(1)}px ±${H_TOL}`,
            received: `top=${btnTopRel.toFixed(1)}px, left=${btnLeftRel.toFixed(1)}px`
          });
        }
      });
    }

    // Optional: console overview
    if (issues.length) {
      // eslint-disable-next-line no-console
      console.table(issues);
    }

    // One hard assertion at the end with full summary
    expect(
      issues,
      issues.map(i => `[${i.product}] ${i.field}: expected ${i.expected}, got ${i.received}`).join('\n')
    ).toHaveLength(0);
  });
});
