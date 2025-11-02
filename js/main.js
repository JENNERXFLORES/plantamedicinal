// PlantaMedicinal - Script principal
// Sistema de gestión para la plataforma de plantas medicinales

// Configuración global
const config = {
    apiBaseUrl: '/api',
    version: '1.0.0',
    features: {
        animations: true,
        darkMode: false,
        notifications: true
    }
};

// Estado global de la aplicación
const appState = {
    user: null,
    isLoggedIn: false,
    currentPage: 'inicio',
    searchResults: [],
    favorites: JSON.parse(localStorage.getItem('favorites')) || [],
    notifications: []
};

// Utilidades generales
const utils = {
    // Debounce para optimizar búsquedas
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Formatear fechas
    formatDate: (date) => {
        return new Date(date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    // Sanitizar HTML para prevenir XSS
    sanitizeHTML: (str) => {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    },

    // Generar ID único
    generateId: () => {
        return '_' + Math.random().toString(36).substr(2, 9);
    },

    // Mostrar notificaciones
    showNotification: (message, type = 'info', duration = 3000) => {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300`;
        
        const icon = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-triangle',
            warning: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };

        const colors = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-black',
            info: 'bg-blue-500 text-white'
        };

        notification.innerHTML = `
            <div class="flex items-center space-x-2 ${colors[type]}">
                <i class="${icon[type]}"></i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 hover:opacity-70">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        // Auto-remove
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    },

    // Scroll suave a sección
    scrollToSection: (sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
};

// Sistema de navegación
const navigation = {
    init: () => {
        // Actualizar navbar en scroll
        window.addEventListener('scroll', navigation.updateNavbar);
        
        // Configurar navegación móvil
        navigation.setupMobileMenu();
        
        // Configurar smooth scroll para links internos
        navigation.setupSmoothScroll();
    },

    updateNavbar: () => {
        const nav = document.getElementById('mainNav');
        if (window.scrollY > 100) {
            nav.classList.add('nav-sticky');
        } else {
            nav.classList.remove('nav-sticky');
        }
    },

    setupMobileMenu: () => {
        const menuButton = document.querySelector('[onclick="toggleMobileMenu()"]');
        const mobileMenu = document.getElementById('mobileMenu');
        
        if (menuButton && mobileMenu) {
            menuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
    },

    setupSmoothScroll: () => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href') || '';
                // Ignorar enlaces vac�os o '#'
                if (href === '#' || href.trim() === '') return;

                // Resolver ID de destino y buscar por getElementById (m�s seguro)
                const id = href.startsWith('#') ? href.slice(1) : href;
                const target = document.getElementById(id);

                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
};

// Sistema de datos y API
const dataManager = {
    // Simulación de datos de plantas
    plantas: [
        {
            id: 1,
            nombre_cientifico: "Matricaria chamomilla",
            nombre_comun: "Manzanilla",
            descripcion: "Planta medicinal ampliamente utilizada por sus propiedades calmantes y anti-inflamatorias.",
            beneficios: ["Digestión", "Relajación", "Anti-inflamatorio", "Calmante"],
            contraindicaciones: "Evitar en caso de alergia a plantas de la familia Asteraceae",
            region: "Europa, América del Norte",
            categoria: "Digestiva",
            imagen: "https://images.unsplash.com/photo-1544131750-2985d621da30?w=400",
            rating: 4.5,
            usos_tradicionales: "Infusión para problemas digestivos y nerviosismo",
            referencias_cientificas: 3,
            popularidad: 95
        },
        {
            id: 2,
            nombre_cientifico: "Aloe vera",
            nombre_comun: "Sábila",
            descripcion: "Planta suculenta conocida por sus propiedades curativas y regenerativas para la piel.",
            beneficios: ["Cicatrizante", "Hidratante", "Anti-inflamatorio", "Quemaduras"],
            contraindicaciones: "No consumir internamente sin supervisión médica",
            region: "África del Norte, Península Arábiga",
            categoria: "Dermatológica",
            imagen: "https://images.unsplash.com/photo-1596290147884-57e45c2b4c44?w=400",
            rating: 4.8,
            usos_tradicionales: "Gel aplicado directamente sobre heridas y quemaduras",
            referencias_cientificas: 15,
            popularidad: 88
        },
        {
            id: 3,
            nombre_cientifico: "Echinacea purpurea",
            nombre_comun: "Equinácea",
            descripcion: "Planta utilizada tradicionalmente para fortalecer el sistema inmunológico.",
            beneficios: ["Inmunológico", "Antiviral", "Antibacteriano", "Resfriados"],
            contraindicaciones: "Evitar en enfermedades autoinmunes",
            region: "América del Norte",
            categoria: "Inmunológica",
            imagen: "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=400",
            rating: 4.3,
            usos_tradicionales: "Infusión para prevenir resfriados y gripe",
            referencias_cientificas: 8,
            popularidad: 72
        },
        {
            id: 4,
            nombre_cientifico: "Lavandula angustifolia",
            nombre_comun: "Lavanda",
            descripcion: "Planta aromática con propiedades relajantes y antisépticas.",
            beneficios: ["Relajante", "Aromático", "Antiséptico", "Insomnio"],
            contraindicaciones: "Puede causar somnolencia en dosis altas",
            region: "Mediterráneo",
            categoria: "Aromática",
            imagen: "https://images.unsplash.com/photo-1611909023032-2d4b3a2e78b1?w=400",
            rating: 4.6,
            usos_tradicionales: "Aceite esencial para aromaterapia y relajación",
            referencias_cientificas: 12,
            popularidad: 85
        },
        {
            id: 5,
            nombre_cientifico: "Zingiber officinale",
            nombre_comun: "Jengibre",
            descripcion: "Rizoma con potentes propiedades anti-inflamatorias y digestivas.",
            beneficios: ["Digestivo", "Anti-inflamatorio", "Náuseas", "Circulación"],
            contraindicaciones: "Evitar en caso de úlceras gástricas",
            region: "Asia tropical",
            categoria: "Digestiva",
            imagen: "https://images.unsplash.com/photo-1599481238640-4c1288750d7a?w=400",
            rating: 4.7,
            usos_tradicionales: "Infusión para náuseas y problemas digestivos",
            referencias_cientificas: 20,
            popularidad: 92
        }
    ],

    // Obtener plantas con filtros
    getPlantas: (filtros = {}) => {
        let plantas = [...dataManager.plantas];
        
        if (filtros.busqueda) {
            const termino = filtros.busqueda.toLowerCase();
            plantas = plantas.filter(planta => 
                planta.nombre_comun.toLowerCase().includes(termino) ||
                planta.nombre_cientifico.toLowerCase().includes(termino) ||
                planta.beneficios.some(beneficio => beneficio.toLowerCase().includes(termino)) ||
                planta.categoria.toLowerCase().includes(termino)
            );
        }
        
        if (filtros.categoria && filtros.categoria !== 'todos') {
            plantas = plantas.filter(planta => planta.categoria.toLowerCase() === filtros.categoria.toLowerCase());
        }
        
        if (filtros.ordenar) {
            switch (filtros.ordenar) {
                case 'nombre':
                    plantas.sort((a, b) => a.nombre_comun.localeCompare(b.nombre_comun));
                    break;
                case 'rating':
                    plantas.sort((a, b) => b.rating - a.rating);
                    break;
                case 'popularidad':
                    plantas.sort((a, b) => b.popularidad - a.popularidad);
                    break;
            }
        }
        
        return plantas;
    },

    // Obtener planta por ID
    getPlantaById: (id) => {
        return dataManager.plantas.find(planta => planta.id === parseInt(id));
    },

    // Datos de recetas (simulado)
    recetas: [
        {
            id: 1,
            nombre: "Infusión calmante de manzanilla",
            planta_id: 1,
            ingredientes: ["2 cucharadas de flores secas de manzanilla", "250ml de agua caliente", "Miel al gusto"],
            preparacion: "1. Hervir el agua\n2. Agregar las flores de manzanilla\n3. Dejar reposar 5-7 minutos\n4. Colar y endulzar con miel",
            dosis: "1-2 tazas al día, preferentemente por la noche",
            advertencias: "No exceder la dosis recomendada",
            autor: "Comunidad Wayuu",
            rating: 4.7,
            comentarios: 23,
            estado: "aprobada"
        },
        {
            id: 2,
            nombre: "Gel cicatrizante de sábila",
            planta_id: 2,
            ingredientes: ["1 hoja grande de sábila", "1 cucharada de miel", "Unas gotas de aceite de lavanda"],
            preparacion: "1. Extraer el gel de la sábila\n2. Mezclar con miel\n3. Agregar aceite de lavanda\n4. Batir hasta homogeneizar",
            dosis: "Aplicar sobre la zona afectada 2-3 veces al día",
            advertencias: "Uso externo únicamente",
            autor: "Dra. María González",
            rating: 4.9,
            comentarios: 15,
            estado: "aprobada"
        }
    ]
};

// Sistema de búsqueda avanzada
const searchSystem = {
    init: () => {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', utils.debounce(searchSystem.performSearch, 300));
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchSystem.performSearch();
                }
            });
        }
    },

    performSearch: async () => {
        const searchInput = document.getElementById('searchInput');
        const searchFilter = document.getElementById('searchFilter');
        const resultsContainer = document.getElementById('searchResults');
        
        if (!searchInput || !searchFilter || !resultsContainer) return;
        
        const termino = searchInput.value.trim();
        const filtro = searchFilter.value;
        
        if (termino.length < 2) {
            resultsContainer.classList.add('hidden');
            return;
        }
        
        const filtros = {
            busqueda: termino,
            tipo: filtro
        };
        
        // Try API first if available
        if (window.apiAdapter && typeof window.apiAdapter.searchPlantas === 'function') {
            try {
                const resp = await window.apiAdapter.searchPlantas(termino, filtros);
                if (resp && resp.success) {
                    const data = resp.data || [];
                    searchSystem.displayResults(data);
                    return;
                }
            } catch (e) {
                console.warn('Fallo busqueda API, usando datos locales:', e.message);
            }
        }
        
        // Fallback local
        const resultados = dataManager.getPlantas(filtros);
        searchSystem.displayResults(resultados);
    },

    displayResults: (resultados) => {
        const resultsContainer = document.getElementById('searchResults');
        const resultsList = document.getElementById('resultsList');
        
        if (!resultsContainer || !resultsList) return;
        
        resultsContainer.classList.remove('hidden');
        
        if (resultados.length === 0) {
            resultsList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-search text-4xl mb-4"></i>
                    <p>No se encontraron plantas que coincidan con tu búsqueda.</p>
                    <p class="text-sm mt-2">Intenta con otros términos o revisa la ortografía.</p>
                </div>
            `;
            return;
        }
        
        resultsList.innerHTML = resultados.map(planta => `
            <div class="plant-card cursor-pointer" onclick="viewPlantDetails(${planta.id})">
                <div class="flex items-start space-x-4">
                    <img src="${planta.imagen}" alt="${planta.nombre_comun}" 
                         class="w-16 h-16 rounded-lg object-cover flex-shrink-0">
                    <div class="flex-1 min-w-0">
                        <h4 class="font-semibold text-lg text-gray-900 truncate">${planta.nombre_comun}</h4>
                        <p class="text-sm text-gray-600 italic mb-2">${planta.nombre_cientifico}</p>
                        <div class="flex flex-wrap gap-1 mb-2">
                            ${planta.beneficios.slice(0, 3).map(beneficio => 
                                `<span class="badge badge-success">${beneficio}</span>`
                            ).join('')}
                        </div>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-2">
                                <div class="rating-stars">
                                    ${[1,2,3,4,5].map(i => 
                                        `<i class="fas fa-star rating-star ${i <= planta.rating ? 'active' : ''}"></i>`
                                    ).join('')}
                                </div>
                                <span class="text-sm text-gray-600">(${planta.rating})</span>
                            </div>
                            <button onclick="event.stopPropagation(); toggleFavorite(${planta.id})" 
                                    class="text-gray-400 hover:text-red-500 transition-colors">
                                <i class="fas fa-heart ${appState.favorites.includes(planta.id) ? 'text-red-500' : ''}"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
};

// Sistema de favoritos
const favoritesSystem = {
    toggle: (plantaId) => {
        const index = appState.favorites.indexOf(plantaId);
        
        if (index > -1) {
            appState.favorites.splice(index, 1);
            utils.showNotification('Planta removida de favoritos', 'info');
        } else {
            appState.favorites.push(plantaId);
            utils.showNotification('Planta agregada a favoritos', 'success');
        }
        
        localStorage.setItem('favorites', JSON.stringify(appState.favorites));
        favoritesSystem.updateUI();
    },

    updateUI: () => {
        // Actualizar iconos de corazón en toda la interfaz
        document.querySelectorAll('[onclick*="toggleFavorite"]').forEach(button => {
            const plantaId = parseInt(button.getAttribute('onclick').match(/\d+/)[0]);
            const icon = button.querySelector('i');
            
            if (appState.favorites.includes(plantaId)) {
                icon.classList.add('text-red-500');
            } else {
                icon.classList.remove('text-red-500');
            }
        });
    }
};

// Sistema de animaciones
const animations = {
    init: () => {
        if (!config.features.animations) return;
        
        animations.setupIntersectionObserver();
        animations.setupCounterAnimations();
        animations.setupParallaxEffects();
    },

    setupIntersectionObserver: () => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fadeInUp');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.feature-card, .plant-card').forEach(el => {
            observer.observe(el);
        });
    },

    setupCounterAnimations: () => {
        const counters = document.querySelectorAll('#plantasCount, #recetasCount, #comunidadesCount, #usuariosCount');

        const animateCounter = (element, target) => {
            let current = 0;
            const increment = (target || 0) / 60; // 60 frames ~1s
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    element.textContent = (target || 0) + '+';
                    clearInterval(timer);
                } else {
                    element.textContent = Math.floor(current) + '+';
                }
            }, 16);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.animated) {
                    const raw = entry.target.getAttribute('data-target') || entry.target.textContent;
                    const num = parseInt(String(raw).replace(/[^0-9]/g, ''), 10);
                    if (isNaN(num)) {
                        // A�n no hay n�mero; esperar a que stats.js/main.js lo establezcan
                        return;
                    }
                    animateCounter(entry.target, num);
                    entry.target.animated = true;
                }
            });
        });

        counters.forEach(counter => observer.observe(counter));
    },

    setupParallaxEffects: () => {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const parallaxElements = document.querySelectorAll('.floating-leaf');
            
            parallaxElements.forEach((element, index) => {
                const speed = 0.5 + (index * 0.1);
                const yPos = -(scrolled * speed);
                element.style.transform = `translateY(${yPos}px) rotate(${scrolled * 0.1}deg)`;
            });
        });
    }
};

