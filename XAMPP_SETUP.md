# 🚀 Guía de Configuración XAMPP para PlantaMedicinal

Esta guía te ayudará a configurar XAMPP y migrar el sistema PlantaMedicinal desde almacenamiento local a base de datos MySQL.

## 📋 Requisitos Previos

- Windows, macOS o Linux
- XAMPP versión 7.4 o superior
- Navegador web moderno
- Editor de código (opcional, recomendado)

## 📦 Instalación de XAMPP

### 1. Descargar XAMPP
- Visita [https://www.apachefriends.org](https://www.apachefriends.org)
- Descarga la versión para tu sistema operativo
- Instala XAMPP siguiendo las instrucciones del instalador

### 2. Componentes Necesarios
Asegúrate de instalar estos componentes:
- ✅ Apache Web Server
- ✅ MySQL Database
- ✅ PHP
- ✅ phpMyAdmin (opcional pero recomendado)

## ⚙️ Configuración Inicial

### 1. Ubicación del Proyecto

**IMPORTANTE**: La ubicación correcta del proyecto es crucial para evitar problemas.

#### Para Windows:
```
C:/xampp/htdocs/plantamedicinal/
```

#### Para macOS:
```
/Applications/XAMPP/xamppfiles/htdocs/plantamedicinal/
```

#### Para Linux:
```
/opt/lampp/htdocs/plantamedicinal/
```

### 2. Estructura de Archivos
Una vez copiado el proyecto, la estructura debe verse así:
```
plantamedicinal/
├── index.html
├── plantas.html
├── recetas.html
├── admin.html
├── comunidad.html
├── css/
├── js/
├── database/
│   └── plantamedicinal.sql
└── php/
    ├── config/
    │   └── database.php
    ├── api/
    │   ├── auth.php
    │   ├── plantas.php
    │   ├── recetas.php
    │   ├── comunidad.php
    │   └── admin.php
    └── utils/
        └── functions.php
```

## 🔧 Configuración de XAMPP

### 1. Iniciar Servicios
1. Abre el Panel de Control de XAMPP
2. Inicia los siguientes servicios:
   - **Apache** ✅
   - **MySQL** ✅

### 2. Verificar que los Servicios Funcionan
- **Apache**: Navega a `http://localhost` - deberías ver la página de bienvenida de XAMPP
- **MySQL**: En el panel de XAMPP, el botón "Admin" de MySQL debería abrir phpMyAdmin

### 3. Configurar PHP (si es necesario)
Si encuentras problemas, verifica la configuración de PHP:

1. Abre el archivo `php.ini` desde el panel de XAMPP
2. Asegúrate de que estas extensiones estén habilitadas:
```ini
extension=mysqli
extension=pdo_mysql
extension=json
```

## 🗄️ Configuración de la Base de Datos

### 1. Crear la Base de Datos

#### Opción A: Usando phpMyAdmin (Recomendado)
1. Ve a `http://localhost/phpmyadmin`
2. Haz clic en "Nuevo" en el panel izquierdo
3. Nombre de la base de datos: `plantamedicinal`
4. Collation: `utf8mb4_unicode_ci`
5. Haz clic en "Crear"

#### Opción B: Usando línea de comandos MySQL
```sql
CREATE DATABASE plantamedicinal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Importar el Esquema
1. En phpMyAdmin, selecciona la base de datos `plantamedicinal`
2. Ve a la pestaña "Importar"
3. Haz clic en "Seleccionar archivo"
4. Navega y selecciona: `plantamedicinal/database/plantamedicinal.sql`
5. Haz clic en "Continuar"

**Nota**: El archivo SQL incluye:
- Estructura completa de 12 tablas
- Datos de ejemplo para testing
- Triggers automáticos
- Índices optimizados

### 3. Verificar la Importación
Después de importar, deberías ver estas tablas:
- `usuarios`
- `plantas_medicinales`
- `recetas`
- `comunidades`
- `posts_foro`
- `comentarios_post`
- `sesiones`
- `logs_actividad`
- `notificaciones`
- `reportes`
- `configuracion_sistema`
- `miembros_comunidad`

## 🔗 Configuración de la Conexión PHP

El archivo `php/config/database.php` ya está configurado con los valores por defecto de XAMPP:

```php
private $host = 'localhost';
private $dbname = 'plantamedicinal';
private $username = 'root';
private $password = '';
```

**Si tu configuración es diferente**, edita estos valores:
- `$host`: Generalmente 'localhost'
- `$dbname`: 'plantamedicinal'
- `$username`: Por defecto 'root' en XAMPP
- `$password`: Por defecto vacío ('') en XAMPP

## 🌐 Configuración del Frontend

### 1. Actualizar Referencias de Scripts
En tus archivos HTML, asegúrate de incluir los nuevos scripts:

```html
<!-- Antes de cerrar </body> -->
<script src="js/api-config.js"></script>
<script src="js/auth-migrated.js"></script>
<!-- Otros scripts existentes -->
```

### 2. Configurar URLs de API
El archivo `js/api-config.js` detecta automáticamente la URL base, pero si necesitas cambiarla:

```javascript
// En js/api-config.js, línea 5:
baseURL: 'http://localhost/plantamedicinal/php/api'
```

## 🚀 Puesta en Marcha

### 1. Verificar Instalación
1. Asegúrate de que Apache y MySQL estén ejecutándose
2. Ve a: `http://localhost/plantamedicinal`
3. Deberías ver la página principal del sistema

### 2. Probar la Conexión a la Base de Datos
Ve a: `http://localhost/plantamedicinal/php/api/auth.php?action=test`

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Database connection successful",
  "timestamp": "2024-10-07 20:59:00"
}
```

### 3. Crear Usuario de Prueba
1. Ve a la página principal y haz clic en "Registrarse"
2. Completa el formulario de registro
3. Inicia sesión con las credenciales creadas

### 4. Datos de Prueba Incluidos
El archivo SQL incluye estos usuarios de ejemplo:
```
Administrador:
- Email: admin@plantamedicinal.com
- Password: admin123

