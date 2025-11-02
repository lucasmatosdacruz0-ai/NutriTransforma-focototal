import React from 'react';
import { Achievement, UserData, AchievementProgress } from '../types';
import { FireIcon } from '../components/icons/FireIcon';
import { ScaleIcon } from '../components/icons/ScaleIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { UserIcon } from '../components/icons/UserIcon';
import { TrophyIcon } from '../components/icons/TrophyIcon';
import { WaterDropletsIcon } from '../components/icons/WaterDropletsIcon';
import { BookOpenIcon } from '../components/icons/BookOpenIcon';
import { StarIcon } from '../components/icons/StarIcon';
import { TargetIcon } from '../components/icons/TargetIcon';

export const ALL_ACHIEVEMENTS: Achievement[] = [
    // Registration
    {
        id: 'registration_complete',
        title: 'Primeiro Passo',
        description: 'Complete seu cadastro e inicie sua jornada para uma vida mais saudável.',
        icon: (props: React.SVGProps<SVGSVGElement>) => React.createElement(UserIcon, props),
        goal: 1,
        category: 'registration',
        xpReward: 0,
    },
    // Streaks
    {
        id: 'streak_3',
        title: 'No Ritmo',
        description: 'Mantenha uma sequência de 3 dias batendo suas metas diárias.',
        icon: (props: React.SVGProps<SVGSVGElement>) => React.createElement(FireIcon, props),
        goal: 3,
        category: 'streak',
        xpReward: 100,
    },
    {
        id: 'streak_7',
        title: 'Implacável',
        description: 'Mantenha uma sequência de 7 dias. Você está no caminho certo!',
        icon: (props: React.SVGProps<SVGSVGElement>) => React.createElement(FireIcon, props),
        goal: 7,
        category: 'streak',
        xpReward: 250,
    },
    {
        id: 'streak_14',
        title: 'Hábito Formado',
        description: 'Duas semanas de consistência! Isso já é um novo estilo de vida.',
        icon: (props: React.SVGProps<SVGSVGElement>) => React.createElement(TrophyIcon, props),
        goal: 14,
        category: 'streak',
        xpReward: 500,
    },
    // Weight Loss
    {
        id: 'lose_1kg',
        title: 'Começando Bem',
        description: 'Parabéns por perder seu primeiro quilo!',
        icon: (props: React.SVGProps<SVGSVGElement>) => React.createElement(ScaleIcon, props),
        goal: 1,
        category: 'weight',
        xpReward: 75,
    },
    {
        id: 'lose_5kg',
        title: 'Grande Conquista',
        description: 'Você perdeu 5kg! Continue com o excelente trabalho.',
        icon: (props: React.SVGProps<SVGSVGElement>) => React.createElement(ScaleIcon, props),
        goal: 5,
        category: 'weight',
        xpReward: 300,
    },
    {
        id: 'lose_10kg',
        title: 'Marco Impressionante',
        description: '10kg a menos! Uma prova de sua dedicação e esforço.',
        icon: (props: React.SVGProps<SVGSVGElement>) => React.createElement(TrophyIcon, props),
        goal: 10,
        category: 'weight',
        xpReward: 750,
    },
    // Plan
    {
        id: 'first_plan',
        title: 'O Arquiteto',
        description: 'Gere seu primeiro plano alimentar personalizado com a IA.',
        icon: (props: React.SVGProps<SVGSVGElement>) => React.createElement(SparklesIcon, props),
        goal: 1,
        category: 'plan',
        xpReward: 50,
    },
    // Water
    {
        id: 'water_streak_3',
        title: 'Hidratado',
        description: 'Beba sua meta de água por 3 dias seguidos.',
        icon: (props: React.SVGProps<SVGSVGElement>) => React.createElement(WaterDropletsIcon, props),
        goal: 3,
        category: 'water',
        xpReward: 50,
    },
    {
        id: 'water_streak_7',
        title: 'Fonte da Juventude',
        description: 'Mantenha sua hidratação em dia por 7 dias seguidos.',
        icon: (props: React.SVGProps<SVGSVGElement>) => React.createElement(WaterDropletsIcon, props),
        goal: 7,
        category: 'water',
        xpReward: 150,
    },
    // Recipe
    {
        id: 'recipe_generated_5',
        title: 'Chef Criativo',
        description: 'Use a busca da IA para encontrar 5 novas ideias de receitas.',
        icon: (props: React.SVGProps<SVGSVGElement>) => React.createElement(BookOpenIcon, props),
        goal: 5,
        category: 'recipe',
        xpReward: 50,
    },
    {
        id: 'recipe_favorited_3',
        title: 'Colecionador de Sabores',
        description: 'Favorite 3 receitas para não perdê-las de vista.',
        icon: (props: React.SVGProps<SVGSVGElement>) => React.createElement(StarIcon, props),
        goal: 3,
        category: 'recipe',
        xpReward: 50,
    },
    // Profile
    {
        id: 'profile_picture',
        title: 'Identidade Revelada',
        description: 'Mostre quem você é! Adicione uma foto de perfil.',
        icon: (props: React.SVGProps<SVGSVGElement>) => React.createElement(UserIcon, props),
        goal: 1,
        category: 'profile',
        xpReward: 25,
    },
    {
        id: 'athlete_mode_first_use',
        title: 'Fogo nos Olhos',
        description: 'Experimente o Modo Atleta para uma dieta de alta performance.',
        icon: (props: React.SVGProps<SVGSVGElement>) => React.createElement(FireIcon, props),
        goal: 1,
        category: 'profile',
        xpReward: 50,
    },
     {
        id: 'pro_member',
        title: 'Membro Pro',
        description: 'Assine o NutriBot Pro e desbloqueie todo o potencial do aplicativo.',
        icon: (props: React.SVGProps<SVGSVGElement>) => React.createElement(SparklesIcon, props),
        goal: 1,
        category: 'profile',
        xpReward: 200,
    },
    // Consistency
    {
        id: 'perfect_day_1',
        title: 'Na Mosca',
        description: 'Termine um dia com todos os macros dentro de 5% da meta.',
        icon: (props: React.SVGProps<SVGSVGElement>) => React.createElement(TargetIcon, props),
        goal: 1,
        category: 'consistency',
        xpReward: 100,
    },
     {
        id: 'perfect_day_5',
        title: 'Precisão Suíça',
        description: 'Tenha 5 dias perfeitos. Sua disciplina é inspiradora!',
        icon: (props: React.SVGProps<SVGSVGElement>) => React.createElement(TargetIcon, props),
        goal: 5,
        category: 'consistency',
        xpReward: 300,
    },
];

