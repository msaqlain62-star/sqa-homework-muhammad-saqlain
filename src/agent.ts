import { expect, type Page } from '@playwright/test';
import { sel, BASE_URL } from './selectors';

const STREAM_TIMEOUT = 90_000;

/**
 * Auto-click the OneTrust cookie banner the instant it appears, for the life
 * of the page.
 *
 * It loads on a delay (GTM-driven) well after `domcontentloaded` and can pop
 * up at any point afterward - including mid-click on something else - where
 * it silently eats every pointer event until dismissed. A one-shot check
 * before each interaction isn't enough since the banner can appear *during*
 * that interaction. A DOM-side watcher that reacts the moment the button
 * exists is immune to that race.
 */
async function installCookieBannerAutoDismiss(page: Page) {
  await page.addInitScript(() => {
    const tryDismiss = () => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        /accept all/i.test(b.textContent || '')
      );
      if (btn) {
        (btn as HTMLButtonElement).click();
        return true;
      }
      return false;
    };
    const interval = setInterval(() => {
      if (tryDismiss()) clearInterval(interval);
    }, 200);
    setTimeout(() => clearInterval(interval), 30_000);
  });
}

/** Land on the app with the cookie banner out of the way. */
export async function openApp(page: Page) {
  // Safety net: if the banner shows up again later (e.g. after a route
  // change), don't let it silently eat clicks for the rest of the test.
  await installCookieBannerAutoDismiss(page);

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  const accept = sel.cookieAccept(page);
  if (await accept.isVisible({ timeout: 8_000 }).catch(() => false)) {
    await accept.click().catch(() => {});
  }
  // OneTrust/GTM can still be mid-render at this point - its own consent-copy
  // text lives inside #root, same as the transcript. Let it fully settle
  // *before* any test reads a baseline transcript, or a banner mutation that
  // lands mid-read gets misdiffed as part of the agent's reply.
  await page.waitForTimeout(3_000);

  await expect(sel.chatInput(page)).toBeVisible();
}

async function transcriptText(page: Page): Promise<string> {
  return (await sel.transcript(page).innerText()).trim();
}

/**
 * Isolate what changed between two transcript reads.
 *
 * `#root` isn't append-only: below the message list sits constant trailing
 * copy (a legal disclaimer). A new reply is inserted *before* that footer,
 * not appended after it, so `after.slice(before.length)` lands inside the
 * unchanged footer instead of the reply. Trimming the longest common prefix
 * and the longest common suffix instead isolates the inserted block
 * regardless of what's fixed before or after it.
 */
function diffMiddle(before: string, after: string): string {
  const maxStart = Math.min(before.length, after.length);
  let start = 0;
  while (start < maxStart && before[start] === after[start]) start++;

  let endBefore = before.length;
  let endAfter = after.length;
  while (endBefore > start && endAfter > start && before[endBefore - 1] === after[endAfter - 1]) {
    endBefore--;
    endAfter--;
  }

  return after.slice(start, endAfter);
}

/**
 * Wait for a streamed agent reply to finish.
 *
 * Why this shape:
 *  - The app toggles send -> stop -> send around a stream, so "stop button is
 *    gone" is the app's own signal that generation ended. That beats polling
 *    text alone.
 *  - We do NOT assert the stop button appears first. A fast reply can finish
 *    before the check runs and the test would fail on a working app. Instead we
 *    poll for the TERMINAL state, which is race-free in both directions.
 *  - We also require the transcript to stop growing across consecutive polls,
 *    so we don't read a half-rendered reply if the control flips early.
 *  - No fixed sleeps anywhere: the wait ends when the app is done, not when a
 *    number we guessed expires.
 */
export async function waitForStreamToSettle(page: Page, baselineLength: number) {
  let lastLength = -1;
  let stableTicks = 0;

  await expect
    .poll(
      async () => {
        const streaming = await sel.stopButton(page).isVisible().catch(() => false);
        const len = (await transcriptText(page)).length;

        stableTicks = len === lastLength ? stableTicks + 1 : 0;
        lastLength = len;

        return !streaming && len > baselineLength && stableTicks >= 2;
      },
      { timeout: STREAM_TIMEOUT, intervals: [250, 250, 500, 500, 1000] }
    )
    .toBe(true);
}

export interface AgentReply {
  /** The reply text, with the echoed prompt stripped out. */
  text: string;
  /** Length of the first non-empty chunk observed - proves it streamed. */
  firstChunkLength: number;
}

/**
 * Send a prompt (typed, or by clicking a suggested topic) and capture the reply.
 *
 * The reply is read as a diff of the transcript container rather than by
 * selecting a message bubble. That keeps the suite independent of bubble markup
 * entirely - a restyle of the chat list does not touch this code.
 */
export async function askAgent(
  page: Page,
  action: { type: 'text'; prompt: string } | { type: 'pill'; index: number }
): Promise<AgentReply> {
  const before = await transcriptText(page);
  const baseline = before.length;

  let echoed = '';
  if (action.type === 'text') {
    echoed = action.prompt;
    await sel.chatInput(page).click();
    await sel.chatInput(page).fill(action.prompt);
    await sel.sendButton(page).click();
  } else {
    const pill = sel.pills(page).nth(action.index);
    echoed = (await pill.innerText()).trim();
    await pill.click();
  }

  // Sample the first visible growth so we can prove the reply streamed in
  // rather than being pasted in one frame.
  let firstChunkLength = 0;
  await expect
    .poll(
      async () => {
        const len = (await transcriptText(page)).length;
        if (len > baseline + echoed.length && firstChunkLength === 0) {
          firstChunkLength = len - baseline;
        }
        return len > baseline;
      },
      { timeout: 20_000, intervals: [150, 150, 250] }
    )
    .toBe(true);

  await waitForStreamToSettle(page, baseline);

  const after = await transcriptText(page);
  const delta = diffMiddle(before, after);

  // Strip the echoed prompt and any transient status copy the app renders.
  const text = delta
    .replace(echoed, '')
    .replace(/Permission is typing\.\.\./gi, '')
    .replace(/Feedback/gi, '')
    .trim();

  return { text, firstChunkLength };
}

/** Count of rendered agent replies, via the per-reply feedback control. */
export async function replyCount(page: Page): Promise<number> {
  return page.getByTestId('feedback-button').count();
}
