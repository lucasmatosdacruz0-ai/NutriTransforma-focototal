import { DailyPlan, FoodItem, Meal, MacroData } from '../types';

const mealTemplates: { name: string; time: string; items: FoodItem[] }[] = [
    {
        name: 'Café da Manhã',
        time: '08:00',
        items: [
            { name: 'Pão integral', portion: '2 fatias (50g)', calories: 138, carbs: 26, protein: 6, fat: 2 },
            { name: 'Ovos mexidos', portion: '2 unidades', calories: 156, carbs: 1, protein: 12, fat: 11 },
            { name: 'Mamão papaya', portion: '1/2 unidade (150g)', calories: 65, carbs: 16, protein: 1, fat: 0 },
        ],
    },
    {
        name: 'Lanche da Manhã',
        time: '10:30',
        items: [
            { name: 'Castanhas-do-pará', portion: '2 unidades (10g)', calories: 66, carbs: 1, protein: 1.5, fat: 6 },
        ],
    },
    {
        name: 'Almoço',
        time: '13:00',
        items: [
            { name: 'Filé de frango grelhado', portion: '1 filé (150g)', calories: 248, carbs: 0, protein: 46, fat: 6 },
            { name: 'Arroz integral', portion: '4 colheres de sopa (100g)', calories: 124, carbs: 26, protein: 2.6, fat: 1 },
            { name: 'Feijão carioca', portion: '1 concha (100g)', calories: 76, carbs: 14, protein: 5, fat: 0.5 },
            { name: 'Salada de alface e tomate', portion: '1 prato', calories: 30, carbs: 6, protein: 2, fat: 0 },
        ],
    },
     {
        name: 'Lanche da Tarde',
        time: '16:00',
        items: [
            { name: 'Iogurte grego natural', portion: '1 pote (100g)', calories: 97, carbs: 4, protein: 17, fat: 1 },
            { name: 'Banana', portion: '1 unidade (100g)', calories: 89, carbs: 23, protein: 1, fat: 0 },
        ],
    },
    {
        name: 'Jantar',
        time: '19:30',
        items: [
            { name: 'Omelete com queijo', portion: '2 ovos', calories: 250, carbs: 2, protein: 18, fat: 19 },
            { name: 'Salada de folhas verdes com azeite', portion: '1 prato', calories: 70, carbs: 4, protein: 2, fat: 5 },
        ],
    },
    {
        name: 'Ceia',
        time: '22:00',
        items: [
            { name: 'Chá de camomila', portion: '1 xícara (200ml)', calories: 2, carbs: 0.5, protein: 0, fat: 0 },
        ],
    },
];

const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const sumMacros = (items: (Meal | FoodItem)[]): MacroData => {
    return items.reduce((acc, item) => {
        const macros = 'totalMacros' in item ? item.totalMacros : item;
        acc.calories += macros.calories;
        acc.carbs += macros.carbs;
        acc.protein += macros.protein;
        acc.fat += macros.fat;
        return acc;
    }, { calories: 0, carbs: 0, protein: 0, fat: 0 });
};

export function generateMockMealPlan(startDate: Date, singleDay: true): DailyPlan;
export function generateMockMealPlan(startDate: Date, singleDay?: false): Record<string, DailyPlan>;
export function generateMockMealPlan(startDate: Date, singleDay: boolean = false): DailyPlan | Record<string, DailyPlan> {
    const plan: Record<string, DailyPlan> = {};
    const weekDays = singleDay ? 1 : 7;

    for (let i = 0; i < weekDays; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        
        const dayOfWeekIndex = date.getDay();
        
        const meals: Meal[] = mealTemplates.map((template, index) => {
            const randomFactor = 1 + (Math.random() - 0.5) * 0.1; // +/- 5%
            const items = template.items.map(item => ({
                ...item, 
                calories: Math.round(item.calories * randomFactor),
                carbs: Math.round(item.carbs * randomFactor),
                protein: Math.round(item.protein * randomFactor),
                fat: Math.round(item.fat * randomFactor),
            }));

            const totalMacros = sumMacros(items);
            
            return {
                ...template,
                id: `${date.toISOString().split('T')[0]}-${index}`,
                items: items,
                totalCalories: Math.round(totalMacros.calories),
                totalMacros: totalMacros
            }
        });

        const totalDailyMacros = sumMacros(meals);
        const dateString = date.toISOString().split('T')[0];

        plan[dateString] = {
            date: dateString,
            dayOfWeek: dayNames[dayOfWeekIndex],
            meals: meals,
            totalCalories: Math.round(totalDailyMacros.calories),
            totalMacros: totalDailyMacros,
            waterGoal: 2.5
        };
    }
    
    if (singleDay) {
        const dateString = startDate.toISOString().split('T')[0];
        return plan[dateString];
    }

    return plan;
};