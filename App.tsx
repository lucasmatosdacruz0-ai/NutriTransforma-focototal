





import React, { useState, useEffect, useCallback, FC } from 'react';
import { View, UserData, UserDataHandlers, Message, DailyPlan, Recipe, RecipesViewState, NotificationState, UpsellModalState, PlanKey, DietDifficulty, MacroData, FoodItem, Meal } from './types';
import OnboardingFlow from './components/OnboardingFlow';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Dashboard from './components/Dashboard';
import ChatView from './components/ChatView';
import PlanoAlimentarView from './components/PlanoAlimentarView';
import ErrorBoundary from './components/ErrorBoundary';
import FavoritesView from './components/FavoritesView';
import ProgressView from './components/ProgressView';
import ProfileView from './components/ProfileView';
import FeaturesView from './components/FeaturesView';
import RecipesView from './components/RecipesView';
import AdminView from './components/AdminView';
import AchievementsView from './components/AchievementsView';
import ManageSubscriptionView from './components/ManageSubscriptionView';
import SubscriptionBlockView from './components/SubscriptionBlockView';
import SubscriptionModal from './components/SubscriptionModal';
import UpsellModal from './components/UpsellModal';
import ShoppingListModal from './components/ShoppingListModal';
import FlameOverlay from './components/FlameOverlay';
import Tutorial from './components/Tutorial';
import StartTutorialModal from './components/StartTutorialModal';
import FocoTotalView from './components/FocoTotalView'; // Import the new FocoTotalView


// FIX: Import missing icons for FAB
import { CalendarIcon } from './components/icons/CalendarIcon';
import { HomeIcon } from './components/icons/HomeIcon';

import * as geminiService from './services/geminiService';
import { calculateNewMacroGoals } from './components/calculations';
import { sanitizeDailyPlan, sanitizeMeal } from './components/utils/sanitizers';
import { calculateXPForLevel } from './components/utils/xpUtils';
import { ALL_ACHIEVEMENTS } from './constants/achievements';
import { TUTORIAL_STEPS } from './constants/tutorialSteps';
import { PLANS, ALL_FEATURES } from './constants/plans';

const defaultUserData: UserData = {
    isRegistered: false,
    name: '', email: '', profilePicture: null,
    instagram: '',
    whatsapp: '',
    age: 30, gender: 'male', height: 175, activityLevel: 'sedentary',
    initialWeight: 75, weight: 75, weightHistory: [], weightGoal: 70,
    water: 0, waterGoal: 2.5,
    waterReminders: { enabled: false, times: [] },
    mealReminders: { enabled: false },
    macros: {
        calories: { current: 0, goal: 2000 },
        carbs: { current: 0, goal: 250 },
        protein: { current: 0, goal: 150 },
        fat: { current: 0, goal: 67 }
    },
    dietaryPreferences: { diets: [], restrictions: [] },
    dietDifficulty: 'normal',
    streak: 0, completedDays: [],
    achievements: [], hasGeneratedPlan: false,
    level: 1, xp: 0,
    waterStreak: 0, totalRecipesGenerated: 0, imagesGeneratedCount: 0,
    athleteModeUsed: false, perfectDaysCount: 0, featuredAchievementId: null,
    hasCompletedTutorial: false, isSubscribed: false, trialEndDate: '',
    freeImagesGenerated: 0, currentPlan: null, billingCycle: null,
    dailyUsage: { date: '', dailyPlanGenerations: 0, dayRegenerations: 0, chatImports: 0, macroAdjustments: 0, progressAnalyses: 0, chatInteractions: 0, itemSwaps: 0, mealAnalysesText: 0, mealAnalysesImage: 0 },
    weeklyUsage: { weekStartDate: '', weeklyPlanGenerations: 0, shoppingLists: 0, recipeSearches: 0, imageGen: 0 },
    nutritionistInfo: null,
    modificationHistory: [],
};

const FAB: FC<{ activeView: View; setActiveView: (view: View) => void }> = ({ activeView, setActiveView }) => (
  <button
    onClick={() => setActiveView(activeView === 'Dashboard' ? 'Dieta' : 'Dashboard')}
    className={`dashboard-fab ${activeView !== 'Dashboard' ? 'active' : ''}`}
    aria-label={activeView === 'Dashboard' ? 'Ir para a Dieta' : 'Voltar para o Dashboard'}
  >
    <div className="flex items-center gap-2">
      <div className="icon">
        {activeView === 'Dashboard' ? <CalendarIcon className="w-6 h-6" /> : <HomeIcon className="w-6 h-6" />}
      </div>
      <span className="dashboard-fab-text text-sm font-bold">
        {activeView === 'Dashboard' ? 'Dieta' : 'Início'}
      </span>
    </div>
  </button>
);

