import { DailyPlan, Meal, UserData, MacroData, Recipe, FoodItem } from '../types';

/**
 * Helper function to make API calls to our secure backend endpoint.
 * It standardizes the fetch call and error handling for all non-streaming requests.
 */
async function callAPI<T>(action: string, payload: object): Promise<T> {
  try {
    // Use o endpoint unificado /api
    const res = await fetch('/api', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });

    if (!res.ok) {
        let errorBody;
        try {
            // Tenta analisar a resposta de erro JSON
            errorBody = await res.json();
        } catch {
            // Se a análise falhar (ex: 404 HTML), usa o status text
            errorBody = { error: `API Error: ${res.status} ${res.statusText}. Verifique os logs do servidor.` };
        }
        
        console.error(`API Error for ${action}:`, errorBody);
        throw new Error(errorBody.error || `API Error: ${res.status}`);
    }

    const data = await res.json();
    return data.result;
  } catch (error) {
    console.error(`Error in callAPI for action '${action}':`, error);
    if (error instanceof Error) {
         throw new Error(`Ocorreu um erro ao comunicar com o servidor: ${error.message}`);
    }
    throw new Error('Ocorreu um erro desconhecido ao se comunicar com o servidor.');
  }
}

/**
 * Sends a message to the AI and gets a single, complete response.
 */
export const sendMessageToAI = async (message: string, history: any[]): Promise<{ text: string }> => {
    return callAPI<{ text: string }>("sendMessageToAI", { message, history });
};

export const parseMealPlanText = (text: string): Promise<DailyPlan> => {
    return callAPI("parseMealPlanText", { text });
};

export const generateDailyPlan = (userData: UserData, date: Date): Promise<DailyPlan> => {
    return callAPI("generateDailyPlan", { 
        userData, 
        dateString: date.toISOString().split('T')[0] 
    });
};

export const regenerateDailyPlan = (userData: UserData, currentPlan: DailyPlan, numberOfMeals?: number): Promise<DailyPlan> => {
    return callAPI("regenerateDailyPlan", { userData, currentPlan, numberOfMeals });
};

export const adjustDailyPlanForMacro = (userData: UserData, currentPlan: DailyPlan, macroToFix: keyof Omit<MacroData, 'calories'>): Promise<DailyPlan> => {
    return callAPI("adjustDailyPlanForMacro", { userData, currentPlan, macroToFix });
};

export const generateWeeklyPlan = (userData: UserData, weekStartDate: Date, observation?: string): Promise<Record<string, DailyPlan>> => {
    return callAPI("generateWeeklyPlan", { 
        userData, 
        weekStartDate: weekStartDate.toISOString().split('T')[0],
        observation 
    });
};

export const regenerateMealFromPrompt = (prompt: string, meal: Meal, userData: UserData): Promise<Meal> => {
    return callAPI("regenerateMealFromPrompt", { prompt, meal, userData });
};

export const analyzeMealFromText = (description: string): Promise<MacroData> => {
    return callAPI("analyzeMealFromText", { description });
};

export const analyzeMealFromImage = (imageDataUrl: string): Promise<MacroData> => {
    return callAPI("analyzeMealFromImage", { imageDataUrl });
};

export const analyzeProgress = (userData: UserData): Promise<string> => {
    return callAPI("analyzeProgress", { userData });
};

export const generateShoppingList = (weekPlan: DailyPlan[]): Promise<string> => {
    return callAPI("generateShoppingList", { weekPlan });
};

export const getFoodInfo = (question: string, mealContext?: Meal): Promise<string> => {
    return callAPI("getFoodInfo", { question, mealContext });
};

export const getFoodSubstitution = (itemToSwap: FoodItem, mealContext: Meal, userData: UserData): Promise<FoodItem> => {
    return callAPI("getFoodSubstitution", { itemToSwap, mealContext, userData });
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
    const base64ImageBytes = await callAPI<string>("generateImageFromPrompt", { prompt });
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const findRecipes = (query: string, userData: UserData, numRecipes: number = 3): Promise<Recipe[]> => {
    return callAPI("findRecipes", { query, userData, numRecipes });
};