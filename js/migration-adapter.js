// Adaptador para migrar el frontend existente a usar las nuevas APIs MySQL
// Reemplaza las funciones de datos simulados por llamadas a APIs reales

console.log('Loading Migration Adapter...');

// Variables globales para compatibilidad con el cÃ³digo existente
let currentUser = null;
let authToken = null;

// Interceptar y reemplazar las variables de datos simulados existentes
if (window.userDatabase) {
    console.log('Replacing userDatabase with API calls...');
}

if (window.dataManager) {
    console.log('Replacing dataManager with API calls...');
}

// Adaptador para compatibilidad con el sistema existente
window.apiAdapter = {
    // Migrar funciÃ³n de login existente
    async login(email, password, remember = false) {
        try {
            const response = await apiClient.post(apiConfig.endpoints.auth.login, {
                email,
                password,
                remember
            });

            if (response.success) {
                const { user, token } = response.data;
                
                // Actualizar variables globales para compatibilidad
                currentUser = user;
                authToken = token;
                
                // Actualizar authState si existe
                if (window.authState) {
                    window.authState.isAuthenticated = true;
                    window.authState.currentUser = user;
                    window.authState.token = token;
                }

                return { success: true, user, message: response.message };
            }

            return { success: false, message: response.message };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Migrar funciÃ³n de registro
    async register(userData) {
        try {
            const response = await apiClient.post(apiConfig.endpoints.auth.register, userData);
            return { 
                success: response.success, 
                message: response.message,
                user: response.data?.user 
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Migrar funciÃ³n de logout
    async logout() {
        try {
            await apiClient.post(apiConfig.endpoints.auth.logout);
            
            // Limpiar variables globales
            currentUser = null;
            authToken = null;
            
            if (window.authState) {
                window.authState.isAuthenticated = false;
                window.authState.currentUser = null;
                window.authState.token = null;
            }
            
            return { success: true, message: 'Logout exitoso' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Migrar obtenciÃ³n de plantas
    async getPlantas(page = 1, limit = 10, filters = {}) {
        try {
            const params = { page, limit, ...filters };
            const response = await apiClient.get(apiConfig.endpoints.plantas.list, params);
            
            return {
                success: true,
                data: response.data.plantas || response.data,
                meta: response.data.meta || {},
                totalRecords: response.data.meta?.total_records || 0
            };
        } catch (error) {
            return { success: false, message: error.message, data: [] };
        }
    },

    // Migrar bÃºsqueda de plantas
    async searchPlantas(searchTerm, filters = {}) {
        try {
            const params = { search: searchTerm, ...filters };
            const response = await apiClient.get(apiConfig.endpoints.plantas.search, params);
            
            return {
                success: true,
                data: response.data.plantas || response.data,
                totalRecords: response.data.meta?.total_records || 0
            };
        } catch (error) {
            return { success: false, message: error.message, data: [] };
        }
    },

    // Migrar obtenciÃ³n de recetas
    async getRecetas(page = 1, limit = 10, filters = {}) {
        try {
            const params = { page, limit, ...filters };
            const response = await apiClient.get(apiConfig.endpoints.recetas.list, params);
            
            return {
                success: true,
                data: response.data.recetas || response.data,
                meta: response.data.meta || {},
                totalRecords: response.data.meta?.total_records || 0
            };
        } catch (error) {
            return { success: false, message: error.message, data: [] };
        }
    },

    // Migrar creaciÃ³n de recetas
    async createReceta(recetaData) {
        try {
            const response = await apiClient.post(apiConfig.endpoints.recetas.create, recetaData);
            return { 
                success: response.success, 
                message: response.message,
                data: response.data 
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Migrar sistema de favoritos
    async toggleFavorite(type, id) {
        try {
            const endpoint = type === 'planta' ? 
                apiConfig.endpoints.plantas.favorite : 
                apiConfig.endpoints.recetas.favorite;
                
            const response = await apiClient.post(endpoint, { 
                [`${type}_id`]: id 
            });
            
            return { 
                success: response.success, 
                message: response.message,
                isFavorite: response.data?.is_favorite || false
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Migrar calificaciones
    async rateContent(type, id, rating, comment = '') {
        try {
            const endpoint = type === 'planta' ? 
                apiConfig.endpoints.plantas.rate : 
                apiConfig.endpoints.recetas.rate;
                
            const response = await apiClient.post(endpoint, { 
                [`${type}_id`]: id,
                calificacion: rating,
                comentario: comment
            });
            
            return { 
                success: response.success, 
                message: response.message,
                data: response.data 
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Verificar estado de autenticaciÃ³n
    async checkAuth() {
        try {
            // Evitar llamada al servidor si no hay token
            if (!apiClient.token) {
                return { success: false, message: 'No token present' };
            }
            const response = await apiClient.get(apiConfig.endpoints.auth.verify);
            
            if (response.success) {
                currentUser = response.data.user;
                
                if (window.authState) {
                    window.authState.isAuthenticated = true;
                    window.authState.currentUser = currentUser;
                }
                
                return { success: true, user: currentUser };
            }
            
            return { success: false };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Obtener estadÃ­sticas para dashboard admin
    async getDashboardStats() {
        try {
            const response = await apiClient.get(apiConfig.endpoints.admin.dashboard);
            return { 
                success: response.success, 
                data: response.data,
                message: response.message 
            };
        } catch (error) {
            return { success: false, message: error.message, data: {} };
        }
    },

    // Usuario actual
    getCurrentUser() {
        return currentUser;
    },

    // Token actual
    getToken() {
        return authToken;
    },

    // Verificar si estÃ¡ autenticado
    isAuthenticated() {
        return !!currentUser && !!authToken;
    }
};

// Funciones de compatibilidad para reemplazar variables globales existentes
window.migrateUserDatabase = {
    async authenticate(email, password) {
        return await window.apiAdapter.login(email, password);
    },

    async register(userData) {
        return await window.apiAdapter.register(userData);
    },

    async logout() {
        return await window.apiAdapter.logout();
    },

    getCurrentUser() {
        return window.apiAdapter.getCurrentUser();
    },

    isAuthenticated() {
        return window.apiAdapter.isAuthenticated();
    }
};

window.migrateDataManager = {
    async getPlantas(filters = {}) {
        return await window.apiAdapter.getPlantas(1, 50, filters);
    },

    async searchPlantas(searchTerm) {
        return await window.apiAdapter.searchPlantas(searchTerm);
    },

    async getRecetas(filters = {}) {
        return await window.apiAdapter.getRecetas(1, 50, filters);
    },

    async createReceta(recetaData) {
        return await window.apiAdapter.createReceta(recetaData);
    },

    async toggleFavorite(type, id) {
        return await window.apiAdapter.toggleFavorite(type, id);
    },

    async rateContent(type, id, rating, comment = '') {
        return await window.apiAdapter.rateContent(type, id, rating, comment);
    }
};

// Interceptar y actualizar funciones existentes del sistema
document.addEventListener('DOMContentLoaded', function() {
    // Sobrescribir userDatabase si existe
    if (window.userDatabase) {
        console.log('Overriding userDatabase with API functions...');
        
        const originalUserDatabase = window.userDatabase;
        window.userDatabase = {
            ...originalUserDatabase,
            authenticate: window.migrateUserDatabase.authenticate,
            register: window.migrateUserDatabase.register,
            logout: window.migrateUserDatabase.logout,
            getCurrentUser: window.migrateUserDatabase.getCurrentUser,
            isAuthenticated: window.migrateUserDatabase.isAuthenticated
        };
    }

    // Sobrescribir dataManager si existe
    if (window.dataManager) {
        console.log('Overriding dataManager with API functions...');
        
        const originalDataManager = window.dataManager;
        window.dataManager = {
            ...originalDataManager,
            getPlantas: window.migrateDataManager.getPlantas,
            searchPlantas: window.migrateDataManager.searchPlantas,
            getRecetas: window.migrateDataManager.getRecetas,
            createReceta: window.migrateDataManager.createReceta,
            toggleFavorite: window.migrateDataManager.toggleFavorite,
            rateContent: window.migrateDataManager.rateContent
        };
    }

    // Interceptar formularios de login existentes
    const loginForms = document.querySelectorAll('form[id*="login"], .login-form');
    loginForms.forEach(form => {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const email = formData.get('email');
            const password = formData.get('password');
            
            if (email && password) {
                const result = await window.apiAdapter.login(email, password);
                
                if (result.success) {
                    // Trigger evento personalizado para que el cÃ³digo existente lo detecte
                    window.dispatchEvent(new CustomEvent('loginSuccess', { 
                        detail: result 
                    }));
                    
                    // Mostrar mensaje de Ã©xito
                    if (window.responseUtils) {
                        window.responseUtils.showSuccess(result.message);
                    }
                } else {
                    // Mostrar error
                    if (window.responseUtils) {
                        window.responseUtils.showError(result.message);
                    } else {
                        alert(result.message);
                    }
                }
            }
        });
    });

    // Verificar autenticaciÃ³n al cargar
    window.apiAdapter.checkAuth().then(result => {
        if (result.success) {
            console.log('User authenticated via API:', result.user.email);
            
            // Trigger evento para actualizar UI
            window.dispatchEvent(new CustomEvent('authStateChanged', { 
                detail: { authenticated: true, user: result.user } 
            }));
        } else {
            console.log('No authenticated user found');
        }
    });
});

// Funciones helper para debugging
window.debugAPI = {
    testConnection: async () => {
        try {
            const response = await apiClient.get('/auth.php?action=test');
            console.log('API Test Result:', response);
            return response;
        } catch (error) {
            console.error('API Test Failed:', error);
            return { success: false, error: error.message };
        }
    },

    getCurrentAuth: () => {
        return {
            user: window.apiAdapter.getCurrentUser(),
            token: window.apiAdapter.getToken(),
            authenticated: window.apiAdapter.isAuthenticated()
        };
    },

    clearAuth: () => {
        window.apiAdapter.logout();
        console.log('Auth cleared');
    }
};

console.log('Migration Adapter loaded successfully');
console.log('Available: window.apiAdapter, window.debugAPI');
console.log('Test connection: debugAPI.testConnection()');
