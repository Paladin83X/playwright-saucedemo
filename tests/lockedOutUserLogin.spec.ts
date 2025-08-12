// This test explicitly targets only the `locked_out_user` account.
// The User Pool is not used here because parallel execution with other users is unnecessary.
// We want deterministic, isolated verification of the lockout behavior for this specific account.

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Login-Test für locked_out_user', () => {
  test('locked_out_user kann sich nicht einloggen', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Navigate to the login page
    await loginPage.goto();

    // Login with locked_out_user
    await loginPage.login({
      username: 'locked_out_user',
      password: 'secret_sauce'
    });

    // Expect: Error message is displayed
    const errorMessage = page.locator('[data-test="error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText(/Sorry, this user has been locked out/i);
  });
});