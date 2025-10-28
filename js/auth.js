// Sistema de autenticación para PlantaMedicinal
// Manejo de login, registro y gestión de usuarios

// Configuración de autenticación
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

// Utilidades de autenticación
const authUtils = {
    // Generar token simulado
    generateToken: () => {
        return btoa(Math.random().toString(36) + Date.now().toString(36));
    },

    // Validar email
    validateEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Validar contraseña
    validatePassword: (password) => {
        return password.length >= 6;
    },

    // Hash simple de contraseña (en producción usar bcrypt)
    hashPassword: (password) => {
        return btoa(password + 'plantamedicinal_salt');
    },

    // Verificar contraseña
    verifyPassword: (password, hash) => {
        return authUtils.hashPassword(password) === hash;
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
    },

    // Verificar si la sesión es válida
    isSessionValid: () => {
        const expiry = localStorage.getItem('plantamedicinal_expiry');
        return expiry && Date.now() < parseInt(expiry);
    },

    // Restaurar sesión desde localStorage
    restoreSession: () => {
        if (authUtils.isSessionValid()) {
            const token = localStorage.getItem(authConfig.tokenKey);
            const user = JSON.parse(localStorage.getItem(authConfig.userKey) || 'null');
            const expiry = parseInt(localStorage.getItem('plantamedicinal_expiry'));
            
            if (token && user) {
                authState.isAuthenticated = true;
                authState.currentUser = user;
                authState.token = token;
                authState.sessionExpiry = expiry;
                return true;
            }
        }
        
        authUtils.clearSession();
        return false;
    }
};

// Base de datos simulada de usuarios
const userDatabase = {
    users: [
        {
            id: 1,
            nombre: 'Admin',
            apellido: 'Principal',
            email: 'admin@plantamedicinal.org',
            password: authUtils.hashPassword('admin123'),
            rol: authConfig.roles.ADMIN,
            activo: true,
            fecha_registro: new Date('2024-01-01'),
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'
        },
        {
            id: 2,
            nombre: 'María',
            apellido: 'González',
            email: 'maria@email.com',
            password: authUtils.hashPassword('usuario123'),
            rol: authConfig.roles.USER,
            activo: true,
            fecha_registro: new Date('2024-02-15'),
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150'
        },
        {
            id: 3,
            nombre: 'Carlos',
            apellido: 'Mamallacta',
            email: 'carlos.wayuu@email.com',
            password: authUtils.hashPassword('proveedor123'),
            rol: authConfig.roles.PROVIDER,
            activo: true,
            fecha_registro: new Date('2024-03-01'),
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            comunidad: 'Wayuu',
            region: 'La Guajira, Colombia'
        }
    ],

    // Buscar usuario por email
    findByEmail: (email) => {
        return userDatabase.users.find(user => user.email === email);
    },

    // Crear nuevo usuario
    create: (userData) => {
        const newUser = {
            id: userDatabase.users.length + 1,
            ...userData,
            password: authUtils.hashPassword(userData.password),
            activo: true,
            fecha_registro: new Date(),
            avatar: `https://ui-avatars.com/api/?name=${userData.nombre}+${userData.apellido}&background=2d5a3d&color=fff`
        };
        
        userDatabase.users.push(newUser);
        return newUser;
    },

    // Verificar si el email ya existe
    emailExists: (email) => {
        return userDatabase.users.some(user => user.email === email);
    }
};

