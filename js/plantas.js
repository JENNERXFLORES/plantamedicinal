// Sistema de gestión de plantas medicinales para PlantaMedicinal
// Funcionalidades de visualización, filtrado y gestión de plantas

// Configuración del módulo de plantas
const plantasConfig = {
    itemsPerPage: 12,
    viewMode: 'grid', // 'grid' o 'list'
    currentPage: 1,
    totalPages: 1,
    currentFilters: {
        search: '',
        category: '',
        rating: '',
        region: '',
        sort: 'nombre'
    }
};

// Estado del módulo de plantas
const plantasState = {
    allPlantas: [],
    filteredPlantas: [],
    displayedPlantas: [],
    loading: false,
    selectedPlanta: null
};

// Placeholder local (data URI) para imágenes faltantes
const PLANT_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="%23e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-family="Arial" font-size="24">Planta</text></svg>`;

// Placeholder seguro (pre-codificado) para atributos HTML
const PLANT_PLACEHOLDER_SAFE = 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%23e5e7eb%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%236b7280%22 font-family=%22Arial%22 font-size=%2224%22>Planta</text></svg>';

// Gestor principal de plantas
const plantasManager = {
    // Inicializar el módulo
    init: () => {
        plantasManager.loadPlantas();
        plantasManager.setupEventListeners();
        plantasManager.setupFilters();
        
        // Cargar vista inicial
        plantasManager.renderPlantas();
        
        console.log('🌿 Sistema de plantas inicializado');
    },

    // Cargar datos de plantas
    loadPlantas: async () => {
        plantasState.loading = true;
        plantasManager.showLoading(true);

        try {
            // Intentar via API
            if (window.apiAdapter && typeof window.apiAdapter.getPlantas === 'function') {
                const f = plantasConfig.currentFilters;
                const apiFilters = {
                    categoria: f.category || '',
                    region: f.region || '',
                    rating: f.rating || '',
                    search: f.search || '',
                    sort: f.sort || 'nombre'
                };
                const resp = await window.apiAdapter.getPlantas(1, plantasConfig.itemsPerPage, apiFilters);
                if (resp && resp.success) {
                    const raw = resp.data || resp;
                    // Aceptar tanto {plantas: [...]} como array directo
                    const list = Array.isArray(raw) ? raw : (raw.plantas || []);
                    // Mapear propiedades del backend al formato esperado por la UI
                    const mapped = list.map(p => ({
                        id: p.id,
                        nombre_comun: p.nombre || p.nombre_comun || '',
                        nombre_cientifico: p.nombre_cientifico || '',
                        descripcion: p.descripcion || '',
                        beneficios: Array.isArray(p.beneficios) ? p.beneficios : (p.beneficios ? Object.values(p.beneficios) : []),
                        categoria: p.categoria || '',
                        imagen: p.imagen || p.imagen_url || PLANT_PLACEHOLDER_SAFE,
                        rating: p.rating || p.calificacion_promedio || 0,
                        referencias_cientificas: p.referencias_cientificas || p.total_recetas || 0,
                        region: p.origen || p.region || ''
                    }));

                    plantasState.allPlantas = mapped;
                    plantasState.filteredPlantas = mapped;

                    plantasManager.applyCurrentFilters();
                    plantasManager.updatePagination();
                    plantasManager.renderPlantas();
                    return;
                }
            }

            // Fallback local si la API no está disponible
            plantasState.allPlantas = [...dataManager.plantas];
            plantasState.filteredPlantas = [...dataManager.plantas];
        } catch (e) {
            console.warn('Fallo cargando plantas desde API, usando datos locales:', e.message);
            plantasState.allPlantas = [...dataManager.plantas];
            plantasState.filteredPlantas = [...dataManager.plantas];
        } finally {
            plantasManager.applyCurrentFilters();
            plantasManager.updatePagination();
            plantasManager.renderPlantas();
            plantasState.loading = false;
            plantasManager.showLoading(false);
            plantasManager.updateSearchStats();
        }
    },

    // Configurar event listeners
    setupEventListeners: () => {
        // Búsqueda
        const searchInput = document.getElementById('plantSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', utils.debounce(() => {
                plantasConfig.currentFilters.search = searchInput.value;
                plantasManager.applyFilters();
            }, 300));
        }

        // Filtro de categoría
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                plantasConfig.currentFilters.category = categoryFilter.value;
                plantasManager.applyFilters();
            });
        }

        // Ordenamiento
        const sortBy = document.getElementById('sortBy');
        if (sortBy) {
            sortBy.addEventListener('change', () => {
                plantasConfig.currentFilters.sort = sortBy.value;
                plantasManager.applyFilters();
            });
        }

        // Cerrar modal de detalles
        document.addEventListener('click', (e) => {
            const modal = document.getElementById('plantDetailModal');
            if (e.target === modal) {
                plantasManager.closeDetailModal();
            }
        });

        // Tecla ESC para cerrar modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                plantasManager.closeDetailModal();
            }
        });
    },

    // Configurar filtros
    setupFilters: () => {
        // Los filtros se configuran en los event listeners
        plantasManager.loadFilterStates();
    },

    // Cargar estados de filtros desde localStorage
    loadFilterStates: () => {
        const savedFilters = localStorage.getItem('plantamedicinal_filters');
        if (savedFilters) {
            try {
                const filters = JSON.parse(savedFilters);
                Object.assign(plantasConfig.currentFilters, filters);
                
                // Aplicar filtros guardados a la interfaz
                plantasManager.updateFilterUI();
            } catch (error) {
                console.warn('Error cargando filtros guardados:', error);
            }
        }
    },

    // Actualizar interfaz de filtros
    updateFilterUI: () => {
        const searchInput = document.getElementById('plantSearchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        const sortBy = document.getElementById('sortBy');

        if (searchInput) searchInput.value = plantasConfig.currentFilters.search;
        if (categoryFilter) categoryFilter.value = plantasConfig.currentFilters.category;
        if (sortBy) sortBy.value = plantasConfig.currentFilters.sort;
    },

    // Aplicar filtros actuales
    applyFilters: () => {
        plantasConfig.currentPage = 1; // Resetear a primera página
        plantasManager.applyCurrentFilters();
        plantasManager.updatePagination();
        plantasManager.renderPlantas();
        plantasManager.updateSearchStats();
        
        // Guardar filtros
        plantasManager.saveFilterStates();
    },

    // Lógica de filtrado
    applyCurrentFilters: () => {
        let filtered = [...plantasState.allPlantas];
        const filters = plantasConfig.currentFilters;

        // Filtro de búsqueda
        if (filters.search && filters.search.trim()) {
            const searchTerm = filters.search.toLowerCase().trim();
            filtered = filtered.filter(planta => 
                planta.nombre_comun.toLowerCase().includes(searchTerm) ||
                planta.nombre_cientifico.toLowerCase().includes(searchTerm) ||
                planta.descripcion.toLowerCase().includes(searchTerm) ||
                planta.beneficios.some(beneficio => 
                    beneficio.toLowerCase().includes(searchTerm)
                ) ||
                planta.categoria.toLowerCase().includes(searchTerm)
            );
        }

        // Filtro de categoría
        if (filters.category) {
            filtered = filtered.filter(planta => planta.categoria === filters.category);
        }

        // Filtro de rating (si se implementa en filtros avanzados)
        if (filters.rating) {
            filtered = filtered.filter(planta => planta.rating >= parseFloat(filters.rating));
        }

        // Filtro de región (si se implementa en filtros avanzados)
        if (filters.region) {
            filtered = filtered.filter(planta => 
                planta.region.toLowerCase().includes(filters.region.toLowerCase())
            );
        }

        // Ordenamiento
        filtered = plantasManager.sortPlantas(filtered, filters.sort);

        plantasState.filteredPlantas = filtered;
    },

    // Ordenar plantas
    sortPlantas: (plantas, sortBy) => {
        const sorted = [...plantas];
        
        switch (sortBy) {
            case 'nombre':
                sorted.sort((a, b) => a.nombre_comun.localeCompare(b.nombre_comun));
                break;
            case 'rating':
                sorted.sort((a, b) => b.rating - a.rating);
                break;
            case 'popularidad':
                sorted.sort((a, b) => (b.popularidad || 0) - (a.popularidad || 0));
                break;
            case 'referencias':
                sorted.sort((a, b) => (b.referencias_cientificas || 0) - (a.referencias_cientificas || 0));
                break;
            default:
                // Mantener orden original
                break;
        }
        
        return sorted;
    },

    // Guardar estados de filtros
    saveFilterStates: () => {
        localStorage.setItem('plantamedicinal_filters', JSON.stringify(plantasConfig.currentFilters));
    },

    // Mostrar/ocultar loading
    showLoading: (show) => {
        const spinner = document.getElementById('loadingSpinner');
        const container = document.getElementById('plantasContainer');
        
        if (show) {
            if (spinner) spinner.classList.remove('hidden');
            if (container) container.classList.add('hidden');
        } else {
            if (spinner) spinner.classList.add('hidden');
            if (container) container.classList.remove('hidden');
        }
    },

    // Renderizar plantas
    renderPlantas: () => {
        const container = document.getElementById('plantasContainer');
        if (!container) return;

        const startIndex = (plantasConfig.currentPage - 1) * plantasConfig.itemsPerPage;
        const endIndex = startIndex + plantasConfig.itemsPerPage;
        const plantasToShow = plantasState.filteredPlantas.slice(startIndex, endIndex);

        if (plantasToShow.length === 0) {
            plantasManager.showNoResults(true);
            return;
        } else {
            plantasManager.showNoResults(false);
        }

        // Actualizar clases del container según el modo de vista
        if (plantasConfig.viewMode === 'grid') {
            container.className = 'grid md:grid-cols-2 lg:grid-cols-3 gap-8';
        } else {
            container.className = 'space-y-6';
        }

        // Renderizar plantas
        container.innerHTML = plantasToShow.map(planta => 
            plantasConfig.viewMode === 'grid' 
                ? plantasManager.renderPlantaCard(planta)
                : plantasManager.renderPlantaListItem(planta)
        ).join('');

        plantasState.displayedPlantas = plantasToShow;
    },

    // Renderizar tarjeta de planta (vista grid)
    renderPlantaCard: (planta) => {
        const isFavorite = appState.favorites.includes(planta.id);
        
        return `
            <div class="plant-card cursor-pointer group" onclick="plantasManager.showPlantDetails(${planta.id})">
                <div class="relative overflow-hidden rounded-xl mb-4">
                    <img src="${planta.imagen || PLANT_PLACEHOLDER_SAFE}" alt="${planta.nombre_comun}"
                         onerror='this.onerror=null;this.src="${PLANT_PLACEHOLDER_SAFE}"' 
                         class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300">
                    <div class="absolute top-3 right-3">
                        <button onclick="event.stopPropagation(); toggleFavorite(${planta.id})" 
                                class="bg-white bg-opacity-80 backdrop-blur-sm rounded-full p-2 hover:bg-opacity-100 transition-all">
                            <i class="fas fa-heart ${isFavorite ? 'text-red-500' : 'text-gray-400'}"></i>
                        </button>
                    </div>
                    <div class="absolute bottom-3 left-3">
                        <span class="badge badge-info">${planta.categoria}</span>
                    </div>
                </div>
                
                <div class="space-y-3">
                    <div>
                        <h3 class="font-bold text-xl text-gray-900 group-hover:text-verde-medicina transition-colors">
                            ${planta.nombre_comun}
                        </h3>
                        <p class="text-sm text-gray-600 italic">${planta.nombre_cientifico}</p>
                    </div>
                    
                    <p class="text-gray-700 text-sm line-clamp-2">${planta.descripcion}</p>
                    
                    <div class="flex flex-wrap gap-1">
                        ${planta.beneficios.slice(0, 3).map(beneficio => 
                            `<span class="badge badge-success text-xs">${beneficio}</span>`
                        ).join('')}
                        ${planta.beneficios.length > 3 ? `<span class="text-xs text-gray-500">+${planta.beneficios.length - 3} más</span>` : ''}
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <div class="rating-stars">
                                ${[1,2,3,4,5].map(i => 
                                    `<i class="fas fa-star text-sm ${i <= planta.rating ? 'text-dorado' : 'text-gray-300'}"></i>`
                                ).join('')}
                            </div>
                            <span class="text-sm text-gray-600">(${planta.rating})</span>
                        </div>
                        <div class="text-xs text-gray-500">
                            <i class="fas fa-flask mr-1"></i>${planta.referencias_cientificas} refs
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Renderizar item de planta (vista lista)
    renderPlantaListItem: (planta) => {
        const isFavorite = appState.favorites.includes(planta.id);
        
        return `
            <div class="plant-card cursor-pointer flex items-start space-x-6 p-6" onclick="plantasManager.showPlantDetails(${planta.id})">
                <div class="flex-shrink-0 relative">
                    <img src="${planta.imagen || PLANT_PLACEHOLDER_SAFE}" alt="${planta.nombre_comun}"
                         onerror='this.onerror=null;this.src="${PLANT_PLACEHOLDER_SAFE}"' 
                         class="w-24 h-24 rounded-lg object-cover">
                    <div class="absolute -top-2 -right-2">
                        <button onclick="event.stopPropagation(); toggleFavorite(${planta.id})" 
                                class="bg-white shadow-lg rounded-full p-1.5 hover:shadow-xl transition-all">
                            <i class="fas fa-heart text-sm ${isFavorite ? 'text-red-500' : 'text-gray-400'}"></i>
                        </button>
                    </div>
                </div>
                
                <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between mb-2">
                        <div>
                            <h3 class="font-bold text-xl text-gray-900 hover:text-verde-medicina transition-colors">
                                ${planta.nombre_comun}
                            </h3>
                            <p class="text-sm text-gray-600 italic">${planta.nombre_cientifico}</p>
                        </div>
                        <span class="badge badge-info">${planta.categoria}</span>
                    </div>
                    
                    <p class="text-gray-700 mb-3 line-clamp-2">${planta.descripcion}</p>
                    
                    <div class="flex flex-wrap gap-1 mb-3">
                        ${planta.beneficios.map(beneficio => 
                            `<span class="badge badge-success text-xs">${beneficio}</span>`
                        ).join('')}
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center space-x-1">
                                <div class="rating-stars">
                                    ${[1,2,3,4,5].map(i => 
                                        `<i class="fas fa-star text-sm ${i <= planta.rating ? 'text-dorado' : 'text-gray-300'}"></i>`
                                    ).join('')}
                                </div>
                                <span class="text-sm text-gray-600">(${planta.rating})</span>
                            </div>
                            <div class="text-sm text-gray-500">
                                <i class="fas fa-map-marker-alt mr-1"></i>${planta.region}
                            </div>
                        </div>
                        <div class="text-sm text-gray-500">
                            <i class="fas fa-flask mr-1"></i>${planta.referencias_cientificas} referencias científicas
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Mostrar/ocultar mensaje de no resultados
    showNoResults: (show) => {
        const noResults = document.getElementById('noResults');
        const container = document.getElementById('plantasContainer');
        
        if (show) {
            if (noResults) noResults.classList.remove('hidden');
            if (container) container.classList.add('hidden');
        } else {
            if (noResults) noResults.classList.add('hidden');
            if (container) container.classList.remove('hidden');
        }
    },

    // Actualizar estadísticas de búsqueda
    updateSearchStats: () => {
        const statsElement = document.getElementById('searchStats');
        if (!statsElement) return;

        const total = plantasState.filteredPlantas.length;
        const showing = Math.min(plantasConfig.itemsPerPage, total - (plantasConfig.currentPage - 1) * plantasConfig.itemsPerPage);
        const start = total === 0 ? 0 : (plantasConfig.currentPage - 1) * plantasConfig.itemsPerPage + 1;
        const end = (plantasConfig.currentPage - 1) * plantasConfig.itemsPerPage + showing;

        if (total === 0) {
            statsElement.textContent = 'No se encontraron plantas';
        } else if (total <= plantasConfig.itemsPerPage) {
            statsElement.textContent = `Mostrando ${total} plantas`;
        } else {
            statsElement.textContent = `Mostrando ${start}-${end} de ${total} plantas`;
        }
    },

    // Actualizar paginación
    updatePagination: () => {
        const total = plantasState.filteredPlantas.length;
        plantasConfig.totalPages = Math.ceil(total / plantasConfig.itemsPerPage);
        
        plantasManager.renderPagination();
    },

    // Renderizar paginación
    renderPagination: () => {
        const pagination = document.getElementById('pagination');
        if (!pagination || plantasConfig.totalPages <= 1) {
            if (pagination) pagination.innerHTML = '';
            return;
        }

        const currentPage = plantasConfig.currentPage;
        const totalPages = plantasConfig.totalPages;
        
        let html = '<nav class="flex space-x-2">';

        // Botón anterior
        html += `
            <button onclick="plantasManager.goToPage(${currentPage - 1})" 
                    ${currentPage === 1 ? 'disabled' : ''}
                    class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Números de página
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            html += `<button onclick="plantasManager.goToPage(1)" class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">1</button>`;
            if (startPage > 2) {
                html += '<span class="px-3 py-2">...</span>';
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button onclick="plantasManager.goToPage(${i})" 
                        class="px-3 py-2 border rounded-lg ${i === currentPage 
                            ? 'bg-verde-medicina text-white border-verde-medicina' 
                            : 'border-gray-300 hover:bg-gray-50'}">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += '<span class="px-3 py-2">...</span>';
            }
            html += `<button onclick="plantasManager.goToPage(${totalPages})" class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">${totalPages}</button>`;
        }

        // Botón siguiente
        html += `
            <button onclick="plantasManager.goToPage(${currentPage + 1})" 
                    ${currentPage === totalPages ? 'disabled' : ''}
                    class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        html += '</nav>';
        pagination.innerHTML = html;
    },

    // Ir a página específica
    goToPage: (page) => {
        if (page < 1 || page > plantasConfig.totalPages) return;
        
        plantasConfig.currentPage = page;
        plantasManager.renderPlantas();
        plantasManager.renderPagination();
        
        // Scroll suave al inicio del contenedor
        const container = document.getElementById('plantasContainer');
        if (container) {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    // Mostrar detalles de planta
    showPlantDetails: async (plantaId) => {
        const modal = document.getElementById('plantDetailModal');
        const content = document.getElementById('plantDetailContent');
        if (!modal || !content) return;

        try {
            // Cargar desde API
            const resp = await apiClient.get(apiConfig.endpoints.plantas.get, { id: plantaId });
            const data = resp.data || resp;
            const p = data.planta || data;
            if (!p) throw new Error('Planta no encontrada');

            // Mapear al formato de UI
            const planta = {
                id: p.id,
                nombre_comun: p.nombre || p.nombre_comun || '',
                nombre_cientifico: p.nombre_cientifico || '',
                descripcion: p.descripcion || '',
                beneficios: Array.isArray(p.beneficios) ? p.beneficios : (p.beneficios ? Object.values(p.beneficios) : []),
                categoria: p.categoria || '',
                imagen: p.imagen || p.imagen_url || PLANT_PLACEHOLDER,
                rating: p.rating || p.calificacion_promedio || 0,
                referencias_cientificas: p.referencias_cientificas || p.total_recetas || 0,
                region: p.origen || p.region || ''
            };

            plantasState.selectedPlanta = planta;
            content.innerHTML = plantasManager.renderPlantDetails(planta);
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        } catch (e) {
            console.error('Error cargando detalles:', e);
            if (window.responseUtils) {
                window.responseUtils.showError('No se pudieron cargar los detalles de la planta');
            } else {
                alert('No se pudieron cargar los detalles de la planta');
            }
        }
    },

    // Cerrar modal de detalles
    closeDetailModal: () => {
        const modal = document.getElementById('plantDetailModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
        plantasState.selectedPlanta = null;
    },

    // Renderizar detalles de planta
    renderPlantDetails: (planta) => {
        const isFavorite = appState.favorites.includes(planta.id);
        
        return `
            <div class="relative">
                <!-- Header con imagen -->
                <div class="relative h-64 bg-gradient-to-r from-verde-medicina to-green-700 overflow-hidden">
                    <img src="${planta.imagen}" alt="${planta.nombre_comun}" 
                         onerror='this.onerror=null;this.src="${PLANT_PLACEHOLDER_SAFE}"'
                         class="w-full h-full object-cover opacity-30">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div class="absolute bottom-6 left-6 text-white">
                        <h1 class="text-3xl font-bold">${planta.nombre_comun}</h1>
                        <p class="text-lg italic opacity-90">${planta.nombre_cientifico}</p>
                        <div class="mt-2">
                            <span class="badge bg-dorado text-verde-medicina">${planta.categoria}</span>
                        </div>
                    </div>
                    <button onclick="plantasManager.closeDetailModal()" 
                            class="absolute top-4 right-4 bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-3 hover:bg-opacity-30 transition-all text-white">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <!-- Contenido -->
                <div class="p-8">
                    <!-- Rating y acciones -->
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center space-x-2">
                                <div class="rating-stars">
                                    ${[1,2,3,4,5].map(i => 
                                        `<i class="fas fa-star text-lg ${i <= planta.rating ? 'text-dorado' : 'text-gray-300'}"></i>`
                                    ).join('')}
                                </div>
                                <span class="text-lg font-medium">(${planta.rating})</span>
                            </div>
                            <div class="text-gray-500">
                                <i class="fas fa-flask mr-1"></i>${planta.referencias_cientificas} referencias científicas
                            </div>
                        </div>
                        <div class="flex items-center space-x-3">
                            <button onclick="toggleFavorite(${planta.id}); plantasManager.updateFavoriteButton(${planta.id})" 
                                    id="favoriteBtn_${planta.id}"
                                    class="px-4 py-2 border-2 rounded-lg transition-all ${isFavorite 
                                        ? 'border-red-500 text-red-500 bg-red-50' 
                                        : 'border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-500'}">
                                <i class="fas fa-heart mr-2"></i>${isFavorite ? 'En Favoritos' : 'Agregar a Favoritos'}
                            </button>
                            <button class="px-4 py-2 bg-verde-medicina text-white rounded-lg hover:bg-green-700 transition-colors">
                                <i class="fas fa-share mr-2"></i>Compartir
                            </button>
                        </div>
                    </div>
                    
                    <!-- Grid de información -->
                    <div class="grid md:grid-cols-2 gap-8">
                        <!-- Información general -->
                        <div class="space-y-6">
                            <div>
                                <h3 class="text-xl font-bold text-gray-900 mb-3">Descripción</h3>
                                <p class="text-gray-700 leading-relaxed">${planta.descripcion}</p>
                            </div>
                            
                            <div>
                                <h3 class="text-xl font-bold text-gray-900 mb-3">Beneficios y Usos</h3>
                                <div class="flex flex-wrap gap-2">
                                    ${planta.beneficios.map(beneficio => 
                                        `<span class="badge badge-success">${beneficio}</span>`
                                    ).join('')}
                                </div>
                                <p class="text-gray-600 mt-3 text-sm">${planta.usos_tradicionales}</p>
                            </div>
                            
                            <div>
                                <h3 class="text-xl font-bold text-gray-900 mb-3">Origen y Distribución</h3>
                                <div class="flex items-center text-gray-600">
                                    <i class="fas fa-map-marker-alt mr-2"></i>
                                    <span>${planta.region}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Información de seguridad -->
                        <div class="space-y-6">
                            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h3 class="text-xl font-bold text-gray-900 mb-3 flex items-center">
                                    <i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
                                    Contraindicaciones
                                </h3>
                                <p class="text-gray-700">${planta.contraindicaciones}</p>
                            </div>
                            
                            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 class="text-xl font-bold text-gray-900 mb-3 flex items-center">
                                    <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                                    Información Adicional
                                </h3>
                                <div class="space-y-2 text-sm text-gray-600">
                                    <div class="flex justify-between">
                                        <span>Popularidad:</span>
                                        <div class="flex items-center">
                                            <div class="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                                <div class="bg-verde-medicina h-2 rounded-full" style="width: ${planta.popularidad}%"></div>
                                            </div>
                                            <span>${planta.popularidad}%</span>
                                        </div>
                                    </div>
                                    <div class="flex justify-between">
                                        <span>Referencias científicas:</span>
                                        <span>${planta.referencias_cientificas} estudios</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="text-center">
                                <button onclick="alert('Funcionalidad próximamente disponible')" 
                                        class="w-full px-6 py-3 bg-gradient-to-r from-verde-medicina to-green-600 text-white rounded-lg hover:shadow-lg transition-all">
                                    <i class="fas fa-book mr-2"></i>Ver Recetas Relacionadas
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Actualizar botón de favoritos en modal
    updateFavoriteButton: (plantaId) => {
        const btn = document.getElementById(`favoriteBtn_${plantaId}`);
        if (!btn) return;

        const isFavorite = appState.favorites.includes(plantaId);
        
        if (isFavorite) {
            btn.className = 'px-4 py-2 border-2 border-red-500 text-red-500 bg-red-50 rounded-lg transition-all';
            btn.innerHTML = '<i class="fas fa-heart mr-2"></i>En Favoritos';
        } else {
            btn.className = 'px-4 py-2 border-2 border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-500 rounded-lg transition-all';
            btn.innerHTML = '<i class="fas fa-heart mr-2"></i>Agregar a Favoritos';
        }
    }
};

