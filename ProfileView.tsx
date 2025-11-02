
import React, { useState, useRef, useMemo } from 'react';
import { UserData, UserDataHandlers, Gender, ActivityLevel, View, UserMacros } from '../types';
import { UserIcon } from './icons/UserIcon';
import { EditIcon } from './icons/EditIcon';
import { LogoutIcon } from './icons/LogoutIcon';
import Modal from './Modal';
import XPDisplay from './XPDisplay';
import { ALL_ACHIEVEMENTS } from '../constants/achievements';
import { PLANS } from '../constants/plans';
import { SparklesIcon } from './icons/SparklesIcon';
// FIX: Import CollapsibleCard
import CollapsibleCard from './CollapsibleCard';
// FIX: Import TargetIcon and UtensilsIcon
import { TargetIcon } from './icons/TargetIcon';
import { UtensilsIcon } from './icons/UtensilsIcon';
// FIX: Import QuestionMarkCircleIcon and ChevronRightIcon
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon';
import { ChevronRightIcon } from './icons';


interface ProfileViewProps {
    userData: UserData;
    handlers: UserDataHandlers;
    setActiveView: (view: View) => void;
}

const DIETS = ['Vegetariano', 'Low Carb', 'Sem Lactose', 'Flexível', 'Vegano', 'Sem Glúten', 'Mediterrânea'];
const RESTRICTIONS = ['Diabetes', 'Hipertensão', 'Colesterol Alto', 'Alergia a Nozes', 'Alergia a Frutos do Mar', 'Intolerância a Lactose', 'Doença Celíaca', 'Nenhuma'];

const ProfileInfoItem: React.FC<{ label: string; value: string | number | undefined }> = ({ label, value }) => (
    <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="font-semibold text-slate-800">{value || 'Não informado'}</p>
    </div>
);

