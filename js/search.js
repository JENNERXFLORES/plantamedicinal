// Sistema de búsqueda avanzada para PlantaMedicinal
// Funcionalidades de búsqueda inteligente, filtros y sugerencias

// Configuración del sistema de búsqueda
const searchConfig = {
    minSearchLength: 2,
    maxResults: 20,
    debounceTime: 300,
    popularSearches: [
        'manzanilla', 'dolor de cabeza', 'digestión', 'insomnio', 
        'anti-inflamatorio', 'sábila', 'jengibre', 'lavanda'
    ],
    categories: [
        'Digestiva', 'Dermatológica', 'Inmunológica', 'Aromática', 
        'Cardiovascular', 'Respiratoria', 'Nerviosa'
    ]
};

// Índice de búsqueda para optimización
const searchIndex = {
    plantas: new Map(),
    sintomas: new Map(),
    categorias: new Map(),
    initialized: false,

    // Inicializar índices de búsqueda
    init: () => {
        if (searchIndex.initialized) return;

        dataManager.plantas.forEach(planta => {
            // Indexar por nombre común
            const nombreComun = planta.nombre_comun.toLowerCase();
            searchIndex.addToIndex(searchIndex.plantas, nombreComun, planta);
            
            // Indexar por nombre científico
            const nombreCientifico = planta.nombre_cientifico.toLowerCase();
            searchIndex.addToIndex(searchIndex.plantas, nombreCientifico, planta);
            
            // Indexar por beneficios/síntomas
            planta.beneficios.forEach(beneficio => {
                const beneficioLower = beneficio.toLowerCase();
                searchIndex.addToIndex(searchIndex.sintomas, beneficioLower, planta);
            });
            
            // Indexar por categoría
            const categoria = planta.categoria.toLowerCase();
            searchIndex.addToIndex(searchIndex.categorias, categoria, planta);
            
            // Indexar palabras clave de descripción
            const descripcionWords = planta.descripcion.toLowerCase().split(' ');
            descripcionWords.forEach(word => {
                if (word.length > 3) {
                    searchIndex.addToIndex(searchIndex.plantas, word, planta);
                }
            });
        });

        searchIndex.initialized = true;
        console.log('Indice de busqueda inicializado');
    },

    // Agregar elemento al índice
    addToIndex: (index, key, item) => {
        if (!index.has(key)) {
            index.set(key, []);
        }
        
        const items = index.get(key);
        if (!items.find(existing => existing.id === item.id)) {
            items.push(item);
        }
    },

    // Buscar en índice
    searchInIndex: (index, term) => {
        const results = new Set();
        
        for (const [key, items] of index.entries()) {
            if (key.includes(term)) {
                items.forEach(item => results.add(item));
            }
        }
        
        return Array.from(results);
    }
};

