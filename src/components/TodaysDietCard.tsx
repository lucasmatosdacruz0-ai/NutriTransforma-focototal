import React, { FC } from 'react';
import { DailyPlan, View } from '../types';
import { BowlIcon } from './icons/BowlIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface TodaysDietCardProps {
    plan: DailyPlan | null;
    setActiveView: (view: View) => void;
    className?: string;
}

const TodaysDietCard: FC<TodaysDietCardProps> = ({ plan, setActiveView, className = '' }) => {
    return (
        <div className={`bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col ${className}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-brand-green-light">
                        <CalendarIcon className="text-brand-green w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Dieta de Hoje</h3>
                        <p className="text-sm text-slate-500">
                            {plan ? `${Math.round(plan.totalCalories)} kcal planejadas` : "Nenhum plano para hoje."}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setActiveView('Dieta')}
                    className="bg-white border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-100 flex items-center gap-2 text-sm font-semibold transition-colors px-3 py-2 flex-shrink-0"
                >
                    Ver Dieta <ChevronRightIcon className="w-4 h-4" />
                </button>
            </div>
            {plan ? (
                <ul className="space-y-2 text-sm flex-grow">
                    {(plan.meals || []).slice(0, 4).map(meal => (
                        <li key={meal.id} className="flex justify-between items-center group py-1 border-b border-gray-100 last:border-b-0">
                            <p className="text-slate-700 font-medium">{meal.name}</p>
                            <span className="font-medium text-slate-600">{meal.totalCalories} kcal</span>
                        </li>
                    ))}
                    {(plan.meals || []).length > 4 && (
                        <li className="text-xs text-slate-500 text-center pt-1">
                            + {(plan.meals || []).length - 4} mais refeições
                        </li>
                    )}
                </ul>
            ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center text-slate-400 p-4 bg-slate-50 rounded-lg border border-dashed theme-athlete:bg-[var(--bg-sidebar)] theme-athlete:border-[var(--border-color)] theme-athlete:text-[var(--text-secondary)]">
                    <BowlIcon className="w-10 h-10 mb-2" />
                    <p className="font-semibold">Vá para a tela de Dieta para gerar seu plano de hoje!</p>
                </div>
            )}
        </div>
    );
};

export default TodaysDietCard;