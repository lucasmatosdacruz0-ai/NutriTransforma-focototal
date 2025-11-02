

import React, { useState } from 'react';
import Modal from './Modal';
import { UserData, UserMacros } from '../types';
import { calculateNewMacroGoals } from './calculations';

interface AdjustGoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    // FIX: Updated `onSave` signature to include `newMacros`
    onSave: (newWeightGoal: number, newMacros: UserMacros) => void;
    userData: UserData;
}

const AdjustGoalModal: React.FC<AdjustGoalModalProps> = ({ isOpen, onClose, onSave, userData }) => {
    const [newWeightGoal, setNewWeightGoal] = useState(userData.weightGoal);

    const handleSave = () => {
        // Calculate new macros based on the adjusted weight goal and current user data
        const updatedUserData = { ...userData, weightGoal: newWeightGoal };
        const newMacros = calculateNewMacroGoals(updatedUserData);
        onSave(newWeightGoal, newMacros);
    };

    const handleQuickSet = (type: 'lose' | 'maintain' | 'gain') => {
        let goal;
        switch (type) {
            case 'lose':
                goal = Math.round(userData.weight * 0.95);
                break;
            case 'maintain':
                goal = Math.round(userData.weight);
                break;
            case 'gain':
                goal = Math.round(userData.weight * 1.05);
                break;
        }
        setNewWeightGoal(goal);
    };

    const quickButtonClass = "flex-1 py-2 text-sm font-semibold rounded-md transition-colors border";

    return (
        <Modal title="Ajustar Meta de Peso" isOpen={isOpen} onClose={onClose}>
            <div className="space-y-4">
                <div>
                    <p className="text-sm font-medium text-slate-700 mb-2">Definir objetivo rápido:</p>
                    <div className="flex gap-2">
                        <button onClick={() => handleQuickSet('lose')} className={`${quickButtonClass} bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200`}>Perder Peso</button>
                        <button onClick={() => handleQuickSet('maintain')} className={`${quickButtonClass} bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200`}>Manter Peso</button>
                        <button onClick={() => handleQuickSet('gain')} className={`${quickButtonClass} bg-green-100 text-green-700 border-green-200 hover:bg-green-200`}>Ganhar Massa</button>
                    </div>
                </div>

                <div>
                    <label htmlFor="weight-goal-input" className="block text-sm font-medium text-slate-700 mb-1">
                        Ou defina sua meta exata (kg)
                    </label>
                    <input
                        id="weight-goal-input"
                        type="number"
                        step="0.1"
                        value={newWeightGoal}
                        onChange={(e) => setNewWeightGoal(parseFloat(e.target.value))}
                        className="w-full px-3 py-2 bg-white text-slate-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green"
                        autoFocus
                    />
                </div>

                <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm border border-yellow-200">
                    <p>Ajustar a meta irá recalcular suas necessidades diárias de calorias e macronutrientes para que a IA gere planos alinhados com seu novo objetivo.</p>
                </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-slate-800 rounded-md hover:bg-gray-300">
                    Cancelar
                </button>
                <button type="button" onClick={handleSave} className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-brand-green-dark">
                    Salvar Nova Meta
                </button>
            </div>
        </Modal>
    );
};

export default AdjustGoalModal;