import { DailyPlan, FoodItem, Meal } from '../types';

export const sanitizeFoodItem = (item: any): FoodItem | null => {
    if (typeof item !== 'object' || item === null || typeof item.name !== 'string') return null;
    return {
        name: item.name,
        portion: typeof item.portion === 'string' ? item.portion : 'N/A',
        calories: typeof item.calories === 'number' ? item.calories : 0,
        carbs: typeof item.carbs === 'number' ? item.carbs : 0,
        protein: typeof item.protein === 'number' ? item.protein : 0,
        fat: typeof item.fat === 'number' ? item.fat : 0,
    };
};

export const sanitizeMeal = (meal: any): Meal | null => {
    if (typeof meal !== 'object' || meal === null || !Array.isArray(meal.items)) return null;
    const sanitizedItems = meal.items.map(sanitizeFoodItem).filter(Boolean) as FoodItem[];
    
    const totalMacros = sanitizedItems.reduce((acc, item) => {
        acc.calories += item.calories;
        acc.carbs += item.carbs;
        acc.protein += item.protein;
        acc.fat += item.fat;
        return acc;
    }, { calories: 0, carbs: 0, protein: 0, fat: 0 });
    return {
        id: typeof meal.id === 'string' ? meal.id : `meal-${Date.now()}`,
        name: typeof meal.name === 'string' ? meal.name : 'Refeição Inválida',
        time: typeof meal.time === 'string' ? meal.time : '00:00',
        items: sanitizedItems,
        totalCalories: Math.round(totalMacros.calories),
        totalMacros: {
            calories: Math.round(totalMacros.calories),
            carbs: Math.round(totalMacros.carbs),
            protein: Math.round(totalMacros.protein),
            fat: Math.round(totalMacros.fat),
        },
    };
};

export const sanitizeDailyPlan = (plan: any): DailyPlan | null => {
    if (typeof plan !== 'object' || plan === null || !Array.isArray(plan.meals)) return null;
    const sanitizedMeals = plan.meals.map(sanitizeMeal).filter(Boolean) as Meal[];

    const totalMacros = sanitizedMeals.reduce((acc, meal) => {
        acc.calories += meal.totalCalories;
        acc.carbs += meal.totalMacros.carbs;
        acc.protein += meal.totalMacros.protein;
        acc.fat += meal.totalMacros.fat;
        return acc;
    }, { calories: 0, carbs: 0, protein: 0, fat: 0 });
    return {
        date: typeof plan.date === 'string' ? plan.date : new Date().toISOString().split('T')[0],
        dayOfWeek: typeof plan.dayOfWeek === 'string' ? plan.dayOfWeek : 'Dia Inválido',
        meals: sanitizedMeals,
        totalCalories: Math.round(totalMacros.calories),
        totalMacros: {
            calories: Math.round(totalMacros.calories),
            carbs: Math.round(totalMacros.carbs),
            protein: Math.round(totalMacros.protein),
            fat: Math.round(totalMacros.fat),
        },
        waterGoal: typeof plan.waterGoal === 'number' ? plan.waterGoal : 2.5,
        title: typeof plan.title === 'string' ? plan.title : undefined,
        notes: typeof plan.notes === 'string' ? plan.notes : undefined,
    };
};
