# AI workflow

## Tools used, and why

**Claude** for the suite scaffolding, the write-ups, and as a sounding board on assertion design. Picked over Copilot because the hard part here was not autocomplete — it was arguing through *what to assert on a response that changes every run*, which needs a conversation, not a suggestion in the gutter.

**Playwright codegen** for locator discovery. Not a language model, but it did the recon: it surfaced the `data-testid` hooks and, critically, `agent-chat-input-stop-button` — which became the whole waiting strategy.

## Generated vs. rewritten

Generated and kept largely intact: the repo scaffold, config, the Promptfoo wiring, and the SQL in `data-checks.md`.

Rewritten by me: the test selection. The first pass I was given was a coverage list — eight shallow smoke checks. The brief is explicit that choosing the eight *is* the evaluation, so I cut it down and traded breadth for the failures that would actually hurt, and wrote out what I was skipping and why.

Also rewritten: every `toContainText` assertion. Codegen produced blobs like `'Log in to your accountWelcome back! Please enter your details.Email...'`. Those pass today and break the first time someone edits a comma. They are gone.

## What the AI got wrong that I caught

Two things.

It proposed counting agent replies via `data-testid="feedback-button"`. That test id came from a dump I took **while logged in** — I had not confirmed it renders pre-login, where the whole suite runs. The counter would have been built on an element that may not exist in the tested state.

Earlier it proposed a waiting strategy of polling response text until it stopped growing. Workable, but once codegen surfaced the stop button I replaced it: the app has its own streaming state machine, and waiting on the app's signal beats inferring one from text length. The final helper keeps text-stability only as a secondary guard.

## Built by hand / not trusted to AI

The user-experience review. Those findings came from using the product on desktop and on a phone — an AI cannot observe an interface it has not loaded, and a plausible-sounding review of a product nobody looked at is exactly the generic submission this exercise screens for.
