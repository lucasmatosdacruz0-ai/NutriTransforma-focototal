import React, { useState, FC } from 'react';
import { UserData, View } from '../types';
import { LockIcon, ChevronDownIcon } from './icons';

interface AdminAccessSectionProps {
    setActiveView: (view: View) => void;
    userData: UserData;
}

const AdminAccessSection: FC<AdminAccessSectionProps> = ({setActiveView, userData}) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);
    const ADMIN_PASSWORD = 'nutripro2024';

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setError('');
            setActiveView('Admin');
        } else {
            setError('Senha incorreta. Acesso negado.');
            setPassword('');
        }
    }

    return (
        <div className="mt-12 pt-8 border-t-2 border-dashed border-slate-300">
            <div className="max-w-md mx-auto bg-slate-100 p-6 rounded-xl border border-slate-200 theme-athlete:bg-slate-800 theme-athlete:border-slate-700">
                <div className="flex items-center gap-3 mb-3">
                    <LockIcon className="w-6 h-6 text-slate-500" />
                    <h3 className="text-lg font-bold text-slate-800">Acesso Restrito do Nutricionista</h3>
                </div>
                <p className="text-sm text-slate-600 mb-4">Esta área é para profissionais de saúde. Insira a senha para gerenciar as configurações avançadas do paciente.</p>
                <form onSubmit={handleLogin} className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Senha de acesso"
                        className="flex-1 px-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
                        aria-label="Senha de acesso do nutricionista"
                    />
                    <button type="submit" className="px-5 py-2 bg-slate-700 text-white font-semibold rounded-md hover:bg-slate-800 transition-colors">
                        Entrar
                    </button>
                </form>
                {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

                {userData.nutritionistInfo && (
                    <div className="mt-4 pt-4 border-t border-slate-200 theme-athlete:border-slate-700 text-center">
                        <p className="text-xs text-slate-500">Acompanhamento por:</p>
                        <p className="text-sm font-semibold text-slate-700">{userData.nutritionistInfo.name}</p>
                        <p className="text-sm text-slate-500">({userData.nutritionistInfo.email})</p>
                    </div>
                )}
    
                {userData.modificationHistory && userData.modificationHistory.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200 theme-athlete:border-slate-700">
                        <button
                            onClick={() => setIsHistoryVisible(!isHistoryVisible)}
                            className="w-full flex justify-between items-center text-sm font-semibold text-slate-700 hover:text-slate-900"
                            aria-expanded={isHistoryVisible}
                        >
                            Histórico de Modificações
                            <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform ${isHistoryVisible ? 'rotate-180' : ''}`} />
                        </button>
                        <div className={`collapsible-content ${isHistoryVisible ? 'open' : ''}`}>
                            <ul className="mt-3 space-y-2 text-xs text-slate-500">
                                {[...userData.modificationHistory].reverse().slice(0, 5).map((entry, index) => (
                                    <li key={index} className="flex justify-between p-2 bg-slate-200/50 rounded">
                                        <span>{new Date(entry.date).toLocaleString('pt-BR')}</span>
                                        <span className="font-medium">{entry.nutritionistName}</span>
                                    </li>
                                ))}
                            </ul>
                            {userData.modificationHistory.length > 5 && <p className="text-center text-xs text-slate-400 mt-2">Exibindo as 5 alterações mais recentes.</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAccessSection;