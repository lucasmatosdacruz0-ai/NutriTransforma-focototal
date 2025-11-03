
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

function buildUserProfile(userData: any): string {
    return `### Dados do Usuário
- **Idade:** ${userData.age}, **Gênero:** ${userData.gender}, **Altura:** ${userData.height} cm, **Peso Atual:** ${userData.weight} kg
- **Nível de Atividade:** ${userData.activityLevel}, **Meta de Peso:** ${userData.weightGoal} kg
- **Preferências:** ${userData.dietaryPreferences?.diets?.join(', ') || 'Nenhuma'}, **Restrições:** ${userData.dietaryPreferences?.restrictions?.join(', ') || 'Nenhuma'}
- **Metas Macros:** Calorias: ${userData.macros.calories.goal} kcal, Proteínas: ${userData.macros.protein.goal} g, Carboidratos: ${userData.macros.carbs.goal} g, Gorduras: ${userData.macros.fat.goal} g`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
    const { userData, currentPlan, macroToFix } = req.body;

    const userProfile = buildUserProfile(userData);
    const prompt = `Ajuste este plano alimentar para se aproximar mais da meta de ${macroToFix}. Mantenha as calorias totais o mais próximo possível da meta. Plano original:\n${JSON.stringify(currentPlan)}\n${userProfile}\n Responda APENAS com o JSON do plano alimentar ajustado.`;
    
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
    console.error("API ERROR in adjustDailyPlanForMacro:", error);
    return res.status(500).json({ error: error.message });
  }
}
