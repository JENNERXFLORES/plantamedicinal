// Sistema de administración para PlantaMedicinal
// Panel de control para administradores

// Configuración del panel admin
const adminConfig = {
    currentSection: 'dashboard',
    itemsPerPage: 10,
    refreshInterval: 30000, // 30 segundos
    charts: {}
};

// Estado del panel admin
const adminState = {
    pendingItems: [],
    users: [],
    reports: [],
    statistics: {},
    selectedUser: null,
    confirmCallback: null
};

// Base de datos simulada para administración
const adminDatabase = {
    // Elementos pendientes de moderación
    pendingItems: [
        {
            id: 1,
            tipo: 'receta',
            titulo: 'Infusión digestiva de hierbabuena',
            autor: 'María González',
            fecha_envio: new Date('2024-03-10'),
            estado: 'pendiente',
            contenido: {
                ingredientes: ['Hierbabuena fresca', 'Agua caliente', 'Miel'],
                preparacion: 'Hervir agua, agregar hierbabuena...'
            },
            prioridad: 'media'
        },
        {
            id: 2,
            tipo: 'comentario',
            titulo: 'Comentario en "Manzanilla calmante"',
            autor: 'Carlos Ruiz',
            fecha_envio: new Date('2024-03-11'),
            estado: 'pendiente',
            contenido: {
                texto: 'Excelente receta, muy efectiva para el insomnio...'
            },
            prioridad: 'baja'
        }
    ],

    // Reportes de contenido
    reports: [
        {
            id: 1,
            tipo_contenido: 'receta',
            contenido_id: 5,
            titulo_contenido: 'Jarabe expectorante dudoso',
            reportado_por: 'Dr. Ana Martínez',
            fecha_reporte: new Date('2024-03-09'),
            razon: 'Información médica incorrecta',
            descripcion: 'La dosis recomendada es peligrosamente alta',
            estado: 'pendiente',
            prioridad: 'alta'
        }
    ],

    // Estadísticas simuladas
    statistics: {
        usuarios_mes: [120, 145, 167, 189, 203, 247],
        recetas_categoria: {
            'Digestiva': 45,
            'Dermatológica': 32,
            'Respiratoria': 28,
            'Inmunológica': 25,
            'Aromática': 20,
            'Cardiovascular': 15
        },
        actividad_reciente: [
            {
                tipo: 'registro',
                usuario: 'Ana García',
                accion: 'Se registró como proveedora',
                fecha: new Date('2024-03-11T10:30:00')
            },
            {
                tipo: 'receta',
                usuario: 'Carlos Wayuu',
                accion: 'Publicó nueva receta: "Bálsamo cicatrizante"',
                fecha: new Date('2024-03-11T09:15:00')
            },
            {
                tipo: 'moderacion',
                usuario: 'Admin Principal',
                accion: 'Aprobó 3 recetas pendientes',
                fecha: new Date('2024-03-11T08:45:00')
            }
        ]
    }
};

