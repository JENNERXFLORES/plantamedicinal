<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejo de preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../utils/functions.php';

/**
 * API para panel administrativo y reportes
 * Archivo: php/api/admin.php
 */
class AdminAPI {
    private $db;
    private $user;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function handleRequest() {
        try {
            $method = $_SERVER['REQUEST_METHOD'];
            $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            $pathParts = explode('/', trim($path, '/'));
            
            // Obtener token de autorización
            $token = $this->getAuthToken();
            if ($token) {
                $this->user = validateSessionToken($token);
            }

            // Verificar permisos de administrador
            $this->requireAdmin();

            // Ruteo de endpoints
            switch ($method) {
                case 'GET':
                    $this->handleGetRequest($pathParts);
                    break;
                case 'POST':
                    $this->handlePostRequest($pathParts);
                    break;
                case 'PUT':
                    $this->handlePutRequest($pathParts);
                    break;
                case 'DELETE':
                    $this->handleDeleteRequest($pathParts);
                    break;
                default:
                    handleError('Método no permitido', 405);
            }

        } catch (Exception $e) {
            handleError('Error interno del servidor: ' . $e->getMessage(), 500);
        }
    }

    private function getAuthToken() {
        $headers = getallheaders();
        if (isset($headers['Authorization'])) {
            return str_replace('Bearer ', '', $headers['Authorization']);
        }
        return null;
    }

    private function requireAdmin() {
        if (!$this->user) {
            handleError('Token de autenticación requerido', 401);
        }
        if ($this->user['rol'] !== 'administrador') {
            handleError('Acceso denegado. Solo administradores', 403);
        }
    }

    private function handleGetRequest($pathParts) {
        $endpoint = end($pathParts);
        
        switch ($endpoint) {
            case 'dashboard':
                $this->getDashboardStats();
                break;
            case 'usuarios':
                $this->getUsuarios();
                break;
            case 'plantas':
                $this->getPlantasAdmin();
                break;
            case 'recetas':
                $this->getRecetasAdmin();
                break;
            case 'comunidades':
                $this->getComunidadesAdmin();
                break;
            case 'reportes':
                $this->getReportes();
                break;
            case 'logs':
                $this->getLogs();
                break;
            case 'estadisticas':
                $this->getEstadisticas();
                break;
            case 'configuracion':
                $this->getConfiguracion();
                break;
            case 'moderacion':
                $this->getModerationQueue();
                break;
            default:
                handleError('Endpoint no encontrado', 404);
        }
    }

    private function handlePostRequest($pathParts) {
        $endpoint = end($pathParts);
        
        switch ($endpoint) {
            case 'moderar':
                $this->moderarContenido();
                break;
            case 'suspender-usuario':
                $this->suspenderUsuario();
                break;
            case 'enviar-notificacion':
                $this->enviarNotificacionMasiva();
                break;
            case 'respaldar-datos':
                $this->respaldarDatos();
                break;
            default:
                handleError('Endpoint no encontrado', 404);
        }
    }

    private function handlePutRequest($pathParts) {
        $endpoint = end($pathParts);
        
        switch ($endpoint) {
            case 'configuracion':
                $this->updateConfiguracion();
                break;
            case 'usuario':
                $this->updateUsuarioAdmin();
                break;
            default:
                if (is_numeric($endpoint)) {
                    $this->updateEstadoContenido($endpoint, $pathParts);
                } else {
                    handleError('Endpoint no encontrado', 404);
                }
        }
    }

    private function handleDeleteRequest($pathParts) {
        $endpoint = end($pathParts);
        
        if (is_numeric($endpoint)) {
            $this->deleteContenidoAdmin($endpoint, $pathParts);
        } else {
            handleError('ID requerido', 400);
        }
    }