const ProfileView: React.FC<ProfileViewProps> = ({ userData, handlers, setActiveView }) => {
    const [isAccountModalOpen, setAccountModalOpen] = useState(false);
    const [isPersonalDataModalOpen, setPersonalDataModalOpen] = useState(false);
    // FIX: Corrected typo: setObjectivesModalModalOpen to setObjectivesModalOpen
    const [isObjectivesModalOpen, setObjectivesModalOpen] = useState(false);
    const [isPreferencesEditing, setPreferencesEditing] = useState(false);
    // FIX: Add state for open/close sections
    const [openSection, setOpenSection] = useState<string | null>('personal');
    
    const [formData, setFormData] = useState<Partial<UserData>>(userData);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const modalInputClasses = "w-full mt-1 px-3 py-2 bg-white text-slate-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green";

    const featuredAchievement = useMemo(() => {
        if (!userData.featuredAchievementId) return null;
        return ALL_ACHIEVEMENTS.find(ach => ach.id === userData.featuredAchievementId);
    }, [userData.featuredAchievementId]);

    const handleToggleSection = (sectionId: string) => {
        setOpenSection(prev => (prev === sectionId ? null : sectionId));
    };

    const handleLogout = () => {
        if (window.confirm("Você tem certeza que quer sair? Isso apagará seus dados locais para permitir um novo registro.")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    const openModal = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
        setFormData(userData);
        setter(true);
    };

    const handleSave = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
        handlers.updateUserData(formData);
        setter(false);
    };
    
    const handlePreferencesSave = () => {
        handlers.updateUserData({ dietaryPreferences: formData.dietaryPreferences });
        setPreferencesEditing(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['age', 'height', 'weight', 'weightGoal', 'level', 'xp'].includes(name);
        setFormData(prev => ({ ...prev, [name]: isNumeric ? parseFloat(value) || 0 : value }));
    };
    
    const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;

                img.onload = () => {
                    const MAX_WIDTH = 256;
                    const MAX_HEIGHT = 256;

                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    
                    if (!ctx) {
                        // Fallback to original if canvas fails
                        handlers.updateUserData({ profilePicture: img.src });
                        return;
                    }

                    ctx.drawImage(img, 0, 0, width, height);

                    // Get the data-URL with compression
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

                    setFormData(prev => ({ ...prev, profilePicture: dataUrl }));
                    handlers.updateUserData({ profilePicture: dataUrl });
                };
            };
            
            reader.onerror = (error) => {
                console.error('Error reading file:', error);
            };
            
            reader.readAsDataURL(file);
        }
    };
    
    const handlePreferenceChange = (type: 'diets' | 'restrictions', value: string) => {
        setFormData(prev => {
            const currentPrefs = prev.dietaryPreferences?.[type] ?? [];
            let newPrefs = currentPrefs.includes(value)
                ? currentPrefs.filter(item => item !== value)
                : [...currentPrefs, value];

            if (value === 'Nenhuma' && newPrefs.includes('Nenhuma')) {
                newPrefs = ['Nenhuma'];
            } else {
                newPrefs = newPrefs.filter(item => item !== 'Nenhuma');
            }
            
            return {
                ...prev,
                dietaryPreferences: {
                    ...(prev.dietaryPreferences ?? { diets: [], restrictions: [] }),
                    [type]: newPrefs
                }
            };
        });
    };

    const activityLevelText: Record<ActivityLevel, string> = {
      sedentary: 'Sedentário', light: 'Leve', moderate: 'Moderado', active: 'Ativo', very_active: 'Muito Ativo',
    };

    const genderText: Record<Gender, string> = { male: 'Masculino', female: 'Feminino', other: 'Outro' };
    
    const objectiveText = () => {
        if (userData.weight > userData.weightGoal) return 'Perder peso';
        if (userData.weight < userData.weightGoal) return 'Ganhar peso';
        return 'Manter peso';
    };

    const buttonClass = "px-3 py-2 bg-white border border-gray-300 text-slate-700 rounded-lg hover:bg-gray-100 flex items-center gap-2 text-sm font-semibold transition-colors theme-athlete:bg-slate-700 theme-athlete:border-slate-600 theme-athlete:hover:bg-slate-600";
    
    const planName = userData.isSubscribed && userData.currentPlan ? PLANS[userData.currentPlan].name : "Trial";
    const billingCycleText = userData.billingCycle === 'annual' ? "Anual" : "Mensal";
    
    // FIX: Remove todaysActivitiesCount as ActivityLog is removed
    // const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
    // const todaysActivitiesCount = useMemo(() => (userData.activityLogs || []).filter(log => log.date === todayStr).length, [userData.activityLogs, todayStr]);


    return (
        <div className="flex flex-col gap-6 md:gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-5 theme-athlete:bg-slate-800 theme-athlete:border-slate-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative group flex-shrink-0">
                            {userData.profilePicture ? (
                               <img src={userData.profilePicture} alt="Foto de Perfil" className="w-28 h-28 rounded-full object-cover border-2 border-white shadow-md theme-athlete:border-slate-600"/>
                           ) : (
                               <div className="w-28 h-28 bg-brand-green flex items-center justify-center rounded-full">
                                   <UserIcon className="w-14 h-14 text-white" />
                               </div>
                           )}
                           <button 
                               onClick={() => fileInputRef.current?.click()}
                               className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center rounded-full transition-all duration-300 cursor-pointer"
                               aria-label="Alterar foto de perfil"
                           >
                               <EditIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                           </button>
                           {featuredAchievement && (
                                <div className="profile-featured-achievement" title={`Conquista em Destaque: ${featuredAchievement.title}`}>
                                    {React.createElement(featuredAchievement.icon, { className: 'icon' })}
                                </div>
                           )}
                        </div>
                        <input type="file" accept="image/*" onChange={handlePictureChange} ref={fileInputRef} className="hidden" />

                        <div>
                            <h2 className="text-xl font-bold text-slate-900 capitalize">{userData.name || 'Usuário'}</h2>
                            <p className="text-sm text-slate-500">{userData.email || 'email@naoinformado.com'}</p>
                             <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${userData.isSubscribed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {planName}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button id="edit-profile-button" onClick={() => openModal(setAccountModalOpen)} className={buttonClass}>
                            <EditIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Editar</span>
                        </button>
                        <button onClick={handleLogout} className="px-3 py-2 bg-red-500 border border-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2 text-sm font-semibold">
                             <LogoutIcon className="w-4 h-4" />
                             <span className="hidden sm:inline">Sair</span>
                        </button>
                    </div>
                </div>

                <XPDisplay level={userData.level} xp={userData.xp} />
            </div>
            
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 theme-athlete:bg-slate-800 theme-athlete:border-slate-700">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-yellow-500" /> Assinatura</h3>
                        {userData.isSubscribed ? (
                             <p className="text-sm text-slate-500">
                                Seu plano: <span className="font-semibold">{PLANS[userData.currentPlan!].name} - {billingCycleText}</span>.
                            </p>
                        ) : (
                            <p className="text-sm text-slate-500">Você está no período de teste. Faça upgrade para ter acesso ilimitado.</p>
                        )}
                       
                    </div>
                     <button onClick={() => setActiveView('Gerenciar Assinatura')} className="px-4 py-2 bg-brand-green text-white font-semibold rounded-lg hover:bg-brand-green-dark transition-colors text-sm">
                        Ver Planos e Uso
                    </button>
                </div>
            </div>

            {/* FIX: Remove Activities collapsible card */}
            {/* <CollapsibleCard
                title="Minhas Atividades"
                icon={<ActivityIcon className="w-6 h-6 text-lime-600" />}
                isOpen={openSection === 'activities'}
                onToggle={() => handleToggleSection('activities')}
                action={
                    <button onClick={() => setActiveView('Atividades')} className={buttonClass}>
                        Gerenciar <ChevronRightIcon className="w-4 h-4" />
                    </button>
                }
            >
                <div className="pt-4 border-t border-gray-100 theme-athlete:border-slate-700">
                    <p className="text-sm text-slate-500">
                        {todaysActivitiesCount > 0
                            ? `Você registrou ${todaysActivitiesCount} ${todaysActivitiesCount === 1 ? 'atividade' : 'atividades'} hoje.`
                            : "Nenhuma atividade registrada hoje."
                        }
                    </p>
                </div>
            </CollapsibleCard> */}

            <CollapsibleCard
                title="Dados Pessoais"
                icon={<UserIcon className="w-6 h-6 text-indigo-500" />}
                isOpen={openSection === 'personal'}
                onToggle={() => handleToggleSection('personal')}
                action={<button onClick={() => openModal(setPersonalDataModalOpen)} className={buttonClass}><EditIcon className="w-4 h-4" />Editar</button>}
            >
                <div className="pt-4 border-t border-gray-100 theme-athlete:border-slate-700">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                        <ProfileInfoItem label="Idade" value={`${userData.age} anos`}/>
                        <ProfileInfoItem label="Gênero" value={genderText[userData.gender]}/>
                        <ProfileInfoItem label="Altura (cm)" value={`${userData.height} cm`}/>
                        <ProfileInfoItem label="Atividade Física" value={activityLevelText[userData.activityLevel]}/>
                    </div>
                </div>
            </CollapsibleCard>

            <CollapsibleCard
                title="Objetivos"
                icon={<TargetIcon className="w-6 h-6 text-red-500" />}
                isOpen={openSection === 'objectives'}
                onToggle={() => handleToggleSection('objectives')}
                action={<button onClick={() => openModal(setObjectivesModalOpen)} className={buttonClass}><EditIcon className="w-4 h-4" />Editar</button>}
            >
                <div className="pt-4 border-t border-gray-100 theme-athlete:border-slate-700">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
                        <ProfileInfoItem label="Peso Atual (kg)" value={userData.weight.toFixed(1)}/>
                        <ProfileInfoItem label="Peso Meta (kg)" value={userData.weightGoal.toFixed(1)}/>
                        <ProfileInfoItem label="Objetivo" value={objectiveText()}/>
                    </div>
                </div>
            </CollapsibleCard>

            <CollapsibleCard
                title="Preferências Alimentares"
                icon={<UtensilsIcon className="w-6 h-6 text-green-500" />}
                isOpen={openSection === 'preferences'}
                onToggle={() => handleToggleSection('preferences')}
                action={
                    !isPreferencesEditing ? (
                         <button onClick={() => { setFormData(userData); setPreferencesEditing(true); if (openSection !== 'preferences') handleToggleSection('preferences'); }} className={buttonClass}><EditIcon className="w-4 h-4" />Editar</button>
                    ) : (
                        <button onClick={handlePreferencesSave} className="px-4 py-2 bg-brand-green text-white font-semibold rounded-lg hover:bg-brand-green-dark transition-colors text-sm">Salvar</button>
                    )
                }
            >
                <div className="space-y-4 pt-4 border-t border-gray-100 theme-athlete:border-slate-700">
                    <div>
                        <h4 className="font-semibold text-slate-600 mb-2">Dietas</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-2">
                            {DIETS.map(diet => (
                                <label key={diet} className={`flex items-center space-x-2 text-sm ${isPreferencesEditing ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}>
                                    <input type="checkbox" disabled={!isPreferencesEditing} checked={isPreferencesEditing ? formData.dietaryPreferences?.diets.includes(diet) : userData.dietaryPreferences.diets.includes(diet)} onChange={() => handlePreferenceChange('diets', diet)} className="w-4 h-4 rounded text-brand-green focus:ring-brand-green/50 disabled:bg-gray-200" />
                                    <span className="text-slate-700">{diet}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="pt-2">
                        <h4 className="font-semibold text-slate-600 mb-2">Restrições</h4>
                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-2">
                            {RESTRICTIONS.map(r => (
                                <label key={r} className={`flex items-center space-x-2 text-sm ${isPreferencesEditing ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}>
                                    <input type="checkbox" disabled={!isPreferencesEditing} checked={isPreferencesEditing ? formData.dietaryPreferences?.restrictions.includes(r) : userData.dietaryPreferences.restrictions.includes(r)} onChange={() => handlePreferenceChange('restrictions', r)} className="w-4 h-4 rounded text-brand-green focus:ring-brand-green/50 disabled:bg-gray-200"/>
                                    <span className="text-slate-700">{r}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </CollapsibleCard>
            
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 theme-athlete:bg-slate-800 theme-athlete:border-slate-700">
                <div className="flex items-start gap-4">
                    <div className="bg-blue-100 p-2 rounded-lg mt-1 theme-athlete:bg-blue-500/20">
                         <QuestionMarkCircleIcon className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Recursos</h3>
                        <p className="text-sm text-slate-500 mt-1 mb-4">Precisa de ajuda para navegar no aplicativo? Faça nosso tour guiado a qualquer momento para ver as principais funcionalidades.</p>
                        <button onClick={handlers.startTutorial} className="px-4 py-2 bg-brand-green text-white font-semibold rounded-lg hover:bg-brand-green-dark transition-colors text-sm">
                            Fazer Tour Guiado
                        </button>
                    </div>
                </div>
            </div>

            <Modal title="Editar Conta" isOpen={isAccountModalOpen} onClose={() => setAccountModalOpen(false)}>
                 <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Nome</label>
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={modalInputClasses}/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={modalInputClasses}/>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3"><button onClick={() => setAccountModalOpen(false)} className="px-4 py-2 bg-gray-200 text-slate-800 rounded-md hover:bg-gray-300">Cancelar</button><button onClick={() => handleSave(setAccountModalOpen)} className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-brand-green-dark">Salvar</button></div>
            </Modal>
            
             <Modal title="Editar Dados Pessoais" isOpen={isPersonalDataModalOpen} onClose={() => setPersonalDataModalOpen(false)}>
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-700">Idade</label><input type="number" name="age" value={formData.age} onChange={handleInputChange} className={modalInputClasses}/></div>
                        <div><label className="block text-sm font-medium text-slate-700">Gênero</label><select name="gender" value={formData.gender} onChange={handleInputChange} className={modalInputClasses}><option value="male">Masculino</option><option value="female">Feminino</option><option value="other">Outro</option></select></div>
                        <div><label className="block text-sm font-medium text-slate-700">Altura (cm)</label><input type="number" name="height" value={formData.height} onChange={handleInputChange} className={modalInputClasses}/></div>
                    </div>
                    <div><label className="block text-sm font-medium text-slate-700">Nível de Atividade</label><select name="activityLevel" value={formData.activityLevel} onChange={handleInputChange} className={modalInputClasses}><option value="sedentary">Sedentário</option><option value="light">Leve</option><option value="moderate">Moderado</option><option value="active">Ativo</option><option value="very_active">Muito Ativo</option></select></div>
                </div>
                <div className="mt-6 flex justify-end gap-3"><button onClick={() => setPersonalDataModalOpen(false)} className="px-4 py-2 bg-gray-200 text-slate-800 rounded-md hover:bg-gray-300">Cancelar</button><button onClick={() => handleSave(setPersonalDataModalOpen)} className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-brand-green-dark">Salvar</button></div>
            </Modal>
            
             <Modal title="Editar Objetivos" isOpen={isObjectivesModalOpen} onClose={() => setObjectivesModalOpen(false)}>
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-slate-700">Peso Atual (kg)</label><input type="number" step="0.1" name="weight" value={formData.weight} onChange={handleInputChange} className={modalInputClasses}/></div>
                        <div><label className="block text-sm font-medium text-slate-700">Meta de Peso (kg)</label><input type="number" step="0.1" name="weightGoal" value={formData.weightGoal} onChange={handleInputChange} className={modalInputClasses}/></div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3"><button onClick={() => setObjectivesModalOpen(false)} className="px-4 py-2 bg-gray-200 text-slate-800 rounded-md hover:bg-gray-300">Cancelar</button><button onClick={() => handleSave(setObjectivesModalOpen)} className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-brand-green-dark">Salvar</button></div>
            </Modal>
        </div>
    );
};

export default ProfileView;
