import React, { FC } from 'react';
import { Achievement, UserData } from '../types';
import { getAchievementProgress } from '../constants/achievements';

interface AchievementCardProps {
    achievement: Achievement;
    userData: UserData;
    onClick: (achievement: Achievement) => void;
}

const AchievementCard: FC<AchievementCardProps> = ({ achievement, userData, onClick }) => {
    const progress = getAchievementProgress(userData, achievement, { favoriteRecipesCount: 0 }); // Note: favorite count not available here, but not needed for display
    const { unlocked, current, goal } = progress;

    return (
        <button 
            onClick={() => onClick(achievement)}
            className={`achievement-seal ${unlocked ? 'achievement-seal-unlocked' : 'achievement-seal-locked'} w-full transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed`}
        >
            <div className={`achievement-seal-icon-wrapper ${unlocked ? 'unlocked' : 'locked'}`}>
                {React.createElement(achievement.icon, { className: 'w-10 h-10 icon' })}
            </div>

            <h3 className="achievement-seal-title">{achievement.title}</h3>
            <p className="achievement-seal-description">{achievement.description}</p>
            
            <div className="achievement-seal-progress-text">
                {unlocked ? 'Desbloqueado!' : `Progresso: ${Math.floor(current)} / ${goal}`}
            </div>
        </button>
    );
};

export default AchievementCard;