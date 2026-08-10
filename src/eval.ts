/**
 * Promptfoo wiring.
 *
 * Chosen over DeepEval / Ragas because those are Python: adding them would mean
 * a second runtime in a TypeScript repo and would blow the "installable in five
 * minutes" review gate. Promptfoo runs in-process here.
 *
 * The `echo` provider hands our already-captured reply straight to the grader,
 * so we grade the real streamed answer from the browser rather than re-querying
 * a model and grading something the user never saw.
 *
 * Grading needs an API key. Without one the check skips loudly instead of
 * silently passing - a green run that quietly graded nothing is worse than a skip.
 */

export interface RubricResult {
  skipped: boolean;
  passed: boolean;
  reason: string;
}

export const RUBRIC = [
  'The response is a helpful answer about Permission (permission.ai) - what it is,',
  'how it works, how users earn, or how user data is controlled.',
  'It PASSES if it is on topic, coherent, and self-consistent.',
  'It FAILS if it refuses to answer, is empty or truncated mid-sentence,',
  'describes a different company or product, contains an error message,',
  'or contradicts itself.',
  'Do not judge style, length, tone, or formatting.',
].join(' ');

export async function gradeWithRubric(output: string): Promise<RubricResult> {
  if (!process.env.OPENAI_API_KEY) {
    return { skipped: true, passed: false, reason: 'OPENAI_API_KEY not set - rubric skipped' };
  }

  const promptfoo = (await import('promptfoo')).default;

  const results = await promptfoo.evaluate(
    {
      providers: ['echo'],
      prompts: ['{{answer}}'],
      tests: [
        {
          vars: { answer: output },
          assert: [{ type: 'llm-rubric', value: RUBRIC }],
        },
      ],
    },
    { maxConcurrency: 1, cache: false }
  );

  const r = results.results[0];
  return {
    skipped: false,
    passed: Boolean(r?.success),
    reason: r?.gradingResult?.reason ?? 'no grading reason returned',
  };
}
