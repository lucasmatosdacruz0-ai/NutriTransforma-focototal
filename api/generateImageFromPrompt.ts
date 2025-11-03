
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, GenerateImagesResponse } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

    const { prompt } = req.body;
    
    const response: GenerateImagesResponse = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg' }
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("A IA não conseguiu gerar uma imagem.");
    }

    const result = response.generatedImages[0].image.imageBytes;
    return res.status(200).json({ result });

  } catch (error: any) {
    console.error("API ERROR in generateImageFromPrompt:", error);
    return res.status(500).json({ error: error.message });
  }
}
