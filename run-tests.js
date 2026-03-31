/**
 * Indigenous Cultural Alignment Prompt Test Runner
 *
 * Runs the prompt evaluation rubric against test fixtures
 * and outputs both a terminal report and a JSON results file.
 *
 * Usage:
 *   node run-tests.js                        # run all fixtures against all prompts
 *   node run-tests.js --fixture strong       # run only the strong fixture
 *   node run-tests.js --prompt maori_general # run only the general prompt
 *
 * Requirements:
 *   ANTHROPIC_API_KEY must be set as an environment variable.
 *   See README for setup instructions.
 */

import { mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { loadPrompt, PROMPTS } from "./promptLoader.js";
import { runPrompt, evaluateFullRubric } from "./evaluator.js";
import { printReport, saveJsonReport } from "./reporter.js";
import { FIXTURES } from "./fixtures.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env file if present
config({ path: resolve(__dirname, ".env") });

// Ensure reports directory exists
mkdirSync(resolve(__dirname, "reports"), { recursive: true });

// Parse CLI args
const args = process.argv.slice(2);
const fixtureArg = args.includes("--fixture")
  ? args[args.indexOf("--fixture") + 1]
  : null;
const promptArg = args.includes("--prompt")
  ? args[args.indexOf("--prompt") + 1]
  : null;

async function runTest(promptKey, fixtureKey) {
  const fixture = FIXTURES[fixtureKey];
  const promptPath = PROMPTS[promptKey];

  console.log(`\n${"─".repeat(72)}`);
  console.log(`Running: ${promptKey} × ${fixture.label}`);
  console.log("─".repeat(72));

  // Step 1: Load the prompt
  console.log("Loading prompt...");
  const systemPrompt = loadPrompt(promptPath);

  // Step 2: Run the document through the prompt
  console.log("Running document through prompt (this may take 20–40 seconds)...");
  const promptResponse = await runPrompt(systemPrompt, fixture.document);
  console.log(`Prompt response received (${promptResponse.length} characters)\n`);

  // Step 3: Evaluate each rubric dimension
  console.log("Evaluating rubric dimensions:");
  const dimensionResults = await evaluateFullRubric(promptResponse);

  // Step 4: Print terminal report
  const { average, overallPass } = printReport(
    fixture.label,
    dimensionResults,
    promptKey
  );

  // Step 5: Save JSON report
  saveJsonReport(fixture.label, dimensionResults, promptKey, promptResponse);

  // Step 6: Assert against expected score ranges
  let assertionsPassed = true;

  if (fixture.expectedMinAverageScore !== undefined) {
    if (average < fixture.expectedMinAverageScore) {
      console.warn(
        `⚠ ASSERTION FAILED: Expected average ≥ ${fixture.expectedMinAverageScore}, got ${average.toFixed(2)}`
      );
      assertionsPassed = false;
    } else {
      console.log(
        `✓ Assertion passed: Average score ${average.toFixed(2)} ≥ expected minimum ${fixture.expectedMinAverageScore}`
      );
    }
  }

  if (fixture.expectedMaxAverageScore !== undefined) {
    if (average > fixture.expectedMaxAverageScore) {
      console.warn(
        `⚠ ASSERTION FAILED: Expected average ≤ ${fixture.expectedMaxAverageScore}, got ${average.toFixed(2)}`
      );
      assertionsPassed = false;
    } else {
      console.log(
        `✓ Assertion passed: Average score ${average.toFixed(2)} ≤ expected maximum ${fixture.expectedMaxAverageScore}`
      );
    }
  }

  return { average, overallPass, assertionsPassed };
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "\n✗ ANTHROPIC_API_KEY is not set.\n" +
        "  Add it to a .env file or export it in your terminal:\n" +
        "  export ANTHROPIC_API_KEY=your_key_here\n"
    );
    process.exit(1);
  }

  const promptsToRun = promptArg
    ? [promptArg]
    : Object.keys(PROMPTS);

  const fixturesToRun = fixtureArg
    ? [fixtureArg]
    : Object.keys(FIXTURES);

  console.log("\n" + "═".repeat(72));
  console.log("INDIGENOUS CULTURAL ALIGNMENT — PROMPT EVALUATION SUITE");
  console.log("Māori / Aotearoa New Zealand");
  console.log("═".repeat(72));
  console.log(`Prompts:  ${promptsToRun.join(", ")}`);
  console.log(`Fixtures: ${fixturesToRun.join(", ")}`);
  console.log(`Total runs: ${promptsToRun.length * fixturesToRun.length}`);

  const allResults = [];

  for (const promptKey of promptsToRun) {
    for (const fixtureKey of fixturesToRun) {
      try {
        const result = await runTest(promptKey, fixtureKey);
        allResults.push({ promptKey, fixtureKey, ...result });
      } catch (err) {
        console.error(
          `\n✗ Error running ${promptKey} × ${fixtureKey}: ${err.message}`
        );
        allResults.push({
          promptKey,
          fixtureKey,
          error: err.message,
          assertionsPassed: false,
        });
      }
    }
  }

  // Final summary
  console.log("\n" + "═".repeat(72));
  console.log("FINAL SUMMARY");
  console.log("═".repeat(72));

  let totalPassed = 0;
  for (const result of allResults) {
    const status = result.assertionsPassed ? "✓ PASS" : "✗ FAIL";
    const avg = result.average ? `avg ${result.average.toFixed(2)}/5` : "ERROR";
    console.log(`  ${status}  ${result.promptKey} × ${result.fixtureKey}  (${avg})`);
    if (result.assertionsPassed) totalPassed++;
  }

  console.log(
    `\n${totalPassed}/${allResults.length} test runs passed assertions\n`
  );

  process.exit(totalPassed === allResults.length ? 0 : 1);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
