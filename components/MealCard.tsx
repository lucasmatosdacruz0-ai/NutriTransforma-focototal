import React, { FC, useState, useRef, useEffect } from 'react';
import { Meal, NotificationState, FoodItem, UserDataHandlers, UserData } from '../types';
import { UtensilsIcon } from './icons/UtensilsIcon';
import { EditIcon } from './icons/EditIcon';
import { RefreshCwIcon } from './icons/RefreshCwIcon';
import { SendIcon } from './icons/SendIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import { marked } from 'marked';
import Modal from './Modal';
import { PLANS } from '../constants/plans';

const LoadingSpinner: FC<{className?: string}> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


type MealCardProps = {
    meal: Meal;
    showNotification?: (notification: NotificationState) => void;
} & (
    | {
        isReadOnly: true;
        onRegenerate?: never;
        onTimeUpdate?: never;
        onSwapItem?: never;
        handlers?: never;
        userData?: never;
      }
    | {
        isReadOnly?: false;
        onRegenerate: (mealId: string, prompt: string) => Promise<void>;
        onTimeUpdate: (mealId: string, newTime: string) => void;
        onSwapItem: (mealId: string, itemToSwap: FoodItem) => Promise<void>;
        handlers: UserDataHandlers;
        userData: UserData;
      }
);