// Sistema de login
const loginSystem = {
    // Mostrar modal de login
    show: () => {
        const modal = document.getElementById('loginModal');
        const content = document.getElementById('loginContent');
        
        if (modal && content) {
            modal.classList.remove('hidden');
            setTimeout(() => {
                content.classList.remove('scale-95', 'opacity-0');
                content.classList.add('scale-100', 'opacity-100');
            }, 50);
        }
    },

    // Ocultar modal de login
    hide: () => {
        const modal = document.getElementById('loginModal');
        const content = document.getElementById('loginContent');
        
        if (modal && content) {
            content.classList.remove('scale-100', 'opacity-100');
            content.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 200);
        }
    },

    // Procesar login
    process: async (email, password) => {
        // Validar datos
        if (!authUtils.validateEmail(email)) {
            throw new Error('Email inválido');
        }
        
        if (!password) {
            throw new Error('La contraseña es requerida');
        }
        
        // Buscar usuario
        const user = userDatabase.findByEmail(email);
        
        if (!user) {
            throw new Error('Usuario no encontrado');
        }
        
        if (!user.activo) {
            throw new Error('Usuario desactivado');
        }
        
        // Verificar contraseña
        if (!authUtils.verifyPassword(password, user.password)) {
            throw new Error('Contraseña incorrecta');
        }
        
        // Generar token y establecer sesión
        const token = authUtils.generateToken();
        const userSession = {
            id: user.id,
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
            rol: user.rol,
            avatar: user.avatar,
            comunidad: user.comunidad,
            region: user.region
        };
        
        authUtils.setSession(userSession, token);
        
        return userSession;
    },

    // Configurar eventos del formulario
    setupForm: () => {
        const form = document.getElementById('loginForm');
        
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                const submitBtn = form.querySelector('button[type="submit"]');
                
                // Mostrar loading
                const originalText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Iniciando...';
                
                try {
                    const user = await loginSystem.process(email, password);
                    
                    utils.showNotification(`¡Bienvenido, ${user.nombre}!`, 'success');
                    loginSystem.hide();
                    uiManager.updateAuthState();
                    
                    // Limpiar formulario
                    form.reset();
                    
                } catch (error) {
                    utils.showNotification(error.message, 'error');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            });
        }
    }
};

// Sistema de registro
const registerSystem = {
    // Mostrar modal de registro
    show: () => {
        const modal = document.getElementById('registerModal');
        const content = document.getElementById('registerContent');
        
        if (modal && content) {
            modal.classList.remove('hidden');
            setTimeout(() => {
                content.classList.remove('scale-95', 'opacity-0');
                content.classList.add('scale-100', 'opacity-100');
            }, 50);
        }
    },

    // Ocultar modal de registro
    hide: () => {
        const modal = document.getElementById('registerModal');
        const content = document.getElementById('registerContent');
        
        if (modal && content) {
            content.classList.remove('scale-100', 'opacity-100');
            content.classList.add('scale-95', 'opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 200);
        }
    },

    // Procesar registro
    process: async (userData) => {
        // Validaciones
        if (!userData.nombre || userData.nombre.trim().length < 2) {
            throw new Error('El nombre debe tener al menos 2 caracteres');
        }
        
        if (!userData.apellido || userData.apellido.trim().length < 2) {
            throw new Error('El apellido debe tener al menos 2 caracteres');
        }
        
        if (!authUtils.validateEmail(userData.email)) {
            throw new Error('Email inválido');
        }
        
        if (userDatabase.emailExists(userData.email)) {
            throw new Error('Este email ya está registrado');
        }
        
        if (!authUtils.validatePassword(userData.password)) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
        }
        
        if (userData.password !== userData.confirmPassword) {
            throw new Error('Las contraseñas no coinciden');
        }
        
        // Crear usuario
        const newUser = userDatabase.create({
            nombre: userData.nombre.trim(),
            apellido: userData.apellido.trim(),
            email: userData.email.toLowerCase(),
            password: userData.password,
            rol: userData.rol || authConfig.roles.USER,
            comunidad: userData.comunidad,
            region: userData.region
        });
        
        // Auto-login después del registro
        const token = authUtils.generateToken();
        const userSession = {
            id: newUser.id,
            nombre: newUser.nombre,
            apellido: newUser.apellido,
            email: newUser.email,
            rol: newUser.rol,
            avatar: newUser.avatar,
            comunidad: newUser.comunidad,
            region: newUser.region
        };
        
        authUtils.setSession(userSession, token);
        
        return userSession;
    },

    // Configurar eventos del formulario
    setupForm: () => {
        const form = document.getElementById('registerForm');
        
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                const userData = {
                    nombre: document.getElementById('registerName').value,
                    apellido: document.getElementById('registerLastName').value,
                    email: document.getElementById('registerEmail').value,
                    rol: document.getElementById('registerRole').value,
                    password: document.getElementById('registerPassword').value,
                    confirmPassword: document.getElementById('registerConfirmPassword').value
                };
                
                const submitBtn = form.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                
                // Mostrar loading
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creando cuenta...';
                
                try {
                    const user = await registerSystem.process(userData);
                    
                    utils.showNotification(`¡Bienvenido a PlantaMedicinal, ${user.nombre}!`, 'success');
                    registerSystem.hide();
                    uiManager.updateAuthState();
                    
                    // Limpiar formulario
                    form.reset();
                    
                } catch (error) {
                    utils.showNotification(error.message, 'error');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            });
            
            // Validación en tiempo real
            registerSystem.setupRealtimeValidation();
        }
    },

    // Validación en tiempo real
    setupRealtimeValidation: () => {
        const emailInput = document.getElementById('registerEmail');
        const passwordInput = document.getElementById('registerPassword');
        const confirmPasswordInput = document.getElementById('registerConfirmPassword');
        
        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                const email = emailInput.value;
                if (email && !authUtils.validateEmail(email)) {
                    registerSystem.showFieldError(emailInput, 'Email inválido');
                } else if (email && userDatabase.emailExists(email)) {
                    registerSystem.showFieldError(emailInput, 'Este email ya está registrado');
                } else {
                    registerSystem.clearFieldError(emailInput);
                }
            });
        }
        
        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                const password = passwordInput.value;
                if (password && !authUtils.validatePassword(password)) {
                    registerSystem.showFieldError(passwordInput, 'Mínimo 6 caracteres');
                } else {
                    registerSystem.clearFieldError(passwordInput);
                }
            });
        }
        
        if (confirmPasswordInput && passwordInput) {
            confirmPasswordInput.addEventListener('input', () => {
                const password = passwordInput.value;
                const confirmPassword = confirmPasswordInput.value;
                if (confirmPassword && password !== confirmPassword) {
                    registerSystem.showFieldError(confirmPasswordInput, 'Las contraseñas no coinciden');
                } else {
                    registerSystem.clearFieldError(confirmPasswordInput);
                }
            });
        }
    },

    // Mostrar error en campo
    showFieldError: (input, message) => {
        registerSystem.clearFieldError(input);
        
        input.classList.add('border-red-500');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error text-red-500 text-sm mt-1';
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);
    },

    // Limpiar error de campo
    clearFieldError: (input) => {
        input.classList.remove('border-red-500');
        const existingError = input.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }
};