// Gestor principal del panel admin
const adminManager = {
    // Inicializar panel de administración
    init: () => {
        // Verificar permisos de administrador
        if (!adminManager.checkAdminPermissions()) {
            window.location.href = 'index.html';
            return;
        }

        adminManager.setupNavigation();
        adminManager.loadDashboard();
        adminManager.setupEventListeners();
        adminManager.startAutoRefresh();
        
        console.log('⚙️ Panel de administración inicializado');
    },

    // Verificar permisos de administrador
    checkAdminPermissions: () => {
        return authState.isAuthenticated && 
               authState.currentUser && 
               authState.currentUser.rol === 'administrador';
    },

    // Configurar navegación del panel
    setupNavigation: () => {
        const navLinks = document.querySelectorAll('.admin-nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Actualizar navegación activa
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    },

    // Configurar event listeners
    setupEventListeners: () => {
        // Filtros de moderación
        const moderacionFilter = document.getElementById('moderacionFilter');
        if (moderacionFilter) {
            moderacionFilter.addEventListener('change', adminManager.filterModerationItems);
        }

        // Búsqueda de usuarios
        const userSearch = document.getElementById('usuarioSearch');
        if (userSearch) {
            userSearch.addEventListener('input', utils.debounce(adminManager.searchUsers, 300));
        }

        // Filtros de usuarios
        const rolFilter = document.getElementById('rolFilter');
        const estadoFilter = document.getElementById('estadoUsuarioFilter');
        
        if (rolFilter) {
            rolFilter.addEventListener('change', adminManager.filterUsers);
        }
        
        if (estadoFilter) {
            estadoFilter.addEventListener('change', adminManager.filterUsers);
        }
    },

    // Cargar dashboard principal (API primero)
    loadDashboard: async () => {
        try {
            const resp = await apiClient.get(apiConfig.endpoints.admin.dashboard);
            const data = resp.data || resp;
            const u = data.usuarios || {};
            const p = data.plantas || {};
            const r = data.recetas || {};
            const c = data.comunidad || {};

            // Métricas principales
            const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
            el('totalUsuarios', (u.total_usuarios ?? 0).toLocaleString());
            el('totalPlantas', (p.total_plantas ?? 0).toLocaleString());
            el('totalRecetas', (r.total_recetas ?? 0).toLocaleString());
            el('totalPendientes', (r.pendientes_moderacion ?? 0).toLocaleString());

            // Gráficas (usamos los datos existentes hasta conectar endpoints específicos)
            adminManager.setupCharts();
            adminManager.loadRecentActivity();
        } catch (e) {
            console.warn('Fallo cargando dashboard admin desde API, usando datos locales:', e.message);
            adminManager.updateMetrics();
            adminManager.setupCharts();
            adminManager.loadRecentActivity();
        }
    },

    // Actualizar métricas principales
    updateMetrics: () => {
        // Simular carga de datos
        setTimeout(() => {
            document.getElementById('totalUsuarios').textContent = '1,247';
            document.getElementById('totalPlantas').textContent = '156';
            document.getElementById('totalRecetas').textContent = '324';
            document.getElementById('totalPendientes').textContent = '23';
        }, 500);
    },

    // Configurar gráficos
    setupCharts: () => {
        adminManager.setupUsersChart();
        adminManager.setupRecipesChart();
    },

    // Gráfico de usuarios
    setupUsersChart: () => {
        const ctx = document.getElementById('usuariosChart');
        if (!ctx) return;

        adminConfig.charts.users = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Octubre', 'Noviembre', 'Diciembre', 'Enero', 'Febrero', 'Marzo'],
                datasets: [{
                    label: 'Usuarios Registrados',
                    data: adminDatabase.statistics.usuarios_mes,
                    borderColor: '#2d5a3d',
                    backgroundColor: 'rgba(45, 90, 61, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    },

    // Gráfico de recetas por categoría
    setupRecipesChart: () => {
        const ctx = document.getElementById('recetasChart');
        if (!ctx) return;

        const data = adminDatabase.statistics.recetas_categoria;
        
        adminConfig.charts.recipes = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: [
                        '#2d5a3d',
                        '#4ade80',
                        '#fbbf24',
                        '#8b4513',
                        '#3b82f6',
                        '#ef4444'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    },

    // Cargar actividad reciente
    loadRecentActivity: () => {
        const container = document.getElementById('actividadReciente');
        if (!container) return;

        const activities = adminDatabase.statistics.actividad_reciente;
        
        container.innerHTML = activities.map(activity => `
            <div class="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                <div class="flex-shrink-0">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center ${adminManager.getActivityIconClass(activity.tipo)}">
                        <i class="fas ${adminManager.getActivityIcon(activity.tipo)} text-sm"></i>
                    </div>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm text-gray-900">
                        <span class="font-medium">${activity.usuario}</span> ${activity.accion}
                    </p>
                    <p class="text-xs text-gray-500">${utils.formatDate(activity.fecha)}</p>
                </div>
            </div>
        `).join('');
    },

    // Obtener ícono de actividad
    getActivityIcon: (tipo) => {
        const icons = {
            'registro': 'fa-user-plus',
            'receta': 'fa-mortar-pestle',
            'moderacion': 'fa-check-circle',
            'reporte': 'fa-flag'
        };
        return icons[tipo] || 'fa-circle';
    },

    // Obtener clase de ícono de actividad
    getActivityIconClass: (tipo) => {
        const classes = {
            'registro': 'bg-blue-100 text-blue-600',
            'receta': 'bg-green-100 text-green-600',
            'moderacion': 'bg-yellow-100 text-yellow-600',
            'reporte': 'bg-red-100 text-red-600'
        };
        return classes[tipo] || 'bg-gray-100 text-gray-600';
    },

    // Mostrar sección específica del admin
    showSection: (sectionName) => {
        // Ocultar todas las secciones
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Mostrar sección seleccionada
        const section = document.getElementById(`${sectionName}-section`);
        if (section) {
            section.classList.remove('hidden');
        }
        
        adminConfig.currentSection = sectionName;
        
        // Cargar datos específicos de la sección
        switch (sectionName) {
            case 'moderacion':
                adminManager.loadModerationItems();
                break;
            case 'usuarios':
                adminManager.loadUsers();
                break;
            case 'reportes':
                adminManager.loadReports();
                break;
        }
    },

    // Cargar elementos de moderación
    loadModerationItems: () => {
        const container = document.getElementById('moderacionContainer');
        if (!container) return;

        const items = adminDatabase.pendingItems;
        
        container.innerHTML = items.map(item => `
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <span class="badge ${adminManager.getItemTypeBadge(item.tipo)}">${item.tipo}</span>
                            <span class="badge ${adminManager.getPriorityBadge(item.prioridad)}">${item.prioridad}</span>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900">${item.titulo}</h3>
                        <p class="text-sm text-gray-600">Por ${item.autor} • ${utils.formatDate(item.fecha_envio)}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="adminManager.approveItem(${item.id})" 
                                class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                            <i class="fas fa-check mr-1"></i>Aprobar
                        </button>
                        <button onclick="adminManager.rejectItem(${item.id})" 
                                class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
                            <i class="fas fa-times mr-1"></i>Rechazar
                        </button>
                        <button onclick="adminManager.viewItemDetails(${item.id})" 
                                class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                            <i class="fas fa-eye mr-1"></i>Ver
                        </button>
                    </div>
                </div>
                
                ${item.tipo === 'receta' ? `
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h4 class="font-medium text-gray-900 mb-2">Vista Previa:</h4>
                        <p class="text-sm text-gray-700 mb-2"><strong>Ingredientes:</strong> ${item.contenido.ingredientes.join(', ')}</p>
                        <p class="text-sm text-gray-700"><strong>Preparación:</strong> ${item.contenido.preparacion.substring(0, 100)}...</p>
                    </div>
                ` : `
                    <div class="bg-gray-50 rounded-lg p-4">
                        <p class="text-sm text-gray-700">${item.contenido.texto}</p>
                    </div>
                `}
            </div>
        `).join('');
    },

    // Obtener badge de tipo de item
    getItemTypeBadge: (tipo) => {
        const badges = {
            'receta': 'bg-green-100 text-green-800',
            'comentario': 'bg-blue-100 text-blue-800',
            'reporte': 'bg-red-100 text-red-800'
        };
        return badges[tipo] || 'bg-gray-100 text-gray-800';
    },

    // Obtener badge de prioridad
    getPriorityBadge: (prioridad) => {
        const badges = {
            'alta': 'bg-red-100 text-red-800',
            'media': 'bg-yellow-100 text-yellow-800',
            'baja': 'bg-gray-100 text-gray-800'
        };
        return badges[prioridad] || 'bg-gray-100 text-gray-800';
    },

    // Aprobar elemento
    approveItem: (itemId) => {
        adminManager.showConfirm(
            'Aprobar Elemento',
            '¿Estás seguro de que quieres aprobar este elemento?',
            () => {
                // Simular aprobación
                utils.showNotification('Elemento aprobado correctamente', 'success');
                adminManager.loadModerationItems();
            }
        );
    },

    // Rechazar elemento
    rejectItem: (itemId) => {
        adminManager.showConfirm(
            'Rechazar Elemento',
            '¿Estás seguro de que quieres rechazar este elemento?',
            () => {
                // Simular rechazo
                utils.showNotification('Elemento rechazado', 'info');
                adminManager.loadModerationItems();
            }
        );
    },

    // Ver detalles del elemento
    viewItemDetails: (itemId) => {
        // TODO: Implementar modal de detalles
        utils.showNotification('Abriendo detalles del elemento...', 'info');
    },

    // Cargar usuarios
    loadUsers: () => {
        const tableBody = document.getElementById('usuariosTableBody');
        if (!tableBody) return;

        // Usar datos existentes del sistema de auth
        const users = userDatabase.users;
        
        tableBody.innerHTML = users.map(user => `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <img class="h-10 w-10 rounded-full" src="${user.avatar}" alt="${user.nombre}">
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${user.nombre} ${user.apellido}</div>
                            <div class="text-sm text-gray-500">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="badge ${adminManager.getRoleBadge(user.rol)}">${user.rol}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="badge ${user.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${utils.formatDate(user.fecha_registro)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Hace 2 días
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="adminManager.viewUser(${user.id})" 
                            class="text-verde-medicina hover:text-green-700 mr-3">Ver</button>
                    <button onclick="adminManager.editUser(${user.id})" 
                            class="text-blue-600 hover:text-blue-500 mr-3">Editar</button>
                    ${user.activo ? 
                        `<button onclick="adminManager.suspendUser(${user.id})" 
                                 class="text-red-600 hover:text-red-500">Suspender</button>` :
                        `<button onclick="adminManager.activateUser(${user.id})" 
                                 class="text-green-600 hover:text-green-500">Activar</button>`
                    }
                </td>
            </tr>
        `).join('');
    },

    // Obtener badge de rol
    getRoleBadge: (rol) => {
        const badges = {
            'administrador': 'bg-red-100 text-red-800',
            'proveedor': 'bg-yellow-100 text-yellow-800',
            'usuario': 'bg-blue-100 text-blue-800'
        };
        return badges[rol] || 'bg-gray-100 text-gray-800';
    },

    // Ver usuario
    viewUser: (userId) => {
        const user = userDatabase.users.find(u => u.id === userId);
        if (!user) return;

        // TODO: Implementar modal de detalles de usuario
        utils.showNotification(`Viendo detalles de ${user.nombre} ${user.apellido}`, 'info');
    },

    // Editar usuario
    editUser: (userId) => {
        // TODO: Implementar edición de usuario
        utils.showNotification('Función de edición próximamente disponible', 'info');
    },

    // Suspender usuario
    suspendUser: (userId) => {
        const user = userDatabase.users.find(u => u.id === userId);
        if (!user) return;

        adminManager.showConfirm(
            'Suspender Usuario',
            `¿Estás seguro de que quieres suspender a ${user.nombre} ${user.apellido}?`,
            () => {
                user.activo = false;
                utils.showNotification('Usuario suspendido', 'warning');
                adminManager.loadUsers();
            }
        );
    },

    // Activar usuario
    activateUser: (userId) => {
        const user = userDatabase.users.find(u => u.id === userId);
        if (!user) return;

        user.activo = true;
        utils.showNotification('Usuario activado', 'success');
        adminManager.loadUsers();
    },

    // Buscar usuarios
    searchUsers: () => {
        // TODO: Implementar búsqueda de usuarios
        const searchTerm = document.getElementById('usuarioSearch').value;
        console.log('Buscando usuarios:', searchTerm);
    },

    // Filtrar usuarios
    filterUsers: () => {
        // TODO: Implementar filtrado de usuarios
        console.log('Filtrando usuarios');
    },

    // Cargar reportes
    loadReports: () => {
        const container = document.getElementById('reportesContainer');
        if (!container) return;

        const reports = adminDatabase.reports;
        
        container.innerHTML = reports.map(report => `
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <span class="badge bg-red-100 text-red-800">${report.tipo_contenido}</span>
                            <span class="badge ${adminManager.getPriorityBadge(report.prioridad)}">${report.prioridad}</span>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900">${report.titulo_contenido}</h3>
                        <p class="text-sm text-gray-600">Reportado por ${report.reportado_por} • ${utils.formatDate(report.fecha_reporte)}</p>
                        <p class="text-sm text-gray-600 mt-1"><strong>Razón:</strong> ${report.razon}</p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="adminManager.resolveReport(${report.id}, 'valid')" 
                                class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
                            <i class="fas fa-ban mr-1"></i>Eliminar Contenido
                        </button>
                        <button onclick="adminManager.resolveReport(${report.id}, 'invalid')" 
                                class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                            <i class="fas fa-check mr-1"></i>Mantener
                        </button>
                    </div>
                </div>
                
                <div class="bg-gray-50 rounded-lg p-4">
                    <p class="text-sm text-gray-700">${report.descripcion}</p>
                </div>
            </div>
        `).join('');
    },

    // Resolver reporte
    resolveReport: (reportId, action) => {
        const actionText = action === 'valid' ? 'eliminar el contenido' : 'mantener el contenido';
        
        adminManager.showConfirm(
            'Resolver Reporte',
            `¿Estás seguro de que quieres ${actionText}?`,
            () => {
                const message = action === 'valid' ? 'Contenido eliminado por violación' : 'Reporte marcado como inválido';
                utils.showNotification(message, action === 'valid' ? 'warning' : 'success');
                adminManager.loadReports();
            }
        );
    },

    // Filtrar elementos de moderación
    filterModerationItems: () => {
        // TODO: Implementar filtrado
        console.log('Filtrando elementos de moderación');
    },

    // Mostrar modal de confirmación
    showConfirm: (title, message, callback) => {
        const modal = document.getElementById('confirmModal');
        const titleEl = document.getElementById('confirmTitle');
        const messageEl = document.getElementById('confirmMessage');
        const actionBtn = document.getElementById('confirmAction');
        
        if (modal && titleEl && messageEl && actionBtn) {
            titleEl.textContent = title;
            messageEl.textContent = message;
            
            // Configurar callback
            adminState.confirmCallback = callback;
            
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    },

    // Ejecutar acción confirmada
    executeConfirmAction: () => {
        if (adminState.confirmCallback) {
            adminState.confirmCallback();
            adminState.confirmCallback = null;
        }
        adminManager.closeConfirmModal();
    },

    // Cerrar modal de confirmación
    closeConfirmModal: () => {
        const modal = document.getElementById('confirmModal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
        adminState.confirmCallback = null;
    },

    // Iniciar auto-refresh
    startAutoRefresh: () => {
        setInterval(() => {
            if (adminConfig.currentSection === 'dashboard') {
                adminManager.updateMetrics();
                adminManager.loadRecentActivity();
            }
        }, adminConfig.refreshInterval);
    }
};

// Funciones globales para la interfaz
window.showAdminSection = (sectionName) => {
    adminManager.showSection(sectionName);
};

window.closeConfirmModal = () => {
    adminManager.closeConfirmModal();
};

// Configurar evento para botón de confirmación
document.addEventListener('DOMContentLoaded', () => {
    const confirmBtn = document.getElementById('confirmAction');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', adminManager.executeConfirmAction);
    }
});

// Inicialización cuando la página está lista
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en el panel de admin
    if (window.location.pathname.includes('admin.html') || document.getElementById('adminNav')) {
        adminManager.init();
        console.log('⚙️ Panel de administración cargado correctamente');
    }
});
