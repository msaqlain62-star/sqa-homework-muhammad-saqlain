import type { Page } from '@playwright/test';

/**
 * Every locator the suite uses lives here.
 *
 * The app ships stable `data-testid` hooks on the chat controls and auth
 * buttons, so those are anchored to test ids and will survive restyling.
 *
 * The suggested-topic pills are the one exception - they ship no test id, so
 * PILL_CONTAINER is a structural CSS locator and is the single most likely
 * thing to break. It is isolated here on purpose: one line to fix, not a
 * suite-wide rewrite. See README "Next steps" - asking for a
 * `data-testid="suggested-topic"` is the real fix.
 *
 * Verify all of these resolve against the live site with:  npm run verify
 */

// TUNE ME if the landing layout changes.
export const PILL_CONTAINER = '.flex.gap-2';

export const sel = {
  cookieAccept: (p: Page) => p.getByRole('button', { name: /accept all/i }),

  chatInput: (p: Page) => p.getByTestId('agent-chat-input'),
  sendButton: (p: Page) => p.getByTestId('agent-chat-input-send-button'),
  stopButton: (p: Page) => p.getByTestId('agent-chat-input-stop-button'),

  signUp: (p: Page) => p.getByTestId('sign-up-button'),
  logIn: (p: Page) => p.getByTestId('log-in-button'),

  pills: (p: Page) => p.locator(`${PILL_CONTAINER} > *`),

  /** Root the transcript diff reads from. #root is the app mount - deliberately
   *  coarse, because a coarse container is immune to bubble markup changes. */
  transcript: (p: Page) => p.locator('#root'),
};

export const BASE_URL = 'https://ask.permission.ai/';
