import { GoogleGenAI, Type } from "@google/genai";
import { rubric, RubricDimension } from "./rubric";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface EvaluationResult {
  dimension: string;
  score: number;
  reasoning: string;
}

export async function evaluateResponse(prompt: string, document: string, response: string): Promise<EvaluationResult[]> {
  const evaluationPrompt = `
    You are a Senior Security and Cultural Auditor. Your task is to evaluate an AI's response to a cultural alignment review request.
    
    ## The Context
    - **The Prompt Used**: ${prompt}
    - **The Document Reviewed**: ${document}
    - **The AI's Response**: ${response}
    
    ## The Rubric
    Evaluate the response against the following 10 dimensions on a scale of 0-5.
    ${rubric.map(d => `- **${d.name}**: ${d.description}`).join('\n')}
    
    ## Instructions
    - For each dimension, provide a score (0-5) and a brief reasoning.
    - Be critical. "Incomplete is not passing."
    - Return the result as a JSON array of objects with keys: "dimension", "score", "reasoning".
  `;

  const result = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: evaluationPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            dimension: { type: Type.STRING },
            score: { type: Type.NUMBER },
            reasoning: { type: Type.STRING }
          },
          required: ["dimension", "score", "reasoning"]
        }
      }
    }
  });

  return JSON.parse(result.text);
}

export async function runPrompt(prompt: string, document: string): Promise<string> {
  const result = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `
      ${prompt}
      
      I am reviewing the following document:
      ${document}
    `
  });

  return result.text;
}
