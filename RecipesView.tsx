import React, { useState, FC, useEffect } from 'react';
import { Recipe, UserData, RecipesViewState, UserDataHandlers } from '../types';
import { findRecipes, generateImageFromPrompt } from '../services/geminiService';
import Modal from './Modal';
import { 
    SparklesIcon, 
    BookOpenIcon, 
    ClockIcon, 
    ImageIcon, 
    ShareIcon, 
    StarIcon, 
    ChevronLeftIcon, 
    ChevronRightIcon,
    BarChartIcon,
    UsersIcon
} from './icons';
import { PLANS } from '../constants/plans';

const LoadingSpinner: FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

interface RecipesViewProps {
    userData: UserData;
    favoriteRecipes: Recipe[];
    onToggleFavorite: (recipe: Recipe) => void;
    recipesViewState: RecipesViewState;
    onStateChange: React.Dispatch<React.SetStateAction<RecipesViewState>>;
    onRecipesGenerated: (count: number) => void;
    handlers: UserDataHandlers;
}

const suggestionBank = [
    ["Café da manhã rico em proteína", "Jantar low-carb em 30 minutos", "Ideias com frango e batata doce", "Sobremesa saudável sem açúcar"],
    ["Almoço vegetariano rápido", "Lanches para levar para o trabalho", "Receitas com abacate", "Sopas para o inverno"],
    ["Vitamina pós-treino", "Saladas completas para o verão", "Pratos com salmão", "Opções de marmita fit"],
    ["Doces com whey protein", "Receitas veganas fáceis", "Jantar para a família toda", "Como usar aveia"],
];

