
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, GenerateContentResponse, GenerateImagesResponse, Part, Content } from "@google/genai";

// 1. Ensure the API_KEY is available in the environment.
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    console.error("API_KEY is not defined in environment variables.");
    throw new Error("API_KEY is not defined in environment variables.");
} else {
    // 7. This log will appear in the Vercel function logs.
    console.log("Using Gemini Key: OK");
}

// 2. Correctly initialize the SDK client.
const ai = new GoogleGenAI({ apiKey: API_KEY });

function buildUserProfile(userData: any): string {
    return `
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
}

// 8. Main handler for all Gemini API requests from the frontend
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { action, payload } = req.body;

        // Streaming action
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
                if (chunk.text) {
                     // Stream newline-delimited JSON
                    res.write(JSON.stringify({ text: chunk.text }) + '\n');
                }
            }
            return res.end();
        }

        // Image generation
        if (action === 'generateImageFromPrompt') {
            const response: GenerateImagesResponse = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: payload.prompt,
                config: { numberOfImages: 1, outputMimeType: 'image/jpeg' }
            });
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return res.status(200).json({ data: base64ImageBytes });
        }

        // Other non-streaming actions
        const model = 'gemini-2.5-flash';
        let contents: Content | string;
        let config: any = { responseMimeType: "application/json" };
        let isPlainTextResponse = false;
        
        const userProfile = payload.userData ? buildUserProfile(payload.userData) : '';

        switch (action) {
            case 'analyzeMealFromImage':
                const { imageDataUrl } = payload;
                const [header, base64Data] = imageDataUrl.split(',');
                if (!header || !base64Data) throw new Error('Formato de imagem inválido.');
                const mimeTypeMatch = header.match(/:(.*?);/);
                if (!mimeTypeMatch || !mimeTypeMatch[1]) throw new Error('MIME type da imagem inválido.');
                
                const imagePart: Part = { inlineData: { mimeType: mimeTypeMatch[1], data: base64Data } };
                const textPart: Part = { text: "Analise esta imagem de uma refeição e retorne a estimativa de macronutrientes. Responda apenas com o JSON." };
                contents = { parts: [textPart, imagePart] };
                break;
            
            default:
                let prompt = '';
                switch (action) {
                    case 'parseMealPlanText':
                        prompt = `Converta o seguinte texto de um plano alimentar em um objeto JSON estruturado.\n\nTexto:\n${payload.text}`;
                        break;
                    case 'generateDailyPlan':
                        prompt = `Com base no perfil do usuário, gere um plano alimentar completo para a data ${payload.dateString}. ${userProfile}`;
                        break;
                    case 'regenerateDailyPlan':
                        prompt = `Com base no perfil do usuário, gere um novo plano alimentar para a data ${payload.currentPlan.date}. ${payload.numberOfMeals ? `O plano deve ter exatamente ${payload.numberOfMeals} refeições.` : ''} ${userProfile}`;
                        break;
                    case 'adjustDailyPlanForMacro':
                        prompt = `Ajuste este plano alimentar para se aproximar mais da meta de ${payload.macroToFix}. Plano original:\n${JSON.stringify(payload.currentPlan)}\n${userProfile}`;
                        break;
                    case 'generateWeeklyPlan':
                        prompt = `Crie um plano alimentar para 7 dias, começando em ${payload.weekStartDate}. ${payload.observation ? `Observação: ${payload.observation}`: ''} ${userProfile}`;
                        break;
                    case 'regenerateMealFromPrompt':
                        prompt = `Regenere a refeição "${payload.meal.name}" com base na seguinte instrução: "${payload.prompt}". ${userProfile}`;
                        break;
                    case 'analyzeMealFromText':
                        prompt = `Analise esta descrição de uma refeição e retorne uma estimativa dos macronutrientes.\n\nDescrição: ${payload.description}`;
                        break;
                    case 'getFoodSubstitution':
                        prompt = `Sugira um substituto para o item "${payload.itemToSwap.name}" no contexto da refeição "${payload.mealContext.name}". O substituto deve ter macros similares. ${userProfile}`;
                        break;
                    case 'findRecipes':
                        prompt = `Encontre ${payload.numRecipes} receitas com base na busca: "${payload.query}". Para cada receita, forneça um prompt de imagem otimizado para um gerador de imagens. ${userProfile}`;
                        break;
                    // Actions that expect plain text response
                    case 'analyzeProgress':
                        isPlainTextResponse = true;
                        prompt = `Analise os dados de progresso do usuário e forneça um resumo motivacional com dicas. ${userProfile}`;
                        break;
                    case 'generateShoppingList':
                        isPlainTextResponse = true;
                        prompt = `Crie uma lista de compras detalhada e organizada por categorias com base no plano alimentar semanal:\n${JSON.stringify(payload.weekPlan)}`;
                        break;
                    case 'getFoodInfo':
                        isPlainTextResponse = true;
                        prompt = `Responda à seguinte dúvida sobre alimentos: "${payload.question}" ${payload.mealContext ? `Contexto da refeição: ${JSON.stringify(payload.mealContext)}` : ''}`;
                        break;
                    default:
                        return res.status(400).json({ error: `Ação desconhecida: ${action}` });
                }
                contents = prompt;
                if(isPlainTextResponse) {
                    delete config.responseMimeType;
                }
        }

        const response: GenerateContentResponse = await ai.models.generateContent({ model, contents, config });
        
        const text = response.text.replace(/^```json\n?/, '').replace(/```$/, '');
        if (!text && !isPlainTextResponse) {
            throw new Error('A IA retornou uma resposta JSON vazia.');
        }
        const data = isPlainTextResponse ? text : JSON.parse(text);

        return res.status(200).json({ data });

    } catch (err: any) {
        console.error(`Error in handler for action "${req.body?.action}":`, err);
        return res.status(500).json({ error: err.message || 'Ocorreu um erro interno no servidor.' });
    }
}
