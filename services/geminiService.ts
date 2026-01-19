
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async suggestTasks(prompt: string) {
    try {
      const response = await this.ai.models.generateContent({
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
              required: ['title', 'description']
            }
          }
        }
      });

      const text = response.text;
      if (!text) return [];
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini suggestTasks error:", error);
      return [];
    }
  }

  async getProductivityQuote() {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Geef mij ALLEEN een korte, inspirerende Nederlandse quote over productiviteit of samenwerking. Geen uitleg, geen vertaling, geen inleiding, geen opmaak. Gewoon de tekst van de quote zelf.",
      });
      // Cleanup any extra fluff or markdown
      let text = response.text || "Samen komen we verder.";
      return text.replace(/^["'>\s*]+|["'\s*]+$/g, '').split('\n')[0].trim();
    } catch (error) {
      return "Samen komen we verder.";
    }
  }
}

export const geminiService = new GeminiService();