// Gestión de la UI de autenticación
const uiManager = {
    // Actualizar estado de la interfaz según autenticación
    updateAuthState: () => {
        const isAuthenticated = authState.isAuthenticated;
        const user = authState.currentUser;
        
        // Actualizar botones de navegación
        const loginBtn = document.querySelector('[onclick="mostrarLogin()"]');
        const registerBtn = document.querySelector('[onclick="mostrarRegistro()"]');
        
        if (isAuthenticated && user) {
            // Usuario autenticado - mostrar perfil
            if (loginBtn && registerBtn) {
                const userMenu = uiManager.createUserMenu(user);
                loginBtn.parentNode.replaceChild(userMenu, loginBtn);
                registerBtn.style.display = 'none';
            }
            
            // Mostrar contenido según rol
            uiManager.showRoleBasedContent(user.rol);
            
        } else {
            // Usuario no autenticado - mostrar botones de login/registro
            uiManager.showAuthButtons();
        }
    },

    // Crear menú de usuario
    createUserMenu: (user) => {
        const userMenu = document.createElement('div');
        userMenu.className = 'relative group';
        
        userMenu.innerHTML = `
            <button class="flex items-center space-x-2 px-4 py-2 text-verde-medicina hover:text-green-700 transition-colors">
                <img src="${user.avatar}" alt="${user.nombre}" class="w-8 h-8 rounded-full">
                <span class="font-medium">${user.nombre}</span>
                <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div class="py-2">
                    <div class="px-4 py-2 border-b border-gray-100">
                        <p class="font-medium text-gray-900">${user.nombre} ${user.apellido}</p>
                        <p class="text-sm text-gray-500">${user.email}</p>
                        ${user.rol === authConfig.roles.ADMIN ? '<span class="badge badge-warning mt-1">Administrador</span>' : ''}
                        ${user.rol === authConfig.roles.PROVIDER ? '<span class="badge badge-info mt-1">Proveedor</span>' : ''}
                    </div>
                    <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <i class="fas fa-user mr-2"></i>Mi Perfil
                    </a>
                    <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <i class="fas fa-heart mr-2"></i>Mis Favoritos
                    </a>
                    ${user.rol === authConfig.roles.ADMIN ? `
                        <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <i class="fas fa-cog mr-2"></i>Panel Admin
                        </a>
                    ` : ''}
                    ${user.rol === authConfig.roles.PROVIDER ? `
                        <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <i class="fas fa-plus mr-2"></i>Publicar Receta
                        </a>
                    ` : ''}
                    <hr class="my-2">
                    <button onclick="cerrarSesion()" class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        <i class="fas fa-sign-out-alt mr-2"></i>Cerrar Sesión
                    </button>
                </div>
            </div>
        `;
        
        return userMenu;
    },

    // Mostrar contenido basado en rol
    showRoleBasedContent: (rol) => {
        // Mostrar/ocultar elementos según el rol del usuario
        const adminElements = document.querySelectorAll('[data-role="admin"]');
        const providerElements = document.querySelectorAll('[data-role="provider"]');
        
        adminElements.forEach(el => {
            el.style.display = rol === authConfig.roles.ADMIN ? 'block' : 'none';
        });
        
        providerElements.forEach(el => {
            el.style.display = rol === authConfig.roles.PROVIDER ? 'block' : 'none';
        });
    },

    // Mostrar botones de autenticación
    showAuthButtons: () => {
        // Restaurar botones originales si no existe menú de usuario
        const nav = document.querySelector('nav .hidden.md\\:flex.items-center.space-x-4');
        if (nav && !nav.querySelector('[onclick="mostrarLogin()"]')) {
            nav.innerHTML = `
                <button onclick="mostrarLogin()" class="px-4 py-2 text-verde-medicina border border-verde-medicina rounded-lg hover:bg-verde-medicina hover:text-white transition-all duration-200 font-medium">
                    <i class="fas fa-sign-in-alt mr-2"></i>Iniciar Sesión
                </button>
                <button onclick="mostrarRegistro()" class="px-4 py-2 bg-verde-medicina text-white rounded-lg hover:bg-green-700 transition-all duration-200 font-medium">
                    <i class="fas fa-user-plus mr-2"></i>Registrarse
                </button>
            `;
        }
    }
};

