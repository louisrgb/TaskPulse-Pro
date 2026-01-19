
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  // Always initialize GoogleGenAI within the methods or as needed to ensure process.env.API_KEY is used correctly.
  
  async suggestTasks(prompt: string) {
    // ALWAYS create a new instance right before making an API call to ensure it always uses the most up-to-date API key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Given this team context or request: "${prompt}", generate a list of 3-5 actionable tasks. Return them as a JSON array of objects with 'title' and 'description'.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'Short task title' },
                description: { type: Type.STRING, description: 'Clear task description' }
              },
              required: ['title', 'description'],
              propertyOrdering: ["title", "description"]
            }
          }
        }
      });

      // Directly access .text property
      const text = response.text;
      if (!text) return [];
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("JSON parse error from Gemini:", e, text);
        return [];
      }
    } catch (error) {
      console.error("Gemini suggestTasks error:", error);
      return [];
    }
  }

  async getProductivityQuote() {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Geef mij ALLEEN een korte, inspirerende Nederlandse quote over productiviteit of samenwerking. Geen uitleg, geen vertaling, geen inleiding, geen opmaak. Gewoon de tekst van de quote zelf.",
      });
      // Directly access .text property
      let text = response.text || "Samen komen we verder.";
      return text.replace(/^["'>\s*]+|["'\s*]+$/g, '').split('\n')[0].trim();
    } catch (error) {
      console.error("Gemini getProductivityQuote error:", error);
      return "Samen komen we verder.";
    }
  }
}

export const geminiService = new GeminiService();
