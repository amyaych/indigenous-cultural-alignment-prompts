import { GoogleGenAI, Type } from "@google/genai";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface Expert {
  name: string;
  persona: string;
  region: string;
}

interface ReviewResult {
  expert: string;
  feedback: string;
  score: number;
}

async function loadExperts(): Promise<Expert[]> {
  const content = fs.readFileSync(path.join(process.cwd(), "agents/experts.md"), "utf-8");
  const experts: Expert[] = [];
  
  const sections = content.split("## Expert ");
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const nameLine = section.split("\n")[0].trim();
    const name = nameLine.replace(/^\d+:\s*/, "");
    
    // Determine region for targeted review
    let region = "Global";
    if (name.includes("Canada")) region = "first-nations-canada";
    if (name.includes("Australia")) region = "aboriginal-torres-strait-islander";
    if (name.includes("New Zealand")) region = "maori-nz";
    if (name.includes("Pacific")) region = "pacific-islander";

    experts.push({
      name,
      persona: "Expert " + section,
      region
    });
  }
  
  return experts;
}

async function loadPrompts(region?: string): Promise<{ path: string; content: string }[]> {
  const dirs = region && region !== "Global" ? [region] : [
    "aboriginal-torres-strait-islander",
    "first-nations-canada",
    "maori-nz",
    "pacific-islander"
  ];
  
  const prompts: { path: string; content: string }[] = [];
  
  for (const dir of dirs) {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      const files = fs.readdirSync(fullPath).filter(f => f.endsWith(".md"));
      for (const file of files) {
        prompts.push({
          path: `${dir}/${file}`,
          content: fs.readFileSync(path.join(fullPath, file), "utf-8")
        });
      }
    }
  }
  
  return prompts;
}

async function runReview() {
  console.log("🚀 Starting Comprehensive Community Leader Review...");
  
  const experts = await loadExperts();
  const readme = fs.readFileSync(path.join(process.cwd(), "README.md"), "utf-8");
  const methodology = fs.readFileSync(path.join(process.cwd(), "METHODOLOGY.md"), "utf-8");

  const results: ReviewResult[] = [];

  for (const expert of experts) {
    console.log(`🧐 ${expert.name} is reviewing their respective section...`);
    
    const relevantPrompts = await loadPrompts(expert.region);
    
    const projectContext = `
      # Project Context: Indigenous Cultural Alignment Prompts
      
      ## README
      ${readme}

      ## METHODOLOGY
      ${methodology}
      
      ## Prompts for your specific region (${expert.region})
      ${relevantPrompts.map(p => `### File: ${p.path}\n${p.content}`).join("\n\n")}
    `;

    const prompt = `
      You are ${expert.name}.
      
      ## Your Persona and Authority
      ${expert.persona}
      
      ## Task
      Perform a **rigorous and critical review** of the project: "Indigenous Cultural Alignment Prompts".
      Focus specifically on the prompts for your region (${expert.region}) and the overall methodology.
      
      ## Project Context
      ${projectContext}
      
      ## Instructions for Rigorous Review
      - **Community Authority**: Does this project respect the actual authority of your people, or does it feel like "AI-washing"?
      - **Language and Concept**: Check for the depth of cultural concepts. Are they used correctly according to your research and the values of your community?
      - **Risks**: Identify any potential for the AI to provide harmful or overly simplistic advice that could damage community relationships.
      - **Actionable Feedback**: What specific changes would you demand before this was used by professionals in your region?
      - **Scoring**: Provide a score from 0 to 10. Be honest.
      
      Return your response as a JSON object with keys: "feedback" (string, markdown) and "score" (number).
    `;

    try {
      const result = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              feedback: { type: Type.STRING },
              score: { type: Type.NUMBER }
            },
            required: ["feedback", "score"]
          }
        }
      });

      const parsed = JSON.parse(result.text);
      results.push({
        expert: expert.name,
        feedback: parsed.feedback,
        score: parsed.score
      });
    } catch (error) {
      console.error(`Error during review by ${expert.name}:`, error);
    }
  }

  // Generate Report
  const reportPath = path.join(process.cwd(), "EXPERT_REVIEW_REPORT.md");
  let report = `# Expert Review Report: Indigenous Cultural Alignment Prompts (Community Leader Edition)\n\n`;
  report += `**Date**: ${new Date().toISOString()}\n\n`;
  report += `This report contains a rigorous review from a panel of Indigenous leaders and scholars, focusing on community authority, cultural safety, and technical precision.\n\n`;
  
  for (const res of results) {
    report += `## Review by ${res.expert}\n`;
    report += `**Score**: ${res.score}/10\n\n`;
    report += `${res.feedback}\n\n`;
    report += `---\n\n`;
  }

  fs.writeFileSync(reportPath, report);
  console.log(`✅ Review complete! Report saved to ${reportPath}`);
}

runReview();
