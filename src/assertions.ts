import { expect } from '@playwright/test';
import type { AgentReply } from './agent';

/**
 * Failure modes we have actually seen leak into chat surfaces. If any of these
 * strings survive into a reply, the app is broken even if the reply "looks" fine.
 */
const LEAKED_FAILURES = [
  'something went wrong',
  'an error occurred',
  'rate limit',
  'undefined',
  'null',
  '[object Object]',
  'NaN',
  'Internal Server Error',
];

/** Sane bounds. Below MIN a reply is a stub; above MAX generation ran away. */
const MIN_CHARS = 40;
const MAX_CHARS = 4_000;

/**
 * Assertions that hold for ANY reasonable answer and fail on a broken one.
 * Deliberately says nothing about wording - see artifacts/assertions.md.
 */
export function assertHealthyReply(reply: AgentReply) {
  const { text, firstChunkLength } = reply;

  // Structural: there is a reply at all.
  expect(text.length, 'reply should not be empty').toBeGreaterThan(0);

  // Length band.
  expect(text.length, `reply too short to be a real answer: "${text}"`).toBeGreaterThan(MIN_CHARS);
  expect(text.length, 'reply length ran away').toBeLessThan(MAX_CHARS);

  // Error leakage.
  const lower = text.toLowerCase();
  for (const bad of LEAKED_FAILURES) {
    expect(lower, `reply leaked a failure string: "${bad}"`).not.toContain(bad.toLowerCase());
  }

  // Rendering artefacts: unclosed code fences, raw template placeholders.
  expect((text.match(/```/g) ?? []).length % 2, 'unbalanced code fence').toBe(0);
  expect(text, 'unrendered template placeholder').not.toMatch(/\{\{.+?\}\}/);

  // Streaming actually happened: the reply grew rather than appearing at once.
  expect(firstChunkLength, 'reply did not stream in').toBeLessThan(text.length);
}

/**
 * Topical check by threshold, not by phrase. Any sane answer about Permission
 * hits several of these; an answer about something else hits almost none.
 */
export function assertOnTopic(text: string, terms: string[], minHits: number) {
  const lower = text.toLowerCase();
  const hits = terms.filter((t) => lower.includes(t.toLowerCase()));
  expect(
    hits.length,
    `expected >=${minHits} of [${terms.join(', ')}], got [${hits.join(', ')}] in: "${text.slice(0, 200)}"`
  ).toBeGreaterThanOrEqual(minHits);
}

export const PERMISSION_TERMS = ['permission', 'data', 'earn', 'ask', 'reward', 'control', 'own'];
