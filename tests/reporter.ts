import { EvaluationResult } from "./evaluator";
import { PASSING_SCORE_PER_DIMENSION, PASSING_AVERAGE } from "./rubric";
import * as fs from "fs";
import * as path from "path";

export function reportToTerminal(results: EvaluationResult[]) {
  console.log("\n--- Evaluation Report ---");
  let totalScore = 0;
  let allPassed = true;

  results.forEach(r => {
    const status = r.score >= PASSING_SCORE_PER_DIMENSION ? "✅ PASS" : "❌ FAIL";
    if (r.score < PASSING_SCORE_PER_DIMENSION) allPassed = false;
    totalScore += r.score;

    console.log(`${status} | ${r.dimension.padEnd(40)} | Score: ${r.score}/5`);
    console.log(`   Reasoning: ${r.reasoning}\n`);
  });

  const average = totalScore / results.length;
  const averageStatus = average >= PASSING_AVERAGE ? "✅ PASS" : "❌ FAIL";

  console.log("-------------------------");
  console.log(`${averageStatus} | AVERAGE SCORE: ${average.toFixed(2)}/5`);
  console.log(`Overall Status: ${allPassed && average >= PASSING_AVERAGE ? "SUCCESS" : "FAILURE"}`);
  console.log("-------------------------\n");
}

export function saveToJson(results: EvaluationResult[], filename: string) {
  const dir = path.join(process.cwd(), 'tests', 'reports');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(results, null, 2));
}
