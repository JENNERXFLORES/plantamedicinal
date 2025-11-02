// Configuración de API para PlantaMedicinal
// Migración de almacenamiento local a base de datos MySQL

// Configuración base de la API
const apiConfig = {
    // URL base de la API PHP (derivada de la ruta actual para soportar subcarpetas en XAMPP)
    // Ej.: si navegas en /plantamedicinal/index.html => base '/plantamedicinal/php/api'
    get baseURL() {
        const path = window.location.pathname;
        const basePath = path.endsWith('/') ? path : path.replace(/[^/]+$/, '/');
        return `${basePath}php/api`;
    },
    
    // Endpoints de la API
    endpoints: {
        // Autenticación
        auth: {
            login: '/auth.php?action=login',
            register: '/auth.php?action=register', 
            logout: '/auth.php?action=logout',
            verify: '/auth.php?action=verify',
            refresh: '/auth.php?action=refresh',
            profile: '/auth.php?action=profile',
            test: '/auth.php?action=test'
        },
        
        // Plantas
        plantas: {
            list: '/plantas.php',
            search: '/plantas.php?action=search',
            get: '/plantas.php', // Para obtener por ID: /plantas.php?id=X
            create: '/plantas.php?action=create',
            update: '/plantas.php?action=update',
            delete: '/plantas.php?action=delete',
            favorite: '/plantas.php?action=favorite',
            rate: '/plantas.php?action=rate'
        },
        
        // Recetas
        recetas: {
            list: '/recetas.php',
            search: '/recetas.php?action=search',
            get: '/recetas.php', // Para obtener por ID: /recetas.php?id=X
            create: '/recetas.php?action=create',
            update: '/recetas.php?action=update',
            delete: '/recetas.php?action=delete',
            rate: '/recetas.php?action=rate',
            comment: '/recetas.php?action=comment',
            favorite: '/recetas.php?action=favorite'
        },
        
        // Comunidad
        comunidad: {
            posts: '/comunidad.php?endpoint=posts',
            post: '/comunidad.php?endpoint=posts',
            comentarios: '/comunidad.php?endpoint=comentarios',
            comunidades: '/comunidad.php?endpoint=comunidades',
            categorias: '/comunidad.php?endpoint=categorias',
            votar: '/comunidad.php?endpoint=votar',
            notificaciones: '/comunidad.php?endpoint=notificaciones'
        },

        // Estad�sticas p�blicas
        estadisticas: '/estadisticas.php',
        
        // Administración
        admin: {
            dashboard: '/admin.php/dashboard',
            usuarios: '/admin.php/usuarios',
            moderacion: '/admin.php/moderacion',
            reportes: '/admin.php/reportes',
            logs: '/admin.php/logs',
            estadisticas: '/admin.php/estadisticas',
            configuracion: '/admin.php/configuracion'
        }
    },
    
    // Configuración de peticiones
    defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    
    // Timeout por defecto (30 segundos)
    timeout: 30000
};

// Clase para manejo de API
class APIClient {
    constructor() {
        this.baseURL = apiConfig.baseURL;
        this.timeout = apiConfig.timeout;
        this.token = this.getStoredToken();
    }
    
    // Obtener token almacenado
    getStoredToken() {
        return localStorage.getItem('plantamedicinal_token') || sessionStorage.getItem('plantamedicinal_token');
    }
    
    // Configurar headers por defecto
    getHeaders(includeAuth = true) {
        const headers = { ...apiConfig.defaultHeaders };
        
        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }
    
    // Método genérico para hacer peticiones
    async makeRequest(endpoint, options = {}) {
        try {
            // Unir base + endpoint garantizando una sola barra (evita //)
            const base = String(this.baseURL || '').replace(/\/+$/, '');
            const path = String(endpoint || '').replace(/^\/+/, '');
            let url = `${base}/${path}`;
            
            const config = {
                method: options.method || 'GET',
                headers: this.getHeaders(options.includeAuth !== false),
                ...options
            };
            
            // Si hay datos para enviar
            if (options.data) {
                if (config.method === 'GET') {
                    // Para GET, añadir como query params
                    const params = new URLSearchParams(options.data);
                    const separator = url.includes('?') ? '&' : '?';
                    let finalUrl = `${url}${separator}${params}`;
                    url = finalUrl;
                } else {
                    // Para otros métodos, enviar como JSON en el body
                    config.body = JSON.stringify(options.data);
                }
            }
            
            // Crear AbortController para timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            config.signal = controller.signal;
            
            // Realizar petición
            const response = await fetch(url, config);
            clearTimeout(timeoutId);
            
            // Verificar si la respuesta es exitosa
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new APIError(`HTTP ${response.status}: ${errorData.message || 'Error en la petición'}`, response.status, errorData);
            }
            
            // Parsear respuesta JSON
            const data = await response.json();
            
            // Verificar si la API reporta éxito
            if (data.success === false) {
                throw new APIError(data.message || 'Error en la API', 400, data);
            }
            
            return data;
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new APIError('Timeout: La petición tardó demasiado', 408);
            }
            
