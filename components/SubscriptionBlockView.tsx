

import React, { FC } from 'react';
import { BowlIcon } from './icons/BowlIcon';
import { CheckIcon } from './icons/CheckIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface SubscriptionBlockViewProps {
    onOpenSubscriptionModal: () => void;
}

const FeatureListItem: FC<{ children: React.ReactNode }> = ({ children }) => (
    <li className="flex items-start gap-3 text-left">
        <div className="w-5 h-5 flex-shrink-0 bg-teal-400 rounded-full flex items-center justify-center mt-0.5">
            <CheckIcon className="w-3 h-3 text-white" />
        </div>
        <span className="text-slate-300">{children}</span>
    </li>
);

const SubscriptionBlockView: FC<SubscriptionBlockViewProps> = ({ onOpenSubscriptionModal }) => {
    return (
        <div className="w-full h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-brand-green p-2 rounded-full">
                    <BowlIcon className="w-6 h-6 text-white" />
                </div>
                <h1 className="font-bold text-xl">NutriBot Pro</h1>
            </div>

            <div className="w-full max-w-md text-center bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-2xl shadow-2xl">
                <SparklesIcon className="w-12 h-12 text-yellow-300 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">Seu teste acabou!</h2>
                <p className="text-slate-400 mb-6">
                    Continue sua jornada para uma vida mais saudável com acesso ilimitado a todos os recursos.
                </p>

                <div className="bg-slate-900/50 p-6 rounded-lg text-left mb-8 border border-slate-700">
                    <h3 className="font-semibold text-lg mb-4 text-white">Com o NutriBot Pro, você tem:</h3>
                    <ul className="space-y-3">
                        <FeatureListItem><strong>Dietas Inteligentes Ilimitadas:</strong> Planos sempre novos, adaptados a você.</FeatureListItem>
                        <FeatureListItem><strong>Modo Atleta de Alta Performance:</strong> Maximize seus resultados com dietas focadas.</FeatureListItem>
                        <FeatureListItem><strong>Análise Completa de Refeições:</strong> Registre por foto ou texto, sem limites.</FeatureListItem>
                        <FeatureListItem><strong>Insights e Análise de Progresso:</strong> Entenda sua evolução com a ajuda da IA.</FeatureListItem>
                        <FeatureListItem><strong>Universo de Receitas:</strong> Busque, crie e visualize pratos com IA.</FeatureListItem>
                    </ul>
                </div>

                <button
                    onClick={onOpenSubscriptionModal}
                    className="w-full bg-gradient-to-r from-brand-green to-teal-500 text-white font-bold py-3 px-6 rounded-lg text-lg hover:opacity-90 transition-opacity shadow-[0_5px_20px_rgba(0,184,148,0.3)]"
                >
                    Assinar Agora
                </button>
                 <button
                    onClick={() => {
                        localStorage.clear();
                        window.location.reload();
                    }}
                    className="mt-4 text-slate-500 text-sm hover:text-white transition-colors"
                >
                    Sair e registrar nova conta
                </button>
            </div>
        </div>
    );
};

export default SubscriptionBlockView;
