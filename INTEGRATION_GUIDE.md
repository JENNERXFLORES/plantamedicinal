# 🔧 Guía de Integración API - PlantaMedicinal

Esta guía explica cómo integrar las nuevas APIs MySQL en los archivos HTML existentes del proyecto.

## ✅ Problemas Corregidos

### 1. ✅ Clase Database Corregida
- ✅ Añadidos métodos faltantes: `prepare()`, `lastInsertId()`, `rollBack()`
- ✅ Todos los errores de métodos inexistentes solucionados

### 2. ✅ Esquema SQL Actualizado
- ✅ Tablas alineadas con código de APIs: `posts_foro`, `comentarios_post`, `miembros_comunidad`
- ✅ Campo `configuracion_sistema` corregido en lugar de `configuraciones`
- ✅ Campos `plantas_medicinales` con todos los campos esperados por las APIs

### 3. ✅ APIs Completadas
- ✅ Endpoints `refresh` y `profile` implementados en `auth.php`
- ✅ Todas las funciones requeridas por el frontend disponibles

### 4. ✅ Seguridad Mejorada
- ✅ Eliminado soporte de token por query string en todas las APIs
- ✅ Solo tokens por Authorization header permitidos

### 5. ✅ Frontend Adaptado
- ✅ Bug de `const url` corregido en `api-config.js`
- ✅ Adaptador de migración creado para compatibilidad

## 🚀 Integración en Archivos HTML

### Paso 1: Actualizar Referencias de Scripts

En **TODOS** los archivos HTML (`index.html`, `plantas.html`, `recetas.html`, `admin.html`, `comunidad.html`), añadir estos scripts **antes** de los scripts existentes:

```html
<!-- Añadir después de las librerías CDN (Chart.js, Tailwind, etc.) -->
<script src="js/api-config.js"></script>
<script src="js/auth-migrated.js"></script>
<script src="js/migration-adapter.js"></script>

<!-- Luego los scripts existentes -->
<script src="js/main.js"></script>
<script src="js/search.js"></script>
<!-- etc... -->
```

### Paso 2: Ejemplo de Integración - index.html

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PlantaMedicinal - Inicio</title>
    
    <!-- CDNs existentes -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- otros CDNs... -->
</head>
<body>
    <!-- Contenido HTML existente -->
    
    <!-- Scripts - ORDEN IMPORTANTE -->
    <!-- 1. APIs primero -->
    <script src="js/api-config.js"></script>
    <script src="js/auth-migrated.js"></script>
    <script src="js/migration-adapter.js"></script>
    
    <!-- 2. Scripts existentes después -->
    <script src="js/main.js"></script>
    <script src="js/auth.js"></script>
    <script src="js/search.js"></script>
</body>
</html>
```

### Paso 3: Verificar Base de Datos

Asegúrate de que la base de datos esté actualizada:

```sql
-- Verificar que las tablas existen
SHOW TABLES;

-- Verificar estructura de plantas_medicinales
DESCRIBE plantas_medicinales;

-- Verificar datos de ejemplo
SELECT COUNT(*) FROM usuarios;
SELECT COUNT(*) FROM plantas_medicinales;
SELECT COUNT(*) FROM recetas;
```

## 🧪 Testing y Verificación

### 1. Test de Conexión API

Abre la consola del navegador y ejecuta:

```javascript
// Test básico de conexión
debugAPI.testConnection()

// Verificar configuración
console.log('API Base URL:', apiConfig.baseURL);
console.log('Endpoints:', apiConfig.endpoints);
```

### 2. Test de Autenticación

```javascript
// Login de prueba
apiAdapter.login('usuario@plantamedicinal.com', 'usuario123')
  .then(result => console.log('Login result:', result));

// Verificar estado
debugAPI.getCurrentAuth();
```

### 3. Test de Datos

```javascript
// Obtener plantas
apiAdapter.getPlantas()
  .then(result => console.log('Plantas:', result));

// Obtener recetas
apiAdapter.getRecetas()
  .then(result => console.log('Recetas:', result));
