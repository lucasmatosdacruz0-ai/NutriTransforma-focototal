import React from 'react';
import { UserData, View, UserDataHandlers } from '../types';
import { BowlIcon } from './icons/BowlIcon';
import { NAV_ITEMS } from '../constants';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  userData: UserData;
  handlers: UserDataHandlers;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, userData, handlers }) => {

  return (
    <aside className="w-64 h-full bg-white hidden md:flex flex-col p-6 border-r border-gray-200 theme-athlete:bg-slate-900 theme-athlete:border-slate-700">
      <div className="flex items-center gap-3 mb-10">
        <div className="bg-brand-green p-2 rounded-full">
          <BowlIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-slate-900">NutriBot Pro</h1>
          <p className="text-sm text-slate-500">IA Nutricionista</p>
        </div>
      </div>

      <nav id="sidebar-nav" className="flex flex-col gap-2 flex-1">
        {NAV_ITEMS.map((item) => {
          const isFocoTotal = item.name === 'Foco Total';
          const isActive = activeView === item.name;

          let colorClasses = '';

          if (isFocoTotal) {
            if (isActive) {
              colorClasses = 'bg-brand-blue text-white border-l-4 border-brand-blue-dark';
            } else {
              colorClasses = 'text-brand-blue hover:bg-brand-blue-light';
            }
          } else {
            if (isActive) {
              colorClasses = 'bg-brand-green-light text-brand-green-dark border-l-4 border-brand-green';
            } else {
              colorClasses = 'text-slate-600 hover:bg-gray-100';
            }
          }
          
          return (
            <button
              key={item.name}
              onClick={() => setActiveView(item.name)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-md font-medium transition-colors duration-200 ${colorClasses}`}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

    </aside>
  );
};

export default Sidebar;