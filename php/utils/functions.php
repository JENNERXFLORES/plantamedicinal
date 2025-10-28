<?php

/**
 * Funciones utilitarias para el sistema de plantas medicinales
 * Archivo: php/utils/functions.php
 */

/**
 * Sanitiza y valida entradas del usuario
 */
function sanitizeInput($input) {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}

/**
 * Valida formato de email
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Valida contraseña segura
 */
function validatePassword($password) {
    // Mínimo 8 caracteres, al menos una mayúscula, minúscula y número
    return preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/', $password);
}

/**
 * Genera token aleatorio
 */
function generateToken($length = 32) {
    return bin2hex(random_bytes($length));
}

/**
 * Valida formato de fecha
 */
function validateDate($date, $format = 'Y-m-d H:i:s') {
    $d = DateTime::createFromFormat($format, $date);
    return $d && $d->format($format) === $date;
}

/**
 * Calcula puntuación de relevancia para búsquedas
 */
function calculateSearchRelevance($searchTerm, $field, $weight = 1) {
    $searchTerm = strtolower(trim($searchTerm));
    $field = strtolower(trim($field));
    
    if (empty($searchTerm) || empty($field)) {
        return 0;
    }
    
    // Coincidencia exacta
    if ($field === $searchTerm) {
        return 100 * $weight;
    }
    
    // Comienza con el término
    if (strpos($field, $searchTerm) === 0) {
        return 80 * $weight;
    }
    
    // Contiene el término
    if (strpos($field, $searchTerm) !== false) {
        return 60 * $weight;
    }
    
    // Similitud por palabras
    $fieldWords = explode(' ', $field);
    $searchWords = explode(' ', $searchTerm);
    $matches = 0;
    
    foreach ($searchWords as $searchWord) {
        foreach ($fieldWords as $fieldWord) {
            if (strpos($fieldWord, $searchWord) !== false) {
                $matches++;
                break;
            }
        }
    }
    
    if ($matches > 0) {
        return (40 * $matches / count($searchWords)) * $weight;
    }
    
    return 0;
}

/**
 * Procesa datos JSON de forma segura
 */
function processJsonField($jsonData) {
    if (is_string($jsonData)) {
        $decoded = json_decode($jsonData, true);
        return $decoded !== null ? $decoded : [];
    }
    return is_array($jsonData) ? $jsonData : [];
}

/**
 * Valida y procesa archivos de imagen
 */
function processImageUpload($file, $uploadDir = 'uploads/', $maxSize = 5242880) {
    // Validaciones básicas
    if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
        throw new Exception('Archivo no válido');
    }
    
    if ($file['size'] > $maxSize) {
        throw new Exception('Archivo demasiado grande. Máximo ' . ($maxSize / 1048576) . 'MB');
    }
    
    // Validar tipo de imagen
    $imageInfo = getimagesize($file['tmp_name']);
    if ($imageInfo === false) {
        throw new Exception('El archivo no es una imagen válida');
    }
    
    $allowedTypes = [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_GIF, IMAGETYPE_WEBP];
    if (!in_array($imageInfo[2], $allowedTypes)) {
        throw new Exception('Tipo de imagen no permitido');
    }
    
    // Generar nombre único
    $extension = image_type_to_extension($imageInfo[2]);
    $filename = uniqid('img_') . $extension;
    $filepath = $uploadDir . $filename;
    
    // Crear directorio si no existe
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Mover archivo
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        throw new Exception('Error al guardar la imagen');
    }
    
    return $filepath;
}

/**
 * Genera respuesta JSON estándar
 */
