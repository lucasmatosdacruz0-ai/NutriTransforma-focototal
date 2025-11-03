
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const { weekPlan } = req.body;
    const prompt = `Crie uma lista de compras detalhada e organizada por categorias (ex: Frutas, Vegetais, Carnes) com base no seguinte plano alimentar semanal. Formate a resposta em Markdown.\n${JSON.stringify(weekPlan)}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    const result = response.text;
    return res.status(200).json({ result });

  } catch (error: any) {
    console.error("API ERROR in generateShoppingList:", error);
    return res.status(500).json({ error: error.message });
  }
}
