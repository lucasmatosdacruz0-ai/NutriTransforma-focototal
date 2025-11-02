import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Message, UserData, UserDataHandlers } from '../types';
import { BowlIcon } from './icons/BowlIcon';
import { UserIcon } from './icons/UserIcon';
import { marked } from 'marked';
import { PLANS } from '../constants/plans';

interface ChatViewProps {
    userData: UserData;
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    onNewMealPlanText: (text: string) => void;
    handlers: UserDataHandlers;
}

const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m6 9 6 6 6-6"></path>
    </svg>
);

const ChatView: React.FC<ChatViewProps> = ({ userData, messages, setMessages, onNewMealPlanText, handlers }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuggestionsExpanded, setIsSuggestionsExpanded] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    useEffect(() => {
      if (messages.length === 0) {
        setMessages([
          { sender: 'bot', text: `Olá, ${userData.name}! Sou o NutriBot. Como posso te ajudar a ter uma vida mais saudável hoje? 🍎` }
        ]);
      }
    }, [messages.length, userData.name, setMessages]);

    const sendPromptAndStream = async (prompt: string, isButtonAction: boolean = false) => {
        if (isLoading) return;

        const userMessageText = isButtonAction ? `*Ação solicitada: ${prompt.split('\n')[0]}*` : prompt;
        const userMessage: Message = { sender: 'user', text: userMessageText };
        
        const botMessage: Message = { sender: 'bot', text: '', isStreaming: true };

        setMessages(prev => [...prev, userMessage, botMessage]);
        if (!isButtonAction) {
            setInput('');
        }
        setIsLoading(true);

        try {
            const stream = await handlers.handleChatSendMessage(prompt);
            let botResponse = '';
            for await (const chunk of stream) {
                const chunkText = chunk.text;
                botResponse += chunkText;
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.sender === 'bot') {
                        lastMessage.text = botResponse;
                    }
                    return newMessages;
                });
            }

            const botResponseLower = botResponse.toLowerCase();
            if ((botResponseLower.includes('plano alimentar') || botResponseLower.includes('dieta')) && botResponse.includes('|')) {
                onNewMealPlanText(botResponse);
            }

            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.sender === 'bot') {
                    lastMessage.isStreaming = false;
                }
                return newMessages;
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                 if (lastMessage.sender === 'bot') {
                    lastMessage.text = `Desculpe, ocorreu um erro. ${errorMessage}`;
                    lastMessage.isStreaming = false;
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        sendPromptAndStream(input, false);
    };
    
    const renderBotMessage = (msg: Message) => {
        const rawMarkup = marked.parse(msg.text, { gfm: true, breaks: true }) as string;
        const streamingIndicator = msg.isStreaming ? '<span class="inline-block w-2 h-4 bg-slate-600 animate-pulse ml-2"></span>' : '';
        return { __html: rawMarkup + streamingIndicator };
    };

    const handleCreateDiet = () => {
        const { diets, restrictions } = userData.dietaryPreferences;
        const preferencesPrompt = `
Leve em consideração minhas preferências alimentares:
- Dietas: ${diets.length > 0 ? diets.join(', ') : 'Nenhuma especificada'}.
- Restrições: ${restrictions.length > 0 ? restrictions.join(', ') : 'Nenhuma especificada'}.
`;
        
        const prompt = `Com base nos meus dados, crie uma dieta pessoal para um dia, com café da manhã, almoço, lanche da tarde e jantar. Minha meta de calorias é ${userData.macros.calories.goal} kcal. ${preferencesPrompt} Apresente em uma tabela.`;
        sendPromptAndStream(prompt, true);
    };

    const handleGenerateShoppingList = () => {
        const prompt = "Com base na dieta que você acabou de gerar, crie uma lista de compras detalhada.";
        sendPromptAndStream(prompt, true);
    };

    const handleAboutMe = () => {
        const { name, age, height, activityLevel, weight, initialWeight, weightGoal, water, waterGoal, macros, dietaryPreferences } = userData;
        const prompt = `
Com base nestes meus dados atuais, faça um resumo motivacional sobre minha evolução. Destaque pontos fortes, sugira áreas para melhorar e me dê dicas para continuar progredindo. Use um tom amigável e encorajador, como um verdadeiro coach de saúde.

**Meus Dados:**
- **Nome:** ${name}
- **Idade:** ${age} anos
- **Altura:** ${height} cm
- **Nível de Atividade:** ${activityLevel}
- **Preferências Alimentares:**
  - Dietas: ${dietaryPreferences.diets.join(', ') || 'Nenhuma'}
  - Restrições: ${dietaryPreferences.restrictions.join(', ') || 'Nenhuma'}
- **Objetivo de Peso:** Comecei com ${initialWeight.toFixed(1)} kg e minha meta é ${weightGoal.toFixed(1)} kg.
- **Peso Atual:** Meu peso é ${weight.toFixed(1)} kg.
- **Consumo de Água Hoje:** Bebi ${water.toFixed(2)}L de uma meta de ${waterGoal.toFixed(1)}L.
- **Consumo de Calorias Hoje:** ${macros.calories.current} de ${macros.calories.goal} kcal.
- **Macronutrientes de Hoje:**
  - Carboidratos: ${macros.carbs.current}g de ${macros.carbs.goal}g.
  - Proteínas: ${macros.protein.current}g de ${macros.protein.goal}g.
  - Gorduras: ${macros.fat.current}g de ${macros.fat.goal}g.
`;
        sendPromptAndStream(prompt, true);
    };

    const canGenerateList = useMemo(() => {
        if (messages.length === 0) return false;
        const recentBotMessages = messages.filter(m => m.sender === 'bot').slice(-3);
        return recentBotMessages.some(m => m.text.toLowerCase().includes('plano alimentar') || m.text.toLowerCase().includes('dieta') || m.text.toLowerCase().includes('refeições'));
    }, [messages]);

    const buttonClasses = "px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed text-left";
    
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

    const chatUses = getRemainingUses('chatInteractions');

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200">
            <header className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-slate-800">Chat com IA Nutricionista</h2>
            </header>
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
                <div className="flex flex-col gap-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'bot' && (
                                <div className="w-10 h-10 rounded-full bg-brand-green-light flex items-center justify-center flex-shrink-0">
                                    <BowlIcon className="w-6 h-6 text-brand-green" />
                                </div>
                            )}
                            <div className={`max-w-md lg:max-w-xl rounded-2xl ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none italic' : 'bg-white text-slate-800 rounded-bl-none shadow-sm border border-gray-200'}`}>
                                {msg.sender === 'bot' ? (
                                    <div 
                                        className="markdown-content p-3"
                                        dangerouslySetInnerHTML={renderBotMessage(msg)}
                                    />
                                ) : (
                                    <p className="p-3 whitespace-pre-wrap">{msg.text}</p>
                                )}
                            </div>
                            {msg.sender === 'user' && (
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                    <UserIcon className="w-6 h-6 text-slate-600" />
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
             <div className="bg-white border-t border-gray-200 rounded-b-xl">
                <div className="p-4">
                    <div className="bg-brand-green-light/40 border border-brand-green/20 rounded-lg transition-all duration-300">
                        <button
                            onClick={() => setIsSuggestionsExpanded(!isSuggestionsExpanded)}
                            className="w-full flex justify-between items-center p-3 text-left"
                            aria-expanded={isSuggestionsExpanded}
                            aria-controls="ia-suggestions"
                        >
                            <p className="text-sm font-semibold text-brand-green-dark">Sugestões de IA</p>
                            <ChevronDownIcon className={`w-5 h-5 text-brand-green-dark transform transition-transform duration-300 ${isSuggestionsExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isSuggestionsExpanded && (
                            <div id="ia-suggestions" className="p-3 pt-0">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <button onClick={handleCreateDiet} disabled={isLoading} className={buttonClasses}>Criar dieta pessoal</button>
                                    <button onClick={handleGenerateShoppingList} disabled={!canGenerateList || isLoading} className={buttonClasses}>Lista de compras</button>
                                    <button onClick={handleAboutMe} disabled={isLoading} className={buttonClasses}>Fazer resumo sobre mim</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div id="chat-input-container" className="p-4 border-t border-gray-100">
                    {chatUses.limit !== Infinity && (
                        <p className="text-xs text-slate-400 text-center mb-2">
                            Interações restantes hoje: <strong>{chatUses.remaining}</strong>
                        </p>
                    )}
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-green"
                            disabled={isLoading}
                        />
                        <button type="submit" className="bg-brand-green text-white font-bold py-2 px-4 rounded-full hover:bg-brand-green-dark transition-colors disabled:bg-gray-400" disabled={isLoading || !input.trim()}>
                            {isLoading ? 'Enviando...' : 'Enviar'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatView;
