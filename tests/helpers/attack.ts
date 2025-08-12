// tests/helpers/attack.ts
import type { Page } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';

/**
 * Simuliert eine Brute-Force / Credential-Stuffing Attacke:
 * - 'attempts' mal hintereinander mit falschen Credentials einloggen
 * - zwischen den Versuchen optional 'delayMs' warten (simuliert realistische Taktung innerhalb eines Rate-Limiting-Fensters)
 * - bricht ab, sobald eine Sperre/Ratelimit erkennbar ist
 */
export async function attack(page: Page, {
  username,
  wrongPassword,
  attempts = 10,
  delayMs = 0,
}: {
  username: string;
  wrongPassword: string;
  attempts?: number;
  delayMs?: number; // bewusst hier zentral: wir simulieren Angreifer-Taktung
}) {
  const login = new LoginPage(page);
  const errors: string[] = [];
  let lockedAt: number | null = null;

  for (let i = 1; i <= attempts; i++) {
    await login.goto(); // saubere Startseite je Versuch (optional, aber stabil)
    await login.login({ username, password: wrongPassword });

    const msg = await login.getErrorMessage();
    errors.push(msg);

    // Heuristik: typische Lock-/Rate-Limit-Hinweise
    const locked = /locked|too many|rate limit|captcha/i.test(msg);
    if (locked) {
      lockedAt = i;
      break;
    }

    // >>> bewusste Simulation der Angreifer-Taktung <<<
    if (delayMs > 0) {
      await page.waitForTimeout(delayMs);
    }
  }

  return {
    locked: lockedAt !== null,
    lockedAt,
    errors,
  };
}