
import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';

interface SubscriptionCTAProps {
  onOpenSubscriptionModal: () => void;
  trialEndDate: string;
  className?: string;
}

const SubscriptionCTA: React.FC<SubscriptionCTAProps> = ({ onOpenSubscriptionModal, trialEndDate, className = '' }) => {
  const trialDaysRemaining = Math.max(0, Math.ceil((new Date(trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className={`bg-gradient-to-tr from-brand-green to-teal-500 rounded-lg p-5 text-white text-center ${className}`}>
        <SparklesIcon className="w-8 h-8 mx-auto mb-3" />
        <h3 className="font-bold text-lg">Atualize para o Pro</h3>
        <p className="text-sm opacity-90 mb-4">
            {trialDaysRemaining > 0
                ? `Você tem ${trialDaysRemaining} dias de teste restantes.`
                : 'Seu período de teste acabou.'
            }
        </p>
        <button 
            onClick={onOpenSubscriptionModal} 
            className="w-full bg-white text-brand-green font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all"
        >
            Fazer Upgrade
        </button>
    </div>
  );
};

export default SubscriptionCTA;