const MealCard: FC<MealCardProps> = (props) => {
    const { meal, isReadOnly, showNotification = () => {} } = props;
    const [prompt, setPrompt] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [itemBeingSwapped, setItemBeingSwapped] = useState<string | null>(null);
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [editedTime, setEditedTime] = useState(meal.time);
    const timeInputRef = useRef<HTMLInputElement>(null);
    const [infoResponse, setInfoResponse] = useState<string | null>(null);

    useEffect(() => {
        if (isEditingTime && timeInputRef.current) {
            timeInputRef.current.focus();
        }
    }, [isEditingTime]);

    const handlePromptSubmit = async () => {
        if (isReadOnly || !prompt || isProcessing) return;
    
        const trimmedPrompt = prompt.trim().toLowerCase();
    
        const questionKeywords = [
            'o que é',
            'o que e',
            'quais os benefícios',
            'qual a diferença',
            'por que',
            'pra que serve',
            'para que serve',
            'é saudável',
        ];
        
        const isQuestion = questionKeywords.some(keyword => trimmedPrompt.startsWith(keyword));
    
        setIsProcessing(true);
    
        if (isQuestion) {
            if (props.isReadOnly || !props.handlers) {
                setIsProcessing(false);
                return;
            }
            // --- Path for asking a question ---
            showNotification({ type: 'loading', message: 'Pesquisando sua dúvida...' });
            try {
                const answer = await props.handlers.getFoodInfo(prompt, meal);
                setPrompt('');
    
                if (answer && answer.trim()) {
                    setInfoResponse(answer);
                    showNotification(null); // Hide loading, modal will show
                } else {
                    showNotification({ type: 'info', message: 'A IA não forneceu uma resposta. Tente reformular a pergunta.' });
                    setTimeout(() => showNotification(null), 4000);
                }
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro.";
                showNotification({ type: 'error', message: errorMessage });
                setTimeout(() => showNotification(null), 5000);
            } finally {
                setIsProcessing(false);
            }
        } else {
            // --- Path for meal regeneration ---
            if (props.isReadOnly) {
                 setIsProcessing(false);
                 return;
            }
            try {
                await props.onRegenerate(meal.id, prompt);
                setPrompt('');
            } catch (e) {
                console.error("Error regenerating meal from MealCard:", e);
            } finally {
                setIsProcessing(false);
            }
        }
    };


    const handleSwapItem = async (item: FoodItem) => {
        if (isReadOnly || isProcessing || itemBeingSwapped) return;
        
        if (props.isReadOnly) return;
        setItemBeingSwapped(item.name);
        try {
            await props.onSwapItem(meal.id, item);
        } catch(e) {
            console.error(e);
             const errorMessage = e instanceof Error ? e.message : "Ocorreu um erro.";
            showNotification({ type: 'error', message: errorMessage });
            setTimeout(() => showNotification(null), 4000);
        } finally {
            setItemBeingSwapped(null);
        }
    };
    
    const handleTimeSave = () => {
        if (isReadOnly) return;
        if (editedTime.trim()) {
            props.onTimeUpdate(meal.id, editedTime);
        }
        setIsEditingTime(false);
    };

    const handleTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleTimeSave();
        } else if (e.key === 'Escape') {
            setEditedTime(meal.time);
            setIsEditingTime(false);
        }
    };
    
    const actionButtonClass = "p-1 rounded-full text-slate-400 hover:text-brand-green hover:bg-slate-100 transition-colors duration-200";

    const getRemainingUses = (userData: UserData, featureKey: string) => {
        const planKey = userData.isSubscribed && userData.currentPlan ? userData.currentPlan : 'basic';
        const plan = PLANS[planKey];
        const feature = plan.features.find((f: any) => f.key === featureKey);
        
        if (!feature || !feature.limit || feature.limit === Infinity) {
            return { remaining: Infinity, limit: Infinity };
        }

        const usageData = feature.period === 'week' ? userData.weeklyUsage : userData.dailyUsage;
        const currentUsage = (usageData as any)[featureKey] || 0;
        const purchasedUsage = userData.purchasedUses?.[featureKey] || 0;
        
        return {
            remaining: (feature.limit - currentUsage) + purchasedUsage,
            limit: feature.limit
        };
    };

    const itemSwapsUses = !isReadOnly ? getRemainingUses(props.userData, 'itemSwaps') : null;
    const chatUses = !isReadOnly ? getRemainingUses(props.userData, 'chatInteractions') : null;

    return (
        <>
            <div className={`relative bg-white p-4 rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 ${isProcessing || itemBeingSwapped ? 'opacity-75 cursor-not-allowed' : ''}`}>
                <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-3">
                    <div className="flex items-center gap-3">
                        <div className="bg-brand-green-light p-2 rounded-lg">
                           <UtensilsIcon className="w-5 h-5 text-brand-green" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{meal.name}</p>
                          <div className="flex items-center gap-1 text-sm text-slate-500 group">
                            {!isReadOnly && !isEditingTime ? (
                                <>
                                    <span>{meal.time}</span>
                                    <button onClick={() => setIsEditingTime(true)} className={`${actionButtonClass} disabled:cursor-not-allowed disabled:opacity-50`} aria-label="Editar horário" disabled={isProcessing || !!itemBeingSwapped}>
                                        <EditIcon className="w-4 h-4"/>
                                    </button>
                                </>
                            ) : !isReadOnly && isEditingTime ? (
                                <div className="flex items-center gap-1">
                                    <input 
                                        ref={timeInputRef}
                                        type="time" 
                                        value={editedTime} 
                                        onChange={(e) => setEditedTime(e.target.value)} 
                                        onBlur={handleTimeSave}
                                        onKeyDown={handleTimeKeyDown}
                                        className="bg-slate-100 border-slate-200 rounded p-0.5 text-sm w-20 focus:ring-1 focus:ring-brand-green focus:border-brand-green"
                                    />
                                    <button onClick={handleTimeSave} className={`${actionButtonClass} text-green-500`} aria-label="Salvar horário"><CheckIcon className="w-4 h-4"/></button>
                                    <button onClick={() => setIsEditingTime(false)} className={`${actionButtonClass} text-red-500`} aria-label="Cancelar edição de horário"><XIcon className="w-4 h-4"/></button>
                                </div>
                            ) : (
                                 <span>{meal.time}</span>
                            )}
                          </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-brand-green text-lg">{meal.totalCalories} kcal</p>
                    </div>
                </div>

                <ul className="space-y-2 text-sm">
                    {meal.items.map((item, index) => (
                        <li key={index} className="flex justify-between items-center group">
                            <div>
                                <p className="text-slate-700 font-medium">{item.name}</p>
                                <p className="text-slate-500">{item.portion}</p>
                            </div>
                             {!isReadOnly && (
                                <div className="flex items-center gap-3">
                                    <span className="font-medium text-slate-600">{item.calories} kcal</span>
                                    <button onClick={() => handleSwapItem(item)} className={`${actionButtonClass} disabled:opacity-50 disabled:cursor-not-allowed`} title="Trocar item com IA" aria-label="Trocar item com IA" disabled={isProcessing || !!itemBeingSwapped}>
                                        {itemBeingSwapped === item.name ? <LoadingSpinner className="w-4 h-4" /> : <RefreshCwIcon className="w-4 h-4" />}
                                    </button>
                                </div>
                            )}
                            {isReadOnly && (
                               <span className="font-medium text-slate-600">{item.calories} kcal</span>
                            )}
                        </li>
                    ))}
                </ul>

                {meal.totalMacros && (
                    <div className="flex justify-end gap-x-4 gap-y-1 flex-wrap text-xs text-slate-500 font-medium mt-3 border-t border-gray-100 pt-2">
                        <span>Carb: <span className="font-semibold text-sky-700">{Math.round(meal.totalMacros.carbs)}g</span></span>
                        <span>Prot: <span className="font-semibold text-emerald-700">{Math.round(meal.totalMacros.protein)}g</span></span>
                        <span>Gord: <span className="font-semibold text-amber-700">{Math.round(meal.totalMacros.fat)}g</span></span>
                    </div>
                )}

                {!isReadOnly && (
                    <div id="meal-card-prompt-container" className="mt-4 pt-4 border-t border-gray-100">
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">Precisa de uma alteração ou tem uma dúvida?</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handlePromptSubmit()}
                                placeholder="Ex: Menos calorias, ou 'o que é quinoa?'" 
                                className="w-full bg-slate-100 border-transparent rounded-lg py-2 pl-3 pr-10 focus:ring-brand-green focus:border-brand-green text-sm transition-colors"
                                disabled={isProcessing || !!itemBeingSwapped}
                            />
                            <button 
                                onClick={handlePromptSubmit}
                                disabled={!prompt || isProcessing || !!itemBeingSwapped}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200"
                                aria-label="Enviar para IA"
                            >
                                {isProcessing ? <LoadingSpinner className="w-4 h-4" /> : <SendIcon className="w-4 h-4"/>}
                            </button>
                        </div>
                        <div className="text-xs text-slate-400 mt-1.5 flex justify-end gap-4 font-medium">
                            {itemSwapsUses && itemSwapsUses.limit !== Infinity && (
                                <span>Trocas: <strong>{itemSwapsUses.remaining}</strong></span>
                            )}
                            {chatUses && chatUses.limit !== Infinity && (
                                <span>Dúvidas: <strong>{chatUses.remaining}</strong></span>
                            )}
                        </div>
                    </div>
                )}
            </div>
             <Modal
              isOpen={!!infoResponse}
              onClose={() => setInfoResponse(null)}
              title="Sua Dúvida sobre Alimentos"
              size="lg"
            >
              {infoResponse && (
                <div
                  className="markdown-content"
                  dangerouslySetInnerHTML={{ __html: marked.parse(infoResponse) as string }}
                />
              )}
            </Modal>
        </>
    );
};

export default MealCard;