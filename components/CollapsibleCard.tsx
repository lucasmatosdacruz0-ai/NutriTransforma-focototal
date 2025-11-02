import React, { FC } from 'react';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface CollapsibleCardProps {
    title: string;
    icon: React.ReactNode;
    action?: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

const CollapsibleCard: FC<CollapsibleCardProps> = ({ title, icon, action, isOpen, onToggle, children }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 theme-athlete:bg-slate-800 theme-athlete:border-slate-700 overflow-hidden">
            <div className="flex justify-between items-center p-5">
                <button
                    onClick={onToggle}
                    className="flex items-center gap-4 text-left flex-grow"
                    aria-expanded={isOpen}
                >
                    {icon}
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                </button>
                <div className="flex items-center gap-4">
                    {action}
                    <button onClick={onToggle} className="p-1 rounded-full hover:bg-slate-100 theme-athlete:hover:bg-slate-700">
                        <ChevronDownIcon className={`w-6 h-6 text-slate-500 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>
            <div className={`collapsible-content ${isOpen ? 'open' : ''}`}>
                <div className="px-5 pb-5 pt-0">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default CollapsibleCard;
