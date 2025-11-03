
import { DailyPlan, Meal, UserData, MacroData, Recipe, FoodItem } from '../types';

/**
 * Helper function to make API calls to our secure backend endpoints.
 * It standardizes the fetch call and error handling.
 */
async function callAPI<T>(endpoint: string, body: object): Promise<T> {
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
        const errorBody = await res.json().catch(() => ({ error: 'API Error: Failed to parse error response' }));
        console.error(`API Error for ${endpoint}:`, errorBody);
        throw new Error(errorBody.error || `API Error: ${res.status}`);
    }

    const data = await res.json();
    return data.result;
  } catch (error) {
    console.error(`Error in callAPI for endpoint '${endpoint}':`, error);
    if (error instanceof Error) {
         throw new Error(`Ocorreu um erro ao comunicar com o servidor: ${error.message}`);
    }
    throw new Error('Ocorreu um erro desconhecido ao se comunicar com o servidor.');
  }
}

/**
 * Special handler for streaming responses from the backend.
 */
export async function* sendMessageToAI(message: string, history: any[]): AsyncGenerator<{ text: string }, void, unknown> {
    const response = await fetch('/api/sendMessageToAI', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
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
    return callAPI("/api/parseMealPlanText", { text });
};

export const generateDailyPlan = (userData: UserData, date: Date): Promise<DailyPlan> => {
    return callAPI("/api/generateDailyPlan", { 
        userData, 
        dateString: date.toISOString().split('T')[0] 
    });
};

export const regenerateDailyPlan = (userData: UserData, currentPlan: DailyPlan, numberOfMeals?: number): Promise<DailyPlan> => {
    return callAPI("/api/regenerateDailyPlan", { userData, currentPlan, numberOfMeals });
};

export const adjustDailyPlanForMacro = (userData: UserData, currentPlan: DailyPlan, macroToFix: keyof Omit<MacroData, 'calories'>): Promise<DailyPlan> => {
    return callAPI("/api/adjustDailyPlanForMacro", { userData, currentPlan, macroToFix });
};

export const generateWeeklyPlan = (userData: UserData, weekStartDate: Date, observation?: string): Promise<Record<string, DailyPlan>> => {
    return callAPI("/api/generateWeeklyPlan", { 
        userData, 
        weekStartDate: weekStartDate.toISOString().split('T')[0],
        observation 
    });
};

export const regenerateMealFromPrompt = (prompt: string, meal: Meal, userData: UserData): Promise<Meal> => {
    return callAPI("/api/regenerateMealFromPrompt", { prompt, meal, userData });
};

export const analyzeMealFromText = (description: string): Promise<MacroData> => {
    return callAPI("/api/analyzeMealFromText", { description });
};

export const analyzeMealFromImage = (imageDataUrl: string): Promise<MacroData> => {
    return callAPI("/api/analyzeMealFromImage", { imageDataUrl });
};

export const analyzeProgress = (userData: UserData): Promise<string> => {
    return callAPI("/api/analyzeProgress", { userData });
};

export const generateShoppingList = (weekPlan: DailyPlan[]): Promise<string> => {
    return callAPI("/api/generateShoppingList", { weekPlan });
};

export const getFoodInfo = (question: string, mealContext?: Meal): Promise<string> => {
    return callAPI("/api/getFoodInfo", { question, mealContext });
};

export const getFoodSubstitution = (itemToSwap: FoodItem, mealContext: Meal, userData: UserData): Promise<FoodItem> => {
    return callAPI("/api/getFoodSubstitution", { itemToSwap, mealContext, userData });
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
    const base64ImageBytes = await callAPI<string>("/api/generateImageFromPrompt", { prompt });
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const findRecipes = (query: string, userData: UserData, numRecipes: number = 3): Promise<Recipe[]> => {
    return callAPI("/api/findRecipes", { query, userData, numRecipes });
};
