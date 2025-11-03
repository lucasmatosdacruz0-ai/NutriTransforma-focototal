
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
    const { description } = req.body;
    const prompt = `Analise esta descrição de uma refeição e retorne uma estimativa dos macronutrientes. Responda APENAS com o JSON.\n\nDescrição: ${description}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    const text = response.text.replace(/^```json\n?/, '').replace(/```$/, '');
    if (!text) {
        throw new Error("A IA retornou uma resposta vazia.");
    }
    const result = JSON.parse(text);

    return res.status(200).json({ result });
  } catch (error: any) {
    console.error("API ERROR in analyzeMealFromText:", error);
    return res.status(500).json({ error: error.message });
  }
}
