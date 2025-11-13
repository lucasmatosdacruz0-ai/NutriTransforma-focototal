import React, { useState } from 'react';
import { DailyPlan, View } from '../types';
import { StarIcon } from './icons/StarIcon';
import Modal from './Modal';
import MealCard from './MealCard';
import { CalendarIcon } from './icons/CalendarIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { EditIcon } from './icons/EditIcon';


interface FavoritesViewProps {
  favoritePlans: DailyPlan[];
  onToggleFavorite: (plan: DailyPlan) => void;
  onUseToday: (plan: DailyPlan) => void;
  onUpdateFavorite: (plan: DailyPlan) => void;
}

const FavoritesView: React.FC<FavoritesViewProps> = ({ favoritePlans, onToggleFavorite, onUseToday, onUpdateFavorite }) => {
  const [detailsModalPlan, setDetailsModalPlan] = useState<DailyPlan | null>(null);
  const [editingPlan, setEditingPlan] = useState<DailyPlan | null>(null);
  const [formState, setFormState] = useState({ title: '', notes: '' });

  const handleEditClick = (plan: DailyPlan) => {
    setEditingPlan(plan);
    setFormState({
        title: plan.title || '',
        notes: plan.notes || '',
    });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!editingPlan) return;
    const updatedPlan = {
        ...editingPlan,
        title: formState.title,
        notes: formState.notes,
    };
    onUpdateFavorite(updatedPlan);
    setEditingPlan(null);
  };

  if ((favoritePlans || []).length === 0) {
    return (
      <div className="text-center h-full flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
          <StarIcon className="w-10 h-10 text-yellow-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Seus Planos Favoritos</h2>
        <p className="text-slate-500 max-w-md">
          Você ainda não favoritou nenhum plano. Clique na estrela <StarIcon className="w-4 h-4 inline-block -mt-1 text-slate-400"/> em um plano diário para salvá-lo aqui para acesso rápido.
        </p>
      </div>
    );
  }

  const modalInputClasses = "w-full mt-1 px-3 py-2 bg-slate-50 text-slate-900 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green";

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Planos Favoritos</h2>
        <p className="text-slate-500">Seus planos diários salvos para acesso rápido e reutilização.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(favoritePlans || []).map(plan => (
          <div key={plan.date} className="relative bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-lg hover:border-gray-200 transition-all duration-300">
            <button onClick={() => onToggleFavorite(plan)} className="absolute top-3 right-3 p-1 text-yellow-400 hover:text-yellow-500" aria-label="Remover dos favoritos">
              <StarIcon className="w-6 h-6 fill-current"/>
            </button>
            <div>
              <div className="mb-3">
                <div className="flex items-center gap-2 pr-8">
                  <p className="font-bold text-slate-800 truncate" title={plan.title || 'Plano Alimentar'}>
                    {plan.title || 'Plano Alimentar'}
                  </p>
                  <button onClick={() => handleEditClick(plan)} className="p-1 text-slate-400 hover:text-brand-green transition-colors flex-shrink-0" aria-label="Editar nome do favorito">
                    <EditIcon className="w-4 h-4"/>
                  </button>
                </div>
                <p className="text-sm text-slate-500 capitalize">
                  {new Date(plan.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>

              {plan.notes && (
                <p className="text-sm bg-yellow-50 border border-yellow-200 text-yellow-800 p-2 rounded-lg my-2 break-words">
                    <strong>Obs:</strong> {plan.notes}
                </p>
              )}

              <div className="border-t border-b border-gray-100 my-3 py-2 space-y-1.5">
                  <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-1">Refeições</h4>
                  {(plan.meals || []).slice(0, 3).map(meal => (
                      <div key={meal.id} className="flex justify-between items-center text-sm">
                          <p className="text-slate-600">{meal.name}</p>
                          <p className="font-medium text-slate-500">{meal.totalCalories} kcal</p>
                      </div>
                  ))}
                  {(plan.meals || []).length > 3 && <p className="text-xs text-slate-400">+ {(plan.meals || []).length - 3} mais</p>}
              </div>

              <div className="flex justify-around items-center text-center">
                 <div>
                    <p className="font-bold text-brand-orange text-lg">{plan.totalCalories}</p>
                    <p className="text-xs text-slate-500">kcal</p>
                 </div>
                 <div>
                    <p className="font-bold text-sky-500 text-lg">{plan.waterGoal.toFixed(1)}L</p>
                    <p className="text-xs text-slate-500">água</p>
                 </div>
              </div>
            </div>
            <div className="mt-4 border-t border-gray-100 pt-3 flex flex-col sm:flex-row gap-2">
               <button onClick={() => setDetailsModalPlan(plan)} className="flex-1 px-3 py-2 bg-white border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2 text-sm font-semibold transition-colors">
                  Ver Mais
               </button>
               <button onClick={() => onUseToday(plan)} className="flex-1 px-3 py-2 bg-brand-green border border-brand-green text-white rounded-lg hover:bg-brand-green-dark flex items-center justify-center gap-2 text-sm font-semibold transition-colors">
                  <CalendarIcon className="w-4 h-4"/>
                  Usar Hoje
               </button>
            </div>
          </div>
        ))}
      </div>
      
      {detailsModalPlan && (
        <Modal
          isOpen={!!detailsModalPlan}
          onClose={() => setDetailsModalPlan(null)}
          title={detailsModalPlan.title || `Detalhes de ${detailsModalPlan.dayOfWeek}`}
          size="2xl"
        >
          <div className="space-y-4">
            {(detailsModalPlan.meals || []).map(meal => (
              <MealCard key={meal.id} meal={meal} isReadOnly />
            ))}
          </div>
        </Modal>
      )}

      {editingPlan && (
        <Modal
          isOpen={!!editingPlan}
          onClose={() => setEditingPlan(null)}
          title={`Editar Favorito`}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700">Título (Apelido)</label>
              <input 
                type="text"
                name="title"
                id="title"
                value={formState.title}
                onChange={handleFormChange}
                placeholder="Ex: Dieta para Foco"
                className={modalInputClasses}
              />
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700">Observações</label>
              <textarea 
                name="notes"
                id="notes"
                rows={4}
                value={formState.notes}
                onChange={handleFormChange}
                placeholder="Ex: Ótimo plano para dias de treino pesado."
                className={modalInputClasses}
              />
            </div>
          </div>
           <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setEditingPlan(null)} className="px-4 py-2 bg-gray-200 text-slate-800 rounded-md hover:bg-gray-300">Cancelar</button>
              <button type="button" onClick={handleSave} className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-brand-green-dark">Salvar Alterações</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default FavoritesView;