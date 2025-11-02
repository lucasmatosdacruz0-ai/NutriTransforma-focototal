import React from 'react';

interface ToggleSwitchProps {
    id: string;
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, label, checked, onChange }) => {
    return (
        <label htmlFor={id} className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-50">
            <span className="font-medium text-slate-700">{label}</span>
            <div className="relative">
                <input
                    type="checkbox"
                    id={id}
                    className="sr-only peer"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-green-light theme-athlete:bg-slate-600 peer-checked:bg-brand-green"></div>
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-full"></div>
            </div>
        </label>
    );
};

export default ToggleSwitch;