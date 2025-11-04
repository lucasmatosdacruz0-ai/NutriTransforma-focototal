
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Content, Part, GenerateImagesResponse } from "@google/genai";

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

    const { action, payload } = req.body;
    if (!action) {
        return res.status(400).json({ error: "Action is required" });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    try {
        let result: any;
        let prompt: string;
        let response;
        let text: string;

        switch(action) {
            case 'sendMessageToAI':
                const { message, history } = payload;
                const contents: Content[] = history.map((h: any) => ({
                    role: h.sender === 'user' ? 'user' : 'model',
                    parts: [{ text: h.text }]
                }));
                contents.push({ role: 'user', parts: [{ text: message }] });

                response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents,
                });
                if (!response.text) {
                    throw new Error("A IA retornou uma resposta vazia.");
                }
                result = { text: response.text };
                break;

            case 'parseMealPlanText':
                prompt = `Converta o seguinte texto de um plano alimentar em um objeto JSON estruturado. Responda APENAS com o JSON.\n\nTexto:\n${payload.text}`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json" } });
                if (!response.text) throw new Error("A IA retornou uma resposta vazia.");
                text = response.text.replace(/^```json\n?/, '').replace(/```$/, '');
                result = JSON.parse(text);
                break;

            case 'generateDailyPlan':
                prompt = `Com base no perfil do usuário, gere um plano alimentar completo para a data ${payload.dateString}. O plano deve ser detalhado, alinhado com as metas. Calcule os totais de calorias e macros para cada refeição e para o dia todo. Responda APENAS com o JSON.\n${buildUserProfile(payload.userData)}`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json" } });
                if (!response.text) throw new Error("A IA retornou uma resposta vazia.");
                text = response.text.replace(/^```json\n?/, '').replace(/```$/, '');
                result = JSON.parse(text);
                break;

            case 'regenerateDailyPlan':
                prompt = `Com base no perfil do usuário, gere um novo plano alimentar para a data ${payload.currentPlan.date}. ${payload.numberOfMeals ? `O plano deve ter exatamente ${payload.numberOfMeals} refeições.` : ''} O plano deve ser uma alternativa ao plano original, mantendo as mesmas metas. Responda APENAS com o JSON.\n${buildUserProfile(payload.userData)}`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json" } });
                if (!response.text) throw new Error("A IA retornou uma resposta vazia.");
                text = response.text.replace(/^```json\n?/, '').replace(/```$/, '');
                result = JSON.parse(text);
                break;

            case 'adjustDailyPlanForMacro':
                prompt = `Ajuste este plano alimentar para se aproximar mais da meta de ${payload.macroToFix}. Mantenha as calorias totais o mais próximo possível da meta. Plano original:\n${JSON.stringify(payload.currentPlan)}\n${buildUserProfile(payload.userData)}\n Responda APENAS com o JSON do plano alimentar ajustado.`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json" } });
                if (!response.text) throw new Error("A IA retornou uma resposta vazia.");
                text = response.text.replace(/^```json\n?/, '').replace(/```$/, '');
                result = JSON.parse(text);
                break;

            case 'generateWeeklyPlan':
                prompt = `Crie um plano alimentar para 7 dias, começando em ${payload.weekStartDate}. ${payload.observation ? `Observação: ${payload.observation}`: ''} Retorne um objeto JSON onde as chaves são as datas (YYYY-MM-DD) e os valores são os objetos DailyPlan. Responda APENAS com o JSON.\n${buildUserProfile(payload.userData)}`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json" } });
                if (!response.text) throw new Error("A IA retornou uma resposta vazia.");
                text = response.text.replace(/^```json\n?/, '').replace(/```$/, '');
                result = JSON.parse(text);
                break;

            case 'regenerateMealFromPrompt':
                prompt = `Regenere a refeição "${payload.meal.name}" com base na seguinte instrução: "${payload.prompt}". Calcule os novos totais de calorias e macros. Responda APENAS com o JSON.\n${buildUserProfile(payload.userData)}`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json" } });
                if (!response.text) throw new Error("A IA retornou uma resposta vazia.");
                text = response.text.replace(/^```json\n?/, '').replace(/```$/, '');
                result = JSON.parse(text);
                break;

            case 'analyzeMealFromText':
                prompt = `Analise esta descrição de uma refeição e retorne uma estimativa dos macronutrientes. Responda APENAS com o JSON.\n\nDescrição: ${payload.description}`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json" } });
                if (!response.text) throw new Error("A IA retornou uma resposta vazia.");
                text = response.text.replace(/^```json\n?/, '').replace(/```$/, '');
                result = JSON.parse(text);
                break;

            case 'analyzeMealFromImage':
                const { imageDataUrl } = payload;
                if (!imageDataUrl || typeof imageDataUrl !== 'string') throw new Error("Invalid image data: imageDataUrl is missing or not a string.");
                const [header, base64Data] = imageDataUrl.split(',');
                if (!base64Data) throw new Error("Invalid image data: base64 data is missing.");
                const mimeTypeMatch = header.match(/:(.*?);/);
                if (!mimeTypeMatch || !mimeTypeMatch[1]) throw new Error("Invalid image data: MIME type is missing.");
                
                const imagePart: Part = { inlineData: { mimeType: mimeTypeMatch[1], data: base64Data } };
                const textPart: Part = { text: "Analise esta imagem de uma refeição e retorne a estimativa de macronutrientes. Responda apenas com o JSON." };
                
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [textPart, imagePart] }, config: { responseMimeType: "application/json" } });
                if (!response.text) throw new Error("A IA retornou uma resposta vazia.");
                text = response.text.replace(/^```json\n?/, '').replace(/```$/, '');
                result = JSON.parse(text);
                break;

            case 'analyzeProgress':
                prompt = `Analise os dados de progresso do usuário e forneça um resumo motivacional com dicas. Fale diretamente com o usuário.\n${buildUserProfile(payload.userData)}`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                if (!response.text) throw new Error("A IA retornou uma resposta vazia.");
                result = response.text;
                break;

            case 'generateShoppingList':
                prompt = `Crie uma lista de compras detalhada e organizada por categorias (ex: Frutas, Vegetais, Carnes) com base no seguinte plano alimentar semanal. Formate a resposta em Markdown.\n${JSON.stringify(payload.weekPlan)}`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                if (!response.text) throw new Error("A IA retornou uma resposta vazia.");
                result = response.text;
                break;

            case 'getFoodInfo':
                prompt = `Responda à seguinte dúvida sobre alimentos de forma clara e concisa. Pergunta: "${payload.question}" ${payload.mealContext ? `Contexto da refeição: ${JSON.stringify(payload.mealContext)}` : ''}`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                if (!response.text) throw new Error("A IA retornou uma resposta vazia.");
                result = response.text;
                break;

            case 'getFoodSubstitution':
                prompt = `Sugira um substituto para o item "${payload.itemToSwap.name}" no contexto da refeição "${payload.mealContext.name}". O substituto deve ter macros similares. Responda APENAS com o JSON do novo FoodItem.\n${buildUserProfile(payload.userData)}`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json" } });
                if (!response.text) throw new Error("A IA retornou uma resposta vazia.");
                text = response.text.replace(/^```json\n?/, '').replace(/```$/, '');
                result = JSON.parse(text);
                break;

            case 'generateImageFromPrompt':
                const imageResponse: GenerateImagesResponse = await ai.models.generateImages({ model: 'imagen-4.0-generate-001', prompt: payload.prompt, config: { numberOfImages: 1, outputMimeType: 'image/jpeg' } });
                if (!imageResponse.generatedImages || imageResponse.generatedImages.length === 0) {
                    throw new Error("A IA não conseguiu gerar uma imagem.");
                }
                result = imageResponse.generatedImages[0].image.imageBytes;
                break;

            case 'findRecipes':
                prompt = `Encontre ${payload.numRecipes} receitas com base na busca: "${payload.query}". Para cada receita, forneça um prompt de imagem otimizado para um gerador de imagens. Responda APENAS com o JSON de um array de objetos de receita.\n${buildUserProfile(payload.userData)}`;
                response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json" } });
                if (!response.text) throw new Error("A IA retornou uma resposta vazia.");
                text = response.text.replace(/^```json\n?/, '').replace(/```$/, '');
                result = JSON.parse(text);
                break;

            default:
                return res.status(400).json({ error: "Invalid action" });
        }
        
        return res.status(200).json({ result });

    } catch (error: any) {
        console.error(`API ERROR in action '${action}':`, error);
        return res.status(500).json({ error: error.message });
    }
}
