import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Message, UserData, UserDataHandlers } from '../types';
import { BowlIcon, UserIcon, SendIcon, TrashIcon, ClipboardIcon, CheckIcon, SparklesIcon, ChevronDownIcon } from './icons';
import { marked } from 'marked';
import { PLANS } from '../constants/plans';

type ChatMessage = Message & { id: number; type?: 'thinking' };

interface ChatViewProps {
    userData: UserData;
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    onNewMealPlanText: (text: string) => void;
    handlers: UserDataHandlers;
}

const ChatView: React.FC<ChatViewProps> = ({ userData, messages, setMessages, onNewMealPlanText, handlers }) => {
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuggestionsExpanded, setIsSuggestionsExpanded] = useState(true);
    const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const chatMessages: ChatMessage[] = useMemo(() => messages.map((m, i) => ({ ...m, id: i })), [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [chatMessages]);

    // This effect handles making tables responsive after they are rendered
    useEffect(() => {
        if (!chatContainerRef.current) return;

        const tables = chatContainerRef.current.querySelectorAll('.markdown-content table');
        tables.forEach(table => {
            // Avoid re-processing tables
            if (table.hasAttribute('data-responsive-processed')) return;

            const headers: string[] = [];
            table.querySelectorAll('thead th').forEach(header => {
                headers.push(header.textContent || '');
            });

            if (headers.length > 0) {
                table.querySelectorAll('tbody tr').forEach(row => {
                    row.querySelectorAll('td').forEach((cell, index) => {
                        cell.setAttribute('data-label', headers[index] || '');
                    });
                });
            }
            
            table.setAttribute('data-responsive-processed', 'true');
        });
    }, [messages]); // Rerun whenever messages change

    useEffect(() => {
      if (messages.length === 0) {
        setMessages([
          { sender: 'bot', text: `Olá, ${userData.name}! Sou o NutriBot. Como posso te ajudar a ter uma vida mais saudável hoje? 🍎` }
        ]);
      }
    }, [messages.length, userData.name, setMessages]);

    const handleClearChat = () => {
        if (window.confirm('Tem certeza de que deseja limpar o histórico desta conversa?')) {
            setMessages([
                { sender: 'bot', text: `Olá, ${userData.name}! Sou o NutriBot. Como posso te ajudar a ter uma vida mais saudável hoje? 🍎` }
            ]);
        }
    };
    
    const handleCopyText = (text: string, messageId: number) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedMessageId(messageId);
            setTimeout(() => setCopiedMessageId(null), 2000);
        });
    };

    const sendPromptAndStream = async (prompt: string, isButtonAction: boolean = false, featureKey?: string) => {
        if (isLoading) return;

        const userMessageText = isButtonAction ? `*Ação solicitada: ${prompt.split('\n')[0]}*` : prompt;
        const userMessage: Message = { sender: 'user', text: userMessageText };
        const thinkingMessage: Message & {type: 'thinking'} = { sender: 'bot', text: 'NutriBot está pensando...', type: 'thinking' };

        setMessages(prev => [...prev, userMessage, thinkingMessage]);
        if (!isButtonAction) setInput('');
        setIsLoading(true);

        try {
            const stream = await handlers.handleChatSendMessage(prompt, featureKey);
            let botResponse = '';
            let firstChunk = true;

            for await (const chunk of stream) {
                const chunkText = chunk.text;
                botResponse += chunkText;
                
                if (firstChunk) {
                    setMessages(prev => {
                        const newMessages = [...prev];
                        const lastMessage = newMessages[newMessages.length - 1];
                        if (lastMessage?.sender === 'bot' && (lastMessage as any).type === 'thinking') {
                           lastMessage.text = botResponse;
                           delete (lastMessage as any).type;
                           lastMessage.isStreaming = true;
                        }
                        return newMessages;
                    });
                    firstChunk = false;
                } else {
                    setMessages(prev => {
                        const newMessages = [...prev];
                        const lastMessage = newMessages[newMessages.length - 1];
                        if (lastMessage?.sender === 'bot') {
                            lastMessage.text = botResponse;
                        }
                        return newMessages;
                    });
                }
            }
            
            const botResponseLower = botResponse.toLowerCase();
            if ((botResponseLower.includes('plano alimentar') || botResponseLower.includes('dieta')) && botResponse.includes('|')) {
                onNewMealPlanText(botResponse);
            }

            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.sender === 'bot') {
                    lastMessage.isStreaming = false;
                }
                return newMessages;
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.sender === 'bot') {
                    lastMessage.text = `Desculpe, ocorreu um erro. ${errorMessage}`;
                    delete (lastMessage as any).type;
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
    
    const renderBotMessage = (msg: ChatMessage) => {
        if (msg.type === 'thinking') {
             return `<div class="flex items-center gap-2"><div class="dot-flashing"></div><span>${msg.text}</span></div>`;
        }
        const rawMarkup = marked.parse(msg.text, { gfm: true, breaks: true }) as string;
        const streamingIndicator = msg.isStreaming ? '<span class="inline-block w-2 h-4 bg-slate-600 animate-pulse ml-2"></span>' : '';
        return rawMarkup + streamingIndicator;
    };

    const handleCreateDiet = () => {
        const { diets, restrictions } = userData.dietaryPreferences;
        const preferencesPrompt = `Minhas preferências: Dietas(${diets.join(', ')}), Restrições(${restrictions.join(', ')}).`;
        const prompt = `Crie uma dieta para um dia, com café, almoço, lanche e jantar. Meta: ${userData.macros.calories.goal} kcal. ${preferencesPrompt} Apresente em uma tabela.`;
        sendPromptAndStream(prompt, true, 'dailyPlanGenerations');
    };

    const handleGenerateShoppingList = () => {
        sendPromptAndStream("Com base na dieta que você acabou de gerar, crie uma lista de compras detalhada.", true, 'shoppingLists');
    };

    const handleAboutMe = () => {
        sendPromptAndStream(`Faça um resumo motivacional e com dicas sobre minha evolução, com base nos meus dados atuais.`, true, 'progressAnalyses');
    };

    const canGenerateList = useMemo(() => {
        if (messages.length === 0) return false;
        const recentBotMessages = messages.filter(m => m.sender === 'bot').slice(-3);
        return recentBotMessages.some(m => m.text.toLowerCase().includes('plano alimentar') || m.text.toLowerCase().includes('dieta') || m.text.toLowerCase().includes('refeições'));
    }, [messages]);

    const buttonClasses = "px-3 py-2 bg-slate-200/50 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed text-left flex items-center gap-2 theme-athlete:bg-zinc-700 theme-athlete:text-zinc-300 theme-athlete:hover:bg-zinc-600";
    
    const getRemainingUses = (featureKey: string) => {
        const planKey = userData.isSubscribed && userData.currentPlan ? userData.currentPlan : 'basic';
        const plan = PLANS[planKey];
        const feature = plan.features.find((f: any) => f.key === featureKey);
        
        if (!feature || !feature.limit || feature.limit === Infinity) return { remaining: Infinity, limit: Infinity };

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
        <div className="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 theme-athlete:bg-zinc-900 theme-athlete:border-zinc-700">
            <header className="p-4 border-b border-gray-200 flex justify-between items-center bg-slate-50 rounded-t-xl theme-athlete:bg-zinc-800 theme-athlete:border-zinc-700">
                <div className="min-w-0">
                    <h2 className="text-lg md:text-xl font-bold text-slate-800 truncate">Chat com IA</h2>
                    <p className="hidden md:block text-sm text-slate-500 truncate">Tire dúvidas, peça dicas ou gere planos alimentares.</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {chatUses.limit !== Infinity && (
                        <div className="bg-slate-200 text-slate-600 text-xs font-semibold px-2 py-1 rounded-full theme-athlete:bg-zinc-700 theme-athlete:text-zinc-300">
                            {chatUses.remaining} restantes
                        </div>
                    )}
                    <button onClick={handleClearChat} title="Limpar conversa" className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors theme-athlete:hover:bg-zinc-700 theme-athlete:hover:text-zinc-200">
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </header>
            <div ref={chatContainerRef} className="flex-1 p-4 md:p-6 overflow-y-auto bg-slate-100 chat-messages-container theme-athlete:bg-zinc-900">
                <div className="flex flex-col gap-6">
                    {chatMessages.map((msg) => (
                        <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'bot' && (
                                <div className="w-10 h-10 rounded-full bg-brand-green-light flex items-center justify-center flex-shrink-0 self-start theme-athlete:bg-zinc-700">
                                    <BowlIcon className="w-6 h-6 text-brand-green theme-athlete:text-accent-red" />
                                </div>
                            )}
                            <div className={`chat-bubble ${msg.sender} ${msg.type === 'thinking' ? 'thinking' : ''} relative`}>
                                <div className="markdown-content" dangerouslySetInnerHTML={{ __html: renderBotMessage(msg) }} />
                                {msg.sender === 'bot' && msg.text.includes('| --- |') && (
                                    <button 
                                        onClick={() => handleCopyText(msg.text, msg.id)}
                                        className="absolute -top-2 -right-2 p-1.5 bg-white border border-slate-200 rounded-full shadow-sm text-slate-500 hover:bg-slate-100 transition-colors"
                                    >
                                        {copiedMessageId === msg.id ? <CheckIcon className="w-4 h-4 text-green-500" /> : <ClipboardIcon className="w-4 h-4" />}
                                    </button>
                                )}
                            </div>
                            {msg.sender === 'user' && (
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 self-start theme-athlete:bg-zinc-700">
                                    <UserIcon className="w-6 h-6 text-slate-600 theme-athlete:text-zinc-300" />
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
             <div className="bg-white border-t border-gray-200 rounded-b-xl theme-athlete:bg-zinc-800 theme-athlete:border-zinc-700">
                <div className="p-2 md:p-3">
                    <div className="bg-slate-100 border border-slate-200 rounded-lg transition-all duration-300 theme-athlete:bg-zinc-700/50 theme-athlete:border-zinc-700">
                        <button
                            onClick={() => setIsSuggestionsExpanded(!isSuggestionsExpanded)}
                            className="w-full flex justify-between items-center p-2 md:p-3 text-left"
                            aria-expanded={isSuggestionsExpanded}
                            aria-controls="ia-suggestions"
                        >
                            <p className="text-xs md:text-sm font-semibold text-slate-600 theme-athlete:text-zinc-300">Sugestões de IA</p>
                            <ChevronDownIcon className={`w-5 h-5 text-slate-500 transform transition-transform duration-300 ${isSuggestionsExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isSuggestionsExpanded && (
                            <div id="ia-suggestions" className="p-2 md:p-3 pt-0">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    <button onClick={handleCreateDiet} disabled={isLoading} className={buttonClasses}><SparklesIcon className="w-4 h-4 text-brand-green"/> Criar dieta</button>
                                    <button onClick={handleGenerateShoppingList} disabled={!canGenerateList || isLoading} className={buttonClasses}><ClipboardIcon className="w-4 h-4 text-blue-500"/> Lista de compras</button>
                                    <button onClick={handleAboutMe} disabled={isLoading} className={buttonClasses}><UserIcon className="w-4 h-4 text-purple-500"/> Fazer resumo</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div id="chat-input-container" className="p-2 md:p-4 md:pt-0">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            className="flex-1 px-4 py-2 md:py-3 bg-slate-100 text-slate-900 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-green theme-athlete:bg-zinc-700"
                            disabled={isLoading}
                        />
                        <button type="submit" className="w-10 h-10 md:w-11 md:h-11 flex-shrink-0 bg-brand-green text-white rounded-full hover:bg-brand-green-dark transition-colors disabled:bg-slate-400 flex items-center justify-center shadow-md hover:shadow-lg" disabled={isLoading || !input.trim()}>
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatView;