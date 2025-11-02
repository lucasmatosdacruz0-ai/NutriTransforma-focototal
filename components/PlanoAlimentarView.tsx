

import React, { useState, useMemo, FC, useEffect } from 'react';
import { UserData, DailyPlan, Meal, View, UserDataHandlers, MacroData, DietDifficulty, FoodItem, NotificationState } from '../types';
import MealCard from './MealCard';
import { SparklesIcon } from './icons/SparklesIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { TargetIcon } from './icons/TargetIcon';
import { FireIcon } from './icons/FireIcon';
import { BowlIcon } from './icons/BowlIcon';
import { BellIcon } from './icons/BellIcon';
import { ChatIcon } from './icons/ChatIcon';
import { StarIcon } from './icons/StarIcon';
import { CheckIcon } from './icons/CheckIcon';
import { DumbbellIcon } from './icons/DumbbellIcon';
import { ListIcon } from './icons/ListIcon';
import AdminAccessSection from './AdminAccessSection';
import { PLANS } from '../constants/plans';
import { ShareIcon } from './icons/ShareIcon';
import html2canvas from 'html2canvas';
import { DietImage } from './DietImage';
import ShareDietModal from './ShareDietModal';
import { ChevronUpIcon } from './icons/ChevronUpIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface PlanoAlimentarViewProps {
  userData: UserData;
  handlers: UserDataHandlers;
  lastMealPlanText: string | null;
  mealPlan: Record<string, DailyPlan> | null;
  favoritePlans: DailyPlan[];
  onToggleFavorite: (plan: DailyPlan) => void;
  setActiveView: (view: View) => void;
  showNotification: (notification: NotificationState) => void;
  isPlanProcessing: boolean;
}

