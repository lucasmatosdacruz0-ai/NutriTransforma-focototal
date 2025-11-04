
import { DailyPlan, Meal, UserData, MacroData, Recipe, FoodItem } from '../types';

/**
 * Helper function to make API calls to our secure backend endpoint.
 * It standardizes the fetch call and error handling for all non-streaming requests.
 */
async function callAPI<T>(action: string, payload: object): Promise<T> {
  try {
    const res = await fetch('/api/gemini', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });

    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ error: 'API Error: Failed to parse error response' }));
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
 * Special handler for streaming chat responses from the backend.
 */
export async function* sendMessageToAI(message: string, history: any[]): AsyncGenerator<{ text: string }, void, unknown> {
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
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        // The backend sends newline-delimited JSON
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the potentially incomplete last line

        for (const line of lines) {
            if (line.trim() === '') continue;
            try {
                const parsed = JSON.parse(line);
                if(parsed.text) {
                    yield { text: parsed.text };
                }
            } catch (e) {
                console.error("Failed to parse stream chunk:", line, e);
            }
        }
    }
    // Process any remaining data in the buffer
    if (buffer.trim()) {
        try {
            const parsed = JSON.parse(buffer);
            if(parsed.text) {
                yield { text: parsed.text };
            }
        } catch(e) {
            console.error("Failed to parse final stream chunk:", buffer, e);
        }
    }
}

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
