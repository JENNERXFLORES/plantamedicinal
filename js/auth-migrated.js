// Sistema de autenticación migrado a MySQL para PlantaMedicinal
// Manejo de login, registro y gestión de usuarios con APIs PHP

// Configuración de autenticación (actualizada para API)
const authConfig = {
    tokenKey: 'plantamedicinal_token',
    userKey: 'plantamedicinal_user',
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 horas
    roles: {
        ADMIN: 'administrador',
        USER: 'usuario',
        PROVIDER: 'proveedor'
    }
};

// Estado de autenticación
const authState = {
    isAuthenticated: false,
    currentUser: null,
    token: null,
    sessionExpiry: null
};

// Utilidades de autenticación actualizadas para API
const authUtils = {
    // Normalizar email quitando espacios y caracteres invisibles
    normalizeEmail: (email) => {
        try {
            return (email ?? '')
                .toString()
                .normalize('NFKC')
                .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width chars
                .replace(/\s+/g, ' ') // colapsar espacios
                .trim()
                .toLowerCase();
        } catch (_) {
            return '';
        }
    },
    // Validar email (con normalizaci�n segura)
    validateEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const value = authUtils.normalizeEmail(email);
        return value.length > 0 && re.test(value);
    },

    // Validar contraseña
    validatePassword: (password) => {
        return password.length >= 6;
    },

    // Almacenar datos de sesión
    setSession: (user, token) => {
        const expiry = Date.now() + authConfig.sessionTimeout;
        
        localStorage.setItem(authConfig.tokenKey, token);
        localStorage.setItem(authConfig.userKey, JSON.stringify(user));
        localStorage.setItem('plantamedicinal_expiry', expiry.toString());
        
        authState.isAuthenticated = true;
        authState.currentUser = user;
        authState.token = token;
        authState.sessionExpiry = expiry;
        
        // Actualizar token en apiClient
        if (window.apiClient) {
            window.apiClient.setToken(token);
        }
    },

    // Limpiar sesión
    clearSession: () => {
        localStorage.removeItem(authConfig.tokenKey);
        localStorage.removeItem(authConfig.userKey);
        localStorage.removeItem('plantamedicinal_expiry');
        
        authState.isAuthenticated = false;
        authState.currentUser = null;
        authState.token = null;
        authState.sessionExpiry = null;
        
        // Limpiar token en apiClient
        if (window.apiClient) {
            window.apiClient.setToken(null);
        }
    },

    // Verificar si la sesión es válida
    isSessionValid: () => {
        const expiry = localStorage.getItem('plantamedicinal_expiry');
        const token = localStorage.getItem(authConfig.tokenKey);
        return !!expiry && !!token && Date.now() < parseInt(expiry);
    },

    // Restaurar sesión desde localStorage
    restoreSession: async () => {
        if (authUtils.isSessionValid()) {
            const token = localStorage.getItem(authConfig.tokenKey);
            const user = JSON.parse(localStorage.getItem(authConfig.userKey) || 'null');
            const expiry = parseInt(localStorage.getItem('plantamedicinal_expiry'));
            
            if (token && user) {
                // Verificar token con el servidor
                try {
                    const response = await apiClient.get('/auth.php?action=verify');
                    
                    authState.isAuthenticated = true;
                    authState.currentUser = response.data.user;
                    authState.token = token;
                    authState.sessionExpiry = expiry;
                    
                    // Actualizar datos del usuario si han cambiado
                    localStorage.setItem(authConfig.userKey, JSON.stringify(response.data.user));
                    
                    return true;
                } catch (error) {
                    console.warn('Token verification failed:', error.message);
                    authUtils.clearSession();
                    return false;
                }
            }
        }
        
        authUtils.clearSession();
        return false;
    },

    // Obtener usuario actual
    getCurrentUser: () => authState.currentUser,

    // Verificar rol del usuario
    hasRole: (role) => {
        if (!authState.currentUser) return false;
        return authState.currentUser.rol === role;
    },

    // Verificar si es admin
    isAdmin: () => authUtils.hasRole(authConfig.roles.ADMIN),

    // Verificar si es proveedor o admin
    isProvider: () => authUtils.hasRole(authConfig.roles.PROVIDER) || authUtils.isAdmin(),

    // Verificar permisos mínimos
    hasMinRole: (requiredRole) => {
        const roleHierarchy = {
            'usuario': 1,
            'proveedor': 2,
            'administrador': 3
        };
        
        const userLevel = roleHierarchy[authState.currentUser?.rol] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;
        
        return userLevel >= requiredLevel;
    }
};

