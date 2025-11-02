

import React, { FC } from 'react';
import { renderToString } from 'react-dom/server';
import Modal from './Modal';
import { Achievement, UserData, UserDataHandlers } from '../types';
import { PinIcon } from './icons/PinIcon';
import { ShareIcon } from './icons/ShareIcon';
import { CheckIcon } from './icons/CheckIcon';

interface AchievementDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    achievement: Achievement;
    userData: UserData;
    handlers: UserDataHandlers;
    isUnlocked: boolean;
}

const AchievementDetailModal: FC<AchievementDetailModalProps> = ({ isOpen, onClose, achievement, userData, handlers, isUnlocked }) => {
    
    const isFeatured = userData.featuredAchievementId === achievement.id;

    const handleFeatureClick = () => {
        if (!isUnlocked) return;
        handlers.setFeaturedAchievement(isFeatured ? null : achievement.id);
        onClose();
    };
    
    const handleShare = async () => {
        if (!isUnlocked) return;
    
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
    
        input.onchange = async (e) => {
            const target = e.target as HTMLInputElement;
            if (!target.files || target.files.length === 0) return;
    
            const file = target.files[0];
            const reader = new FileReader();
    
            reader.onload = async (event) => {
                const userImageSrc = event.target?.result as string;
                if (!userImageSrc) {
                    alert('Não foi possível carregar a imagem selecionada.');
                    return;
                }
    
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    alert('Seu navegador não suporta a criação de imagens.');
                    return;
                }
    
                const userImage = new Image();
                userImage.crossOrigin = 'anonymous';
                try {
                    await new Promise((resolve, reject) => {
                        userImage.onload = resolve;
                        userImage.onerror = reject;
                        userImage.src = userImageSrc;
                    });
                } catch (err) {
                    alert('Erro ao carregar sua foto.');
                    console.error(err);
                    return;
                }
    
                // Setup canvas
                canvas.width = userImage.width;
                canvas.height = userImage.height;
                ctx.drawImage(userImage, 0, 0, canvas.width, canvas.height);
    
                const baseSize = Math.min(canvas.width, canvas.height);
                
                // --- Draw Plaque ---
                const plaqueHeight = baseSize * 0.20;
                const plaqueY = canvas.height - plaqueHeight;
    
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.shadowColor = 'rgba(0,0,0,0.1)';
                ctx.shadowBlur = 15;
                ctx.fillRect(0, plaqueY, canvas.width, plaqueHeight);
                ctx.shadowColor = 'transparent';
    
                // --- Draw Seal on Plaque ---
                const sealRadius = plaqueHeight * 0.38;
                const sealPadding = plaqueHeight * 0.12;
                const sealX = sealRadius + sealPadding;
                const sealY = plaqueY + plaqueHeight / 2;
    
                const sealGradient = ctx.createRadialGradient(sealX + sealRadius * 0.3, sealY - sealRadius * 0.3, 0, sealX, sealY, sealRadius * 1.5);
                sealGradient.addColorStop(0, '#fefce8');
                sealGradient.addColorStop(1, '#facc15');
                ctx.beginPath();
                ctx.arc(sealX, sealY, sealRadius, 0, Math.PI * 2);
                ctx.fillStyle = sealGradient;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(sealX, sealY, sealRadius, 0, Math.PI * 2);
                ctx.strokeStyle = '#eab308';
                ctx.lineWidth = sealRadius * 0.08;
                ctx.stroke();
    
                try {
                    const IconComponent = achievement.icon;
                    const iconSize = sealRadius * 1.05;
                    const svgString = renderToString(React.createElement(IconComponent, { width: iconSize, height: iconSize, color: '#a16207' }));

                    if (!svgString) throw new Error("Could not render icon to SVG string.");
    
                    const iconImage = new Image();
                    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                    const url = URL.createObjectURL(svgBlob);
                    
                    await new Promise<void>((resolve, reject) => {
                        iconImage.onload = () => {
                            ctx.drawImage(iconImage, sealX - iconSize / 2, sealY - iconSize / 2, iconSize, iconSize);
                            URL.revokeObjectURL(url);
                            resolve();
                        };
                        iconImage.onerror = (err) => {
                             URL.revokeObjectURL(url);
                             reject(err);
                        };
                        iconImage.src = url;
                    });
                } catch (e) { 
                    console.error("Failed to render icon on canvas", e); 
                }
                
                // --- Draw Text on Plaque ---
                const textX = sealX + sealRadius + sealPadding;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                const sansSerifFont = "'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif";
    
                const titleFontSize = Math.max(14, plaqueHeight * 0.19);
                ctx.font = `bold ${titleFontSize}px ${sansSerifFont}`;
                ctx.fillStyle = '#1e293b';
                ctx.fillText(achievement.title, textX, plaqueY + plaqueHeight * 0.35);
    
                const levelFontSize = Math.max(12, plaqueHeight * 0.15);
                ctx.font = `normal ${levelFontSize}px ${sansSerifFont}`;
                ctx.fillStyle = '#475569';
                ctx.fillText(`Nível ${userData.level}`, textX, plaqueY + plaqueHeight * 0.65);
    
                // --- Draw Logo ---
                const logoFontSize = Math.max(12, plaqueHeight * 0.14);
                ctx.font = `bold ${logoFontSize}px ${sansSerifFont}`;
                ctx.textAlign = 'right';
                ctx.fillStyle = '#475569';
                ctx.fillText('NutriBot Pro 🥑', canvas.width - sealPadding, plaqueY + plaqueHeight / 2);
    
                // --- Share Logic ---
                try {
                    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
                    if (!blob) throw new Error("Canvas toBlob failed");
                    const file = new File([blob], 'conquista_nutribot.jpg', { type: 'image/jpeg' });
    
                    if (navigator.share && navigator.canShare({ files: [file] })) {
                        await navigator.share({ files: [file] });
                    } else {
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = 'conquista_nutribot.jpg';
                        link.click();
                        URL.revokeObjectURL(link.href);
                    }
                } catch (err) {
                    console.error("Error sharing:", err);
                    const link = document.createElement('a');
                    link.href = canvas.toDataURL('image/jpeg', 0.9);
                    link.download = 'conquista_nutribot.jpg';
                    link.click();
                }
            };
            reader.readAsDataURL(file);
        };
        input.click();
    };


    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Detalhes da Conquista" size="lg">
            <div className="flex flex-col items-center text-center">
                <div className={`relative mb-6`}>
                    <div className={`achievement-seal-icon-wrapper ${isUnlocked ? 'unlocked' : 'locked'}`} style={{position: 'relative', top: 'auto', left: 'auto', transform: 'none', width: '100px', height: '100px'}}>
                        {React.createElement(achievement.icon, { className: 'w-12 h-12 icon' })}
                    </div>
                </div>

                <h3 className="text-2xl font-bold text-slate-800">{achievement.title}</h3>
                <p className="text-slate-500 mt-2 max-w-md">{achievement.description}</p>
                
                {isUnlocked && (
                    <div className="mt-8 pt-6 border-t border-gray-200 w-full flex flex-col sm:flex-row justify-center gap-3">
                        <button
                            onClick={handleFeatureClick}
                            className={`px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors border w-full sm:w-auto ${
                                isFeatured 
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                            }`}
                        >
                            {isFeatured ? <CheckIcon className="w-5 h-5"/> : <PinIcon className="w-5 h-5"/>}
                            {isFeatured ? 'Destaque no Perfil' : 'Destacar no Perfil'}
                        </button>
                        <button
                            onClick={handleShare}
                            className="px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors bg-blue-500 text-white hover:bg-blue-600 w-full sm:w-auto"
                        >
                            <ShareIcon className="w-5 h-5"/>
                            Compartilhar
                        </button>
                    </div>
                )}
                 {!isUnlocked && (
                     <div className="mt-6 bg-slate-100 text-slate-600 p-3 rounded-lg text-sm w-full">
                        Continue usando o app para desbloquear esta conquista e poder compartilhá-la!
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AchievementDetailModal;