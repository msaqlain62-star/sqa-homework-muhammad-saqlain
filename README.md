# Senior Quality Assurance Engineer — Take-Home

Automated coverage of the pre-login agent experience at https://ask.permission.ai, plus a design for validating an answer that is different every run.

## Setup

```bash
npm install
npx playwright install chromium

# optional: enables the Promptfoo rubric check (1 of 8 tests)
cp .env.example .env   # add OPENAI_API_KEY

npm test               # run the suite
npm run report         # open the HTML report
npm run verify         # health-check every locator after a UI change
```

Without `OPENAI_API_KEY` the suite runs 7 tests and skips the rubric with a visible reason.

## Test strategy (TL;DR)

Eight tests, chosen for the failures that would actually hurt: the page renders its topics, both entry paths (pill and free text) produce a real streamed answer, Shift+Enter does not send, blank input never reaches the agent, the flow survives a phone viewport, the conversion routes exist, and one answer is graded for quality rather than wording.

Skipped on purpose: network-failure injection (no pre-login hook, and route mocks test my mock, not the contract), long-input and injection-string rendering (a separate security pass), multi-turn context retention (doubles runtime and flake surface for one more signal), and full accessibility (a real gap, but an audit, not a smoke test).

## Key decisions

- **Playwright + TypeScript.** Auto-waiting, first-class mobile emulation, one runtime. Rejected Selenium (manual waits, slower feedback) and Cypress (weaker multi-viewport story).
- **Locators anchor to the `data-testid` hooks the app already ships** (`agent-chat-input`, `agent-chat-input-send-button`, `agent-chat-input-stop-button`, `log-in-button`, `sign-up-button`). A restyle does not touch them. The suggested-topic pills ship no test id, so that one structural CSS locator is quarantined in `src/selectors.ts` as a single tunable line — and `npm run verify` tells you in seconds if it broke.
- **Waiting is driven by the app's own state machine, not by sleeps.** The send button becomes a stop button while generating. I poll for the *terminal* state — stop control gone, transcript grown, length stable across consecutive polls. Asserting the stop button appears *first* would race a fast reply and fail a working app; polling the end state is race-free in both directions. There is not one fixed sleep in the response path.
- **Reply text is captured as a transcript diff, not by selecting a message bubble.** The suite therefore has no dependency on chat-list markup at all — the most volatile part of any chat UI can be rewritten without touching a test.
- **Assertions never touch response wording.** Structure, length band, leaked-error strings, render artefacts, proof that it streamed, topical keyword threshold, then a semantic rubric. See `artifacts/assertions.md`.
- **Promptfoo over DeepEval/Ragas** — both are Python and would add a second runtime, breaking the five-minute install gate. Promptfoo runs in-process and grades the answer actually captured from the browser.
- **`fill()` is deliberately not used for the Shift+Enter test.** It sets the value directly and bypasses the key handler, so the test would assert nothing. That one uses real keystrokes.
- **Serial, one worker, one retry.** The agent is a shared live service; parallelism buys rate-limit flakes, and more than one retry hides real ones.

## AI disclosure

See `artifacts/ai-workflow.md`.

## Next steps (1–2 more days)

Ask for a `data-testid` on the suggested-topic pills and on the message bubbles, which removes the last fragile locator. Add the suite to GitHub Actions — the seven deterministic tests on every pull request as a release gate, the rubric test nightly so model drift never blocks a merge. Build a golden set of ~20 prompts scored against the rubric, tracked over time so a prompt or model change shows up as a score drop rather than a support ticket. Add multi-turn context retention and a stop-button interruption test.

## Submission checklist

- [x] Repo named `sqa-homework-muhammad-saqlain` and default branch is `main`
- [x] README includes exact Setup + run commands (verified from a clean clone)
- [x] README word count ≤ 500 (excluding commands/checkboxes)
- [x] Max 8 tests; all 4 required behaviours covered
- [x] `artifacts/assertions.md` included (≤ 300 words)
- [x] At least one assertion wired into an evaluation framework and running as part of the suite
- [ ] `artifacts/ux-review.md` included (≤ 400 words, desktop + mobile, post-signup exploration, 3–5 prioritized improvements)
- [x] `artifacts/data-checks.md` included (≤ 300 words + SQL)
- [ ] `artifacts/ai-workflow.md` included (≤ 300 words, all 4 questions answered)
- [ ] `artifacts/report/` included
- [ ] `artifacts/demo.mp4` included (60–90 sec, narrated)
- [ ] Commit history shows how the work evolved
