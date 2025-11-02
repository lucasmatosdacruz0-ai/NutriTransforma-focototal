import React, { FC, useState } from 'react';
import { Achievement, UserData, UserDataHandlers } from '../types';
import { ALL_ACHIEVEMENTS } from '../constants/achievements';
import AchievementCard from './AchievementCard';
import { TrophyIcon } from './icons/TrophyIcon';
import AchievementDetailModal from './AchievementDetailModal';

interface AchievementsViewProps {
    userData: UserData;
    handlers: UserDataHandlers;
}

const AchievementsView: FC<AchievementsViewProps> = ({ userData, handlers }) => {
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

    const unlockedCount = userData.achievements.length;
    const totalCount = ALL_ACHIEVEMENTS.length;
    const progressPercentage = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;
    
    const handleCardClick = (achievement: Achievement) => {
        setSelectedAchievement(achievement);
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <header>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Minhas Conquistas</h2>
                <p className="text-slate-500">Acompanhe seus marcos e celebre cada passo da sua jornada.</p>
            </header>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 theme-athlete:bg-slate-800 theme-athlete:border-slate-700">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <TrophyIcon className="w-10 h-10 text-yellow-500" />
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg">Progresso Total</h3>
                            <p className="text-sm text-slate-500">Você desbloqueou {unlockedCount} de {totalCount} conquistas!</p>
                        </div>
                    </div>
                    <div className="w-full sm:w-1/3">
                         <div className="w-full bg-gray-200 rounded-full h-2.5 theme-athlete:bg-slate-700">
                            <div 
                                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2.5 rounded-full" 
                                style={{ width: `${progressPercentage}%`}}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {ALL_ACHIEVEMENTS.map(achievement => (
                    <AchievementCard 
                        key={achievement.id} 
                        achievement={achievement} 
                        userData={userData}
                        onClick={handleCardClick}
                    />
                ))}
            </div>

            {selectedAchievement && (
                <AchievementDetailModal
                    isOpen={!!selectedAchievement}
                    onClose={() => setSelectedAchievement(null)}
                    achievement={selectedAchievement}
                    userData={userData}
                    handlers={handlers}
                    isUnlocked={userData.achievements.includes(selectedAchievement.id)}
                />
            )}
        </div>
    );
};

export default AchievementsView;