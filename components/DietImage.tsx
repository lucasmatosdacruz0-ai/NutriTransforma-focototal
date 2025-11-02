import React, { FC } from 'react';
import { DailyPlan, UserData } from '../types';
import { BowlIcon } from './icons/BowlIcon';

interface DietImageProps {
    plan: DailyPlan;
    user: UserData;
    theme: 'light' | 'athlete';
}

const lightTheme = {
    bg: '#ffffff',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    cardBg: 'rgba(248, 250, 252, 0.7)',
    kcalPill: '#F39C12',
    proteinPill: '#10b981',
    carbsPill: '#0ea5e9',
    fatPill: '#f59e0b',
    pillText: '#ffffff',
    brand: '#00B894',
};

const athleteTheme = {
    bg: '#18181b',
    textPrimary: '#f4f4f5',
    textSecondary: '#a1a1aa',
    border: '#3f3f46',
    cardBg: '#27272a',
    kcalPill: '#ED8936',
    proteinPill: '#E53E3E',
    carbsPill: '#ED8936',
    fatPill: '#F1C40F',
    pillText: '#ffffff',
    brand: '#E53E3E',
};


const MacroPill: FC<{label: string; value: string; color: string; textColor: string}> = ({label, value, color, textColor}) => (
    <div style={{ textAlign: 'center', padding: '8px 16px', borderRadius: '8px', backgroundColor: color, color: textColor }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{value}</div>
        <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>{label}</div>
    </div>
);


export const DietImage: FC<DietImageProps> = ({ plan, user, theme }) => {
    const colors = theme === 'athlete' ? athleteTheme : lightTheme;

    const containerStyle: React.CSSProperties = {
        backgroundColor: colors.bg,
        padding: '32px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
        width: '600px',
        color: colors.textPrimary,
        boxSizing: 'border-box',
    };

    return (
        <div style={containerStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: `2px solid ${colors.border}` }}>
                <div>
                    <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: colors.textPrimary, margin: 0 }}>Plano Alimentar</h1>
                    <p style={{ color: colors.textSecondary, margin: '4px 0 0 0' }}>
                        {plan.dayOfWeek}, {new Date(plan.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                 <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 600, margin: 0 }}>{user.name}</p>
                    <p style={{ fontSize: '14px', color: colors.textSecondary, margin: '4px 0 0 0' }}>Meta: {user.weightGoal} kg</p>
                 </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', margin: '24px 0' }}>
                <MacroPill label="Kcal" value={String(Math.round(plan.totalMacros.calories))} color={colors.kcalPill} textColor={colors.pillText} />
                <MacroPill label="Proteínas" value={`${Math.round(plan.totalMacros.protein)}g`} color={colors.proteinPill} textColor={colors.pillText} />
                <MacroPill label="Carbos" value={`${Math.round(plan.totalMacros.carbs)}g`} color={colors.carbsPill} textColor={colors.pillText} />
                <MacroPill label="Gorduras" value={`${Math.round(plan.totalMacros.fat)}g`} color={colors.fatPill} textColor={colors.pillText} />
            </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {plan.meals.map(meal => (
                    <div key={meal.id} style={{ backgroundColor: colors.cardBg, padding: '16px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.textPrimary, margin: 0 }}>{meal.name}</h2>
                            <span style={{ fontSize: '14px', fontWeight: 600, backgroundColor: colors.bg, padding: '4px 12px', borderRadius: '9999px', border: `1px solid ${colors.border}` }}>{meal.time}</span>
                        </div>
                        <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                            <tbody>
                                {meal.items.map((item, index) => (
                                    <tr key={index} style={{ borderBottom: index === meal.items.length - 1 ? 'none' : `1px solid ${colors.border}80` }}>
                                        <td style={{ padding: '8px 0' }}>
                                            <p style={{ fontWeight: 500, color: colors.textPrimary, margin: 0 }}>{item.name}</p>
                                            <p style={{ color: colors.textSecondary, margin: '2px 0 0 0' }}>{item.portion}</p>
                                        </td>
                                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 600, color: colors.textSecondary }}>{item.calories} kcal</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
             </div>
            
             <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: `1px solid ${colors.border}`, textAlign: 'center', color: colors.textSecondary, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <BowlIcon style={{ width: '20px', height: '20px', color: colors.brand }}/>
                <span style={{ fontWeight: 600 }}>Gerado com NutriBot Pro</span>
             </div>
        </div>
    );
};