```

## 🔄 Migración Automática

El archivo `migration-adapter.js` se encarga automáticamente de:

### ✅ Reemplazar Variables Existentes
- `userDatabase` → Funciones API reales
- `dataManager` → Funciones API reales
- `authState` → Estado sincronizado con APIs

### ✅ Interceptar Formularios
- Formularios de login automáticamente usan APIs
- Formularios de registro conectados a MySQL
- Manejo de errores mejorado

### ✅ Compatibilidad Total
- El código JavaScript existente sigue funcionando
- Los eventos y callbacks existentes se mantienen
- UI components no requieren cambios

## 📊 Dashboard Administrativo

Para el panel admin (`admin.html`), el sistema ahora obtiene datos reales:

```javascript
// El dashboard ahora muestra estadísticas reales de MySQL
apiAdapter.getDashboardStats()
  .then(stats => {
    console.log('Usuarios totales:', stats.data.usuarios.total_usuarios);
    console.log('Plantas:', stats.data.plantas.total_plantas);
    console.log('Recetas:', stats.data.recetas.total_recetas);
  });
```

## 🌿 Sistema de Plantas

Las funciones existentes ahora usan MySQL:

```javascript
// Búsqueda de plantas (ahora usa base de datos real)
searchPlantas('trupillo')
  .then(results => console.log('Resultados de BD:', results));

// Favoritos (persistentes en MySQL)
toggleFavorite('planta', 1)
  .then(result => console.log('Favorito actualizado en BD'));
```

## 📝 Sistema de Recetas

Moderación real implementada:

```javascript
// Crear receta (va a cola de moderación real)
apiAdapter.createReceta({
  titulo: 'Nueva receta de prueba',
  descripcion: 'Descripción de la receta',
  ingredientes: ['Ingrediente 1', 'Ingrediente 2'],
  preparacion: ['Paso 1', 'Paso 2']
});
```

## 🚨 Solución de Problemas Comunes

### Error: "Failed to fetch"
**Causa**: XAMPP no está ejecutándose o URL base incorrecta
**Solución**:
1. Verificar que Apache y MySQL estén activos
2. Probar `http://localhost/plantamedicinal/php/api/auth.php?action=test`
3. Revisar `js/api-config.js` línea 7 (baseURL)

### Error: "Token inválido"
**Causa**: Sesión expirada o no existe
**Solución**:
```javascript
// Limpiar autenticación
debugAPI.clearAuth();
// Intentar login nuevamente
```

### Error: "Table doesn't exist"
**Causa**: Base de datos no importada correctamente
**Solución**:
1. Re-importar `database/plantamedicinal.sql` completo en phpMyAdmin
2. Verificar que todas las tablas fueron creadas

### Error en JavaScript Console
**Causa**: Orden incorrecto de scripts
**Solución**:
1. Asegurar que `api-config.js` se carga primero
2. Luego `auth-migrated.js`
3. Luego `migration-adapter.js`
4. Finalmente scripts existentes

## 📈 Funcionalidades Nuevas Disponibles

### 1. Autenticación Robusta
- Tokens JWT-like con expiración
- Renovación automática de tokens
- Sesiones persistentes en base de datos

### 2. Datos Reales
- Paginación eficiente con MySQL
- Búsqueda con índices optimizados
- Contadores automáticos con triggers

### 3. Moderación Real
- Cola de aprobación para plantas y recetas
- Workflow de moderación completo
- Notificaciones a usuarios

### 4. Dashboard Admin Real
- Estadísticas en tiempo real de MySQL
- Gráficos con datos actualizados
- Logs de actividad completos

## ✅ Checklist de Integración

- [ ] Scripts añadidos a todos los archivos HTML
- [ ] Base de datos `plantamedicinal` creada e importada
- [ ] Apache y MySQL ejecutándose en XAMPP
- [ ] Test de conexión exitoso: `debugAPI.testConnection()`
- [ ] Login de prueba funcionando
- [ ] Plantas y recetas cargando desde MySQL
- [ ] Dashboard admin mostrando estadísticas reales
- [ ] Formularios existentes funcionando con APIs

## 🎯 Resultado Final

Una vez completada la integración:

- ✅ **Misma interfaz de usuario** - Sin cambios visuales
- ✅ **Funcionalidad mejorada** - Datos persistentes en MySQL
- ✅ **Rendimiento superior** - Consultas optimizadas con índices
- ✅ **Seguridad robusta** - Autenticación real con tokens
- ✅ **Escalabilidad** - Arquitectura preparada para crecimiento
- ✅ **Moderación funcional** - Sistema de aprobación real
- ✅ **Analytics reales** - Dashboard con métricas de base de datos

**¡La migración está completa y lista para usar!** 🎉