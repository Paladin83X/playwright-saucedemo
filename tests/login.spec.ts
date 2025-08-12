import { test } from '../fixtures/user-pool';
import { LoginPage } from '../pages/LoginPage';

test.describe('Login Tests mit User-Pool', () => {

  test('Login-Test für jeden Worker-User', async ({ page, workerUser }) => {
    console.log(`Running test with user: ${workerUser.username}`);
    const loginPage = new LoginPage(page);

    // Login-Seite öffnen
    await loginPage.goto();

    // Login ausführen
    await loginPage.login(workerUser);

    // Verhalten abhängig vom Benutzer prüfen
    if (workerUser.username === 'locked_out_user') {
      // Locked Out User → Fehlermeldung erwarten
      await loginPage.expectError('locked out');
    } else {
      // Alle anderen → Erfolgreich eingeloggt
      await loginPage.expectLoggedIn();
    }
  });

});