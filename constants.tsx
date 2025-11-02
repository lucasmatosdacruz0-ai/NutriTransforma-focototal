import React from 'react';
import { NavItem } from './types';
import { HomeIcon } from './components/icons/HomeIcon';
import { ChatIcon } from './components/icons/ChatIcon';
import { CalendarIcon } from './components/icons/CalendarIcon';
import { ChartIcon } from './components/icons/ChartIcon';
import { StarIcon } from './components/icons/StarIcon';
import { GridIcon } from './components/icons/GridIcon';
import { BookOpenIcon } from './components/icons/BookOpenIcon';
import { UserIcon } from './components/icons/UserIcon';
import { TargetIcon } from './components/icons/TargetIcon';

export const NAV_ITEMS: NavItem[] = [
    { name: 'Dashboard', icon: <HomeIcon /> },
    { name: 'Chat IA', icon: <ChatIcon /> },
    { name: 'Foco Total', icon: <TargetIcon /> },
    { name: 'Receitas', icon: <BookOpenIcon /> },
    { name: 'Favoritos', icon: <StarIcon /> },
    { name: 'Progresso', icon: <ChartIcon /> },
    { name: 'Dieta', icon: <CalendarIcon /> },
    { name: 'Recursos', icon: <GridIcon /> },
    { name: 'Conta', icon: <UserIcon /> },
];