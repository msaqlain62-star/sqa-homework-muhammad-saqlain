import { test, expect } from '@playwright/test';
import { openApp, askAgent, replyCount } from '../src/agent';
import { assertHealthyReply } from '../src/assertions';
import { sel } from '../src/selectors';

test.describe('chat', () => {
  test.beforeEach(async ({ page }) => openApp(page));

  // T2
  test('clicking a suggested topic produces an agent response', async ({ page }) => {
    const before = await replyCount(page);
    const reply = await askAgent(page, { type: 'pill', index: 0 });

    assertHealthyReply(reply);
    expect(await replyCount(page), 'a new reply should be rendered').toBeGreaterThan(before);
  });

  // T3
  test('submitting a free-text question produces an agent response', async ({ page }) => {
    const prompt = 'What can I do here?';
    const reply = await askAgent(page, { type: 'text', prompt });

    // The echo of our own input IS deterministic, so it is safe to assert.
    await expect(sel.transcript(page)).toContainText(prompt);
    assertHealthyReply(reply);

    // Input clears so the user can keep going.
    await expect(sel.chatInput(page)).toHaveValue('');
  });

  // T4 - fill() sets the value directly and would bypass the key handler
  // entirely, so this has to go through real keystrokes to mean anything.
  test('shift+enter inserts a newline instead of sending', async ({ page }) => {
    const input = sel.chatInput(page);
    const before = await replyCount(page);

    await input.click();
    await input.pressSequentially('first line');
    await input.press('Shift+Enter');
    await input.pressSequentially('second line');

    await expect(input).toHaveValue(/first line\s*\n\s*second line/);

    // Negative assertion: give the app a real chance to wrongly send.
    await page.waitForTimeout(1_500);
    expect(await replyCount(page), 'shift+enter must not send').toBe(before);
    await expect(sel.stopButton(page)).toBeHidden();
  });

  // T7 - cheap, and it protects a real backend call.
  test('whitespace-only input cannot be submitted', async ({ page }) => {
    const before = await replyCount(page);
    await sel.chatInput(page).fill('   ');

    const send = sel.sendButton(page);
    if (await send.isEnabled()) {
      await send.click();
      await page.waitForTimeout(1_500);
    }

    expect(await replyCount(page), 'blank input must not reach the agent').toBe(before);
  });
});
