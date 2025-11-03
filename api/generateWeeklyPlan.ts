
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const { userData, weekStartDate, observation } = req.body;
    const userProfile = buildUserProfile(userData);
    const prompt = `Crie um plano alimentar para 7 dias, começando em ${weekStartDate}. ${observation ? `Observação: ${observation}`: ''} Retorne um array de 7 objetos DailyPlan. Responda APENAS com o JSON.\n${userProfile}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    const text = response.text.replace(/^```json\n?/, '').replace(/```$/, '');
    if (!text) {
        throw new Error("A IA retornou uma resposta vazia.");
    }
    const planArray = JSON.parse(text);
    
    const result: Record<string, any> = {};
    if (Array.isArray(planArray)) {
        for (const dayPlan of planArray) {
            if (dayPlan && dayPlan.date) {
                result[dayPlan.date] = dayPlan;
            }
        }
    } else {
        throw new Error("A resposta da IA não foi um array de planos diários.");
    }


    return res.status(200).json({ result });
  } catch (error: any) {
    console.error("API ERROR in generateWeeklyPlan:", error);
    return res.status(500).json({ error: error.message });
  }
}