// Gestor de autenticación migrado a API
const authManager = {
    // Inicializar el sistema de autenticación
    init: async () => {
        console.log('Initializing Auth Manager (API Mode)...');
        
        try {
            // Intentar restaurar sesión existente
            const restored = await authUtils.restoreSession();
            
            if (restored) {
                console.log('Session restored successfully');
                authManager.updateUI();
            } else {
                console.log('No valid session found');
            }
        } catch (error) {
            console.error('Error initializing auth:', error);
        }
    },

    // Login con API
    login: async (email, password, remember = false) => {
        try {
            // Validar entrada
            email = authUtils.normalizeEmail(email);
            if (!email) { throw new Error('Ingresa tu email'); }

            if (!authUtils.validatePassword(password)) {
                throw new Error('La contrasena debe tener al menos 6 caracteres');
            }

            // Mostrar loading
            authManager.showLoading(true);

            // Normalizar email antes de enviar
            const emailNormalized = authUtils.normalizeEmail(email);

            // Llamada a la API
            const response = await apiClient.post('/auth.php?action=login', {
                email: emailNormalized,
                password: password,
                remember: remember
            });

            const { user, token } = response.data;

            // Establecer sesión
            authUtils.setSession(user, token);

            // Actualizar UI
            authManager.updateUI();

            // Log de actividad
            console.log('Login successful:', user.email);

            return {
                success: true,
                user: user,
                message: 'Inicio de sesion exitoso'
            };

        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.message || 'Error al iniciar sesion'
            };
        } finally {
            authManager.showLoading(false);
        }
    },

    // Registro con API
    register: async (userData) => {
        try {
            // Validar datos
            const { nombre, apellido, email, password, rol } = userData;

            if (!nombre || !apellido) {
                throw new Error('Nombre y apellido son obligatorios');
            }

            if (!email) { throw new Error('Ingresa tu email'); }

            if (!authUtils.validatePassword(password)) {
                throw new Error('La contrasena debe tener al menos 6 caracteres');
            }

            // Mostrar loading
            authManager.showLoading(true);

            // Llamada a la API
            const response = await apiClient.post('/auth.php?action=register', {
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                email: email.toLowerCase().trim(),
                password: password,
                confirmPassword: password,
                rol: rol || 'usuario'
            });

            console.log('Registration successful:', email);

            return {
                success: true,
                message: 'Registro exitoso. Ya puedes iniciar sesion.',
                user: response.data.user
            };

        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                message: error.message || 'Error al registrarse'
            };
        } finally {
            authManager.showLoading(false);
        }
    },

    // Logout con API
    logout: async () => {
        try {
            // Llamar a la API para invalidar el token en el servidor
            if (authState.token) {
                await apiClient.post('/auth.php?action=logout');
            }
        } catch (error) {
            console.warn('Logout API call failed:', error.message);
        } finally {
            // Limpiar sesión local siempre
            authUtils.clearSession();
            authManager.updateUI();
            console.log('Logged out successfully');
        }
    },

    // Verificar autenticación
    checkAuth: () => {
        return authState.isAuthenticated && authUtils.isSessionValid();
    },

    // Renovar token si es necesario
    refreshTokenIfNeeded: async () => {
        try {
            if (authState.token && authUtils.isSessionValid()) {
                const response = await apiClient.post('/auth.php?action=refresh');
                
                if (response.data.token) {
                    const user = authState.currentUser;
                    authUtils.setSession(user, response.data.token);
                }
            }
        } catch (error) {
            console.warn('Token refresh failed:', error.message);
            authUtils.clearSession();
        }
    },

    // Manejar errores de autenticación
    handleAuthError: () => {
        authUtils.clearSession();
        authManager.updateUI();
        
        // Redirigir a login si no estamos ya ahí
        if (!window.location.pathname.includes('index.html')) {
            const basePath = window.location.pathname.replace(/[^/]+$/, '');
            window.location.href = `${basePath}index.html?session_expired=1`;
        }
    },

    // Actualizar interfaz de usuario
    updateUI: () => {
        const isAuthenticated = authManager.checkAuth();
        const user = authState.currentUser;

        // Actualizar elementos de navegación
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');
        const logoutBtn = document.getElementById('logoutBtn');

        if (isAuthenticated && user) {
            // Mostrar menú de usuario
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            if (userMenu) userMenu.style.display = 'block';
            if (userName) userName.textContent = `${user.nombre} ${user.apellido}`;

            // Mostrar/ocultar opciones según rol
            authManager.updateRoleBasedUI(user.rol);

        } else {
            // Mostrar botones de login/register
            if (loginBtn) loginBtn.style.display = 'block';
            if (registerBtn) registerBtn.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';
        }

        // Configurar event listeners si no están configurados
        if (logoutBtn && !logoutBtn.hasAttribute('data-listener')) {
            logoutBtn.addEventListener('click', authManager.logout);
            logoutBtn.setAttribute('data-listener', 'true');
        }
    },

    // Actualizar UI basada en roles
    updateRoleBasedUI: (role) => {
        const adminElements = document.querySelectorAll('.admin-only');
        const providerElements = document.querySelectorAll('.provider-only');

        // Mostrar/ocultar elementos según rol
        adminElements.forEach(el => {
            el.style.display = role === 'administrador' ? 'block' : 'none';
        });

        providerElements.forEach(el => {
            el.style.display = ['proveedor', 'administrador'].includes(role) ? 'block' : 'none';
        });

        // Actualizar links de navegación
        const adminLink = document.getElementById('adminLink');
        if (adminLink) {
            adminLink.style.display = role === 'administrador' ? 'block' : 'none';
        }
    },

    // Mostrar/ocultar indicador de carga
    showLoading: (show) => {
        const loadingElements = document.querySelectorAll('.auth-loading');
        loadingElements.forEach(el => {
            el.style.display = show ? 'block' : 'none';
        });

        const submitButtons = document.querySelectorAll('.auth-submit');
        submitButtons.forEach(btn => {
            btn.disabled = show;
            if (show) {
                btn.textContent = btn.getAttribute('data-loading-text') || 'Cargando...';
            } else {
                btn.textContent = btn.getAttribute('data-original-text') || btn.textContent;
            }
        });
    },

    // Proteger rutas que requieren autenticación
    requireAuth: (minRole = 'usuario') => {
        if (!authManager.checkAuth()) {
            {
                const basePath = window.location.pathname.replace(/[^/]+$/, '');
                window.location.href = `${basePath}index.html?redirect=` + encodeURIComponent(window.location.pathname);
            }
            return false;
        }

        if (!authUtils.hasMinRole(minRole)) {
            alert('No tienes permisos suficientes para acceder a esta página');
            {
                const basePath = window.location.pathname.replace(/[^/]+$/, '');
                window.location.href = `${basePath}index.html`;
            }
            return false;
        }

        return true;
    },

    // Obtener perfil actualizado del usuario
    getProfile: async () => {
        try {
            const response = await apiClient.get('/auth.php?action=profile');
            
            // Actualizar usuario en la sesión
            authState.currentUser = response.data.user;
            localStorage.setItem(authConfig.userKey, JSON.stringify(response.data.user));
            
            return response.data.user;
        } catch (error) {
            console.error('Error getting profile:', error);
            throw error;
        }
    },

    // Actualizar perfil del usuario
    updateProfile: async (profileData) => {
        try {
            const response = await apiClient.put('/auth.php?action=profile', profileData);
            
            // Actualizar usuario en la sesión
            authState.currentUser = response.data.user;
            localStorage.setItem(authConfig.userKey, JSON.stringify(response.data.user));
            
            authManager.updateUI();
            
            return {
                success: true,
                message: 'Perfil actualizado exitosamente'
            };
        } catch (error) {
            console.error('Error updating profile:', error);
            return {
                success: false,
                message: error.message || 'Error al actualizar el perfil'
            };
        }
    }
};

