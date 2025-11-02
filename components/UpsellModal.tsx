import React from 'react';
import Modal from './Modal';
import { ALL_FEATURES } from '../constants/plans';
import { SparklesIcon } from './icons/SparklesIcon';

interface UpsellModalProps {
    isOpen: boolean;
    onClose: () => void;
    featureKey: string | null;
    featureText: string | null;
    onNavigateToSubscription: () => void;
    onPurchaseFeaturePack: (featureKey: string, packSize: number, price: number) => void;
}

const UpsellModal: React.FC<UpsellModalProps> = ({ isOpen, onClose, featureKey, featureText, onNavigateToSubscription, onPurchaseFeaturePack }) => {
    if (!isOpen || !featureKey || !featureText) return null;

    const featureDetails = (ALL_FEATURES as any)[featureKey];
    const canPurchaseAlaCarte = featureDetails && featureDetails.aLaCartePrice > 0;

    const handlePurchase = () => {
        if (canPurchaseAlaCarte) {
            onPurchaseFeaturePack(featureKey, featureDetails.aLaCartePackSize, featureDetails.aLaCartePrice);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Limite Atingido!"
            size="lg"
        >
            <div className="text-center">
                <div className="w-16 h-16 bg-brand-orange-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <SparklesIcon className="w-8 h-8 text-brand-orange" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Você usou todo o seu limite de "{featureText}".</h3>
                <p className="text-slate-600 my-4">
                    Para continuar usando este recurso, você pode fazer um upgrade para um plano superior com mais benefícios ou comprar um pacote de usos avulsos.
                </p>
            </div>
            <div className="flex flex-col gap-3 mt-6">
                <button
                    onClick={onNavigateToSubscription}
                    className="w-full px-4 py-3 bg-brand-green text-white font-semibold rounded-md hover:bg-brand-green-dark transition-colors"
                >
                    Ver Planos e Fazer Upgrade
                </button>
                {canPurchaseAlaCarte && (
                    <button
                        onClick={handlePurchase}
                        className="w-full px-4 py-3 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition-colors"
                    >
                        Comprar {featureDetails.aLaCartePackSize} usos por R${featureDetails.aLaCartePrice.toFixed(2)}
                    </button>
                )}
            </div>
        </Modal>
    );
};

export default UpsellModal;
