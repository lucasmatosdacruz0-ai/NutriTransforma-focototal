import { DailyPlan, Meal, UserData, MacroData, Recipe, FoodItem } from '../types';

// Helper function for making API calls to our secure backend endpoint
async function apiCall<T>(action: string, payload: object): Promise<T> {
    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, payload }),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
            throw new Error(errorBody.error || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result.data as T;

    } catch (error) {
        console.error(`Error in apiCall for action '${action}':`, error);
        if (error instanceof Error) {
            if (error.message.includes("API key not valid")) {
                throw new Error('Chave de API inválida. Verifique suas configurações na Vercel.');
            }
             throw new Error(`Ocorreu um erro ao comunicar com o servidor: ${error.message}`);
        }
        throw new Error('Ocorreu um erro desconhecido.');
    }
}


// --- EXPORTED FUNCTIONS ---

export async function* sendMessageToAI(message: string, history: any[]): AsyncGenerator<{ text: string }, void, unknown> {
    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'sendMessageToAI', payload: { message, history } }),
        });

        if (!response.ok || !response.body) {
            const errorBody = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
            throw new Error(errorBody.error || `HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            const chunkText = decoder.decode(value);
            yield { text: chunkText };
        }

    } catch (error) {
        console.error("Streaming chat error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        throw new Error(`Ocorreu um erro ao comunicar com o chat: ${errorMessage}`);
    }
}

export const parseMealPlanText = (text: string): Promise<DailyPlan> => {
    return apiCall<DailyPlan>('parseMealPlanText', { text });
};

export const generateDailyPlan = (userData: UserData, date: Date): Promise<DailyPlan> => {
    return apiCall<DailyPlan>('generateDailyPlan', { 
        userData, 
        dateString: date.toISOString().split('T')[0] 
    });
};

export const regenerateDailyPlan = (userData: UserData, currentPlan: DailyPlan, numberOfMeals?: number): Promise<DailyPlan> => {
    return apiCall<DailyPlan>('regenerateDailyPlan', { userData, currentPlan, numberOfMeals });
};

export const adjustDailyPlanForMacro = (userData: UserData, currentPlan: DailyPlan, macroToFix: keyof Omit<MacroData, 'calories'>): Promise<DailyPlan> => {
    return apiCall<DailyPlan>('adjustDailyPlanForMacro', { userData, currentPlan, macroToFix });
};

export const generateWeeklyPlan = (userData: UserData, weekStartDate: Date, observation?: string): Promise<Record<string, DailyPlan>> => {
    return apiCall<Record<string, DailyPlan>>('generateWeeklyPlan', { 
        userData, 
        weekStartDate: weekStartDate.toISOString().split('T')[0],
        observation 
    });
};

export const regenerateMealFromPrompt = (prompt: string, meal: Meal, userData: UserData): Promise<Meal> => {
    return apiCall<Meal>('regenerateMealFromPrompt', { prompt, meal, userData });
};

export const analyzeMealFromText = (description: string): Promise<MacroData> => {
    return apiCall<MacroData>('analyzeMealFromText', { description });
};

export const analyzeMealFromImage = (imageDataUrl: string): Promise<MacroData> => {
    return apiCall<MacroData>('analyzeMealFromImage', { imageDataUrl });
};

export const analyzeProgress = (userData: UserData): Promise<string> => {
    return apiCall<string>('analyzeProgress', { userData });
};

export const generateShoppingList = (weekPlan: DailyPlan[]): Promise<string> => {
    return apiCall<string>('generateShoppingList', { weekPlan });
};

export const getFoodInfo = (question: string, mealContext?: Meal): Promise<string> => {
    return apiCall<string>('getFoodInfo', { question, mealContext });
};

export const getFoodSubstitution = (itemToSwap: FoodItem, mealContext: Meal, userData: UserData): Promise<FoodItem> => {
    return apiCall<FoodItem>('getFoodSubstitution', { itemToSwap, mealContext, userData });
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
    const base64ImageBytes = await apiCall<string>('generateImageFromPrompt', { prompt });
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const findRecipes = (query: string, userData: UserData, numRecipes: number = 3): Promise<Recipe[]> => {
    return apiCall<Recipe[]>('findRecipes', { query, userData, numRecipes });
};