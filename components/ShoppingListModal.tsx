import React, { useState, FC } from 'react';
import Modal from './Modal';
import { marked } from 'marked';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import html2canvas from 'html2canvas';


interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
}

const LoadingSpinner: FC<{className?: string}> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const ShoppingListModal: React.FC<ShoppingListModalProps> = ({ isOpen, onClose, content }) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  const handleDownloadImage = () => {
    const listElement = document.getElementById('shopping-list-content');
    if (listElement) {
        setIsGeneratingImage(true);
        html2canvas(listElement, {
            useCORS: true,
            scale: 2, // For better resolution
            backgroundColor: '#f8fafc', // bg-slate-50
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'lista-de-compras.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            setIsGeneratingImage(false);
        }).catch(err => {
            console.error("Error generating image:", err);
            alert("Ocorreu um erro ao gerar a imagem.");
            setIsGeneratingImage(false);
        });
    }
  };

  const htmlContent = marked.parse(content) as string;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lista de Compras da Semana" size="2xl">
      <div id="shopping-list-content" className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 max-h-[60vh] overflow-y-auto">
        <div className="markdown-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />
      </div>
      <div className="flex justify-end gap-3">
         <button
          onClick={handleDownloadImage}
          className="bg-slate-700 hover:bg-slate-800 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors disabled:bg-slate-400"
          disabled={isGeneratingImage}
        >
          {isGeneratingImage ? (
             <>
              <LoadingSpinner className="w-5 h-5" />
              <span>Gerando...</span>
            </>
          ) : (
            <>
              <DownloadIcon className="w-5 h-5" />
              <span>Baixar em Imagem</span>
            </>
          )}
        </button>
        <button
          onClick={handleCopy}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors disabled:bg-green-500"
          disabled={copied}
        >
          {copied ? (
            <>
              <CheckIcon className="w-5 h-5" />
              <span>Copiado!</span>
            </>
          ) : (
            <>
              <ClipboardIcon className="w-5 h-5" />
              <span>Copiar Lista</span>
            </>
          )}
        </button>
      </div>
    </Modal>
  );
};

export default ShoppingListModal;