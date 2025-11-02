

import { TutorialStep } from '../types';

export const TUTORIAL_STEPS: TutorialStep[] = [
    {
        elementId: 'welcome-step',
        view: 'Dashboard',
        title: 'Bem-vindo ao NutriBot Pro!',
        description: 'Vamos fazer um tour rápido pelas principais funcionalidades do aplicativo para você começar com tudo.',
        position: 'center',
        requiresElement: false,
    },
    {
        elementId: 'athlete-mode-toggle',
        view: 'Dashboard',
        title: 'Modo Atleta',
        description: 'Alterne entre os modos de dificuldade da dieta. O Modo Atleta é focado em alta performance!',
        position: 'bottom',
    },
    {
        elementId: 'sidebar-nav', // This ID will be dynamically swapped with 'bottom-nav' on mobile
        view: 'Dashboard',
        title: 'Navegação Principal',
        description: 'Use a barra lateral (ou a barra inferior no celular) para navegar entre as diferentes telas do aplicativo.',
        position: 'right',
    },
    {
        elementId: 'generate-diet-buttons-container',
        view: 'Dieta',
        title: 'Geração de Dieta',
        description: 'Nesta tela, você pode gerar dietas diárias ou semanais com a IA. Clique em um dos botões para criar seu plano.',
        position: 'bottom',
    },
    {
        elementId: 'meal-card-prompt-container',
        view: 'Dieta',
        title: 'Ações da Refeição',
        description: 'Peça para a IA trocar um item, fazer uma versão com menos calorias ou tirar uma dúvida sobre um alimento!',
        position: 'bottom',
        requiresElement: true,
    },
    {
        elementId: 'chat-input-container',
        view: 'Chat IA',
        title: 'Converse com a IA',
        description: 'Tire dúvidas sobre alimentos, peça dicas ou até mesmo gere uma dieta diretamente pelo chat.',
        position: 'top',
    },
    {
        elementId: 'recipe-search-form',
        view: 'Receitas',
        title: 'Explorador de Receitas',
        description: 'Busque por qualquer ingrediente ou prato e a IA encontrará receitas criativas. Você pode até gerar a imagem do prato!',
        position: 'bottom',
    },
    {
        elementId: 'edit-profile-button',
        view: 'Conta',
        title: 'Sua Conta',
        description: 'Acesse sua conta para atualizar dados, metas, preferências e gerenciar sua assinatura.',
        position: 'left',
    },
    {
        elementId: 'tour-complete',
        view: 'Dashboard',
        title: 'Você está pronto!',
        description: 'Agora você conhece as principais ferramentas do NutriBot Pro. Explore, experimente e transforme sua saúde!',
        position: 'center',
        requiresElement: false,
    },
];