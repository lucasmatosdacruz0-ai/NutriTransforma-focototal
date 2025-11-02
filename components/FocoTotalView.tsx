


import React, { FC, useRef, useState, useEffect } from 'react';
import { UserData, UserDataHandlers } from '../types';
import { MaximizeIcon, MinimizeIcon } from './icons'; // FIX: Import new icons

interface FocoTotalViewProps {
    userData: UserData; // Keep for consistency, though not directly used by iframe
    handlers: UserDataHandlers; // Keep for consistency
}

const FocoTotalView: FC<FocoTotalViewProps> = ({ userData, handlers }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // For Safari
        document.addEventListener('mozfullscreenchange', handleFullscreenChange); // For Firefox
        document.addEventListener('MSFullscreenChange', handleFullscreenChange); // For IE/Edge

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            // Request fullscreen on the root element of the app for a better experience
            document.documentElement.requestFullscreen().catch((err) => {
                // Fallback to iframe if document request fails (e.g., due to sandboxing)
                iframeRef.current?.requestFullscreen().catch(err => {
                    alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            });
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };


    return (
        <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-[1000] bg-white theme-athlete:bg-zinc-900' : ''}`}>
            <header className="flex justify-between items-center bg-white p-4 rounded-t-xl shadow-sm border-b border-gray-200 theme-athlete:bg-zinc-800 theme-athlete:border-zinc-700">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 theme-athlete:text-zinc-100">Foco Total App</h2>
                    <p className="text-sm text-slate-500 theme-athlete:text-zinc-400">Acesse seu aplicativo de produtividade aqui.</p>
                </div>
                <button
                    onClick={toggleFullscreen}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-slate-200 transition-colors theme-athlete:bg-zinc-700 theme-athlete:text-zinc-300 theme-athlete:hover:bg-zinc-600"
                    aria-label={isFullscreen ? "Sair da tela cheia" : "Entrar em tela cheia"}
                >
                    {isFullscreen ? <MinimizeIcon className="w-5 h-5" /> : <MaximizeIcon className="w-5 h-5" />}
                    <span>{isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}</span>
                </button>
            </header>
            <div className="flex-1 w-full h-full p-0 overflow-hidden rounded-b-xl">
                <iframe
                    ref={iframeRef}
                    src="https://appandroidtotalfoco.vercel.app/"
                    title="Aplicativo Foco Total"
                    className="w-full h-full border-0 rounded-b-xl"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
                    allowFullScreen // Ensure this is present for fullscreen to work
                >
                    Seu navegador não suporta iframes. Por favor, acesse o aplicativo Foco Total diretamente em <a href="https://appandroidtotalfoco.vercel.app/" target="_blank" rel="noopener noreferrer">https://appandroidtotalfoco.vercel.app/</a>.
                </iframe>
            </div>
        </div>
    );
};

export default FocoTotalView;