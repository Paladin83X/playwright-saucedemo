/**
 * NOTE: This test is designed to verify the login behavior for a specific, locked-out user account.
 * It ensures that when a user with the username 'locked_out_user' attempts to log in with the correct password,
 * the application correctly rejects the login attempt and displays the appropriate error message,
 * confirming that the account is properly locked.
 */

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Login test for locked_out_user', () => {
  test('locked_out_user cannot log in', async ({ page }) => {
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