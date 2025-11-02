


import React, { FC, useState } from 'react';
import { UserData, UserDataHandlers, View, PlanKey, DailyUsage, WeeklyUsage } from '../types';
import { PLANS } from '../constants/plans';
import { CheckIcon, SparklesIcon, ChevronLeftIcon, XIcon } from './icons';

interface ManageSubscriptionViewProps {
    userData: UserData;
    handlers: UserDataHandlers;
    setActiveView: (view: View) => void;
}

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

const PlanCard: FC<{
    planKey: PlanKey;
    billingCycle: 'monthly' | 'annual';
    isActivePlan: boolean;
    isSubscribed: boolean;
    onSelectPlan: (plan: PlanKey) => void;
    currentUserPlan: PlanKey | null;
}> = ({ planKey, billingCycle, isActivePlan, isSubscribed, onSelectPlan, currentUserPlan }) => {
    const plan = PLANS[planKey];
    
    let buttonText = '';
    let buttonAction = () => onSelectPlan(planKey);
    let buttonClasses = 'bg-brand-green hover:bg-brand-green-dark text-white';
    
    const planOrder: Record<PlanKey, number> = { basic: 1, pro: 2, premium: 3 };
    
    if (isActivePlan) {
        buttonText = 'Seu Plano Atual';
        buttonClasses = 'bg-slate-200 text-slate-600 cursor-default';
        buttonAction = () => {};
    } else if (isSubscribed && currentUserPlan) {
        if (planOrder[planKey] > planOrder[currentUserPlan]) {
            buttonText = 'Fazer Upgrade';
        } else {
            buttonText = 'Fazer Downgrade';
            buttonClasses = 'bg-slate-500 hover:bg-slate-600 text-white';
        }
    } else {
        buttonText = 'Assinar este Plano';
    }

    return (
        <div className={`relative p-5 border-2 rounded-xl flex flex-col transition-all h-full ${
            isActivePlan ? 'bg-brand-green-light border-brand-green shadow-lg' : 'bg-white border-slate-200'
        }`}>
            {plan.recommended && !isActivePlan && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><SparklesIcon className="w-4 h-4"/> POPULAR</div>}
            <h3 className="font-bold text-xl text-slate-800">{plan.name}</h3>
            <p className="text-3xl font-bold text-slate-900 my-2">R$ {plan.price[billingCycle].toFixed(2)}<span className="text-base font-normal text-slate-500">/{billingCycle === 'monthly' ? 'mês' : 'ano'}</span></p>
            <button
                onClick={buttonAction}
                className={`w-full mt-4 mb-5 py-2.5 rounded-lg font-semibold transition-colors ${buttonClasses}`}
            >
                {buttonText}
            </button>
            <ul className="space-y-2 flex-grow">
                {plan.features.map((feature: any, index: number) => (
                    <FeatureCheck key={index} feature={feature} />
                ))}
            </ul>
        </div>
    );
};

