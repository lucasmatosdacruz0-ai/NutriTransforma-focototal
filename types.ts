


import React from 'react';

export type View = 'Dashboard' | 'Chat IA' | 'Dieta' | 'Progresso' | 'Favoritos' | 'Recursos' | 'Conta' | 'Receitas' | 'Admin' | 'Conquistas' | 'Gerenciar Assinatura' | 'Foco Total';

export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type AchievementCategory = 'streak' | 'weight' | 'plan' | 'registration' | 'water' | 'recipe' | 'profile' | 'consistency';

export type PlanKey = 'basic' | 'pro' | 'premium';

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
    goal: number;
    category: AchievementCategory;
    isSecret?: boolean;
    xpReward?: number;
}

export interface AchievementProgress {
    current: number;
    goal: number;
    unlocked: boolean;
}

export interface NavItem {
    name: View;
    icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
}

export interface Message {
    sender: 'user' | 'bot';
    text: string;
    isStreaming?: boolean;
}

export interface MacroData {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
}

export interface WaterReminderSettings {
    enabled: boolean;
    times: string[]; // e.g., ["09:00", "11:30"]
}

export interface MealReminderSettings {
    enabled: boolean;
}

export interface MacroTracker {
    current: number;
    goal: number;
}

export interface UserMacros {
    calories: MacroTracker;
    carbs: MacroTracker;
    protein: MacroTracker;
    fat: MacroTracker;
}

export interface DietaryPreferences {
    diets: string[];
    restrictions: string[];
}

export type DietDifficulty = 'normal' | 'easy' | 'athlete';

export interface AdminSettings {
    permanentPrompt: string;
}

export interface DailyUsage {
    date: string; // YYYY-MM-DD
    dailyPlanGenerations: number;
    dayRegenerations: number;
    chatImports: number;
    macroAdjustments: number;
    progressAnalyses: number;
    chatInteractions: number;
    itemSwaps: number;
    mealAnalysesText: number;
    mealAnalysesImage: number;
}

export interface WeeklyUsage {
    weekStartDate: string; // YYYY-MM-DD of the start of the week
    weeklyPlanGenerations: number;
    shoppingLists: number;
    recipeSearches: number;
    imageGen: number;
}

export interface UserData {
    isRegistered: boolean;
    name: string;
    email: string;
    profilePicture: string | null;
    instagram?: string;
    whatsapp?: string;
    age: number;
    gender: Gender;
    height: number;
    activityLevel: ActivityLevel;
    initialWeight: number;
    weight: number;
    weightHistory: { date: string; weight: number }[];
    weightGoal: number;
    water: number;
    waterGoal: number;
    waterReminders: WaterReminderSettings;
    mealReminders: MealReminderSettings;
    macros: UserMacros;
    dietaryPreferences: DietaryPreferences;
    dietDifficulty: DietDifficulty;
    streak: number;
    completedDays: string[]; // Array of dates in 'YYYY-MM-DD' format
    achievements: string[];
    hasGeneratedPlan: boolean;
    level: number;
    xp: number;
    waterStreak: number;
    totalRecipesGenerated: number; // Renamed from recipesGeneratedCount
    imagesGeneratedCount: number; // For Pro/Premium users
    athleteModeUsed: boolean;
    perfectDaysCount: number;
    featuredAchievementId: string | null;
    hasCompletedTutorial: boolean;
    adminSettings?: AdminSettings;
    isSubscribed: boolean;
    trialEndDate: string; // ISO String
    freeImagesGenerated: number;
    currentPlan: PlanKey | null;
    billingCycle: 'monthly' | 'annual' | null;
    
    // Granular, time-based usage tracking
    dailyUsage: DailyUsage;
    weeklyUsage: WeeklyUsage;
    purchasedUses?: { [key: string]: number };

    // Nutritionist specific fields
    nutritionistInfo?: { name: string; email: string; } | null;
    modificationHistory?: { date: string; nutritionistName: string; }[];
}

export interface UpsellModalState {
    isOpen: boolean;
    featureKey: string | null;
    featureText: string | null;
}

export interface UserDataHandlers {
    updateUserData: (data: Partial<UserData>) => void;
    addWater: (amount: number) => void;
    handleLogMeal: (macros: MacroData) => void;
    handleUpdateWeight: (newWeight: number) => void;
    handleChangeDietDifficulty: (difficulty: DietDifficulty) => void;
    handleMarkDayAsCompleted: () => void;
    addXP: (amount: number, reason: string) => void;
    setFeaturedAchievement: (id: string | null) => void;
    startTutorial: () => void;
    
    // Plan generation handlers
    generateWeeklyPlan: (startDate: Date, observation?: string) => Promise<void>;
    generateDailyPlan: (date: Date) => Promise<void>;
    importPlanFromChat: (text: string) => Promise<void>;
    regenerateDay: (date: string, mealCount?: number) => Promise<void>;
    adjustDayForMacro: (date: string, macro: keyof Omit<MacroData, 'calories'>) => Promise<void>;
    regenerateMeal: (date: string, mealId: string, prompt: string) => Promise<void>;
    updateMeal: (date: string, updatedMeal: Meal) => void;
    generateShoppingList: (weekPlan: DailyPlan[]) => Promise<void>;
    handleSwapItem: (date: string, mealId: string, itemToSwap: FoodItem) => Promise<void>;

    // Subscription handler
    handleSubscription: (plan: PlanKey, billingCycle: 'monthly' | 'annual') => void;
    openSubscriptionModal: () => void;
    handleChangeSubscription: (newPlan: PlanKey) => void;
    handleCancelSubscription: () => void;
    handlePurchaseFeaturePack: (featureKey: string, packSize: number, price: number) => void;

    // Centralized usage checker/incrementer
    checkAndIncrementUsage: (featureKey: string, amount?: number) => boolean;

    // External AI call handlers for usage tracking
    handleChatSendMessage: (message: string, featureKey?: string) => Promise<AsyncGenerator<any, void, unknown>>;
    handleAnalyzeMeal: (data: { description?: string; imageDataUrl?: string }) => Promise<MacroData>;
    handleAnalyzeProgress: () => Promise<string>;
    getFoodInfo: (question: string, mealContext?: Meal) => Promise<string>;

    // Authentication handlers
    handleLogin: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
    handleRegister: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
    handleLogout: () => void;
}


// Interfaces para o Plano Alimentar
export interface FoodItem {
    name: string;
    portion: string; // Ex: "1 colher de sopa (15g)"
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
}

export interface Meal {
    id: string;
    name: string;
    time: string;
    items: FoodItem[];
    totalCalories: number;
    totalMacros: MacroData;
}

export interface DailyPlan {
    date: string; // YYYY-MM-DD
    dayOfWeek: string;
    meals: Meal[];
    totalCalories: number;
    totalMacros: MacroData;
    waterGoal: number;
    title?: string;
    notes?: string;
}

// Interfaces para Receitas
export interface NutritionalInfo {
    calories: string; // Ex: "350-450 kcal"
    protein: string; // Ex: "30g"
    carbs: string; // Ex: "25g"
    fat: string; // Ex: "15g"
}

export interface Recipe {
    id: string;
    title: string;
    description: string;
    prepTime: string; // Ex: "Aprox. 30 min"
    difficulty: 'Fácil' | 'Médio' | 'Difícil';
    servings: string; // Ex: "2 porções"
    ingredients: string[];
    instructions: string[];
    nutritionalInfo: NutritionalInfo;
    imagePrompt: string; // Um prompt de imagem otimizado para gerar a imagem da receita
    generatedImage?: string; // Base64 da imagem gerada
}

export interface RecipesViewState {
    activeTab: 'search' | 'favorites';
    query: string;
    recipes: Recipe[];
    recipeImageCache: Record<string, string>;
}


// Tipo para o estado de notificação global
export type NotificationState = {
    message: string;
    type: 'loading' | 'info' | 'success' | 'error';
} | null;


export interface TutorialStep {
  elementId: string;
  view: View;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  requiresElement?: boolean;
}