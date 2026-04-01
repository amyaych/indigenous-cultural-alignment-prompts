import { fixtures } from "./fixtures";
import { loadPrompt } from "./promptLoader";
import { runPrompt, evaluateResponse } from "./evaluator";
import { reportToTerminal, saveToJson } from "./reporter";

async function main() {
  const fixtureId = process.argv[2];
  const selectedFixtures = fixtureId 
    ? fixtures.filter(f => f.id === fixtureId)
    : fixtures;

  if (selectedFixtures.length === 0) {
    console.error(`No fixture found with ID: ${fixtureId}`);
    process.exit(1);
  }

  for (const fixture of selectedFixtures) {
    console.log(`\nRunning test for: ${fixture.name} (${fixture.community}/${fixture.type})`);
    
    try {
      const prompt = await loadPrompt(fixture.community, fixture.type);
      const response = await runPrompt(prompt, fixture.content);
      const results = await evaluateResponse(prompt, fixture.content, response);
      
      reportToTerminal(results);
      saveToJson(results, `${fixture.id}-report.json`);
    } catch (error) {
      console.error(`Error testing ${fixture.id}:`, error);
    }
  }
}

main().catch(console.error);
