import React, { useState, FC } from 'react';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { FireIcon } from './icons/FireIcon';
import { XIcon } from './icons/XIcon';

interface StreakCalendarProps {
    completedDays: string[]; // YYYY-MM-DD
    registrationDate?: string;
}

const StreakCalendar: FC<StreakCalendarProps> = ({ completedDays, registrationDate }) => {
    const [viewDate, setViewDate] = useState(new Date());

    const changeMonth = (amount: number) => {
        setViewDate(current => {
            const newDate = new Date(current);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };

    const monthName = viewDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const registration = registrationDate ? new Date(registrationDate) : new Date(0);
    registration.setHours(0,0,0,0);

    const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const lastDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();

    const daysInMonth = Array.from({ length: lastDayOfMonth.getDate() }, (_, i) => new Date(viewDate.getFullYear(), viewDate.getMonth(), i + 1));
    const prefixDays = Array.from({ length: startingDayOfWeek }, () => null);
    const calendarDays = [...prefixDays, ...daysInMonth];
    
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-md hover:bg-slate-200 transition-colors" aria-label="Mês anterior">
                    <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
                </button>
                <h4 className="font-bold text-slate-800 text-center capitalize">{monthName}</h4>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-md hover:bg-slate-200 transition-colors" aria-label="Próximo mês">
                    <ChevronRightIcon className="w-5 h-5 text-slate-600" />
                </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500 mb-2">
                {weekDays.map(day => <div key={day}>{day}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                    if (!day) return <div key={`empty-${index}`} />;

                    const dayStr = day.toISOString().split('T')[0];
                    const isCompleted = completedDays.includes(dayStr);
                    const isPast = day.getTime() < today.getTime();
                    const isToday = day.getTime() === today.getTime();
                    const isBeforeRegistration = day.getTime() < registration.getTime();

                    let cellClasses = "w-full aspect-square flex items-center justify-center rounded-lg transition-colors text-sm ";
                    let content = <span className="text-slate-700">{day.getDate()}</span>;

                    if (isToday) {
                        cellClasses += " bg-brand-green-light text-brand-green-dark font-bold ";
                    }
                    
                    if (isCompleted) {
                        content = <FireIcon className="w-6 h-6 text-orange-500" />;
                        cellClasses += " bg-orange-100";
                    } else if (isPast && !isBeforeRegistration) {
                        content = <XIcon className="w-5 h-5 text-slate-400" />;
                        cellClasses += " bg-slate-100 opacity-80";
                    }

                    if (isBeforeRegistration && !isCompleted) {
                        cellClasses += " opacity-50";
                    }

                    return (
                        <div key={dayStr} className={cellClasses} title={day.toLocaleDateString('pt-BR')}>
                            {content}
                        </div>
                    );
                })}
            </div>
             <div className="flex items-center justify-center gap-6 text-xs text-slate-500 mt-4">
                <div className="flex items-center gap-2">
                    <FireIcon className="w-4 h-4 text-orange-500"/> Meta batida
                </div>
                <div className="flex items-center gap-2">
                    <XIcon className="w-4 h-4 text-slate-400"/> Meta falhada
                </div>
            </div>
        </div>
    );
};

export default StreakCalendar;