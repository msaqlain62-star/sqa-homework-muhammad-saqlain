import { test, expect, devices } from '@playwright/test';
import { openApp, askAgent } from '../src/agent';
import { assertHealthyReply } from '../src/assertions';
import { sel } from '../src/selectors';

test.use({ ...devices['iPhone 13'] });

// T6 - the chat surface is the product; if it fails on a phone it fails.
test('the ask flow works on a phone viewport without horizontal overflow', async ({ page }) => {
  await openApp(page);

  await expect(sel.pills(page).first()).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  );
  expect(overflow, 'page scrolls sideways on mobile').toBe(false);

  const reply = await askAgent(page, { type: 'text', prompt: 'How do I earn?' });
  assertHealthyReply(reply);

  // The input must stay reachable after a reply lands, or the conversation dead-ends.
  await expect(sel.chatInput(page)).toBeInViewport();
});
