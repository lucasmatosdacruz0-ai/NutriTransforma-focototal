

import React, { useState } from 'react';
import { UserData, Gender, ActivityLevel, DietaryPreferences } from '../types';
import { BowlIcon } from './icons/BowlIcon';
import { calculateNewMacroGoals } from './calculations';
import { SparklesIcon } from './icons/SparklesIcon';
import { CameraIcon } from './icons/CameraIcon';
import { ChartIcon } from './icons/ChartIcon';
import { ChatIcon } from './icons/ChatIcon';
import { CheckIcon } from './icons/CheckIcon';

interface OnboardingFlowProps {
    onComplete: (data: Partial<UserData>) => void;
}

const DIETS = ['Vegetariano', 'Low Carb', 'Sem Lactose', 'Flexível', 'Vegano', 'Sem Glúten', 'Mediterrânea'];
const RESTRICTIONS = ['Diabetes', 'Hipertensão', 'Colesterol Alto', 'Alergia a Nozes', 'Alergia a Frutos do Mar', 'Intolerância a Lactose', 'Doença Celíaca', 'Nenhuma'];

const FeatureListItem: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-brand-green-light rounded-lg flex items-center justify-center">
            {icon}
        </div>
        <div>
            <h4 className="font-semibold text-slate-800">{title}</h4>
            <p className="text-slate-600 text-sm">{description}</p>
        </div>
    </div>
);


