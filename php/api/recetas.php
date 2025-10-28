<?php
/**
 * API de recetas tradicionales para PlantaMedicinal
 * Maneja CRUD de recetas, valoraciones y moderación
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../utils/functions.php';

class RecetasAPI {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Manejar las peticiones de la API
     */
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';
        $id = $_GET['id'] ?? null;
        
        try {
            switch ($method) {
                case 'GET':
                    if ($id) {
                        return $this->getReceta($id);
                    } else {
                        switch ($action) {
                            case 'pending':
                                return $this->getPendingRecetas();
                            case 'by-planta':
                                return $this->getRecetasByPlanta();
                            case 'user-recetas':
                                return $this->getUserRecetas();
                            default:
                                return $this->getRecetas();
                        }
                    }
                case 'POST':
                    switch ($action) {
                        case 'create':
                            return $this->createReceta();
                        case 'valorar':
                        case 'rate':
                            return $this->valorarReceta();
                        case 'moderate':
                            return $this->moderateReceta();
                        default:
                            return $this->sendError('Acción no válida', 400);
                    }
                case 'PUT':
                    if ($id) {
                        return $this->updateReceta($id);
                    }
                    return $this->sendError('ID de receta requerido', 400);
                case 'DELETE':
                    if ($id) {
                        return $this->deleteReceta($id);
                    }
                    return $this->sendError('ID de receta requerido', 400);
                default:
                    return $this->sendError('Método no permitido', 405);
            }
        } catch (Exception $e) {
            error_log("Error en RecetasAPI: " . $e->getMessage());
            return $this->sendError('Error interno del servidor', 500);
        }
    }
    
    /**
     * Obtener lista de recetas con paginación y filtros
     */
    private function getRecetas() {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(1, min(50, (int)($_GET['limit'] ?? 12)));
        $offset = ($page - 1) * $limit;
        
        $where = ["r.activa = TRUE", "r.estado_moderacion = 'aprobada'"];
        $params = [];
        
        // Filtros
        if (!empty($_GET['planta_id'])) {
            $where[] = "r.planta_id = ?";
            $params[] = $_GET['planta_id'];
        }
        
        if (!empty($_GET['categoria'])) {
            $where[] = "pm.categoria = ?";
            $params[] = $_GET['categoria'];
        }
        
        if (!empty($_GET['dificultad'])) {
            $where[] = "r.dificultad = ?";
            $params[] = $_GET['dificultad'];
        }
        
        if (!empty($_GET['rating'])) {
            $where[] = "r.calificacion_promedio >= ?";
            $params[] = (float)$_GET['rating'];
        }
        
        if (!empty($_GET['search'])) {
            $searchTerm = '%' . $_GET['search'] . '%';
            $where[] = "(r.titulo LIKE ? OR pm.nombre LIKE ? OR JSON_SEARCH(r.ingredientes, 'one', ?) IS NOT NULL OR JSON_SEARCH(r.preparacion, 'one', ?) IS NOT NULL)";
            $params = array_merge($params, [$searchTerm, $searchTerm, str_replace('%', '', $searchTerm), str_replace('%', '', $searchTerm)]);
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Ordenamiento
        $orderBy = $this->getOrderBy($_GET['sort'] ?? 'fecha');
        
        // Consulta principal con información completa
        $sql = "SELECT r.*, 
                       pm.nombre as planta_nombre_comun,
                       pm.nombre_cientifico as planta_nombre_cientifico,
                       pm.categoria as planta_categoria,
                       pm.imagen_url as planta_imagen,
                       u.nombre as autor_nombre,
                       u.apellido as autor_apellido,
                       u.rol as autor_rol,
                       u.avatar as autor_avatar
                FROM recetas r
                JOIN plantas_medicinales pm ON r.planta_id = pm.id
                JOIN usuarios u ON r.usuario_id = u.id
                WHERE {$whereClause}
                ORDER BY {$orderBy}
                LIMIT {$limit} OFFSET {$offset}";
        
        $recetas = $this->db->fetchAll($sql, $params);
        
        // Contar total para paginación
        $totalSql = "SELECT COUNT(*) as total 
                     FROM recetas r
                     JOIN plantas_medicinales pm ON r.planta_id = pm.id
                     JOIN usuarios u ON r.usuario_id = u.id
                     WHERE {$whereClause}";
        $totalResult = $this->db->fetch($totalSql, $params);
        $total = $totalResult['total'];
        
        // Procesar datos JSON
        foreach ($recetas as &$receta) {
            $receta['ingredientes'] = json_decode($receta['ingredientes'], true) ?: [];
            $receta['preparacion'] = json_decode($receta['preparacion'], true) ?: [];
        }
        
        return $this->sendSuccess([
            'recetas' => $recetas,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }
    
    /**
     * Obtener una receta específica con valoraciones
     */
    private function getReceta($id) {
        // Consulta principal
        $sql = "SELECT r.*, 
                       pm.nombre as planta_nombre_comun,
                       pm.nombre_cientifico as planta_nombre_cientifico,
                       pm.categoria as planta_categoria,
                       pm.imagen_url as planta_imagen,
                       u.nombre as autor_nombre,
                       u.apellido as autor_apellido,
                       u.rol as autor_rol,
                       u.avatar as autor_avatar,
                       u.comunidad as autor_comunidad
                FROM recetas r
                JOIN plantas_medicinales pm ON r.planta_id = pm.id
                JOIN usuarios u ON r.usuario_id = u.id
                WHERE r.id = ?";
        
        $receta = $this->db->fetch($sql, [$id]);
        
        if (!$receta) {
            return $this->sendError('Receta no encontrada', 404);
        }
        
        // Solo mostrar recetas aprobadas o del autor/admin
        $userId = $this->getCurrentUserId();
        $userRole = $this->getCurrentUserRole();
        
        if ($receta['estado_moderacion'] !== 'aprobada' && 
            $receta['usuario_id'] != $userId && 
            $userRole !== 'administrador') {
            return $this->sendError('Acceso denegado', 403);
        }
        
        // Procesar datos JSON
        $receta['ingredientes'] = json_decode($receta['ingredientes'], true) ?: [];
        $receta['preparacion'] = json_decode($receta['preparacion'], true) ?: [];
        
        // Obtener valoraciones
        $valoracionesSql = "SELECT v.*, u.nombre, u.apellido, u.avatar
                           FROM valoraciones_recetas v
                           JOIN usuarios u ON v.usuario_id = u.id
                           WHERE v.receta_id = ?
                           ORDER BY v.fecha_creacion DESC
                           LIMIT 10";
        
        $valoraciones = $this->db->fetchAll($valoracionesSql, [$id]);
        
        // Estadísticas de valoraciones
        $estadisticasSql = "SELECT 
                              AVG(calificacion) as rating_promedio,
                              COUNT(*) as total_valoraciones,
                              SUM(CASE WHEN calificacion = 5 THEN 1 ELSE 0 END) as cinco_estrellas,
                              SUM(CASE WHEN calificacion = 4 THEN 1 ELSE 0 END) as cuatro_estrellas,
                              SUM(CASE WHEN calificacion = 3 THEN 1 ELSE 0 END) as tres_estrellas,
                              SUM(CASE WHEN calificacion = 2 THEN 1 ELSE 0 END) as dos_estrellas,
                              SUM(CASE WHEN calificacion = 1 THEN 1 ELSE 0 END) as una_estrella
                           FROM valoraciones_recetas 
                           WHERE receta_id = ?";
        
        $estadisticas = $this->db->fetch($estadisticasSql, [$id]);
        
        // Incrementar popularidad
        // Omitido: actualización de popularidad
        
        $receta['valoraciones'] = $valoraciones;
        $receta['estadisticas_valoraciones'] = $estadisticas;
        
        // Verificar si el usuario actual ya valoró esta receta
        if ($userId) {
            $userValoracion = $this->db->fetch(
                "SELECT calificacion, comentario FROM valoraciones_recetas WHERE receta_id = ? AND usuario_id = ?",
                [$id, $userId]
            );
            $receta['user_valoracion'] = $userValoracion;
        }
        
            return $this->sendSuccess(['receta' => $receta]);
        }
    
    /**
     * Obtener recetas pendientes de moderación
     */
    private function getPendingRecetas() {
        $userRole = $this->getCurrentUserRole();
        
        if ($userRole !== 'administrador') {
            return $this->sendError('Permisos insuficientes', 403);
        }
        
        $sql = "SELECT r.*, 
                       pm.nombre as planta_nombre_comun,
                       u.nombre as autor_nombre,
                       u.apellido as autor_apellido,
                       u.rol as autor_rol
                FROM recetas r
                JOIN plantas_medicinales pm ON r.planta_id = pm.id
                JOIN usuarios u ON r.usuario_id = u.id
                WHERE r.estado_moderacion = 'pendiente'
                ORDER BY r.fecha_creacion ASC";
        
        $recetas = $this->db->fetchAll($sql);
        
        foreach ($recetas as &$receta) {
            $receta['ingredientes'] = json_decode($receta['ingredientes'], true) ?: [];
            $receta['beneficios'] = json_decode($receta['beneficios'], true) ?: [];
        }
        
        return $this->sendSuccess(['recetas_pendientes' => $recetas]);
    }
    
    /**
     * Obtener recetas por planta
     */
    private function getRecetasByPlanta() {
        $plantaId = $_GET['planta_id'] ?? null;
        
        if (!$plantaId) {
            return $this->sendError('ID de planta requerido', 400);
        }
        
        $sql = "SELECT r.*, 
                       u.nombre as autor_nombre,
                       u.apellido as autor_apellido,
                       u.rol as autor_rol
                FROM recetas r
                JOIN usuarios u ON r.usuario_id = u.id
                WHERE r.planta_id = ? AND r.estado_moderacion = 'aprobada'
                ORDER BY r.calificacion_promedio DESC, r.fecha_creacion DESC";
        
        $recetas = $this->db->fetchAll($sql, [$plantaId]);
        
        foreach ($recetas as &$receta) {
            $receta['ingredientes'] = json_decode($receta['ingredientes'], true) ?: [];
            $receta['beneficios'] = json_decode($receta['beneficios'], true) ?: [];
        }
        
        return $this->sendSuccess(['recetas' => $recetas]);
    }
    
    /**
     * Obtener recetas del usuario actual
     */
    private function getUserRecetas() {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->sendError('Usuario no autenticado', 401);
        }
        
        $sql = "SELECT r.*, pm.nombre as planta_nombre_comun
                FROM recetas r
                JOIN plantas_medicinales pm ON r.planta_id = pm.id
                WHERE r.usuario_id = ?
                ORDER BY r.fecha_creacion DESC";
        
        $recetas = $this->db->fetchAll($sql, [$userId]);
        
        foreach ($recetas as &$receta) {
            $receta['ingredientes'] = json_decode($receta['ingredientes'], true) ?: [];
            $receta['beneficios'] = json_decode($receta['beneficios'], true) ?: [];
        }
        
        return $this->sendSuccess(['recetas' => $recetas]);
    }
    
    /**
     * Crear nueva receta
     */
    private function createReceta() {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->sendError('Usuario no autenticado', 401);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validar datos requeridos
        if (empty($input['planta_id'])) {
            return $this->sendError('El campo planta_id es requerido', 400);
        }
        if (empty($input['ingredientes'])) {
            return $this->sendError('El campo ingredientes es requerido', 400);
        }
        if (empty($input['preparacion'])) {
            return $this->sendError('El campo preparacion es requerido', 400);
        }
        // Título puede venir como 'titulo' o 'nombre'
        $titulo = trim($input['titulo'] ?? ($input['nombre'] ?? ''));
        if ($titulo === '') {
            return $this->sendError('El campo titulo es requerido', 400);
        }
        
        // Verificar que la planta existe
        $planta = $this->db->fetch("SELECT * FROM plantas_medicinales WHERE id = ? AND activa = TRUE", [$input['planta_id']]);
        
        if (!$planta) {
            return $this->sendError('Planta no encontrada', 404);
        }
        
        // Verificar límite de recetas por día (configuración)
        $maxRecetasConfig = $this->db->fetch("SELECT valor FROM configuracion_sistema WHERE clave = 'max_recetas_por_usuario'");
        $maxRecetas = $maxRecetasConfig ? (int)$maxRecetasConfig['valor'] : 5;
        
        $recetasHoy = $this->db->count(
            'recetas',
            'usuario_id = ? AND DATE(fecha_creacion) = CURDATE()',
            [$userId]
        );
        
        if ($recetasHoy >= $maxRecetas) {
            return $this->sendError("Has alcanzado el límite de {$maxRecetas} recetas por día", 429);
        }
        
        $recetaData = [
            'titulo' => trim($input['titulo'] ?? ($input['nombre'] ?? '')),
            'planta_id' => $input['planta_id'],
            'ingredientes' => json_encode($input['ingredientes']),
            'preparacion' => json_encode(is_array($input['preparacion']) ? $input['preparacion'] : array_values(array_filter(array_map('trim', preg_split("/\\r?\\n+/", (string)($input['preparacion'] ?? ''))))), JSON_UNESCAPED_UNICODE),
            'dosis' => trim($input['dosis'] ?? ''),
            'tiempo_preparacion' => trim($input['tiempo_preparacion'] ?? ''),
            'usuario_id' => $userId,
            'dificultad' => strtolower($input['dificultad'] ?? 'facil'),
        ];
        
        // Determinar si la moderación es automática
        $moderacionAuto = $this->db->fetch("SELECT valor FROM configuracion_sistema WHERE clave = 'moderacion_automatica'");
        $autoApprove = $moderacionAuto && $moderacionAuto['valor'] === 'true';
        
        if ($autoApprove) {
            $recetaData['estado_moderacion'] = 'aprobada';
            $recetaData['fecha_moderacion'] = date('Y-m-d H:i:s');
        }
        
        try {
            $recetaId = $this->db->insert('recetas', $recetaData);
            
            $message = $autoApprove ? 'Receta publicada exitosamente' : 'Receta enviada para revisión';
            
            return $this->sendSuccess([
                'receta_id' => $recetaId,
                'estado_moderacion' => $recetaData['estado_moderacion'] ?? 'pendiente'
            ], $message, 201);
            
        } catch (Exception $e) {
            error_log("Error creando receta: " . $e->getMessage());
            return $this->sendError('Error al crear la receta', 500);
        }
    }
    
    /**
     * Valorar receta
     */
    private function valorarReceta() {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->sendError('Usuario no autenticado', 401);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $recetaId = $input['receta_id'] ?? null;
        $rating = $input['rating'] ?? null;
        $comentario = trim($input['comentario'] ?? '');
        
        // Validaciones
        if (!$recetaId || !$rating) {
            return $this->sendError('ID de receta y rating son requeridos', 400);
        }
        
        if (!in_array($rating, [1, 2, 3, 4, 5])) {
            return $this->sendError('Rating debe ser entre 1 y 5', 400);
        }
        
        // Verificar que la receta existe y está aprobada
        if (!$this->db->exists('recetas', 'id = ? AND estado_moderacion = "aprobada"', [$recetaId])) {
            return $this->sendError('Receta no encontrada o no aprobada', 404);
        }
        
        // Verificar si el usuario ya valoró esta receta
        $existingRating = $this->db->fetch(
            "SELECT id FROM valoraciones_recetas WHERE receta_id = ? AND usuario_id = ?",
            [$recetaId, $userId]
        );
        
        try {
            $this->db->beginTransaction();
            
            if ($existingRating) {
                // Actualizar valoración existente
                $this->db->update('valoraciones_recetas', [
                    'calificacion' => $rating,
                    'comentario' => $comentario
                ], 'id = ?', [$existingRating['id']]);
                
                $message = 'Valoración actualizada';
            } else {
                // Crear nueva valoración
                $this->db->insert('valoraciones_recetas', [
                    'receta_id' => $recetaId,
                    'usuario_id' => $userId,
                    'calificacion' => $rating,
                    'comentario' => $comentario
                ]);
                
                $message = 'Valoración agregada';
            }
            
            // Los triggers/consultas actualizarán automáticamente calificación y contadores de la receta
            
            $this->db->commit();
            
            return $this->sendSuccess([], $message);
            
        } catch (Exception $e) {
            $this->db->rollback();
            error_log("Error valorando receta: " . $e->getMessage());
            return $this->sendError('Error al valorar la receta', 500);
        }
    }
    
    /**
     * Moderar receta (aprobar/rechazar)
     */
    private function moderateReceta() {
        $userId = $this->getCurrentUserId();
        $userRole = $this->getCurrentUserRole();
        
        if (!$userId || $userRole !== 'administrador') {
            return $this->sendError('Permisos insuficientes', 403);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $recetaId = $input['receta_id'] ?? null;
        $accion = $input['accion'] ?? null; // 'aprobar' o 'rechazar'
        $notas = trim($input['notas'] ?? '');
        
        if (!$recetaId || !in_array($accion, ['aprobar', 'rechazar'])) {
            return $this->sendError('ID de receta y acción válida son requeridos', 400);
        }
        
        // Verificar que la receta existe y está pendiente
        if (!$this->db->exists('recetas', 'id = ? AND estado_moderacion = "pendiente"', [$recetaId])) {
            return $this->sendError('Receta no encontrada o ya fue moderada', 404);
        }
        
        try {
            $updateData = [
                'moderador_id' => $userId,
                'notas_moderacion' => $notas
            ];
            
            if ($accion === 'aprobar') {
                $updateData['estado_moderacion'] = 'aprobada';
                $updateData['fecha_moderacion'] = date('Y-m-d H:i:s');
                $message = 'Receta aprobada exitosamente';
            } else {
                $updateData['estado_moderacion'] = 'rechazada';
                $message = 'Receta rechazada';
            }
            
            $this->db->update('recetas', $updateData, 'id = ?', [$recetaId]);
            
            return $this->sendSuccess(['accion' => $accion], $message);
            
        } catch (Exception $e) {
            error_log("Error moderando receta: " . $e->getMessage());
            return $this->sendError('Error al moderar la receta', 500);
        }
    }
    
    /**
     * Actualizar receta (solo autor o admin)
     */
    private function updateReceta($id) {
        $userId = $this->getCurrentUserId();
        $userRole = $this->getCurrentUserRole();
        
        if (!$userId) {
            return $this->sendError('Usuario no autenticado', 401);
        }
        
        // Verificar permisos
        $receta = $this->db->fetch("SELECT usuario_id FROM recetas WHERE id = ?", [$id]);
        
        if (!$receta) {
            return $this->sendError('Receta no encontrada', 404);
        }
        
        if ($receta['usuario_id'] != $userId && $userRole !== 'administrador') {
            return $this->sendError('Permisos insuficientes', 403);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $updateData = [];
        
        // Campos actualizables
        $updatable = ['titulo', 'ingredientes', 'preparacion', 'dosis', 
                     'tiempo_preparacion', 'dificultad', 'descripcion'];
        
        foreach ($updatable as $field) {
            if (isset($input[$field])) {
                if (in_array($field, ['ingredientes'])) {
                    $updateData[$field] = json_encode($input[$field]);
                } else {
                    $updateData[$field] = trim($input[$field]);
                }
            }
        }
        
        if (empty($updateData)) {
            return $this->sendError('No hay datos para actualizar', 400);
        }
        
        try {
            $this->db->update('recetas', $updateData, 'id = ?', [$id]);
            
            return $this->sendSuccess([], 'Receta actualizada exitosamente');
            
        } catch (Exception $e) {
            error_log("Error actualizando receta: " . $e->getMessage());
            return $this->sendError('Error al actualizar la receta', 500);
        }
    }
    
    /**
     * Eliminar receta (solo autor o admin)
     */
    private function deleteReceta($id) {
        $userId = $this->getCurrentUserId();
        $userRole = $this->getCurrentUserRole();
        
        if (!$userId) {
            return $this->sendError('Usuario no autenticado', 401);
        }
        
        // Verificar permisos
        $receta = $this->db->fetch("SELECT usuario_id FROM recetas WHERE id = ?", [$id]);
        
        if (!$receta) {
            return $this->sendError('Receta no encontrada', 404);
        }
        
        if ($receta['usuario_id'] != $userId && $userRole !== 'administrador') {
            return $this->sendError('Permisos insuficientes', 403);
        }
        
        try {
            // Eliminar receta y valoraciones asociadas (cascade por FK)
            $this->db->delete('recetas', 'id = ?', [$id]);
            
            return $this->sendSuccess([], 'Receta eliminada exitosamente');
            
        } catch (Exception $e) {
            error_log("Error eliminando receta: " . $e->getMessage());
            return $this->sendError('Error al eliminar la receta', 500);
        }
    }
    
    /**
     * Obtener cláusula ORDER BY según el parámetro de ordenamiento
     */
    private function getOrderBy($sort) {
        switch ($sort) {
            case 'rating':
                return 'r.calificacion_promedio DESC, r.total_comentarios DESC';
            case 'nombre':
                return 'r.titulo ASC';
            case 'comentarios':
                return 'r.total_comentarios DESC, r.calificacion_promedio DESC';
            case 'popularidad':
                return 'r.total_favoritos DESC, r.calificacion_promedio DESC';
            case 'fecha':
            default:
                return 'r.fecha_creacion DESC';
        }
    }
    
    /**
     * Obtener ID del usuario actual desde el token
     */
    private function getCurrentUserId() {
        $token = $this->getBearerToken();
        
        if (!$token) {
            return null;
        }
        
        $session = $this->db->fetch(
            "SELECT usuario_id FROM sesiones WHERE token = ? AND activa = TRUE AND fecha_expiracion > NOW()",
            [$token]
        );
        
        return $session ? $session['usuario_id'] : null;
    }
    
    /**
     * Obtener rol del usuario actual
     */
    private function getCurrentUserRole() {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return null;
        }
        
        $user = $this->db->fetch("SELECT rol FROM usuarios WHERE id = ?", [$userId]);
        
        return $user ? $user['rol'] : null;
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
$api = new RecetasAPI();
$api->handleRequest();
?>
