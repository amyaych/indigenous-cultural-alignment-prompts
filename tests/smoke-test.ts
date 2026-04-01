import { listAllPrompts, loadPrompt } from "./promptLoader";
import { rubric } from "./rubric";
import { fixtures } from "./fixtures";

async function smokeTest() {
  console.log("--- Smoke Test: Structural Validation ---");
  let passed = 0;
  let total = 0;

  // 1. Check Prompts
  const prompts = await listAllPrompts();
  for (const p of prompts) {
    total++;
    try {
      const content = await loadPrompt(p.community, p.type);
      if (content.length > 100) {
        console.log(`✅ Prompt Loaded: ${p.community}/${p.type}`);
        passed++;
      }
    } catch (e) {
      console.error(`❌ Prompt Missing: ${p.community}/${p.type}`);
    }
  }

  // 2. Check Rubric
  total++;
  if (rubric.length === 10) {
    console.log(`✅ Rubric: 10 dimensions found`);
    passed++;
  } else {
    console.error(`❌ Rubric: Expected 10 dimensions, found ${rubric.length}`);
  }

  // 3. Check Fixtures
  total++;
  if (fixtures.length >= 3) {
    console.log(`✅ Fixtures: ${fixtures.length} found`);
    passed++;
  } else {
    console.error(`❌ Fixtures: Expected at least 3, found ${fixtures.length}`);
  }

  console.log(`\nSmoke Test Result: ${passed}/${total} passed`);
  if (passed !== total) process.exit(1);
}

smokeTest().catch(console.error);