// Logout
const logout = () => {
    authUtils.clearSession();
    uiManager.updateAuthState();
    utils.showNotification('Sesión cerrada correctamente', 'info');
    
    // Redirigir a inicio
    window.location.hash = '#inicio';
    utils.scrollToSection('inicio');
};

// Funciones globales para la interfaz
window.mostrarLogin = () => loginSystem.show();
window.cerrarLogin = () => loginSystem.hide();
window.mostrarRegistro = () => registerSystem.show();
window.cerrarRegistro = () => registerSystem.hide();
window.cerrarSesion = () => logout();

// Inicialización del sistema de autenticación
document.addEventListener('DOMContentLoaded', () => {
    // Restaurar sesión si existe
    authUtils.restoreSession();
    
    // Configurar formularios
    loginSystem.setupForm();
    registerSystem.setupForm();
    
    // Actualizar UI inicial
    uiManager.updateAuthState();
    
    // Configurar cierre de modales al hacer clic fuera
    document.addEventListener('click', (e) => {
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');
        
        if (e.target === loginModal) {
            loginSystem.hide();
        }
        
        if (e.target === registerModal) {
            registerSystem.hide();
        }
    });
    
    // Verificar expiración de sesión periódicamente
    setInterval(() => {
        if (authState.isAuthenticated && !authUtils.isSessionValid()) {
            logout();
            utils.showNotification('Tu sesión ha expirado', 'warning');
        }
    }, 60000); // Verificar cada minuto
});