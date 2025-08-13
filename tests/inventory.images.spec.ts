// tests/inventory.imageMapping.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

// Passe hier die gewünschten Nutzer an
const USERS = [
  //'standard_user',
  'visual_user',
  'problem_user',
  // 'performance_glitch_user',
  // 'error_user',
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

      // Erwartete Zuordnung: img[data-test] → erwarteter src (mit Hash)
      // Wir prüfen, dass der tatsächliche src den erwarteten Teil enthält (endsWith oder includes).
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

      // Alle Karten einsammeln
      const cards = page.locator('[data-test="inventory-item"]');
      const count = await cards.count();

      for (let i = 0; i < count; i++) {
        const card = cards.nth(i);

        // Produktname (nur fürs Reporting)
        const name =
          (await card.locator('[data-test="inventory-item-name"]').textContent())?.trim() ??
          `#${i + 1}`;

        // Bild-Locator (generisch, stabil)
        const img = card.locator('div.inventory_item_img img');

        // Existiert ein Bild?
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

        // data-test & src auslesen
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

        // Erwarteten src aus Mapping holen
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

        // Vergleich: tatsächlicher src soll den erwarteten Teil enthalten (oder damit enden)
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

        // Optional: Sichtbarkeit & Ladezustand prüfen (hilft beim Debugging, ohne früh zu failen)
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

      // Übersicht in der Konsole
      if (issues.length) {
        // eslint-disable-next-line no-console
        console.table(issues);
      }

      // Eine harte Assertion am Ende mit kompletter Zusammenfassung
      expect(
        issues,
        issues.map(i => `[${i.product}] ${i.field}: expected ${i.expected}, got ${i.received}`).join('\n')
      ).toHaveLength(0);
    });
  }
});