const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        age: 30,
        gender: 'male' as Gender,
        height: 175,
        weight: 75,
        weightGoal: 70,
        activityLevel: 'sedentary' as ActivityLevel,
        dietaryPreferences: {
            diets: [] as string[],
            restrictions: [] as string[],
        }
    });

    const inputClasses = "w-full px-3 py-2 bg-white text-slate-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'age' || name === 'height' || name === 'weight' || name === 'weightGoal' ? parseFloat(value) : value }));
    };

    const handlePreferenceChange = (type: 'diets' | 'restrictions', value: string) => {
        setFormData(prev => {
            const { dietaryPreferences } = prev;
            const currentPrefs = dietaryPreferences[type];
            let newPrefs: string[];
    
            if (type === 'restrictions') {
                if (value === 'Nenhuma') {
                    // Se "Nenhuma" já estiver selecionado, desmarque-o. Caso contrário, selecione apenas "Nenhuma".
                    newPrefs = currentPrefs.includes('Nenhuma') ? [] : ['Nenhuma'];
                } else {
                    // Se outra opção for selecionada
                    if (currentPrefs.includes(value)) {
                        // Desmarque
                        newPrefs = currentPrefs.filter(item => item !== value);
                    } else {
                        // Selecione, e remova "Nenhuma" se estiver lá
                        newPrefs = [...currentPrefs.filter(item => item !== 'Nenhuma'), value];
                    }
                }
            } else { // Para 'dietas'
                newPrefs = currentPrefs.includes(value)
                    ? currentPrefs.filter(item => item !== value)
                    : [...currentPrefs, value];
            }
            
            return {
                ...prev,
                dietaryPreferences: {
                    ...dietaryPreferences,
                    [type]: newPrefs
                }
            };
        });
    };

    const handleSubmit = () => {
        const newMacros = calculateNewMacroGoals({
            weight: formData.weight,
            height: formData.height,
            age: formData.age,
            gender: formData.gender,
            activityLevel: formData.activityLevel,
            weightGoal: formData.weightGoal,
            dietDifficulty: 'normal',
        });

        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 7); // 7-day trial

        const finalData: Partial<UserData> = {
            ...formData,
            profilePicture: null,
            initialWeight: formData.weight,
            weightHistory: [{ date: new Date().toISOString(), weight: formData.weight }],
            water: 0,
            waterGoal: Math.round((formData.weight * 35) / 100) / 10,
            macros: {
                ...newMacros,
                calories: { ...newMacros.calories, current: 0 },
                carbs: { ...newMacros.carbs, current: 0 },
                protein: { ...newMacros.protein, current: 0 },
                fat: { ...newMacros.fat, current: 0 },
            },
            dietDifficulty: 'normal',
            streak: 0,
            completedDays: [],
            isSubscribed: false,
            trialEndDate: trialEndDate.toISOString(),
        };

        onComplete(finalData);
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);
    const totalSteps = 5;

    const renderStep = () => {
        switch(step) {
            case 0: return (
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">Transforme sua Saúde com Nutrição Inteligente</h2>
                    <p className="text-slate-600 mb-6 text-center">Seu nutricionista pessoal de IA, no seu bolso.</p>
                    <div className="space-y-5">
                         <FeatureListItem 
                            icon={<SparklesIcon className="w-6 h-6 text-brand-green" />}
                            title="Planos Personalizados com IA"
                            description="Receba dietas semanais e diárias criadas pela IA para atingir suas metas."
                        />
                         <FeatureListItem 
                            icon={<CameraIcon className="w-6 h-6 text-brand-green" />}
                            title="Análise de Refeições"
                            description="Tire uma foto ou descreva sua refeição para registrar macros instantaneamente."
                        />
                         <FeatureListItem 
                            icon={<ChartIcon className="w-6 h-6 text-brand-green" />}
                            title="Acompanhamento de Progresso"
                            description="Visualize sua evolução com gráficos e relatórios detalhados."
                        />
                         <FeatureListItem 
                            icon={<ChatIcon className="w-6 h-6 text-brand-green" />}
                            title="Chat com Nutricionista IA"
                            description="Tire dúvidas sobre alimentos e nutrição a qualquer hora do dia."
                        />
                    </div>
                </div>
            );
            case 1: return (
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Bem-vindo(a) ao NutriBot Pro!</h2>
                    <p className="text-slate-600 mb-6">Vamos configurar seu perfil para personalizar sua experiência.</p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Qual é o seu nome?</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Seu nome" className={inputClasses} />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">E o seu e-mail?</label>
                           <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="seu@email.com" className={inputClasses} />
                        </div>
                    </div>
                </div>
            );
            case 2: return (
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">Conte-nos sobre você</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Idade</label>
                            <input type="number" name="age" value={formData.age} onChange={handleChange} className={inputClasses}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Gênero</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className={inputClasses}>
                                <option value="male">Masculino</option>
                                <option value="female">Feminino</option>
                                <option value="other">Outro</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Altura (cm)</label>
                            <input type="number" name="height" value={formData.height} onChange={handleChange} className={inputClasses}/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nível de Atividade</label>
                            <select name="activityLevel" value={formData.activityLevel} onChange={handleChange} className={inputClasses}>
                                <option value="sedentary">Sedentário</option>
                                <option value="light">Leve</option>
                                <option value="moderate">Moderado</option>
                                <option value="active">Ativo</option>
                                <option value="very_active">Muito Ativo</option>
                            </select>
                        </div>
                    </div>
                </div>
            );
            case 3: return (
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-6">Quais são suas metas?</h2>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Peso Atual (kg)</label>
                            <input type="number" name="weight" value={formData.weight} onChange={handleChange} step="0.1" className={inputClasses}/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Meta de Peso (kg)</label>
                            <input type="number" name="weightGoal" value={formData.weightGoal} onChange={handleChange} step="0.1" className={inputClasses}/>
                        </div>
                    </div>
                </div>
            );
            case 4: return (
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Preferências Alimentares</h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-3">Dietas</h3>
                            <div className="flex flex-wrap gap-3">
                                {DIETS.map(diet => (
                                    <label key={diet}>
                                        <input 
                                            type="checkbox" 
                                            checked={formData.dietaryPreferences.diets.includes(diet)} 
                                            onChange={() => handlePreferenceChange('diets', diet)} 
                                            className="sr-only peer" 
                                        />
                                        <div className="px-4 py-2 border rounded-full cursor-pointer transition-colors text-sm font-semibold bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400 peer-checked:bg-brand-green peer-checked:border-brand-green peer-checked:text-white">
                                            <span className="hidden peer-checked:inline-flex items-center gap-1.5">
                                                <CheckIcon className="w-4 h-4" />
                                                {diet}
                                            </span>
                                            <span className="peer-checked:hidden">{diet}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                           <h3 className="text-lg font-semibold text-slate-700 mb-3">Restrições</h3>
                            <div className="flex flex-wrap gap-3">
                                {RESTRICTIONS.map(restriction => (
                                    <label key={restriction}>
                                        <input 
                                            type="checkbox" 
                                            checked={formData.dietaryPreferences.restrictions.includes(restriction)} 
                                            onChange={() => handlePreferenceChange('restrictions', restriction)} 
                                            className="sr-only peer" 
                                        />
                                        <div className="px-4 py-2 border rounded-full cursor-pointer transition-colors text-sm font-semibold bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400 peer-checked:bg-brand-green peer-checked:border-brand-green peer-checked:text-white">
                                            <span className="hidden peer-checked:inline-flex items-center gap-1.5">
                                                <CheckIcon className="w-4 h-4" />
                                                {restriction}
                                            </span>
                                            <span className="peer-checked:hidden">{restriction}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            );
            default: return null;
        }
    }
    
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
             <div className="flex items-center gap-3 mb-6">
                <div className="bg-brand-green p-2 rounded-full">
                    <BowlIcon className="w-6 h-6 text-white" />
                </div>
                <h1 className="font-bold text-xl text-slate-900">NutriBot Pro</h1>
            </div>
            <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8">
                {step > 0 && (
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-semibold text-brand-green">Passo {step} de {totalSteps - 1}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-brand-green h-2 rounded-full transition-all duration-500" style={{ width: `${(step / (totalSteps - 1)) * 100}%` }}></div>
                        </div>
                    </div>
                )}
                
                {renderStep()}

                <div className="mt-8 flex justify-between items-center">
                    <button onClick={prevStep} disabled={step === 0} className="px-4 py-2 bg-gray-200 text-slate-800 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">
                        Voltar
                    </button>
                    {step < totalSteps - 1 ? (
                        <button onClick={nextStep} className="px-6 py-2 bg-brand-green text-white rounded-md hover:bg-brand-green-dark">
                           {step === 0 ? "Vamos Começar!" : "Próximo"}
                        </button>
                    ) : (
                        <button onClick={handleSubmit} className="px-6 py-2 bg-brand-green text-white rounded-md hover:bg-brand-green-dark">
                           Concluir e Começar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingFlow;