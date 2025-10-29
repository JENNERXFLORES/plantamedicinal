<?php
/**
 * API de estadísticas para la portada
 * Devuelve conteos en tiempo real desde MySQL
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../utils/functions.php';

try {
    $db = Database::getInstance();

    // Plantas: usar tabla real del esquema (plantas_medicinales)
    $plantas = $db->count('plantas_medicinales', '1=1');

    // Recetas aprobadas o activas
    $recetas = $db->count('recetas', "(estado_moderacion = 'aprobada' OR estado_moderacion IS NULL) AND (activa = 1 OR activa IS NULL)");

    // Comunidades activas
    $comunidades = $db->count('comunidades', '(activa = 1 OR activa IS NULL)');

    // Usuarios activos (compatibilidad: columna boolean 'activo' o enum 'estado')
    $usuariosActivos = 0;
    try {
        $usuariosActivos = $db->count('usuarios', 'activo = 1');
    } catch (Exception $e) {
        // Si la columna 'activo' no existe, intentar con estado='activo'
        try {
            $usuariosActivos = $db->count('usuarios', "estado = 'activo'");
        } catch (Exception $e2) {
            $usuariosActivos = 0;
        }
    }

    jsonResponse(true, [
        'plantas' => (int)$plantas,
        'recetas' => (int)$recetas,
        'comunidades' => (int)$comunidades,
        'usuarios_activos' => (int)$usuariosActivos
    ], 'OK');
} catch (Exception $e) {
    handleError('No fue posible obtener las estadísticas', 500, $e->getMessage());
}

