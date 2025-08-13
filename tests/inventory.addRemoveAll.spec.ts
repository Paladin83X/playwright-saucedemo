// tests/inventory.addRemoveAll.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

// Users anpassen (locked_out_user auslassen, da Login fehlschlägt)
const USERS = [
  //'standard_user',
  //'visual_user',
  'problem_user',
  //'error_user',
];

async function getBadgeCount(page): Promise<number> {
  const badge = page.locator('.shopping_cart_badge'); // SauceDemo hat hier kein data-test
  if (!(await badge.count())) return 0;
  if (!(await badge.isVisible())) return 0;
  const txt = (await badge.textContent())?.trim() ?? '0';
  const n = Number(txt);
  return Number.isFinite(n) ? n : 0;
}

test.describe('Inventory – add & remove all items with cart badge validation (soft aggregation)', () => {
  for (const username of USERS) {
    test(`Add & remove all items for user: ${username}`, async ({ page }) => {
      const login = new LoginPage(page);
      await login.goto();
      await login.login({ username, password: 'secret_sauce' });

      const inventory = new InventoryPage(page);
      const sel = inventory.getSelectors();
      await inventory.expectLoaded();

      const issues: { step: string; expected: string; received: string }[] = [];
      const report: Array<{ step: string; item?: string; success?: boolean; expected?: string; received?: string }> = [];

      const cards = page.locator(sel.inventoryItem);
      const totalItems = await cards.count();
      if (totalItems === 0) {
        issues.push({ step: 'initial load', expected: '>= 1 inventory item', received: '0 items' });
      }

      // --- Alle Items hinzufügen; nach jedem Klick 2 Report-Zeilen erzeugen ---
      let added = 0;
      for (let i = 0; i < totalItems; i++) {
        const card = cards.nth(i);
        const name = (await card.locator(sel.inventoryItemName).textContent())?.trim() ?? `#${i + 1}`;
        const addBtn = card.locator(sel.addToCartButton);

        let clickSuccess = false;
        if (await addBtn.isVisible()) {
          try {
            await addBtn.click();
            clickSuccess = true;
          } catch {
            clickSuccess = false;
          }
        } else {
          clickSuccess = false;
        }

        // Report-Zeile 1: Button/Artikel Add to cart geklickt = erfolgreich = true/false
        report.push({
          step: 'Add to cart clicked',
          item: name,
          success: clickSuccess,
        });

        // Nur wenn der Klick als "erfolgreich" galt, Badge erhöhen
        if (clickSuccess) added += 1;

        const badgeVal = await getBadgeCount(page);
        const expectedBadge = added;

        // Report-Zeile 2: 'cart badge == N' expected/received
        report.push({
          step: `cart badge == ${expectedBadge}`,
          item: name,
          expected: String(expectedBadge),
          received: String(badgeVal),
        });

        if (badgeVal !== expectedBadge) {
          issues.push({
            step: `after add "${name}"`,
            expected: `cart badge == ${expectedBadge}`,
            received: `cart badge == ${badgeVal}`,
          });
        }

        // Wenn der Klick nicht erfolgreich war, gleich als Issue protokollieren
        if (!clickSuccess) {
          issues.push({
            step: `add "${name}"`,
            expected: 'add button clickable',
            received: 'click failed or button not visible',
          });
        }
      }

      // Endstand nach Hinzufügen prüfen (optional, hier ohne Extra-Reportzeile)
      const badgeAfterAdds = await getBadgeCount(page);
      if (badgeAfterAdds !== added || added !== totalItems) {
        issues.push({
          step: 'after all adds',
          expected: `badge == ${totalItems} & added == ${totalItems}`,
          received: `badge == ${badgeAfterAdds} & added == ${added}`,
        });
      }

      // --- 'post-add state' beibehalten: Anzahl sichtbarer Remove-Buttons prüfen ---
      const removeButtonsVisible = await page.locator(`${sel.inventoryItem} ${sel.removeButton}`).count();
      if (removeButtonsVisible < totalItems) {
        issues.push({
          step: 'post-add state',
          expected: `${totalItems} remove buttons`,
          received: `${removeButtonsVisible}`,
        });
      }

      // --- Alle Items wieder entfernen; Badge nach jedem Klick prüfen ---
      let remaining = added;
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
        if (badge !== remaining) {
          issues.push({
            step: `after remove "${name}"`,
            expected: `cart badge == ${remaining}`,
            received: `cart badge == ${badge}`,
          });
        }
      }

      // --- 'after all removes' beibehalten: Badge sollte weg oder 0 sein ---
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

      // --- Report ausgeben (zeigt die beiden geforderten Zeilen pro Button) ---
      // eslint-disable-next-line no-console
      console.table(report);

      // --- Harte Assertion am Ende mit vollständiger Zusammenfassung ---
      expect(
        issues,
        issues.map(i => `[${i.step}] expected ${i.expected}, got ${i.received}`).join('\n')
      ).toHaveLength(0);
    });
  }
});
