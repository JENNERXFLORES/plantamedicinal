// Sistema de gestión de recetas tradicionales para PlantaMedicinal
// Funcionalidades para visualizar, crear y gestionar recetas

// Configuración del módulo de recetas
const recetasConfig = {
    itemsPerPage: 12,
    currentPage: 1,
    totalPages: 1,
    currentFilters: {
        search: '',
        planta: '',
        estado: 'aprobada', // Solo mostrar aprobadas por defecto
        rating: '',
        sort: 'fecha'
    }
};

// Estado del módulo de recetas
const recetasState = {
    allRecetas: [],
    filteredRecetas: [],
    displayedRecetas: [],
    loading: false,
    selectedReceta: null,
    userRecetas: []
};

// Placeholder para imágenes faltantes
const RECIPE_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="%23e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-family="Arial" font-size="24">Receta</text></svg>`;

// Base de datos extendida de recetas (legacy)
const recetasDatabase = {
    recetas: [
        {
            id: 1,
            nombre: "Infusión calmante de manzanilla",
            planta_id: 1,
            planta_nombre: "Manzanilla",
            ingredientes: [
                "2 cucharadas de flores secas de manzanilla",
                "250ml de agua caliente",
                "Miel al gusto (opcional)",
                "Unas gotas de limón (opcional)"
            ],
            preparacion: "1. Hervir el agua hasta que alcance el punto de ebullición\n2. Agregar las flores de manzanilla secas\n3. Dejar reposar tapado durante 5-7 minutos\n4. Colar la infusión para retirar los restos vegetales\n5. Endulzar con miel si se desea\n6. Servir caliente",
            dosis: "1-2 tazas al día, preferentemente por la noche antes de dormir",
            tiempo_preparacion: "10 minutos",
            advertencias: "No exceder la dosis recomendada. Evitar en caso de alergia a plantas de la familia Asteraceae.",
            autor: "Comunidad Wayuu",
            autor_tipo: "proveedor",
            fecha_creacion: new Date('2024-01-15'),
            rating: 4.7,
            comentarios: 23,
            estado: "aprobada",
            beneficios: ["Relajación", "Digestión", "Insomnio"],
            categoria: "Digestiva",
            imagen: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400",
            dificultad: "Fácil",
            popularidad: 95,
            reportes: 0
        },
        {
            id: 2,
            nombre: "Gel cicatrizante de sábila",
            planta_id: 2,
            planta_nombre: "Sábila",
            ingredientes: [
                "1 hoja grande y fresca de sábila (aloe vera)",
                "1 cucharada de miel pura",
                "3-4 gotas de aceite esencial de lavanda",
                "1 cucharadita de aceite de vitamina E (opcional)"
            ],
            preparacion: "1. Lavar bien la hoja de sábila y dejarla escurrir\n2. Cortar la hoja por la mitad longitudinalmente\n3. Extraer cuidadosamente el gel transparente del interior\n4. Batir el gel hasta obtener consistencia homogénea\n5. Agregar la miel y mezclar bien\n6. Añadir las gotas de aceite de lavanda\n7. Si se desea, agregar la vitamina E\n8. Almacenar en recipiente limpio en refrigerador",
            dosis: "Aplicar sobre la zona afectada 2-3 veces al día hasta cicatrización",
            tiempo_preparacion: "15 minutos",
            advertencias: "Solo uso externo. Realizar prueba de alergia antes del primer uso. No aplicar en heridas profundas.",
            autor: "Dra. María González",
            autor_tipo: "usuario",
            fecha_creacion: new Date('2024-02-01'),
            rating: 4.9,
            comentarios: 15,
            estado: "aprobada",
            beneficios: ["Cicatrizante", "Hidratante", "Anti-inflamatorio"],
            categoria: "Dermatológica",
            imagen: "https://images.unsplash.com/photo-1596290147884-57e45c2b4c44?w=400",
            dificultad: "Intermedio",
            popularidad: 88,
            reportes: 0
        },
        {
            id: 3,
            nombre: "Tintura fortificante de equinácea",
            planta_id: 3,
            planta_nombre: "Equinácea",
            ingredientes: [
                "100g de raíz seca de equinácea",
                "500ml de alcohol etílico al 70%",
                "Frasco de vidrio oscuro",
                "Colador de tela fina"
            ],
            preparacion: "1. Triturar la raíz de equinácea hasta obtener polvo fino\n2. Colocar el polvo en el frasco de vidrio\n3. Cubrir completamente con alcohol\n4. Sellar herméticamente y etiquetar con fecha\n5. Dejar macerar en lugar oscuro durante 2-3 semanas\n6. Agitar suavemente cada 2-3 días\n7. Filtrar con colador de tela fina\n8. Almacenar en frasco oscuro",
            dosis: "20-30 gotas, 3 veces al día, diluidas en agua",
            tiempo_preparacion: "30 minutos (más 2-3 semanas de maceración)",
            advertencias: "No usar durante más de 8 semanas consecutivas. Evitar en enfermedades autoinmunes. Consultar médico antes de usar.",
            autor: "Comunidad Muisca",
            autor_tipo: "proveedor",
            fecha_creacion: new Date('2024-01-20'),
            rating: 4.3,
            comentarios: 8,
            estado: "aprobada",
            beneficios: ["Inmunológico", "Antiviral", "Fortalecimiento"],
            categoria: "Inmunológica",
            imagen: "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=400",
            dificultad: "Avanzado",
            popularidad: 72,
            reportes: 0
        },
        {
            id: 4,
            nombre: "Aceite relajante de lavanda",
            planta_id: 4,
            planta_nombre: "Lavanda",
            ingredientes: [
                "50g de flores secas de lavanda",
                "200ml de aceite de oliva extra virgen",
                "10ml de aceite de jojoba",
                "Frasco de vidrio oscuro"
            ],
            preparacion: "1. Colocar las flores de lavanda en el frasco\n2. Calentar suavemente el aceite de oliva (sin hervir)\n3. Verter el aceite caliente sobre las flores\n4. Agregar el aceite de jojoba\n5. Sellar y dejar reposar en lugar cálido por 2 semanas\n6. Filtrar presionando bien las flores\n7. Almacenar en frasco oscuro etiquetado",
            dosis: "Aplicar unas gotas en sienes, muñecas o difusor según necesidad",
            tiempo_preparacion: "20 minutos (más 2 semanas de maceración)",
            advertencias: "Solo uso externo. Evitar contacto con ojos. No usar durante embarazo.",
            autor: "Ana Herbolaria",
            autor_tipo: "usuario",
            fecha_creacion: new Date('2024-02-10'),
            rating: 4.6,
            comentarios: 12,
            estado: "aprobada",
            beneficios: ["Relajación", "Aromático", "Sueño"],
            categoria: "Aromática",
            imagen: "https://images.unsplash.com/photo-1611909023032-2d4b3a2e78b1?w=400",
            dificultad: "Intermedio",
            popularidad: 85,
            reportes: 0
        },
        {
            id: 5,
            nombre: "Jarabe expectorante de jengibre",
            planta_id: 5,
            planta_nombre: "Jengibre",
            ingredientes: [
                "100g de jengibre fresco",
                "200ml de agua",
                "150g de miel pura",
                "Jugo de 2 limones",
                "1 pizca de canela en polvo"
            ],
            preparacion: "1. Pelar y cortar el jengibre en rodajas finas\n2. Hervir el agua y agregar el jengibre\n3. Cocinar a fuego lento durante 15 minutos\n4. Colar y dejar enfriar el líquido\n5. Agregar la miel y mezclar bien\n6. Añadir el jugo de limón y la canela\n7. Almacenar en frasco esterilizado en refrigerador",
            dosis: "1-2 cucharadas, 3 veces al día durante síntomas",
            tiempo_preparacion: "30 minutos",
            advertencias: "Evitar en caso de úlceras gástricas. No exceder dosis en niños menores de 2 años.",
            autor: "Curandero José",
            autor_tipo: "proveedor",
            fecha_creacion: new Date('2024-02-05'),
            rating: 4.4,
            comentarios: 18,
            estado: "aprobada",
            beneficios: ["Expectorante", "Anti-inflamatorio", "Digestivo"],
            categoria: "Respiratoria",
            imagen: "https://images.unsplash.com/photo-1599481238640-4c1288750d7a?w=400",
            dificultad: "Intermedio",
            popularidad: 78,
            reportes: 0
        }
    ],

    // Obtener recetas con filtros
    getRecetas: (filtros = {}) => {
        let recetas = [...recetasDatabase.recetas];
        
        if (filtros.busqueda) {
            const termino = filtros.busqueda.toLowerCase();
            recetas = recetas.filter(receta => 
                receta.nombre.toLowerCase().includes(termino) ||
                receta.planta_nombre.toLowerCase().includes(termino) ||
                receta.autor.toLowerCase().includes(termino) ||
                receta.beneficios.some(beneficio => beneficio.toLowerCase().includes(termino)) ||
                receta.ingredientes.some(ingrediente => ingrediente.toLowerCase().includes(termino))
            );
        }
        
        if (filtros.planta && filtros.planta !== '') {
            recetas = recetas.filter(receta => receta.planta_id === parseInt(filtros.planta));
        }
        
        if (filtros.estado && filtros.estado !== '') {
            recetas = recetas.filter(receta => receta.estado === filtros.estado);
        }
        
        if (filtros.rating) {
            recetas = recetas.filter(receta => receta.rating >= parseFloat(filtros.rating));
        }
        
        return recetasDatabase.sortRecetas(recetas, filtros.sort || 'fecha');
    },

    // Ordenar recetas
    sortRecetas: (recetas, sortBy) => {
        const sorted = [...recetas];
        
        switch (sortBy) {
            case 'fecha':
                sorted.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion));
                break;
            case 'rating':
                sorted.sort((a, b) => b.rating - a.rating);
                break;
            case 'nombre':
                sorted.sort((a, b) => a.nombre.localeCompare(b.nombre));
                break;
            case 'comentarios':
                sorted.sort((a, b) => b.comentarios - a.comentarios);
                break;
            default:
                break;
        }
        
        return sorted;
    },

    // Obtener receta por ID
    getRecetaById: (id) => {
        return recetasDatabase.recetas.find(receta => receta.id === parseInt(id));
    },

    // Agregar nueva receta
    addReceta: (recetaData) => {
        const newReceta = {
            id: recetasDatabase.recetas.length + 1,
            ...recetaData,
            fecha_creacion: new Date(),
            rating: 0,
            comentarios: 0,
            estado: "pendiente",
            reportes: 0
        };
        
        recetasDatabase.recetas.push(newReceta);
        return newReceta;
    }
};

