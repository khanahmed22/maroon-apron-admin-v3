import { GoogleGenAI } from "@google/genai";
import { cleanOCRText } from "./ocrCleanup";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_KEY!,
});

export interface GeminiMenuItem {
  name: string;
  price: number;
  category: string;
  description: string;
  stockAmount: number;
}

export interface GeminiMenuResult {
  items: GeminiMenuItem[];
}

const SYSTEM_PROMPT = `
Extract food items from restaurant menu text.

Return JSON ONLY.

Schema:
{
  "items": [
    {
      "name": "",
      "price": 0,
      "category": "",
      "description": "",
      "stockAmount": 0,
      "description":""
    }
  ]
}

Rules:
- price must be a number
- infer category
- missing values = 0
`;

export async function parseMenuWithGemini(
  rawText: string
): Promise<GeminiMenuResult> {
  const cleaned = cleanOCRText(rawText).slice(0, 6000); // HARD input cap

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: SYSTEM_PROMPT + "\n\n" + cleaned,
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 600,
      },
    } as any); // ⚠️ verify against your installed @google/genai version — see note below

    const text = (response as any).text.trim();
    const cleanJSON = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanJSON) as GeminiMenuResult;

    // Deduplicate by name (fixed: was item.foodName, which doesn't exist in this schema)
    const unique = Object.values(
      parsed.items.reduce((acc: Record<string, GeminiMenuItem>, item) => {
        const key = item.name?.toLowerCase();
        if (key) acc[key] ??= item;
        return acc;
      }, {})
    );

    return { items: unique };
  } catch (err) {
    console.error("Gemini parsing failed:", err);
    return { items: [] };
  }
}