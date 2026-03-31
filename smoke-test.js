/**
 * Smoke Test — No API Key Required
 *
 * Verifies that all modules load correctly, the rubric has the right shape,
 * fixtures exist, and prompt files can be found and parsed.
 *
 * Run this first to confirm setup is working before running the full suite:
 *   node smoke-test.js
 */

import { RUBRIC, PASSING_SCORE_PER_DIMENSION, PASSING_AVERAGE, MAX_SCORE } from "./rubric.js";
import { FIXTURES } from "./fixtures.js";
import { loadPrompt, PROMPTS } from "./promptLoader.js";

const EXPECTED_DIMENSIONS = [
  "tino_rangatiratanga",
  "mana_whenua_recognition",
  "engagement_quality",
  "engagement_authenticity",
  "data_sovereignty",
  "tikanga_alignment",
  "te_reo_maori",
  "reciprocity_cultural_load",
  "reciprocity_social_impact",
  "te_tiriti_alignment",
];

const EXPECTED_FIXTURES = ["strong", "mixed", "weak"];
const EXPECTED_PROMPTS = ["maori_general", "maori_workplace"];

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

console.log("\n══════════════════════════════════════════════════════════════════════");
console.log("SMOKE TEST — Indigenous Cultural Alignment Prompt Suite");
console.log("══════════════════════════════════════════════════════════════════════\n");

// --- Rubric checks ---
console.log("Rubric:");
assert(typeof RUBRIC === "object", "RUBRIC is an object");
assert(Object.keys(RUBRIC).length === 10, `RUBRIC has 10 dimensions (found ${Object.keys(RUBRIC).length})`);

for (const key of EXPECTED_DIMENSIONS) {
  assert(key in RUBRIC, `Dimension exists: ${key}`);
  if (key in RUBRIC) {
    assert(typeof RUBRIC[key].label === "string", `  ${key} has a label`);
    assert(typeof RUBRIC[key].evaluationPrompt === "string", `  ${key} has an evaluationPrompt`);
    assert(Object.keys(RUBRIC[key].scoringGuide).length === MAX_SCORE + 1, `  ${key} has ${MAX_SCORE + 1} scoring guide entries`);
  }
}

assert(PASSING_SCORE_PER_DIMENSION === 3, `Passing score per dimension is 3 (got ${PASSING_SCORE_PER_DIMENSION})`);
assert(PASSING_AVERAGE === 3.0, `Passing average is 3.0 (got ${PASSING_AVERAGE})`);
assert(MAX_SCORE === 5, `Max score is 5 (got ${MAX_SCORE})`);

// --- Fixture checks ---
console.log("\nFixtures:");
assert(typeof FIXTURES === "object", "FIXTURES is an object");
assert(Object.keys(FIXTURES).length === EXPECTED_FIXTURES.length, `${EXPECTED_FIXTURES.length} fixtures found`);

for (const key of EXPECTED_FIXTURES) {
  assert(key in FIXTURES, `Fixture exists: ${key}`);
  if (key in FIXTURES) {
    assert(typeof FIXTURES[key].label === "string", `  ${key} has a label`);
    assert(typeof FIXTURES[key].document === "string", `  ${key} has a document`);
    assert(FIXTURES[key].document.length > 100, `  ${key} document is non-trivial (${FIXTURES[key].document.length} chars)`);
  }
}

// Score range assertions
assert(
  FIXTURES.strong.expectedMinAverageScore !== undefined,
  "strong fixture has expectedMinAverageScore"
);
assert(
  FIXTURES.weak.expectedMaxAverageScore !== undefined,
  "weak fixture has expectedMaxAverageScore"
);
assert(
  FIXTURES.mixed.expectedMinAverageScore !== undefined && FIXTURES.mixed.expectedMaxAverageScore !== undefined,
  "mixed fixture has both min and max score expectations"
);

// --- Prompt file checks ---
console.log("\nPrompt files:");
assert(Object.keys(PROMPTS).length === EXPECTED_PROMPTS.length, `${EXPECTED_PROMPTS.length} prompts registered`);

for (const key of EXPECTED_PROMPTS) {
  assert(key in PROMPTS, `Prompt registered: ${key}`);
  try {
    const content = loadPrompt(PROMPTS[key]);
    assert(content.length > 1000, `  ${key} prompt content is substantial (${content.length} chars)`);
    assert(
      content.includes("You are a culturally informed"),
      `  ${key} prompt contains persona instruction`
    );
    assert(
      content.includes("Mana Whenua"),
      `  ${key} prompt references Mana Whenua`
    );
    assert(
      content.includes("Te Tiriti"),
      `  ${key} prompt references Te Tiriti`
    );
    assert(
      content.includes("Do not write anything on behalf of the user"),
      `  ${key} prompt contains no-writing-on-behalf instruction`
    );
  } catch (e) {
    assert(false, `  ${key} prompt file could not be loaded: ${e.message}`);
  }
}

// --- Final result ---
console.log("\n══════════════════════════════════════════════════════════════════════");
console.log(`Smoke test complete: ${passed} passed, ${failed} failed`);
console.log("══════════════════════════════════════════════════════════════════════\n");

if (failed > 0) {
  console.error("✗ Smoke test failed. Fix the above issues before running the full suite.\n");
  process.exit(1);
} else {
  console.log("✓ All smoke tests passed. Ready to run the full evaluation suite.");
  console.log("  Next: add your ANTHROPIC_API_KEY to .env and run: npm test\n");
  process.exit(0);
}
