import { GoogleGenAI, Type } from "@google/genai";
import { DailyPlan, Meal, UserData, MacroData, Recipe, FoodItem } from '../types';

// Ensure the API_KEY is available in the environment.
if (!process.env.API_KEY) {
    // This will be caught by the ErrorBoundary and displayed to the user.
    throw new Error("Chave de API não definida. Por favor, configure a variável de ambiente API_KEY.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- PROMPT ENGINEERING HELPERS ---

const buildUserProfile = (userData: UserData): string => `
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

// --- JSON SCHEMAS ---
const macroDataSchema = {
    type: Type.OBJECT,
    properties: {
      calories: { type: Type.NUMBER, description: "Total de calorias." },
      carbs: { type: Type.NUMBER, description: "Total de carboidratos em gramas." },
      protein: { type: Type.NUMBER, description: "Total de proteínas em gramas." },
      fat: { type: Type.NUMBER, description: "Total de gorduras em gramas." },
    },
    required: ['calories', 'carbs', 'protein', 'fat'],
};
  
const foodItemSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Nome do alimento." },
      portion: { type: Type.STRING, description: "Porção e peso (ex: 1 xícara (150g))." },
      calories: { type: Type.NUMBER },
      carbs: { type: Type.NUMBER },
      protein: { type: Type.NUMBER },
      fat: { type: Type.NUMBER },
    },
    required: ['name', 'portion', 'calories', 'carbs', 'protein', 'fat'],
};
  
const mealSchema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "ID único para a refeição (pode ser gerado, ex: 'meal-1')." },
      name: { type: Type.STRING, description: "Nome da refeição (ex: Café da Manhã)." },
      time: { type: Type.STRING, description: "Horário da refeição no formato HH:MM." },
      items: {
        type: Type.ARRAY,
        items: foodItemSchema,
      },
      totalCalories: { type: Type.NUMBER, description: "Soma das calorias de todos os itens da refeição." },
      totalMacros: macroDataSchema,
    },
    required: ['id', 'name', 'time', 'items', 'totalCalories', 'totalMacros'],
};
  
const dailyPlanSchema = {
    type: Type.OBJECT,
    properties: {
      date: { type: Type.STRING, description: "Data no formato YYYY-MM-DD." },
      dayOfWeek: { type: Type.STRING, description: "Dia da semana (ex: Segunda-feira)." },
      meals: {
        type: Type.ARRAY,
        description: "Uma lista de todas as refeições do dia.",
        items: mealSchema,
      },
      totalCalories: { type: Type.NUMBER, description: "Soma das calorias de todas as refeições." },
      totalMacros: macroDataSchema,
      waterGoal: { type: Type.NUMBER, description: "Meta de água em litros." },
      title: { type: Type.STRING, nullable: true, description: "Um título opcional para o plano do dia." },
      notes: { type: Type.STRING, nullable: true, description: "Notas ou observações opcionais sobre o plano." },
    },
    required: ['date', 'dayOfWeek', 'meals', 'totalCalories', 'totalMacros', 'waterGoal'],
};

const nutritionalInfoSchema = {
    type: Type.OBJECT,
    properties: {
        calories: { type: Type.STRING },
        protein: { type: Type.STRING },
        carbs: { type: Type.STRING },
        fat: { type: Type.STRING },
    },
    required: ['calories', 'protein', 'carbs', 'fat'],
};

const recipeSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        prepTime: { type: Type.STRING },
        difficulty: { type: Type.STRING, enum: ['Fácil', 'Médio', 'Difícil'] },
        servings: { type: Type.STRING },
        ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
        instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
        nutritionalInfo: nutritionalInfoSchema,
        imagePrompt: { type: Type.STRING },
    },
    required: ['id', 'title', 'description', 'prepTime', 'difficulty', 'servings', 'ingredients', 'instructions', 'nutritionalInfo', 'imagePrompt'],
};

const recipesSchema = {
    type: Type.ARRAY,
    items: recipeSchema
};

// --- API HELPERS ---

const generateJsonContent = async <T>(prompt: string, context: string, schema?: object, modelName: string = 'gemini-2.5-flash'): Promise<T> => {
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                ...(schema && { responseSchema: schema })
            },
        });

        const text = response.text;
        // The API might return the JSON wrapped in markdown backticks, so we clean it up.
        const cleanedText = text.replace(/^```json\n?/, '').replace(/```$/, '');
        return JSON.parse(cleanedText) as T;
    } catch (error) {
        console.error(`Error in '${context}':`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("API key not valid")) {
            throw new Error('Chave de API inválida. Verifique suas configurações.');
        }
        throw new Error(`Ocorreu um erro ao ${context}. Tente novamente.`);
    }
};

const generateTextContent = async (prompt: string, context: string, modelName: string = 'gemini-2.5-flash'): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error(`Error in '${context}':`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("API key not valid")) {
            throw new Error('Chave de API inválida. Verifique suas configurações.');
        }
        throw new Error(`Ocorreu um erro ao ${context}. Tente novamente.`);
    }
};


// --- EXPORTED FUNCTIONS ---

export async function* sendMessageToAI(message: string, history: any[]): AsyncGenerator<{ text: string }, void, unknown> {
    const modelName = 'gemini-2.5-flash';

    const contents = history.map(h => ({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
    }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    try {
        const resultStream = await ai.models.generateContentStream({
            model: modelName,
            contents,
        });

        for await (const chunk of resultStream) {
            const chunkText = chunk.text;
            if (chunkText) {
                yield { text: chunkText };
            }
        }
    } catch (error) {
        console.error("Streaming chat error:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("API key not valid")) {
            throw new Error('Chave de API inválida. Verifique suas configurações.');
        }
        throw new Error("Ocorreu um erro ao comunicar com o chat.");
    }
}

export const parseMealPlanText = (text: string): Promise<DailyPlan> => {
    const prompt = `Converta o seguinte texto de um plano alimentar em um objeto JSON estruturado.\n\nTexto:\n${text}`;
    return generateJsonContent<DailyPlan>(prompt, "importar dieta do chat", dailyPlanSchema);
};

export const generateDailyPlan = (userData: UserData, date: Date): Promise<DailyPlan> => {
    const userProfile = buildUserProfile(userData);
    const dateString = date.toISOString().split('T')[0];
    const prompt = `Com base no perfil do usuário, gere um plano alimentar completo para a data ${dateString}. O plano deve ser detalhado, alinhado com as metas de macronutrientes do usuário. Calcule e preencha os totais de calorias e macros para cada refeição e para o dia todo. ${userProfile}`;
    return generateJsonContent<DailyPlan>(prompt, "gerar nova dieta diária", dailyPlanSchema);
};

export const regenerateDailyPlan = (userData: UserData, currentPlan: DailyPlan, numberOfMeals?: number): Promise<DailyPlan> => {
    const userProfile = buildUserProfile(userData);
    const prompt = `Com base no perfil do usuário, gere um novo plano alimentar para a data ${currentPlan.date}. ${numberOfMeals ? `O plano deve ter exatamente ${numberOfMeals} refeições.` : ''} O plano deve ser uma alternativa ao plano original, mantendo as mesmas metas. ${userProfile}`;
    return generateJsonContent<DailyPlan>(prompt, "gerar nova dieta", mealSchema);
};

export const adjustDailyPlanForMacro = (userData: UserData, currentPlan: DailyPlan, macroToFix: keyof Omit<MacroData, 'calories'>): Promise<DailyPlan> => {
    const userProfile = buildUserProfile(userData);
    const prompt = `Ajuste este plano alimentar para se aproximar mais da meta de ${macroToFix}. Mantenha as calorias totais o mais próximo possível da meta. Plano original:\n${JSON.stringify(currentPlan)}\n${userProfile}`;
    return generateJsonContent<DailyPlan>(prompt, `ajustar meta de ${macroToFix}`, dailyPlanSchema);
};

export const generateWeeklyPlan = async (userData: UserData, weekStartDate: Date, observation?: string): Promise<Record<string, DailyPlan>> => {
    const userProfile = buildUserProfile(userData);
    const prompt = `Crie um plano alimentar para 7 dias, começando em ${new Date(weekStartDate).toISOString().split('T')[0]}. ${observation ? `Observação: ${observation}`: ''} Retorne um array de 7 objetos DailyPlan. ${userProfile}`;
    
    // FIX: Corrected typo from `weeklyPlanPlanSchema` to `weeklyPlanSchema`
    const weeklyPlanSchema = { type: Type.ARRAY, items: dailyPlanSchema };
    const planArray = await generateJsonContent<DailyPlan[]>(prompt, "gerar dieta semanal", weeklyPlanSchema);
    
    const planRecord: Record<string, DailyPlan> = {};
    for (const dayPlan of planArray) {
        if (dayPlan && dayPlan.date) {
            planRecord[dayPlan.date] = dayPlan;
        }
    }
    return planRecord;
};

export const regenerateMealFromPrompt = (prompt: string, meal: Meal, userData: UserData): Promise<Meal> => {
    const userProfile = buildUserProfile(userData);
    const promptText = `Regenere a refeição "${meal.name}" com base na seguinte instrução: "${prompt}". Calcule os novos totais de calorias e macros. ${userProfile}`;
    return generateJsonContent<Meal>(promptText, "regenerar refeição", mealSchema);
};

export const analyzeMealFromText = (description: string): Promise<MacroData> => {
    const prompt = `Analise esta descrição de uma refeição e retorne uma estimativa dos macronutrientes.\n\nDescrição: ${description}`;
    return generateJsonContent<MacroData>(prompt, "analisar refeição por texto", macroDataSchema);
};

export const analyzeMealFromImage = async (imageDataUrl: string): Promise<MacroData> => {
    try {
        const model = 'gemini-2.5-flash';
        const [header, base64Data] = imageDataUrl.split(',');
        if (!header || !base64Data) {
            throw new Error('Formato de imagem inválido.');
        }
        const mimeTypeMatch = header.match(/:(.*?);/);
        if (!mimeTypeMatch || !mimeTypeMatch[1]) {
            throw new Error('MIME type da imagem inválido.');
        }
        const mimeType = mimeTypeMatch[1];

        const prompt = `Analise esta imagem de uma refeição e retorne a estimativa de macronutrientes.`;
        
        const contents = [{
            parts: [
                { text: prompt },
                { inlineData: { mimeType, data: base64Data } }
            ]
        }];
        
        const response = await ai.models.generateContent({
            model,
            contents,
            config: { 
                responseMimeType: "application/json",
                responseSchema: macroDataSchema,
            }
        });

        const jsonText = response.text.replace(/^```json\n?/, '').replace(/```$/, '');
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error analyzing image:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
         if (errorMessage.includes("API key not valid")) {
            throw new Error('Chave de API inválida. Verifique suas configurações.');
        }
        throw new Error("Ocorreu um erro ao analisar a imagem. Tente novamente.");
    }
};

export const analyzeProgress = (userData: UserData): Promise<string> => {
    const userProfile = buildUserProfile(userData);
    const prompt = `Analise os dados de progresso do usuário e forneça um resumo motivacional com dicas. Fale diretamente com o usuário. ${userProfile}`;
    return generateTextContent(prompt, "analisar progresso");
};

export const generateShoppingList = (weekPlan: DailyPlan[]): Promise<string> => {
    const prompt = `Crie uma lista de compras detalhada e organizada por categorias (ex: Frutas, Vegetais, Carnes) com base no seguinte plano alimentar semanal:\n${JSON.stringify(weekPlan)}`;
    return generateTextContent(prompt, "gerar lista de compras");
};

export const getFoodInfo = (question: string, mealContext?: Meal): Promise<string> => {
    const prompt = `Responda à seguinte dúvida sobre alimentos de forma clara e concisa. Pergunta: "${question}" ${mealContext ? `Contexto da refeição: ${JSON.stringify(mealContext)}` : ''}`;
    return generateTextContent(prompt, "obter informação de alimento");
};

export const getFoodSubstitution = (itemToSwap: FoodItem, mealContext: Meal, userData: UserData): Promise<FoodItem> => {
    const userProfile = buildUserProfile(userData);
    const prompt = `Sugira um substituto para o item "${itemToSwap.name}" no contexto da refeição "${mealContext.name}". O substituto deve ter macros similares. ${userProfile}`;
    return generateJsonContent<FoodItem>(prompt, "encontrar substituto para alimento", foodItemSchema);
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
    try {
        const model = 'imagen-4.0-generate-001';
        const response = await ai.models.generateImages({
            model,
            prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg' }
        });
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } catch (error) {
        console.error("Error generating image:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("API key not valid")) {
            throw new Error('Chave de API inválida. Verifique suas configurações.');
        }
        throw new Error("Ocorreu um erro ao gerar a imagem.");
    }
};

export const findRecipes = (query: string, userData: UserData, numRecipes: number = 3): Promise<Recipe[]> => {
    const userProfile = buildUserProfile(userData);
    const prompt = `Encontre ${numRecipes} receitas com base na busca: "${query}". Para cada receita, forneça um prompt de imagem otimizado para um gerador de imagens. ${userProfile}`;
    return generateJsonContent<Recipe[]>(prompt, "buscar receitas", recipesSchema);
};