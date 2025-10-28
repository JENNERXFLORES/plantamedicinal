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
 * API para gestión de comunidades y foros
 * Archivo: php/api/comunidad.php
 */
class ComunidadAPI {
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

    private function requireAuth($role = 'usuario') {
        if (!$this->user) {
            handleError('Token de autenticación requerido', 401);
        }
        if (!validateUserPermissions($role, $this->user['rol'])) {
            handleError('Permisos insuficientes', 403);
        }
    }

    private function handleGetRequest($pathParts) {
        $endpoint = end($pathParts);
        
        switch ($endpoint) {
            case 'posts':
                $this->getPosts();
                break;
            case 'categorias':
                $this->getCategorias();
                break;
            case 'comentarios':
                $this->getComentarios();
                break;
            case 'comunidades':
                $this->getComunidades();
                break;
            case 'miembros':
                $this->getMiembros();
                break;
            case 'notificaciones':
                $this->getNotificaciones();
                break;
            default:
                // Si hay ID específico
                if (is_numeric($endpoint)) {
                    $this->getPostById($endpoint);
                } else {
                    handleError('Endpoint no encontrado', 404);
                }
        }
    }

    private function handlePostRequest($pathParts) {
        $endpoint = end($pathParts);
        
        switch ($endpoint) {
            case 'posts':
                $this->createPost();
                break;
            case 'comentarios':
                $this->createComentario();
                break;
            case 'comunidades':
                $this->createComunidad();
                break;
            case 'unirse':
                $this->unirseAComunidad();
                break;
            case 'votar':
                $this->votarPost();
                break;
            case 'reportar':
                $this->reportarContenido();
                break;
            default:
                handleError('Endpoint no encontrado', 404);
        }
    }

    private function handlePutRequest($pathParts) {
        $endpoint = end($pathParts);
        
        if (is_numeric($endpoint)) {
            $id = $endpoint;
            $tipo = $pathParts[count($pathParts) - 2];
            
            switch ($tipo) {
                case 'posts':
                    $this->updatePost($id);
                    break;
                case 'comentarios':
                    $this->updateComentario($id);
                    break;
                case 'comunidades':
                    $this->updateComunidad($id);
                    break;
                default:
                    handleError('Endpoint no encontrado', 404);
            }
        } else {
            handleError('ID requerido', 400);
        }
    }

    private function handleDeleteRequest($pathParts) {
        $endpoint = end($pathParts);
        
        if (is_numeric($endpoint)) {
            $id = $endpoint;
            $tipo = $pathParts[count($pathParts) - 2];
            
            switch ($tipo) {
                case 'posts':
                    $this->deletePost($id);
                    break;
                case 'comentarios':
                    $this->deleteComentario($id);
                    break;
                case 'salir':
                    $this->salirDeComunidad($id);
                    break;
                default:
                    handleError('Endpoint no encontrado', 404);
            }
        } else {
            handleError('ID requerido', 400);
        }
    }

