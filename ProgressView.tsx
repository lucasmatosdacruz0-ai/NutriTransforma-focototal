

import React, { useState, useMemo, FC } from 'react';
import { UserData, UserDataHandlers } from '../types';
import { ChartIcon } from './icons/ChartIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ScaleIcon } from './icons/ScaleIcon';
import { TargetIcon } from './icons/TargetIcon';
import { marked } from 'marked';
import StreakCalendar from './StreakCalendar';
import { FireIcon } from './icons/FireIcon';
import { PLANS } from '../constants/plans';

const LoadingSpinner: FC<{className?: string}> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const SummaryCard: FC<{ label: string; value: string | number; icon: React.ReactNode, color: string }> = ({ label, value, icon, color }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-slate-500 font-medium">{label}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

const WeightChart: FC<{ data: { date: string; weight: number }[], goal: number }> = ({ data, goal }) => {
    const [tooltip, setTooltip] = useState<{ x: number; y: number; weight: string; date: string } | null>(null);
    const width = 500;
    const height = 220;
    const padding = { top: 20, right: 50, bottom: 30, left: 35 };

    if (data.length === 0) {
        return <div className="text-center text-slate-500 py-10">Nenhum registro de peso encontrado. Comece a registrar para ver seu progresso.</div>;
    }

    const weights = data.map(d => d.weight);
    const dates = data.map(d => new Date(d.date));

    // Y-Axis scale
    const minVal = Math.min(...weights, goal);
    const maxVal = Math.max(...weights, goal);
    const yDomainPadding = Math.max((maxVal - minVal) * 0.1, 1); // Ensure at least 1 unit padding
    const minY = Math.floor(minVal - yDomainPadding);
    const maxY = Math.ceil(maxVal + yDomainPadding);
    const yRange = maxY - minY;

    // X-Axis scale
    const minX = dates[0]?.getTime();
    const maxX = dates[dates.length - 1]?.getTime();
    const xRange = maxX - minX;

    // Scaling functions
    const getX = (date: Date) => {
        if (xRange === 0) return (width - padding.left - padding.right) / 2 + padding.left;
        return ((date.getTime() - minX) / xRange) * (width - padding.left - padding.right) + padding.left;
    };

    const getY = (weight: number) => {
        if (yRange === 0) return (height - padding.top - padding.bottom) / 2 + padding.top;
        return height - padding.bottom - ((weight - minY) / yRange) * (height - padding.top - padding.bottom);
    };

    // Path for the line
    const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(dates[i])} ${getY(d.weight)}`).join(' ');
    
    // Path for the gradient area
    const areaPath = `${path} L ${getX(dates[data.length - 1])} ${height - padding.bottom} L ${getX(dates[0])} ${height - padding.bottom} Z`;

    // Goal line position
    const goalY = getY(goal);

    // Grid lines
    const numYGridLines = 5;
    const yGridLines = Array.from({ length: numYGridLines }).map((_, i) => {
        const value = minY + (i / (numYGridLines - 1)) * yRange;
        return { value, y: getY(value) };
    });

    return (
        <div className="relative">
             <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Gráfico de evolução do peso">
                <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" className="stop-color-brand-green-light" stopOpacity="0.4" />
                        <stop offset="100%" className="stop-color-brand-green-light" stopOpacity="0" />
                    </linearGradient>
                    <style>{`
                       .stop-color-brand-green-light { stop-color: #E6F8F0; }
                       .theme-athlete .stop-color-brand-green-light { stop-color: var(--accent-red); }
                    `}</style>
                </defs>

                {/* Y-Axis Grid Lines */}
                <g className="grid-lines">
                    {yGridLines.map(({ value, y }) => (
                        <g key={value}>
                            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} className="stroke-slate-200 theme-athlete:stroke-zinc-700" strokeWidth="1" strokeDasharray="3,3" />
                            <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-slate-500 theme-athlete:fill-zinc-400" fontSize="10">{Math.round(value)}</text>
                        </g>
                    ))}
                </g>
                
                {/* Goal Line */}
                {goalY >= padding.top && goalY <= height-padding.bottom && (
                    <g className="goal-line">
                        <line x1={padding.left} y1={goalY} x2={width - padding.right} y2={goalY} className="stroke-brand-orange theme-athlete:stroke-amber-400" strokeWidth="2" strokeDasharray="5" />
                        <text x={width - padding.right + 5} y={goalY + 4} className="fill-brand-orange theme-athlete:fill-amber-400" fontSize="10" fontWeight="bold">Meta</text>
                    </g>
                )}


                {/* Gradient Area */}
                {data.length > 1 && <path d={areaPath} fill="url(#areaGradient)" />}

                {/* Main Path */}
                {data.length > 1 && <path d={path} fill="none" className="stroke-brand-green theme-athlete:stroke-accent-red" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
                
                {/* X-Axis Labels */}
                <text x={padding.left} y={height - padding.bottom + 15} className="fill-slate-500 theme-athlete:fill-zinc-400" fontSize="10">{new Date(data[0].date).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</text>
                {data.length > 1 && <text x={width - padding.right} y={height - padding.bottom + 15} className="fill-slate-500 theme-athlete:fill-zinc-400" fontSize="10" textAnchor="end">{new Date(data[data.length - 1].date).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}</text>}
                
                {/* Data Points Layer (for interaction) */}
                <g>
                    {data.map((d, i) => (
                        <circle 
                            key={i} 
                            cx={getX(dates[i])} 
                            cy={getY(d.weight)} 
                            r="10" 
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setTooltip({ 
                                x: getX(dates[i]), 
                                y: getY(d.weight), 
                                weight: d.weight.toFixed(1),
                                date: new Date(d.date).toLocaleDateString('pt-BR')
                            })}
                            onMouseLeave={() => setTooltip(null)}
                        />
                    ))}
                </g>

                {/* Visible Points Layer */}
                <g style={{ pointerEvents: 'none' }}>
                    {data.map((d, i) => (
                         <circle 
                            key={i} 
                            cx={getX(dates[i])} 
                            cy={getY(d.weight)} 
                            r={tooltip && tooltip.x === getX(dates[i]) ? 6 : 4}
                            className="fill-brand-green theme-athlete:fill-accent-red"
                            stroke="#fff" 
                            strokeWidth="2" 
                            style={{ transition: 'r 0.2s ease' }}
                        />
                    ))}
                </g>

                {/* Tooltip */}
                {tooltip && (
                    <g style={{ pointerEvents: 'none' }} className="transition-opacity">
                        <rect x={tooltip.x - 45} y={tooltip.y - 45} width="90" height="35" className="fill-slate-800 theme-athlete:fill-zinc-900" rx="6" ry="6" />
                        <text x={tooltip.x} y={tooltip.y - 30} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                            {tooltip.weight} kg
                        </text>
                         <text x={tooltip.x} y={tooltip.y - 18} textAnchor="middle" fill="#cbd5e1" fontSize="10">
                            {tooltip.date}
                        </text>
                         <path d={`M ${tooltip.x - 5} ${tooltip.y - 10} L ${tooltip.x + 5} ${tooltip.y - 10} L ${tooltip.x} ${tooltip.y - 4} Z`} className="fill-slate-800 theme-athlete:fill-zinc-900" />
                    </g>
                )}
            </svg>
        </div>
    );
};


const ProgressView: React.FC<{ userData: UserData; handlers: UserDataHandlers; }> = ({ userData, handlers }) => {
    const { initialWeight, weight, weightGoal, weightHistory, completedDays, streak } = userData;
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const totalChange = useMemo(() => weight - initialWeight, [weight, initialWeight]);
    const registrationDate = useMemo(() => (weightHistory && weightHistory.length > 0) ? weightHistory[0].date : new Date().toISOString(), [weightHistory]);

    const handleAnalyzeProgress = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await handlers.handleAnalyzeProgress();
            setAiAnalysis(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Ocorreu um erro.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const getRemainingUses = (featureKey: string) => {
        const planKey = userData.isSubscribed && userData.currentPlan ? userData.currentPlan : 'basic';
        const plan = PLANS[planKey];
        const feature = plan.features.find((f: any) => f.key === featureKey);
        
        if (!feature || !feature.limit || feature.limit === Infinity) {
            return { remaining: Infinity, limit: Infinity };
        }

        const usageData = feature.period === 'week' ? userData.weeklyUsage : userData.dailyUsage;
        const currentUsage = (usageData as any)[featureKey] || 0;
        const purchasedUsage = userData.purchasedUses?.[featureKey] || 0;
        
        return {
            remaining: (feature.limit - currentUsage) + purchasedUsage,
            limit: feature.limit
        };
    };

    const analysisUses = getRemainingUses('progressAnalyses');
    const isAnalysisDisabled = isLoading || (userData.weightHistory || []).length < 2;

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Meu Progresso</h2>
                <p className="text-slate-500">Acompanhe sua jornada e veja sua evolução ao longo do tempo.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard label="Peso Inicial" value={`${initialWeight.toFixed(1)} kg`} icon={<ScaleIcon className="w-6 h-6 text-slate-500"/>} color="bg-slate-100" />
                <SummaryCard label="Peso Atual" value={`${weight.toFixed(1)} kg`} icon={<ScaleIcon className="w-6 h-6 text-blue-500"/>} color="bg-blue-100"/>
                <SummaryCard label="Alteração Total" value={`${totalChange.toFixed(1)} kg`} icon={<ChartIcon className="w-6 h-6 text-green-600"/>} color="bg-green-100"/>
                <SummaryCard label="Meta de Peso" value={`${weightGoal.toFixed(1)} kg`} icon={<TargetIcon className="w-6 h-6 text-yellow-600"/>} color="bg-yellow-100"/>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg text-slate-800 mb-4">Evolução do Peso</h3>
                <WeightChart data={weightHistory || []} goal={weightGoal} />
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-800">Calendário de Metas</h3>
                    {streak > 0 && (
                        <div className="flex items-center gap-2 font-bold text-lg text-orange-500 bg-orange-100 px-3 py-1 rounded-full">
                            <FireIcon className="w-5 h-5"/>
                            <span>{streak} {streak === 1 ? 'dia' : 'dias'}</span>
                        </div>
                    )}
                </div>
                <StreakCalendar completedDays={completedDays} registrationDate={registrationDate} />
            </div>

             <div className={`p-6 rounded-2xl border transition-colors duration-300
                ${isAnalysisDisabled 
                    ? 'bg-slate-100 border-slate-200 theme-athlete:bg-zinc-800 theme-athlete:border-zinc-700' 
                    : 'bg-brand-green-light/60 border-brand-green/20 theme-athlete:bg-accent-red/[.15] theme-athlete:border-accent-red/30'
                }`}
            >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 className={`font-bold text-lg flex items-center gap-2
                            ${isAnalysisDisabled 
                                ? 'text-slate-500 theme-athlete:text-zinc-400'
                                : 'text-brand-green-dark theme-athlete:text-accent-red-light'
                            }`}
                        >
                            <SparklesIcon/> Análise com IA
                        </h3>
                        <p className={`mt-1 text-sm
                            ${isAnalysisDisabled 
                                ? 'text-slate-400 theme-athlete:text-zinc-500'
                                : 'text-brand-green-dark/80 theme-athlete:text-accent-red-light/80'
                            }`}
                        >
                            Receba um resumo motivacional e dicas personalizadas sobre seu progresso.
                        </p>
                    </div>
                    <div className="flex flex-col items-end">
                        <button
                            onClick={handleAnalyzeProgress}
                            disabled={isAnalysisDisabled}
                            className="bg-brand-green-dark hover:bg-slate-900 text-white font-semibold py-2.5 px-5 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex-shrink-0
                                    theme-athlete:bg-accent-red theme-athlete:hover:bg-red-700 theme-athlete:disabled:bg-slate-600"
                            title={ isAnalysisDisabled ? "Registre seu peso mais vezes para obter uma análise" : "Analisar progresso com IA"}
                        >
                            {isLoading ? <LoadingSpinner className="w-5 h-5"/> : 'Analisar meu progresso'}
                        </button>
                        {analysisUses.limit !== Infinity && (
                             <p className="text-xs text-slate-400 mt-2">
                                Análises restantes hoje: <strong>{analysisUses.remaining}</strong>
                            </p>
                        )}
                    </div>
                </div>
                {error && <p className="text-red-600 mt-4">{error}</p>}
                {aiAnalysis && !isLoading && (
                    <div className="mt-4 pt-4 border-t border-brand-green/30 theme-athlete:border-accent-red/30">
                         <div
                            className="markdown-content prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: marked.parse(aiAnalysis) as string }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgressView;
