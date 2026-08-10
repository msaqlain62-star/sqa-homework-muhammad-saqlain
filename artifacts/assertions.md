# Validating a non-deterministic response

Prompt: **"What is Permission?"** — implemented in `tests/response-quality.spec.ts`, assertion logic in `src/assertions.ts`, rubric in `src/eval.ts`.

## What I assert

1. **A reply exists and is non-empty.** `assertHealthyReply`.
2. **Length sits in a band** (40–4000 chars). Under 40 the agent stubbed out; over 4000 generation ran away. Both are real failures no content check would catch.
3. **No leaked failure strings** — `undefined`, `[object Object]`, `NaN`, `rate limit`, `Internal Server Error`. These are the shapes a broken chat surface actually renders. A reply can be perfectly well-formed prose and still be a bug if one of these is in it.
4. **No rendering artefacts** — unbalanced ``` fences, unrendered `{{placeholder}}`.
5. **It streamed.** I sample the first visible chunk and assert the final text is longer. If the app ever regresses to dumping the whole answer in one frame, that is a UX regression the eye would miss.
6. **On topic by threshold** — at least 3 of `permission, data, earn, ask, reward, control, own`. A threshold survives rewording; a phrase match does not.
7. **Semantic grade** via Promptfoo `llm-rubric`.

## What I deliberately do NOT assert

- **Exact or partial response text.** The brief flags this as the trap and it is: the answer changes every run, so any string assertion is a scheduled false failure.
- **Response time.** A shared live agent under variable load — an SLA assertion here measures the network, not the product.
- **Specific facts or numbers** (token amounts, rates). Those come from a model and change; asserting them turns a content update into a red build.
- **Sentence or paragraph count.** Style, not correctness.

## Why an eval framework on top

I chose **Promptfoo** over DeepEval and Ragas because both are Python: adding one would put a second runtime in a TypeScript repo and break the five-minute install gate. Promptfoo runs in-process via its Node API, and the `echo` provider lets me grade the *actual streamed answer captured from the browser* rather than re-querying a model and grading something the user never saw.

It catches the one failure the plain assertions structurally cannot: a fluent, correctly-shaped, correctly-length answer that is confidently about the wrong company, or that trails off mid-sentence. Every check above would pass that. The rubric fails it.

The rubric needs `OPENAI_API_KEY`. Without it the check **skips loudly** rather than passing — a green run that silently graded nothing is worse than a visible skip.