// Funciones globales para eventos de la interfaz
window.toggleMobileMenu = () => {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
};

window.scrollToSection = (sectionId) => {
    utils.scrollToSection(sectionId);
};

window.buscarPlantas = () => {
    searchSystem.performSearch();
};

window.buscarTermino = (termino) => {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = termino;
        searchSystem.performSearch();
    }
};

window.toggleFavorite = (plantaId) => {
    favoritesSystem.toggle(plantaId);
};

window.viewPlantDetails = (plantaId) => {
    // TODO: Implementar vista detallada de planta
    utils.showNotification(`Abriendo detalles de la planta ID: ${plantaId}`, 'info');
};

// Controles de modales de autenticación
window.mostrarLogin = () => {
    const modal = document.getElementById('loginModal');
    const content = document.getElementById('loginContent');
    if (!modal || !content) return;
    modal.classList.remove('hidden');
    // animación de entrada
    requestAnimationFrame(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    });
};

window.cerrarLogin = () => {
    const modal = document.getElementById('loginModal');
    const content = document.getElementById('loginContent');
    if (!modal || !content) return;
    // animación de salida
    content.classList.add('scale-95', 'opacity-0');
    content.classList.remove('scale-100', 'opacity-100');
    setTimeout(() => modal.classList.add('hidden'), 300);
};

