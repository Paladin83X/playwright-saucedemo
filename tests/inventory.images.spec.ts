/**
 * NOTE: This test validates the image mapping and integrity on the inventory page.
 * It's designed to be run against specific user accounts like 'visual_user' and 'problem_user',
 * which are known to have issues with visual elements.
 *
 * The test performs the following checks for each product item:
 * 1.  It verifies the presence of an image element.
 * 2.  It checks that the 'data-test' attribute and the 'src' attribute are not empty.
 * 3.  It compares the actual 'src' value with an expected value from a predefined mapping to ensure the correct image is displayed for each product.
 * 4.  It performs additional soft checks for image visibility and load status (naturalWidth > 0) to catch rendering issues without failing prematurely.
 *
 * The final assertion will fail the test if any issues (such as missing images, incorrect src, or broken links) are found, providing a detailed summary in the report.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

// Adjust users here as needed
const USERS = [
  'standard_user',
  'visual_user',
  'problem_user',
];

test.describe('Inventory image mapping – data-test ↔ src (soft aggregation)', () => {
  for (const username of USERS) {
    test(`Validate image mapping for user: ${username}`, async ({ page }) => {
      // Login
      const login = new LoginPage(page);
      await login.goto();
      await login.login({ username, password: 'secret_sauce' });

      // Inventory
      const inventory = new InventoryPage(page);
      await inventory.expectLoaded();

      // Expected mapping: img[data-test] → expected src (with hash)
      // We check that the actual src contains the expected part (endsWith or includes).
      const expectedSrcByDataTest: Record<string, string> = {
        'inventory-item-sauce-labs-backpack-img':
          '/static/media/sauce-backpack-1200x1500.0a0b85a3.jpg',
        'inventory-item-sauce-labs-bike-light-img':
          '/static/media/bike-light-1200x1500.37c843b0.jpg',
        'inventory-item-sauce-labs-bolt-t-shirt-img':
          '/static/media/bolt-shirt-1200x1500.c2599ac5.jpg',
        'inventory-item-sauce-labs-fleece-jacket-img':
          '/static/media/sauce-pullover-1200x1500.51d7ffaf.jpg',
        'inventory-item-sauce-labs-onesie-img':
          '/static/media/red-onesie-1200x1500.2ec615b2.jpg',
        'inventory-item-test.allthethings()-t-shirt-(red)-img':
          '/static/media/red-tatt-1200x1500.30dadef4.jpg',
      };

      const issues: { product: string; field: string; expected: string; received: string }[] = [];

      // Collect all cards
      const cards = page.locator('[data-test="inventory-item"]');
      const count = await cards.count();

      for (let i = 0; i < count; i++) {
        const card = cards.nth(i);

        // Product name (for reporting only)
        const name =
          (await card.locator('[data-test="inventory-item-name"]').textContent())?.trim() ??
          `#${i + 1}`;

        // Image locator (generic, stable)
        const img = card.locator('div.inventory_item_img img');

        // Check if an image exists
        const imgCount = await img.count();
        if (imgCount === 0) {
          issues.push({
            product: name,
            field: 'image element',
            expected: 'present',
            received: 'missing',
          });
          continue;
        }

        // Read data-test & src attributes
        const dataTest = (await img.first().getAttribute('data-test')) ?? '';
        const src = (await img.first().getAttribute('src')) ?? '';

        if (!dataTest) {
          issues.push({
            product: name,
            field: 'img[data-test]',
            expected: 'non-empty',
            received: '(missing)',
          });
          continue;
        }
        if (!src) {
          issues.push({
            product: name,
            field: 'img[src]',
            expected: 'non-empty',
            received: '(missing)',
          });
          continue;
        }

        // Get expected src from mapping
        const expectedSrc = expectedSrcByDataTest[dataTest];
        if (!expectedSrc) {
          issues.push({
            product: name,
            field: 'mapping',
            expected: `known data-test key`,
            received: dataTest,
          });
          continue;
        }

        // Comparison: actual src should contain the expected part (or end with it)
        const matches =
          src.endsWith(expectedSrc) || src.includes(expectedSrc);

        if (!matches) {
          issues.push({
            product: name,
            field: 'src mismatch',
            expected: expectedSrc,
            received: src,
          });
        }

        // Optional: Check visibility & load status (helps with debugging without early failure)
        const isVisible = await img.first().isVisible();
        if (!isVisible) {
          issues.push({
            product: name,
            field: 'image',
            expected: 'visible',
            received: 'not visible',
          });
        }
        try {
          const handle = await img.first().elementHandle({ timeout: 2000 });
          if (handle) {
            const naturalWidth = await handle.evaluate(el => (el as HTMLImageElement).naturalWidth || 0);
            if (naturalWidth <= 0) {
              issues.push({
                product: name,
                field: 'image load',
                expected: 'naturalWidth > 0',
                received: String(naturalWidth),
              });
            }
          } else {
            issues.push({
              product: name,
              field: 'image element',
              expected: 'present',
              received: 'missing (handle)',
            });
          }
        } catch {
          issues.push({
            product: name,
            field: 'image load',
            expected: 'naturalWidth > 0',
            received: 'evaluation timeout/missing element',
          });
        }
      }

      // Console summary
      if (issues.length) {
        // eslint-disable-next-line no-console
        console.table(issues);
      }

      // A hard assertion at the end with a full summary
      expect(
        issues,
        issues.map(i => `[${i.product}] ${i.field}: expected ${i.expected}, got ${i.received}`).join('\n')
      ).toHaveLength(0);
    });
  }
});