// Funciones globales para la interfaz
window.setViewMode = (mode) => {
    plantasConfig.viewMode = mode;
    
    // Actualizar botones de vista
    const gridBtn = document.getElementById('gridView');
    const listBtn = document.getElementById('listView');
    
    if (gridBtn && listBtn) {
        if (mode === 'grid') {
            gridBtn.className = 'p-2 text-verde-medicina border border-verde-medicina rounded hover:bg-verde-medicina hover:text-white';
            listBtn.className = 'p-2 text-gray-400 border border-gray-300 rounded hover:bg-gray-100';
        } else {
            listBtn.className = 'p-2 text-verde-medicina border border-verde-medicina rounded hover:bg-verde-medicina hover:text-white';
            gridBtn.className = 'p-2 text-gray-400 border border-gray-300 rounded hover:bg-gray-100';
        }
    }
    
    // Re-renderizar plantas
    plantasManager.renderPlantas();
    
    // Guardar preferencia
    localStorage.setItem('plantamedicinal_view_mode', mode);
};

window.clearAllFilters = () => {
    // Limpiar filtros
    plantasConfig.currentFilters = {
        search: '',
        category: '',
        rating: '',
        region: '',
        sort: 'nombre'
    };
    
    // Actualizar UI
    plantasManager.updateFilterUI();
    plantasManager.applyFilters();
    
    utils.showNotification('Filtros limpiados', 'info');
};

// Extensión del sistema de favoritos para actualizar UI de plantas
const originalToggleFavorite = window.toggleFavorite;
window.toggleFavorite = (plantaId) => {
    originalToggleFavorite(plantaId);
    
    // Actualizar botón en modal si está abierto
    plantasManager.updateFavoriteButton(plantaId);
    
    // Re-renderizar plantas para actualizar iconos
    plantasManager.renderPlantas();
};

// Inicialización cuando la página está lista
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en la página de plantas
    if (window.location.pathname.includes('plantas.html') || document.getElementById('plantasContainer')) {
        // Cargar modo de vista guardado
        const savedViewMode = localStorage.getItem('plantamedicinal_view_mode');
        if (savedViewMode) {
            plantasConfig.viewMode = savedViewMode;
        }
        
        // Inicializar sistema de plantas
        plantasManager.init();
        
        // Configurar modo de vista inicial
        setViewMode(plantasConfig.viewMode);
        
        console.log('🌿 Página de plantas inicializada correctamente');
    }
});

