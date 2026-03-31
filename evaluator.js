import Anthropic from "@anthropic-ai/sdk";
import { RUBRIC, MAX_SCORE } from "./rubric.js";

const client = new Anthropic();

/**
 * Runs a document through a prompt and returns the full AI response.
 * This simulates what a real user would see.
 */
export async function runPrompt(systemPrompt, documentText) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `I am a policy analyst working in housing in the Wellington region, Aotearoa New Zealand.
My work sits within the public sector.
The document below is a housing development proposal.
My intended audience is government agency decision-makers.
I have not yet identified the specific mana whenua for the rohe.
I am not currently working from any iwi or hapū documents.

Here is the document I would like reviewed:

${documentText}`,
      },
    ],
  });

  return response.content[0].text;
}

/**
 * Evaluates a single rubric dimension against the prompt response.
 * Uses a second Claude call as the judge — this is the "LLM as evaluator" pattern.
 */
export async function evaluateDimension(dimensionKey, promptResponse) {
  const dimension = RUBRIC[dimensionKey];

  const evaluatorPrompt = `You are an expert evaluator of culturally responsive AI outputs, 
with deep knowledge of Māori cultural frameworks, Te Tiriti o Waitangi, and indigenous 
data sovereignty principles including Te Mana Raraunga and the CARE principles.

You are evaluating an AI prompt response against a specific rubric dimension.

DIMENSION: ${dimension.label}
DESCRIPTION: ${dimension.description}

SCORING GUIDE:
${Object.entries(dimension.scoringGuide)
  .map(([score, description]) => `  ${score}: ${description}`)
  .join("\n")}

EVALUATION TASK:
${dimension.evaluationPrompt}

PROMPT RESPONSE TO EVALUATE:
---
${promptResponse}
---

Respond in this exact JSON format with no other text:
{
  "score": <number 0-${MAX_SCORE}>,
  "reasoning": "<one to two sentences explaining the score>",
  "evidence": "<specific quote or observation from the response that supports your score>"
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: evaluatorPrompt,
      },
    ],
  });

  const text = response.content[0].text.trim();

  try {
    return JSON.parse(text);
  } catch {
    // If JSON parsing fails, extract score with regex as fallback
    const scoreMatch = text.match(/"score"\s*:\s*(\d)/);
    return {
      score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
      reasoning: "Could not parse evaluator response",
      evidence: text.slice(0, 200),
    };
  }
}

/**
 * Runs the full rubric evaluation against a prompt response.
 * Returns scores and reasoning for all 10 dimensions.
 */
export async function evaluateFullRubric(promptResponse) {
  const results = {};

  for (const dimensionKey of Object.keys(RUBRIC)) {
    process.stdout.write(`  Evaluating: ${RUBRIC[dimensionKey].label}...`);
    const result = await evaluateDimension(dimensionKey, promptResponse);
    results[dimensionKey] = result;
    process.stdout.write(` ${result.score}/${MAX_SCORE}\n`);
  }

  return results;
}