const formatDate = (date: Date, options: Intl.DateTimeFormatOptions) => {
  return new Intl.DateTimeFormat('pt-BR', options).format(date);
};

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const isSameDay = (d1: Date, d2: Date) => {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const LoadingSpinner: FC<{className?: string}> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const getRemainingUses = (userData: UserData, featureKey: string) => {
    const isTrial = !userData.isSubscribed && new Date(userData.trialEndDate) > new Date();
    const planKey = isTrial ? 'pro' : (userData.isSubscribed && userData.currentPlan ? userData.currentPlan : 'basic');
    const plan = PLANS[planKey];
    if (!plan) return { remaining: 0, limit: 0, period: 'day' }; // FIX: Return default if plan is undefined
    const feature = plan.features.find((f: any) => f.key === featureKey);
    
    if (!feature || !feature.limit || feature.limit === Infinity) {
        return { remaining: Infinity, limit: Infinity, period: 'day' };
    }

    const usageData = feature.period === 'week' ? userData.weeklyUsage : userData.dailyUsage;
    const currentUsage = (usageData as any)[featureKey] || 0;
    const purchasedUsage = userData.purchasedUses?.[featureKey] || 0;
    
    return {
        remaining: (feature.limit - currentUsage) + purchasedUsage,
        limit: feature.limit,
        period: feature.period === 'week' ? 'semana' : 'dia',
    };
};

const PlanComplianceCard: FC<{
    label: string;
    macroKey: keyof Omit<MacroData, 'calories'>;
    planned: number;
    goal: number;
    unit: string;
    color: string;
    onAdjust: (macro: keyof Omit<MacroData, 'calories'>) => void;
    isAdjusting: boolean;
    userData: UserData;
}> = ({ label, macroKey, planned, goal, unit, color, onAdjust, isAdjusting, userData }) => {
    const compliance = goal > 0 ? planned / goal : 0;
    
    let statusText: string;
    let statusColor: string;
    let showAdjustButton = false;

    if (compliance >= 0.98 && compliance <= 1.02) {
        statusText = 'Perfeito';
        statusColor = 'text-green-600';
    } else if (compliance >= 0.85 && compliance <= 1.15) {
        statusText = 'Muito boa';
        statusColor = 'text-yellow-600';
    } else {
        statusText = 'Precisa melhorar';
        statusColor = 'text-orange-600';
        showAdjustButton = true;
    }
    
    const uses = getRemainingUses(userData, 'macroAdjustments');

    return (
        <div className={`bg-slate-50 p-2.5 rounded-lg border border-slate-200 transition-all flex flex-col justify-between ${isAdjusting ? 'opacity-50' : ''}`}>
            <div>
                <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-slate-700 text-xs">{label}</span>
                    <span className={`text-xs font-bold ${statusColor}`}>{statusText}</span>
                </div>
                <div className="text-lg font-bold text-slate-800 mb-1.5">
                    {Math.round(planned)}{unit}
                    <span className="text-xs font-normal text-slate-500 ml-1.5">/ {goal}{unit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className={`${color} h-1.5 rounded-full`} style={{ width: `${Math.min(compliance*100, 100)}%` }}></div>
                </div>
            </div>
            {showAdjustButton && (
                <button
                    onClick={() => onAdjust(macroKey)}
                    disabled={isAdjusting}
                    className="mt-2 w-full text-xs font-bold py-1 px-2 bg-slate-800 text-white rounded-md hover:bg-slate-900 transition-colors disabled:bg-slate-400 flex items-center justify-center gap-1"
                >
                    {isAdjusting ? <><LoadingSpinner className="w-3 h-3" /> Ajustando...</> : <><SparklesIcon className="w-3 h-3" /> Ajustar</>}
                    {uses.limit !== Infinity && <span className="text-xs font-normal text-white/70">({uses.remaining}/{uses.limit})</span>}
                </button>
            )}
        </div>
    );
};


const DayCard: FC<{ dailyPlan: DailyPlan | undefined, onSelect: () => void }> = ({ dailyPlan, onSelect }) => {
    const today = new Date();
    
    if (!dailyPlan || !Array.isArray(dailyPlan.meals)) {
        return (
            <div className="bg-slate-50 p-3 rounded-xl border border-dashed border-gray-300 flex flex-col justify-center items-center h-full opacity-70">
                <p className="text-slate-400 text-center text-sm font-medium">Sem plano</p>
            </div>
        )
    }
    
    const isToday = isSameDay(new Date(dailyPlan.date + 'T00:00:00.000Z'), today);
    const { date, dayOfWeek, meals, totalCalories, waterGoal } = dailyPlan;
    const dateObj = new Date(date + 'T00:00:00.000Z');

    return (
        <div 
            onClick={onSelect}
            className={`bg-white p-3 rounded-xl shadow-sm border ${isToday ? 'border-brand-green shadow-md' : 'border-gray-100'} flex flex-col justify-between h-full cursor-pointer hover:shadow-md hover:border-gray-300 transition-all`}
        >
            <div>
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="font-bold text-sm text-slate-800">{dayOfWeek}</p>
                        <p className="text-xs text-slate-500">{formatDate(dateObj, { day: 'numeric', month: 'short' })}</p>
                    </div>
                    {isToday && <span className="text-xs font-bold bg-brand-green-light text-brand-green-dark px-2 py-0.5 rounded-full">Hoje</span>}
                </div>

                <ul className="space-y-1 text-xs text-slate-500 mt-2">
                    {meals.slice(0, 3).map(meal => (
                        <li key={meal.id} className="flex justify-between items-center gap-2">
                           <span className="truncate" title={meal.name}>{meal.name}</span>
                           <span className="font-medium text-slate-500 whitespace-nowrap">{meal.totalCalories}</span>
                        </li>
                    ))}
                    {meals.length > 3 && <li className="text-slate-500 text-xs font-medium pt-0.5">+ {meals.length - 3} mais</li>}
                </ul>
            </div>
            
            <div className="mt-3 border-t border-gray-100 pt-2">
                <div className="flex justify-between items-center">
                    <div className="text-center flex-1">
                        <p className="font-bold text-brand-orange text-sm">{totalCalories.toLocaleString('pt-BR')}</p>
                        <p className="text-xs text-slate-500">kcal</p>
                    </div>
                    <div className="border-l h-6 border-gray-200 mx-1"></div>
                    <div className="text-center flex-1">
                        <p className="font-bold text-brand-blue text-sm">{waterGoal}L</p>
                        <p className="text-xs text-slate-500">água</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DIET_TAGS = [
    'Pouca Variedade',
    'Muita Variedade',
    'Mais Econômica',
    'Ingredientes Premium',
    'Refeição Livre (FDS)',
    'Incluir Suplementos',
    'Preparo Rápido',
    'Foco em Saciedade',
];

const WeeklyView: FC<{ 
    week: (DailyPlan | undefined)[], 
    onSelectDay: (date: Date) => void, 
    onNavigate: (direction: 'prev' | 'next') => void, 
    weekDate: Date,
    onGenerateWeek: (startDate: Date, observation?: string) => void,
    isProcessing: boolean,
    userData: UserData,
    handlers: UserDataHandlers,
}> = ({ week, onSelectDay, onNavigate, weekDate, onGenerateWeek, isProcessing, userData, handlers }) => {
    
    const [observation, setObservation] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isTagsExpanded, setIsTagsExpanded] = useState(false);

    const firstThreeTags = DIET_TAGS.slice(0, 3);
    const remainingTags = DIET_TAGS.slice(3);

    const handleTagToggle = (tag: string) => {
        setSelectedTags(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleGenerateClick = () => {
        let finalObservation = '';
        if (selectedTags.length > 0) {
            finalObservation += `Tags: ${selectedTags.join(', ')}. `;
        }
        if (observation.trim()) {
            finalObservation += `Observações adicionais: ${observation.trim()}`;
        }
        onGenerateWeek(weekDate, finalObservation.trim());
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h3 className="text-lg font-semibold text-slate-800">
                    Semana de {formatDate(weekDate, { day: 'numeric', month: 'long' })}
                    <span className="text-slate-400 font-normal">, {weekDate.getFullYear()}</span>
                </h3>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => handlers.generateShoppingList(week.filter((p): p is DailyPlan => !!p))}
                        disabled={isProcessing || week.every(d => !d)}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm disabled:bg-slate-400"
                    >
                        <ListIcon className="w-5 h-5" />
                        <span>Lista de Compras</span>
                        {(() => {
                            const uses = getRemainingUses(userData, 'shoppingLists');
                            if (uses.limit === Infinity) return null;
                            return <span className="text-xs font-normal text-white/70">({uses.remaining} restantes)</span>;
                        })()}
                    </button>
                    <button onClick={() => onNavigate('prev')} disabled={isProcessing} className="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"><ChevronLeftIcon className="w-5 h-5"/></button>
                    <button onClick={() => onNavigate('next')} disabled={isProcessing} className="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"><ChevronRightIcon className="w-5 h-5"/></button>
                </div>
            </div>

            <div className="mb-6 bg-brand-green-light/50 p-5 rounded-xl border-2 border-dashed border-brand-green/30 theme-athlete:bg-zinc-800 theme-athlete:border-zinc-700">
                <h4 className="font-bold text-lg text-brand-green-dark theme-athlete:text-white flex items-center gap-2 mb-3">
                    <SparklesIcon className="w-5 h-5" />
                    Personalize sua Dieta Semanal com IA
                </h4>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-slate-700">
                                Adicionar tags para a IA (opcional)
                                {selectedTags.length > 0 && (
                                    <span className="ml-2 bg-brand-green text-white text-xs font-bold px-2 py-0.5 rounded-full">{selectedTags.length} selecionada(s)</span>
                                )}
                            </label>
                            <button
                                onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                                className="p-1 rounded-full hover:bg-brand-green/10"
                                aria-expanded={isTagsExpanded}
                                aria-controls="diet-tags-container"
                            >
                                {isTagsExpanded ? <ChevronUpIcon className="w-5 h-5 text-brand-green-dark" /> : <ChevronDownIcon className="w-5 h-5 text-brand-green-dark" />}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {firstThreeTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => handleTagToggle(tag)}
                                    disabled={isProcessing}
                                    className={`px-3 py-1.5 text-sm font-semibold rounded-full border-2 transition-colors disabled:opacity-50 ${
                                        selectedTags.includes(tag)
                                            ? 'bg-brand-green text-white border-brand-green'
                                            : 'bg-white text-slate-600 border-slate-300 hover:border-brand-green hover:text-brand-green'
                                    }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                        <div id="diet-tags-container" className={`tags-container ${isTagsExpanded ? '' : 'collapsed'}`}>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {remainingTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => handleTagToggle(tag)}
                                        disabled={isProcessing}
                                        className={`px-3 py-1.5 text-sm font-semibold rounded-full border-2 transition-colors disabled:opacity-50 ${
                                            selectedTags.includes(tag)
                                                ? 'bg-brand-green text-white border-brand-green'
                                                : 'bg-white text-slate-600 border-slate-300 hover:border-brand-green hover:text-brand-green'
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="observation-input" className="block text-sm font-medium text-slate-700 mb-1">
                            Outras instruções para a IA (opcional)
                        </label>
                        <textarea
                            id="observation-input"
                            value={observation}
                            onChange={(e) => setObservation(e.target.value)}
                            placeholder="Ex: Não gosto de peixe, prefiro carne vermelha magra."
                            rows={2}
                            className="w-full px-3 py-2 bg-white text-slate-800 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-green theme-athlete:bg-zinc-700 theme-athlete:border-zinc-600 theme-athlete:text-white theme-athlete:placeholder:text-zinc-400"
                            disabled={isProcessing}
                        />
                    </div>
                    <button
                        onClick={handleGenerateClick}
                        disabled={isProcessing}
                        className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md text-base disabled:bg-slate-400"
                    >
                        {isProcessing ? <LoadingSpinner className="w-5 h-5" /> : <span>Gerar Dieta</span>}
                        {(() => {
                            if (isProcessing) return null;
                            const uses = getRemainingUses(userData, 'weeklyPlanGenerations');
                            if (uses.limit === Infinity) return null;
                            return <span className="text-xs font-normal bg-black/20 px-2 py-0.5 rounded-full">({uses.remaining} restantes)</span>;
                        })()}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {week.map((day, index) => (
                    <DayCard key={day ? day.date : index} dailyPlan={day} onSelect={() => onSelectDay(addDays(weekDate, index))} />
                ))}
            </div>
        </div>
    );
};

interface DailyViewProps { 
    dailyPlan: DailyPlan;
    onBackToWeeklyView: () => void;
    isFavorite: boolean;
    onToggleFavorite: () => void;
    userData: UserData;
    handlers: UserDataHandlers;
    isProcessing: boolean;
    showNotification: (notification: NotificationState) => void;
    onAdjustDayForMacro: (macro: keyof Omit<MacroData, 'calories'>) => Promise<void>;
}

const DailyView: FC<DailyViewProps> = (props) => {
    const { dailyPlan, onBackToWeeklyView, isFavorite, onToggleFavorite, userData, handlers, isProcessing, showNotification, onAdjustDayForMacro } = props;

    const handleRegenerateMeal = async (mealId: string, prompt: string) => {
        await handlers.regenerateMeal(dailyPlan.date, mealId, prompt);
    };

    const handleSwapItem = async (mealId: string, itemToSwap: FoodItem) => {
        await handlers.handleSwapItem(dailyPlan.date, mealId, itemToSwap);
    };
    
    const handleTimeUpdate = (mealId: string, newTime: string) => {
        const mealToUpdate = dailyPlan.meals.find(m => m.id === mealId);
        if (mealToUpdate) {
            handlers.updateMeal(dailyPlan.date, { ...mealToUpdate, time: newTime });
        }
    };
    
    const handleUpdateMealCount = (count: number) => {
        handlers.regenerateDay(dailyPlan.date, count);
    };

    const handleRegenerateDay = () => {
        handlers.regenerateDay(dailyPlan.date);
    };

    const handleToggleMealReminders = async () => {
        if (Notification.permission === 'denied') {
            alert("As notificações foram bloqueadas. Para ativá-las, mude as permissões do site no seu navegador.");
            return;
        }

        if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert("Você precisa permitir notificações para usar este recurso.");
                return;
            }
        }
    
        handlers.updateUserData({
            mealReminders: { enabled: !userData.mealReminders.enabled }
        });
        showNotification({type: 'info', message: `Lembretes de refeição ${!userData.mealReminders.enabled ? 'ativados' : 'desativados'}.`})
        setTimeout(() => showNotification(null), 2000);
    };
    
    const isToday = useMemo(() => isSameDay(new Date(dailyPlan.date + 'T12:00:00'), new Date()), [dailyPlan.date]);
    const isTodayCompleted = useMemo(() => userData.completedDays.includes(dailyPlan.date), [userData.completedDays, dailyPlan.date]);
    
    return (
         <div className="max-w-4xl mx-auto">
             <div className="hidden md:flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800 capitalize">
                   {formatDate(new Date(dailyPlan.date + 'T00:00:00.000Z'), { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                 <div className="flex items-center gap-2">
                    <button
                        onClick={onToggleFavorite}
                        className={`px-3 py-2 bg-white border rounded-md hover:bg-gray-100 flex items-center gap-2 text-sm font-medium transition-colors ${isFavorite ? 'border-yellow-300 text-yellow-600' : 'border-gray-300 text-slate-600'}`}
                    >
                        <StarIcon className={`w-4 h-4 transition-all ${isFavorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`}/>
                        {isFavorite ? 'Favorito' : 'Favoritar'}
                    </button>
                    <button onClick={onBackToWeeklyView} className="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100 flex items-center gap-2 text-sm font-medium text-slate-600">
                        <CalendarIcon className="w-4 h-4"/>
                        Alterar Data
                    </button>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                 <h3 className="text-lg font-bold text-slate-800">Dieta de Hoje</h3>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                     {isToday && (
                        <button
                            onClick={handlers.handleMarkDayAsCompleted}
                            disabled={isTodayCompleted}
                            className="px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white border border-teal-500 rounded-md flex items-center gap-2 text-sm font-semibold transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                            {isTodayCompleted ? <CheckIcon className="w-4 h-4"/> : <FireIcon className="w-4 h-4"/>}
                            {isTodayCompleted ? 'Meta Batida!' : 'Bati a Meta'}
                        </button>
                    )}
                </div>
            </div>

             <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-3">
                    <div className="relative">
                        <select
                            value={(dailyPlan.meals || []).length}
                            onChange={(e) => handleUpdateMealCount(Number(e.target.value))}
                            disabled={isProcessing}
                            className="pl-3 pr-8 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-slate-600 focus:outline-none focus:ring-1 focus:ring-brand-green appearance-none disabled:bg-slate-100 cursor-pointer"
                            aria-label="Selecionar número de refeições"
                        >
                            <option value="3">3 Refeições</option>
                            <option value="4">4 Refeições</option>
                            <option value="5">5 Refeições</option>
                            <option value="6">6 Refeições</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                    {(() => {
                        const uses = getRemainingUses(userData, 'dayRegenerations');
                        if (uses.limit === Infinity) return null;
                        return (
                            <div className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-1 rounded-full">
                                {uses.remaining}/{uses.limit}
                            </div>
                        );
                    })()}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={onToggleFavorite} className={`p-2 bg-white border rounded-md hover:bg-gray-100 md:hidden transition-colors ${isFavorite ? 'border-yellow-300 text-yellow-600' : 'border-gray-300 text-slate-600'}`}>
                        <StarIcon className={`w-5 h-5 ${isFavorite ? 'text-yellow-500 fill-current' : ''}`}/>
                    </button>
                    <button onClick={handleToggleMealReminders} className="p-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors" title={userData.mealReminders.enabled ? "Desativar lembretes" : "Ativar lembretes de refeição"}>
                        <BellIcon className={`w-5 h-5 text-slate-600 transition-colors ${userData.mealReminders.enabled ? 'fill-yellow-400 text-yellow-600' : ''}`}/>
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {(dailyPlan.meals || []).map(meal => (
                    meal && <MealCard 
                      key={meal.id} 
                      meal={meal} 
                      onRegenerate={handleRegenerateMeal}
                      onSwapItem={handleSwapItem}
                      onTimeUpdate={handleTimeUpdate}
                      showNotification={showNotification}
                      handlers={handlers}
                      userData={userData}
                    />
                ))}
            </div>
        </div>
    );
};

// FIX: Export DietModeSelector for use in Dashboard.tsx
export const DietModeSelector: React.FC<{
    currentDifficulty: DietDifficulty;
    onChange: (difficulty: DietDifficulty) => void;
    isSubscribed: boolean;
    openSubscriptionModal: () => void;
}> = ({ currentDifficulty, onChange, isSubscribed, openSubscriptionModal }) => {
    const options: { label: string; value: DietDifficulty }[] = [
        { label: 'Fácil', value: 'easy' },
        { label: 'Normal', value: 'normal' },
        { label: 'Atleta 🔥', value: 'athlete' },
    ];

    const handleChange = (difficulty: DietDifficulty) => {
        if (difficulty === 'athlete' && !isSubscribed) {
            openSubscriptionModal();
            return;
        }
        onChange(difficulty);
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-brand-orange-light">
                    <DumbbellIcon className="w-5 h-5 text-brand-orange" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800">Modo da Dieta</h3>
                    <p className="text-sm text-slate-500">Ajusta a intensidade e o cálculo de macros.</p>
                </div>
            </div>
            <div className="flex-shrink-0 w-full sm:w-auto">
                <div className="flex bg-slate-100 p-1 rounded-lg theme-athlete:bg-zinc-800">
                    {options.map(option => (
                        <button
                            key={option.value}
                            onClick={() => handleChange(option.value)}
                            className={`flex-1 text-center px-4 py-2 text-sm font-semibold rounded-md transition-all duration-300 min-w-[80px]
                                ${currentDifficulty === option.value
                                    ? 'bg-white text-brand-green shadow-sm theme-athlete:bg-zinc-600 theme-athlete:text-white'
                                    : 'text-slate-500 hover:bg-slate-200/50 theme-athlete:text-zinc-400 theme-athlete:hover:bg-zinc-700'
                                }
                            `}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};


const PlanoAlimentarView: React.FC<PlanoAlimentarViewProps> = ({ userData, handlers, lastMealPlanText, mealPlan, favoritePlans, onToggleFavorite, setActiveView, showNotification, isPlanProcessing }) => {
  const [view, setView] = useState<'semanal' | 'diaria'>('diaria');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [processingMacro, setProcessingMacro] = useState<keyof Omit<MacroData, 'calories'> | null>(null);
  const [imageRenderPlan, setImageRenderPlan] = useState<DailyPlan | null>(null);
  const [shareModalState, setShareModalState] = useState<{ isOpen: boolean, imageDataUrl: string, plan: DailyPlan | null }>({ isOpen: false, imageDataUrl: '', plan: null });

  const theme = userData.dietDifficulty === 'athlete' ? 'athlete' : 'light';

  useEffect(() => {
    const dateKey = currentDate.toISOString().split('T')[0];
    if (mealPlan && !mealPlan[dateKey] && view === 'diaria') {
        const mostRecentDate = Object.keys(mealPlan).sort().pop();
        if(mostRecentDate) {
            setCurrentDate(new Date(mostRecentDate + 'T12:00:00'));
        }
    }
  }, [mealPlan]);


  const startOfWeek = useMemo(() => getStartOfWeek(currentDate), [currentDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(startOfWeek, i));
  }, [startOfWeek]);
  
  const weeklyData = useMemo(() => {
    if (!mealPlan) return Array(7).fill(undefined);
    return weekDays.map(day => mealPlan[day.toISOString().split('T')[0]]);
  }, [mealPlan, weekDays]);

  const dailyData = useMemo(() => {
    if (!mealPlan) return null;
    return mealPlan[currentDate.toISOString().split('T')[0]];
  }, [mealPlan, currentDate]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window) || !dailyData) return;
    if (!userData.mealReminders.enabled || Notification.permission !== 'granted') return;

    const scheduledTimers = (dailyData.meals || []).map(meal => {
        if (!meal || !meal.time) return null;
        const [hour, minute] = meal.time.split(':').map(Number);
        const now = new Date();
        const reminderDate = new Date(now);
        reminderDate.setHours(hour, minute, 0, 0);

        if (reminderDate > now) {
            const timeout = reminderDate.getTime() - now.getTime();
            return setTimeout(() => {
                new Notification(`Hora do seu ${meal.name}! 🍽️`, {
                    body: `Está na hora de comer: ${meal.items.map(i => i.name).join(', ')}.`,
                    icon: '/favicon.svg'
                });
            }, timeout);
        }
        return null;
    }).filter(Boolean) as ReturnType<typeof setTimeout>[];

    return () => {
        scheduledTimers.forEach(clearTimeout);
    };
  }, [dailyData, userData.mealReminders.enabled]);
  

  const handleSelectDay = (date: Date) => {
    setCurrentDate(date);
    setView('diaria');
  };

  const handleNavigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
        const newDate = new Date(prevDate);
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        return newDate;
    });
  };

  const handleAdjustDay = async (macroToFix: keyof Omit<MacroData, 'calories'>) => {
      if (!dailyData) return;
      setProcessingMacro(macroToFix);
      await handlers.adjustDayForMacro(dailyData.date, macroToFix);
      setProcessingMacro(null);
  };
  
  useEffect(() => {
    if (imageRenderPlan) {
        // Timeout to allow React to render the component off-screen
        setTimeout(() => {
            const sourceElement = document.getElementById('diet-image-render-source');
            if (sourceElement) {
                html2canvas(sourceElement, {
                    useCORS: true,
                    scale: 2 // For better resolution
                }).then(canvas => {
                    const dataUrl = canvas.toDataURL('image/png');
                    setShareModalState({ isOpen: true, imageDataUrl: dataUrl, plan: imageRenderPlan });
                    setImageRenderPlan(null); // Cleanup
                    showNotification(null);
                }).catch(err => {
                    console.error("html2canvas error:", err);
                    showNotification({ type: 'error', message: 'Erro ao gerar a imagem.' });
                    setTimeout(() => showNotification(null), 3000);
                    setImageRenderPlan(null);
                });
            }
        }, 100);
    }
}, [imageRenderPlan, showNotification]);

const handleExportDiet = (plan: DailyPlan) => {
    showNotification({ type: 'loading', message: 'Gerando imagem da dieta...' });
    setImageRenderPlan(plan);
};

  const tabButtonClasses = (tabName: 'semanal' | 'diaria') =>
    `px-6 py-2 rounded-lg font-semibold transition-colors text-sm w-full
     ${view === tabName
        ? 'bg-brand-green text-white shadow'
        : 'bg-white text-brand-green-dark'
     }`;
  
  const importButton = (
    <button
      onClick={() => { if (lastMealPlanText) handlers.importPlanFromChat(lastMealPlanText); }}
      disabled={!lastMealPlanText || isPlanProcessing}
      className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed"
    >
      <ChatIcon className="w-5 h-5" />
      {isPlanProcessing ? 'Processando...' : 'Importar do Chat'}
    </button>
  );

  if (!mealPlan || !dailyData) {
    return (
      <div className="text-center h-full flex flex-col items-center justify-center">
        <BowlIcon className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Sua dieta personalizada</h2>
        <p className="text-slate-500 max-w-md mb-6">Gere uma dieta para a semana inteira com base em suas metas e preferências, com o poder da IA.</p>
        <div id="generate-diet-buttons-container" className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => handlers.generateDailyPlan(new Date())}
              disabled={isPlanProcessing}
              className="bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors shadow-md disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isPlanProcessing ? <LoadingSpinner className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
              Gerar Dieta com IA
               {(() => {
                   const uses = getRemainingUses(userData, 'dailyPlanGenerations');
                   if (uses.limit === Infinity) return null;
                   return <span className="text-xs font-normal text-white/70">({uses.remaining}/{uses.limit})</span>;
               })()}
            </button>
            {importButton}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
              Dieta
            </h2>
            <p className="text-slate-500">Seu cardápio personalizado para uma alimentação saudável</p>
          </div>
        </header>
        
        <DietModeSelector 
            currentDifficulty={userData.dietDifficulty} 
            onChange={handlers.handleChangeDietDifficulty}
            isSubscribed={userData.isSubscribed}
            openSubscriptionModal={handlers.openSubscriptionModal}
        />

        {view === 'diaria' && dailyData && (
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                    <TargetIcon className="w-5 h-5 text-brand-green"/>
                    <h4 className="font-bold text-slate-800 text-base">Análise da Dieta vs. Metas</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                        <div>
                            <p className="font-semibold text-slate-700 text-xs mb-1">Calorias</p>
                            <div className="text-lg font-bold text-slate-800 mb-1.5">
                                {Math.round(dailyData.totalMacros.calories)}kcal
                                <span className="text-xs font-normal text-slate-500 ml-1.5">/ {userData.macros.calories.goal}kcal</span>
                            </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-brand-orange h-1.5 rounded-full" style={{ width: `${Math.min((dailyData.totalMacros.calories / userData.macros.calories.goal) * 100, 100)}%` }}></div>
                        </div>
                    </div>
                    <PlanComplianceCard
                        label="Proteínas"
                        macroKey="protein"
                        planned={dailyData.totalMacros.protein}
                        goal={userData.macros.protein.goal}
                        unit="g"
                        color="bg-emerald-500"
                        onAdjust={handleAdjustDay}
                        isAdjusting={isPlanProcessing && processingMacro === 'protein'}
                        userData={userData}
                    />
                    <PlanComplianceCard
                        label="Carboidratos"
                        macroKey="carbs"
                        planned={dailyData.totalMacros.carbs}
                        goal={userData.macros.carbs.goal}
                        unit="g"
                        color="bg-sky-500"
                        onAdjust={handleAdjustDay}
                        isAdjusting={isPlanProcessing && processingMacro === 'carbs'}
                        userData={userData}
                    />
                    <PlanComplianceCard
                        label="Gorduras"
                        macroKey="fat"
                        planned={dailyData.totalMacros.fat}
                        goal={userData.macros.fat.goal}
                        unit="g"
                        color="bg-amber-500"
                        onAdjust={handleAdjustDay}
                        isAdjusting={isPlanProcessing && processingMacro === 'fat'}
                        userData={userData}
                    />
                </div>
            </div>
        )}

        <main>
          <div className="bg-brand-green-light p-1 rounded-xl flex max-w-sm mb-6 gap-1">
              <button onClick={() => setView('semanal')} className={tabButtonClasses('semanal')} aria-selected={view === 'semanal'}>Visão Semanal</button>
              <button onClick={() => setView('diaria')} className={tabButtonClasses('diaria')} aria-selected={view === 'diaria'}>Visão Diária</button>
          </div>

          <div id="generate-diet-buttons-container" className="flex flex-wrap gap-2 mb-6">
              {view === 'diaria' && (
                <>
                  <button
                    onClick={() => {
                        dailyData ? handlers.regenerateDay(dailyData.date) : handlers.generateDailyPlan(currentDate);
                    }}
                    disabled={isPlanProcessing}
                    className="bg-brand-green hover:bg-brand-green-dark text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm disabled:bg-slate-400 disabled:cursor-not-allowed"
                  >
                    {isPlanProcessing ? <LoadingSpinner className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
                    {isPlanProcessing ? 'Gerando...' : 'Regerar Dia'}
                    {(() => {
                        const uses = getRemainingUses(userData, 'dayRegenerations');
                        if (uses.limit === Infinity) return null;
                        return <span className="text-xs font-normal text-white/70">({uses.remaining}/{uses.limit})</span>;
                    })()}
                  </button>
                </>
              )}
               <button
                onClick={() => { if (lastMealPlanText) handlers.importPlanFromChat(lastMealPlanText); }}
                disabled={!lastMealPlanText || isPlanProcessing}
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:bg-slate-400"
              >
                <ChatIcon className="w-5 h-5" />
                {isPlanProcessing ? 'Processando...' : 'Importar do Chat'}
                {(() => {
                    const uses = getRemainingUses(userData, 'chatImports');
                    if (uses.limit === Infinity) return null;
                    return <span className="text-xs font-normal text-white/70">({uses.remaining}/{uses.limit})</span>;
                })()}
              </button>
              {view === 'diaria' && dailyData && (
                  <button
                    onClick={() => handleExportDiet(dailyData)}
                    disabled={isPlanProcessing || !!imageRenderPlan}
                    className="bg-white border border-gray-300 hover:bg-gray-100 text-slate-700 font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    <ShareIcon className="w-5 h-5 text-slate-600" />
                    Exportar Imagem
                  </button>
              )}
              <button
                onClick={() => setActiveView('Favoritos')}
                disabled={isPlanProcessing}
                className="bg-white border border-gray-300 hover:bg-gray-100 text-slate-700 font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <StarIcon className="w-5 h-5 text-yellow-500" />
                Ver Favoritos
              </button>
          </div>

          <div>
              {view === 'semanal' && (
                  <WeeklyView 
                      week={weeklyData} 
                      onSelectDay={handleSelectDay} 
                      onNavigate={handleNavigateWeek} 
                      weekDate={startOfWeek}
                      onGenerateWeek={handlers.generateWeeklyPlan}
                      isProcessing={isPlanProcessing}
                      userData={userData}
                      handlers={handlers}
                  />
              )}
              {view === 'diaria' && dailyData && (
                   <DailyView 
                      dailyPlan={dailyData} 
                      onBackToWeeklyView={() => setView('semanal')}
                      isFavorite={favoritePlans.some(p => p.date === dailyData.date)}
                      onToggleFavorite={() => onToggleFavorite(dailyData)}
                      userData={userData}
                      handlers={handlers}
                      isProcessing={isPlanProcessing}
                      showNotification={showNotification}
                      onAdjustDayForMacro={handleAdjustDay}
                  />
              )}
               {view === 'diaria' && !dailyData && (
                   <div className="text-center p-8 bg-white rounded-lg shadow-sm">
                      <p className="text-slate-500">Não há dieta para o dia selecionado.</p>
                      <p className="text-sm text-slate-400 mt-2">{formatDate(currentDate, { dateStyle: 'full' })}</p>
                   </div>
              )}
          </div>
        </main>
        
        <AdminAccessSection setActiveView={setActiveView} userData={userData} />

      </div>

      {imageRenderPlan && (
        <div id="diet-image-render-source" style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}>
            <DietImage plan={imageRenderPlan} user={userData} theme={theme} />
        </div>
      )}

      <ShareDietModal 
        isOpen={shareModalState.isOpen}
        onClose={() => setShareModalState({ isOpen: false, imageDataUrl: '', plan: null })}
        imageDataUrl={shareModalState.imageDataUrl}
        plan={shareModalState.plan}
      />
    </>
  );
};

export default PlanoAlimentarView;