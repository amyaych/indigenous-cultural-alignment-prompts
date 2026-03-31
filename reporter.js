import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { RUBRIC, PASSING_SCORE_PER_DIMENSION, PASSING_AVERAGE, MAX_SCORE } from "./rubric.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Terminal colour helpers — works without chalk dependency issues
const colours = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgGreen: "\x1b[42m",
  bgRed: "\x1b[41m",
  bgYellow: "\x1b[43m",
};

function c(colour, text) {
  return `${colours[colour]}${text}${colours.reset}`;
}

function scoreColour(score) {
  if (score >= 4) return "green";
  if (score >= 3) return "cyan";
  if (score >= 2) return "yellow";
  return "red";
}

function scoreBar(score) {
  const filled = "█".repeat(score);
  const empty = "░".repeat(MAX_SCORE - score);
  return `${filled}${empty}`;
}

function passFailBadge(passed) {
  return passed
    ? c("green", " ✓ PASS ")
    : c("red", " ✗ FAIL ");
}

/**
 * Prints a full readable report to the terminal.
 */
export function printReport(fixtureLabel, dimensionResults, promptName) {
  const scores = Object.values(dimensionResults).map((r) => r.score);
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  const overallPass = average >= PASSING_AVERAGE;
  const dimensionsPassed = scores.filter((s) => s >= PASSING_SCORE_PER_DIMENSION).length;

  console.log("\n" + "═".repeat(72));
  console.log(c("bold", `CULTURAL ALIGNMENT RUBRIC EVALUATION`));
  console.log(c("dim", `Prompt: ${promptName}`));
  console.log(c("dim", `Fixture: ${fixtureLabel}`));
  console.log("═".repeat(72));

  console.log(
    `\nOverall: ${passFailBadge(overallPass)}  Average score: ${c(
      scoreColour(Math.round(average)),
      average.toFixed(2)
    )}/${MAX_SCORE}   Dimensions passing (≥${PASSING_SCORE_PER_DIMENSION}): ${dimensionsPassed}/${Object.keys(dimensionResults).length}\n`
  );

  console.log("─".repeat(72));
  console.log(c("bold", "DIMENSION SCORES"));
  console.log("─".repeat(72));

  for (const [key, result] of Object.entries(dimensionResults)) {
    const dimension = RUBRIC[key];
    const passed = result.score >= PASSING_SCORE_PER_DIMENSION;
    const bar = scoreBar(result.score);

    console.log(
      `\n${passFailBadge(passed)} ${c("bold", dimension.label)}`
    );
    console.log(
      `  Score: ${c(scoreColour(result.score), `${result.score}/${MAX_SCORE}`)}  ${c(scoreColour(result.score), bar)}`
    );
    console.log(`  ${c("dim", result.reasoning)}`);
    if (result.evidence) {
      console.log(`  ${c("dim", `Evidence: "${result.evidence.slice(0, 120)}..."`)} `);
    }
  }

  console.log("\n" + "─".repeat(72));

  // Lowest scoring dimensions
  const sorted = Object.entries(dimensionResults).sort(
    (a, b) => a[1].score - b[1].score
  );
  const lowest = sorted.slice(0, 3);

  console.log(c("bold", "\nAREAS MOST NEEDING ATTENTION:"));
  for (const [key, result] of lowest) {
    if (result.score < PASSING_SCORE_PER_DIMENSION) {
      console.log(
        `  ${c("red", "→")} ${RUBRIC[key].label}: ${result.score}/${MAX_SCORE}`
      );
    }
  }

  console.log("\n" + "═".repeat(72) + "\n");

  return { average, overallPass, dimensionsPassed };
}

/**
 * Saves a JSON report to /tests/reports/
 */
export function saveJsonReport(fixtureLabel, dimensionResults, promptName, promptResponse) {
  const scores = Object.values(dimensionResults).map((r) => r.score);
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  const overallPass = average >= PASSING_AVERAGE;

  const report = {
    meta: {
      timestamp: new Date().toISOString(),
      prompt: promptName,
      fixture: fixtureLabel,
      passingScorePerDimension: PASSING_SCORE_PER_DIMENSION,
      passingAverage: PASSING_AVERAGE,
      maxScore: MAX_SCORE,
    },
    summary: {
      averageScore: parseFloat(average.toFixed(2)),
      overallPass,
      dimensionsPassed: scores.filter((s) => s >= PASSING_SCORE_PER_DIMENSION).length,
      totalDimensions: scores.length,
    },
    dimensions: Object.fromEntries(
      Object.entries(dimensionResults).map(([key, result]) => [
        key,
        {
          label: RUBRIC[key].label,
          score: result.score,
          maxScore: MAX_SCORE,
          passed: result.score >= PASSING_SCORE_PER_DIMENSION,
          reasoning: result.reasoning,
          evidence: result.evidence,
        },
      ])
    ),
    promptResponsePreview: promptResponse.slice(0, 500) + "...",
  };

  const safeLabel = fixtureLabel
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .slice(0, 40);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
  const filename = `report-${safeLabel}-${timestamp}.json`;
  const outputPath = resolve(__dirname, "reports", filename);

  // Ensure reports directory exists
  import("fs").then(({ mkdirSync }) => {
    mkdirSync(resolve(__dirname, "reports"), { recursive: true });
  });

  writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(c("dim", `  JSON report saved: tests/reports/${filename}\n`));

  return report;
}
