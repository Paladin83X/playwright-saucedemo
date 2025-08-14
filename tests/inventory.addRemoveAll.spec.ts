/**
 * ### Inventory – Add & Remove All Items with Cart Badge Validation
 *
 * This test verifies that adding and removing all items from the inventory page
 * correctly updates the cart badge count after each click.
 *
 * For every click (add or remove), the test logs a reduced report:
 *   cart badge | expected | received
 *
 * At the end of the test, all collected issues are asserted to ensure there
 * are no mismatches between the expected and actual badge values.
 */
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

// Define which users will run the test (locked_out_user is excluded)
const USERS = [
  'standard_user',
  'problem_user',
  'error_user',
];

async function getBadgeCount(page): Promise<number> {
  const badge = page.locator('.shopping_cart_badge'); // SauceDemo has no data-test here
  if (!(await badge.count())) return 0;
  if (!(await badge.isVisible())) return 0;
  const txt = (await badge.textContent())?.trim() ?? '0';
  const n = Number(txt);
  return Number.isFinite(n) ? n : 0;
}

test.describe('Inventory – add & remove all items with cart badge validation', () => {
  for (const username of USERS) {
    test(`Add & remove all items for user: ${username}`, async ({ page }) => {
      const login = new LoginPage(page);
      await login.goto();
      await login.login({ username, password: 'secret_sauce' });

      const inventory = new InventoryPage(page);
      const sel = inventory.getSelectors();
      await inventory.expectLoaded();

      const issues: { step: string; expected: string; received: string }[] = [];

      const cards = page.locator(sel.inventoryItem);
      const totalItems = await cards.count();
      if (totalItems === 0) {
        issues.push({ step: 'initial load', expected: '>= 1 inventory item', received: '0 items' });
      }

      let added = 0;

      // --- Add all items ---
      for (let i = 0; i < totalItems; i++) {
        const card = cards.nth(i);
        const name = (await card.locator(sel.inventoryItemName).textContent())?.trim() ?? `#${i + 1}`;
        const addBtn = card.locator(sel.addToCartButton);

        if (await addBtn.isVisible()) {
          try {
            await addBtn.click();
            added += 1;
          } catch {
            issues.push({ step: `add "${name}"`, expected: 'click success', received: 'click failed' });
          }
        } else {
          issues.push({ step: `add "${name}"`, expected: 'button visible', received: 'not visible' });
        }

        const badgeVal = await getBadgeCount(page);
        const expectedBadge = added;

        // Log reduced output for each click
        console.table([{ 'cart badge': '', expected: expectedBadge, received: badgeVal }]);

        if (badgeVal !== expectedBadge) {
          issues.push({
            step: `after add "${name}"`,
            expected: `cart badge == ${expectedBadge}`,
            received: `cart badge == ${badgeVal}`,
          });
        }
      }

      const badgeAfterAdds = await getBadgeCount(page);
      if (badgeAfterAdds !== added || added !== totalItems) {
        issues.push({
          step: 'after all adds',
          expected: `badge == ${totalItems}`,
          received: `badge == ${badgeAfterAdds}`,
        });
      }

      const removeButtonsVisible = await page.locator(`${sel.inventoryItem} ${sel.removeButton}`).count();
      if (removeButtonsVisible < totalItems) {
        issues.push({
          step: 'post-add state',
          expected: `${totalItems} remove buttons`,
          received: `${removeButtonsVisible}`,
        });
      }

      let remaining = added;

      // --- Remove all items ---
      for (let i = 0; i < totalItems; i++) {
        const card = cards.nth(i);
        const name = (await card.locator(sel.inventoryItemName).textContent())?.trim() ?? `#${i + 1}`;
        const removeBtn = card.locator(sel.removeButton);

        if (!(await removeBtn.isVisible())) {
          issues.push({ step: `remove "${name}"`, expected: 'remove button visible', received: 'not visible' });
          continue;
        }

        try {
          await removeBtn.click();
          remaining = Math.max(0, remaining - 1);
        } catch {
          issues.push({ step: `remove "${name}"`, expected: 'remove button clickable', received: 'click failed' });
        }

        const badge = await getBadgeCount(page);

        // Log reduced output for each click
        console.table([{ 'cart badge': '', expected: remaining, received: badge }]);

        if (badge !== remaining) {
          issues.push({
            step: `after remove "${name}"`,
            expected: `cart badge == ${remaining}`,
            received: `cart badge == ${badge}`,
          });
        }
      }

      const finalBadgeCount = await getBadgeCount(page);
      const badgeNodeCount = await page.locator('.shopping_cart_badge').count();
      const badgeVisible = badgeNodeCount > 0 && (await page.locator('.shopping_cart_badge').isVisible());
      if (!(finalBadgeCount === 0 && (!badgeVisible || badgeNodeCount === 0))) {
        issues.push({
          step: 'after all removes',
          expected: 'badge disappears or equals 0',
          received: `badgeCount=${finalBadgeCount}, nodeCount=${badgeNodeCount}, visible=${badgeVisible}`,
        });
      }

      // Hard assertion at the end
      expect(
        issues,
        issues.map(i => `[${i.step}] expected ${i.expected}, got ${i.received}`).join('\n')
      ).toHaveLength(0);
    });
  }
});
