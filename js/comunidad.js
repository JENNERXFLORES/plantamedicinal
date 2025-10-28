// Sistema de comunidad para PlantaMedicinal
// Gestión de comunidades, foros, eventos y miembros

// Configuración del módulo de comunidad
const comunidadConfig = {
    currentTab: 'comunidades',
    itemsPerPage: 12,
    autoRefresh: 60000 // 1 minuto
};

// Estado del módulo de comunidad
const comunidadState = {
    comunidades: [],
    miembros: [],
    temasForo: [],
    eventos: [],
    selectedComunidad: null
};

// Base de datos de comunidad
const comunidadDatabase = {
    // Comunidades indígenas colaboradoras
    comunidades: [
        {
            id: 1,
            nombre: "Comunidad Wayuu",
            region: "La Guajira, Colombia",
            descripcion: "Guardianes ancestrales del conocimiento sobre plantas medicinales del desierto. Especialistas en medicina tradicional y rituales de sanación.",
            especialidades: ["Plantas desérticas", "Medicina digestiva", "Rituales de sanación"],
            miembros_registrados: 15,
            recetas_compartidas: 32,
            contacto: {
                representante: "Carlos Mamallacta",
                email: "carlos.wayuu@email.com",
                telefono: "+57 300 123 4567"
            },
            imagen: "https://images.unsplash.com/photo-1594736797933-d0401ba34875?w=400",
            activa: true,
            fecha_union: new Date('2023-06-15'),
            idiomas: ["Wayuunaiki", "Español"],
            certificaciones: ["UNESCO", "Ministerio de Cultura"]
        },
        {
            id: 2,
            nombre: "Comunidad Muisca",
            region: "Cundinamarca, Colombia",
            descripcion: "Herederos de una rica tradición en el uso de plantas medicinales de la sabana. Expertos en preparaciones ceremoniales y medicina preventiva.",
            especialidades: ["Plantas de páramo", "Medicina respiratoria", "Ceremonias ancestrales"],
            miembros_registrados: 23,
            recetas_compartidas: 45,
            contacto: {
                representante: "María Chicangana",
                email: "maria.muisca@email.com",
                telefono: "+57 301 234 5678"
            },
            imagen: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400",
            activa: true,
            fecha_union: new Date('2023-08-20'),
            idiomas: ["Muysccubun", "Español"],
            certificaciones: ["ONIC", "Fundación Hemera"]
        },
        {
            id: 3,
            nombre: "Comunidad Emberá",
            region: "Chocó, Colombia",
            descripcion: "Conocedores profundos de la medicina de la selva tropical. Especialistas en plantas medicinales de la región del Pacífico.",
            especialidades: ["Plantas tropicales", "Medicina dermatológica", "Preparaciones líquidas"],
            miembros_registrados: 18,
            recetas_compartidas: 38,
            contacto: {
                representante: "José Domicó",
                email: "jose.embera@email.com",
                telefono: "+57 302 345 6789"
            },
            imagen: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400",
            activa: true,
            fecha_union: new Date('2023-09-10'),
            idiomas: ["Emberá", "Español"],
            certificaciones: ["ONIC", "WWF Colombia"]
        },
        {
            id: 4,
            nombre: "Comunidad Inga",
            region: "Putumayo, Colombia",
            descripcion: "Maestros en el uso de plantas sagradas y medicinales del pie de monte amazónico. Preservadores de conocimientos milenarios.",
            especialidades: ["Plantas amazónicas", "Medicina espiritual", "Plantas sagradas"],
            miembros_registrados: 12,
            recetas_compartidas: 28,
            contacto: {
                representante: "Ana Tandioy",
                email: "ana.inga@email.com",
                telefono: "+57 303 456 7890"
            },
            imagen: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400",
            activa: true,
            fecha_union: new Date('2023-10-05'),
            idiomas: ["Inga", "Español"],
            certificaciones: ["SINCHI", "CORPOAMAZONÍA"]
        }
    ],

    // Miembros destacados
    miembros: [
        {
            id: 1,
            nombre: "Dr. Eduardo Ramírez",
            especialidad: "Etnobotánico",
            institucion: "Universidad Nacional",
            descripcion: "Investigador especializado en plantas medicinales andinas con 20 años de experiencia en colaboración con comunidades indígenas.",
            contribuciones: 45,
            nivel: "Experto",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
            verificado: true
        },
        {
            id: 2,
            nombre: "Dra. Carmen López",
            especialidad: "Farmacóloga",
            institucion: "SINCHI",
            descripcion: "Especialista en análisis fitoquímico de plantas amazónicas y validación científica de usos tradicionales.",
            contribuciones: 32,
            nivel: "Experto",
            avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
            verificado: true
        },
        {
            id: 3,
            nombre: "Miguel Tangarife",
            especialidad: "Herbolario Tradicional",
            institucion: "Casa de las Plantas",
            descripcion: "Herbolario con conocimientos transmitidos por generaciones. Especialista en preparaciones tradicionales.",
            contribuciones: 28,
            nivel: "Colaborador",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
            verificado: false
        },
        {
            id: 4,
            nombre: "Sandra Restrepo",
            especialidad: "Estudiante de Biología",
            institucion: "Universidad de Antioquia",
            descripcion: "Estudiante dedicada a documentar plantas medicinales de la región antioqueña.",
            contribuciones: 15,
            nivel: "Colaborador",
            avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
            verificado: false
        }
    ],

    // Temas del foro
    temasForo: [
        {
            id: 1,
            titulo: "Dosificación segura de plantas medicinales",
            categoria: "consultas",
            autor: "Dr. Eduardo Ramírez",
            fecha_creacion: new Date('2024-03-10'),
            respuestas: 12,
            ultimo_mensaje: new Date('2024-03-11T14:30:00'),
            contenido: "¿Cuáles son los criterios más importantes para determinar la dosificación adecuada de preparaciones con plantas medicinales?",
            etiquetas: ["dosificación", "seguridad", "preparaciones"],
            fijado: true,
            activo: true
        },
        {
            id: 2,
            titulo: "Intercambio de semillas de plantas medicinales",
            categoria: "intercambio",
            autor: "Miguel Tangarife",
            fecha_creacion: new Date('2024-03-09'),
            respuestas: 8,
            ultimo_mensaje: new Date('2024-03-11T10:15:00'),
            contenido: "Propongo crear una red de intercambio de semillas entre miembros de la comunidad. ¿Quién está interesado?",
            etiquetas: ["semillas", "intercambio", "cultivo"],
            fijado: false,
            activo: true
        },
        {
            id: 3,
            titulo: "Validación científica de recetas tradicionales",
            categoria: "investigacion",
            autor: "Dra. Carmen López",
            fecha_creacion: new Date('2024-03-08'),
            respuestas: 15,
            ultimo_mensaje: new Date('2024-03-10T16:45:00'),
            contenido: "Compartiendo metodología para validar científicamente las recetas tradicionales preservando el respeto cultural.",
            etiquetas: ["investigación", "validación", "ciencia"],
            fijado: false,
            activo: true
        }
    ],

    // Eventos y talleres
    eventos: [
        {
            id: 1,
            titulo: "Taller de Preparaciones Digestivas Tradicionales",
            descripcion: "Aprende a preparar remedios tradicionales para problemas digestivos con la sabiduría de la comunidad Wayuu.",
            fecha: new Date('2024-03-25T15:00:00'),
            duracion: "2 horas",
            modalidad: "Virtual",
            instructor: "Carlos Mamallacta",
            comunidad: "Wayuu",
            cupos: 50,
            registrados: 32,
            precio: "Gratuito",
            requisitos: ["Ingredientes básicos", "Computador con cámara"],
            imagen: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
            categoria: "Taller Práctico"
        },
        {
            id: 2,
            titulo: "Conferencia: Plantas Medicinales del Amazonas",
            descripcion: "Conferencia magistral sobre la diversidad y usos tradicionales de plantas medicinales amazónicas.",
            fecha: new Date('2024-04-02T18:00:00'),
            duracion: "1.5 horas",
            modalidad: "Virtual",
            instructor: "Dra. Carmen López",
            comunidad: "SINCHI",
            cupos: 100,
            registrados: 67,
            precio: "Gratuito",
            requisitos: ["Ninguno"],
            imagen: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400",
            categoria: "Conferencia"
        }
    ],

    // Eventos pasados
    eventosPasados: [
        {
            id: 1,
            titulo: "Encuentro Virtual con Sabedores Muiscas",
            fecha: new Date('2024-02-15'),
            participantes: 89,
            grabacion: "https://example.com/grabacion1",
            resumen: "Intercambio de conocimientos sobre plantas de páramo y su uso ceremonial."
        },
        {
            id: 2,
            titulo: "Taller de Identificación de Plantas Tóxicas",
            fecha: new Date('2024-01-20'),
            participantes: 156,
            grabacion: "https://example.com/grabacion2",
            resumen: "Capacitación sobre identificación y prevención de intoxicaciones."
        }
    ]
};

