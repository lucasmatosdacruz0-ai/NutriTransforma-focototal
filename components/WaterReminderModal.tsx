import React, { useState } from 'react';
import Modal from './Modal';
import { WaterReminderSettings } from '../types';

interface WaterReminderModalProps {
    onClose: () => void;
    onSave: (settings: WaterReminderSettings) => void;
    initialSettings: WaterReminderSettings;
}

const WaterReminderModal: React.FC<WaterReminderModalProps> = ({ onClose, onSave, initialSettings }) => {
    const [isEnabled, setIsEnabled] = useState(initialSettings.enabled);
    const [times, setTimes] = useState<string[]>(initialSettings.times);
    const [newTime, setNewTime] = useState('');

    const handleAddTime = () => {
        if (newTime && /^\d{2}:\d{2}$/.test(newTime) && !times.includes(newTime)) {
            setTimes([...times, newTime].sort());
            setNewTime('');
        }
    };

    const handleRemoveTime = (timeToRemove: string) => {
        setTimes(times.filter(t => t !== timeToRemove));
    };

    const handleSave = () => {
        onSave({ enabled: isEnabled, times });
    };

    return (
        <Modal title="Lembretes para Beber Água" isOpen={true} onClose={onClose}>
            <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                    <label htmlFor="enable-notifications" className="font-medium text-slate-700">Ativar notificações</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="enable-notifications" className="sr-only peer" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
                
                {isEnabled && (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Horários dos lembretes</label>
                            <div className="flex gap-2">
                                <input 
                                    type="time" 
                                    value={newTime}
                                    onChange={(e) => setNewTime(e.target.value)}
                                    className="w-full px-3 py-2 bg-white text-slate-900 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-green focus:border-brand-green"
                                />
                                <button onClick={handleAddTime} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400" disabled={!newTime}>Adicionar</button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {times.length > 0 ? times.map(time => (
                                <div key={time} className="flex items-center gap-2 bg-blue-100 text-blue-800 text-sm font-medium pl-3 pr-1 py-1 rounded-full">
                                    {time}
                                    <button onClick={() => handleRemoveTime(time)} className="p-1 rounded-full hover:bg-blue-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )) : <p className="text-sm text-slate-500 w-full">Nenhum horário adicionado.</p>}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-slate-800 rounded-md hover:bg-gray-300">Cancelar</button>
                <button type="button" onClick={handleSave} className="px-4 py-2 bg-brand-green text-white rounded-md hover:bg-brand-green-dark">Salvar</button>
            </div>
        </Modal>
    );
};

export default WaterReminderModal;