const App: FC = () => {
    // Core State
    const [userData, setUserData] = useState<UserData | null>(null);
    const [activeView, setActiveView] = useState<View>('Dashboard');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Feature State
    const [mealPlan, setMealPlan] = useState<Record<string, DailyPlan> | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [lastMealPlanText, setLastMealPlanText] = useState<string | null>(null);
    const [favoritePlans, setFavoritePlans] = useState<DailyPlan[]>([]);
    const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
    const [recipesViewState, setRecipesViewState] = useState<RecipesViewState>({ activeTab: 'search', query: '', recipes: [], recipeImageCache: {} });
    const [shoppingListContent, setShoppingListContent] = useState<string | null>(null);

    // UI State
    const [notification, setNotification] = useState<NotificationState>(null);
    const [isPlanProcessing, setIsPlanProcessing] = useState(false);
    const [showFlame, setShowFlame] = useState(false);
    const [isSubscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
    const [upsellModalState, setUpsellModalState] = useState<UpsellModalState>({ isOpen: false, featureKey: null, featureText: null });
    
    // Tutorial State
    const [tutorialState, setTutorialState] = useState({ isActive: false, stepIndex: 0, isInitialModalOpen: false });
    
    // --- LIFECYCLE & DATA PERSISTENCE ---
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        try {
            const savedData = localStorage.getItem('nutribot-userdata');
            const savedMealPlan = localStorage.getItem('nutribot-mealplan');
            const savedMessages = localStorage.getItem('nutribot-messages');
            const savedFavPlans = localStorage.getItem('nutribot-fav-plans');
            const savedFavRecipes = localStorage.getItem('nutribot-fav-recipes');
            const savedRecipeCache = localStorage.getItem('nutribot-recipe-cache');

            if (savedData) {
                const parsedData = JSON.parse(savedData) as UserData;
                setUserData(checkAndResetUsage(parsedData));
                if (!parsedData.hasCompletedTutorial && parsedData.isRegistered) {
                    setTutorialState(prev => ({ ...prev, isInitialModalOpen: true }));
                }
            } else {
                setUserData(defaultUserData);
            }
            if (savedMealPlan) setMealPlan(JSON.parse(savedMealPlan));
            if (savedMessages) setMessages(JSON.parse(savedMessages));
            if (savedFavPlans) setFavoritePlans(JSON.parse(savedFavPlans));
            if (savedFavRecipes) setFavoriteRecipes(JSON.parse(savedFavRecipes));
            if (savedRecipeCache) setRecipesViewState(prev => ({...prev, recipeImageCache: JSON.parse(savedRecipeCache)}));
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
            localStorage.clear();
            setUserData(defaultUserData);
        }
    }, []);

    const saveDataToLocalStorage = useCallback((key: string, data: any) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Failed to save ${key} to localStorage`, error);
        }
    }, []);
    
    useEffect(() => { if (userData) saveDataToLocalStorage('nutribot-userdata', userData); }, [userData, saveDataToLocalStorage]);
    useEffect(() => { if (mealPlan) saveDataToLocalStorage('nutribot-mealplan', mealPlan); }, [mealPlan, saveDataToLocalStorage]);
    useEffect(() => { saveDataToLocalStorage('nutribot-messages', messages); }, [messages, saveDataToLocalStorage]);
    useEffect(() => { saveDataToLocalStorage('nutribot-fav-plans', favoritePlans); }, [favoritePlans, saveDataToLocalStorage]);
    useEffect(() => { saveDataToLocalStorage('nutribot-fav-recipes', favoriteRecipes); }, [favoriteRecipes, saveDataToLocalStorage]);
    useEffect(() => { saveDataToLocalStorage('nutribot-recipe-cache', recipesViewState.recipeImageCache); }, [recipesViewState.recipeImageCache, saveDataToLocalStorage]);

    // --- USAGE TRACKING ---
    const getStartOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        return new Date(d.setDate(diff));
    };

    const checkAndResetUsage = (data: UserData): UserData => {
        const today = new Date().toISOString().split('T')[0];
        const currentWeekStart = getStartOfWeek(new Date()).toISOString().split('T')[0];
        
        let updatedData = { ...data };
        
        if (data.dailyUsage?.date !== today) {
            updatedData.dailyUsage = { ...defaultUserData.dailyUsage, date: today };
        }
        if (data.weeklyUsage?.weekStartDate !== currentWeekStart) {
            updatedData.weeklyUsage = { ...defaultUserData.weeklyUsage, weekStartDate: currentWeekStart };
        }
        return updatedData;
    };

    const checkAndIncrementUsage = useCallback((featureKey: string, amount: number = 1): boolean => {
        if (!userData) return false;
        
        const isTrial = !userData.isSubscribed && new Date(userData.trialEndDate) > new Date();
        const planKey = isTrial ? 'pro' : (userData.isSubscribed && userData.currentPlan ? userData.currentPlan : 'basic');
        const plan = PLANS[planKey];
        if (!plan) return false;
        
        const feature = plan.features.find((f: any) => f.key === featureKey);
        if (!feature || feature.available === false) {
            setUpsellModalState({ isOpen: true, featureKey, featureText: (ALL_FEATURES as any)[featureKey]?.text });
            return false;
        }

        if (!feature.limit || feature.limit === Infinity) {
            return true; // Unlimited use
        }

        const isWeekly = feature.period === 'week';
        const usageData = isWeekly ? userData.weeklyUsage : userData.dailyUsage;
        const currentUsage = (usageData as any)[featureKey] || 0;
        const purchasedUsage = userData.purchasedUses?.[featureKey] || 0;

        if (currentUsage + amount > feature.limit + purchasedUsage) {
            setUpsellModalState({ isOpen: true, featureKey, featureText: (ALL_FEATURES as any)[featureKey]?.text });
            return false;
        }
        
        setUserData(prev => {
            if (!prev) return prev;
            const updatedUsageData = { ...usageData, [featureKey]: currentUsage + amount };
            return {
                ...prev,
                [isWeekly ? 'weeklyUsage' : 'dailyUsage']: updatedUsageData,
            };
        });

        return true;
    }, [userData]);


    // --- CORE HANDLERS ---
    const updateUserData = useCallback((data: Partial<UserData>) => {
        setUserData(prev => prev ? { ...prev, ...data } : null);
    }, []);

    const addXP = useCallback((amount: number, reason: string) => {
        if (!userData) return;
        setUserData(prev => {
            if (!prev) return null;
            let newXp = prev.xp + amount;
            let newLevel = prev.level;
            let xpForNextLevel = calculateXPForLevel(newLevel);
            while (newXp >= xpForNextLevel) {
                newXp -= xpForNextLevel;
                newLevel += 1;
                xpForNextLevel = calculateXPForLevel(newLevel);
                // TODO: Add level up notification
            }
            return { ...prev, xp: newXp, level: newLevel };
        });
        
        // Check for new achievements unlocked
        const newlyUnlocked = ALL_ACHIEVEMENTS.filter(ach => !userData.achievements.includes(ach.id));
        if (newlyUnlocked.length > 0) {
            // Re-evaluate achievements with new XP/level data
            // This is a simplified check; a more robust system would re-evaluate all achievements.
        }
    }, [userData]);


    const addWater = useCallback((amount: number) => {
        if (!userData) return;
        const newWaterTotal = Math.max(0, userData.water + amount);
        updateUserData({ water: newWaterTotal });
    }, [userData, updateUserData]);

    const handleLogMeal = useCallback((macros: MacroData) => {
        if (!userData) return;
        setUserData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                macros: {
                    calories: { ...prev.macros.calories, current: prev.macros.calories.current + macros.calories },
                    carbs: { ...prev.macros.carbs, current: prev.macros.carbs.current + macros.carbs },
                    protein: { ...prev.macros.protein, current: prev.macros.protein.current + macros.protein },
                    fat: { ...prev.macros.fat, current: prev.macros.fat.current + macros.fat },
                }
            };
        });
    }, [userData]);

    const handleUpdateWeight = useCallback((newWeight: number) => {
        if (!userData) return;
        const today = new Date().toISOString();
        const newHistory = [...userData.weightHistory, { date: today, weight: newWeight }];
        updateUserData({ weight: newWeight, weightHistory: newHistory });
        addXP(25, 'weight_logged');
    }, [userData, updateUserData, addXP]);

    const handleChangeDietDifficulty = useCallback((difficulty: DietDifficulty) => {
        if (!userData) return;
        const newMacros = calculateNewMacroGoals({ ...userData, dietDifficulty: difficulty });
        
        let athleteModeUsed = userData.athleteModeUsed;
        if (difficulty === 'athlete' && !athleteModeUsed) {
            athleteModeUsed = true;
            addXP(50, 'athlete_mode_first_use');
        }

        updateUserData({ dietDifficulty: difficulty, macros: newMacros, athleteModeUsed });
        
        if (difficulty === 'athlete') {
            setShowFlame(true);
            setTimeout(() => setShowFlame(false), 2200);
        }
    }, [userData, updateUserData, addXP]);

    const handleMarkDayAsCompleted = useCallback(() => {
        if (!userData) return;
        const todayStr = new Date().toISOString().split('T')[0];
        if (userData.completedDays.includes(todayStr)) return;
        
        updateUserData({
            completedDays: [...userData.completedDays, todayStr],
            streak: userData.streak + 1,
        });
        addXP(50, 'day_completed');
    }, [userData, updateUserData, addXP]);

    const setFeaturedAchievement = useCallback((id: string | null) => {
        updateUserData({ featuredAchievementId: id });
    }, [updateUserData]);
    
    // FIX: Removed handler for logging activities
    // const handleLogActivity = useCallback((newLog: ActivityLog) => {
    //     if (!userData) return;
    //     setUserData(prev => {
    //         if (!prev) return null;
    //         return {
    //             ...prev,
    //             activityLogs: [...prev.activityLogs, newLog],
    //         };
    //     });
    //     addXP(10, 'activity_logged');
    // }, [userData, addXP]);

    // --- TUTORIAL HANDLERS ---
    const startTutorial = useCallback(() => {
        setTutorialState({ isActive: true, stepIndex: 0, isInitialModalOpen: false });
        setActiveView('Dashboard');
    }, []);

    const completeTutorial = useCallback(() => {
        updateUserData({ hasCompletedTutorial: true });
        setTutorialState({ isActive: false, stepIndex: 0, isInitialModalOpen: false });
    }, [updateUserData]);
    
    // --- PLAN & AI HANDLERS ---
    const processPlanGeneration = async (
        serviceCall: () => Promise<any>,
        featureKey: string,
        onSuccess: (result: any) => void
    ) => {
        if (!checkAndIncrementUsage(featureKey)) return;
        setIsPlanProcessing(true);
        setNotification({ type: 'loading', message: 'Processando com IA...' });

        // Set a timeout to show a more detailed message if it takes too long
        const longRunningTaskTimeout = setTimeout(() => {
            setNotification({ 
                type: 'loading', 
                message: 'A IA está analisando seus dados para o melhor resultado. Isso pode levar um momento, é normal!' 
            });
        }, 4000); // 4 seconds threshold

        try {
            const result = await serviceCall();
            clearTimeout(longRunningTaskTimeout); // Clear the timeout if it finishes quickly
            onSuccess(result);
            setNotification({ type: 'success', message: 'Seu resultado foi gerado com sucesso!' });
        } catch (e) {
            clearTimeout(longRunningTaskTimeout);
            setNotification({ type: 'error', message: e instanceof Error ? e.message : 'Erro ao processar sua solicitação.' });
        } finally {
            setIsPlanProcessing(false);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const generateWeeklyPlan = useCallback(async (startDate: Date, observation?: string) => {
        if (!userData) return;
        await processPlanGeneration(
            () => geminiService.generateWeeklyPlan(userData, startDate, observation),
            'weeklyPlanGenerations',
            (newPlan: Record<string, DailyPlan>) => setMealPlan(prev => ({...prev, ...newPlan }))
        );
    }, [userData]);
    
    const generateDailyPlan = useCallback(async (date: Date) => {
        if (!userData) return;
        await processPlanGeneration(
            () => geminiService.generateDailyPlan(userData, date),
            'dailyPlanGenerations',
            (newPlan: DailyPlan) => {
                 const sanitized = sanitizeDailyPlan(newPlan);
                 if (sanitized) {
                    setMealPlan(prev => ({ ...prev, [sanitized.date]: sanitized }));
                    updateUserData({ hasGeneratedPlan: true });
                    addXP(20, 'plan_generated');
                 } else {
                    throw new Error("A IA retornou um formato de plano inválido.");
                 }
            }
        );
    }, [userData, updateUserData, addXP]);
    
    const importPlanFromChat = useCallback(async (text: string) => {
        await processPlanGeneration(
            () => geminiService.parseMealPlanText(text),
            'dailyPlanGenerations',
            (newPlan: DailyPlan) => {
                const sanitized = sanitizeDailyPlan(newPlan);
                if (sanitized) {
                    setMealPlan(prev => ({ ...prev, [sanitized.date]: sanitized }));
                    setActiveView('Dieta');
                } else {
                    throw new Error("A IA retornou um formato de plano inválido.");
                }
            }
        );
    }, [setActiveView]);

    const regenerateDay = useCallback(async (date: string, mealCount?: number) => {
        if (!userData || !mealPlan?.[date]) return;
        await processPlanGeneration(
            () => geminiService.regenerateDailyPlan(userData, mealPlan[date], mealCount),
            'dayRegenerations',
            (newPlan: DailyPlan) => {
                 const sanitized = sanitizeDailyPlan(newPlan);
                 if(sanitized) setMealPlan(prev => ({ ...prev, [date]: sanitized }));
            }
        );
    }, [userData, mealPlan]);
    
    const adjustDayForMacro = useCallback(async (date: string, macro: keyof Omit<MacroData, 'calories'>) => {
        if (!userData || !mealPlan?.[date]) return;
        await processPlanGeneration(
            () => geminiService.adjustDailyPlanForMacro(userData, mealPlan[date], macro),
            'macroAdjustments',
            (newPlan: DailyPlan) => {
                const sanitized = sanitizeDailyPlan(newPlan);
                if(sanitized) setMealPlan(prev => ({ ...prev, [date]: sanitized }));
            }
        );
    }, [userData, mealPlan]);
    
    const regenerateMeal = useCallback(async (date: string, mealId: string, prompt: string) => {
        if (!userData || !mealPlan?.[date]) return;
        const mealToRegen = mealPlan[date].meals.find(m => m.id === mealId);
        if (!mealToRegen) return;

        await processPlanGeneration(
            () => geminiService.regenerateMealFromPrompt(prompt, mealToRegen, userData),
            'itemSwaps', // Uses same quota as item swaps
            (newMealData: Meal) => {
                const sanitizedNewMeal = sanitizeMeal(newMealData);
                if (!sanitizedNewMeal) throw new Error("A IA retornou um formato de refeição inválido.");

                const updatedMeals = mealPlan[date].meals.map(m => m.id === mealId ? { ...sanitizedNewMeal, id: mealId } : m);
                const updatedPlan = { ...mealPlan[date], meals: updatedMeals };
                const sanitizedUpdatedPlan = sanitizeDailyPlan(updatedPlan);
                if (sanitizedUpdatedPlan) {
                    setMealPlan(prev => ({ ...prev, [date]: sanitizedUpdatedPlan }));
                }
            }
        );
    }, [userData, mealPlan]);

    const handleSwapItem = useCallback(async (date: string, mealId: string, itemToSwap: FoodItem) => {
        if (!userData || !mealPlan?.[date]) return;
        const mealContext = mealPlan[date].meals.find(m => m.id === mealId);
        if (!mealContext) return;
        
        await processPlanGeneration(
            () => geminiService.getFoodSubstitution(itemToSwap, mealContext, userData),
            'itemSwaps',
            (newItem: FoodItem) => {
                const updatedMeals = mealPlan[date].meals.map(m => {
                    if (m.id === mealId) {
                        return { ...m, items: m.items.map(i => i.name === itemToSwap.name ? newItem : i) };
                    }
                    return m;
                });
                const updatedPlan = { ...mealPlan[date], meals: updatedMeals };
                const sanitizedUpdatedPlan = sanitizeDailyPlan(updatedPlan);
                 if (sanitizedUpdatedPlan) {
                    setMealPlan(prev => ({ ...prev, [date]: sanitizedUpdatedPlan }));
                }
            }
        );
    }, [userData, mealPlan]);

    const updateMeal = useCallback((date: string, updatedMeal: Meal) => {
        setMealPlan(prev => {
            if (!prev || !prev[date]) return prev;
            const updatedMeals = prev[date].meals.map(m => m.id === updatedMeal.id ? updatedMeal : m);
            const updatedPlan = { ...prev[date], meals: updatedMeals };
            const sanitized = sanitizeDailyPlan(updatedPlan);
            return sanitized ? { ...prev, [date]: sanitized } : prev;
        });
    }, []);

    const generateShoppingList = useCallback(async (weekPlan: DailyPlan[]) => {
        if (weekPlan.length === 0) {
            setNotification({ type: 'info', message: 'Nenhum plano na semana para gerar a lista.' });
            setTimeout(() => setNotification(null), 3000);
            return;
        }
        await processPlanGeneration(
            () => geminiService.generateShoppingList(weekPlan),
            'shoppingLists',
            (list: string) => setShoppingListContent(list)
        );
    }, []);
    
    const handleChatSendMessage = useCallback(async (message: string, featureKey: string = 'chatInteractions') => {
        if(!checkAndIncrementUsage(featureKey)) {
            // A simple generator that yields nothing and returns
            async function* emptyGenerator() { yield* []; }
            return emptyGenerator();
        }
        const history = messages.slice(-10); // Pass last 10 messages as history
        setLastMealPlanText(null); // Reset before new message
        const stream = geminiService.sendMessageToAI(message, history);
        return stream;
    }, [messages, checkAndIncrementUsage]);

    const handleAnalyzeMeal = useCallback(async (data: { description?: string; imageDataUrl?: string }) => {
        if (data.imageDataUrl) {
            if(!checkAndIncrementUsage('mealAnalysesImage')) throw new Error("Limite de análise de imagem atingido.");
            return await geminiService.analyzeMealFromImage(data.imageDataUrl);
        } else if (data.description) {
            if(!checkAndIncrementUsage('mealAnalysesText')) throw new Error("Limite de análise de texto atingido.");
            return await geminiService.analyzeMealFromText(data.description);
        }
        throw new Error("Nenhuma descrição ou imagem fornecida.");
    }, [checkAndIncrementUsage]);

    const handleAnalyzeProgress = useCallback(async () => {
        if(!checkAndIncrementUsage('progressAnalyses') || !userData) {
            throw new Error("Limite de análise de progresso atingido.");
        }
        return await geminiService.analyzeProgress(userData);
    }, [userData, checkAndIncrementUsage]);
    
    const getFoodInfo = useCallback(async (question: string, mealContext?: Meal) => {
        if(!checkAndIncrementUsage('chatInteractions')) {
            throw new Error("Limite de interações com o chat atingido.");
        }
        return await geminiService.getFoodInfo(question, mealContext);
    }, [checkAndIncrementUsage]);
    
    // FIX: Define onNewMealPlanText to call importPlanFromChat
    const onNewMealPlanText = useCallback((text: string) => {
        importPlanFromChat(text);
    }, [importPlanFromChat]);

    // --- SUBSCRIPTION ---
    const handleSubscription = useCallback((plan: PlanKey, billingCycle: 'monthly' | 'annual') => {
        updateUserData({
            isSubscribed: true,
            currentPlan: plan,
            billingCycle: billingCycle,
        });
        setSubscriptionModalOpen(false);
        addXP(200, 'subscribed_pro');
    }, [updateUserData, addXP]);

    // --- FAVORITES ---
    const handleToggleFavoritePlan = useCallback((plan: DailyPlan) => {
        setFavoritePlans(prev => 
            prev.some(p => p.date === plan.date) 
                ? prev.filter(p => p.date !== plan.date)
                : [...prev, plan]
        );
    }, []);

    const handleToggleFavoriteRecipe = useCallback((recipe: Recipe) => {
        setFavoriteRecipes(prev => 
            prev.some(r => r.id === recipe.id) 
                ? prev.filter(r => r.id !== recipe.id)
                : [...prev, recipe]
        );
    }, []);

    // Other handlers that require full state context
    const handleOnboardingComplete = useCallback((data: Partial<UserData>) => {
        const fullData = {
            ...defaultUserData,
            ...data,
            isRegistered: true,
            weightHistory: [{ date: new Date().toISOString().split('T')[0], weight: data.weight! }],
        };
        setUserData(checkAndResetUsage(fullData));
        setTutorialState(prev => ({ ...prev, isInitialModalOpen: true }));
    }, []);
    
    const handlers: UserDataHandlers = {
        updateUserData,
        addWater,
        handleLogMeal,
        handleUpdateWeight,
        handleChangeDietDifficulty,
        handleMarkDayAsCompleted,
        addXP,
        setFeaturedAchievement,
        startTutorial,
        
        // Plan generation handlers
        generateWeeklyPlan,
        generateDailyPlan,
        importPlanFromChat,
        regenerateDay,
        adjustDayForMacro,
        regenerateMeal,
        updateMeal,
        generateShoppingList,
        handleSwapItem,

        // Subscription handler
        handleSubscription,
        openSubscriptionModal: () => setSubscriptionModalOpen(true),
        handleChangeSubscription: (newPlan: PlanKey) => updateUserData({ currentPlan: newPlan }),
        handleCancelSubscription: () => updateUserData({ isSubscribed: false, currentPlan: null, billingCycle: null }),
        handlePurchaseFeaturePack: (featureKey: string, packSize: number, price: number) => {
            setUserData(prev => {
                if (!prev) return prev;
                const currentPurchases = prev.purchasedUses?.[featureKey] || 0;
                return {
                    ...prev,
                    purchasedUses: {
                        ...prev.purchasedUses,
                        [featureKey]: currentPurchases + packSize,
                    }
                }
            });
            setUpsellModalState({ isOpen: false, featureKey: null, featureText: null });
            setNotification({ type: 'success', message: 'Pacote comprado com sucesso!' });
            setTimeout(() => setNotification(null), 3000);
        },

        // Centralized usage checker/incrementer
        checkAndIncrementUsage,

        // External AI call handlers for usage tracking
        handleChatSendMessage,
        handleAnalyzeMeal,
        handleAnalyzeProgress,
        getFoodInfo,
        // FIX: Remove handleLogActivity from handlers
        // handleLogActivity, 
        handleLogin: async () => ({ success: false, message: 'Não implementado.' }),
        handleRegister: async () => ({ success: false, message: 'Não implementado.' }),
        handleLogout: () => {
             if (window.confirm("Você tem certeza que quer sair? Isso apagará seus dados locais.")) {
                localStorage.clear();
                window.location.reload();
            }
        },
    };
    
    // --- RENDER LOGIC ---

    if (!userData) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green"></div>
            </div>
        );
    }
    
    if (!userData.isRegistered) {
        return <OnboardingFlow onComplete={handleOnboardingComplete} />;
    }

    const isTrialExpired = !userData.isSubscribed && new Date(userData.trialEndDate) <= new Date();
    if (isTrialExpired) {
        return <SubscriptionBlockView onOpenSubscriptionModal={() => setSubscriptionModalOpen(true)} />;
    }
    
    const themeClass = userData.dietDifficulty === 'athlete' ? 'theme-athlete' : 'theme-light';

    const renderActiveView = () => {
        switch (activeView) {
            case 'Dashboard': return <Dashboard userData={userData} handlers={handlers} setActiveView={setActiveView} mealPlan={mealPlan} />;
            case 'Chat IA': return <ChatView userData={userData} messages={messages} setMessages={setMessages} onNewMealPlanText={onNewMealPlanText} handlers={handlers} />;
            case 'Dieta': return <PlanoAlimentarView userData={userData} handlers={handlers} lastMealPlanText={lastMealPlanText} mealPlan={mealPlan} favoritePlans={favoritePlans} onToggleFavorite={handleToggleFavoritePlan} setActiveView={setActiveView} showNotification={setNotification} isPlanProcessing={isPlanProcessing} />;
            case 'Progresso': return <ProgressView userData={userData} handlers={handlers} />;
            case 'Favoritos': return <FavoritesView favoritePlans={favoritePlans} onToggleFavorite={handleToggleFavoritePlan} onUseToday={(plan) => { setMealPlan(p => ({...p, [new Date().toISOString().split('T')[0]]: plan})); setActiveView('Dieta'); }} onUpdateFavorite={(plan) => setFavoritePlans(fp => fp.map(p => p.date === plan.date ? plan : p))} />;
            case 'Recursos': return <FeaturesView setActiveView={setActiveView} userData={userData} />;
            case 'Receitas': return <RecipesView userData={userData} favoriteRecipes={favoriteRecipes} onToggleFavorite={handleToggleFavoriteRecipe} recipesViewState={recipesViewState} onStateChange={setRecipesViewState} onRecipesGenerated={(count) => updateUserData({ totalRecipesGenerated: userData.totalRecipesGenerated + count })} handlers={handlers} />;
            case 'Conta': return <ProfileView userData={userData} handlers={handlers} setActiveView={setActiveView} />;
            case 'Admin': return <AdminView userData={userData} handlers={handlers} setActiveView={setActiveView} showNotification={setNotification} />;
            case 'Conquistas': return <AchievementsView userData={userData} handlers={handlers} />;
            case 'Gerenciar Assinatura': return <ManageSubscriptionView userData={userData} handlers={handlers} setActiveView={setActiveView} />;
            case 'Foco Total': return <FocoTotalView userData={userData} handlers={handlers} />; // New FocoTotalView
            // FIX: Removed Atividades view case from switch
            default: return <Dashboard userData={userData} handlers={handlers} setActiveView={setActiveView} mealPlan={mealPlan} />;
        }
    };
    

    return (
        <div className={`flex h-full bg-slate-50 ${themeClass}`}>
            <Sidebar activeView={activeView} setActiveView={setActiveView} userData={userData} handlers={handlers} />
            <main className="flex-1 flex flex-col overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-4 pb-40 md:p-6 lg:p-8">
                    {/* FIX: Wrapped renderActiveView() inside the ErrorBoundary component to provide the required 'children' prop. */}
                    <ErrorBoundary>
                        {renderActiveView()}
                    </ErrorBoundary>
                </div>
                {isMobile && <FAB activeView={activeView} setActiveView={setActiveView} />}
            </main>
            <BottomNav activeView={activeView} setActiveView={setActiveView} />

            {/* Global Modals & Overlays */}
            <FlameOverlay show={showFlame} />
            {shoppingListContent && <ShoppingListModal isOpen={!!shoppingListContent} onClose={() => setShoppingListContent(null)} content={shoppingListContent} />}
            {isSubscriptionModalOpen && <SubscriptionModal isOpen={isSubscriptionModalOpen} onClose={() => setSubscriptionModalOpen(false)} onSubscribe={handleSubscription} theme={themeClass} />}
            <UpsellModal {...upsellModalState} onClose={() => setUpsellModalState({ isOpen: false, featureKey: null, featureText: null })} onNavigateToSubscription={() => { setUpsellModalState({ isOpen: false, featureKey: null, featureText: null }); setActiveView('Gerenciar Assinatura'); }} onPurchaseFeaturePack={handlers.handlePurchaseFeaturePack} />
            <StartTutorialModal isOpen={tutorialState.isInitialModalOpen} onStart={startTutorial} onSkip={() => { setTutorialState(prev => ({...prev, isInitialModalOpen: false})); updateUserData({ hasCompletedTutorial: true }); }} />
            <Tutorial 
                isActive={tutorialState.isActive}
                stepIndex={tutorialState.stepIndex}
                onNext={() => {
                    const nextStepIndex = tutorialState.stepIndex + 1;
                    if (nextStepIndex >= TUTORIAL_STEPS.length) {
                        completeTutorial();
                    } else {
                        const nextView = TUTORIAL_STEPS[nextStepIndex].view;
                        if (nextView !== activeView) setActiveView(nextView);
                        setTutorialState(prev => ({ ...prev, stepIndex: nextStepIndex }));
                    }
                }}
                onPrev={() => {
                    const prevStepIndex = tutorialState.stepIndex - 1;
                    if (prevStepIndex >= 0) {
                        const prevView = TUTORIAL_STEPS[prevStepIndex].view;
                        if (prevView !== activeView) setActiveView(prevView);
                        setTutorialState(prev => ({ ...prev, stepIndex: prevStepIndex }));
                    }
                }}
                onSkip={completeTutorial}
                isMobile={isMobile}
            />

            {notification && (
                <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 rounded-lg shadow-lg animate-slideInUp text-white font-semibold flex items-center gap-3" style={{ backgroundColor: notification.type === 'error' ? '#E53E3E' : notification.type === 'success' ? '#38A169' : '#3182CE' }}>
                    {notification.message}
                </div>
            )}
        </div>
    );
};

export default App;