export const getAchievementProgress = (userData: UserData, achievement: Achievement, extraData?: { favoriteRecipesCount?: number }): AchievementProgress => {
    let current = 0;
    const goal = achievement.goal;

    switch (achievement.category) {
        case 'registration':
            current = userData.isRegistered ? 1 : 0;
            break;
        case 'streak':
            current = userData.streak;
            break;
        case 'weight':
            current = Math.max(0, userData.initialWeight - userData.weight);
            break;
        case 'plan':
            current = userData.hasGeneratedPlan ? 1 : 0;
            break;
        case 'water':
            current = userData.waterStreak;
            break;
        case 'recipe':
             if (achievement.id.includes('generated')) {
                current = userData.totalRecipesGenerated;
            } else if (achievement.id.includes('favorited')) {
                current = extraData?.favoriteRecipesCount ?? 0;
            }
            break;
        case 'profile':
            if (achievement.id === 'profile_picture') {
                current = userData.profilePicture ? 1 : 0;
            } else if (achievement.id === 'athlete_mode_first_use') {
                current = userData.athleteModeUsed ? 1 : 0;
            } else if (achievement.id === 'pro_member') {
                current = userData.isSubscribed ? 1 : 0;
            }
            break;
        case 'consistency':
            current = userData.perfectDaysCount;
            break;
    }

    return {
        current: Math.min(current, goal), // Cap progress at the goal
        goal,
        unlocked: current >= goal,
    };
};