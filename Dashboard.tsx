

import React, { useState, useMemo, useEffect } from 'react';
import InfoCard from './InfoCard';
import Modal from './Modal';
import LogMealModal from './LogMealModal';
import WaterReminderModal from './WaterReminderModal';
import AdjustGoalModal from './AdjustGoalModal';
import { MacroData, WaterReminderSettings, UserData, UserDataHandlers, View, UserMacros } from '../types';
import { GraphIcon } from './icons/GraphIcon';
import { FireIcon } from './icons/FireIcon';
import { WaterDropletsIcon } from './icons/WaterDropletsIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { UtensilsIcon } from './icons/UtensilsIcon';
import { BellIcon } from './icons/BellIcon';
import { UserIcon } from './icons/UserIcon';
import { EditIcon } from './icons/EditIcon';
import { CheckIcon } from './icons/CheckIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import { calculateXPForLevel } from './utils/xpUtils';
import { QuestionMarkCircleIcon } from './icons/QuestionMarkCircleIcon';
import SubscriptionCTA from './SubscriptionCTA';


interface DashboardProps {
    userData: UserData;
    handlers: UserDataHandlers;
    setActiveView: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userData, handlers, setActiveView }) => {
    const { name, weight, water, macros, waterReminders, initialWeight, weightGoal, waterGoal, profilePicture, streak, completedDays, level, xp } = userData;
    const { updateUserData, addWater, handleLogMeal, handleUpdateWeight, handleMarkDayAsCompleted, handleChangeDietDifficulty } = handlers;
    
    const [isWeightModalOpen, setWeightModalOpen] = useState(false);
    const [isMealModalOpen, setMealModalOpen] = useState(false);
    const [isWaterReminderModalOpen, setWaterReminderModalOpen] = useState(false);
    const [isAdjustGoalModalOpen, setAdjustGoalModalOpen] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    
    const [newWeight, setNewWeight] = useState(weight.toString());

    const waterProgress = useMemo(() => Math.min((water / waterGoal) * 100, 100), [water, waterGoal]);
    const weightProgress = useMemo(() => {
        const start = initialWeight;
        const end = weightGoal;
        const current = weight;

        if (start === end) {
            return start === current ? 100 : 0;
        }

        const progress = ((current - start) / (end - start)) * 100;

        return Math.max(0, Math.min(progress, 100));
    }, [weight, initialWeight, weightGoal]);

    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
    const isTodayCompleted = useMemo(() => completedDays.includes(todayStr), [completedDays, todayStr]);
    const isAthleteMode = userData.dietDifficulty === 'athlete';

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 5) return { text: 'Boa noite', emoji: '🌙' };
        if (hour < 12) return { text: 'Bom dia', emoji: '☀️' };
        if (hour < 18) return { text: 'Boa tarde', emoji: '🌤️' };
        return { text: 'Boa noite', emoji: '🌙' };
    };

    const formatDate = () => {
        const date = new Date();
        const formatter = new Intl.DateTimeFormat('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        });
        const parts = formatter.formatToParts(date);
        let formattedDate = '';
        parts.forEach(part => {
           if(part.type === 'weekday') {
                formattedDate += part.value.charAt(0).toUpperCase() + part.value.slice(1);
           } else {
               formattedDate += part.value;
           }
        });
        return formattedDate.replace('-feira', '-feira,');
    };

    const handleSaveWeight = (e: React.FormEvent) => {
        e.preventDefault();
        const weightValue = parseFloat(newWeight);
        if (!isNaN(weightValue) && weightValue > 0) {
            handleUpdateWeight(weightValue);
        }
        setWeightModalOpen(false);
    };
    
    const handleSaveNewGoal = (newWeightGoal: number, newMacros: UserMacros) => {
        updateUserData({
            weightGoal: newWeightGoal,
            macros: newMacros
        });
        setAdjustGoalModalOpen(false);
    };

    const handleSaveWaterReminders = (settings: WaterReminderSettings) => {
        updateUserData({ waterReminders: settings });
        setWaterReminderModalOpen(false);

        if (settings.enabled && Notification.permission !== 'granted') {
             Notification.requestPermission().then(permission => {
                if (permission !== 'granted') {
                    alert("As notificações foram bloqueadas. Para ativá-las, mude as permissões do site no seu navegador.");
                    updateUserData({ waterReminders: { ...settings, enabled: false } });
                }
            });
        }
    };

    useEffect(() => {
        if (userData.isSubscribed) {
            setIsShaking(false);
            return;
        }

        let shakeTimeout: ReturnType<typeof setTimeout>;
        let shakeInterval: ReturnType<typeof setInterval>;

        const triggerShake = () => {
            setIsShaking(true);
            shakeTimeout = setTimeout(() => setIsShaking(false), 820); // Animation duration
        };
        
        const initialTimeout = setTimeout(triggerShake, 1200); // Shake once on load
        shakeInterval = setInterval(triggerShake, 8000); // Shake every 8 seconds

        return () => {
            clearTimeout(initialTimeout);
            clearTimeout(shakeTimeout);
            clearInterval(shakeInterval);
        };
    }, [userData.isSubscribed]);


    useEffect(() => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            return;
        }

        if (!waterReminders.enabled || Notification.permission !== 'granted') {
            return;
        }

        const scheduledTimers: ReturnType<typeof setTimeout>[] = [];

        waterReminders.times.forEach(time => {
            const [hour, minute] = time.split(':').map(Number);
            const now = new Date();
            const reminderDate = new Date();
            reminderDate.setHours(hour, minute, 0, 0);

            if (reminderDate > now) {
                const timeout = reminderDate.getTime() - now.getTime();
                const timerId = setTimeout(() => {
                    new Notification('Hora de beber água! 💧', {
                        body: 'Lembre-se de se manter hidratado para atingir sua meta diária.',
                        icon: '/favicon.svg' 
                    });
                }, timeout);
                scheduledTimers.push(timerId);
            }
        });
        
        return () => {
            scheduledTimers.forEach(clearTimeout);
        };
    }, [waterReminders]);

    const handleAthleteModeClick = () => {
        if (userData.isSubscribed) {
            handleChangeDietDifficulty(isAthleteMode ? 'normal' : 'athlete');
        } else {
            handlers.openSubscriptionModal();
        }
    };

    const athleteButtonText = userData.isSubscribed
        ? (isAthleteMode ? 'Modo Atleta Ativado' : 'Ativar Modo Atleta')
        : 'Desbloquear Modo Atleta';

    const LevelBadgeButton = () => {
        const xpForNextLevel = calculateXPForLevel(level);
        const xpProgress = xpForNextLevel > 0 ? (xp / xpForNextLevel) * 100 : 0;
        const radius = 19;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (xpProgress / 100) * circumference;
    
        return (
            <button
                onClick={() => setActiveView('Conquistas')}
                className="level-badge-button"
                title={`Nível ${level} - Clique para ver suas conquistas`}
                aria-label={`Nível ${level}, ${Math.floor(xp)} de ${xpForNextLevel} XP. Ver conquistas.`}
            >
                <TrophyIcon className="level-badge-icon" />
                <span className="level-badge-text">{level}</span>
                <svg className="level-badge-progress-ring" width="44" height="44" viewBox="0 0 44 44">
                    <circle
                        cx="22" cy="22" r={radius} strokeWidth="3"
                        className="stroke-slate-200"
                        fill="transparent"
                    />
                    <circle
                        cx="22" cy="22" r={radius} strokeWidth="3"
                        className="stroke-amber-400"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                    />
                </svg>
            </button>
        );
    };

  const greeting = getGreeting();

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {!userData.isSubscribed && (
        <div className="md:hidden">
            <SubscriptionCTA
                onOpenSubscriptionModal={handlers.openSubscriptionModal}
                trialEndDate={userData.trialEndDate}
            />
        </div>
      )}
      <header>
          <div className="flex justify-between items-center">
            <div className='flex items-center gap-4'>
                <div className="relative">
                    <button onClick={() => setActiveView('Conta')} className="relative group flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-full bg-brand-green-light flex items-center justify-center border-4 border-brand-green shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                        {profilePicture ? (
                            <img src={profilePicture} alt="Perfil" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <UserIcon className="w-8 h-8 md:w-10 md:h-10 text-brand-green-dark" />
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full border-2 border-brand-green shadow-md group-hover:scale-110 transition-transform duration-300 theme-athlete:bg-slate-700">
                            <EditIcon className="w-4 h-4 text-brand-green-dark" />
                        </div>
                    </button>
                </div>
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
                            {greeting.text}, {name}! <span className="text-2xl md:text-3xl">{greeting.emoji}</span>
                        </h2>
                        <LevelBadgeButton />
                    </div>
                    <p className="text-slate-500">{formatDate()}</p>
                </div>
            </div>
             <div className="hidden md:flex bg-yellow-100 text-yellow-800 text-sm font-semibold px-4 py-2 rounded-full items-center gap-2 border border-yellow-200 theme-athlete:bg-slate-700 theme-athlete:text-yellow-400 theme-athlete:border-slate-600">
                <ClockIcon className="w-4 h-4" />
                <span>Período de teste</span>
            </div>
          </div>
      </header>
      
        <button
            id="athlete-mode-toggle"
            onClick={handleAthleteModeClick}
            className={`w-full p-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3
            ${isAthleteMode
                ? 'athlete-mode-active-button'
                : 'athlete-mode-inactive-button'
            } ${isShaking ? 'shake-animation' : ''}`.trim()}
        >
            <FireIcon className="w-6 h-6" />
            <span>{athleteButtonText}</span>
        </button>


      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm font-medium">
              <h3 className="text-slate-600 flex-1">Progresso da meta de peso</h3>
              <button onClick={() => setAdjustGoalModalOpen(true)} className="text-xs font-semibold text-brand-green hover:underline">Ajustar meta</button>
              <span className="font-semibold text-slate-800 ml-4">{weight.toFixed(1)}kg <span className="text-slate-400">/ {weightGoal.toFixed(1)}kg</span></span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 theme-athlete:bg-slate-700">
              <div className="bg-brand-green h-2 rounded-full" style={{ width: `${weightProgress}%` }}></div>
          </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4 md:gap-6">
        <InfoCard
            icon={<GraphIcon className="text-brand-blue" />}
            iconBg="bg-brand-blue-light"
        >
            <h3 className="text-slate-500 font-medium text-sm md:text-base">Peso Atual</h3>
            <p className="text-2xl md:text-3xl font-bold my-1 text-slate-800">{weight.toFixed(1)} <span className="text-base md:text-xl text-slate-400">kg</span></p>
            <button onClick={() => { setNewWeight(weight.toString()); setWeightModalOpen(true); }} className="mt-3 w-full bg-brand-green hover:bg-brand-green-dark text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors">
                Registrar
            </button>
        </InfoCard>

        <InfoCard 
            icon={<WaterDropletsIcon className="text-sky-500"/>} 
            iconBg="bg-sky-100 theme-athlete:bg-opacity-20"
        >
           <div className="flex justify-between items-center mb-1">
                <h3 className="text-slate-500 font-medium text-sm md:text-base">Água</h3>
                 <button onClick={() => setWaterReminderModalOpen(true)} className="p-1 rounded-full hover:bg-gray-200 theme-athlete:hover:bg-slate-700 transition-colors -mr-2 -mt-2">
                    <BellIcon className={`w-5 h-5 ${waterReminders.enabled ? 'text-blue-500 theme-athlete:text-sky-400' : 'text-gray-400'}`} />
                </button>
            </div>
           <p className="text-2xl md:text-3xl font-bold text-slate-800">{water.toFixed(2)}<span className="text-base md:text-xl text-slate-400"> / {waterGoal.toFixed(1)}L</span></p>
           <div className="w-full bg-gray-200 theme-athlete:bg-slate-700 rounded-full h-2 mt-2">
                <div className="bg-sky-500 h-2 rounded-full" style={{width: `${waterProgress}%`}}></div>
           </div>
           <div className="flex gap-2 mt-3">
            <button onClick={() => addWater(0.250)} className="flex-1 text-xs bg-white border border-gray-300 hover:bg-gray-100 text-slate-700 font-semibold py-2 px-2 rounded-lg transition-colors theme-athlete:bg-slate-800 theme-athlete:text-slate-300 theme-athlete:hover:bg-slate-700">+250ml</button>
            <button onClick={() => addWater(0.500)} className="flex-1 text-xs bg-white border border-gray-300 hover:bg-gray-100 text-slate-700 font-semibold py-2 px-2 rounded-lg transition-colors theme-athlete:bg-slate-800 theme-athlete:text-slate-300 theme-athlete:hover:bg-slate-700">+500ml</button>
           </div>
        </InfoCard>

        <InfoCard 
            icon={<UtensilsIcon className="text-purple-600"/>} 
            iconBg="bg-purple-100"
        >
            <h3 className="text-slate-500 font-medium text-sm md:text-base">Registrar Refeição</h3>
            <p className="text-slate-400 text-sm my-1 leading-tight">Analise sua comida com IA, por texto ou foto.</p>
            <button 
                onClick={() => setMealModalOpen(true)} 
                className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
            >
                Registrar Refeição
            </button>
        </InfoCard>
        
        <InfoCard 
            icon={<FireIcon className="text-orange-500"/>} 
            iconBg="bg-orange-100"
        >
            <h3 className="text-slate-500 font-medium text-sm md:text-base">Sequência de Metas</h3>
            <p className="text-2xl md:text-3xl font-bold my-1 text-slate-800">{streak} <span className="text-base md:text-xl text-slate-400">dias</span></p>
            <button 
                onClick={handleMarkDayAsCompleted} 
                disabled={isTodayCompleted}
                className="mt-3 w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
                {isTodayCompleted ? <><CheckIcon className="w-5 h-5"/> Meta Concluída</> : 'Concluir Meta do Dia'}
            </button>
        </InfoCard>

        <InfoCard 
            icon={<FireIcon className="text-brand-orange"/>} 
            iconBg="bg-brand-orange-light"
        >
            <h3 className="text-slate-500 font-medium text-sm md:text-base">Calorias</h3>
            <p className="text-2xl md:text-3xl font-bold my-1 text-slate-800">{macros.calories.current}
                <span className="text-base md:text-xl text-slate-400"> / {macros.calories.goal}kcal</span>
            </p>
            <div className="w-full bg-gray-200 theme-athlete:bg-slate-700 rounded-full h-2 mt-2">
                <div className="bg-brand-orange h-2 rounded-full" style={{ width: `${Math.min((macros.calories.current / macros.calories.goal) * 100, 100)}%` }}></div>
            </div>
        </InfoCard>
        
        <InfoCard 
            icon={<QuestionMarkCircleIcon className="text-purple-600"/>} 
            iconBg="bg-purple-100"
        >
            <h3 className="text-slate-500 font-medium text-sm md:text-base">Ajuda & Tutorial</h3>
            <p className="text-slate-400 text-sm my-1 leading-tight">Não sabe por onde começar? Refaça nosso tour guiado.</p>
            <button 
                onClick={handlers.startTutorial} 
                className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
            >
                Iniciar Tour
            </button>
        </InfoCard>

        <InfoCard 
            icon={<CalendarIcon className="text-brand-green"/>} 
            iconBg="bg-brand-green-light"
            className="col-span-2"
        >
            <h3 className="text-slate-500 font-medium mb-3">Macronutrientes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
                <div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-slate-600">Carboidratos</span>
                        <span className="font-semibold text-slate-800">{macros.carbs.current}g / {macros.carbs.goal}g</span>
                    </div>
                    <div className="w-full bg-gray-200 theme-athlete:bg-slate-700 rounded-full h-2 mt-1"><div className="bg-sky-500 h-2 rounded-full" style={{ width: `${Math.min((macros.carbs.current / macros.carbs.goal) * 100, 100)}%` }}></div></div>
                </div>
                <div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-slate-600">Proteínas</span>
                        <span className="font-semibold text-slate-800">{macros.protein.current}g / {macros.protein.goal}g</span>
                    </div>
                    <div className="w-full bg-gray-200 theme-athlete:bg-slate-700 rounded-full h-2 mt-1"><div className="bg-emerald-500 theme-athlete:bg-red-500 h-2 rounded-full" style={{ width: `${Math.min((macros.protein.current / macros.protein.goal) * 100, 100)}%` }}></div></div>
                </div>
                <div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-slate-600">Gorduras</span>
                        <span className="font-semibold text-slate-800">{macros.fat.current}g / {macros.fat.goal}g</span>
                    </div>
                    <div className="w-full bg-gray-200 theme-athlete:bg-slate-700 rounded-full h-2 mt-1"><div className="bg-amber-500 theme-athlete:bg-yellow-500 h-2 rounded-full" style={{ width: `${Math.min((macros.fat.current / macros.fat.goal) * 100, 100)}%` }}></div></div>
                </div>
            </div>
        </InfoCard>
      </div>

        <Modal title="Registrar Novo Peso" isOpen={isWeightModalOpen} onClose={() => setWeightModalOpen(false)}>
            <form onSubmit={handleSaveWeight}>
                <label htmlFor="weight-input" className="block text-sm font-medium text-slate-700 mb-1">Novo Peso (kg)</label>
                <input
                    id="weight-input"
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-slate-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green"
                    autoFocus
                />
                <div className="mt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setWeightModalOpen(false)} className="px-4 py-2 bg-gray-200 text-slate-800 rounded-md hover:bg-gray-300 theme-athlete:bg-slate-700 theme-athlete:text-slate-300 theme-athlete:hover:bg-slate-600">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-brand-green-dark">Salvar</button>
                </div>
            </form>
        </Modal>

        {isMealModalOpen && <LogMealModal onClose={() => setMealModalOpen(false)} onLogMeal={handlers.handleLogMeal} handlers={handlers} userData={userData} />}
        
        {isWaterReminderModalOpen && <WaterReminderModal onClose={() => setWaterReminderModalOpen(false)} onSave={handleSaveWaterReminders} initialSettings={waterReminders} />}
        
        {isAdjustGoalModalOpen && <AdjustGoalModal 
                                      isOpen={isAdjustGoalModalOpen} 
                                      onClose={() => setAdjustGoalModalOpen(false)} 
                                      onSave={handleSaveNewGoal}
                                      userData={userData}
                                  />}
    </div>
  );
};

export default Dashboard;