    // Métodos para Posts del Foro
    private function getPosts() {
        $params = validatePaginationParams($_GET['page'] ?? 1, $_GET['limit'] ?? 10);
        $comunidadId = $_GET['comunidad_id'] ?? null;
        $categoria = $_GET['categoria'] ?? null;
        $search = $_GET['search'] ?? '';
        $ordenar = $_GET['ordenar'] ?? 'reciente';

        $whereClause = "WHERE p.activo = TRUE";
        $queryParams = [];

        if ($comunidadId) {
            $whereClause .= " AND p.comunidad_id = ?";
            $queryParams[] = $comunidadId;
        }

        if ($categoria) {
            $whereClause .= " AND p.categoria = ?";
            $queryParams[] = $categoria;
        }

        if ($search) {
            $whereClause .= " AND (p.titulo LIKE ? OR p.contenido LIKE ?)";
            $searchTerm = "%{$search}%";
            $queryParams[] = $searchTerm;
            $queryParams[] = $searchTerm;
        }

        // Ordenamiento
        $orderClause = "ORDER BY ";
        switch ($ordenar) {
            case 'popular':
                $orderClause .= "p.votos_positivos DESC, p.fecha_creacion DESC";
                break;
            case 'comentarios':
                $orderClause .= "p.total_comentarios DESC, p.fecha_creacion DESC";
                break;
            default:
                $orderClause .= "p.fecha_creacion DESC";
        }

        $offset = calculateOffset($params['page'], $params['limit']);
        
        // Contar total
        $countQuery = "SELECT COUNT(*) as total FROM posts_foro p $whereClause";
        $stmt = $this->db->prepare($countQuery);
        $stmt->execute($queryParams);
        $totalRecords = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Obtener posts
        $query = "
            SELECT 
                p.*,
                u.nombre, u.apellido, u.avatar,
                c.nombre as comunidad_nombre,
                DATE_FORMAT(p.fecha_creacion, '%d/%m/%Y %H:%i') as fecha_formateada
            FROM posts_foro p
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            LEFT JOIN comunidades c ON p.comunidad_id = c.id
            $whereClause
            $orderClause
            LIMIT ? OFFSET ?
        ";

        $queryParams[] = $params['limit'];
        $queryParams[] = $offset;

        $stmt = $this->db->prepare($query);
        $stmt->execute($queryParams);
        $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Procesar posts
        foreach ($posts as &$post) {
            $post['puede_editar'] = $this->user && 
                ($this->user['id'] == $post['usuario_id'] || $this->user['rol'] === 'administrador');
            $post['tags'] = processJsonField($post['tags']);
        }

        $meta = generatePaginationMeta($totalRecords, $params['page'], $params['limit']);

        jsonResponse(true, [
            'posts' => $posts,
            'meta' => $meta
        ]);
    }

    private function getPostById($id) {
        $query = "
            SELECT 
                p.*,
                u.nombre, u.apellido, u.avatar,
                c.nombre as comunidad_nombre,
                DATE_FORMAT(p.fecha_creacion, '%d/%m/%Y %H:%i') as fecha_formateada
            FROM posts_foro p
            LEFT JOIN usuarios u ON p.usuario_id = u.id
            LEFT JOIN comunidades c ON p.comunidad_id = c.id
            WHERE p.id = ? AND p.activo = TRUE
        ";

        $stmt = $this->db->prepare($query);
        $stmt->execute([$id]);
        $post = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$post) {
            handleError('Post no encontrado', 404);
        }

        // Incrementar visualizaciones
        $this->db->prepare("UPDATE posts_foro SET visualizaciones = visualizaciones + 1 WHERE id = ?")
                ->execute([$id]);

        // Obtener comentarios
        $comentarios = $this->getComentariosDelPost($id);

        $post['puede_editar'] = $this->user && 
            ($this->user['id'] == $post['usuario_id'] || $this->user['rol'] === 'administrador');
        $post['tags'] = processJsonField($post['tags']);
        $post['comentarios'] = $comentarios;

