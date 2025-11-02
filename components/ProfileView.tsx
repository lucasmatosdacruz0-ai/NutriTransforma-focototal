

import React, { useState, useRef, useMemo, FC } from 'react';
import { UserData, UserDataHandlers, Gender, ActivityLevel, View, UserMacros } from '../types';
import { UserIcon, EditIcon, LogoutIcon, MailIcon, InstagramIcon, PhoneIcon, TargetIcon, UtensilsIcon, QuestionMarkCircleIcon, ChevronRightIcon, SparklesIcon } from './icons';
import Modal from './Modal';
import XPDisplay from './XPDisplay';
import { ALL_ACHIEVEMENTS } from '../constants/achievements';
import { PLANS } from '../constants/plans';
import CollapsibleCard from './CollapsibleCard';
import { calculateXPForLevel } from './utils/xpUtils';


interface ProfileViewProps {
    userData: UserData;
    handlers: UserDataHandlers;
    setActiveView: (view: View) => void;
}

const DIETS = ['Vegetariano', 'Low Carb', 'Sem Lactose', 'Flexível', 'Vegano', 'Sem Glúten', 'Mediterrânea'];
const RESTRICTIONS = ['Diabetes', 'Hipertensão', 'Colesterol Alto', 'Alergia a Nozes', 'Alergia a Frutos do Mar', 'Intolerância a Lactose', 'Doença Celíaca', 'Nenhuma'];


const ProfileView: FC<ProfileViewProps> = ({ userData, handlers, setActiveView }) => {
    const [isAccountModalOpen, setAccountModalOpen] = useState(false);
    const [isPersonalDataModalOpen, setPersonalDataModalOpen] = useState(false);
    const [isObjectivesModalOpen, setObjectivesModalOpen] = useState(false);
    const [isPreferencesEditing, setPreferencesEditing] = useState(false);
    const [openSection, setOpenSection] = useState<string | null>(null);
    
    const [formData, setFormData] = useState<Partial<UserData>>(userData);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const modalInputClasses = "w-full mt-1 px-3 py-2 bg-white text-slate-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green";

    const { name, email, profilePicture, level, xp, instagram, whatsapp } = userData;
    
    const xpForNextLevel = useMemo(() => calculateXPForLevel(level), [level]);
    const xpProgress = useMemo(() => xpForNextLevel > 0 ? (xp / xpForNextLevel) * 100 : 0, [xp, xpForNextLevel]);
    
    const handleToggleSection = (sectionId: string) => {
        setOpenSection(prev => (prev === sectionId ? null : sectionId));
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
                        handlers.updateUserData({ profilePicture: img.src });
                        return;
                    }

                    ctx.drawImage(img, 0, 0, width, height);

                    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
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

            if (type === 'restrictions' && value === 'Nenhuma' && newPrefs.includes('Nenhuma')) {
                newPrefs = ['Nenhuma'];
            } else if (type === 'restrictions') {
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

    const ProfileInfoItem: React.FC<{ label: string; value: string | number | undefined }> = ({ label, value }) => (
        <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="font-semibold text-slate-800">{value || 'Não informado'}</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6 md:gap-8">
             <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 theme-athlete:bg-[--bg-card] theme-athlete:border-[--border-color]">
                <div className="flex items-start gap-5 mb-6">
                    <div className="relative group flex-shrink-0">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-24 h-24 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green"
                            aria-label="Alterar foto de perfil"
                        >
                            {profilePicture ? (
                                <img src={profilePicture} alt="Foto de Perfil" className="w-24 h-24 rounded-full object-cover" />
                            ) : (
                                <div className="w-24 h-24 bg-brand-green-light rounded-full flex items-center justify-center theme-athlete:bg-slate-700">
                                    <UserIcon className="w-12 h-12 text-brand-green-dark theme-athlete:text-slate-400" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full flex items-center justify-center transition-opacity duration-300">
                                <EditIcon className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePictureChange}
                            accept="image/png, image/jpeg"
                            className="hidden"
                        />
                    </div>

                    <div className="flex-grow pt-2">
                        <h2 className="text-3xl font-bold text-slate-900 leading-tight">
                            {name || 'Nome do Usuário'}
                        </h2>
                    </div>
                    <button onClick={() => openModal(setAccountModalOpen)} className="p-3 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 self-start theme-athlete:bg-slate-700/50 theme-athlete:text-slate-300 theme-athlete:hover:bg-slate-600/50">
                        <EditIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-4">
                        <MailIcon className="w-5 h-5 text-slate-400" />
                        <span className="text-slate-800 font-medium theme-athlete:text-slate-300">{email || 'Adicionar e-mail'}</span>
                    </div>
                     <div className="flex items-center gap-4">
                        <InstagramIcon className="w-5 h-5 text-slate-400" />
                        {instagram ? (
                             <a href={`https://instagram.com/${instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="text-slate-800 font-medium hover:underline theme-athlete:text-slate-300">{instagram}</a>
                        ) : (
                             <button onClick={() => openModal(setAccountModalOpen)} className="text-slate-500 italic hover:text-slate-700 theme-athlete:text-slate-400 theme-athlete:hover:text-slate-200">Adicionar Instagram</button>
                        )}
                    </div>
                     <div className="flex items-center gap-4">
                        <PhoneIcon className="w-5 h-5 text-slate-400" />
                        {whatsapp ? (
                            <span className="text-slate-800 font-medium theme-athlete:text-slate-300">{whatsapp}</span>
                        ) : (
                            <button onClick={() => openModal(setAccountModalOpen)} className="text-slate-500 italic hover:text-slate-700 theme-athlete:text-slate-400 theme-athlete:hover:text-slate-200">Adicionar WhatsApp</button>
                        )}
                    </div>
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1 text-sm">
                        <span className="font-bold text-brand-blue theme-athlete:text-blue-400">Nível {level}</span>
                        <span className="font-medium text-slate-500 theme-athlete:text-slate-400">{Math.floor(xp)} / {xpForNextLevel} XP</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 theme-athlete:bg-[--bg-card-alt]">
                        <div 
                            className="bg-brand-blue h-2.5 rounded-full theme-athlete:bg-blue-500" 
                            style={{ width: `${xpProgress}%` }}
                        ></div>
                    </div>
                </div>
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

            <button
                onClick={handlers.handleLogout}
                className="w-full text-center py-3 text-sm font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
            >
                Sair da Conta
            </button>
            

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
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Instagram (opcional)</label>
                        <input type="text" name="instagram" value={formData.instagram || ''} onChange={handleInputChange} className={modalInputClasses} placeholder="@seuusuario" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">WhatsApp (opcional)</label>
                        <input type="text" name="whatsapp" value={formData.whatsapp || ''} onChange={handleInputChange} className={modalInputClasses} placeholder="+55 (XX) XXXXX-XXXX"/>
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