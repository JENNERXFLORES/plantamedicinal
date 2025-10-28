<?php
/**
 * API de autenticación para PlantaMedicinal
 * Maneja login, registro, logout y verificación de sesiones
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../utils/functions.php';

class AuthAPI {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
        
        // Iniciar sesión si no está iniciada
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }
    
    /**
     * Manejar las peticiones de la API
     */
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';
        
        try {
            switch ($method) {
                case 'POST':
                    switch ($action) {
                        case 'login':
                            return $this->login();
                        case 'register':
                            return $this->register();
                        case 'logout':
                            return $this->logout();
                        case 'refresh':
                            return $this->refreshToken();
                        default:
                            return $this->sendError('Acción no válida', 400);
                    }
                case 'GET':
                    switch ($action) {
                        case 'verify':
                            return $this->verifySession();
                        case 'user':
                            return $this->getCurrentUser();
                        case 'profile':
                            return $this->getProfile();
                        case 'test':
                            return $this->testConnection();
                        default:
                            return $this->sendError('Acción no válida', 400);
                    }
                case 'PUT':
                    switch ($action) {
                        case 'profile':
                            return $this->updateProfile();
                        default:
                            return $this->sendError('Acción no válida', 400);
                    }
                default:
                    return $this->sendError('Método no permitido', 405);
            }
        } catch (Exception $e) {
            error_log("Error en AuthAPI: " . $e->getMessage());
            return $this->sendError('Error interno del servidor', 500);
        }
    }
    
    /**
     * Procesar login de usuario
     */
    private function login() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validar datos de entrada
        if (!isset($input['email']) || !isset($input['password'])) {
            return $this->sendError('Email y contraseña son requeridos', 400);
        }
        
        $email = trim($input['email']);
        $password = $input['password'];
        
        // Validar formato de email
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->sendError('Formato de email inválido', 400);
        }
        
        // Buscar usuario en la base de datos
        $user = $this->db->fetch(
            "SELECT * FROM usuarios WHERE email = ? AND activo = TRUE",
            [$email]
        );
        
        if (!$user) {
            return $this->sendError('Credenciales inválidas', 401);
        }
        
        // Verificar contraseña
        if (!password_verify($password, $user['password'])) {
            return $this->sendError('Credenciales inválidas', 401);
        }
        
        // Actualizar último acceso
        $this->db->update(
            'usuarios',
            ['ultimo_acceso' => date('Y-m-d H:i:s')],
            'id = ?',
            [$user['id']]
        );
        
        // Crear sesión
        $sessionData = $this->createSession($user);
        
        // Preparar datos del usuario (sin password)
        $userData = [
            'id' => $user['id'],
            'nombre' => $user['nombre'],
            'apellido' => $user['apellido'],
            'email' => $user['email'],
            'rol' => $user['rol'],
            'avatar' => $user['avatar'],
            'comunidad' => $user['comunidad'],
            'region' => $user['region'],
            'fecha_registro' => $user['fecha_registro']
        ];
        
        return $this->sendSuccess([
            'user' => $userData,
            'token' => $sessionData['token'],
            'expires_at' => $sessionData['expires_at']
        ], 'Login exitoso');
    }
    
    /**
     * Procesar registro de usuario
     */
    private function register() {
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validar datos requeridos
        $required = ['nombre', 'apellido', 'email', 'password', 'confirmPassword'];
        foreach ($required as $field) {
            if (!isset($input[$field]) || empty(trim($input[$field]))) {
                return $this->sendError("El campo {$field} es requerido", 400);
            }
        }
        
        // Validar que las contraseñas coincidan
        if ($input['password'] !== $input['confirmPassword']) {
            return $this->sendError('Las contraseñas no coinciden', 400);
        }
        
        // Validar longitud de contraseña
        if (strlen($input['password']) < 6) {
            return $this->sendError('La contraseña debe tener al menos 6 caracteres', 400);
        }
        
        $email = trim($input['email']);
        
        // Validar formato de email
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $this->sendError('Formato de email inválido', 400);
        }
        
        // Verificar si el email ya existe
        if ($this->db->exists('usuarios', 'email = ?', [$email])) {
            return $this->sendError('Este email ya está registrado', 409);
        }
        
        // Preparar datos del usuario
        $userData = [
            'nombre' => trim($input['nombre']),
            'apellido' => trim($input['apellido']),
            'email' => $email,
            'password' => password_hash($input['password'], PASSWORD_DEFAULT),
            'rol' => isset($input['rol']) ? $input['rol'] : 'usuario',
            'comunidad' => isset($input['comunidad']) ? trim($input['comunidad']) : null,
            'region' => isset($input['region']) ? trim($input['region']) : null,
            'avatar' => $this->generateAvatar($input['nombre'], $input['apellido'])
        ];
        
        // Validar rol
        $validRoles = ['usuario', 'proveedor'];
        if (!in_array($userData['rol'], $validRoles)) {
            $userData['rol'] = 'usuario';
        }
        
        try {
            // Insertar usuario
            $userId = $this->db->insert('usuarios', $userData);
            
            // Obtener datos del usuario creado
            $newUser = $this->db->fetch(
                "SELECT * FROM usuarios WHERE id = ?",
                [$userId]
            );
            
            // Crear sesión automática
            $sessionData = $this->createSession($newUser);
            
            // Preparar respuesta (sin password)
            $responseUser = [
                'id' => $newUser['id'],
                'nombre' => $newUser['nombre'],
                'apellido' => $newUser['apellido'],
                'email' => $newUser['email'],
                'rol' => $newUser['rol'],
                'avatar' => $newUser['avatar'],
                'comunidad' => $newUser['comunidad'],
                'region' => $newUser['region'],
                'fecha_registro' => $newUser['fecha_registro']
            ];
            
            return $this->sendSuccess([
                'user' => $responseUser,
                'token' => $sessionData['token'],
                'expires_at' => $sessionData['expires_at']
            ], 'Registro exitoso');
            
        } catch (Exception $e) {
            error_log("Error en registro: " . $e->getMessage());
            return $this->sendError('Error al crear la cuenta', 500);
        }
    }
    
    /**
     * Procesar logout
     */
    private function logout() {
        $token = $this->getBearerToken();
        
        if ($token) {
            // Desactivar token en la base de datos
            $this->db->update(
                'sesiones',
                ['activa' => false],
                'token = ?',
                [$token]
            );
        }
        
        // Destruir sesión PHP
        session_destroy();
        
        return $this->sendSuccess([], 'Logout exitoso');
    }
    
    /**
     * Verificar sesión actual
     */
    private function verifySession() {
        $token = $this->getBearerToken();
        
        if (!$token) {
            return $this->sendError('Token no proporcionado', 401);
        }
        
        $session = $this->db->fetch(
            "SELECT s.*, u.* FROM sesiones s 
             JOIN usuarios u ON s.usuario_id = u.id 
             WHERE s.token = ? AND s.activa = TRUE AND s.expira_en > NOW()",
            [$token]
        );
        
        if (!$session) {
            return $this->sendError('Sesión inválida o expirada', 401);
        }
        
        // Preparar datos del usuario
        $userData = [
            'id' => $session['id'],
            'nombre' => $session['nombre'],
            'apellido' => $session['apellido'],
            'email' => $session['email'],
            'rol' => $session['rol'],
            'avatar' => $session['avatar'],
            'comunidad' => $session['comunidad'],
            'region' => $session['region']
        ];
        
        return $this->sendSuccess(['user' => $userData], 'Sesión válida');
    }
    
    /**
     * Obtener usuario actual
     */
    private function getCurrentUser() {
        return $this->verifySession();
    }

    /**
     * Renovar token de sesión
     */
    private function refreshToken() {
        $token = $this->getBearerToken();
        
        if (!$token) {
            return $this->sendError('Token no proporcionado', 401);
        }

        // Verificar sesión actual
        $session = $this->db->fetch(
            "SELECT s.*, u.* FROM sesiones s 
             JOIN usuarios u ON s.usuario_id = u.id 
             WHERE s.token = ? AND s.activa = TRUE",
            [$token]
        );

        if (!$session) {
            return $this->sendError('Token inválido', 401);
        }

        // Verificar si el token está cerca de expirar (menos de 2 horas)
        $expirationTime = strtotime($session['expira_en']);
        $currentTime = time();
        $timeUntilExpiry = $expirationTime - $currentTime;

        if ($timeUntilExpiry > 7200) { // 2 horas
            // Token aún válido por más tiempo, no necesita renovación
            return $this->sendSuccess([
                'token' => $token,
                'expires_at' => $session['expira_en'],
                'renewed' => false
            ], 'Token aún válido');
        }

        // Desactivar token actual
        $this->db->update(
            'sesiones',
            ['activa' => false],
            'token = ?',
            [$token]
        );

        // Crear nueva sesión
        $userData = [
            'id' => $session['usuario_id'],
            'nombre' => $session['nombre'],
            'apellido' => $session['apellido'],
            'email' => $session['email'],
            'rol' => $session['rol']
        ];

        $newSession = $this->createSession($userData);

        return $this->sendSuccess([
            'token' => $newSession['token'],
            'expires_at' => $newSession['expires_at'],
            'renewed' => true
        ], 'Token renovado exitosamente');
    }

    /**
     * Obtener perfil del usuario
     */
    private function getProfile() {
        $token = $this->getBearerToken();
        
        if (!$token) {
            return $this->sendError('Token no proporcionado', 401);
        }

        $user = $this->validateToken($token);
        
        if (!$user) {
            return $this->sendError('Token inválido', 401);
        }

        // Obtener estadísticas del usuario
        $stats = [
            'plantas_creadas' => $this->db->count('plantas_medicinales', 'usuario_id = ? AND activa = TRUE', [$user['id']]),
            'recetas_creadas' => $this->db->count('recetas', 'usuario_id = ? AND activa = TRUE', [$user['id']]),
            'posts_foro' => $this->db->count('posts_foro', 'usuario_id = ? AND activo = TRUE', [$user['id']]),
            'favoritos_plantas' => $this->db->count('favoritos_plantas', 'usuario_id = ?', [$user['id']]),
            'favoritos_recetas' => $this->db->count('favoritos_recetas', 'usuario_id = ?', [$user['id']])
        ];

        $profileData = [
            'id' => $user['id'],
            'nombre' => $user['nombre'],
            'apellido' => $user['apellido'],
            'email' => $user['email'],
            'rol' => $user['rol'],
            'avatar' => $user['avatar'],
            'biografia' => $user['biografia'],
            'comunidad' => $user['comunidad'],
            'region' => $user['region'],
            'telefono' => $user['telefono'],
            'fecha_registro' => $user['fecha_registro'],
            'ultimo_acceso' => $user['ultimo_acceso'],
            'verificado' => $user['verificado'],
            'estadisticas' => $stats
        ];

        return $this->sendSuccess(['user' => $profileData], 'Perfil obtenido exitosamente');
    }

    /**
     * Actualizar perfil del usuario
     */
    private function updateProfile() {
        $token = $this->getBearerToken();
        
        if (!$token) {
            return $this->sendError('Token no proporcionado', 401);
        }

        $user = $this->validateToken($token);
        
        if (!$user) {
            return $this->sendError('Token inválido', 401);
        }

        $input = json_decode(file_get_contents('php://input'), true);

        // Campos actualizables
        $allowedFields = ['nombre', 'apellido', 'biografia', 'comunidad', 'region', 'telefono'];
        $updateData = [];

        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $updateData[$field] = trim($input[$field]);
            }
        }

        // Validar que hay datos para actualizar
        if (empty($updateData)) {
            return $this->sendError('No hay datos para actualizar', 400);
        }

        // Validar nombre y apellido si se proporcionan
        if (isset($updateData['nombre']) && strlen($updateData['nombre']) < 2) {
            return $this->sendError('El nombre debe tener al menos 2 caracteres', 400);
        }

        if (isset($updateData['apellido']) && strlen($updateData['apellido']) < 2) {
            return $this->sendError('El apellido debe tener al menos 2 caracteres', 400);
        }

        try {
            // Actualizar datos
            $this->db->update('usuarios', $updateData, 'id = ?', [$user['id']]);

            // Obtener datos actualizados
            $updatedUser = $this->db->fetch(
                "SELECT id, nombre, apellido, email, rol, avatar, biografia, comunidad, region, telefono, verificado FROM usuarios WHERE id = ?",
                [$user['id']]
            );

            return $this->sendSuccess(['user' => $updatedUser], 'Perfil actualizado exitosamente');

        } catch (Exception $e) {
            error_log("Error actualizando perfil: " . $e->getMessage());
            return $this->sendError('Error al actualizar el perfil', 500);
        }
    }

    /**
     * Test de conexión a la base de datos
     */
    private function testConnection() {
        try {
            $result = $this->db->fetch("SELECT 1 as test, NOW() as timestamp");
            
            return $this->sendSuccess([
                'database' => 'connected',
                'timestamp' => $result['timestamp'],
                'test_result' => $result['test']
            ], 'Conexión a base de datos exitosa');
            
        } catch (Exception $e) {
            return $this->sendError('Error de conexión a base de datos: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Validar token y obtener usuario
     */
    private function validateToken($token) {
        $session = $this->db->fetch(
            "SELECT u.* FROM sesiones s 
             JOIN usuarios u ON s.usuario_id = u.id 
             WHERE s.token = ? AND s.activa = TRUE AND s.expira_en > NOW()",
            [$token]
        );

        return $session ?: null;
    }
    
    /**
     * Crear sesión de usuario
     */
    private function createSession($user) {
        // Generar token único
        $token = bin2hex(random_bytes(32));
        
        // Calcular fecha de expiración (24 horas)
        $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));
        
        // Obtener información del cliente
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        
        // Insertar sesión en la base de datos
        $this->db->insert('sesiones', [
            'usuario_id' => $user['id'],
            'token' => $token,
            'expira_en' => $expiresAt,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent
        ]);
        
        // Configurar sesión PHP
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['token'] = $token;
        
        return [
            'token' => $token,
            'expires_at' => $expiresAt
        ];
    }
    
    /**
     * Obtener token Bearer del header
     */
    private function getBearerToken() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $matches[1];
        }
        
        return null;
    }
    
    /**
     * Generar avatar por defecto
     */
    private function generateAvatar($nombre, $apellido) {
        $initials = strtoupper(substr($nombre, 0, 1) . substr($apellido, 0, 1));
        return "https://ui-avatars.com/api/?name={$initials}&background=2d5a3d&color=fff&size=150";
    }
    
    /**
     * Enviar respuesta de éxito
     */
    private function sendSuccess($data = [], $message = 'Operación exitosa', $code = 200) {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('c')
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    /**
     * Enviar respuesta de error
     */
    private function sendError($message = 'Error', $code = 400) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'timestamp' => date('c')
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Instanciar y ejecutar la API
$api = new AuthAPI();
$api->handleRequest();
?>