    // Dashboard y Estadísticas Generales
    private function getDashboardStats() {
        $stats = [];

        // Estadísticas de usuarios
        $stmt = $this->db->prepare("
            SELECT 
                COUNT(*) as total_usuarios,
                COUNT(CASE WHEN DATE(fecha_registro) = CURDATE() THEN 1 END) as nuevos_hoy,
                COUNT(CASE WHEN fecha_ultimo_acceso >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as activos_semana
            FROM usuarios WHERE activo = TRUE
        ");
        $stmt->execute();
        $stats['usuarios'] = $stmt->fetch(PDO::FETCH_ASSOC);

        // Estadísticas de plantas
        $stmt = $this->db->prepare("
            SELECT 
                COUNT(*) as total_plantas,
                COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
                COUNT(CASE WHEN DATE(fecha_creacion) = CURDATE() THEN 1 END) as nuevas_hoy
            FROM plantas_medicinales WHERE activa = TRUE
        ");
        $stmt->execute();
        $stats['plantas'] = $stmt->fetch(PDO::FETCH_ASSOC);

        // Estadísticas de recetas
        $stmt = $this->db->prepare("
            SELECT 
                COUNT(*) as total_recetas,
                COUNT(CASE WHEN estado_moderacion = 'pendiente' THEN 1 END) as pendientes_moderacion,
                COUNT(CASE WHEN DATE(fecha_creacion) = CURDATE() THEN 1 END) as nuevas_hoy
            FROM recetas WHERE activa = TRUE
        ");
        $stmt->execute();
        $stats['recetas'] = $stmt->fetch(PDO::FETCH_ASSOC);

        // Estadísticas de comunidad
        $stmt = $this->db->prepare("
            SELECT 
                COUNT(DISTINCT p.id) as total_posts,
                COUNT(DISTINCT c.id) as total_comentarios,
                COUNT(CASE WHEN DATE(p.fecha_creacion) = CURDATE() THEN 1 END) as posts_hoy
            FROM posts_foro p
            LEFT JOIN comentarios_post c ON p.id = c.post_id
            WHERE p.activo = TRUE
        ");
        $stmt->execute();
        $stats['comunidad'] = $stmt->fetch(PDO::FETCH_ASSOC);

        // Reportes pendientes
        $stmt = $this->db->prepare("
            SELECT COUNT(*) as reportes_pendientes 
            FROM reportes WHERE estado = 'pendiente'
        ");
        $stmt->execute();
        $stats['reportes'] = $stmt->fetch(PDO::FETCH_ASSOC);

        // Actividad reciente (últimos 30 días)
        $stmt = $this->db->prepare("
            SELECT 
                DATE(fecha_creacion) as fecha,
                COUNT(*) as actividad
            FROM logs_actividad 
            WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(fecha_creacion)
            ORDER BY fecha DESC
            LIMIT 30
        ");
        $stmt->execute();
        $stats['actividad_reciente'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse(true, $stats);
    }

    private function getEstadisticas() {
        $periodo = $_GET['periodo'] ?? '30'; // días
        $tipo = $_GET['tipo'] ?? 'general';

        $stats = [];

        switch ($tipo) {
            case 'usuarios':
                $stats = $this->getEstadisticasUsuarios($periodo);
                break;
            case 'contenido':
                $stats = $this->getEstadisticasContenido($periodo);
                break;
            case 'engagement':
                $stats = $this->getEstadisticasEngagement($periodo);
                break;
            default:
                $stats = $this->getEstadisticasGenerales($periodo);
        }

        jsonResponse(true, $stats);
    }

    private function getEstadisticasUsuarios($periodo) {
        $stats = [];

        // Registros por día
        $stmt = $this->db->prepare("
            SELECT 
                DATE(fecha_registro) as fecha,
                COUNT(*) as registros
            FROM usuarios 
            WHERE fecha_registro >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(fecha_registro)
            ORDER BY fecha
        ");
        $stmt->execute([$periodo]);
        $stats['registros_diarios'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Distribución por rol
        $stmt = $this->db->prepare("
            SELECT 
                rol,
                COUNT(*) as cantidad
            FROM usuarios 
            WHERE activo = TRUE
            GROUP BY rol
        ");
        $stmt->execute();
        $stats['distribucion_roles'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Usuarios más activos
        $stmt = $this->db->prepare("
            SELECT 
                u.id, u.nombre, u.apellido, u.rol,
                COUNT(l.id) as actividades
            FROM usuarios u
            LEFT JOIN logs_actividad l ON u.id = l.usuario_id
            WHERE l.fecha_creacion >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY u.id
            ORDER BY actividades DESC
            LIMIT 10
        ");
        $stmt->execute([$periodo]);
        $stats['usuarios_activos'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $stats;
    }

    private function getEstadisticasContenido($periodo) {
        $stats = [];

        // Plantas por categoría
        $stmt = $this->db->prepare("
            SELECT 
                categoria,
                COUNT(*) as cantidad
            FROM plantas_medicinales 
            WHERE activa = TRUE
            GROUP BY categoria
            ORDER BY cantidad DESC
        ");
        $stmt->execute();
        $stats['plantas_por_categoria'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Recetas más populares
        $stmt = $this->db->prepare("
            SELECT 
                r.id, r.titulo, r.calificacion_promedio, r.total_favoritos,
                u.nombre as autor_nombre
            FROM recetas r
            LEFT JOIN usuarios u ON r.usuario_id = u.id
            WHERE r.activa = TRUE
            ORDER BY r.calificacion_promedio DESC, r.total_favoritos DESC
            LIMIT 10
        ");
        $stmt->execute();
        $stats['recetas_populares'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Contenido creado por día
        $stmt = $this->db->prepare("
            SELECT 
                DATE(fecha_creacion) as fecha,
                'plantas' as tipo,
                COUNT(*) as cantidad
            FROM plantas_medicinales 
            WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(fecha_creacion)
            
            UNION ALL
            
            SELECT 
                DATE(fecha_creacion) as fecha,
                'recetas' as tipo,
                COUNT(*) as cantidad
            FROM recetas 
            WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(fecha_creacion)
            
            ORDER BY fecha
        ");
        $stmt->execute([$periodo, $periodo]);
        $stats['contenido_diario'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $stats;
    }

    // Gestión de Usuarios
    private function getUsuarios() {
        $params = validatePaginationParams($_GET['page'] ?? 1, $_GET['limit'] ?? 20);
        $search = $_GET['search'] ?? '';
        $rol = $_GET['rol'] ?? '';
        $estado = $_GET['estado'] ?? 'activo';

        $whereClause = "WHERE 1=1";
        $queryParams = [];

        if ($search) {
            $whereClause .= " AND (nombre LIKE ? OR apellido LIKE ? OR email LIKE ?)";
            $searchTerm = "%{$search}%";
            $queryParams[] = $searchTerm;
            $queryParams[] = $searchTerm;
            $queryParams[] = $searchTerm;
        }

        if ($rol) {
            $whereClause .= " AND rol = ?";
            $queryParams[] = $rol;
        }

        if ($estado === 'activo') {
            $whereClause .= " AND activo = TRUE";
        } elseif ($estado === 'inactivo') {
            $whereClause .= " AND activo = FALSE";
        }

        $offset = calculateOffset($params['page'], $params['limit']);

        // Contar total
        $countQuery = "SELECT COUNT(*) as total FROM usuarios $whereClause";
        $stmt = $this->db->prepare($countQuery);
        $stmt->execute($queryParams);
        $totalRecords = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Obtener usuarios
        $query = "
            SELECT 
                id, nombre, apellido, email, rol, activo, verificado,
                fecha_registro, fecha_ultimo_acceso,
                DATE_FORMAT(fecha_registro, '%d/%m/%Y') as fecha_registro_formateada,
                DATE_FORMAT(fecha_ultimo_acceso, '%d/%m/%Y %H:%i') as ultimo_acceso_formateado
            FROM usuarios 
            $whereClause
            ORDER BY fecha_registro DESC
            LIMIT ? OFFSET ?
        ";

        $queryParams[] = $params['limit'];
        $queryParams[] = $offset;

        $stmt = $this->db->prepare($query);
        $stmt->execute($queryParams);
        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Agregar estadísticas adicionales para cada usuario
        foreach ($usuarios as &$usuario) {
            // Plantas creadas
            $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM plantas_medicinales WHERE usuario_id = ?");
            $stmt->execute([$usuario['id']]);
            $usuario['plantas_creadas'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Recetas creadas
            $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM recetas WHERE usuario_id = ?");
            $stmt->execute([$usuario['id']]);
            $usuario['recetas_creadas'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

            // Posts en foro
            $stmt = $this->db->prepare("SELECT COUNT(*) as total FROM posts_foro WHERE usuario_id = ?");
            $stmt->execute([$usuario['id']]);
            $usuario['posts_foro'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        }

        $meta = generatePaginationMeta($totalRecords, $params['page'], $params['limit']);

        jsonResponse(true, [
            'usuarios' => $usuarios,
            'meta' => $meta
        ]);
    }

    // Gestión de Contenido Pendiente de Moderación
    private function getModerationQueue() {
        $tipo = $_GET['tipo'] ?? 'todos'; // plantas, recetas, posts, comentarios
        $params = validatePaginationParams($_GET['page'] ?? 1, $_GET['limit'] ?? 20);

        $contenidoPendiente = [];

        if ($tipo === 'todos' || $tipo === 'plantas') {
            $plantas = $this->getPlantasPendientes();
            $contenidoPendiente = array_merge($contenidoPendiente, $plantas);
        }

        if ($tipo === 'todos' || $tipo === 'recetas') {
            $recetas = $this->getRecetasPendientes();
            $contenidoPendiente = array_merge($contenidoPendiente, $recetas);
        }

        if ($tipo === 'todos' || $tipo === 'posts') {
            $posts = $this->getPostsPendientes();
            $contenidoPendiente = array_merge($contenidoPendiente, $posts);
        }

        // Ordenar por fecha de creación
        usort($contenidoPendiente, function($a, $b) {
            return strtotime($b['fecha_creacion']) - strtotime($a['fecha_creacion']);
        });

        // Paginar resultados
        $offset = calculateOffset($params['page'], $params['limit']);
        $paginatedContent = array_slice($contenidoPendiente, $offset, $params['limit']);
        $totalRecords = count($contenidoPendiente);

        $meta = generatePaginationMeta($totalRecords, $params['page'], $params['limit']);

        jsonResponse(true, [
            'contenido' => $paginatedContent,
            'meta' => $meta
        ]);
    }

    private function getPlantasPendientes() {
        $stmt = $this->db->prepare("
            SELECT 
                p.id, p.nombre, p.nombre_cientifico, p.descripcion, p.fecha_creacion,
                u.nombre as autor_nombre, u.apellido as autor_apellido,
                'planta' as tipo_contenido
            FROM plantas_medicinales p
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.estado = 'pendiente' AND p.activa = TRUE
            ORDER BY p.fecha_creacion DESC
        ");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function getRecetasPendientes() {
        $stmt = $this->db->prepare("
            SELECT 
                r.id, r.titulo, r.descripcion, r.fecha_creacion,
                u.nombre as autor_nombre, u.apellido as autor_apellido,
                'receta' as tipo_contenido
            FROM recetas r
            LEFT JOIN usuarios u ON r.usuario_id = u.id
            WHERE r.estado_moderacion = 'pendiente' AND r.activa = TRUE
            ORDER BY r.fecha_creacion DESC
        ");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function getPostsPendientes() {
        $stmt = $this->db->prepare("
            SELECT 
                p.id, p.titulo, p.contenido, p.fecha_creacion,
                u.nombre as autor_nombre, u.apellido as autor_apellido,
                'post' as tipo_contenido
            FROM posts_foro p
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            WHERE p.requiere_moderacion = TRUE AND p.activo = TRUE
            ORDER BY p.fecha_creacion DESC
        ");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Moderación de Contenido
    private function moderarContenido() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $tipo = $data['tipo'] ?? ''; // planta, receta, post, comentario
        $id = (int)($data['id'] ?? 0);
        $accion = $data['accion'] ?? ''; // aprobar, rechazar
        $motivo = sanitizeInput($data['motivo'] ?? '');

        if (empty($tipo) || $id <= 0 || empty($accion)) {
            handleError('Tipo, ID y acción son obligatorios');
        }

        if (!in_array($accion, ['aprobar', 'rechazar'])) {
            handleError('Acción no válida');
        }

        try {
            $this->db->beginTransaction();

            switch ($tipo) {
                case 'planta':
                    $this->moderarPlanta($id, $accion, $motivo);
                    break;
                case 'receta':
                    $this->moderarReceta($id, $accion, $motivo);
                    break;
                case 'post':
                    $this->moderarPost($id, $accion, $motivo);
                    break;
                case 'comentario':
                    $this->moderarComentario($id, $accion, $motivo);
                    break;
                default:
                    throw new Exception('Tipo de contenido no válido');
            }

            logActivity($this->user['id'], 'contenido_moderado', [
                'tipo' => $tipo,
                'id' => $id,
                'accion' => $accion,
                'motivo' => $motivo
            ]);

            $this->db->commit();

            jsonResponse(true, null, ucfirst($tipo) . ' ' . ($accion === 'aprobar' ? 'aprobado' : 'rechazado') . ' exitosamente');

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    private function moderarPlanta($id, $accion, $motivo) {
        $nuevoEstado = $accion === 'aprobar' ? 'aprobada' : 'rechazada';
        
        $stmt = $this->db->prepare("UPDATE plantas_medicinales SET estado = ?, motivo_moderacion = ?, fecha_moderacion = NOW() WHERE id = ?");
        $stmt->execute([$nuevoEstado, $motivo, $id]);

        // Notificar al autor
        $stmt = $this->db->prepare("SELECT usuario_id, nombre FROM plantas_medicinales WHERE id = ?");
        $stmt->execute([$id]);
        $planta = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($planta) {
            $mensaje = $accion === 'aprobar' 
                ? "Tu planta '{$planta['nombre']}' ha sido aprobada y ya está visible para todos."
                : "Tu planta '{$planta['nombre']}' ha sido rechazada. Motivo: {$motivo}";

            sendNotification($planta['usuario_id'], 'Moderación de Planta', $mensaje, 
                $accion === 'aprobar' ? 'success' : 'warning');
        }
    }

    private function moderarReceta($id, $accion, $motivo) {
        $nuevoEstado = $accion === 'aprobar' ? 'aprobada' : 'rechazada';
        
        $stmt = $this->db->prepare("UPDATE recetas SET estado_moderacion = ?, motivo_moderacion = ?, fecha_moderacion = NOW() WHERE id = ?");
        $stmt->execute([$nuevoEstado, $motivo, $id]);

        // Notificar al autor
        $stmt = $this->db->prepare("SELECT usuario_id, titulo FROM recetas WHERE id = ?");
        $stmt->execute([$id]);
        $receta = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($receta) {
            $mensaje = $accion === 'aprobar' 
                ? "Tu receta '{$receta['titulo']}' ha sido aprobada y ya está visible para todos."
                : "Tu receta '{$receta['titulo']}' ha sido rechazada. Motivo: {$motivo}";

            sendNotification($receta['usuario_id'], 'Moderación de Receta', $mensaje, 
                $accion === 'aprobar' ? 'success' : 'warning');
        }
    }

    // Gestión de Reportes
    private function getReportes() {
        $params = validatePaginationParams($_GET['page'] ?? 1, $_GET['limit'] ?? 20);
        $estado = $_GET['estado'] ?? 'pendiente';
        $tipo = $_GET['tipo'] ?? '';

        $whereClause = "WHERE r.estado = ?";
        $queryParams = [$estado];

        if ($tipo) {
            $whereClause .= " AND r.tipo_contenido = ?";
            $queryParams[] = $tipo;
        }

        $offset = calculateOffset($params['page'], $params['limit']);

        $query = "
            SELECT 
                r.*,
                u1.nombre as reportante_nombre, u1.apellido as reportante_apellido,
                u2.nombre as reportado_nombre, u2.apellido as reportado_apellido,
                DATE_FORMAT(r.fecha_creacion, '%d/%m/%Y %H:%i') as fecha_formateada
            FROM reportes r
            LEFT JOIN usuarios u1 ON r.usuario_reportante_id = u1.id
            LEFT JOIN usuarios u2 ON r.usuario_reportado_id = u2.id
            $whereClause
            ORDER BY r.fecha_creacion DESC
            LIMIT ? OFFSET ?
        ";

        $queryParams[] = $params['limit'];
        $queryParams[] = $offset;

        $stmt = $this->db->prepare($query);
        $stmt->execute($queryParams);
        $reportes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse(true, $reportes);
    }

    // Logs del Sistema
    private function getLogs() {
        $params = validatePaginationParams($_GET['page'] ?? 1, $_GET['limit'] ?? 50);
        $accion = $_GET['accion'] ?? '';
        $usuarioId = $_GET['usuario_id'] ?? '';
        
        $whereClause = "WHERE 1=1";
        $queryParams = [];

        if ($accion) {
            $whereClause .= " AND l.accion = ?";
            $queryParams[] = $accion;
        }

        if ($usuarioId) {
            $whereClause .= " AND l.usuario_id = ?";
            $queryParams[] = $usuarioId;
        }

        $offset = calculateOffset($params['page'], $params['limit']);

        $query = "
            SELECT 
                l.*,
                u.nombre, u.apellido, u.email,
                DATE_FORMAT(l.fecha_creacion, '%d/%m/%Y %H:%i:%s') as fecha_formateada
            FROM logs_actividad l
            LEFT JOIN usuarios u ON l.usuario_id = u.id
            $whereClause
            ORDER BY l.fecha_creacion DESC
            LIMIT ? OFFSET ?
        ";

        $queryParams[] = $params['limit'];
        $queryParams[] = $offset;

        $stmt = $this->db->prepare($query);
        $stmt->execute($queryParams);
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($logs as &$log) {
            if ($log['detalles']) {
                $log['detalles'] = json_decode($log['detalles'], true);
            }
        }

        jsonResponse(true, $logs);
    }

    // Suspender Usuario
    private function suspenderUsuario() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $usuarioId = (int)($data['usuario_id'] ?? 0);
        $motivo = sanitizeInput($data['motivo'] ?? '');
        $duracion = (int)($data['duracion_dias'] ?? 0);

        if ($usuarioId <= 0 || empty($motivo)) {
            handleError('Usuario ID y motivo son obligatorios');
        }

        $fechaVencimiento = null;
        if ($duracion > 0) {
            $fechaVencimiento = date('Y-m-d H:i:s', strtotime("+{$duracion} days"));
        }

        try {
            $this->db->beginTransaction();

            // Registrar suspensión
            $stmt = $this->db->prepare("
                INSERT INTO suspensiones 
                (usuario_id, administrador_id, motivo, fecha_inicio, fecha_vencimiento) 
                VALUES (?, ?, ?, NOW(), ?)
            ");
            $stmt->execute([$usuarioId, $this->user['id'], $motivo, $fechaVencimiento]);

            // Actualizar estado del usuario si es suspensión indefinida
            if ($duracion === 0) {
                $stmt = $this->db->prepare("UPDATE usuarios SET activo = FALSE WHERE id = ?");
                $stmt->execute([$usuarioId]);
            }

            // Enviar notificación al usuario
            $mensaje = $duracion > 0 
                ? "Tu cuenta ha sido suspendida por {$duracion} días. Motivo: {$motivo}"
                : "Tu cuenta ha sido suspendida indefinidamente. Motivo: {$motivo}";

            sendNotification($usuarioId, 'Suspensión de Cuenta', $mensaje, 'error');

            logActivity($this->user['id'], 'usuario_suspendido', [
                'usuario_id' => $usuarioId,
                'motivo' => $motivo,
                'duracion_dias' => $duracion
            ]);

            $this->db->commit();

            jsonResponse(true, null, 'Usuario suspendido exitosamente');

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // Configuración del Sistema
    private function getConfiguracion() {
        $stmt = $this->db->prepare("SELECT * FROM configuracion_sistema ORDER BY clave");
        $stmt->execute();
        $configuraciones = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $config = [];
        foreach ($configuraciones as $item) {
            $config[$item['clave']] = [
                'valor' => $item['valor'],
                'descripcion' => $item['descripcion'],
                'tipo' => $item['tipo']
            ];
        }

        jsonResponse(true, $config);
    }

    private function updateConfiguracion() {
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data) || !is_array($data)) {
            handleError('Datos de configuración inválidos');
        }

        try {
            $this->db->beginTransaction();

            foreach ($data as $clave => $valor) {
                $stmt = $this->db->prepare("
                    UPDATE configuracion_sistema 
                    SET valor = ?, fecha_actualizacion = NOW() 
                    WHERE clave = ?
                ");
                $stmt->execute([$valor, $clave]);
            }

            logActivity($this->user['id'], 'configuracion_actualizada', $data);

            $this->db->commit();

            jsonResponse(true, null, 'Configuración actualizada exitosamente');

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // Métodos adicionales para plantas y recetas desde perspectiva admin
    private function getPlantasAdmin() {
        $params = validatePaginationParams($_GET['page'] ?? 1, $_GET['limit'] ?? 20);
        $estado = $_GET['estado'] ?? '';
        $search = $_GET['search'] ?? '';

        $whereClause = "WHERE p.activa = TRUE";
        $queryParams = [];

        if ($estado) {
            $whereClause .= " AND p.estado = ?";
            $queryParams[] = $estado;
        }

        if ($search) {
            $whereClause .= " AND (p.nombre LIKE ? OR p.nombre_cientifico LIKE ?)";
            $searchTerm = "%{$search}%";
            $queryParams[] = $searchTerm;
            $queryParams[] = $searchTerm;
        }

        $offset = calculateOffset($params['page'], $params['limit']);

        $query = "
            SELECT 
                p.id, p.nombre, p.nombre_cientifico, p.estado, p.fecha_creacion,
                p.visualizaciones, p.total_favoritos,
                u.nombre as autor_nombre, u.apellido as autor_apellido, u.rol as autor_rol,
                DATE_FORMAT(p.fecha_creacion, '%d/%m/%Y') as fecha_formateada
            FROM plantas_medicinales p
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            $whereClause
            ORDER BY p.fecha_creacion DESC
            LIMIT ? OFFSET ?
        ";

        $queryParams[] = $params['limit'];
        $queryParams[] = $offset;

        $stmt = $this->db->prepare($query);
        $stmt->execute($queryParams);
        $plantas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse(true, $plantas);
    }

    private function getRecetasAdmin() {
        $params = validatePaginationParams($_GET['page'] ?? 1, $_GET['limit'] ?? 20);
        $estado = $_GET['estado_moderacion'] ?? '';
        $search = $_GET['search'] ?? '';

        $whereClause = "WHERE r.activa = TRUE";
        $queryParams = [];

        if ($estado) {
            $whereClause .= " AND r.estado_moderacion = ?";
            $queryParams[] = $estado;
        }

        if ($search) {
            $whereClause .= " AND r.titulo LIKE ?";
            $searchTerm = "%{$search}%";
            $queryParams[] = $searchTerm;
        }

        $offset = calculateOffset($params['page'], $params['limit']);

        $query = "
            SELECT 
                r.id, r.titulo, r.estado_moderacion, r.fecha_creacion,
                r.calificacion_promedio, r.total_favoritos, r.total_comentarios,
                u.nombre as autor_nombre, u.apellido as autor_apellido, u.rol as autor_rol,
                DATE_FORMAT(r.fecha_creacion, '%d/%m/%Y') as fecha_formateada
            FROM recetas r
            LEFT JOIN usuarios u ON r.usuario_id = u.id
            $whereClause
            ORDER BY r.fecha_creacion DESC
            LIMIT ? OFFSET ?
        ";

        $queryParams[] = $params['limit'];
        $queryParams[] = $offset;

        $stmt = $this->db->prepare($query);
        $stmt->execute($queryParams);
        $recetas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse(true, $recetas);
    }

    private function getComunidadesAdmin() {
        $params = validatePaginationParams($_GET['page'] ?? 1, $_GET['limit'] ?? 20);
        $search = $_GET['search'] ?? '';

        $whereClause = "WHERE c.activa = TRUE";
        $queryParams = [];

        if ($search) {
            $whereClause .= " AND (c.nombre LIKE ? OR c.descripcion LIKE ?)";
            $searchTerm = "%{$search}%";
            $queryParams[] = $searchTerm;
            $queryParams[] = $searchTerm;
        }

        $offset = calculateOffset($params['page'], $params['limit']);

        $query = "
            SELECT 
                c.id, c.nombre, c.descripcion, c.categoria, c.fecha_creacion,
                u.nombre as creador_nombre, u.apellido as creador_apellido,
                COUNT(DISTINCT mc.id) as total_miembros,
                COUNT(DISTINCT pf.id) as total_posts,
                DATE_FORMAT(c.fecha_creacion, '%d/%m/%Y') as fecha_formateada
            FROM comunidades c
            LEFT JOIN usuarios u ON c.creador_id = u.id
            LEFT JOIN miembros_comunidad mc ON c.id = mc.comunidad_id AND mc.estado = 'activo'
            LEFT JOIN posts_foro pf ON c.id = pf.comunidad_id AND pf.activo = TRUE
            $whereClause
            GROUP BY c.id
            ORDER BY c.fecha_creacion DESC
            LIMIT ? OFFSET ?
        ";

        $queryParams[] = $params['limit'];
        $queryParams[] = $offset;

        $stmt = $this->db->prepare($query);
        $stmt->execute($queryParams);
        $comunidades = $stmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse(true, $comunidades);
    }
}

// Instanciar y ejecutar API
$api = new AdminAPI();
$api->handleRequest();
?>