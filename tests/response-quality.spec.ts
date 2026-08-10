import { test, expect } from '@playwright/test';
import { openApp, askAgent } from '../src/agent';
import { assertHealthyReply, assertOnTopic, PERMISSION_TERMS } from '../src/assertions';
import { gradeWithRubric } from '../src/eval';

/**
 * Part 2. One prompt, graded five ways, none of which touch exact wording.
 */
test.describe('response quality', () => {
  // T5
  test('a "what is Permission" answer is valid on every run', async ({ page }) => {
    await openApp(page);

    const reply = await askAgent(page, { type: 'text', prompt: 'What is Permission?' });

    // Layers 1-4: structure, length band, error leakage, streaming proof.
    assertHealthyReply(reply);

    // Layer 5: topical by threshold. Any sane answer hits several of these
    // terms; an answer about some other product hits almost none.
    assertOnTopic(reply.text, PERMISSION_TERMS, 3);

    // Layer 6: semantic. Catches the failure the others cannot see - a fluent,
    // correctly-shaped answer that is confidently about the wrong thing, or
    // that trails off mid-sentence.
    const rubric = await gradeWithRubric(reply.text);
    test.skip(rubric.skipped, rubric.reason);
    expect(rubric.passed, `rubric failed: ${rubric.reason}`).toBe(true);
  });
});
