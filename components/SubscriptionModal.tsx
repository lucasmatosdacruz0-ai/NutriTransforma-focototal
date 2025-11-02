

import React from 'react';
import { useState, FC } from 'react';
import Modal from './Modal';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { PlanKey } from '../types';
import { PLANS } from '../constants/plans';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubscribe: (plan: PlanKey, billingCycle: 'monthly' | 'annual') => void;
    theme: 'theme-light' | 'theme-athlete';
}

const LoadingSpinner: React.FC<{className?: string}> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const CheckoutForm: React.FC<{ onSubscribe: () => void; price: number; planName: string; billingCycle: 'monthly' | 'annual' }> = ({ onSubscribe, price, planName, billingCycle }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleSimulatedPayment = () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            onSubscribe();
        }, 1500);
    }
    
    const inputStyle = "w-full bg-slate-100 border border-slate-300 rounded-md p-3 text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-brand-green focus:outline-none transition-shadow";
    const billingText = billingCycle === 'annual' ? '/ano' : '/mês';

    return (
        <div id="payment-form" className="mt-6 pt-6 border-t border-slate-200">
            <h3 className="font-bold text-lg text-slate-800 mb-4">Pagamento</h3>
            <div className="space-y-4">
                 <div>
                    <label className="text-sm font-medium text-slate-600">Número do Cartão</label>
                    <input type="text" className={inputStyle} placeholder="•••• •••• •••• 4242" disabled readOnly/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-slate-600">Validade</label>
                        <input type="text" className={inputStyle} placeholder="MM / AA" disabled readOnly/>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600">CVC</label>
                        <input type="text" className={inputStyle} placeholder="•••" disabled readOnly/>
                    </div>
                </div>
                <div>
                     <p className="text-xs text-center text-slate-400 mt-2">Este é um formulário de demonstração. Nenhum dado real é coletado.</p>
                </div>
            </div>
            <button
                onClick={handleSimulatedPayment}
                type="button" 
                disabled={isLoading}
                className="w-full mt-6 bg-brand-green text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-brand-green-dark transition-all shadow-[0_4px_15px_rgba(0,184,148,0.3)] disabled:bg-slate-400 disabled:cursor-wait"
            >
                {isLoading ? <LoadingSpinner className="w-6 h-6 mx-auto" /> : `Pagar R$ ${price.toFixed(2)}${billingText} e Assinar`}
            </button>
        </div>
    );
};

const FeatureCheck: FC<{ feature: { text: string; value?: string; available?: boolean } }> = ({ feature }) => (
    <li className="flex items-start gap-3">
        {feature.available === false ? (
            <div className="w-5 h-5 flex-shrink-0 bg-slate-200 rounded-full flex items-center justify-center mt-0.5"><XIcon className="w-3 h-3 text-slate-500" /></div>
        ) : (
             <div className="w-5 h-5 flex-shrink-0 bg-brand-green rounded-full flex items-center justify-center mt-0.5"><CheckIcon className="w-3 h-3 text-white" /></div>
        )}
        <p className={`text-sm ${feature.available === false ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
            {feature.text}
            {feature.value && <strong className="ml-1 text-slate-700">{feature.value}</strong>}
        </p>
    </li>
);


const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, onSubscribe }) => {
    const [selectedPackage, setSelectedPackage] = useState<PlanKey>('pro');
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

    const currentPrice = PLANS[selectedPackage].price[billingCycle];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="" size="4xl">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-x-8 -m-5">
                <div className="lg:col-span-2 bg-slate-800 text-white p-8 rounded-l-xl hidden lg:flex flex-col">
                    <SparklesIcon className="w-10 h-10 text-yellow-300 mb-4" />
                    <h2 className="text-3xl font-bold mb-3">Eleve sua Jornada ao Nível Pro.</h2>
                    <p className="text-slate-300 mb-6 flex-grow">Desbloqueie todo o potencial do NutriBot e alcance seus objetivos mais rápido com recursos exclusivos.</p>
                    <div className="space-y-4">
                        <FeatureCheck feature={{ text: 'Dietas Ilimitadas e Inteligentes', available: true }}/>
                        <FeatureCheck feature={{ text: 'Performance Máxima com Modo Atleta', available: true }}/>
                        <FeatureCheck feature={{ text: 'Visão 360° da sua Saúde e Progresso', available: true }}/>
                        <FeatureCheck feature={{ text: 'Inspiração Culinária Infinita', available: true }}/>
                    </div>
                </div>

                <div className="lg:col-span-3 p-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Escolha seu plano</h2>
                    <div className="flex justify-center items-center gap-4 mb-6">
                        <span className={`font-semibold ${billingCycle === 'monthly' ? 'text-slate-800' : 'text-slate-400'}`}>Mensal</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={billingCycle === 'annual'} onChange={() => setBillingCycle(p => p === 'monthly' ? 'annual' : 'monthly')} />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green"></div>
                        </label>
                        <span className={`font-semibold ${billingCycle === 'annual' ? 'text-slate-800' : 'text-slate-400'}`}>Anual</span>
                        <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">ECONOMIZE 20%</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {(Object.keys(PLANS) as PlanKey[]).map(key => {
                            const plan = PLANS[key];
                            const isSelected = selectedPackage === key;
                            return (
                                <div
                                    key={key}
                                    onClick={() => setSelectedPackage(key)}
                                    className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all flex items-center gap-4 ${
                                        isSelected ? 'bg-brand-green-light border-brand-green shadow-md' : 'bg-white border-slate-200 hover:border-brand-green/50'
                                    }`}
                                >
                                    <div className="w-5 h-5 flex-shrink-0 border-2 rounded-full flex items-center justify-center transition-colors_duration-300 ${isSelected ? 'bg-brand-green border-brand-green' : 'border-slate-300'}">
                                       {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">{plan.name}</h3>
                                        <p className="text-sm text-slate-500">{plan.description}</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="font-bold text-slate-900">R$ {plan.price[billingCycle].toFixed(2)}</p>
                                        <p className="text-xs text-slate-500">/{billingCycle === 'monthly' ? 'mês' : 'ano'}</p>
                                    </div>
                                    {plan.recommended && <div className="absolute -top-3 left-6 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><SparklesIcon className="w-4 h-4"/> POPULAR</div>}
                                </div>
                            );
                        })}
                    </div>
                    
                    <CheckoutForm 
                        onSubscribe={() => onSubscribe(selectedPackage, billingCycle)} 
                        price={currentPrice}
                        planName={PLANS[selectedPackage].name}
                        billingCycle={billingCycle}
                    />
                     <p className="text-xs text-slate-400 text-center mt-3">Pagamento 100% seguro. Cancele quando quiser.</p>
                </div>
            </div>
        </Modal>
    );
};

export default SubscriptionModal;