const ResourceStatus: FC<{ userData: UserData }> = ({ userData }) => {
  const isTrial = !userData.isSubscribed && new Date(userData.trialEndDate) > new Date();
  
  const planKey = isTrial ? 'pro' : (userData.isSubscribed && userData.currentPlan ? userData.currentPlan : 'basic');
  const currentPlanDetails = PLANS[planKey];

  if (!currentPlanDetails) return null;

  const planName = isTrial ? 'Plano de Teste (Pro)' : currentPlanDetails.name;

  const getUsage = (feature: any): number => {
    const key = feature.key;
    if (feature.period === 'week') {
      return (userData.weeklyUsage[key as keyof WeeklyUsage] as number) || 0;
    }
    // Default to daily
    return (userData.dailyUsage[key as keyof DailyUsage] as number) || 0;
  };
  
  const trackableFeatures = currentPlanDetails.features.filter((f: any) => f.limit !== undefined && f.available !== false);

  if (trackableFeatures.length === 0) return null;

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="font-bold text-lg text-slate-800 mb-4">Status de Uso - {planName}</h3>
      <div className="space-y-4">
        {trackableFeatures.map((feature: any) => {
          const usage = getUsage(feature);
          const limit = feature.limit;
          const percentage = (limit && limit !== Infinity) ? Math.min((usage / limit) * 100, 100) : (usage > 0 ? 100 : 0);
          const unit = feature.value.split('/')[1] || '';

          return (
            <div key={feature.key}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium text-slate-600">{feature.text}</span>
                <span className="text-sm font-semibold text-slate-800">
                  {limit !== Infinity ? `${usage} / ${limit}` : 'Ilimitado'}
                  <span className="text-xs text-slate-500 ml-1">{unit && `/${unit}`}</span>
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-brand-green h-2 rounded-full transition-all" 
                  style={{ width: `${percentage}%`}}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


const ManageSubscriptionView: FC<ManageSubscriptionViewProps> = ({ userData, handlers, setActiveView }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(userData.billingCycle || 'annual');

    const handleSelectPlan = (newPlan: PlanKey) => {
        if (userData.isSubscribed && userData.currentPlan) {
            const planOrder: Record<PlanKey, number> = { basic: 1, pro: 2, premium: 3 };
            const action = planOrder[newPlan] > planOrder[userData.currentPlan] ? 'upgrade' : 'downgrade';
            if (window.confirm(`Tem certeza que deseja fazer o ${action} para o plano ${PLANS[newPlan].name}?`)) {
                handlers.handleChangeSubscription(newPlan);
            }
        } else {
            // This case shouldn't happen often here, but as a fallback, open the subscription modal
            handlers.openSubscriptionModal();
        }
    };
    
    const handleCancel = () => {
        if (window.confirm("Tem certeza que deseja cancelar sua assinatura? Você perderá acesso aos recursos Pro ao final do seu ciclo de faturamento.")) {
            handlers.handleCancelSubscription();
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <header className="flex items-center gap-4">
                <button onClick={() => setActiveView('Conta')} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <ChevronLeftIcon className="w-6 h-6 text-slate-600"/>
                </button>
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Planos e Uso</h2>
                    <p className="text-slate-500">Altere seu plano ou cancele sua assinatura a qualquer momento.</p>
                </div>
            </header>
            
            <ResourceStatus userData={userData} />

            <div className="flex justify-center items-center gap-4 pt-4">
                <span className={`font-semibold ${billingCycle === 'monthly' ? 'text-slate-800' : 'text-slate-400'}`}>Mensal</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={billingCycle === 'annual'} onChange={() => setBillingCycle(p => p === 'monthly' ? 'annual' : 'monthly')} />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-green"></div>
                </label>
                <span className={`font-semibold ${billingCycle === 'annual' ? 'text-slate-800' : 'text-slate-400'}`}>Anual</span>
                <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">ECONOMIZE 20%</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(Object.keys(PLANS) as PlanKey[]).map(key => (
                    <PlanCard 
                        key={key} 
                        planKey={key} 
                        billingCycle={billingCycle} 
                        isActivePlan={userData.isSubscribed && userData.currentPlan === key}
                        isSubscribed={userData.isSubscribed}
                        onSelectPlan={handleSelectPlan}
                        currentUserPlan={userData.currentPlan}
                    />
                ))}
            </div>

            {userData.isSubscribed && (
                 <div className="text-center mt-8 pt-6 border-t border-slate-200">
                    <button
                        onClick={handleCancel}
                        className="text-red-600 font-semibold hover:text-red-800 hover:underline transition-colors"
                    >
                        Cancelar minha assinatura
                    </button>
                    <p className="text-xs text-slate-400 mt-2">O cancelamento entrará em vigor ao final do ciclo de faturamento atual.</p>
                </div>
            )}
        </div>
    );
};

export default ManageSubscriptionView;
