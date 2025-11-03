
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Content } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
    const { message, history } = req.body;
        
    const contents: Content[] = history.map((h: any) => ({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    const resultStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents,
    });

    res.setHeader('Content-Type', 'application/octet-stream');
    
    for await (const chunk of resultStream) {
        if (chunk.text) {
            // Stream newline-delimited JSON for easy parsing on the client
            res.write(JSON.stringify({ text: chunk.text }) + '\n');
        }
    }
    res.end();

  } catch (error: any) {
    console.error("API ERROR in sendMessageToAI:", error);
    // If headers are not sent, we can still send a JSON error
    if (!res.headersSent) {
        res.status(500).json({ error: error.message });
    } else {
        // If headers are sent, we can't send a new status code, so just end the stream.
        // The client-side will need to handle an abruptly closed stream.
        res.end();
    }
  }
}
