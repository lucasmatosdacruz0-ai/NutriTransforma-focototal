import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={`relative bg-white rounded-xl shadow-lg w-full ${sizeClasses[size]} m-auto theme-athlete:bg-slate-800 theme-athlete:border theme-athlete:border-slate-700`} onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h3 id="modal-title" className="text-lg font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 theme-athlete:text-slate-400 theme-athlete:hover:text-white" aria-label="Fechar modal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-5 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;