// Motor de búsqueda inteligente
const searchEngine = {
    // Búsqueda principal
    search: (query, filters = {}) => {
        if (!query || query.length < searchConfig.minSearchLength) {
            return [];
        }

        const normalizedQuery = query.toLowerCase().trim();
        const tokens = normalizedQuery.split(' ').filter(token => token.length > 1);
        
        let results = new Set();

        // Búsqueda exacta
        const exactMatches = searchEngine.exactSearch(normalizedQuery);
        exactMatches.forEach(match => results.add(match));

        // Búsqueda por tokens
        tokens.forEach(token => {
            const tokenResults = searchEngine.tokenSearch(token);
            tokenResults.forEach(result => results.add(result));
        });

        // Búsqueda difusa (fuzzy)
        const fuzzyResults = searchEngine.fuzzySearch(normalizedQuery);
        fuzzyResults.forEach(result => results.add(result));

        let finalResults = Array.from(results);

        // Aplicar filtros
        finalResults = searchEngine.applyFilters(finalResults, filters);

        // Calcular relevancia y ordenar
        finalResults = searchEngine.calculateRelevance(finalResults, normalizedQuery, tokens);
        finalResults.sort((a, b) => b.relevance - a.relevance);

        return finalResults.slice(0, searchConfig.maxResults);
    },

    // Búsqueda exacta
    exactSearch: (query) => {
        const results = [];
        
        dataManager.plantas.forEach(planta => {
            const nombreComun = planta.nombre_comun.toLowerCase();
            const nombreCientifico = planta.nombre_cientifico.toLowerCase();
            
            if (nombreComun === query || nombreCientifico === query) {
                results.push({ ...planta, matchType: 'exact', relevance: 100 });
            }
        });
        
        return results;
    },

    // Búsqueda por tokens
    tokenSearch: (token) => {
        const results = [];
        
        // Buscar en nombres
        const plantaResults = searchIndex.searchInIndex(searchIndex.plantas, token);
        plantaResults.forEach(planta => {
            results.push({ ...planta, matchType: 'name', relevance: 80 });
        });
        
        // Buscar en síntomas
        const sintomaResults = searchIndex.searchInIndex(searchIndex.sintomas, token);
        sintomaResults.forEach(planta => {
            results.push({ ...planta, matchType: 'symptom', relevance: 70 });
        });
        
        // Buscar en categorías
        const categoriaResults = searchIndex.searchInIndex(searchIndex.categorias, token);
        categoriaResults.forEach(planta => {
            results.push({ ...planta, matchType: 'category', relevance: 60 });
        });
        
        return results;
    },

    // Búsqueda difusa (aproximada)
    fuzzySearch: (query) => {
        const results = [];
        const threshold = 0.6; // Umbral de similitud
        
        dataManager.plantas.forEach(planta => {
            const nombreComun = planta.nombre_comun.toLowerCase();
            const nombreCientifico = planta.nombre_cientifico.toLowerCase();
            
            // Calcular similitud usando distancia de Levenshtein
            const similarityComun = searchEngine.calculateSimilarity(query, nombreComun);
            const similarityCientifico = searchEngine.calculateSimilarity(query, nombreCientifico);
            
            const maxSimilarity = Math.max(similarityComun, similarityCientifico);
            
            if (maxSimilarity >= threshold) {
                results.push({ 
                    ...planta, 
                    matchType: 'fuzzy', 
                    relevance: maxSimilarity * 50,
                    similarity: maxSimilarity
                });
            }
        });
        
        return results;
    },

    // Calcular similitud entre strings (algoritmo de Jaro-Winkler simplificado)
    calculateSimilarity: (str1, str2) => {
        if (str1 === str2) return 1.0;
        
        const len1 = str1.length;
        const len2 = str2.length;
        
        if (len1 === 0 || len2 === 0) return 0.0;
        
        const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
        if (matchWindow < 1) return 0.0;
        
        const str1Matches = new Array(len1).fill(false);
        const str2Matches = new Array(len2).fill(false);
        
        let matches = 0;
        let transpositions = 0;
        
        // Encontrar coincidencias
        for (let i = 0; i < len1; i++) {
            const start = Math.max(0, i - matchWindow);
            const end = Math.min(i + matchWindow + 1, len2);
            
            for (let j = start; j < end; j++) {
                if (str2Matches[j] || str1[i] !== str2[j]) continue;
                str1Matches[i] = true;
                str2Matches[j] = true;
                matches++;
                break;
            }
        }
        
        if (matches === 0) return 0.0;
        
        // Contar transposiciones
        let k = 0;
        for (let i = 0; i < len1; i++) {
            if (!str1Matches[i]) continue;
            while (!str2Matches[k]) k++;
            if (str1[i] !== str2[k]) transpositions++;
            k++;
        }
        
        const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3.0;
        
        return jaro;
    },

    // Aplicar filtros a los resultados
    applyFilters: (results, filters) => {
        let filteredResults = [...results];
        
        if (filters.categoria && filters.categoria !== 'todos') {
            filteredResults = filteredResults.filter(planta => 
                planta.categoria.toLowerCase() === filters.categoria.toLowerCase()
            );
        }
        
        if (filters.rating) {
            filteredResults = filteredResults.filter(planta => 
                planta.rating >= parseFloat(filters.rating)
            );
        }
        
        if (filters.region) {
            filteredResults = filteredResults.filter(planta => 
                planta.region.toLowerCase().includes(filters.region.toLowerCase())
            );
        }
        
        return filteredResults;
    },

    // Calcular relevancia de los resultados
    calculateRelevance: (results, originalQuery, tokens) => {
        return results.map(result => {
            let relevance = result.relevance || 0;
            
            // Bonus por tipo de coincidencia
            switch (result.matchType) {
                case 'exact':
                    relevance += 50;
                    break;
                case 'name':
                    relevance += 30;
                    break;
                case 'symptom':
                    relevance += 20;
                    break;
                case 'category':
                    relevance += 10;
                    break;
            }
            
            // Bonus por popularidad
            relevance += (result.popularidad || 0) * 0.1;
            
            // Bonus por rating
            relevance += (result.rating || 0) * 5;
            
            // Bonus por múltiples coincidencias de tokens
            const matchingTokens = tokens.filter(token => {
                const nombreComun = result.nombre_comun.toLowerCase();
                const nombreCientifico = result.nombre_cientifico.toLowerCase();
                const beneficios = result.beneficios.join(' ').toLowerCase();
                
                return nombreComun.includes(token) || 
                       nombreCientifico.includes(token) || 
                       beneficios.includes(token);
            });
            
            relevance += matchingTokens.length * 10;
            
            return { ...result, relevance };
        });
    }
};

