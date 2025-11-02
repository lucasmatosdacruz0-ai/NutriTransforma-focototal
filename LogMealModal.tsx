import React, { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import { MacroData, UserData, UserDataHandlers } from '../types';
import { CameraIcon } from './icons/CameraIcon';
import { UtensilsIcon } from './icons/UtensilsIcon';
import { PLANS } from '../constants/plans';

interface LogMealModalProps {
    onClose: () => void;
    onLogMeal: (macros: MacroData) => void;
    handlers: UserDataHandlers;
    userData: UserData;
}

const LogMealModal: React.FC<LogMealModalProps> = ({ onClose, onLogMeal, handlers, userData }) => {
    const [activeTab, setActiveTab] = useState<'text' | 'camera'>('text');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analyzedMacros, setAnalyzedMacros] = useState<MacroData | null>(null);

    // Camera state
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');

    const checkCameraPermission = async () => {
        if (!('permissions' in navigator)) {
            setPermissionStatus('prompt');
            return;
        }
        try {
            const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
            setPermissionStatus(result.state);
            result.onchange = () => {
                setPermissionStatus(result.state);
            };
        } catch (e) {
            console.error("Could not query for camera permission.", e);
            setPermissionStatus('prompt');
        }
    };

    useEffect(() => {
        if (activeTab === 'camera') {
            checkCameraPermission();
        }
    }, [activeTab]);


    const cleanupCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    useEffect(() => {
        return () => {
            cleanupCamera();
        };
    }, []);

    const startCamera = async () => {
        cleanupCamera();
        setCameraError(null);
        setIsLoading(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraOn(true);
                setPermissionStatus('granted');
            }
        } catch (err) {
            console.error("Camera error:", err);
            if (err instanceof Error) {
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setPermissionStatus('denied');
                } else {
                    setCameraError("Não foi possível acessar a câmera. Verifique se ela não está sendo usada por outro aplicativo.");
                }
            } else {
                 setCameraError("Ocorreu um erro desconhecido ao tentar acessar a câmera.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if(context) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const imageDataUrl = canvas.toDataURL('image/jpeg');
                setCapturedImage(imageDataUrl);
                setIsCameraOn(false);
                cleanupCamera();
            }
        }
    };

    const resetCamera = () => {
        setCapturedImage(null);
        setAnalyzedMacros(null);
        setError(null);
        setCameraError(null);
    };

    const handleAnalyze = async () => {
        setIsLoading(true);
        setError(null);
        setAnalyzedMacros(null);
        try {
            let result;
            if (activeTab === 'text' && description.trim()) {
                result = await handlers.handleAnalyzeMeal({ description });
            } else if (activeTab === 'camera' && capturedImage) {
                result = await handlers.handleAnalyzeMeal({ imageDataUrl: capturedImage });
            } else {
                return;
            }
            setAnalyzedMacros(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleConfirmLog = () => {
        if (analyzedMacros) {
            onLogMeal(analyzedMacros);
            onClose();
        }
    };
    
    const TabButton: React.FC<{ tabName: 'text' | 'camera', icon: React.ReactNode, label: string }> = ({ tabName, icon, label }) => (
        <button
            onClick={() => {
                setActiveTab(tabName);
                setError(null);
                setAnalyzedMacros(null);
                setCameraError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tabName ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
        >
            {icon}
            {label}
        </button>
    );
    
    const getRemainingUses = (featureKey: string) => {
        const planKey = userData.isSubscribed && userData.currentPlan ? userData.currentPlan : 'basic';
        const plan = PLANS[planKey];
        const feature = plan.features.find((f: any) => f.key === featureKey);
        
        if (!feature || !feature.limit || feature.limit === Infinity) {
            return { remaining: Infinity, limit: Infinity };
        }

        const usageData = feature.period === 'week' ? userData.weeklyUsage : userData.dailyUsage;
        const currentUsage = (usageData as any)[featureKey] || 0;
        const purchasedUsage = userData.purchasedUses?.[featureKey] || 0;
        
        return {
            remaining: (feature.limit - currentUsage) + purchasedUsage,
            limit: feature.limit
        };
    };

    const imageAnalysisUses = getRemainingUses('mealAnalysesImage');

    return (
        <Modal title="Registrar Refeição" isOpen={true} onClose={onClose} size="lg">
            <div className="flex border-b border-gray-200">
                <TabButton tabName="text" icon={<UtensilsIcon className="w-5 h-5"/>} label="Descrever"/>
                <TabButton tabName="camera" icon={<CameraIcon className="w-5 h-5"/>} label="Usar Câmera"/>
            </div>

            <div className="pt-5">
                {!analyzedMacros ? (
                    <>
                        {activeTab === 'text' && (
                            <div>
                                <label htmlFor="meal-description" className="block text-sm font-medium text-slate-700 mb-1">
                                    O que você comeu?
                                </label>
                                <textarea
                                    id="meal-description"
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Ex: 2 ovos mexidos, 1 fatia de pão integral com abacate e uma xícara de café."
                                    className="w-full px-3 py-2 bg-white text-slate-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green"
                                />
                                <div className="mt-4">
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={isLoading || !description.trim()}
                                        className="w-full px-4 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 disabled:bg-gray-400 flex justify-center items-center transition-colors"
                                    >
                                        {isLoading ? 'Analisando...' : 'Analisar com IA'}
                                    </button>
                                </div>
                            </div>
                        )}
                        {activeTab === 'camera' && (
                            <div className="flex flex-col items-center">
                                <canvas ref={canvasRef} className="hidden"></canvas>
                                {cameraError && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-200">{cameraError}</p>}
                                
                                {isCameraOn ? (
                                    <div className="w-full mb-4">
                                        <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-lg bg-slate-900" />
                                    </div>
                                ) : capturedImage && (
                                    <div className="w-full mb-4">
                                        <img src={capturedImage} alt="Refeição capturada" className="w-full h-auto rounded-lg"/>
                                    </div>
                                )}
                                
                                {isCameraOn ? (
                                    <button onClick={handleCapture} className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 flex justify-center items-center gap-2">
                                        <CameraIcon className="w-5 h-5"/> Tirar Foto
                                    </button>
                                ) : capturedImage ? (
                                    <div className="w-full flex flex-col sm:flex-row gap-3 mt-2">
                                        <button onClick={resetCamera} className="flex-1 px-4 py-2 bg-gray-200 text-slate-800 font-semibold rounded-md hover:bg-gray-300">Tirar Outra</button>
                                        <button onClick={handleAnalyze} disabled={isLoading} className="flex-1 px-4 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 disabled:bg-gray-400">
                                            {isLoading ? 'Analisando...' : 'Analisar Foto com IA'}
                                        </button>
                                    </div>
                                ) : permissionStatus === 'denied' ? (
                                    <div className="text-center p-4 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                                        <h4 className="font-bold">Acesso à câmera bloqueado</h4>
                                        <p className="text-sm mt-1">Para registrar refeições com a câmera, você precisa conceder permissão ao NutriBot nas configurações do seu navegador.</p>
                                        <p className="text-sm mt-2">Após permitir, talvez seja necessário recarregar o aplicativo.</p>
                                    </div>
                                ) : (
                                    <button onClick={startCamera} disabled={isLoading} className="w-full px-4 py-3 bg-slate-800 text-white font-semibold rounded-md hover:bg-slate-900 disabled:bg-gray-400 flex justify-center items-center gap-2">
                                        <CameraIcon className="w-5 h-5"/> {isLoading ? 'Iniciando...' : 'Ligar Câmera'}
                                    </button>
                                )}
                                 {imageAnalysisUses.limit !== Infinity && (
                                    <p className="text-xs text-slate-400 mt-2">
                                        Análises de imagem restantes hoje: <strong>{imageAnalysisUses.remaining}</strong>
                                    </p>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                     <div>
                        <h4 className="font-semibold text-slate-800 mb-3">Análise da Refeição:</h4>
                        <div className="space-y-2 bg-slate-50 p-4 rounded-lg border">
                            <div className="flex justify-between"><span>Calorias:</span> <span className="font-bold">{Math.round(analyzedMacros.calories)} kcal</span></div>
                            <div className="flex justify-between"><span>Carboidratos:</span> <span className="font-bold">{Math.round(analyzedMacros.carbs)} g</span></div>
                            <div className="flex justify-between"><span>Proteínas:</span> <span className="font-bold">{Math.round(analyzedMacros.protein)} g</span></div>
                            <div className="flex justify-between"><span>Gorduras:</span> <span className="font-bold">{Math.round(analyzedMacros.fat)} g</span></div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Estes valores são estimativas. Use-os como um guia.</p>
                         <div className="mt-6 flex justify-end gap-3">
                            <button type="button" onClick={() => { setAnalyzedMacros(null); if (activeTab === 'camera') resetCamera(); }} className="px-4 py-2 bg-gray-200 text-slate-800 rounded-md hover:bg-gray-300">Analisar Outra</button>
                            <button type="button" onClick={handleConfirmLog} className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-brand-green-dark">Registrar Refeição</button>
                        </div>
                    </div>
                )}
                 {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
            </div>
        </Modal>
    );
};
export default LogMealModal;
