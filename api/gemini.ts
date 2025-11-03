import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

// Ensure the API_KEY is available in the environment.
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY is not defined in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { action, payload } = req.body;
        
        // --- PROMPT ENGINEERING HELPERS ---
        const buildUserProfile = (userData: any): string => `
        ### Dados do Usuário
        - **Idade:** ${userData.age}
        - **Gênero:** ${userData.gender}
        - **Altura:** ${userData.height} cm
        - **Peso Atual:** ${userData.weight} kg
        - **Nível de Atividade:** ${userData.activityLevel}
        - **Meta de Peso:** ${userData.weightGoal} kg
        - **Preferências Dietéticas:** ${userData.dietaryPreferences?.diets?.join(', ') || 'Nenhuma'}
        - **Restrições Alimentares:** ${userData.dietaryPreferences?.restrictions?.join(', ') || 'Nenhuma'}
        - **Metas de Macros Diárias:**
          - Calorias: ${userData.macros.calories.goal} kcal
          - Proteínas: ${userData.macros.protein.goal} g
          - Carboidratos: ${userData.macros.carbs.goal} g
          - Gorduras: ${userData.macros.fat.goal} g
        `;

        const userProfile = payload.userData ? buildUserProfile(payload.userData) : '';

        // Handle streaming chat action separately
        if (action === 'sendMessageToAI') {
            const { message, history } = payload;
            const modelName = 'gemini-2.5-flash';

            const contents = history.map((h: any) => ({
                role: h.sender === 'user' ? 'user' : 'model',
                parts: [{ text: h.text }]
            }));
            contents.push({ role: 'user', parts: [{ text: message }] });

            const resultStream = await ai.models.generateContentStream({
                model: modelName,
                contents,
            });
            
            res.setHeader('Content-Type', 'text/plain');
            for await (const chunk of resultStream) {
                const chunkText = chunk.text;
                if (chunkText) {
                    res.write(chunkText);
                }
            }
            return res.end();
        }

        // Handle other actions
        let model: string;
        let prompt: string | object;
        let config: any = { responseMimeType: "application/json" };
        let isImageGen = false;

        switch (action) {
            case 'generateImageFromPrompt':
                isImageGen = true;
                model = 'imagen-4.0-generate-001';
                prompt = payload.prompt;
                break;

            case 'analyzeMealFromImage':
                model = 'gemini-2.5-flash';
                const { imageDataUrl } = payload;
                const [header, base64Data] = imageDataUrl.split(',');
                if (!header || !base64Data) throw new Error('Formato de imagem inválido.');
                const mimeTypeMatch = header.match(/:(.*?);/);
                if (!mimeTypeMatch || !mimeTypeMatch[1]) throw new Error('MIME type da imagem inválido.');
                
                prompt = {
                    parts: [
                        { text: "Analise esta imagem de uma refeição e retorne a estimativa de macronutrientes." },
                        { inlineData: { mimeType: mimeTypeMatch[1], data: base64Data } }
                    ]
                };
                break;

            default:
                model = 'gemini-2.5-flash';
                let plainTextResponse = false;
                let currentPrompt = '';

                 switch (action) {
                    case 'parseMealPlanText':
                        currentPrompt = `Converta o seguinte texto de um plano alimentar em um objeto JSON estruturado.\n\nTexto:\n${payload.text}`;
                        break;
                    case 'generateDailyPlan':
                        currentPrompt = `Com base no perfil do usuário, gere um plano alimentar completo para a data ${payload.dateString}. ${userProfile}`;
                        break;
                    case 'regenerateDailyPlan':
                        currentPrompt = `Com base no perfil do usuário, gere um novo plano alimentar para a data ${payload.currentPlan.date}. ${payload.numberOfMeals ? `O plano deve ter exatamente ${payload.numberOfMeals} refeições.` : ''} ${userProfile}`;
                        break;
                    case 'adjustDailyPlanForMacro':
                        currentPrompt = `Ajuste este plano alimentar para se aproximar mais da meta de ${payload.macroToFix}. Plano original:\n${JSON.stringify(payload.currentPlan)}\n${userProfile}`;
                        break;
                    case 'generateWeeklyPlan':
                        currentPrompt = `Crie um plano alimentar para 7 dias, começando em ${payload.weekStartDate}. ${payload.observation ? `Observação: ${payload.observation}`: ''} ${userProfile}`;
                        break;
                    case 'regenerateMealFromPrompt':
                        currentPrompt = `Regenere a refeição "${payload.meal.name}" com base na seguinte instrução: "${payload.prompt}". ${userProfile}`;
                        break;
                    case 'analyzeMealFromText':
                        currentPrompt = `Analise esta descrição de uma refeição e retorne uma estimativa dos macronutrientes.\n\nDescrição: ${payload.description}`;
                        break;
                    case 'analyzeProgress':
                        plainTextResponse = true;
                        currentPrompt = `Analise os dados de progresso do usuário e forneça um resumo motivacional com dicas. ${userProfile}`;
                        break;
                    case 'generateShoppingList':
                        plainTextResponse = true;
                        currentPrompt = `Crie uma lista de compras detalhada e organizada por categorias com base no plano alimentar semanal:\n${JSON.stringify(payload.weekPlan)}`;
                        break;
                    case 'getFoodInfo':
                        plainTextResponse = true;
                        currentPrompt = `Responda à seguinte dúvida sobre alimentos: "${payload.question}" ${payload.mealContext ? `Contexto da refeição: ${JSON.stringify(payload.mealContext)}` : ''}`;
                        break;
                    case 'getFoodSubstitution':
                        currentPrompt = `Sugira um substituto para o item "${payload.itemToSwap.name}" no contexto da refeição "${payload.mealContext.name}". ${userProfile}`;
                        break;
                    case 'findRecipes':
                        currentPrompt = `Encontre ${payload.numRecipes} receitas com base na busca: "${payload.query}". ${userProfile}`;
                        break;
                    default:
                        return res.status(400).json({ error: `Ação desconhecida: ${action}` });
                }
                prompt = currentPrompt;
                if (plainTextResponse) {
                    config = {};
                }
                break;
        }

        if (isImageGen) {
             const response = await ai.models.generateImages({
                model,
                prompt: prompt as string,
                config: { numberOfImages: 1, outputMimeType: 'image/jpeg' }
            });
            const base64ImageBytes = response?.generatedImages?.[0]?.image?.imageBytes;
            if (!base64ImageBytes) {
                throw new Error('A IA não retornou uma imagem válida.');
            }
            return res.status(200).json({ data: base64ImageBytes });
        }
        
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config,
        });

        const text = (response?.text || '').replace(/^```json\n?/, '').replace(/```$/, '');
        if (!text) {
            throw new Error('A IA retornou uma resposta vazia.');
        }
        const data = config.responseMimeType === "application/json" ? JSON.parse(text) : text;

        return res.status(200).json({ data });

    } catch (err: any) {
        console.error(`Error in handler for action "${req.body.action}":`, err);
        return res.status(500).json({ error: err.message || 'Ocorreu um erro interno no servidor.' });
    }
}