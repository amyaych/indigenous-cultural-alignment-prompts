import { GoogleGenAI } from "@google/genai";

async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", // Using a standard model
      contents: "Hello, are you working?"
    });
    console.log("Response:", response.text);
  } catch (error) {
    console.error("API Error:", error);
  }
}

test();
