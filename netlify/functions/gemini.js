import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY is not defined in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- PROMPT ENGINEERING HELPERS ---

const buildUserProfile = (userData) => `
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

const jsonResponseInstruction = (format) => `
IMPORTANTE: Sua resposta DEVE ser um objeto JSON válido, sem nenhum texto adicional, markdown, ou explicação. Apenas o JSON. O formato deve ser:
${format}
`;

// --- MAIN HANDLER ---

export async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { action, payload } = JSON.parse(event.body);
        const userProfile = payload.userData ? buildUserProfile(payload.userData) : '';
        let model, prompt, contents;

        switch (action) {
            case 'chatStream': {
                const { message, history } = payload;
                const modelName = 'gemini-2.5-flash';

                contents = history.map(h => ({
                    role: h.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: h.text }]
                }));
                contents.push({ role: 'user', parts: [{ text: message }] });

                const resultStream = await ai.models.generateContentStream({
                    model: modelName,
                    contents,
                });

                const encoder = new TextEncoder();
                const readableStream = new ReadableStream({
                    async start(controller) {
                        try {
                            for await (const chunk of resultStream) {
                                // The frontend expects the format `data: { "text": "..." }`
                                const chunkText = chunk.text;
                                if (chunkText) {
                                    const data = { text: chunkText };
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                                }
                            }
                        } catch (error) {
                            console.error('Error while streaming from Gemini:', error);
                            controller.error(error);
                        } finally {
                            controller.close();
                        }
                    },
                });

                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive',
                    },
                    body: readableStream,
                };
            }

            case 'generateImageFromPrompt': {
                model = 'imagen-4.0-generate-001';
                const response = await ai.models.generateImages({
                    model,
                    prompt: payload.prompt,
                    config: { numberOfImages: 1, outputMimeType: 'image/jpeg' }
                });
                const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                return { statusCode: 200, body: JSON.stringify({ data: base64ImageBytes }) };
            }

            case 'analyzeMealFromImage': {
                model = 'gemini-2.5-flash';
                const { imageDataUrl } = payload;
                const [header, base64Data] = imageDataUrl.split(',');
                if (!header || !base64Data) {
                    return { statusCode: 400, body: JSON.stringify({ error: 'Formato de imagem inválido.' }) };
                }
                const mimeTypeMatch = header.match(/:(.*?);/);
                if (!mimeTypeMatch || !mimeTypeMatch[1]) {
                    return { statusCode: 400, body: JSON.stringify({ error: 'MIME type da imagem inválido.' }) };
                }
                const mimeType = mimeTypeMatch[1];

                prompt = `Analise esta imagem de uma refeição. Sua tarefa é retornar APENAS um objeto JSON com a estimativa de macronutrientes. ${jsonResponseInstruction('{ "calories": number, "carbs": number, "protein": number, "fat": number }')}`;
                
                contents = [{
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType, data: base64Data } }
                    ]
                }];
                
                const response = await ai.models.generateContent({
                    model,
                    contents,
                    config: { responseMimeType: "application/json" }
                });

                const jsonText = response.text;
                return { statusCode: 200, body: JSON.stringify({ data: JSON.parse(jsonText) }) };
            }

            default: {
                model = 'gemini-2.5-flash';
                let plainTextResponse = false;
                let config = { responseMimeType: "application/json" };

                switch (action) {
                    case 'parseMealPlanText':
                        prompt = `Converta o seguinte texto de um plano alimentar em um objeto JSON. ${jsonResponseInstruction('DailyPlan (definido no schema do app)')}\n\nTexto:\n${payload.text}`;
                        break;
                    case 'regenerateDailyPlan':
                        prompt = `Com base no perfil do usuário, gere um novo plano alimentar para a data ${payload.currentPlan.date}. ${payload.numberOfMeals ? `O plano deve ter exatamente ${payload.numberOfMeals} refeições.` : ''} ${userProfile} ${jsonResponseInstruction('DailyPlan')}`;
                        break;
                    case 'adjustDailyPlanForMacro':
                        prompt = `Ajuste este plano alimentar para se aproximar mais da meta de ${payload.macroToFix}. Mantenha as calorias totais o mais próximo possível da meta. Plano original:\n${JSON.stringify(payload.currentPlan)}\n${userProfile} ${jsonResponseInstruction('DailyPlan')}`;
                        break;
                    case 'generateWeeklyPlan':
                        prompt = `Crie um plano alimentar para 7 dias, começando em ${new Date(payload.weekStartDate).toISOString().split('T')[0]}. ${payload.observation ? `Observação: ${payload.observation}`: ''} ${userProfile} ${jsonResponseInstruction('Record<string, DailyPlan>')}`;
                        break;
                    case 'regenerateMealFromPrompt':
                        prompt = `Regenere a refeição "${payload.meal.name}" com base na seguinte instrução: "${payload.prompt}". ${userProfile} ${jsonResponseInstruction('Meal')}`;
                        break;
                    case 'analyzeMealFromText':
                        prompt = `Analise esta descrição de uma refeição e retorne uma estimativa dos macronutrientes. ${jsonResponseInstruction('{ "calories": number, "carbs": number, "protein": number, "fat": number }')}\n\nDescrição: ${payload.description}`;
                        break;
                    case 'analyzeProgress':
                        plainTextResponse = true;
                        prompt = `Analise os dados de progresso do usuário e forneça um resumo motivacional com dicas. Fale diretamente com o usuário. ${userProfile}`;
                        break;
                    case 'generateShoppingList':
                        plainTextResponse = true;
                        prompt = `Crie uma lista de compras detalhada e organizada por categorias (ex: Frutas, Vegetais, Carnes) com base no seguinte plano alimentar semanal:\n${JSON.stringify(payload.weekPlan)}`;
                        break;
                    case 'getFoodInfo':
                        plainTextResponse = true;
                        prompt = `Responda à seguinte dúvida sobre alimentos de forma clara e concisa. Pergunta: "${payload.question}" ${payload.mealContext ? `Contexto da refeição: ${JSON.stringify(payload.mealContext)}` : ''}`;
                        break;
                    case 'getFoodSubstitution':
                        prompt = `Sugira um substituto para o item "${payload.itemToSwap.name}" no contexto da refeição "${payload.mealContext.name}". O substituto deve ter macros similares. ${userProfile} ${jsonResponseInstruction('FoodItem')}`;
                        break;
                    case 'findRecipes':
                        prompt = `Encontre ${payload.numRecipes} receitas com base na busca: "${payload.query}". Para cada receita, forneça um prompt de imagem otimizado para um gerador de imagens. ${userProfile} ${jsonResponseInstruction('Recipe[]')}`;
                        break;
                    default:
                        return { statusCode: 400, body: JSON.stringify({ error: `Ação desconhecida: ${action}` }) };
                }

                if (plainTextResponse) {
                    config = {};
                }
                
                const response = await ai.models.generateContent({
                    model,
                    contents: prompt,
                    config,
                });

                const text = response.text;
                const data = plainTextResponse ? text : JSON.parse(text);

                return { statusCode: 200, body: JSON.stringify({ data }) };
            }
        }
    } catch (err) {
        console.error(`Error in handler for action "${JSON.parse(event.body).action}":`, err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Ocorreu um erro interno no servidor.' }) };
    }
}