// Sistema de sugerencias inteligentes
const suggestionSystem = {
    // Generar sugerencias basadas en la consulta
    generateSuggestions: (query) => {
        if (!query || query.length < 2) {
            return suggestionSystem.getPopularSuggestions();
        }
        
        const normalizedQuery = query.toLowerCase();
        const suggestions = new Set();
        
        // Sugerencias de nombres de plantas
        dataManager.plantas.forEach(planta => {
            if (planta.nombre_comun.toLowerCase().includes(normalizedQuery)) {
                suggestions.add(planta.nombre_comun);
            }
            
            if (planta.nombre_cientifico.toLowerCase().includes(normalizedQuery)) {
                suggestions.add(planta.nombre_cientifico);
            }
        });
        
        // Sugerencias de síntomas/beneficios
        const allBeneficios = new Set();
        dataManager.plantas.forEach(planta => {
            planta.beneficios.forEach(beneficio => {
                if (beneficio.toLowerCase().includes(normalizedQuery)) {
                    allBeneficios.add(beneficio);
                }
            });
        });
        
        allBeneficios.forEach(beneficio => suggestions.add(beneficio));
        
        return Array.from(suggestions).slice(0, 8);
    },
    
    // Obtener sugerencias populares
    getPopularSuggestions: () => {
        return [...searchConfig.popularSearches];
    },
    
    // Mostrar sugerencias en la interfaz
    displaySuggestions: (suggestions, inputElement) => {
        let suggestionContainer = document.getElementById('searchSuggestions');
        
        if (!suggestionContainer) {
            suggestionContainer = document.createElement('div');
            suggestionContainer.id = 'searchSuggestions';
            suggestionContainer.className = 'absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50 hidden';
            inputElement.parentNode.appendChild(suggestionContainer);
        }
        
        if (suggestions.length === 0) {
            suggestionContainer.classList.add('hidden');
            return;
        }
        
        suggestionContainer.innerHTML = suggestions.map(suggestion => `
            <div class="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                 onclick="selectSuggestion('${suggestion}')">
                <i class="fas fa-search text-gray-400 mr-2"></i>
                ${suggestion}
            </div>
        `).join('');
        
        suggestionContainer.classList.remove('hidden');
    },
    
    // Ocultar sugerencias
    hideSuggestions: () => {
        const suggestionContainer = document.getElementById('searchSuggestions');
        if (suggestionContainer) {
            suggestionContainer.classList.add('hidden');
        }
    }
};

// Sistema de historial de búsqueda
const searchHistory = {
    maxHistorySize: 10,
    
    // Obtener historial del localStorage
    getHistory: () => {
        const history = localStorage.getItem('plantamedicinal_search_history');
        return history ? JSON.parse(history) : [];
    },
    
    // Agregar búsqueda al historial
    addToHistory: (query) => {
        if (!query || query.length < 2) return;
        
        let history = searchHistory.getHistory();
        
        // Remover si ya existe
        history = history.filter(item => item.query !== query);
        
        // Agregar al inicio
        history.unshift({
            query: query,
            timestamp: Date.now(),
            count: 1
        });
        
        // Mantener tamaño máximo
        history = history.slice(0, searchHistory.maxHistorySize);
        
        localStorage.setItem('plantamedicinal_search_history', JSON.stringify(history));
    },
    
    // Obtener búsquedas recientes
    getRecentSearches: () => {
        return searchHistory.getHistory().slice(0, 5);
    }
};