// Gestor principal de comunidad
const comunidadManager = {
    // Inicializar módulo
    init: () => {
        comunidadManager.loadInitialData();
        comunidadManager.setupEventListeners();
        comunidadManager.showTab('comunidades');
        
        console.log('👥 Sistema de comunidad inicializado');
    },

    // Cargar datos iniciales
    loadInitialData: async () => {
        try {
            // Comunidades
            const comunResp = await apiClient.get(apiConfig.endpoints.comunidad.comunidades);
            const comunList = (comunResp.data && (comunResp.data.comunidades || comunResp.data)) || [];
            comunidadState.comunidades = comunList.map(c => ({
                id: c.id,
                nombre: c.nombre,
                region: c.region || '',
                descripcion: c.descripcion || '',
                especialidades: c.especialidades ? (Array.isArray(c.especialidades) ? c.especialidades : Object.values(c.especialidades)) : [],
                miembros_registrados: c.miembros_registrados || c.total_miembros || 0,
                recetas_compartidas: c.recetas_compartidas || c.total_recetas || 0,
                contacto: c.contacto || { representante: '', email: '', telefono: '' },
                imagen: c.imagen || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="%23e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-family="Arial" font-size="24">Comunidad</text></svg>',
                activa: c.activa !== false,
                fecha_union: c.fecha_creacion || new Date(),
                idiomas: c.idiomas ? (Array.isArray(c.idiomas) ? c.idiomas : Object.values(c.idiomas)) : [],
                certificaciones: c.certificaciones ? (Array.isArray(c.certificaciones) ? c.certificaciones : Object.values(c.certificaciones)) : []
            }));

            // Posts del foro
            const postsResp = await apiClient.get(apiConfig.endpoints.comunidad.posts);
            const posts = (postsResp.data && (postsResp.data.posts || postsResp.data)) || [];
            comunidadState.temasForo = posts.map(p => ({
                id: p.id,
                titulo: p.titulo,
                categoria: p.categoria || 'general',
                autor: p.autor || [p.autor_nombre, p.autor_apellido].filter(Boolean).join(' '),
                fecha_creacion: p.fecha_creacion || p.created_at || new Date(),
                respuestas: p.total_comentarios || 0,
                ultimo_mensaje: p.ultimo_mensaje || p.fecha_actualizacion || p.fecha_creacion,
                contenido: p.contenido || '',
                etiquetas: p.tags ? (Array.isArray(p.tags) ? p.tags : Object.values(p.tags)) : [],
                fijado: !!p.fijado,
                activo: p.activo !== false
            }));

            // Miembros destacados (si existe endpoint, usar; de lo contrario, vacío)
            comunidadState.miembros = [];
            comunidadState.eventos = [];
        } catch (e) {
            console.warn('Fallo carga inicial de comunidad desde API:', e.message);
            // Sin fallback local para detectar claramente problemas de API
            comunidadState.comunidades = [];
            comunidadState.miembros = [];
            comunidadState.temasForo = [];
            comunidadState.eventos = [];
        }
    },

    // Configurar event listeners
    setupEventListeners: () => {
        // Formulario nuevo tema
        const nuevoTemaForm = document.getElementById('nuevoTemaForm');
        if (nuevoTemaForm) {
            nuevoTemaForm.addEventListener('submit', comunidadManager.handleNuevoTema);
        }

        // Filtros del foro
        const foroCategoria = document.getElementById('foroCategoria');
        if (foroCategoria) {
            foroCategoria.addEventListener('change', comunidadManager.filterForoTemas);
        }

        // Cerrar modales
        document.addEventListener('click', (e) => {
            const comunidadModal = document.getElementById('comunidadDetailModal');
            const nuevoTemaModal = document.getElementById('nuevoTemaModal');
            
            if (e.target === comunidadModal) {
                comunidadManager.closeComunidadModal();
            }
            if (e.target === nuevoTemaModal) {
                comunidadManager.closeNuevoTemaModal();
            }
        });

        // Tecla ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                comunidadManager.closeComunidadModal();
                comunidadManager.closeNuevoTemaModal();
            }
        });
    },

    // Mostrar tab específico
    showTab: (tabName) => {
        // Actualizar navegación
        document.querySelectorAll('.community-tab').forEach(tab => {
            tab.classList.remove('active', 'border-verde-medicina', 'text-verde-medicina');
            tab.classList.add('text-gray-500', 'border-transparent');
        });

        const activeTab = document.querySelector(`[onclick="showCommunityTab('${tabName}')"]`);
        if (activeTab) {
            activeTab.classList.remove('text-gray-500', 'border-transparent');
            activeTab.classList.add('active', 'border-verde-medicina', 'text-verde-medicina');
        }

        // Mostrar contenido
        document.querySelectorAll('.community-section').forEach(section => {
            section.classList.add('hidden');
        });

        const activeSection = document.getElementById(`${tabName}-tab`);
        if (activeSection) {
            activeSection.classList.remove('hidden');
        }

        comunidadConfig.currentTab = tabName;

        // Cargar contenido específico
        switch (tabName) {
            case 'comunidades':
                comunidadManager.renderComunidades();
                break;
            case 'miembros':
                comunidadManager.renderMiembros();
                break;
            case 'foro':
                comunidadManager.renderForo();
                break;
            case 'eventos':
                comunidadManager.renderEventos();
                break;
        }
    },

    // Renderizar comunidades
    renderComunidades: () => {
        const container = document.getElementById('comunidadesContainer');
        if (!container) return;

        container.innerHTML = comunidadState.comunidades.map(comunidad => `
            <div class="plant-card cursor-pointer group" onclick="comunidadManager.showComunidadDetails(${comunidad.id})">
                <div class="relative overflow-hidden rounded-xl mb-4">
                    <img src="${comunidad.imagen}" alt="${comunidad.nombre}" 
                         class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300">
                    <div class="absolute top-3 left-3">
                        ${comunidad.activa ? 
                            '<span class="badge bg-green-500 text-white">Activa</span>' :
                            '<span class="badge bg-gray-500 text-white">Inactiva</span>'
                        }
                    </div>
                    <div class="absolute top-3 right-3">
                        ${comunidad.certificaciones.length > 0 ? 
                            '<i class="fas fa-certificate text-dorado text-xl" title="Comunidad certificada"></i>' : ''
                        }
                    </div>
                </div>
                
                <div class="space-y-3">
                    <div>
                        <h3 class="font-bold text-xl text-gray-900 group-hover:text-verde-medicina transition-colors">
                            ${comunidad.nombre}
                        </h3>
                        <p class="text-sm text-gray-600 flex items-center">
                            <i class="fas fa-map-marker-alt mr-1"></i>${comunidad.region}
                        </p>
                    </div>
                    
                    <p class="text-gray-700 text-sm line-clamp-3">${comunidad.descripcion}</p>
                    
                    <div class="flex flex-wrap gap-1">
                        ${comunidad.especialidades.slice(0, 2).map(esp => 
                            `<span class="badge badge-info text-xs">${esp}</span>`
                        ).join('')}
                        ${comunidad.especialidades.length > 2 ? 
                            `<span class="text-xs text-gray-500">+${comunidad.especialidades.length - 2} más</span>` : ''
                        }
                    </div>
                    
                    <div class="flex items-center justify-between text-sm text-gray-600">
                        <div class="flex items-center space-x-3">
                            <span><i class="fas fa-users mr-1"></i>${comunidad.miembros_registrados} miembros</span>
                            <span><i class="fas fa-mortar-pestle mr-1"></i>${comunidad.recetas_compartidas} recetas</span>
                        </div>
                        <button class="text-verde-medicina hover:text-green-700 font-medium">
                            Ver más <i class="fas fa-arrow-right ml-1"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // Renderizar miembros destacados
    renderMiembros: () => {
        const container = document.getElementById('miembrosContainer');
        if (!container) return;

        container.innerHTML = comunidadState.miembros.map(miembro => `
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200 text-center hover:shadow-lg transition-shadow">
                <div class="relative inline-block mb-4">
                    <img src="${miembro.avatar}" alt="${miembro.nombre}" 
                         class="w-20 h-20 rounded-full mx-auto object-cover">
                    ${miembro.verificado ? 
                        '<div class="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"><i class="fas fa-check text-white text-xs"></i></div>' : ''
                    }
                </div>
                
                <h3 class="font-semibold text-gray-900 mb-1">${miembro.nombre}</h3>
                <p class="text-sm text-verde-medicina font-medium mb-2">${miembro.especialidad}</p>
                <p class="text-xs text-gray-600 mb-3">${miembro.institucion}</p>
                
                <div class="flex justify-center items-center space-x-2 mb-3">
                    <span class="badge ${comunidadManager.getNivelBadge(miembro.nivel)} text-xs">${miembro.nivel}</span>
                    <span class="text-xs text-gray-500">${miembro.contribuciones} contribuciones</span>
                </div>
                
                <p class="text-xs text-gray-600 line-clamp-3">${miembro.descripcion}</p>
            </div>
        `).join('');
    },

    // Obtener badge de nivel
    getNivelBadge: (nivel) => {
        const badges = {
            'Experto': 'bg-purple-100 text-purple-800',
            'Colaborador': 'bg-blue-100 text-blue-800',
            'Nuevo': 'bg-green-100 text-green-800'
        };
        return badges[nivel] || 'bg-gray-100 text-gray-800';
    },

    // Renderizar foro
    renderForo: () => {
        const container = document.getElementById('foroContainer');
        if (!container) return;

        container.innerHTML = comunidadState.temasForo.map(tema => `
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-2">
                            ${tema.fijado ? '<i class="fas fa-thumbtack text-dorado"></i>' : ''}
                            <span class="badge ${comunidadManager.getCategoriaBadge(tema.categoria)} text-xs">${comunidadManager.getCategoriaName(tema.categoria)}</span>
                            <div class="flex flex-wrap gap-1">
                                ${tema.etiquetas.map(etiqueta => 
                                    `<span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">#${etiqueta}</span>`
                                ).join('')}
                            </div>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 hover:text-verde-medicina cursor-pointer mb-2">
                            ${tema.titulo}
                        </h3>
                        <p class="text-gray-600 text-sm mb-3 line-clamp-2">${tema.contenido}</p>
                        <div class="flex items-center text-xs text-gray-500 space-x-4">
                            <span><i class="fas fa-user mr-1"></i>${tema.autor}</span>
                            <span><i class="fas fa-calendar mr-1"></i>${utils.formatDate(tema.fecha_creacion)}</span>
                            <span><i class="fas fa-comments mr-1"></i>${tema.respuestas} respuestas</span>
                            <span><i class="fas fa-clock mr-1"></i>Actualizado ${utils.formatDate(tema.ultimo_mensaje)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // Obtener badge de categoría
    getCategoriaBadge: (categoria) => {
        const badges = {
            'consultas': 'bg-blue-100 text-blue-800',
            'recetas': 'bg-green-100 text-green-800',
            'investigacion': 'bg-purple-100 text-purple-800',
            'intercambio': 'bg-yellow-100 text-yellow-800'
        };
        return badges[categoria] || 'bg-gray-100 text-gray-800';
    },

    // Obtener nombre de categoría
    getCategoriaName: (categoria) => {
        const nombres = {
            'consultas': 'Consultas',
            'recetas': 'Recetas',
            'investigacion': 'Investigación',
            'intercambio': 'Intercambio'
        };
        return nombres[categoria] || categoria;
    },

    // Renderizar eventos
    renderEventos: () => {
        const eventosContainer = document.getElementById('eventosContainer');
        const eventosPasadosContainer = document.getElementById('eventosPasadosContainer');

        if (eventosContainer) {
            eventosContainer.innerHTML = comunidadState.eventos.map(evento => `
                <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                    <div class="flex items-start space-x-4">
                        <img src="${evento.imagen}" alt="${evento.titulo}" 
                             class="w-20 h-20 rounded-lg object-cover flex-shrink-0">
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center space-x-2 mb-2">
                                <span class="badge bg-verde-medicina text-white text-xs">${evento.categoria}</span>
                                <span class="badge bg-blue-100 text-blue-800 text-xs">${evento.modalidad}</span>
                            </div>
                            <h3 class="font-semibold text-gray-900 mb-2">${evento.titulo}</h3>
                            <p class="text-sm text-gray-600 mb-3 line-clamp-2">${evento.descripcion}</p>
                            <div class="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                                <div><i class="fas fa-calendar mr-1"></i>${utils.formatDate(evento.fecha)}</div>
                                <div><i class="fas fa-clock mr-1"></i>${evento.duracion}</div>
                                <div><i class="fas fa-user mr-1"></i>${evento.instructor}</div>
                                <div><i class="fas fa-users mr-1"></i>${evento.registrados}/${evento.cupos}</div>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm font-medium text-verde-medicina">${evento.precio}</span>
                                <button class="px-4 py-2 bg-verde-medicina text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                                    Inscribirse
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        if (eventosPasadosContainer) {
            eventosPasadosContainer.innerHTML = comunidadDatabase.eventosPasados.map(evento => `
                <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <h3 class="font-semibold text-gray-900 mb-2">${evento.titulo}</h3>
                    <p class="text-sm text-gray-600 mb-3">${evento.resumen}</p>
                    <div class="flex justify-between items-center text-xs text-gray-500 mb-3">
                        <span><i class="fas fa-calendar mr-1"></i>${utils.formatDate(evento.fecha)}</span>
                        <span><i class="fas fa-users mr-1"></i>${evento.participantes} participantes</span>
                    </div>
                    <button class="w-full px-4 py-2 border border-verde-medicina text-verde-medicina rounded-lg text-sm hover:bg-verde-medicina hover:text-white transition-colors">
                        <i class="fas fa-play mr-2"></i>Ver Grabación
                    </button>
                </div>
            `).join('');
        }
    },

    // Mostrar detalles de comunidad
    showComunidadDetails: (comunidadId) => {
        const comunidad = comunidadState.comunidades.find(c => c.id === comunidadId);
        if (!comunidad) return;

        comunidadState.selectedComunidad = comunidad;
        
        const modal = document.getElementById('comunidadDetailModal');
        const content = document.getElementById('comunidadDetailContent');
        
        if (!modal || !content) return;

        content.innerHTML = comunidadManager.renderComunidadDetails(comunidad);
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    },

    // Renderizar detalles de comunidad
    renderComunidadDetails: (comunidad) => {
        return `
            <div class="relative">
                <!-- Header -->
                <div class="relative h-64 bg-gradient-to-r from-verde-medicina to-green-700 overflow-hidden">
                    <img src="${comunidad.imagen}" alt="${comunidad.nombre}" 
                         class="w-full h-full object-cover opacity-30">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div class="absolute bottom-6 left-6 text-white">
                        <h1 class="text-3xl font-bold mb-2">${comunidad.nombre}</h1>
                        <p class="text-lg opacity-90"><i class="fas fa-map-marker-alt mr-2"></i>${comunidad.region}</p>
                        <div class="flex items-center space-x-2 mt-2">
                            ${comunidad.certificaciones.map(cert => 
                                `<span class="badge bg-dorado text-verde-medicina text-xs">${cert}</span>`
                            ).join('')}
                        </div>
                    </div>
                    <button onclick="comunidadManager.closeComunidadModal()" 
                            class="absolute top-4 right-4 bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-3 hover:bg-opacity-30 transition-all text-white">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <!-- Contenido -->
                <div class="p-8">
                    <div class="grid md:grid-cols-3 gap-8">
                        <!-- Información principal -->
                        <div class="md:col-span-2 space-y-6">
                            <div>
                                <h3 class="text-xl font-bold text-gray-900 mb-3">Acerca de la Comunidad</h3>
                                <p class="text-gray-700 leading-relaxed">${comunidad.descripcion}</p>
                            </div>
                            
                            <div>
                                <h3 class="text-xl font-bold text-gray-900 mb-3">Especialidades</h3>
                                <div class="flex flex-wrap gap-2">
                                    ${comunidad.especialidades.map(esp => 
                                        `<span class="badge badge-success">${esp}</span>`
                                    ).join('')}
                                </div>
                            </div>
                            
                            <div>
                                <h3 class="text-xl font-bold text-gray-900 mb-3">Idiomas</h3>
                                <div class="flex flex-wrap gap-2">
                                    ${comunidad.idiomas.map(idioma => 
                                        `<span class="badge badge-info">${idioma}</span>`
                                    ).join('')}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Información de contacto y estadísticas -->
                        <div class="space-y-6">
                            <div class="bg-gray-50 rounded-lg p-6">
                                <h4 class="font-semibold text-gray-900 mb-4">Estadísticas</h4>
                                <div class="space-y-3">
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">Miembros registrados:</span>
                                        <span class="font-medium">${comunidad.miembros_registrados}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">Recetas compartidas:</span>
                                        <span class="font-medium">${comunidad.recetas_compartidas}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">Miembro desde:</span>
                                        <span class="font-medium">${utils.formatDate(comunidad.fecha_union)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                <h4 class="font-semibold text-gray-900 mb-4">Contacto</h4>
                                <div class="space-y-2 text-sm">
                                    <div><strong>Representante:</strong> ${comunidad.contacto.representante}</div>
                                    <div><strong>Email:</strong> ${comunidad.contacto.email}</div>
                                    <div><strong>Teléfono:</strong> ${comunidad.contacto.telefono}</div>
                                </div>
                                <button class="w-full mt-4 px-4 py-2 bg-verde-medicina text-white rounded-lg hover:bg-green-700 transition-colors">
                                    <i class="fas fa-envelope mr-2"></i>Contactar Comunidad
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Cerrar modal de comunidad
    closeComunidadModal: () => {
        const modal = document.getElementById('comunidadDetailModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        document.body.style.overflow = '';
        comunidadState.selectedComunidad = null;
    },

    // Manejar nuevo tema del foro
    handleNuevoTema: (e) => {
        e.preventDefault();
        
        if (!authState.isAuthenticated) {
            utils.showNotification('Debes iniciar sesión para crear temas en el foro', 'warning');
            mostrarLogin();
            return;
        }
        
        const formData = {
            titulo: document.getElementById('temaTitulo').value,
            categoria: document.getElementById('temaCategoria').value,
            descripcion: document.getElementById('temaDescripcion').value
        };
        
        // Crear nuevo tema
        const nuevoTema = {
            id: comunidadState.temasForo.length + 1,
            titulo: formData.titulo,
            categoria: formData.categoria,
            autor: `${authState.currentUser.nombre} ${authState.currentUser.apellido}`,
            fecha_creacion: new Date(),
            respuestas: 0,
            ultimo_mensaje: new Date(),
            contenido: formData.descripcion,
            etiquetas: [],
            fijado: false,
            activo: true
        };
        
        comunidadState.temasForo.unshift(nuevoTema);
        
        // Cerrar modal y actualizar vista
        comunidadManager.closeNuevoTemaModal();
        comunidadManager.renderForo();
        utils.showNotification('Tema creado exitosamente', 'success');
    },

    // Cerrar modal de nuevo tema
    closeNuevoTemaModal: () => {
        const modal = document.getElementById('nuevoTemaModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        // Limpiar formulario
        const form = document.getElementById('nuevoTemaForm');
        if (form) {
            form.reset();
        }
        
        document.body.style.overflow = '';
    },

    // Filtrar temas del foro
    filterForoTemas: () => {
        // TODO: Implementar filtrado
        console.log('Filtrando temas del foro');
    }
};

// Funciones globales para la interfaz
window.showCommunityTab = (tabName) => {
    comunidadManager.showTab(tabName);
};

window.mostrarNuevoTema = () => {
    if (!authState.isAuthenticated) {
        utils.showNotification('Debes iniciar sesión para crear temas', 'warning');
        mostrarLogin();
        return;
    }
    
    const modal = document.getElementById('nuevoTemaModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
};

window.cerrarNuevoTema = () => {
    comunidadManager.closeNuevoTemaModal();
};

// Inicialización cuando la página está lista
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en la página de comunidad
    if (window.location.pathname.includes('comunidad.html') || document.getElementById('comunidadesContainer')) {
        comunidadManager.init();
        console.log('👥 Página de comunidad inicializada correctamente');
    }
});
