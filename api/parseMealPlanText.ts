
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const { text } = req.body;
    const prompt = `Converta o seguinte texto de um plano alimentar em um objeto JSON estruturado. Responda APENAS com o JSON.\n\nTexto:\n${text}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    const responseText = response.text.replace(/^```json\n?/, '').replace(/```$/, '');
    if (!responseText) {
        throw new Error("A IA retornou uma resposta vazia.");
    }
    const result = JSON.parse(responseText);

    return res.status(200).json({ result });
  } catch (error: any) {
    console.error("API ERROR in parseMealPlanText:", error);
    return res.status(500).json({ error: error.message });
  }
}