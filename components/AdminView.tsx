import React, { useState, FC } from 'react';
import { UserData, UserDataHandlers, View, AdminSettings, UserMacros, NotificationState } from '../types';
import { calculateNewMacroGoals } from './calculations';
import { LogoutIcon, SaveIcon } from './icons';
import Modal from './Modal';

interface AdminViewProps {
    userData: UserData;
    handlers: UserDataHandlers;
    setActiveView: (view: View) => void;
    showNotification: (notification: NotificationState) => void;
}

const Label: FC<{htmlFor: string, children: React.ReactNode}> = ({htmlFor, children}) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">{children}</label>
);

const Input: FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className={`w-full mt-1 px-3 py-2 bg-white text-slate-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green ${props.className || ''}`} />
);

const AdminView: FC<AdminViewProps> = ({ userData, handlers, setActiveView, showNotification }) => {
    const [formData, setFormData] = useState({
        macros: { ...userData.macros },
        adminSettings: { permanentPrompt: '', ...userData.adminSettings } as AdminSettings,
    });

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [nutriName, setNutriName] = useState(userData.nutritionistInfo?.name || '');
    const [nutriEmail, setNutriEmail] = useState(userData.nutritionistInfo?.email || '');
    
    const handleMacroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const [macro, property] = name.split('.'); // e.g., 'calories.goal'
        setFormData(prev => ({
            ...prev,
            macros: {
                ...prev.macros,
                [macro]: {
                    ...prev.macros[macro as keyof UserMacros],
                    [property]: parseFloat(value) || 0
                }
            }
        }));
    };

    const handleSettingsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            adminSettings: {
                ...prev.adminSettings,
                [name]: value,
            }
        }));
    };

    const handleSaveChanges = () => {
        setIsConfirmModalOpen(true);
    };

    const handleConfirmAndSave = () => {
        if (!nutriName.trim() || !nutriEmail.trim()) {
            alert('Por favor, preencha o nome e o e-mail do nutricionista.');
            return;
        }
    
        const newHistoryEntry = {
            date: new Date().toISOString(),
            nutritionistName: nutriName,
        };
        
        const currentHistory = Array.isArray(userData.modificationHistory) ? userData.modificationHistory : [];
    
        handlers.updateUserData({
            macros: formData.macros,
            adminSettings: formData.adminSettings,
            nutritionistInfo: { name: nutriName, email: nutriEmail },
            modificationHistory: [...currentHistory, newHistoryEntry],
        });
        setIsConfirmModalOpen(false);
        showNotification({ type: 'success', message: 'Modificação salva!' });
    };
    
    const handleRecalculateMacros = () => {
        const newMacros = calculateNewMacroGoals({ ...userData, dietDifficulty: userData.dietDifficulty });
        setFormData(prev => ({
            ...prev,
            macros: {
                ...prev.macros,
                calories: { ...prev.macros.calories, goal: newMacros.calories.goal },
                carbs: { ...prev.macros.carbs, goal: newMacros.carbs.goal },
                protein: { ...prev.macros.protein, goal: newMacros.protein.goal },
                fat: { ...prev.macros.fat, goal: newMacros.fat.goal },
            }
        }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Painel do Nutricionista</h2>
                    <p className="text-slate-500">Controle avançado para o paciente: <span className="font-semibold">{userData.name}</span></p>
                </div>
                <button onClick={() => setActiveView('Dieta')} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 flex items-center gap-2 text-sm transition-colors">
                    <LogoutIcon className="w-4 h-4" />
                    Sair do Painel
                </button>
            </header>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Metas de Macronutrientes</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <Label htmlFor="calories.goal">Calorias (kcal)</Label>
                        <Input type="number" name="calories.goal" id="calories.goal" value={formData.macros.calories.goal} onChange={handleMacroChange} />
                    </div>
                    <div>
                        <Label htmlFor="protein.goal">Proteínas (g)</Label>
                        <Input type="number" name="protein.goal" id="protein.goal" value={formData.macros.protein.goal} onChange={handleMacroChange} />
                    </div>
                    <div>
                        <Label htmlFor="carbs.goal">Carboidratos (g)</Label>
                        <Input type="number" name="carbs.goal" id="carbs.goal" value={formData.macros.carbs.goal} onChange={handleMacroChange} />
                    </div>
                    <div>
                        <Label htmlFor="fat.goal">Gorduras (g)</Label>
                        <Input type="number" name="fat.goal" id="fat.goal" value={formData.macros.fat.goal} onChange={handleMacroChange} />
                    </div>
                </div>
                <button 
                    onClick={handleRecalculateMacros}
                    className="text-sm font-semibold text-brand-green hover:underline"
                >
                    Recalcular metas com base nos dados do paciente
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Instrução Permanente para a IA</h3>
                <p className="text-sm text-slate-500 mb-4">Esta instrução será adicionada a **todos** os prompts de geração de dieta para este paciente. Use para regras que não mudam. Ex: "Sempre incluir uma fonte de fibras no café da manhã" ou "Evitar carne vermelha no jantar".</p>
                <textarea
                    name="permanentPrompt"
                    rows={4}
                    value={formData.adminSettings.permanentPrompt || ''}
                    onChange={handleSettingsChange}
                    className="w-full mt-1 px-3 py-2 bg-white text-slate-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green"
                    placeholder="Ex: Priorizar carboidratos de baixo índice glicêmico..."
                />
            </div>
            
            <div className="flex justify-end">
                <button
                    onClick={handleSaveChanges}
                    className="px-6 py-3 bg-brand-green text-white font-semibold rounded-lg hover:bg-brand-green-dark flex items-center gap-2 text-sm transition-colors"
                >
                    <SaveIcon className="w-5 h-5" />
                    Salvar Todas as Alterações
                </button>
            </div>
            <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Registrar Alteração">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">Para salvar as alterações no histórico do paciente, por favor, confirme sua identidade.</p>
                    <div>
                        <Label htmlFor="nutriName">Seu Nome</Label>
                        <Input id="nutriName" type="text" value={nutriName} onChange={(e) => setNutriName(e.target.value)} placeholder="Nome do Nutricionista" />
                    </div>
                    <div>
                        <Label htmlFor="nutriEmail">Seu E-mail</Label>
                        <Input id="nutriEmail" type="email" value={nutriEmail} onChange={(e) => setNutriEmail(e.target.value)} placeholder="email@nutricionista.com" />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsConfirmModalOpen(false)} className="px-4 py-2 bg-gray-200 text-slate-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="button" onClick={handleConfirmAndSave} className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-brand-green-dark">Confirmar e Salvar</button>
                </div>
            </Modal>
        </div>
    );
};

export default AdminView;