// Configurar event listeners para formularios de auth
document.addEventListener('DOMContentLoaded', () => {
    // Formulario de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(loginForm);
            const email = formData.get('email') || document.getElementById('loginEmail')?.value || '';
            const password = formData.get('password') || document.getElementById('loginPassword')?.value || '';
            const remember = formData.has('remember')
                ? (formData.get('remember') === 'on' || formData.get('remember') === 'true' || formData.get('remember') === '1')
                : (document.querySelector('#loginForm input[type="checkbox"][name="remember"]')?.checked || false);

            const result = await authManager.login(email, password, remember);
            
            if (result.success) {
                // Redirigir según rol o página solicitada
                const urlParams = new URLSearchParams(window.location.search);
                const redirect = urlParams.get('redirect') || 'index.html';
                // Si redirect es relativo, mantén la carpeta actual
                if (/^https?:\/\//i.test(redirect) || redirect.startsWith('/')) {
                    window.location.href = redirect;
                } else {
                    const basePath = window.location.pathname.replace(/[^/]+$/, '');
                    window.location.href = `${basePath}${redirect}`;
                }
            } else {
                if (window.responseUtils) {
                    window.responseUtils.showError(result.message);
                } else {
                    alert(result.message);
                }
            }
        });
    }

    // Formulario de registro
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(registerForm);
            const getField = (name, id) => {
                const byName = formData.get(name);
                if (byName && typeof byName === 'string') return byName;
                const el = document.getElementById(id);
                return el && typeof el.value === 'string' ? el.value : '';
            };
            const userData = {
                nombre: getField('nombre', 'registerName'),
                apellido: getField('apellido', 'registerLastName'),
                email: getField('email', 'registerEmail'),
                password: getField('password', 'registerPassword'),
                rol: formData.get('rol') || (document.getElementById('registerRole')?.value || 'usuario')
            };

            const result = await authManager.register(userData);
            
            if (result.success) {
                if (window.responseUtils) {
                    window.responseUtils.showSuccess(result.message);
                } else {
                    alert(result.message);
                }
                
                // Limpiar formulario
                registerForm.reset();
                
                // Cerrar modal de registro si existe
                if (typeof window.cerrarRegistro === 'function') {
                    try { window.cerrarRegistro(); } catch (e) { /* ignore */ }
                } else {
                    // Fallback: ocultar modal manualmente
                    const modal = document.getElementById('registerModal');
                    const content = document.getElementById('registerContent');
                    if (modal && content) {
                        content.classList.add('scale-95', 'opacity-0');
                        content.classList.remove('scale-100', 'opacity-100');
                        setTimeout(() => modal.classList.add('hidden'), 300);
                    }
                }

                // Cambiar a tab de login si existe
                const loginTab = document.getElementById('loginTab');
                if (loginTab) {
                    loginTab.click();
                }

                // Opcional: abrir modal de login si no hay sesi?n activa
                if (window.authManager && typeof window.authManager.checkAuth === 'function' && !window.authManager.checkAuth()) {
                    if (typeof window.mostrarLogin === 'function') {
                        try { window.mostrarLogin(); } catch (e) { /* ignore */ }
                    }
                }
            } else {
                if (window.responseUtils) {
                    window.responseUtils.showError(result.message);
                } else {
                    alert(result.message);
                }
            }
        });
    }

    // Inicializar el manager
    authManager.init();
});

// Renovar token periódicamente
setInterval(async () => {
    if (authManager.checkAuth()) {
        await authManager.refreshTokenIfNeeded();
    }
}, 5 * 60 * 1000); // Cada 5 minutos

// Exportar para uso global
window.authConfig = authConfig;
window.authState = authState;
window.authUtils = authUtils;
window.authManager = authManager;

console.log('Auth Manager (API Mode) loaded successfully');