function jsonResponse($success = true, $data = null, $message = '', $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    
    $response = [
        'success' => $success,
        'timestamp' => date('Y-m-d H:i:s'),
        'message' => $message
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Maneja errores de la aplicación
 */
function handleError($message, $code = 400, $details = null) {
    $errorData = ['error' => $message];
    
    if ($details !== null) {
        $errorData['details'] = $details;
    }
    
    // Log del error (opcional)
    error_log("API Error: $message - Details: " . print_r($details, true));
    
    jsonResponse(false, $errorData, $message, $code);
}

/**
 * Valida token de sesión
 */
function validateSessionToken($token) {
    if (empty($token)) {
        return false;
    }
    
    try {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            SELECT u.*, s.expira_en 
            FROM usuarios u 
            INNER JOIN sesiones s ON u.id = s.usuario_id 
            WHERE s.token = ? AND s.expira_en > NOW() AND s.activa = TRUE
        ");
        $stmt->execute([$token]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        return false;
    }
}

/**
 * Valida permisos de usuario
 */
function validateUserPermissions($requiredRole, $userRole) {
    $roleHierarchy = [
        'usuario' => 1,
        'proveedor' => 2,
        'administrador' => 3
    ];
    
    return isset($roleHierarchy[$userRole]) && 
           isset($roleHierarchy[$requiredRole]) && 
           $roleHierarchy[$userRole] >= $roleHierarchy[$requiredRole];
}

/**
 * Limpia y valida parámetros de paginación
 */
function validatePaginationParams($page = 1, $limit = 10, $maxLimit = 100) {
    $page = max(1, (int)$page);
    $limit = min($maxLimit, max(1, (int)$limit));
    
    return ['page' => $page, 'limit' => $limit];
}

/**
 * Calcula offset para paginación
 */
function calculateOffset($page, $limit) {
    return ($page - 1) * $limit;
}

/**
 * Genera metadata para paginación
 */
function generatePaginationMeta($totalRecords, $page, $limit) {
    $totalPages = ceil($totalRecords / $limit);
    
    return [
        'current_page' => $page,
        'per_page' => $limit,
        'total_records' => $totalRecords,
        'total_pages' => $totalPages,
        'has_next_page' => $page < $totalPages,
        'has_prev_page' => $page > 1
    ];
}

/**
 * Formatea fecha para mostrar
 */
function formatDate($date, $format = 'd/m/Y H:i') {
    if (!$date) return '';
    
    try {
        return (new DateTime($date))->format($format);
    } catch (Exception $e) {
        return $date;
    }
}

/**
 * Calcula tiempo transcurrido (hace X tiempo)
 */
function timeAgo($datetime) {
    if (!$datetime) return '';
    
    try {
        $time = time() - strtotime($datetime);
        
        if ($time < 60) return 'hace un momento';
        if ($time < 3600) return 'hace ' . floor($time/60) . ' minutos';
        if ($time < 86400) return 'hace ' . floor($time/3600) . ' horas';
        if ($time < 2629746) return 'hace ' . floor($time/86400) . ' días';
        if ($time < 31556926) return 'hace ' . floor($time/2629746) . ' meses';
        return 'hace ' . floor($time/31556926) . ' años';
    } catch (Exception $e) {
        return $datetime;
    }
}

/**
 * Valida y procesa filtros de búsqueda
 */
function processSearchFilters($filters) {
    $validFilters = [];
    
    if (!empty($filters['categoria'])) {
        $validFilters['categoria'] = sanitizeInput($filters['categoria']);
    }
    
    if (!empty($filters['origen'])) {
        $validFilters['origen'] = sanitizeInput($filters['origen']);
    }
    
    if (!empty($filters['estado'])) {
        $validFilters['estado'] = sanitizeInput($filters['estado']);
    }
    
    if (!empty($filters['fecha_desde'])) {
        if (validateDate($filters['fecha_desde'], 'Y-m-d')) {
            $validFilters['fecha_desde'] = $filters['fecha_desde'];
        }
    }
    
    if (!empty($filters['fecha_hasta'])) {
        if (validateDate($filters['fecha_hasta'], 'Y-m-d')) {
            $validFilters['fecha_hasta'] = $filters['fecha_hasta'];
        }
    }
    
    return $validFilters;
}

/**
 * Genera consulta WHERE dinámicamente
 */
function buildWhereClause($filters, &$params) {
    $conditions = [];
    
    foreach ($filters as $field => $value) {
        switch ($field) {
            case 'categoria':
                $conditions[] = "categoria = ?";
                $params[] = $value;
                break;
                
            case 'origen':
                $conditions[] = "origen = ?";
                $params[] = $value;
                break;
                
            case 'estado':
                $conditions[] = "estado = ?";
                $params[] = $value;
                break;
                
            case 'fecha_desde':
                $conditions[] = "DATE(fecha_creacion) >= ?";
                $params[] = $value;
                break;
                
            case 'fecha_hasta':
                $conditions[] = "DATE(fecha_creacion) <= ?";
                $params[] = $value;
                break;
                
            case 'search':
                $conditions[] = "(nombre LIKE ? OR nombre_cientifico LIKE ? OR descripcion LIKE ?)";
                $searchTerm = "%{$value}%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                break;
        }
    }
    
    return empty($conditions) ? "" : "WHERE " . implode(" AND ", $conditions);
}

/**
 * Log de actividades del sistema
 */
function logActivity($userId, $action, $details = null) {
    try {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            INSERT INTO logs_actividad (usuario_id, accion, detalles, fecha_creacion) 
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([$userId, $action, json_encode($details, JSON_UNESCAPED_UNICODE)]);
    } catch (Exception $e) {
        error_log("Error logging activity: " . $e->getMessage());
    }
}

/**
 * Envía notificación a usuarios
 */
function sendNotification($userId, $title, $message, $type = 'info') {
    try {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, fecha_creacion) 
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$userId, $title, $message, $type]);
    } catch (Exception $e) {
        error_log("Error sending notification: " . $e->getMessage());
    }
}