// Gestor principal de recetas
const recetasManager = {
    // Inicializar el módulo
    init: () => {
        recetasManager.loadRecetas();
        recetasManager.setupEventListeners();
        recetasManager.populatePlantaSelects();
        
        console.log('🥄 Sistema de recetas inicializado');
    },

    // Cargar datos de recetas (API primero, fallback a legacy)
    loadRecetas: async () => {
        recetasState.loading = true;
        recetasManager.showLoading(true);

        try {
            if (window.apiAdapter && typeof window.apiAdapter.getRecetas === 'function') {
                const f = recetasConfig.currentFilters;
                const apiFilters = {
                    planta_id: f.planta || '',
                    categoria: f.categoria || '',
                    dificultad: f.dificultad || '',
                    rating: f.rating || '',
                    search: f.search || '',
                    sort: f.sort || 'fecha'
                };
                const resp = await window.apiAdapter.getRecetas(1, 100, apiFilters);
                if (resp && resp.success) {
                    const raw = resp.data || resp;
                    const list = Array.isArray(raw) ? raw : (raw.recetas || []);
                    const mapped = list.map(r => ({
                        id: r.id,
                        nombre: r.nombre || r.titulo || '',
                        planta_id: r.planta_id || null,
                        planta_nombre: r.planta_nombre || r.planta_nombre_comun || '',
                        ingredientes: Array.isArray(r.ingredientes) ? r.ingredientes : (r.ingredientes ? Object.values(r.ingredientes) : []),
                        preparacion: Array.isArray(r.preparacion) ? r.preparacion.join('\n') : (r.preparacion || ''),
                        dosis: r.dosis || '',
                        tiempo_preparacion: r.tiempo_preparacion || '',
                        advertencias: r.advertencias || '',
                        autor: r.autor || [r.autor_nombre, r.autor_apellido].filter(Boolean).join(' ') || '',
                        autor_tipo: r.autor_rol || '',
                        fecha_creacion: r.fecha_creacion || r.created_at || new Date(),
                        rating: r.rating || r.calificacion_promedio || 0,
                        comentarios: r.total_comentarios || 0,
                        estado: r.estado || r.estado_moderacion || 'aprobada',
                        beneficios: Array.isArray(r.beneficios) ? r.beneficios : (r.beneficios ? Object.values(r.beneficios) : []),
                        categoria: r.categoria || '',
                        imagen: r.imagen || r.imagen_url || RECIPE_PLACEHOLDER,
                        dificultad: r.dificultad || 'facil',
                        popularidad: r.popularidad || 0,
                        reportes: r.reportes || 0
                    }));
                    recetasState.allRecetas = mapped;
                    recetasManager.applyCurrentFilters();
                    recetasManager.updatePagination();
                    recetasManager.renderRecetas();
                    return;
                }
            }
            // Fallback legacy
            recetasState.allRecetas = recetasDatabase.getRecetas();
        } catch (e) {
            console.warn('Fallo carga de recetas desde API, usando datos locales:', e.message);
            recetasState.allRecetas = recetasDatabase.getRecetas();
        } finally {
            recetasManager.applyCurrentFilters();
            recetasManager.updatePagination();
            recetasManager.renderRecetas();
            recetasState.loading = false;
            recetasManager.showLoading(false);
            recetasManager.updateStats();
        }
    },

    // Configurar event listeners
    setupEventListeners: () => {
        // Búsqueda
        const searchInput = document.getElementById('recetaSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', utils.debounce(() => {
                recetasConfig.currentFilters.search = searchInput.value;
                recetasManager.applyFilters();
            }, 300));
        }

        // Filtros
        const plantaFilter = document.getElementById('plantaFilter');
        if (plantaFilter) {
            plantaFilter.addEventListener('change', () => {
                recetasConfig.currentFilters.planta = plantaFilter.value;
                recetasManager.applyFilters();
            });
        }

        const estadoFilter = document.getElementById('estadoFilter');
        if (estadoFilter) {
            estadoFilter.addEventListener('change', () => {
                recetasConfig.currentFilters.estado = estadoFilter.value;
                recetasManager.applyFilters();
            });
        }

        const ratingFilter = document.getElementById('ratingFilter');
        if (ratingFilter) {
            ratingFilter.addEventListener('change', () => {
                recetasConfig.currentFilters.rating = ratingFilter.value;
                recetasManager.applyFilters();
            });
        }

        // Ordenamiento
        const sortBy = document.getElementById('recetasSortBy');
        if (sortBy) {
            sortBy.addEventListener('change', () => {
                recetasConfig.currentFilters.sort = sortBy.value;
                recetasManager.applyFilters();
            });
        }

        // Formulario de nueva receta
        const form = document.getElementById('nuevaRecetaForm');
        if (form) {
            form.addEventListener('submit', recetasManager.handleFormSubmit);
        }

        // Cerrar modales
        document.addEventListener('click', (e) => {
            const detailModal = document.getElementById('recetaDetailModal');
            const formModal = document.getElementById('nuevaRecetaModal');
            
            if (e.target === detailModal) {
                recetasManager.closeDetailModal();
            }
            if (e.target === formModal) {
                recetasManager.closeFormModal();
            }
        });

        // Tecla ESC para cerrar modales
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                recetasManager.closeDetailModal();
                recetasManager.closeFormModal();
            }
        });
    },

    // Poblar selects de plantas
    populatePlantaSelects: () => {
        const plantaFilter = document.getElementById('plantaFilter');
        const recetaPlanta = document.getElementById('recetaPlanta');
        
        if (dataManager.plantas) {
            const options = dataManager.plantas.map(planta => 
                `<option value="${planta.id}">${planta.nombre_comun} (${planta.nombre_cientifico})</option>`
            ).join('');
            
            if (plantaFilter) {
                plantaFilter.innerHTML += options;
            }
            
            if (recetaPlanta) {
                recetaPlanta.innerHTML += options;
            }
        }
    },

    // Aplicar filtros
    applyFilters: () => {
        recetasConfig.currentPage = 1;
        recetasManager.applyCurrentFilters();
        recetasManager.updatePagination();
        recetasManager.renderRecetas();
        recetasManager.updateStats();
    },

    // Lógica de filtrado
    applyCurrentFilters: () => {
        const filtros = {
            busqueda: recetasConfig.currentFilters.search,
            planta: recetasConfig.currentFilters.planta,
            estado: recetasConfig.currentFilters.estado,
            rating: recetasConfig.currentFilters.rating,
            sort: recetasConfig.currentFilters.sort
        };
        
        recetasState.filteredRecetas = recetasDatabase.getRecetas(filtros);
    },

    // Mostrar/ocultar loading
    showLoading: (show) => {
        const spinner = document.getElementById('recetasLoadingSpinner');
        const container = document.getElementById('recetasContainer');
        
        if (show) {
            if (spinner) spinner.classList.remove('hidden');
            if (container) container.classList.add('hidden');
        } else {
            if (spinner) spinner.classList.add('hidden');
            if (container) container.classList.remove('hidden');
        }
    },

    // Renderizar recetas
    renderRecetas: () => {
        const container = document.getElementById('recetasContainer');
        if (!container) return;

        const startIndex = (recetasConfig.currentPage - 1) * recetasConfig.itemsPerPage;
        const endIndex = startIndex + recetasConfig.itemsPerPage;
        const recetasToShow = recetasState.filteredRecetas.slice(startIndex, endIndex);

        if (recetasToShow.length === 0) {
            recetasManager.showNoResults(true);
            return;
        } else {
            recetasManager.showNoResults(false);
        }

        container.innerHTML = recetasToShow.map(receta => 
            recetasManager.renderRecetaCard(receta)
        ).join('');

        recetasState.displayedRecetas = recetasToShow;
    },

    // Renderizar tarjeta de receta
    renderRecetaCard: (receta) => {
        const fechaFormateada = utils.formatDate(receta.fecha_creacion);
        const estadoBadge = recetasManager.getEstadoBadge(receta.estado);
        const dificultadColor = recetasManager.getDificultadColor(receta.dificultad);
        
        return `
            <div class="plant-card cursor-pointer group" onclick="recetasManager.showRecetaDetails(${receta.id})">
                <div class="relative overflow-hidden rounded-xl mb-4">
                    <img src="${receta.imagen || RECIPE_PLACEHOLDER}" alt="${receta.nombre}"
                         onerror="this.onerror=null;this.src='${RECIPE_PLACEHOLDER}'" 
                         class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300">
                    <div class="absolute top-3 left-3">
                        ${estadoBadge}
                    </div>
                    <div class="absolute top-3 right-3">
                        <span class="badge ${dificultadColor}">${receta.dificultad}</span>
                    </div>
                    <div class="absolute bottom-3 left-3 right-3">
                        <div class="flex flex-wrap gap-1">
                            ${receta.beneficios.slice(0, 2).map(beneficio => 
                                `<span class="badge badge-success text-xs">${beneficio}</span>`
                            ).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="space-y-3">
                    <div>
                        <h3 class="font-bold text-xl text-gray-900 group-hover:text-verde-medicina transition-colors line-clamp-2">
                            ${receta.nombre}
                        </h3>
                        <div class="flex items-center space-x-2 text-sm text-gray-600">
                            <i class="fas fa-leaf"></i>
                            <span>${receta.planta_nombre}</span>
                            <span>•</span>
                            <span>${receta.tiempo_preparacion}</span>
                        </div>
                    </div>
                    
                    <div class="text-sm text-gray-600">
                        <div class="flex items-center space-x-1">
                            <i class="fas fa-user"></i>
                            <span>Por ${receta.autor}</span>
                            ${receta.autor_tipo === 'proveedor' ? '<i class="fas fa-certificate text-dorado ml-1" title="Comunidad verificada"></i>' : ''}
                        </div>
                        <div class="flex items-center space-x-1 mt-1">
                            <i class="fas fa-calendar"></i>
                            <span>${fechaFormateada}</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <div class="rating-stars">
                                ${[1,2,3,4,5].map(i => 
                                    `<i class="fas fa-star text-sm ${i <= receta.rating ? 'text-dorado' : 'text-gray-300'}"></i>`
                                ).join('')}
                            </div>
                            <span class="text-sm text-gray-600">(${receta.rating})</span>
                        </div>
                        <div class="flex items-center space-x-3 text-xs text-gray-500">
                            <span><i class="fas fa-comment mr-1"></i>${receta.comentarios}</span>
                            <span><i class="fas fa-eye mr-1"></i>${receta.popularidad}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Obtener badge de estado
    getEstadoBadge: (estado) => {
        switch (estado) {
            case 'aprobada':
                return '<span class="badge bg-green-500 text-white">Aprobada</span>';
            case 'pendiente':
                return '<span class="badge bg-yellow-500 text-white">Pendiente</span>';
            case 'rechazada':
                return '<span class="badge bg-red-500 text-white">Rechazada</span>';
            default:
                return '';
        }
    },

    // Obtener color de dificultad
    getDificultadColor: (dificultad) => {
        switch (dificultad) {
            case 'Fácil':
                return 'bg-green-100 text-green-800';
            case 'Intermedio':
                return 'bg-yellow-100 text-yellow-800';
            case 'Avanzado':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    },

    // Mostrar/ocultar no resultados
    showNoResults: (show) => {
        const noResults = document.getElementById('recetasNoResults');
        const container = document.getElementById('recetasContainer');
        
        if (show) {
            if (noResults) noResults.classList.remove('hidden');
            if (container) container.classList.add('hidden');
        } else {
            if (noResults) noResults.classList.add('hidden');
            if (container) container.classList.remove('hidden');
        }
    },

    // Actualizar estadísticas
    updateStats: () => {
        const statsElement = document.getElementById('recetasStats');
        if (!statsElement) return;

        const total = recetasState.filteredRecetas.length;
        const aprobadas = recetasState.filteredRecetas.filter(r => r.estado === 'aprobada').length;
        const pendientes = recetasState.filteredRecetas.filter(r => r.estado === 'pendiente').length;

        statsElement.textContent = `${total} recetas encontradas • ${aprobadas} aprobadas • ${pendientes} pendientes`;
    },

    // Actualizar paginación
    updatePagination: () => {
        const total = recetasState.filteredRecetas.length;
        recetasConfig.totalPages = Math.ceil(total / recetasConfig.itemsPerPage);
        recetasManager.renderPagination();
    },

    // Renderizar paginación
    renderPagination: () => {
        const pagination = document.getElementById('recetasPagination');
        if (!pagination || recetasConfig.totalPages <= 1) {
            if (pagination) pagination.innerHTML = '';
            return;
        }

        const currentPage = recetasConfig.currentPage;
        const totalPages = recetasConfig.totalPages;
        
        let html = '<nav class="flex space-x-2">';

        // Botón anterior
        html += `
            <button onclick="recetasManager.goToPage(${currentPage - 1})" 
                    ${currentPage === 1 ? 'disabled' : ''}
                    class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Números de página (simplificado)
        for (let i = 1; i <= Math.min(totalPages, 5); i++) {
            html += `
                <button onclick="recetasManager.goToPage(${i})" 
                        class="px-3 py-2 border rounded-lg ${i === currentPage 
                            ? 'bg-verde-medicina text-white border-verde-medicina' 
                            : 'border-gray-300 hover:bg-gray-50'}">
                    ${i}
                </button>
            `;
        }

        // Botón siguiente
        html += `
            <button onclick="recetasManager.goToPage(${currentPage + 1})" 
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
        if (page < 1 || page > recetasConfig.totalPages) return;
        
        recetasConfig.currentPage = page;
        recetasManager.renderRecetas();
        recetasManager.renderPagination();
        
        // Scroll al inicio
        const container = document.getElementById('recetasContainer');
        if (container) {
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    // Mostrar detalles de receta
    showRecetaDetails: async (recetaId) => {
        const modal = document.getElementById('recetaDetailModal');
        const content = document.getElementById('recetaDetailContent');
        if (!modal || !content) return;

        try {
            let receta;
            // Intentar desde API
            try {
                const resp = await apiClient.get(apiConfig.endpoints.recetas.get, { id: recetaId });
                const data = resp.data || resp;
                const r = data.receta || data;
                receta = {
                    id: r.id,
                    nombre: r.nombre || r.titulo || '',
                    planta_id: r.planta_id || null,
                    planta_nombre: r.planta_nombre || r.planta_nombre_comun || '',
                    ingredientes: Array.isArray(r.ingredientes) ? r.ingredientes : (r.ingredientes ? Object.values(r.ingredientes) : []),
                    preparacion: Array.isArray(r.preparacion) ? r.preparacion.join('\n') : (r.preparacion || ''),
                    dosis: r.dosis || '',
                    tiempo_preparacion: r.tiempo_preparacion || '',
                    advertencias: r.advertencias || '',
                    autor: r.autor || [r.autor_nombre, r.autor_apellido].filter(Boolean).join(' ') || '',
                    autor_tipo: r.autor_rol || '',
                    fecha_creacion: r.fecha_creacion || r.created_at || new Date(),
                    rating: r.rating || r.calificacion_promedio || 0,
                    comentarios: r.total_comentarios || 0,
                    estado: r.estado || r.estado_moderacion || 'aprobada',
                    beneficios: Array.isArray(r.beneficios) ? r.beneficios : (r.beneficios ? Object.values(r.beneficios) : []),
                    categoria: r.categoria || '',
                    imagen: r.imagen || r.imagen_url || RECIPE_PLACEHOLDER,
                    dificultad: r.dificultad || 'facil',
                    popularidad: r.popularidad || 0,
                    reportes: r.reportes || 0
                };
            } catch (_) {
                receta = recetasDatabase.getRecetaById(recetaId);
            }

            if (!receta) throw new Error('Receta no encontrada');

            recetasState.selectedReceta = receta;
            content.innerHTML = recetasManager.renderRecetaDetails(receta);
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        } catch (e) {
            console.error('Error cargando detalles de receta:', e.message);
            if (window.responseUtils) responseUtils.showError('No se pudo cargar la receta');
        }
    },

    // Cerrar modal de detalles
    closeDetailModal: () => {
        const modal = document.getElementById('recetaDetailModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        document.body.style.overflow = '';
        recetasState.selectedReceta = null;
    },

    // Renderizar detalles de receta
    renderRecetaDetails: (receta) => {
        const fechaFormateada = utils.formatDate(receta.fecha_creacion);
        const estadoBadge = recetasManager.getEstadoBadge(receta.estado);
        const dificultadColor = recetasManager.getDificultadColor(receta.dificultad);
        
        return `
            <div class="relative">
                <!-- Header -->
                <div class="relative h-64 bg-gradient-to-r from-tierra to-yellow-800 overflow-hidden">
                    <img src="${receta.imagen}" alt="${receta.nombre}" 
                         class="w-full h-full object-cover opacity-30">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div class="absolute bottom-6 left-6 text-white">
                        <div class="flex items-center space-x-3 mb-2">
                            ${estadoBadge}
                            <span class="badge ${dificultadColor}">${receta.dificultad}</span>
                        </div>
                        <h1 class="text-3xl font-bold mb-2">${receta.nombre}</h1>
                        <div class="flex items-center space-x-4 text-sm opacity-90">
                            <span><i class="fas fa-leaf mr-1"></i>${receta.planta_nombre}</span>
                            <span><i class="fas fa-clock mr-1"></i>${receta.tiempo_preparacion}</span>
                            <span><i class="fas fa-user mr-1"></i>${receta.autor}</span>
                        </div>
                    </div>
                    <button onclick="recetasManager.closeDetailModal()" 
                            class="absolute top-4 right-4 bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-3 hover:bg-opacity-30 transition-all text-white">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <!-- Contenido -->
                <div class="p-8">
                    <!-- Rating y beneficios -->
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center space-x-4">
                            <div class="flex items-center space-x-2">
                                <div class="rating-stars">
                                    ${[1,2,3,4,5].map(i => 
                                        `<i class="fas fa-star text-lg ${i <= receta.rating ? 'text-dorado' : 'text-gray-300'}"></i>`
                                    ).join('')}
                                </div>
                                <span class="text-lg font-medium">(${receta.rating})</span>
                            </div>
                            <span class="text-gray-500">•</span>
                            <span class="text-gray-600">${receta.comentarios} comentarios</span>
                        </div>
                        <div class="flex flex-wrap gap-1">
                            ${receta.beneficios.map(beneficio => 
                                `<span class="badge badge-success">${beneficio}</span>`
                            ).join('')}
                        </div>
                    </div>
                    
                    <!-- Grid de contenido -->
                    <div class="grid md:grid-cols-2 gap-8">
                        <!-- Ingredientes -->
                        <div>
                            <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <i class="fas fa-list-ul text-verde-medicina mr-2"></i>
                                Ingredientes
                            </h3>
                            <ul class="space-y-2">
                                ${receta.ingredientes.map(ingrediente => 
                                    `<li class="flex items-start">
                                        <i class="fas fa-check-circle text-verde-claro mt-1 mr-2 flex-shrink-0"></i>
                                        <span class="text-gray-700">${ingrediente}</span>
                                    </li>`
                                ).join('')}
                            </ul>
                        </div>
                        
                        <!-- Información adicional -->
                        <div class="space-y-6">
                            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 class="font-semibold text-gray-900 mb-2 flex items-center">
                                    <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                                    Información General
                                </h4>
                                <div class="space-y-2 text-sm text-gray-600">
                                    <div><strong>Dosis:</strong> ${receta.dosis}</div>
                                    <div><strong>Tiempo:</strong> ${receta.tiempo_preparacion}</div>
                                    <div><strong>Dificultad:</strong> ${receta.dificultad}</div>
                                    <div><strong>Fecha:</strong> ${fechaFormateada}</div>
                                </div>
                            </div>
                            
                            ${receta.advertencias ? `
                            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h4 class="font-semibold text-gray-900 mb-2 flex items-center">
                                    <i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
                                    Advertencias
                                </h4>
                                <p class="text-sm text-gray-700">${receta.advertencias}</p>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Preparación -->
                    <div class="mt-8">
                        <h3 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
                            <i class="fas fa-mortar-pestle text-verde-medicina mr-2"></i>
                            Preparación
                        </h3>
                        <div class="bg-gray-50 rounded-lg p-6">
                            <div class="space-y-3">
                                ${receta.preparacion.split('\n').map((paso, index) => 
                                    `<div class="flex items-start space-x-3">
                                        <span class="flex items-center justify-center w-8 h-8 bg-verde-medicina text-white rounded-full text-sm font-bold flex-shrink-0">
                                            ${index + 1}
                                        </span>
                                        <p class="text-gray-700 pt-1">${paso.replace(/^\d+\.\s*/, '')}</p>
                                    </div>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Acciones -->
                    <div class="mt-8 flex justify-center space-x-4">
                        <button class="px-6 py-3 bg-verde-medicina text-white rounded-lg hover:bg-green-700 transition-colors">
                            <i class="fas fa-heart mr-2"></i>Guardar Favorita
                        </button>
                        <button class="px-6 py-3 border border-verde-medicina text-verde-medicina rounded-lg hover:bg-verde-medicina hover:text-white transition-colors">
                            <i class="fas fa-share mr-2"></i>Compartir
                        </button>
                        <button class="px-6 py-3 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                            <i class="fas fa-print mr-2"></i>Imprimir
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // Manejar envío de formulario
    handleFormSubmit: (e) => {
        e.preventDefault();
        
        if (!authState.isAuthenticated) {
            utils.showNotification('Debes iniciar sesión para compartir recetas', 'warning');
            mostrarLogin();
            return;
        }
        
        const formData = {
            nombre: document.getElementById('recetaNombre').value,
            planta_id: parseInt(document.getElementById('recetaPlanta').value),
            ingredientes: document.getElementById('recetaIngredientes').value.split('\n').filter(i => i.trim()),
            preparacion: document.getElementById('recetaPreparacion').value,
            dosis: document.getElementById('recetaDosis').value,
            tiempo_preparacion: document.getElementById('recetaTiempo').value,
            advertencias: document.getElementById('recetaAdvertencias').value,
            autor: `${authState.currentUser.nombre} ${authState.currentUser.apellido}`,
            autor_tipo: authState.currentUser.rol === 'proveedor' ? 'proveedor' : 'usuario'
        };
        
        const planta = dataManager.getPlantaById(formData.planta_id);
        if (planta) {
            formData.planta_nombre = planta.nombre_comun;
            formData.categoria = planta.categoria;
            formData.imagen = planta.imagen;
        }
        
        // Agregar receta
        const nuevaReceta = recetasDatabase.addReceta(formData);
        
        // Cerrar modal y mostrar éxito
        recetasManager.closeFormModal();
        utils.showNotification('Receta enviada para revisión exitosamente', 'success');
        
        // Recargar lista si está mostrando pendientes
        if (recetasConfig.currentFilters.estado === 'pendiente' || recetasConfig.currentFilters.estado === '') {
            recetasManager.loadRecetas();
        }
    },

    // Cerrar modal de formulario
    closeFormModal: () => {
        const modal = document.getElementById('nuevaRecetaModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        // Limpiar formulario
        const form = document.getElementById('nuevaRecetaForm');
        if (form) {
            form.reset();
        }
        
        document.body.style.overflow = '';
    }
};

// Funciones globales para la interfaz
window.mostrarFormularioReceta = () => {
    if (!authState.isAuthenticated) {
        utils.showNotification('Debes iniciar sesión para compartir recetas', 'warning');
        mostrarLogin();
        return;
    }
    
    const modal = document.getElementById('nuevaRecetaModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
};

window.cerrarFormularioReceta = () => {
    recetasManager.closeFormModal();
};

// Inicialización cuando la página está lista
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en la página de recetas
    if (window.location.pathname.includes('recetas.html') || document.getElementById('recetasContainer')) {
        recetasManager.init();
        console.log('Pagina de recetas inicializada correctamente');
    }
});


