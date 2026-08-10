/**
 * Fast health check for every locator the suite depends on.
 * Run after any UI change:  npm run verify
 */
import { chromium } from '@playwright/test';
import { sel, BASE_URL } from '../src/selectors';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  const accept = sel.cookieAccept(page);
  if (await accept.isVisible({ timeout: 8_000 }).catch(() => false)) await accept.click();
  await page.waitForTimeout(3_000);

  const checks: [string, () => Promise<number>][] = [
    ['chat input', () => sel.chatInput(page).count()],
    ['send button', () => sel.sendButton(page).count()],
    ['log in', () => sel.logIn(page).count()],
    ['sign up', () => sel.signUp(page).count()],
    ['suggested pills', () => sel.pills(page).count()],
    ['transcript root', () => sel.transcript(page).count()],
  ];

  let bad = 0;
  for (const [name, fn] of checks) {
    const n = await fn().catch(() => 0);
    const ok = n > 0;
    if (!ok) bad++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(18)} found=${n}`);
  }

  console.log(
    bad
      ? `\n${bad} locator(s) broken - fix src/selectors.ts`
      : '\nAll locators resolve.'
  );
  await browser.close();
  process.exit(bad ? 1 : 0);
})();