Proveedor:
- Email: proveedor@plantamedicinal.com  
- Password: proveedor123

Usuario:
- Email: usuario@plantamedicinal.com
- Password: usuario123
```

## 🛠️ Solución de Problemas Comunes

### Error: "No se puede conectar a la base de datos"
**Causas posibles:**
- MySQL no está ejecutándose
- Credenciales incorrectas
- Base de datos no existe

**Solución:**
1. Verifica que MySQL esté activo en el panel XAMPP
2. Confirma que la base de datos `plantamedicinal` existe
3. Revisa las credenciales en `php/config/database.php`

### Error: "404 Not Found" en las APIs
**Causas posibles:**
- Proyecto no está en la ruta correcta de XAMPP
- Apache no está ejecutándose
- URLs mal configuradas

**Solución:**
1. Confirma que el proyecto está en `htdocs/plantamedicinal/`
2. Verifica que Apache esté activo
3. Prueba accediendo directamente: `http://localhost/plantamedicinal/php/api/auth.php`

### Error: "Parse error" en PHP
**Causas posibles:**
- Versión de PHP incompatible
- Sintaxis incorrecta

**Solución:**
1. Usa XAMPP con PHP 7.4 o superior
2. Verifica los logs de error de Apache en el panel XAMPP

### Error CORS en el navegador
**Causas posibles:**
- Navegador bloquea peticiones locales

**Solución:**
1. Usa siempre `http://localhost/plantamedicinal` (no abras archivos directamente)
2. Asegúrate de que las APIs incluyen headers CORS (ya configurados)

### Base de datos no actualiza contadores automáticamente
**Causas posibles:**
- Triggers no se importaron correctamente

**Solución:**
1. Reimporta el archivo SQL completo
2. Verifica en phpMyAdmin que existen los triggers en la base de datos

## 📱 Configuración para Desarrollo

### 1. Habilitar Logs de Error
En `php.ini`:
```ini
display_errors = On
log_errors = On
error_log = "php_errors.log"
```

### 2. Configuración de Desarrollo
Para desarrollo, puedes modificar `php/config/database.php` para mostrar errores SQL:

```php
// Agregar después de la línea 20:
$this->connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
```

## 🔒 Seguridad para Producción

**⚠️ IMPORTANTE**: Esta configuración es para desarrollo local. Para producción:

1. Cambia las credenciales de MySQL
2. Usa contraseñas seguras
3. Configura SSL/HTTPS  
4. Deshabilita `display_errors` en PHP
5. Configura un firewall apropiado

## 📞 Soporte

Si encuentras problemas:
1. Verifica los logs de Apache y MySQL en el panel XAMPP
2. Revisa la consola del navegador para errores JavaScript
3. Confirma que todos los archivos estén en las ubicaciones correctas
4. Asegúrate de que Apache y MySQL estén ejecutándose

---

## ✅ Lista de Verificación Final

- [ ] XAMPP instalado y ejecutándose
- [ ] Proyecto en la carpeta htdocs correcta
- [ ] Base de datos `plantamedicinal` creada
- [ ] Archivo SQL importado exitosamente
- [ ] Apache y MySQL activos
- [ ] Página principal accesible en `http://localhost/plantamedicinal`
- [ ] Test de conexión API exitoso
- [ ] Login/registro funcionando
- [ ] Scripts JavaScript actualizados

**¡Perfecto! Tu sistema PlantaMedicinal ya está ejecutándose con MySQL a través de XAMPP.** 🎉