// Filtros avanzados
const advancedFilters = {
    // Mostrar panel de filtros avanzados
    show: () => {
        let filterPanel = document.getElementById('advancedFilters');
        
        if (!filterPanel) {
            filterPanel = advancedFilters.createFilterPanel();
            document.body.appendChild(filterPanel);
        }
        
        filterPanel.classList.remove('hidden');
    },
    
    // Crear panel de filtros
    createFilterPanel: () => {
        const panel = document.createElement('div');
        panel.id = 'advancedFilters';
        panel.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center p-4';
        
        panel.innerHTML = `
            <div class="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold text-gray-900">Filtros Avanzados</h3>
                    <button onclick="advancedFilters.hide()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="grid md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                        <select id="filterCategoria" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            <option value="">Todas las categorías</option>
                            ${searchConfig.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Rating mínimo</label>
                        <select id="filterRating" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            <option value="">Cualquier rating</option>
                            <option value="4">4+ estrellas</option>
                            <option value="3">3+ estrellas</option>
                            <option value="2">2+ estrellas</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Región</label>
                        <input type="text" id="filterRegion" placeholder="Ej: América del Sur" 
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
                        <select id="filterOrden" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                            <option value="relevancia">Relevancia</option>
                            <option value="nombre">Nombre A-Z</option>
                            <option value="rating">Rating más alto</option>
                            <option value="popularidad">Popularidad</option>
                        </select>
                    </div>
                </div>
                
                <div class="mt-6 flex justify-end space-x-4">
                    <button onclick="advancedFilters.clear()" 
                            class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                        Limpiar Filtros
                    </button>
                    <button onclick="advancedFilters.apply()" 
                            class="px-6 py-2 bg-verde-medicina text-white rounded-lg hover:bg-green-700">
                        Aplicar Filtros
                    </button>
                </div>
            </div>
        `;
        
        return panel;
    },
    
    // Ocultar panel de filtros
    hide: () => {
        const filterPanel = document.getElementById('advancedFilters');
        if (filterPanel) {
            filterPanel.classList.add('hidden');
        }
    },
    
    // Aplicar filtros
    apply: () => {
        const filters = {
            categoria: document.getElementById('filterCategoria')?.value,
            rating: document.getElementById('filterRating')?.value,
            region: document.getElementById('filterRegion')?.value,
            orden: document.getElementById('filterOrden')?.value
        };
        
        // Aplicar filtros a la búsqueda actual
        const searchInput = document.getElementById('searchInput');
        if (searchInput && searchInput.value) {
            const query = searchInput.value;
            const results = searchEngine.search(query, filters);
            searchSystem.displayResults(results);
        }
        
        advancedFilters.hide();
        utils.showNotification('Filtros aplicados', 'success');
    },
    
    // Limpiar filtros
    clear: () => {
        document.getElementById('filterCategoria').value = '';
        document.getElementById('filterRating').value = '';
        document.getElementById('filterRegion').value = '';
        document.getElementById('filterOrden').value = 'relevancia';
    }
};

// Funciones globales para la interfaz
window.selectSuggestion = (suggestion) => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = suggestion;
        searchSystem.performSearch();
        suggestionSystem.hideSuggestions();
    }
};

window.showAdvancedFilters = () => {
    advancedFilters.show();
};

// Extensión del sistema de búsqueda principal
searchSystem.performSearch = () => {
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('searchResults');
    
    if (!searchInput || !resultsContainer) return;
    
    const query = searchInput.value.trim();
    
    if (query.length < searchConfig.minSearchLength) {
        resultsContainer.classList.add('hidden');
        suggestionSystem.hideSuggestions();
        return;
    }
    
    // Agregar al historial
    searchHistory.addToHistory(query);
    
    // Realizar búsqueda
    const results = searchEngine.search(query);
    searchSystem.displayResults(results);
    
    // Ocultar sugerencias
    suggestionSystem.hideSuggestions();
};

// Inicialización del sistema de búsqueda
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar índice de búsqueda
    searchIndex.init();
    
    // Configurar eventos de búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // Sugerencias en tiempo real
        searchInput.addEventListener('input', utils.debounce(() => {
            const query = searchInput.value;
            if (query.length >= 1) {
                const suggestions = suggestionSystem.generateSuggestions(query);
                suggestionSystem.displaySuggestions(suggestions, searchInput);
            } else {
                suggestionSystem.hideSuggestions();
            }
        }, 200));
        
        // Ocultar sugerencias cuando pierde el foco
        searchInput.addEventListener('blur', () => {
            setTimeout(() => suggestionSystem.hideSuggestions(), 150);
        });
        
        // Mostrar sugerencias al hacer foco
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.length >= 1) {
                const suggestions = suggestionSystem.generateSuggestions(searchInput.value);
                suggestionSystem.displaySuggestions(suggestions, searchInput);
            }
        });
    }
    
    // Cerrar filtros al hacer clic fuera
    document.addEventListener('click', (e) => {
        const filterPanel = document.getElementById('advancedFilters');
        if (e.target === filterPanel) {
            advancedFilters.hide();
        }
    });
    
    console.log('🔍 Sistema de búsqueda avanzada inicializado');
});
