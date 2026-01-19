
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // TIP: Als je op GitHub Pages host, vervang 'process.env.API_KEY' 
    // hieronder door je eigen sleutel tussen aanhalingstekens als je geen 
    // build-systeem gebruikt dat env vars ondersteunt.
    // Bijv: const key = 'JOUW_SLEUTEL_HIER';
    const key = process.env.API_KEY || ''; 
    this.ai = new GoogleGenAI({ apiKey: key });
  }

  async suggestTasks(prompt: string) {
    if (!this.ai) return [];
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
      let text = response.text || "Samen komen we verder.";
      return text.replace(/^["'>\s*]+|["'\s*]+$/g, '').split('\n')[0].trim();
    } catch (error) {
      return "Samen komen we verder.";
    }
  }
}

export const geminiService = new GeminiService();
