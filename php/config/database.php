<?php
/**
 * Configuración de conexión a la base de datos MySQL
 * PlantaMedicinal - Sistema de gestión de plantas medicinales
 * 
 * Este archivo contiene la configuración para conectar con XAMPP/MySQL
 */

// Configuración de la base de datos
define('DB_HOST', 'localhost');
define('DB_NAME', 'plantamedicinal');
define('DB_USER', 'root');  // Usuario por defecto de XAMPP
define('DB_PASS', '');      // Contraseña vacía por defecto en XAMPP
define('DB_CHARSET', 'utf8mb4');

// Configuraciones adicionales
define('DB_PORT', 3306);
define('DB_OPTIONS', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
]);

class Database {
    private static $instance = null;
    private $connection;
    private $host = DB_HOST;
    private $port = DB_PORT;
    private $dbname = DB_NAME;
    private $username = DB_USER;
    private $password = DB_PASS;

    /**
     * Constructor privado para patrón Singleton
     */
    private function __construct() {
        try {
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->dbname};charset=" . DB_CHARSET;
            $this->connection = new PDO($dsn, $this->username, $this->password, DB_OPTIONS);
            
            // Configurar zona horaria
            $this->connection->exec("SET time_zone = '-05:00'"); // Colombia UTC-5
            
        } catch (PDOException $e) {
            // Log del error (en producción no mostrar detalles)
            error_log("Error de conexión a la base de datos: " . $e->getMessage());
            
            // En desarrollo mostrar error, en producción mostrar mensaje genérico
            if (defined('DEBUG') && DEBUG === true) {
                die("Error de conexión: " . $e->getMessage());
            } else {
                die("Error de conexión a la base de datos. Por favor, intente más tarde.");
            }
        }
    }

    /**
     * Obtener instancia única de la conexión (Singleton)
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Obtener la conexión PDO
     */
    public function getConnection() {
        return $this->connection;
    }

    /**
     * Ejecutar una consulta preparada
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Error en consulta SQL: " . $e->getMessage() . " | SQL: " . $sql);
            throw new Exception("Error en la consulta a la base de datos");
        }
    }

    /**
     * Obtener todos los resultados de una consulta
     */
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }

    /**
     * Obtener un solo resultado de una consulta
     */
    public function fetch($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }

    /**
     * Insertar un registro y obtener el ID
     */
    public function insert($table, $data) {
        $fields = array_keys($data);
        $placeholders = ':' . implode(', :', $fields);
        $fieldsList = implode(', ', $fields);
        
        $sql = "INSERT INTO {$table} ({$fieldsList}) VALUES ({$placeholders})";
        
        $stmt = $this->query($sql, $data);
        return $this->connection->lastInsertId();
    }

    /**
     * Actualizar registros
     */
    public function update($table, $data, $condition, $conditionParams = []) {
        $fields = [];
        foreach (array_keys($data) as $field) {
            $fields[] = "{$field} = :{$field}";
        }
        $fieldsList = implode(', ', $fields);
        
        $sql = "UPDATE {$table} SET {$fieldsList} WHERE {$condition}";
        
        $params = array_merge($data, $conditionParams);
        return $this->query($sql, $params);
    }

    /**
     * Eliminar registros
     */
    public function delete($table, $condition, $params = []) {
        $sql = "DELETE FROM {$table} WHERE {$condition}";
        return $this->query($sql, $params);
    }

    /**
     * Contar registros
     */
    public function count($table, $condition = '1=1', $params = []) {
        $sql = "SELECT COUNT(*) as total FROM {$table} WHERE {$condition}";
        $result = $this->fetch($sql, $params);
        return (int) $result['total'];
    }

    /**
     * Verificar si existe un registro
     */
    public function exists($table, $condition, $params = []) {
        return $this->count($table, $condition, $params) > 0;
    }

    /**
     * Iniciar transacción
     */
    public function beginTransaction() {
        return $this->connection->beginTransaction();
    }

    /**
     * Confirmar transacción
     */
    public function commit() {
        return $this->connection->commit();
    }

    /**
     * Cancelar transacción
     */
    public function rollback() {
        return $this->connection->rollback();
    }

    

    /**
     * Preparar statement (delegación directa a PDO)
     */
    public function prepare($sql) {
        return $this->connection->prepare($sql);
    }

    /**
     * Obtener último ID insertado (delegación directa a PDO)
     */
    public function lastInsertId() {
        return $this->connection->lastInsertId();
    }

    /**
     * Escapar string para prevenir SQL injection (adicional a prepared statements)
     */
    public function escape($string) {
        return $this->connection->quote($string);
    }

    /**
     * Obtener información de la última consulta
     */
    public function getLastError() {
        $errorInfo = $this->connection->errorInfo();
        return $errorInfo[2] ?? null;
    }

    /**
     * Cerrar conexión
     */
    public function close() {
        $this->connection = null;
    }

    /**
     * Prevenir clonación del objeto
     */
    private function __clone() {}

    /**
     * Prevenir deserialización del objeto
     */
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

/**
 * Función helper para obtener la instancia de la base de datos
 */
function getDB() {
    return Database::getInstance();
}

/**
 * Función para verificar la conexión a la base de datos
 */
function testDatabaseConnection() {
    try {
        $db = Database::getInstance();
        $result = $db->fetch("SELECT 1 as test");
        return $result['test'] === 1;
    } catch (Exception $e) {
        error_log("Test de conexión falló: " . $e->getMessage());
        return false;
    }
}

/**
 * Configuración de errores para desarrollo/producción
 */
if (!defined('DEBUG')) {
    define('DEBUG', true); // Cambiar a false en producción
}

// Configurar reporte de errores según el entorno
if (DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Configurar log de errores
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/php_errors.log');

// Crear directorio de logs si no existe
$logDir = __DIR__ . '/../../logs';
if (!file_exists($logDir)) {
    mkdir($logDir, 0755, true);
}

?>
