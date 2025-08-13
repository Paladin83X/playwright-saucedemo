/**
 * NOTE: This test suite verifies the core functionality of the inventory page's sorting features.
 * It performs a comprehensive check for multiple user types to ensure the following:
 * - The sorting dropdown is visible and interactive.
 * - Selecting a sort option successfully changes the sort order.
 * - The displayed items are correctly sorted by name (A-Z, Z-A) and by price (low-to-high, high-to-low).
 * - The test also checks for unexpected browser alerts, ensuring no unwanted pop-ups occur during the sorting process.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

const USERS = [
  //'standard_user',
  //'visual_user',
  'problem_user',
  //'error_user'
];

test.describe('Inventory – Sorting validation (clickable + changeable + alert detection)', () => {
  for (const username of USERS) {
    test(`Sorting check for user: ${username}`, async ({ page }) => {
      // Collect alerts
      const alerts: string[] = [];
      page.on('dialog', async (dialog) => {
        alerts.push(dialog.message());
        await dialog.accept();
      });

      // Login
      const login = new LoginPage(page);
      await login.goto();
      await login.login({ username, password: 'secret_sauce' });

      // Inventory loaded
      const inventory = new InventoryPage(page);
      const sel = inventory.getSelectors();
      await inventory.expectLoaded();

      const sortSelect = page.locator(sel.productSortContainer);
      await expect(sortSelect).toBeVisible();
      await expect(sortSelect).toBeEnabled();

      // Helper functions
      const getNames = async () =>
        (await page.locator(sel.inventoryItemName).allTextContents()).map((n) => n.trim());

      const getPrices = async () =>
        (await page.locator(sel.inventoryItemPrice).allTextContents()).map((p) =>
          Number(p.replace('$', '').trim())
        );

      const setSort = async (value: 'hilo' | 'lohi' | 'za' | 'az') => {
        let clickable = true;
        try {
          await sortSelect.click({ timeout: 1500 });
        } catch {
          clickable = false;
        }

        let changed = true;
        try {
          await sortSelect.selectOption(value, { timeout: 2000 });
          const current = await sortSelect.inputValue();
          changed = current === value;
        } catch {
          changed = false;
        }
        return { clickable, changed };
      };

      const results: { sortMode: string; success: boolean }[] = [];

      // 1) High→Low
      {
        const { clickable, changed } = await setSort('hilo');
        const prices = await getPrices();
        const expected = [...prices].sort((a, b) => b - a);
        results.push({
          sortMode: 'High→Low',
          success: clickable && changed && JSON.stringify(prices) === JSON.stringify(expected),
        });
      }

      // 2) Low→High
      {
        const { clickable, changed } = await setSort('lohi');
        const prices = await getPrices();
        const expected = [...prices].sort((a, b) => a - b);
        results.push({
          sortMode: 'Low→High',
          success: clickable && changed && JSON.stringify(prices) === JSON.stringify(expected),
        });
      }

      // 3) Z→A
      {
        const { clickable, changed } = await setSort('za');
        const names = await getNames();
        const expected = [...names].sort((a, b) => b.localeCompare(a));
        results.push({
          sortMode: 'Z→A',
          success: clickable && changed && JSON.stringify(names) === JSON.stringify(expected),
        });
      }

      // 4) A→Z
      {
        const { clickable, changed } = await setSort('az');
        const names = await getNames();
        const expected = [...names].sort((a, b) => a.localeCompare(b));
        results.push({
          sortMode: 'A→Z',
          success: clickable && changed && JSON.stringify(names) === JSON.stringify(expected),
        });
      }

      // Output
      results.forEach((r) => console.log(`${r.sortMode} sorting correct: ${r.success}`));
      if (alerts.length) {
        console.log(`Alerts during sorting:\n${alerts.join('\n')}`);
      }

      // Assert: no failures and no alerts
      const failed = results.filter((r) => !r.success);
      expect(
        { failed, alerts },
        [
          ...failed.map((f) => `${f.sortMode} sorting failed`),
          ...(alerts.length ? [`Alerts: ${alerts.join('; ')}`] : []),
        ].join('\n') || 'ok'
      ).toEqual({ failed: [], alerts: [] });
    });
  }
});