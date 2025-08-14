/**
 * BasePage
 * --------
 * This class serves as the foundation for all Page Objects.
 * It provides common utility methods for interacting with page elements
 * in a consistent and reliable way, including guarded clicks and fills.
 * By using these methods in derived page objects, we ensure:
 * - Unified interaction style across tests
 * - Better readability and maintainability
 * - Centralized control of waiting/assertion behavior
 */

import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  constructor(protected readonly page: Page) {}

  // Create a locator from a selector
  protected $(selector: string): Locator {
    return this.page.locator(selector);
  }

  // Click element after ensuring it's visible and enabled
  async click(selector: string) {
    const el = this.$(selector);
    await expect(el).toBeVisible();
    await expect(el).toBeEnabled();
    await el.click();
  }

  // Fill input after ensuring it's visible and editable
  async fill(selector: string, value: string) {
    const el = this.$(selector);
    await expect(el).toBeVisible();
    await expect(el).toBeEditable();
    await el.fill(value);
  }

  // Click element and wait for specific URL change
  async clickAndWaitForUrl(selector: string, urlRegex: RegExp) {
    await Promise.all([
      this.page.waitForURL(urlRegex),
      this.click(selector),
    ]);
  }
}
