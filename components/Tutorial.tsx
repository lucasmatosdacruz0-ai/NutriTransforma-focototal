import React, { useState, useEffect, FC } from 'react';
import { TUTORIAL_STEPS } from '../constants/tutorialSteps';

interface TutorialProps {
    isActive: boolean;
    stepIndex: number;
    onNext: () => void;
    onPrev: () => void;
    onSkip: () => void;
    isMobile: boolean;
}

interface HighlightStyle {
    top: number;
    left: number;
    width: number;
    height: number;
}

const Tutorial: FC<TutorialProps> = ({ isActive, stepIndex, onNext, onPrev, onSkip, isMobile }) => {
    const [highlightStyle, setHighlightStyle] = useState<HighlightStyle | null>(null);
    const [dialogStyle, setDialogStyle] = useState<React.CSSProperties>({});
    const [isDialogVisible, setIsDialogVisible] = useState(false);

    const step = TUTORIAL_STEPS[stepIndex];

    useEffect(() => {
        if (!isActive || !step) return;

        const positionDialog = (rect: HighlightStyle | null, position = 'bottom') => {
            const newDialogStyle: React.CSSProperties = {};
            const margin = 20;

            if (!rect || position === 'center') {
                newDialogStyle.top = '50%';
                newDialogStyle.left = '50%';
                newDialogStyle.transform = 'translate(-50%, -50%)';
            } else {
                let finalPosition = position;
                const dialogHeight = 220; // Estimated dialog height
                const dialogWidth = 380; // From CSS max-width

                // On mobile, check if the dialog would go off-screen and flip its position if needed.
                if (isMobile) {
                    if (position === 'top' && (rect.top - dialogHeight - margin) < 0) {
                        finalPosition = 'bottom';
                    }
                    if (position === 'bottom' && (rect.top + rect.height + dialogHeight + margin) > window.innerHeight) {
                        finalPosition = 'top';
                    }
                     if (position === 'left' && (rect.left - dialogWidth - margin) < 0) {
                        finalPosition = 'right';
                    }
                    if (position === 'right' && (rect.left + rect.width + dialogWidth + margin) > window.innerWidth) {
                        finalPosition = 'left';
                    }
                }
                
                switch (finalPosition) {
                    case 'top':
                        newDialogStyle.top = `${rect.top - margin}px`;
                        newDialogStyle.left = `${rect.left + rect.width / 2}px`;
                        newDialogStyle.transform = 'translate(-50%, -100%)';
                        break;
                    case 'left':
                        newDialogStyle.top = `${rect.top + rect.height / 2}px`;
                        newDialogStyle.left = `${rect.left - margin}px`;
                        newDialogStyle.transform = 'translate(-100%, -50%)';
                        break;
                    case 'right':
                         newDialogStyle.top = `${rect.top + rect.height / 2}px`;
                        newDialogStyle.left = `${rect.left + rect.width + margin}px`;
                        newDialogStyle.transform = 'translate(0, -50%)';
                        break;
                    case 'bottom':
                    default:
                        newDialogStyle.top = `${rect.top + rect.height + margin}px`;
                        newDialogStyle.left = `${rect.left + rect.width / 2}px`;
                        newDialogStyle.transform = 'translate(-50%, 0)';
                        break;
                }
            }

            setDialogStyle(newDialogStyle);
            setTimeout(() => setIsDialogVisible(true), 100);
        };

        const updatePosition = () => {
            const currentStep = { ...step };
            const isNavStep = currentStep.elementId === 'sidebar-nav';
            const elementId = isNavStep && isMobile ? 'bottom-nav' : currentStep.elementId;
            
            // DYNAMIC POSITION OVERRIDES FOR MOBILE
            if (isMobile) {
                if (isNavStep) {
                    currentStep.position = 'top';
                }
                if (currentStep.elementId === 'edit-profile-button') {
                    currentStep.position = 'bottom';
                }
            }
            
            setIsDialogVisible(false);

            const element = document.getElementById(elementId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }

            // Timeout to allow for scrolling and view changes before measuring
            setTimeout(() => {
                const targetElement = document.getElementById(elementId);
                if (targetElement) {
                    const rect = targetElement.getBoundingClientRect();
                    const padding = 10;
                    const newHighlightStyle = {
                        top: rect.top - padding,
                        left: rect.left - padding,
                        width: rect.width + 2 * padding,
                        height: rect.height + 2 * padding,
                    };
                    setHighlightStyle(newHighlightStyle);
                    positionDialog(newHighlightStyle, currentStep.position);
                } else if (!currentStep.requiresElement) {
                    setHighlightStyle(null);
                    positionDialog(null, 'center');
                } else {
                    // Element is required but not found. Skip to the next step.
                    onNext();
                }
            }, 450);
        };
        
        updatePosition();

        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [isActive, stepIndex, step, isMobile, onNext]);

    if (!isActive || !step) return null;

    return (
        <div className="tutorial-overlay" aria-live="polite">
            {highlightStyle && <div className="tutorial-highlight-box" style={highlightStyle} />}
            <div
                className={`tutorial-dialog ${isDialogVisible ? 'visible' : ''}`}
                style={dialogStyle}
                role="dialog"
                aria-labelledby="tutorial-title"
            >
                <h3 id="tutorial-title" className="text-xl font-bold text-slate-800 mb-3">{step.title}</h3>
                <p className="text-slate-600 mb-5 text-sm leading-relaxed">{step.description}</p>
                <div className="flex justify-between items-center">
                    <button onClick={onSkip} className="text-sm text-slate-500 hover:underline">Pular tour</button>
                    <div className="flex gap-2">
                        {stepIndex > 0 && <button onClick={onPrev} className="px-4 py-2 bg-gray-200 text-slate-800 rounded-md hover:bg-gray-300 font-semibold text-sm">Anterior</button>}
                        <button onClick={onNext} className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-brand-green-dark font-semibold text-sm">
                            {stepIndex === TUTORIAL_STEPS.length - 1 ? 'Concluir' : 'Próximo'}
                        </button>
                    </div>
                </div>
                <div className="text-center text-xs text-slate-400 mt-4">
                    Passo {stepIndex + 1} de {TUTORIAL_STEPS.length}
                </div>
            </div>
        </div>
    );
};

export default Tutorial;