            if (error instanceof APIError) {
                throw error;
            }
            
            // Error de red o parsing
            throw new APIError(`Error de conexión: ${error.message}`, 0);
        }
    }
    
    // Métodos HTTP específicos
    async get(endpoint, params = {}, opts = {}) {
        return this.makeRequest(endpoint, {
            method: 'GET',
            data: params,
            ...opts
        });
    }
    
    async post(endpoint, data = {}, opts = {}) {
        return this.makeRequest(endpoint, {
            method: 'POST',
            data: data,
            ...opts
        });
    }
    
    async put(endpoint, data = {}, opts = {}) {
        return this.makeRequest(endpoint, {
            method: 'PUT',
            data: data,
            ...opts
        });
    }
    
    async delete(endpoint, opts = {}) {
        return this.makeRequest(endpoint, {
            method: 'DELETE',
            ...opts
        });
    }
    
    // Actualizar token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('plantamedicinal_token', token);
        } else {
            localStorage.removeItem('plantamedicinal_token');
            sessionStorage.removeItem('plantamedicinal_token');
        }
    }
}

// Clase para errores de API
class APIError extends Error {
    constructor(message, status = 0, details = null) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.details = details;
    }
}

// Instancia global del cliente API
const apiClient = new APIClient();

// Funciones de utilidad para migración gradual
const legacyToAPIAdapter = {
    // Adaptador para mantener compatibilidad con código existente
    async migrateGetRequest(legacyFunction, apiEndpoint, params = {}) {
        try {
            // Intentar con la nueva API
            return await apiClient.get(apiEndpoint, params);
        } catch (error) {
            console.warn('API fallback to legacy:', error.message);
            // Fallback al método legacy si falla
            return legacyFunction(params);
        }
    },
    
    async migratePostRequest(legacyFunction, apiEndpoint, data = {}) {
        try {
            // Intentar con la nueva API
            return await apiClient.post(apiEndpoint, data);
        } catch (error) {
            console.warn('API fallback to legacy:', error.message);
            // Fallback al método legacy si falla
            return legacyFunction(data);
        }
    }
};

// Utilidades para manejo de respuestas
const responseUtils = {
    // Extraer datos de respuesta API
    extractData(response) {
        return response.data || response;
    },
    
    // Extraer metadata de paginación
    extractMeta(response) {
        return response.meta || {};
    },
    
    // Verificar si hay más páginas
    hasNextPage(meta) {
        return meta.has_next_page || false;
    },
    
    // Obtener número total de páginas
    getTotalPages(meta) {
        return meta.total_pages || 1;
    },
    
    // Mostrar mensaje de éxito
    showSuccess(message) {
        // Implementar según el sistema de notificaciones del frontend
        if (window.showNotification) {
            window.showNotification(message, 'success');
        } else {
            console.log('Success:', message);
        }
    },
    
    // Mostrar mensaje de error
    showError(error) {
        let message = 'Ha ocurrido un error';
        
        if (error instanceof APIError) {
            message = error.message;
        } else if (typeof error === 'string') {
            message = error;
        } else if (error.message) {
            message = error.message;
        }
        
        // Implementar según el sistema de notificaciones del frontend
        if (window.showNotification) {
            window.showNotification(message, 'error');
        } else {
            console.error('Error:', message);
            alert(message); // Fallback temporal
        }
    }
};

// Interceptor para manejo automático de errores de autenticación
const setupAuthInterceptor = () => {
    // Extender el cliente API para manejar errores 401
    const originalMakeRequest = apiClient.makeRequest.bind(apiClient);
    
    apiClient.makeRequest = async function(endpoint, options = {}) {
        try {
            return await originalMakeRequest(endpoint, options);
        } catch (error) {
            if (error.status === 401) {
                // Token expirado o inválido
                this.setToken(null);
                if (window.authManager && typeof window.authManager.handleAuthError === 'function') {
                    window.authManager.handleAuthError();
                } else {
                    // Redirigir a login en la misma carpeta (soporta subcarpetas como /plantamedicinal/)
                    const basePath = window.location.pathname.replace(/[^/]+$/, '');
                    const params = 'session_expired=1';
                    window.location.href = `${basePath}index.html?${params}`;
                }
            }
            throw error;
        }
    };
};

// Inicializar interceptor
setupAuthInterceptor();

// Log de configuración
console.log('API Configuration loaded');
console.log('Base URL:', apiConfig.baseURL);
console.log('Token available:', !!apiClient.token);

// Exportar para uso global
window.apiConfig = apiConfig;
window.apiClient = apiClient;
window.APIError = APIError;
window.legacyToAPIAdapter = legacyToAPIAdapter;
window.responseUtils = responseUtils;


