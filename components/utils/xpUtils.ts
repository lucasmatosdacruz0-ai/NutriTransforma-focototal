
export const calculateXPForLevel = (level: number): number => {
    // An exponential curve for leveling up
    // Level 1 -> 100 XP
    // Level 10 -> 3162 XP
    // Level 20 -> 8944 XP
    return Math.floor(100 * Math.pow(level, 1.5));
};
