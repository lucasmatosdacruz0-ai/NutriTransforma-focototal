import React from 'react';
import { View, UserData } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { ChatIcon } from './icons/ChatIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { ChartIcon } from './icons/ChartIcon';
import { StarIcon } from './icons/StarIcon';
import { UserIcon } from './icons/UserIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import AdminAccessSection from './AdminAccessSection';
import { TrophyIcon } from './icons/TrophyIcon';
// FIX: Import TargetIcon
import { TargetIcon } from './icons/TargetIcon';

interface FeaturesViewProps {
    setActiveView: (view: View) => void;
    userData: UserData;
}

const FeatureCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    iconBgColor: string;
}> = ({ icon, title, description, onClick, iconBgColor }) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-lg transition-shadow">
        <div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBgColor} mb-4`}>
                {icon}
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-2">{title}</h3>
            <p className="text-slate-500 text-sm mb-4 leading-relaxed">{description}</p>
        </div>
        <button
            onClick={onClick}
            className="w-full mt-auto bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
        >
            Acessar <ChevronRightIcon className="w-4 h-4" />
        </button>
    </div>
);

const FeaturesView: React.FC<FeaturesViewProps> = ({ setActiveView, userData }) => {
    const features = [
        {
            title: 'Minha Conta',
            description: 'Edite seus dados, metas e gerencie sua conta e assinatura Pro.',
            icon: <UserIcon className="w-6 h-6 text-indigo-600" />,
            iconBgColor: 'bg-indigo-100',
            view: 'Conta' as View
        },
        {
            title: 'Dashboard',
            description: 'Sua visão geral diária de progresso, macros e consumo de água.',
            icon: <HomeIcon className="w-6 h-6 text-brand-green" />,
            iconBgColor: 'bg-brand-green-light',
            view: 'Dashboard' as View
        },
        {
            title: 'Chat com IA',
            description: 'Converse com seu nutricionista IA para tirar dúvidas e obter dicas.',
            icon: <ChatIcon className="w-6 h-6 text-blue-500" />,
            iconBgColor: 'bg-blue-100',
            view: 'Chat IA' as View
        },
        {
            title: 'Dieta',
            description: 'Visualize e gerencie sua dieta semanal e diária.',
            icon: <CalendarIcon className="w-6 h-6 text-red-500" />,
            iconBgColor: 'bg-red-100',
            view: 'Dieta' as View
        },
        {
            title: 'Explorador de Receitas',
            description: 'Busque receitas com IA e visualize pratos com imagens geradas sob demanda.',
            icon: <BookOpenIcon className="w-6 h-6 text-pink-500" />,
            iconBgColor: 'bg-pink-100',
            view: 'Receitas' as View
        },
        {
            title: 'Conquistas',
            description: 'Desbloqueie conquistas, acompanhe seu progresso e mantenha-se motivado.',
            icon: <TrophyIcon className="w-6 h-6 text-amber-500" />,
            iconBgColor: 'bg-amber-100',
            view: 'Conquistas' as View
        },
        {
            title: 'Planos Favoritos',
            description: 'Acesse seus planos diários salvos para reutilizá-los quando quiser.',
            icon: <StarIcon className="w-6 h-6 text-yellow-500" />,
            iconBgColor: 'bg-yellow-100',
            view: 'Favoritos' as View
        },
        {
            title: 'Acompanhar Progresso',
            description: 'Veja gráficos e relatórios sobre a sua evolução de peso e metas.',
            icon: <ChartIcon className="w-6 h-6 text-purple-600" />,
            iconBgColor: 'bg-purple-100',
            view: 'Progresso' as View
        },
        // FIX: Add Foco Total feature card
        {
            title: 'Foco Total',
            description: 'Acesse um aplicativo de produtividade para gerenciar tarefas e melhorar seu foco, integrado diretamente no NutriBot.',
            icon: <TargetIcon className="w-6 h-6 text-blue-600" />,
            iconBgColor: 'bg-blue-100',
            view: 'Foco Total' as View
        },
    ];

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Recursos</h2>
                <p className="text-slate-500">Explore tudo o que o NutriBot Pro pode fazer por você.</p>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.sort((a,b) => a.title.localeCompare(b.title)).map(feature => (
                    <FeatureCard
                        key={feature.title}
                        title={feature.title}
                        description={feature.description}
                        icon={feature.icon}
                        iconBgColor={feature.iconBgColor}
                        onClick={() => setActiveView(feature.view)}
                    />
                ))}
            </div>
            <AdminAccessSection setActiveView={setActiveView} userData={userData} />
        </div>
    );
};

export default FeaturesView;
