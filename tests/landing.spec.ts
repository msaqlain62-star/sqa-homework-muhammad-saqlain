import { test, expect } from '@playwright/test';
import { openApp } from '../src/agent';
import { sel } from '../src/selectors';

test.describe('landing', () => {
  test.beforeEach(async ({ page }) => openApp(page));

  // T1
  test('renders suggested topics and an editable ask input', async ({ page }) => {
    const pills = sel.pills(page);
    await expect(pills.first()).toBeVisible();
    expect(await pills.count(), 'expected at least one suggested topic').toBeGreaterThan(0);

    // Asserting on pill *copy* would fail every time marketing edits a topic,
    // so we assert they exist and are actionable instead.
    await expect(pills.first()).toBeEnabled();
    await expect(sel.chatInput(page)).toBeEditable();
  });

  // T8 - the pre-login page's actual business job is conversion.
  test('offers log in and sign up routes into the product', async ({ page }) => {
    await expect(sel.logIn(page)).toBeVisible();
    await expect(sel.signUp(page)).toBeVisible();

    await sel.logIn(page).click();
    // Assert the auth form's controls, not its paragraph copy.
    await expect(page.getByTestId('login-signup-link')).toBeVisible();
  });
});
