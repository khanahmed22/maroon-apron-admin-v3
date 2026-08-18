import { cleanOCRText } from "./ocrCleanup";

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

export async function parseMenuWithGemini(rawText: string): Promise<GeminiMenuResult> {

  const cleanText = cleanOCRText(rawText)
  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/menu-scan/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ cleanText }),
    });

    if (!res.ok) {
      throw new Error(`Menu parse failed with status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Gemini parsing failed:", err);
    return { items: [] };
  }
}