<?php
/**
 * API de plantas medicinales para PlantaMedicinal
 * Maneja CRUD de plantas, búsquedas y favoritos
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

class PlantasAPI {
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
                        return $this->getPlanta($id);
                    } else {
                        switch ($action) {
                            case 'search':
                                return $this->searchPlantas();
                            case 'categories':
                                return $this->getCategories();
                            case 'popular':
                                return $this->getPopularPlantas();
                            case 'favorites':
                                return $this->getFavorites();
                            default:
                                return $this->getPlantas();
                        }
                    }
                case 'POST':
                    switch ($action) {
                        case 'favorite':
                            return $this->toggleFavorite();
                        case 'create':
                            return $this->createPlanta();
                        default:
                            return $this->sendError('Acción no válida', 400);
                    }
                case 'PUT':
                    if ($id) {
                        return $this->updatePlanta($id);
                    }
                    return $this->sendError('ID de planta requerido', 400);
                case 'DELETE':
                    if ($id) {
                        return $this->deletePlanta($id);
                    }
                    return $this->sendError('ID de planta requerido', 400);
                default:
                    return $this->sendError('Método no permitido', 405);
            }
        } catch (Exception $e) {
            error_log("Error en PlantasAPI: " . $e->getMessage());
            return $this->sendError('Error interno del servidor', 500);
        }
    }
    
    /**
     * Obtener lista de plantas con paginación y filtros
     */
    private function getPlantas() {
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(1, min(50, (int)($_GET['limit'] ?? 12)));
        $offset = ($page - 1) * $limit;
        
        $where = ["activa = TRUE"];
        $params = [];
        
        // Filtros
        if (!empty($_GET['categoria'])) {
            $where[] = "categoria = ?";
            $params[] = $_GET['categoria'];
        }
        
        if (!empty($_GET['region'])) {
            $where[] = "origen LIKE ?";
            $params[] = '%' . $_GET['region'] . '%';
        }
        
        if (!empty($_GET['rating'])) {
            $where[] = "calificacion_promedio >= ?";
            $params[] = (float)$_GET['rating'];
        }
        
        if (!empty($_GET['search'])) {
            $searchTerm = '%' . $_GET['search'] . '%';
            $where[] = "(nombre LIKE ? OR nombre_cientifico LIKE ? OR descripcion LIKE ? OR JSON_SEARCH(beneficios, 'one', ?) IS NOT NULL)";
            $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, str_replace('%', '', $searchTerm)]);
        }
        
        $whereClause = implode(' AND ', $where);
        
        // Ordenamiento
        $orderBy = $this->getOrderBy($_GET['sort'] ?? 'nombre');
        
        // Consulta principal
        $sql = "SELECT pm.*, 
                pm.imagen_url AS imagen,
                pm.calificacion_promedio AS rating,
                pm.total_calificaciones AS referencias_cientificas,
                pm.visualizaciones AS popularidad,
                (SELECT COUNT(*) FROM favoritos_plantas fp WHERE fp.planta_id = pm.id) as total_favoritos,
                (SELECT COUNT(*) FROM recetas r WHERE r.planta_id = pm.id AND r.estado_moderacion = 'aprobada') as total_recetas
                FROM plantas_medicinales pm
                WHERE {$whereClause} 
                ORDER BY {$orderBy} 
                LIMIT {$limit} OFFSET {$offset}";
        
        $plantas = $this->db->fetchAll($sql, $params);
        
        // Contar total para paginación
        $totalSql = "SELECT COUNT(*) as total FROM plantas_medicinales WHERE {$whereClause}";
        $totalResult = $this->db->fetch($totalSql, $params);
        $total = $totalResult['total'];
        
        // Procesar beneficios JSON
        foreach ($plantas as &$planta) {
            $planta['beneficios'] = json_decode($planta['beneficios'], true) ?: [];
        }
        
        return $this->sendSuccess([
            'plantas' => $plantas,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
    }
    
    /**
     * Obtener una planta específica
     */
    private function getPlanta($id) {
        $sql = "SELECT pm.*, 
                pm.imagen_url AS imagen,
                pm.calificacion_promedio AS rating,
                pm.total_calificaciones AS referencias_cientificas,
                pm.visualizaciones AS popularidad,
                (SELECT COUNT(*) FROM favoritos_plantas fp WHERE fp.planta_id = pm.id) as total_favoritos,
                (SELECT COUNT(*) FROM recetas r WHERE r.planta_id = pm.id AND r.estado_moderacion = 'aprobada') as total_recetas
                FROM plantas_medicinales pm
                WHERE id = ? AND activa = TRUE";
        
        $planta = $this->db->fetch($sql, [$id]);
        
        if (!$planta) {
            return $this->sendError('Planta no encontrada', 404);
        }
        
        // Procesar beneficios JSON
        $planta['beneficios'] = json_decode($planta['beneficios'], true) ?: [];
        $planta['contraindicaciones'] = json_decode($planta['contraindicaciones'] ?? '[]', true) ?: [];
        
        // Obtener recetas relacionadas
        $recetasSql = "SELECT r.*, u.nombre as autor_nombre, u.apellido as autor_apellido 
                       FROM recetas r 
                       JOIN usuarios u ON r.usuario_id = u.id 
                       WHERE r.planta_id = ? AND r.estado_moderacion = 'aprobada' 
                       ORDER BY r.calificacion_promedio DESC 
                       LIMIT 5";
        
        $recetas = $this->db->fetchAll($recetasSql, [$id]);
        
        // Procesar recetas
        foreach ($recetas as &$receta) {
            $receta['ingredientes'] = json_decode($receta['ingredientes'], true) ?: [];
            $receta['preparacion'] = json_decode($receta['preparacion'], true) ?: [];
        }
        
        $planta['recetas_relacionadas'] = $recetas;
        
        // Incrementar contador de visualizaciones
        $this->db->query("UPDATE plantas_medicinales SET visualizaciones = visualizaciones + 1 WHERE id = ?", [$id]);
        
        return $this->sendSuccess(['planta' => $planta]);
    }
    
    /**
     * Buscar plantas con algoritmo avanzado
     */
    private function searchPlantas() {
        $query = $_GET['q'] ?? '';
        $limit = max(1, min(20, (int)($_GET['limit'] ?? 10)));
        
        if (strlen($query) < 2) {
            return $this->sendSuccess(['plantas' => []]);
        }
        
        $searchTerm = '%' . $query . '%';
        
        // Búsqueda con scoring de relevancia
        $sql = "SELECT pm.*, 
                pm.imagen_url AS imagen,
                pm.calificacion_promedio AS rating,
                pm.total_calificaciones AS referencias_cientificas,
                pm.visualizaciones AS popularidad,
                (SELECT COUNT(*) FROM favoritos_plantas f WHERE f.planta_id = pm.id) as total_favoritos,
                (
                    CASE 
                        WHEN nombre LIKE ? THEN 10
                        WHEN nombre_cientifico LIKE ? THEN 8
                        WHEN descripcion LIKE ? THEN 5
                        WHEN JSON_SEARCH(beneficios, 'one', ?) IS NOT NULL THEN 3
                        ELSE 1 
                    END +
                    (pm.calificacion_promedio * 2) +
                    (pm.visualizaciones / 10)
                ) as relevance_score
                FROM plantas_medicinales pm
                WHERE activa = TRUE AND (
                    nombre LIKE ? OR 
                    nombre_cientifico LIKE ? OR 
                    descripcion LIKE ? OR 
                    categoria LIKE ? OR
                    JSON_SEARCH(beneficios, 'one', ?) IS NOT NULL
                )
                ORDER BY relevance_score DESC 
                LIMIT {$limit}";
        
        $params = array_fill(0, 9, $searchTerm);
        $params[3] = str_replace('%', '', $searchTerm); // Para JSON_SEARCH
        $params[8] = str_replace('%', '', $searchTerm); // Para JSON_SEARCH
        
        $plantas = $this->db->fetchAll($sql, $params);
        
        // Procesar beneficios JSON
        foreach ($plantas as &$planta) {
            $planta['beneficios'] = json_decode($planta['beneficios'], true) ?: [];
        }
        
        return $this->sendSuccess(['plantas' => $plantas]);
    }
    
    /**
     * Obtener categorías disponibles
     */
    private function getCategories() {
        $sql = "SELECT categoria, COUNT(*) as total 
                FROM plantas_medicinales 
                WHERE activa = TRUE AND categoria IS NOT NULL 
                GROUP BY categoria 
                ORDER BY total DESC";
        
        $categorias = $this->db->fetchAll($sql);
        
        return $this->sendSuccess(['categorias' => $categorias]);
    }
    
    /**
     * Obtener plantas más populares
     */
    private function getPopularPlantas() {
        $limit = max(1, min(10, (int)($_GET['limit'] ?? 5)));
        
        $sql = "SELECT pm.*, 
                pm.imagen_url AS imagen,
                pm.calificacion_promedio AS rating,
                pm.total_calificaciones AS referencias_cientificas,
                pm.visualizaciones AS popularidad,
                (SELECT COUNT(*) FROM favoritos_plantas fp WHERE fp.planta_id = pm.id) as total_favoritos
                FROM plantas_medicinales pm
                WHERE activa = TRUE 
                ORDER BY popularidad DESC, rating DESC 
                LIMIT {$limit}";
        
        $plantas = $this->db->fetchAll($sql);
        
        foreach ($plantas as &$planta) {
            $planta['beneficios'] = json_decode($planta['beneficios'], true) ?: [];
        }
        
        return $this->sendSuccess(['plantas' => $plantas]);
    }
    
    /**
     * Obtener favoritos del usuario
     */
    private function getFavorites() {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->sendError('Usuario no autenticado', 401);
        }
        
        $sql = "SELECT pm.*, fp.fecha_creacion as fecha_agregado,
                pm.imagen_url AS imagen,
                pm.calificacion_promedio AS rating,
                pm.total_calificaciones AS referencias_cientificas,
                pm.visualizaciones AS popularidad,
                (SELECT COUNT(*) FROM favoritos_plantas f2 WHERE f2.planta_id = pm.id) as total_favoritos
                FROM favoritos_plantas fp
                JOIN plantas_medicinales pm ON fp.planta_id = pm.id
                WHERE fp.usuario_id = ? AND pm.activa = TRUE
                ORDER BY fp.fecha_creacion DESC";
        
        $favoritos = $this->db->fetchAll($sql, [$userId]);
        
        foreach ($favoritos as &$planta) {
            $planta['beneficios'] = json_decode($planta['beneficios'], true) ?: [];
        }
        
        return $this->sendSuccess(['favoritos' => $favoritos]);
    }
    
    /**
     * Alternar favorito de una planta
     */
    private function toggleFavorite() {
        $userId = $this->getCurrentUserId();
        
        if (!$userId) {
            return $this->sendError('Usuario no autenticado', 401);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $plantaId = $input['planta_id'] ?? null;
        
        if (!$plantaId) {
            return $this->sendError('ID de planta requerido', 400);
        }
        
        // Verificar que la planta existe
        if (!$this->db->exists('plantas_medicinales', 'id = ? AND activa = TRUE', [$plantaId])) {
            return $this->sendError('Planta no encontrada', 404);
        }
        
        // Verificar si ya es favorito
        $exists = $this->db->exists('favoritos_plantas', 'usuario_id = ? AND planta_id = ?', [$userId, $plantaId]);
        
        if ($exists) {
            // Remover de favoritos
            $this->db->delete('favoritos_plantas', 'usuario_id = ? AND planta_id = ?', [$userId, $plantaId]);
            $action = 'removed';
        } else {
            // Agregar a favoritos
            $this->db->insert('favoritos_plantas', [
                'usuario_id' => $userId,
                'planta_id' => $plantaId
            ]);
            $action = 'added';
        }
        
        return $this->sendSuccess([
            'action' => $action,
            'planta_id' => $plantaId
        ], $action === 'added' ? 'Agregado a favoritos' : 'Removido de favoritos');
    }
    
    /**
     * Crear nueva planta (solo administradores)
     */
    private function createPlanta() {
        $userId = $this->getCurrentUserId();
        $userRole = $this->getCurrentUserRole();
        
        if (!$userId || $userRole !== 'administrador') {
            return $this->sendError('Permisos insuficientes', 403);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validar datos requeridos
        $required = ['nombre_cientifico', 'nombre_comun', 'descripcion', 'beneficios', 'categoria'];
        foreach ($required as $field) {
            if (!isset($input[$field]) || empty(trim($input[$field]))) {
                return $this->sendError("El campo {$field} es requerido", 400);
            }
        }
        
        // Verificar que no existe otra planta con el mismo nombre científico
        if ($this->db->exists('plantas', 'nombre_cientifico = ?', [$input['nombre_cientifico']])) {
            return $this->sendError('Ya existe una planta con este nombre científico', 409);
        }
        
        $plantaData = [
            'nombre_cientifico' => trim($input['nombre_cientifico']),
            'nombre_comun' => trim($input['nombre_comun']),
            'descripcion' => trim($input['descripcion']),
            'beneficios' => json_encode($input['beneficios']),
            'contraindicaciones' => trim($input['contraindicaciones'] ?? ''),
            'region' => trim($input['region'] ?? ''),
            'categoria' => trim($input['categoria']),
            'imagen' => trim($input['imagen'] ?? ''),
            'usos_tradicionales' => trim($input['usos_tradicionales'] ?? ''),
            'referencias_cientificas' => (int)($input['referencias_cientificas'] ?? 0),
            'usuario_creador' => $userId
        ];
        
        try {
            $plantaId = $this->db->insert('plantas', $plantaData);
            
            return $this->sendSuccess([
                'planta_id' => $plantaId
            ], 'Planta creada exitosamente', 201);
            
        } catch (Exception $e) {
            error_log("Error creando planta: " . $e->getMessage());
            return $this->sendError('Error al crear la planta', 500);
        }
    }
    
    /**
     * Actualizar planta existente
     */
    private function updatePlanta($id) {
        $userId = $this->getCurrentUserId();
        $userRole = $this->getCurrentUserRole();
        
        if (!$userId || $userRole !== 'administrador') {
            return $this->sendError('Permisos insuficientes', 403);
        }
        
        // Verificar que la planta existe
        if (!$this->db->exists('plantas_medicinales', 'id = ?', [$id])) {
            return $this->sendError('Planta no encontrada', 404);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $updateData = [];
        
        // Campos actualizables (mapeados al esquema real)
        $updatable = ['nombre_cientifico', 'nombre', 'descripcion', 'contraindicaciones', 
                     'origen', 'categoria', 'imagen_url', 'usos_tradicionales'];
        
        foreach ($updatable as $field) {
            if (isset($input[$field])) {
                if ($field === 'beneficios' || $field === 'contraindicaciones' || $field === 'usos_tradicionales') {
                    $updateData[$field] = json_encode($input[$field]);
                } else {
                    $updateData[$field] = is_numeric($input[$field]) ? (int)$input[$field] : trim($input[$field]);
                }
            }
        }
        
        if (empty($updateData)) {
            return $this->sendError('No hay datos para actualizar', 400);
        }
        
        try {
            $this->db->update('plantas_medicinales', $updateData, 'id = ?', [$id]);
            
            return $this->sendSuccess([], 'Planta actualizada exitosamente');
            
        } catch (Exception $e) {
            error_log("Error actualizando planta: " . $e->getMessage());
            return $this->sendError('Error al actualizar la planta', 500);
        }
    }
    
    /**
     * Eliminar planta (desactivar)
     */
    private function deletePlanta($id) {
        $userId = $this->getCurrentUserId();
        $userRole = $this->getCurrentUserRole();
        
        if (!$userId || $userRole !== 'administrador') {
            return $this->sendError('Permisos insuficientes', 403);
        }
        
        if (!$this->db->exists('plantas', 'id = ?', [$id])) {
            return $this->sendError('Planta no encontrada', 404);
        }
        
        try {
            // Desactivar en lugar de eliminar
            $this->db->update('plantas_medicinales', ['activa' => false], 'id = ?', [$id]);
            
            return $this->sendSuccess([], 'Planta eliminada exitosamente');
            
        } catch (Exception $e) {
            error_log("Error eliminando planta: " . $e->getMessage());
            return $this->sendError('Error al eliminar la planta', 500);
        }
    }
    
    /**
     * Obtener cláusula ORDER BY según el parámetro de ordenamiento
     */
    private function getOrderBy($sort) {
        switch ($sort) {
            case 'rating':
                return 'rating DESC, nombre ASC';
            case 'popularidad':
                return 'popularidad DESC, nombre ASC';
            case 'referencias':
                return 'referencias_cientificas DESC, nombre ASC';
            case 'fecha':
                return 'fecha_creacion DESC';
            case 'nombre':
            default:
                return 'nombre ASC';
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
            "SELECT usuario_id FROM sesiones WHERE token = ? AND activa = TRUE AND expira_en > NOW()",
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
$api = new PlantasAPI();
$api->handleRequest();
?>