        jsonResponse(true, $post);
    }

    private function createPost() {
        $this->requireAuth();

        $data = json_decode(file_get_contents('php://input'), true);
        
        $titulo = sanitizeInput($data['titulo'] ?? '');
        $contenido = sanitizeInput($data['contenido'] ?? '');
        $categoria = sanitizeInput($data['categoria'] ?? '');
        $comunidadId = (int)($data['comunidad_id'] ?? 0);
        $tags = $data['tags'] ?? [];

        if (empty($titulo) || empty($contenido)) {
            handleError('Título y contenido son obligatorios');
        }

        // Verificar si el usuario pertenece a la comunidad
        if ($comunidadId > 0) {
            $stmt = $this->db->prepare("SELECT id FROM miembros_comunidad WHERE usuario_id = ? AND comunidad_id = ? AND estado = 'activo'");
            $stmt->execute([$this->user['id'], $comunidadId]);
            if (!$stmt->fetch()) {
                handleError('Debes ser miembro de la comunidad para publicar');
            }
        }

        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("
                INSERT INTO posts_foro 
                (usuario_id, comunidad_id, titulo, contenido, categoria, tags, fecha_creacion) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");

            $stmt->execute([
                $this->user['id'],
                $comunidadId > 0 ? $comunidadId : null,
                $titulo,
                $contenido,
                $categoria,
                json_encode($tags, JSON_UNESCAPED_UNICODE)
            ]);

            $postId = $this->db->lastInsertId();

            // Log de actividad
            logActivity($this->user['id'], 'post_creado', ['post_id' => $postId, 'titulo' => $titulo]);

            $this->db->commit();

            jsonResponse(true, ['post_id' => $postId], 'Post creado exitosamente', 201);

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    private function updatePost($id) {
        $this->requireAuth();

        $data = json_decode(file_get_contents('php://input'), true);

        // Verificar permisos
        $stmt = $this->db->prepare("SELECT * FROM posts_foro WHERE id = ? AND activo = TRUE");
        $stmt->execute([$id]);
        $post = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$post) {
            handleError('Post no encontrado', 404);
        }

        if ($post['usuario_id'] != $this->user['id'] && $this->user['rol'] !== 'administrador') {
            handleError('No tienes permisos para editar este post', 403);
        }

        $titulo = sanitizeInput($data['titulo'] ?? $post['titulo']);
        $contenido = sanitizeInput($data['contenido'] ?? $post['contenido']);
        $categoria = sanitizeInput($data['categoria'] ?? $post['categoria']);
        $tags = $data['tags'] ?? processJsonField($post['tags']);

        $stmt = $this->db->prepare("
            UPDATE posts_foro 
            SET titulo = ?, contenido = ?, categoria = ?, tags = ?, fecha_actualizacion = NOW()
            WHERE id = ?
        ");

        $stmt->execute([
            $titulo,
            $contenido,
            $categoria,
            json_encode($tags, JSON_UNESCAPED_UNICODE),
            $id
        ]);

        logActivity($this->user['id'], 'post_actualizado', ['post_id' => $id]);

        jsonResponse(true, null, 'Post actualizado exitosamente');
    }

    private function deletePost($id) {
        $this->requireAuth();

        // Verificar permisos
        $stmt = $this->db->prepare("SELECT * FROM posts_foro WHERE id = ? AND activo = TRUE");
        $stmt->execute([$id]);
        $post = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$post) {
            handleError('Post no encontrado', 404);
        }

        if ($post['usuario_id'] != $this->user['id'] && $this->user['rol'] !== 'administrador') {
            handleError('No tienes permisos para eliminar este post', 403);
        }

        // Eliminación lógica
        $stmt = $this->db->prepare("UPDATE posts_foro SET activo = FALSE WHERE id = ?");
        $stmt->execute([$id]);

        logActivity($this->user['id'], 'post_eliminado', ['post_id' => $id]);

        jsonResponse(true, null, 'Post eliminado exitosamente');
    }

    // Métodos para Comentarios
    private function getComentarios() {
        $postId = $_GET['post_id'] ?? null;
        if (!$postId) {
            handleError('ID del post requerido');
        }

        $comentarios = $this->getComentariosDelPost($postId);
        jsonResponse(true, $comentarios);
    }

    private function getComentariosDelPost($postId) {
        $query = "
            SELECT 
                c.*,
                u.nombre, u.apellido, u.avatar,
                DATE_FORMAT(c.fecha_creacion, '%d/%m/%Y %H:%i') as fecha_formateada
            FROM comentarios_post c
            LEFT JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.post_id = ? AND c.activo = TRUE
            ORDER BY c.fecha_creacion ASC
        ";

        $stmt = $this->db->prepare($query);
        $stmt->execute([$postId]);
        $comentarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($comentarios as &$comentario) {
            $comentario['puede_editar'] = $this->user && 
                ($this->user['id'] == $comentario['usuario_id'] || $this->user['rol'] === 'administrador');
        }

        return $comentarios;
    }

    private function createComentario() {
        $this->requireAuth();

        $data = json_decode(file_get_contents('php://input'), true);
        
        $postId = (int)($data['post_id'] ?? 0);
        $contenido = sanitizeInput($data['contenido'] ?? '');
        $comentarioPadreId = (int)($data['comentario_padre_id'] ?? 0) ?: null;

        if (empty($contenido) || $postId <= 0) {
            handleError('Post ID y contenido son obligatorios');
        }

        // Verificar que el post existe
        $stmt = $this->db->prepare("SELECT id FROM posts_foro WHERE id = ? AND activo = TRUE");
        $stmt->execute([$postId]);
        if (!$stmt->fetch()) {
            handleError('Post no encontrado', 404);
        }

        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("
                INSERT INTO comentarios_post 
                (post_id, usuario_id, contenido, comentario_padre_id, fecha_creacion) 
                VALUES (?, ?, ?, ?, NOW())
            ");

            $stmt->execute([$postId, $this->user['id'], $contenido, $comentarioPadreId]);

            $comentarioId = $this->db->lastInsertId();

            // Actualizar contador de comentarios en el post
            $this->db->prepare("UPDATE posts_foro SET total_comentarios = total_comentarios + 1 WHERE id = ?")
                    ->execute([$postId]);

            logActivity($this->user['id'], 'comentario_creado', ['post_id' => $postId, 'comentario_id' => $comentarioId]);

            $this->db->commit();

            jsonResponse(true, ['comentario_id' => $comentarioId], 'Comentario creado exitosamente', 201);

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // Métodos para Comunidades
    private function getComunidades() {
        $params = validatePaginationParams($_GET['page'] ?? 1, $_GET['limit'] ?? 10);
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
                c.*,
                u.nombre as creador_nombre,
                COUNT(mc.id) as total_miembros
            FROM comunidades c
            LEFT JOIN usuarios u ON c.creador_id = u.id
            LEFT JOIN miembros_comunidad mc ON c.id = mc.comunidad_id AND mc.estado = 'activo'
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

        foreach ($comunidades as &$comunidad) {
            $comunidad['es_miembro'] = false;
            $comunidad['puede_administrar'] = false;

            if ($this->user) {
                // Verificar membresía
                $stmt = $this->db->prepare("SELECT estado FROM miembros_comunidad WHERE usuario_id = ? AND comunidad_id = ?");
                $stmt->execute([$this->user['id'], $comunidad['id']]);
                $miembro = $stmt->fetch();
                
                $comunidad['es_miembro'] = $miembro && $miembro['estado'] === 'activo';
                $comunidad['puede_administrar'] = $this->user['id'] == $comunidad['creador_id'] || $this->user['rol'] === 'administrador';
            }
        }

        jsonResponse(true, $comunidades);
    }

    private function createComunidad() {
        $this->requireAuth('proveedor');

        $data = json_decode(file_get_contents('php://input'), true);
        
        $nombre = sanitizeInput($data['nombre'] ?? '');
        $descripcion = sanitizeInput($data['descripcion'] ?? '');
        $categoria = sanitizeInput($data['categoria'] ?? '');
        $esPublica = (bool)($data['es_publica'] ?? true);

        if (empty($nombre) || empty($descripcion)) {
            handleError('Nombre y descripción son obligatorios');
        }

        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("
                INSERT INTO comunidades 
                (creador_id, nombre, descripcion, categoria, es_publica, fecha_creacion) 
                VALUES (?, ?, ?, ?, ?, NOW())
            ");

            $stmt->execute([$this->user['id'], $nombre, $descripcion, $categoria, $esPublica]);
            $comunidadId = $this->db->lastInsertId();

            // Agregar al creador como miembro
            $stmt = $this->db->prepare("
                INSERT INTO miembros_comunidad 
                (comunidad_id, usuario_id, rol, fecha_union) 
                VALUES (?, ?, 'admin', NOW())
            ");
            $stmt->execute([$comunidadId, $this->user['id']]);

            logActivity($this->user['id'], 'comunidad_creada', ['comunidad_id' => $comunidadId, 'nombre' => $nombre]);

            $this->db->commit();

            jsonResponse(true, ['comunidad_id' => $comunidadId], 'Comunidad creada exitosamente', 201);

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // Métodos adicionales para votación, reportes, etc.
    private function votarPost() {
        $this->requireAuth();

        $data = json_decode(file_get_contents('php://input'), true);
        $postId = (int)($data['post_id'] ?? 0);
        $tipoVoto = $data['tipo'] ?? ''; // 'positivo' o 'negativo'

        if ($postId <= 0 || !in_array($tipoVoto, ['positivo', 'negativo'])) {
            handleError('Post ID y tipo de voto válido requeridos');
        }

        try {
            $this->db->beginTransaction();

            // Verificar voto existente
            $stmt = $this->db->prepare("SELECT * FROM votos_post WHERE post_id = ? AND usuario_id = ?");
            $stmt->execute([$postId, $this->user['id']]);
            $votoExistente = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($votoExistente) {
                // Actualizar voto existente
                if ($votoExistente['tipo'] !== $tipoVoto) {
                    $stmt = $this->db->prepare("UPDATE votos_post SET tipo = ? WHERE id = ?");
                    $stmt->execute([$tipoVoto, $votoExistente['id']]);
                }
            } else {
                // Crear nuevo voto
                $stmt = $this->db->prepare("INSERT INTO votos_post (post_id, usuario_id, tipo, fecha_creacion) VALUES (?, ?, ?, NOW())");
                $stmt->execute([$postId, $this->user['id'], $tipoVoto]);
            }

            // Actualizar contadores en el post
            $stmt = $this->db->prepare("
                UPDATE posts_foro p SET 
                    votos_positivos = (SELECT COUNT(*) FROM votos_post WHERE post_id = p.id AND tipo = 'positivo'),
                    votos_negativos = (SELECT COUNT(*) FROM votos_post WHERE post_id = p.id AND tipo = 'negativo')
                WHERE p.id = ?
            ");
            $stmt->execute([$postId]);

            $this->db->commit();

            jsonResponse(true, null, 'Voto registrado exitosamente');

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // Obtener categorías disponibles
    private function getCategorias() {
        $categorias = [
            'general' => 'General',
            'plantas' => 'Plantas Medicinales',
            'recetas' => 'Recetas',
            'cultura' => 'Cultura Ancestral',
            'investigacion' => 'Investigación',
            'consultas' => 'Consultas',
            'eventos' => 'Eventos'
        ];

        jsonResponse(true, $categorias);
    }

    // Obtener notificaciones del usuario
    private function getNotificaciones() {
        $this->requireAuth();

        $params = validatePaginationParams($_GET['page'] ?? 1, $_GET['limit'] ?? 20);
        $offset = calculateOffset($params['page'], $params['limit']);

        $query = "
            SELECT * FROM notificaciones 
            WHERE usuario_id = ? 
            ORDER BY fecha_creacion DESC 
            LIMIT ? OFFSET ?
        ";

        $stmt = $this->db->prepare($query);
        $stmt->execute([$this->user['id'], $params['limit'], $offset]);
        $notificaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($notificaciones as &$notificacion) {
            $notificacion['fecha_formateada'] = formatDate($notificacion['fecha_creacion']);
            $notificacion['tiempo_transcurrido'] = timeAgo($notificacion['fecha_creacion']);
        }

        jsonResponse(true, $notificaciones);
    }
}

// Instanciar y ejecutar API
$api = new ComunidadAPI();
$api->handleRequest();
?>