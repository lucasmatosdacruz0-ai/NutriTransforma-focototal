
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Part } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const { imageDataUrl } = req.body;
    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
        return res.status(400).json({ error: "Invalid image data: imageDataUrl is missing or not a string." });
    }

    const [header, base64Data] = imageDataUrl.split(',');
    if (!base64Data) {
        return res.status(400).json({ error: "Invalid image data: base64 data is missing." });
    }
    
    const mimeTypeMatch = header.match(/:(.*?);/);
    if (!mimeTypeMatch || !mimeTypeMatch[1]) {
        return res.status(400).json({ error: "Invalid image data: MIME type is missing." });
    }
    
    const imagePart: Part = { inlineData: { mimeType: mimeTypeMatch[1], data: base64Data } };
    const textPart: Part = { text: "Analise esta imagem de uma refeição e retorne a estimativa de macronutrientes. Responda apenas com o JSON." };
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, imagePart] },
        config: { responseMimeType: "application/json" }
    });

    const text = response.text.replace(/^```json\n?/, '').replace(/```$/, '');
    if (!text) {
        throw new Error("A IA retornou uma resposta vazia.");
    }
    const result = JSON.parse(text);

    return res.status(200).json({ result });

  } catch (error: any) {
    console.error("API ERROR in analyzeMealFromImage:", error);
    return res.status(500).json({ error: error.message });
  }
}