import { test, expect } from '@playwright/test';
import { attack } from './helpers/attack';

test.describe('Security: Rate Limiting / Brute-Force Schutz', () => {
  test('Login attempts should trigger lockout or rate limit', async ({ page }) => {
    const RESULT = await attack(page, {
      // Variante A: existierender Nutzer mit falschem Passwort (typischer Angriffsvektor)
      username: 'standard_user',
      wrongPassword: 'definitely_wrong_password',
      attempts: 10,

      // Erklärung: Viele Systeme erkennen "X Fehlversuche innerhalb Y Sekunden"
      // 400–800ms sind realistisch für Bots, ohne Flood-Protection zu triggern.
      delayMs: 400,
    });

    // Erwartung: Irgendeine Form von Sperre tritt ein
    // Wenn nicht: Test FAIL (fehlendes Rate Limiting)
    expect.soft(RESULT.locked, `No rate limit/lockout detected after ${RESULT.errors.length} attempts.
Last error message: "${RESULT.errors.at(-1) ?? ''}"`).toBeTruthy();
  });
});