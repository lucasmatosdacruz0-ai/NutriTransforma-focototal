import React, { FC } from 'react';
import { calculateXPForLevel } from './utils/xpUtils';
import { TrophyIcon } from './icons/TrophyIcon';

interface XPDisplayProps {
    level: number;
    xp: number;
}

const XPDisplay: FC<XPDisplayProps> = ({ level, xp }) => {
    const xpForNextLevel = calculateXPForLevel(level);
    const progressPercentage = xpForNextLevel > 0 ? (xp / xpForNextLevel) * 100 : 0;

    return (
        <div className="xp-display-container">
            <div className="xp-level-badge">
                <TrophyIcon className="xp-level-icon" />
                <span>{level}</span>
            </div>
            <div className="xp-bar-wrapper">
                <div className="xp-bar-info">
                    <span className="xp-bar-label">Nível {level}</span>
                    <span className="xp-bar-values">{Math.floor(xp)} / {xpForNextLevel} XP</span>
                </div>
                <div className="xp-bar-background">
                    <div className="xp-bar-progress" style={{ width: `${progressPercentage}%` }}></div>
                </div>
            </div>
        </div>
    );
};

export default XPDisplay;