window.mostrarRegistro = () => {
    const modal = document.getElementById('registerModal');
    const content = document.getElementById('registerContent');
    if (!modal || !content) return;
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    });
};

window.cerrarRegistro = () => {
    const modal = document.getElementById('registerModal');
    const content = document.getElementById('registerContent');
    if (!modal || !content) return;
    content.classList.add('scale-95', 'opacity-0');
    content.classList.remove('scale-100', 'opacity-100');
    setTimeout(() => modal.classList.add('hidden'), 300);
};

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌱 PlantaMedicinal iniciado correctamente');
    
    // Inicializar sistemas
    navigation.init();
    searchSystem.init();
    animations.init();
    favoritesSystem.updateUI();
    
    // Cargar estad�sticas din�micas para portada
    if (document.getElementById('plantasCount')) {
        (async () => {
            try {
                const resp = await apiClient.get(apiConfig.endpoints.estadisticas);
                const data = resp.data || resp;
                const nf = new Intl.NumberFormat('es-CO');
                const setVal = (id, val) => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = nf.format(Number(val || 0)) + '+';
                };
                setVal('plantasCount', data.plantas);
                setVal('recetasCount', data.recetas);
                setVal('comunidadesCount', data.comunidades);
                setVal('usuariosCount', data.usuarios_activos);
            } catch (e) {
                console.warn('No se pudieron cargar las estad�sticas', e.message);
            }
        })();
    }
    
    // Configurar eventos globales
    window.addEventListener('resize', () => {
        // Manejar cambios de tamaño de ventana
    });
    
    // Cargar datos iniciales si es necesario
    // TODO: Cargar desde API real
    
    console.log('✅ Todos los sistemas inicializados');
});

