import { Page, expect } from '@playwright/test';
import type { User } from '../fixtures/user-pool';

export class LoginPage {
  constructor(private page: Page) {}

  // Zentrale Selektoren 
  private readonly sel = {
    username: '[data-test="username"]',
    password: '[data-test="password"]',
    loginBtn: '[data-test="login-button"][type="submit"]',
    error:   '[data-test="error"]',
   // inventoryList: '.inventory_list',
    inventoryList: '[data-test="inventory-list"]',
  };

  /**
   * Öffnet die Login-Seite. page.goto wartet bereits ausreichend;
   * kein zusätzliches waitForNavigation nötig.
   */
  async goto() {
    await this.page.goto('/');
  }

  /**
   * Füllt Credentials aus und klickt auf Login.
   * Wartet vor dem Klick, bis der Button sichtbar ist (damit er wirklich klickbar ist).
   * Diese Methode prüft NICHT den Erfolg – nutze dafür expectLoggedIn() oder expectError().
   */
  async login(user: User) {
    await this.page.locator(this.sel.username).fill(user.username);
    await this.page.locator(this.sel.password).fill(user.password);

    const loginButton = this.page.locator(this.sel.loginBtn);
    await expect(loginButton).toBeVisible(); 
    await loginButton.click();
  }

  /**
   * Erwartet einen erfolgreichen Login: Inventarseite mit Liste sichtbar
   * und URL enthält inventory.html.
   */
  async expectLoggedIn() {
    await expect(this.page).toHaveURL(/inventory\.html/);
    await expect(this.page.locator(this.sel.inventoryList)).toBeVisible();
  }

  /**
   * Erwartet eine Fehlermeldung (z. B. für locked_out_user oder falsche Credentials).
   * messagePart: Teilstring, der in der Fehlermeldung vorkommen soll.
   */
  async expectError(messagePart: string) {
    await expect(this.page.locator(this.sel.error)).toContainText(messagePart);
  }

  /**
   * Optionaler Helper: kombiniert login() + Erfolgserwartung.
   * Praktisch für Happy-Path-Tests.
   */
  async loginAndExpectSuccess(user: User) {
    await this.login(user);
    await this.expectLoggedIn();
  }

  async getErrorMessage(): Promise<string> {
  const error = this.page.locator('[data-test="error"]');
  if (await error.isVisible()) {
    return (await error.textContent())?.trim() ?? '';
  }
  return '';
}
}