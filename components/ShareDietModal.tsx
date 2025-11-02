import React, { FC, useState, useEffect } from 'react';
import Modal from './Modal';
import { DownloadIcon } from './icons/DownloadIcon';
import { ShareIcon } from './icons/ShareIcon';
import { DailyPlan } from '../types';

interface ShareDietModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageDataUrl: string;
  plan: DailyPlan | null;
}

const LoadingSpinner: FC<{className?: string}> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


const ShareDietModal: FC<ShareDietModalProps> = ({ isOpen, onClose, imageDataUrl, plan }) => {
    const [canShare, setCanShare] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    useEffect(() => {
        if (navigator.share) {
            setCanShare(true);
        }
    }, []);

    const handleShare = async () => {
        if (!plan || !imageDataUrl || !navigator.share) return;
        
        setIsSharing(true);
        try {
            const response = await fetch(imageDataUrl);
            const blob = await response.blob();
            const file = new File([blob], `dieta-${plan.date}.png`, { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'Meu Plano Alimentar',
                    text: `Aqui está meu plano alimentar para ${new Date(plan.date + 'T12:00:00').toLocaleDateString('pt-BR')}, gerado pelo NutriBot Pro!`,
                    files: [file],
                });
            } else {
                alert("Seu navegador não suporta o compartilhamento de arquivos. Tente baixar a imagem.");
            }
        } catch (error) {
            console.error('Erro ao compartilhar:', error);
            if ((error as Error).name !== 'AbortError') {
                 alert("Ocorreu um erro ao tentar compartilhar a imagem.");
            }
        } finally {
            setIsSharing(false);
        }
    };

    const downloadFileName = plan ? `dieta-${plan.date}.png` : 'dieta.png';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Exportar Dieta como Imagem" size="lg">
            <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 mb-6 flex justify-center">
                <img src={imageDataUrl} alt="Pré-visualização da dieta" className="max-w-full max-h-[50vh] object-contain rounded-md shadow-md" />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
                <a
                    href={imageDataUrl}
                    download={downloadFileName}
                    className="w-full flex-1 px-4 py-3 bg-slate-700 text-white font-semibold rounded-md hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                    <DownloadIcon className="w-5 h-5" />
                    Baixar Imagem
                </a>
                {canShare && (
                    <button
                        onClick={handleShare}
                        disabled={isSharing}
                        className="w-full flex-1 px-4 py-3 bg-brand-green text-white font-semibold rounded-md hover:bg-brand-green-dark transition-colors flex items-center justify-center gap-2 disabled:bg-slate-400"
                    >
                       {isSharing ? <LoadingSpinner className="w-5 h-5" /> : <ShareIcon className="w-5 h-5" />}
                        {isSharing ? 'Compartilhando...' : 'Compartilhar'}
                    </button>
                )}
            </div>
        </Modal>
    );
};

export default ShareDietModal;
