/**
 * This test is designed to verify the application's security against brute-force login attacks.
 * It simulates a series of rapid, failed login attempts for an existing user ('standard_user')
 * with an incorrect password.
 *
 * The purpose is to check if the application implements a **rate-limiting or lockout mechanism**.
 * 
 * The 'delayMs' parameter is set to a realistic value for automated bots (400-800ms),
 * aiming to bypass simple protections.
 */
import { test, expect } from '@playwright/test';
import { attack } from './helpers/attack';

test.describe('Security: Rate Limiting / Brute-Force Protection', () => {
  test('Login attempts should trigger lockout or rate limit', async ({ page }) => {
    const RESULT = await attack(page, {
      // Scenario: Existing user with a wrong password (a typical attack vector)
      username: 'standard_user',
      wrongPassword: 'definitely_wrong_password',
      attempts: 15,

      // Rationale: Many systems detect "X failed attempts within Y seconds".
      // 400–800ms is a realistic delay for bots that aim to avoid flood protection.
      delayMs: 400,
    });

    // Expectation: Some form of lockout or rate limit is triggered.
    // If not: The test fails (due to a lack of rate limiting).
    expect.soft(RESULT.locked, `No rate limit/lockout detected after ${RESULT.errors.length} attempts.
Last error message: "${RESULT.errors.at(-1) ?? ''}"`).toBeTruthy();
  });
});