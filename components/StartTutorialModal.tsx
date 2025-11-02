import React from 'react';
import Modal from './Modal';
import { SparklesIcon } from './icons/SparklesIcon';

interface StartTutorialModalProps {
    isOpen: boolean;
    onStart: () => void;
    onSkip: () => void;
}

const StartTutorialModal: React.FC<StartTutorialModalProps> = ({ isOpen, onStart, onSkip }) => {
    if (!isOpen) return null;
    
    return (
        <Modal isOpen={isOpen} onClose={onSkip} title="Bem-vindo ao NutriBot Pro!">
            <div className="text-center">
                <div className="w-16 h-16 bg-brand-green-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <SparklesIcon className="w-8 h-8 text-brand-green-dark" />
                </div>
                <p className="text-slate-600 mb-6">
                    Vimos que é sua primeira vez aqui. Gostaria de um tour rápido para conhecer as principais funcionalidades?
                </p>
            </div>
            <div className="flex flex-col sm:flex-row-reverse gap-3">
                <button
                    onClick={onStart}
                    className="w-full px-4 py-2 bg-brand-green text-white font-semibold rounded-md hover:bg-brand-green-dark transition-colors"
                >
                    Sim, vamos lá!
                </button>
                <button
                    onClick={onSkip}
                    className="w-full px-4 py-2 bg-gray-200 text-slate-800 font-semibold rounded-md hover:bg-gray-300 transition-colors"
                >
                    Agora não
                </button>
            </div>
        </Modal>
    );
};

export default StartTutorialModal;
