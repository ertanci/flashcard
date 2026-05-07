import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function generateFlashcardDetails(word: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide the English definition, Turkish meaning, and a helpful hint for the word or phrase: "${word}". 
      Return the result as JSON with keys "meaning" (English definition), "meaningTr" (Turkish translation), and "hint". 
      
      CRITICAL INSTRUCTIONS for "hint": 
      The hint should consist of two parts:
      1. A short clue that helps guess the word without naming it.
      2. An example sentence using the word (put the word in bold or brackets).
      Example format for hint: "It's a fruit that is usually red. Example: I ate a delicious [apple] for breakfast."`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            meaning: { type: Type.STRING },
            meaningTr: { type: Type.STRING },
            hint: { type: Type.STRING },
          },
          required: ["meaning", "meaningTr", "hint"],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    return result as { meaning: string; meaningTr: string; hint: string };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
