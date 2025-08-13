/**
 * NOTE: For efficiency, visual and layout tests are focused exclusively on the
 * inventory section. This approach targets the most critical and dynamic part of
 * the application, providing high-value feedback while saving time and resources.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

function median(nums: number[]) {
  const a = [...nums].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

test.describe('visual_user – button layout only (soft aggregation)', () => {
  test('Buttons are visible, within card bounds, and consistently aligned', async ({ page }) => {
    // Login as visual_user
    const login = new LoginPage(page);
    await login.goto();
    await login.login({ username: 'visual_user', password: 'secret_sauce' });

    // Inventory page + selectors
    const inventory = new InventoryPage(page);
    const sel = inventory.getSelectors();
    await inventory.expectLoaded();

    // Soft aggregation of issues
    const issues: { product: string; field: string; expected: string; received: string }[] = [];

    const cards = page.locator(sel.inventoryItem);
    const count = await cards.count();

    // Collect relative button positions for alignment comparison
    const relTop: number[] = [];
    const relLeft: number[] = [];
    const meta: { name: string; top?: number; left?: number }[] = [];

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      const name = (await card.locator(sel.inventoryItemName).textContent())?.trim() ?? `#${i + 1}`;
      const btn = card.locator(`${sel.addToCartButton}, ${sel.removeButton}`);

      // 1) Visible?
      const visible = await btn.isVisible();
      if (!visible) {
        issues.push({ product: name, field: 'button', expected: 'visible', received: 'not visible' });
        meta.push({ name });
        continue; // no geometry possible
      }

      // 2) Inside card bounds?
      const [cardBox, btnBox] = await Promise.all([card.boundingBox(), btn.boundingBox()]);
      if (!cardBox || !btnBox) {
        issues.push({
          product: name,
          field: 'layout',
          expected: 'button inside card bounds',
          received: 'missing bounding boxes'
        });
        meta.push({ name });
        continue;
      }

      const insideH = btnBox.x >= cardBox.x - 1 && (btnBox.x + btnBox.width) <= (cardBox.x + cardBox.width + 1);
      const insideV = btnBox.y >= cardBox.y - 1 && (btnBox.y + btnBox.height) <= (cardBox.y + cardBox.height + 1);
      if (!(insideH && insideV)) {
        issues.push({
          product: name,
          field: 'layout',
          expected: 'button inside card bounds',
          received: 'button appears shifted out of card'
        });
      }

      // 3) Cross-card alignment: relative position (top/left) inside card
      const topRel = btnBox.y - cardBox.y;
      const leftRel = btnBox.x - cardBox.x;
      relTop.push(topRel);
      relLeft.push(leftRel);
      meta.push({ name, top: topRel, left: leftRel });
    }

    // Compare alignment to median of all cards (robust baseline)
    if (relTop.length >= 2) {
      const medTop = median(relTop);
      const medLeft = median(relLeft);

      // Tolerances — tweak for your UI spacing
      const V_TOL = 6;   // vertical ±6 px
      const H_TOL = 12;  // horizontal ±12 px

      meta.forEach(({ name, top, left }) => {
        if (top == null || left == null) return;
        const vDelta = Math.abs(top - medTop);
        const hDelta = Math.abs(left - medLeft);
        if (vDelta > V_TOL || hDelta > H_TOL) {
          issues.push({
            product: name,
            field: 'layout alignment',
            expected: `~top=${medTop.toFixed(1)}px ±${V_TOL}, ~left=${medLeft.toFixed(1)}px ±${H_TOL}`,
            received: `top=${top.toFixed(1)}px, left=${left.toFixed(1)}px`
          });
        }
      });
    }

    // Print table for quick diagnostics
    if (issues.length) {
      // eslint-disable-next-line no-console
      console.table(issues);
    }

    // One hard assertion at the end
    expect(
      issues,
      issues.map(i => `[${i.product}] ${i.field}: expected ${i.expected}, got ${i.received}`).join('\n')
    ).toHaveLength(0);
  });
});