const RecipesView: React.FC<RecipesViewProps> = ({ userData, favoriteRecipes, onToggleFavorite, recipesViewState, onStateChange, onRecipesGenerated, handlers }) => {
    const { activeTab, query, recipes, recipeImageCache } = recipesViewState;

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [suggestionIndex, setSuggestionIndex] = useState(0);
    const [isFading, setIsFading] = useState(false);
    const [numRecipesToGenerate, setNumRecipesToGenerate] = useState<1 | 2 | 3>(3);

    const changeSuggestionSet = (direction: 'next' | 'prev') => {
        if (isFading) return;
        setIsFading(true);
        setTimeout(() => {
            setSuggestionIndex(prevIndex => {
                if (direction === 'next') {
                    return (prevIndex + 1) % suggestionBank.length;
                } else {
                    return (prevIndex - 1 + suggestionBank.length) % suggestionBank.length;
                }
            });
            setIsFading(false);
        }, 300);
    };
    
    useEffect(() => {
        const intervalId = setInterval(() => {
            changeSuggestionSet('next');
        }, 7000);
        return () => clearInterval(intervalId);
    }, []);


    const handleSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) return;

        if (!handlers.checkAndIncrementUsage('recipeSearches', numRecipesToGenerate)) {
            return;
        }

        setIsLoading(true);
        setError(null);
        onStateChange(prev => ({ ...prev, recipes: [] }));
        try {
            const results = await findRecipes(searchQuery, userData, numRecipesToGenerate);
            onStateChange(prev => ({ ...prev, recipes: results }));
            // onRecipesGenerated is kept for potential future use but usage is now handled by checkAndIncrementUsage
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch(query);
    };

    const handleRecipeClick = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
    };

    const handleGenerateImage = async () => {
        if (!selectedRecipe || recipeImageCache[selectedRecipe.id] || isImageLoading) return;
        
        // Use the centralized usage checker
        if (!handlers.checkAndIncrementUsage('imageGen')) {
            // The handler already shows a notification and opens the modal if needed
            return;
        }

        setIsImageLoading(true);
        try {
            const imageUrl = await generateImageFromPrompt(selectedRecipe.imagePrompt);
            onStateChange(prev => ({
                ...prev,
                recipeImageCache: { ...prev.recipeImageCache, [selectedRecipe.id]: imageUrl }
            }));
            
            // Note: Usage is already incremented by checkAndIncrementUsage
            if (!userData.isSubscribed) {
                // Also track free images for trial separately if needed, though checkAndIncrement handles the block
                handlers.updateUserData({ freeImagesGenerated: (userData.freeImagesGenerated || 0) + 1 });
            } else {
                 handlers.updateUserData({ imagesGeneratedCount: (userData.imagesGeneratedCount || 0) + 1 });
            }

            const isFavorite = favoriteRecipes.some(r => r.id === selectedRecipe.id);
            if(isFavorite) {
                const updatedRecipe = { ...selectedRecipe, generatedImage: imageUrl };
                onToggleFavorite(updatedRecipe); // This implicitly updates the favorite
                onToggleFavorite(updatedRecipe); // and toggles it back, effectively just updating
            }
        } catch(e) {
            console.error("Image generation failed:", e);
        } finally {
            setIsImageLoading(false);
        }
    };

    const handleFavoriteClick = () => {
        if (!selectedRecipe) return;
        const image = recipeImageCache[selectedRecipe.id];
        const recipeToToggle = {
            ...selectedRecipe,
            generatedImage: image,
        };
        onToggleFavorite(recipeToToggle);
    };

    const handleShareRecipe = async () => {
        if (!selectedRecipe || !recipeImageCache[selectedRecipe.id]) return;
    
        const imageUrl = recipeImageCache[selectedRecipe.id];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
    
        const PADDING = 60;
        const CANVAS_WIDTH = 800;
        const FONT_FAMILY = "'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif";
    
        // Helper to wrap text and calculate height
        const measureAndWrapText = (text: string, font: string, maxWidth: number) => {
            ctx.font = font;
            const lines: string[] = [];
            const words = text.split(' ');
            let currentLine = '';
    
            for (const word of words) {
                const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && currentLine.length > 0) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            lines.push(currentLine);
            return lines;
        };
    
        // Load image to get its dimensions
        const image = new Image();
        image.crossOrigin = 'anonymous';
        const imageLoadPromise = new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error('Falha ao carregar a imagem da receita.'));
            image.src = imageUrl;
        });
    
        try {
            await imageLoadPromise;
        } catch (e) {
            console.error(e);
            alert((e as Error).message);
            return;
        }
    
        const imageHeight = (CANVAS_WIDTH / image.width) * image.height;
    
        // Calculate dynamic height
        let currentY = imageHeight + PADDING;
        const titleLines = measureAndWrapText(selectedRecipe.title, `bold 42px ${FONT_FAMILY}`, CANVAS_WIDTH - 2 * PADDING);
        currentY += titleLines.length * 50;
        currentY += PADDING / 2;
    
        currentY += 40; // 'Ingredientes' title
        const ingredientLines: string[][] = [];
        selectedRecipe.ingredients.forEach(ing => {
            const lines = measureAndWrapText(`• ${ing}`, `22px ${FONT_FAMILY}`, CANVAS_WIDTH - 2 * PADDING);
            ingredientLines.push(lines);
            currentY += lines.length * 28;
        });
        currentY += PADDING / 2;
    
        currentY += 40; // 'Modo de Preparo' title
        const instructionLines: string[][] = [];
        selectedRecipe.instructions.forEach((inst, i) => {
            const lines = measureAndWrapText(`${i + 1}. ${inst}`, `22px ${FONT_FAMILY}`, CANVAS_WIDTH - 2 * PADDING);
            instructionLines.push(lines);
            currentY += lines.length * 30;
        });
    
        currentY += PADDING;
        currentY += 80; // Footer space
    
        // Set final canvas dimensions and draw
        canvas.width = CANVAS_WIDTH;
        canvas.height = currentY;
    
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    
        ctx.drawImage(image, 0, 0, CANVAS_WIDTH, imageHeight);
    
        // Reset Y for drawing
        currentY = imageHeight + PADDING;
    
        // Draw Title
        ctx.font = `bold 42px ${FONT_FAMILY}`;
        ctx.fillStyle = '#1E293B';
        titleLines.forEach(line => {
            ctx.fillText(line, PADDING, currentY);
            currentY += 50;
        });
        currentY += PADDING / 2 - 20;
    
        // Draw Ingredients
        ctx.font = `bold 28px ${FONT_FAMILY}`;
        ctx.fillText('Ingredientes', PADDING, currentY);
        currentY += 40;
        ctx.font = `22px ${FONT_FAMILY}`;
        ctx.fillStyle = '#475569';
        ingredientLines.forEach(lines => {
            lines.forEach(line => {
                ctx.fillText(line, PADDING, currentY);
                currentY += 28;
            });
        });
        currentY += PADDING / 2;
    
        // Draw Instructions
        ctx.font = `bold 28px ${FONT_FAMILY}`;
        ctx.fillStyle = '#1E293B';
        ctx.fillText('Modo de Preparo', PADDING, currentY);
        currentY += 40;
        ctx.font = `22px ${FONT_FAMILY}`;
        ctx.fillStyle = '#475569';
        instructionLines.forEach(lines => {
            lines.forEach(line => {
                ctx.fillText(line, PADDING, currentY);
                currentY += 30;
            });
        });
    
        // Draw Footer
        ctx.fillStyle = "#F1F5F9";
        ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
        ctx.font = `bold 24px ${FONT_FAMILY}`;
        ctx.fillStyle = "#475569";
        ctx.textAlign = "center";
        ctx.fillText("Gerado com NutriBot Pro 🥑", canvas.width / 2, canvas.height - 30);
    
        // Share
        const finalImageURL = canvas.toDataURL('image/jpeg', 0.9);
        try {
            const response = await fetch(finalImageURL);
            const blob = await response.blob();
            const file = new File([blob], `${selectedRecipe.title.replace(/\s/g, '_')}.jpg`, { type: 'image/jpeg' });
            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: `Receita: ${selectedRecipe.title}` });
            } else {
                const link = document.createElement('a');
                link.href = finalImageURL;
                link.download = `${selectedRecipe.title.replace(/\s/g, '_')}.jpg`;
                link.click();
            }
        } catch (err) {
            console.error('Share failed:', err);
            // Fallback for browsers that fail on navigator.share with files
            const link = document.createElement('a');
            link.href = finalImageURL;
            link.download = `${selectedRecipe.title.replace(/\s/g, '_')}.jpg`;
            link.click();
        }
    };
    
    const RecipeCard: FC<{ recipe: Recipe; isFavorite?: boolean }> = ({ recipe, isFavorite = false }) => {
        const image = recipeImageCache[recipe.id] || recipe.generatedImage;

        return (
            <div
                onClick={() => handleRecipeClick(recipe)}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer"
            >
                <div>
                     {image && (
                        <div className="aspect-video bg-slate-100 rounded-lg mb-4 overflow-hidden relative">
                             <img src={image} alt={recipe.title} className="w-full h-full object-cover" />
                             {isFavorite && <StarIcon className="absolute top-2 right-2 w-6 h-6 text-yellow-400 fill-current" />}
                        </div>
                     )}
                    <h3 className="font-bold text-slate-800 text-lg mb-2">{recipe.title}</h3>
                    <p className="text-slate-500 text-sm mb-4 leading-relaxed line-clamp-3">{recipe.description}</p>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 border-t border-gray-100 pt-3 mt-4">
                    <span className="font-semibold">{recipe.prepTime}</span>
                    <span className="font-semibold">{recipe.difficulty}</span>
                    <span className="font-semibold">{recipe.servings}</span>
                </div>
            </div>
        );
    }
    
    const currentSuggestions = suggestionBank[suggestionIndex];

    const tabButtonClasses = (tabName: 'search' | 'favorites') =>
    `px-6 py-2 rounded-lg font-semibold transition-colors text-sm w-full
     ${activeTab === tabName
        ? 'bg-brand-green text-white shadow'
        : 'bg-white text-brand-green-dark hover:bg-gray-100'
     }`;

    const freeImagesRemaining = 1 - (userData.freeImagesGenerated || 0);
    
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

    const recipeUses = getRemainingUses('recipeSearches');

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <header>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Explorador de Receitas</h2>
                <p className="text-slate-500">Encontre a receita perfeita para qualquer ocasião com a ajuda da IA.</p>
            </header>
            
            <div className="bg-brand-green-light p-1 rounded-xl flex max-w-sm mb-6 gap-1">
                <button onClick={() => onStateChange(prev => ({...prev, activeTab: 'search'}))} className={tabButtonClasses('search')} aria-selected={activeTab === 'search'}>Buscar</button>
                <button onClick={() => onStateChange(prev => ({...prev, activeTab: 'favorites'}))} className={tabButtonClasses('favorites')} aria-selected={activeTab === 'favorites'}>Favoritos</button>
            </div>

            {activeTab === 'search' && (
                <>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <form id="recipe-search-form" onSubmit={handleSubmit}>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => onStateChange(prev => ({...prev, query: e.target.value}))}
                                placeholder="Buscar por ingrediente, prato ou objetivo..."
                                className="flex-1 px-4 py-3 bg-slate-100 text-slate-800 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent"
                                disabled={isLoading}
                            />
                            <button 
                                type="submit" 
                                disabled={!query.trim() || isLoading}
                                className="bg-brand-green hover:bg-brand-green-dark text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm disabled:bg-slate-400 disabled:cursor-not-allowed"
                            >
                                <SparklesIcon className="w-5 h-5"/>
                                {isLoading ? 'Buscando...' : 'Buscar Receitas'}
                            </button>
                        </div>
                    </form>
                     {recipeUses.limit !== Infinity && (
                        <p className="text-xs text-slate-400 text-center mt-3">
                            Buscas de receitas restantes na semana: <strong>{recipeUses.remaining} / {recipeUses.limit}</strong>
                        </p>
                     )}
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4">
                        <div className="flex-grow">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-slate-500">Sugestões de busca:</p>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => changeSuggestionSet('prev')} disabled={isLoading || isFading} className="p-1.5 rounded-full text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-50" aria-label="Sugestão anterior"><ChevronLeftIcon className="w-4 h-4"/></button>
                                    <button onClick={() => changeSuggestionSet('next')} disabled={isLoading || isFading} className="p-1.5 rounded-full text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-50" aria-label="Próxima sugestão"><ChevronRightIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                            <div className={`flex flex-wrap gap-2 transition-opacity duration-300 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
                                {currentSuggestions.map((p, i) => (
                                    <button key={i} onClick={() => { onStateChange(prev => ({...prev, query: p})); handleSearch(p); }} disabled={isLoading} className="text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50">{p}</button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg">
                            <span className="text-xs font-semibold text-slate-600 pl-2">Gerar:</span>
                            {[1, 2, 3].map(num => (
                                <button
                                    key={num}
                                    onClick={() => setNumRecipesToGenerate(num as 1|2|3)}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${numRecipesToGenerate === num ? 'bg-white text-brand-green shadow-sm' : 'text-slate-500 hover:bg-white/50'}`}
                                >
                                    {num} {num > 1 ? 'receitas' : 'receita'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="min-h-[400px]">
                    {isLoading && (
                        <div className="text-center text-slate-500 p-10">
                            <LoadingSpinner className="w-12 h-12 mx-auto mb-4" />
                            <p className="font-semibold">A IA está procurando as melhores receitas...</p>
                        </div>
                    )}
                    {error && (
                        <div className="text-center text-red-600 bg-red-50 p-6 rounded-lg">
                            <h4 className="font-bold">Erro ao buscar receitas</h4>
                            <p>{error}</p>
                        </div>
                    )}
                    {!isLoading && !error && recipes.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recipes.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} isFavorite={favoriteRecipes.some(r => r.id === recipe.id)} />)}
                        </div>
                    )}
                    {!isLoading && !error && recipes.length === 0 && (
                        <div className="text-center text-slate-400 p-10 bg-white rounded-2xl border border-gray-100">
                            <BookOpenIcon className="w-16 h-16 mx-auto mb-4" />
                            <p className="font-semibold">As receitas encontradas aparecerão aqui</p>
                            <p className="text-sm">Use o campo de busca para começar a explorar.</p>
                        </div>
                    )}
                </div>
                </>
            )}

            {activeTab === 'favorites' && (
                 <div className="min-h-[400px]">
                    {favoriteRecipes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                             {favoriteRecipes.map(recipe => <RecipeCard key={recipe.id} recipe={recipe} isFavorite />)}
                        </div>
                    ) : (
                        <div className="text-center text-slate-400 p-10 bg-white rounded-2xl border border-gray-100">
                            <StarIcon className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <p className="font-semibold">Nenhuma receita favorita ainda</p>
                            <p className="text-sm">Clique na estrela de uma receita para salvá-la aqui.</p>
                        </div>
                    )}
                 </div>
            )}


            {selectedRecipe && (
                <Modal isOpen={!!selectedRecipe} onClose={() => setSelectedRecipe(null)} title={selectedRecipe.title} size="4xl">
                    <div className="absolute top-4 right-16">
                         <button onClick={handleFavoriteClick} className="p-2 rounded-full hover:bg-yellow-100 transition-colors" aria-label="Favoritar receita">
                            <StarIcon className={`w-6 h-6 ${favoriteRecipes.some(r => r.id === selectedRecipe.id) ? 'text-yellow-400 fill-current' : 'text-gray-400'}`} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                             <div className="aspect-square bg-slate-100 rounded-lg mb-6 flex items-center justify-center overflow-hidden relative group">
                                {isImageLoading ? (
                                    <div className="text-center text-slate-500">
                                        <LoadingSpinner className="w-10 h-10 mx-auto mb-2" />
                                        <p className="text-sm font-semibold">Gerando imagem...</p>
                                    </div>
                                ) : recipeImageCache[selectedRecipe.id] ? (
                                    <>
                                        <img src={recipeImageCache[selectedRecipe.id]} alt={selectedRecipe.title} className="w-full h-full object-cover"/>
                                        <div className="absolute bottom-4 right-4">
                                            <button onClick={handleShareRecipe} className="bg-slate-900/70 backdrop-blur-sm text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition-all hover:bg-slate-900 shadow-lg">
                                               <ShareIcon className="w-4 h-4"/> Compartilhar Receita
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-4">
                                        <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                        <button onClick={handleGenerateImage} className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors">
                                           <SparklesIcon className="w-4 h-4"/> Gerar imagem com IA
                                        </button>
                                        {!userData.isSubscribed && freeImagesRemaining > 0 && (
                                            <p className="text-xs text-slate-400 mt-2">Você tem {freeImagesRemaining} uso gratuito restante.</p>
                                        )}
                                        {!userData.isSubscribed && freeImagesRemaining <= 0 && (
                                            <p className="text-xs text-yellow-600 mt-2">Seu uso gratuito acabou. Assine o Pro para gerar imagens.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <h3 className="font-bold text-slate-800 text-lg mb-3">Informação Nutricional (por porção)</h3>
                             <div className="grid grid-cols-2 gap-3 text-sm">
                                <p className="text-slate-600">Calorias: <strong className="font-semibold text-slate-800">{selectedRecipe.nutritionalInfo.calories}</strong></p>
                                <p className="text-slate-600">Proteínas: <strong className="font-semibold text-slate-800">{selectedRecipe.nutritionalInfo.protein}</strong></p>
                                <p className="text-slate-600">Carboidratos: <strong className="font-semibold text-slate-800">{selectedRecipe.nutritionalInfo.carbs}</strong></p>
                                <p className="text-slate-600">Gorduras: <strong className="font-semibold text-slate-800">{selectedRecipe.nutritionalInfo.fat}</strong></p>
                             </div>
                        </div>
                        <div>
                             <p className="text-slate-600 mb-6">{selectedRecipe.description}</p>
                             <div className="flex gap-6 text-sm mb-6 border-y border-gray-200 py-3">
                                <div className="flex items-center gap-2 text-slate-600"><ClockIcon className="w-5 h-5 text-brand-green"/> <span className="font-semibold text-slate-800">{selectedRecipe.prepTime}</span></div>
                                <div className="flex items-center gap-2 text-slate-600"><BarChartIcon className="w-5 h-5 text-brand-blue"/> <span className="font-semibold text-slate-800">{selectedRecipe.difficulty}</span></div>
                                <div className="flex items-center gap-2 text-slate-600"><UsersIcon className="w-5 h-5 text-brand-orange"/> <span className="font-semibold text-slate-800">{selectedRecipe.servings}</span></div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg mb-3">Ingredientes</h3>
                                    <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
                                        {selectedRecipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg mb-3">Modo de Preparo</h3>
                                    <ol className="space-y-2 text-slate-600 list-decimal list-inside">
                                        {selectedRecipe.instructions.map((inst, i) => <li key={i}>{inst}</li>)}
                                    </ol>
                                </div>
                             </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default RecipesView;
