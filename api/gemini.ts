
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Content, Part, GenerateContentResponse, GenerateImagesResponse } from "@google/genai";
import { DailyPlan, FoodItem, MacroData, Meal, Recipe, UserData } from '../src/types';

export const config = {
  runtime: "nodejs20.x",
};

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });

function buildUserProfile(userData: UserData): string {
    return `### Dados do Usuário
- **Idade:** ${userData.age}, **Gênero:** ${userData.gender}, **Altura:** ${userData.height} cm, **Peso Atual:** ${userData.weight} kg
- **Nível de Atividade:** ${userData.activityLevel}, **Meta de Peso:** ${userData.weightGoal} kg
- **Preferências:** ${userData.dietaryPreferences?.diets?.join(', ') || 'Nenhuma'}, **Restrições:** ${userData.dietaryPreferences?.restrictions?.join(', ') || 'Nenhuma'}
- **Metas Macros:** Calorias: ${userData.macros.calories.goal} kcal, Proteínas: ${userData.macros.protein.goal} g, Carboidratos: ${userData.macros.carbs.goal} g, Gorduras: ${userData.macros.fat.goal} g`;
}

function safeJsonParse(text: string): any {
    try {
        const cleanText = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("Failed to parse JSON from AI response:", text);
        throw new Error("A IA retornou uma resposta em formato JSON inválido.");
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (!API_KEY) {
        return res.status(500).json({ error: "API_KEY não está configurada no servidor." });
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { action, payload } = req.body;
        
        if (action === 'sendMessageToAI') {
            const { message, history } = payload;
        
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
                const text = chunk.text;
                if (text) {
                    res.write(JSON.stringify({ text }) + '\n');
                }
            }
            return res.end();
        }

        const userProfile = payload.userData ? buildUserProfile(payload.userData) : '';
        const model = 'gemini-2.5-flash';
        let contents: Content | string;
        let config: any = { responseMimeType: "application/json" };
        let isPlainTextResponse = false;
        
        switch (action) {
            case 'generateImageFromPrompt': {
                const response: GenerateImagesResponse = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt: payload.prompt,
                    config: { numberOfImages: 1, outputMimeType: 'image/jpeg' }
                });
                const image = response.generatedImages?.[0]?.image;
                if (!image) {
                    throw new Error("A IA não conseguiu gerar uma imagem.");
                }
                return res.status(200).json({ result: image.imageBytes });
            }

            case 'analyzeMealFromImage': {
                const { imageDataUrl } = payload;
                if (!imageDataUrl || typeof imageDataUrl !== 'string') {
                    return res.status(400).json({ error: "Dados de imagem inválidos." });
                }
                const [header, base64Data] = imageDataUrl.split(',');
                if (!base64Data) throw new Error('Formato de imagem inválido.');
                const mimeTypeMatch = header.match(/:(.*?);/);
                if (!mimeTypeMatch?.[1]) throw new Error('MIME type da imagem inválido.');
                
                const imagePart: Part = { inlineData: { mimeType: mimeTypeMatch[1], data: base64Data } };
                const textPart: Part = { text: "Analise esta imagem de uma refeição e retorne a estimativa de macronutrientes. Responda apenas com o JSON." };
                contents = { parts: [textPart, imagePart] };
                break;
            }

            case 'parseMealPlanText':
                contents = `Converta o seguinte texto de um plano alimentar em um objeto JSON estruturado. Responda APENAS com o JSON.\n\nTexto:\n${payload.text}`;
                break;
            case 'generateDailyPlan':
                contents = `Com base no perfil do usuário, gere um plano alimentar completo para a data ${payload.dateString}. ${userProfile}. Responda APENAS com o JSON.`;
                break;
            case 'regenerateDailyPlan':
                contents = `Com base no perfil do usuário, gere um novo plano alimentar para a data ${payload.currentPlan.date}. ${payload.numberOfMeals ? `O plano deve ter exatamente ${payload.numberOfMeals} refeições.` : ''} ${userProfile}. Responda APENAS com o JSON.`;
                break;
            case 'adjustDailyPlanForMacro':
                contents = `Ajuste este plano alimentar para se aproximar mais da meta de ${payload.macroToFix}. Plano original:\n${JSON.stringify(payload.currentPlan)}\n${userProfile}\n Responda APENAS com o JSON do plano alimentar ajustado.`;
                break;
            case 'generateWeeklyPlan':
                contents = `Crie um plano alimentar para 7 dias, começando em ${payload.weekStartDate}. ${payload.observation ? `Observação: ${payload.observation}`: ''} Retorne um array de 7 objetos DailyPlan. Responda APENAS com o JSON.\n${userProfile}`;
                break;
            case 'regenerateMealFromPrompt':
                contents = `Regenere a refeição "${payload.meal.name}" com base na seguinte instrução: "${payload.prompt}". Calcule os novos totais de calorias e macros. Responda APENAS com o JSON.\n${userProfile}`;
                break;
            case 'analyzeMealFromText':
                contents = `Analise esta descrição de uma refeição e retorne uma estimativa dos macronutrientes. Responda APENAS com o JSON.\n\nDescrição: ${payload.description}`;
                break;
            case 'getFoodSubstitution':
                contents = `Sugira um substituto para o item "${payload.itemToSwap.name}" no contexto da refeição "${payload.mealContext.name}". O substituto deve ter macros similares. Responda APENAS com o JSON do novo FoodItem.\n${userProfile}`;
                break;
            case 'findRecipes':
                contents = `Encontre ${payload.numRecipes} receitas com base na busca: "${payload.query}". Para cada receita, forneça um prompt de imagem otimizado para um gerador de imagens. Responda APENAS com o JSON.\n${userProfile}`;
                break;

            case 'analyzeProgress':
                isPlainTextResponse = true;
                contents = `Analise os dados de progresso do usuário e forneça um resumo motivacional com dicas. Fale diretamente com o usuário.\n${userProfile}`;
                break;
            case 'generateShoppingList':
                isPlainTextResponse = true;
                contents = `Crie uma lista de compras detalhada e organizada por categorias com base no plano alimentar semanal. Formate a resposta em Markdown.\n${JSON.stringify(payload.weekPlan)}`;
                break;
            case 'getFoodInfo':
                isPlainTextResponse = true;
                contents = `Responda à seguinte dúvida sobre alimentos de forma clara e concisa. Pergunta: "${payload.question}" ${payload.mealContext ? `Contexto da refeição: ${JSON.stringify(payload.mealContext)}` : ''}`;
                break;

            default:
                return res.status(400).json({ error: `Ação desconhecida: ${action}` });
        }

        if (isPlainTextResponse) {
            config = {};
        }

        const response: GenerateContentResponse = await ai.models.generateContent({ model, contents, config });
        
        const text = response.text ?? "";
        if (!text) {
            throw new Error('A IA retornou uma resposta vazia.');
        }
        
        const result = isPlainTextResponse ? text : safeJsonParse(text);

        if (action === 'generateWeeklyPlan' && Array.isArray(result)) {
            const planRecord: Record<string, any> = {};
            for (const dayPlan of result) {
                if (dayPlan?.date) {
                    planRecord[dayPlan.date] = dayPlan;
                }
            }
             return res.status(200).json({ result: planRecord });
        }

        return res.status(200).json({ result });

    } catch (err: any) {
        console.error(`Error in handler for action "${req.body?.action}":`, err);
        if (!res.headersSent) {
            return res.status(500).json({ error: err.message || 'Ocorreu um erro interno no servidor.' });
        } else {
            res.end();
        }
    }
}
