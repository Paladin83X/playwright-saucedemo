/**
 * ### LoginPage
 *
 * This Page Object encapsulates the functionality related to the login page of the application.
 * It provides methods for user interaction and validation, such as navigating to the page,
 * performing a login, and asserting the expected outcomes (successful login or an error message).
 * The selectors for all key elements on the login page are defined centrally to make maintenance easier.
 */
import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';
import type { User } from '../fixtures/user-pool';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Central selectors
  private readonly sel = {
    username: '[data-test="username"]',
    password: '[data-test="password"]',
    loginBtn: '[data-test="login-button"][type="submit"]',
    error: '[data-test="error"]',
    inventoryList: '[data-test="inventory-list"]',
  };

  /**
   * Navigates to the login page.
   */
  async goto() {
    await this.page.goto('/');
  }

  /**
   * Fills in credentials and clicks the login button.
   * Does not assert success here—use expectLoggedIn() or expectError().
   */
  async login(user: User) {
    await this.fill(this.sel.username, user.username);
    await this.fill(this.sel.password, user.password);
    await this.click(this.sel.loginBtn);
  }

  /**
   * Asserts a successful login: the inventory page is visible
   * and the URL contains inventory.html.
   */
  async expectLoggedIn() {
    await expect(this.page).toHaveURL(/inventory\.html/);
    await expect(this.page.locator(this.sel.inventoryList)).toBeVisible();
  }

  /**
   * Asserts that an error message is displayed (e.g., for locked_out_user or wrong credentials).
   * @param messagePart - A substring that is expected to be present in the error message.
   */
  async expectError(messagePart: string) {
    await expect(this.page.locator(this.sel.error)).toContainText(messagePart);
  }

  /**
   * Optional helper that combines login() with a success assertion.
   */
  async loginAndExpectSuccess(user: User) {
    await this.login(user);
    await this.expectLoggedIn();
  }

  async getErrorMessage(): Promise<string> {
    const error = this.page.locator(this.sel.error);
    if (await error.isVisible()) {
      return (await error.textContent())?.trim() ?? '';
    }
    return '';
  }
}
