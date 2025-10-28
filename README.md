# PlantaMedicinal - Plataforma de Conservación del Conocimiento Ancestral

Una plataforma web integral que preserva y difunde el conocimiento sobre plantas medicinales nativas, conectando comunidades indígenas, investigadores y usuarios interesados en la medicina tradicional.

![PlantaMedicinal](https://images.unsplash.com/photo-1544131750-2985d621da30?w=1200&h=400&fit=crop)

## 🔥 MIGRACIÓN COMPLETA A BASE DE DATOS MYSQL

**✅ MIGRACIÓN COMPLETADA**: El sistema ha sido completamente migrado desde almacenamiento local simulado a una base de datos real MySQL con XAMPP, manteniendo toda la funcionalidad existente.

### 🗄️ Nueva Arquitectura de Base de Datos

El sistema ahora utiliza una base de datos MySQL completa con:
- **12 tablas normalizadas** con relaciones optimizadas
- **Índices automáticos** para consultas rápidas
- **Triggers de base de datos** para actualizaciones automáticas de contadores
- **Seguridad avanzada** con prepared statements y validación de entrada
- **API RESTful completa** con arquitectura backend PHP moderna

## 📦 Instalación y Configuración

### 🚀 Instalación Rápida con XAMPP

1. **Descargar e instalar XAMPP** desde [apachefriends.org](https://www.apachefriends.org)

2. **Copiar el proyecto** a la carpeta correcta:
   ```bash
   # Windows
   C:/xampp/htdocs/plantamedicinal/
   
   # macOS  
   /Applications/XAMPP/xamppfiles/htdocs/plantamedicinal/
   
   # Linux
   /opt/lampp/htdocs/plantamedicinal/
   ```

3. **Iniciar servicios** en el Panel de Control XAMPP:
   - ✅ Apache
   - ✅ MySQL

4. **Crear la base de datos**:
   - Ve a `http://localhost/phpmyadmin`
   - Crear nueva base de datos: `plantamedicinal`
   - Importar archivo: `database/plantamedicinal.sql`

5. **Verificar instalación**:
   - Abrir: `http://localhost/plantamedicinal`
   - Test de API: `http://localhost/plantamedicinal/php/api/auth.php?action=test`

### 📖 Guía Detallada
Ver **[XAMPP_SETUP.md](XAMPP_SETUP.md)** para instrucciones completas paso a paso.

## 🏗️ Arquitectura del Sistema

### Backend (Nuevo)
- **PHP 7.4+** - Lógica del servidor y APIs
- **MySQL 8.0+** - Base de datos relacional
- **PDO** - Acceso seguro a la base de datos
- **Arquitectura RESTful** - APIs bien estructuradas
- **Autenticación JWT-like** - Tokens seguros para sesiones

### Frontend (Actualizado)
- **HTML5** - Estructura semántica
- **CSS3 + Tailwind** - Diseño responsive
- **JavaScript ES6+** - Lógica del cliente con nuevos adaptadores API
- **Chart.js** - Visualizaciones de datos
- **Fetch API** - Comunicación con el backend

## 🗂️ Nueva Estructura del Proyecto

```
PlantaMedicinal/
├── 📁 Frontend (HTML/CSS/JS)
│   ├── index.html              # Página principal 
│   ├── plantas.html            # Catálogo de plantas
│   ├── recetas.html            # Sistema de recetas
│   ├── comunidad.html          # Foro y comunidades
│   ├── admin.html              # Panel administrativo
│   ├── css/
│   │   └── style.css           # Estilos personalizados
│   └── js/
│       ├── api-config.js       # 🆕 Cliente API y configuración
│       ├── auth-migrated.js    # 🆕 Autenticación con API
│       ├── main.js             # Funcionalidades principales
│       ├── search.js           # Motor de búsqueda
│       ├── plantas.js          # Gestión de plantas
│       ├── recetas.js          # Sistema de recetas
│       ├── comunidad.js        # Funcionalidades de comunidad
│       └── admin.js            # Panel administrativo
├── 📁 Backend (PHP/MySQL)
│   ├── database/
│   │   └── plantamedicinal.sql # 🆕 Esquema completo de BD
│   └── php/
│       ├── config/
│       │   └── database.php    # 🆕 Conexión a MySQL
│       ├── api/
│       │   ├── auth.php        # 🆕 API de autenticación
│       │   ├── plantas.php     # 🆕 API de plantas
│       │   ├── recetas.php     # 🆕 API de recetas
│       │   ├── comunidad.php   # 🆕 API de comunidad
│       │   └── admin.php       # 🆕 API administrativa
│       └── utils/
│           └── functions.php   # 🆕 Utilidades PHP
├── XAMPP_SETUP.md              # 🆕 Guía de instalación
└── README.md                   # Documentación actualizada
```

## 🔗 Endpoints de API

### 🔐 Autenticación
- `POST /auth.php?action=login` - Iniciar sesión
- `POST /auth.php?action=register` - Registrar usuario
- `POST /auth.php?action=logout` - Cerrar sesión
- `GET /auth.php?action=verify` - Verificar token
- `GET /auth.php?action=test` - Test de conexión

### 🌿 Plantas Medicinales
- `GET /plantas.php` - Listar plantas con paginación
- `GET /plantas.php?action=search` - Búsqueda avanzada
- `GET /plantas.php?action=details&id={id}` - Detalles de planta
- `POST /plantas.php?action=create` - Crear planta (proveedor+)
- `PUT /plantas.php?action=update` - Actualizar planta
- `POST /plantas.php?action=favorite` - Marcar/desmarcar favorito

### 🥄 Recetas Tradicionales
- `GET /recetas.php` - Listar recetas con filtros
- `GET /recetas.php?action=details&id={id}` - Detalles de receta
- `POST /recetas.php?action=create` - Crear receta
- `POST /recetas.php?action=rate` - Calificar receta
- `POST /recetas.php?action=comment` - Comentar receta
- `POST /recetas.php?action=favorite` - Favoritos

### 👥 Comunidad y Foros
- `GET /comunidad.php/posts` - Listar posts del foro
- `GET /comunidad.php/posts/{id}` - Detalles de post
- `POST /comunidad.php/posts` - Crear post
- `GET /comunidad.php/comunidades` - Listar comunidades
- `POST /comunidad.php/votar` - Votar posts
- `GET /comunidad.php/notificaciones` - Notificaciones de usuario

### ⚙️ Administración
- `GET /admin.php/dashboard` - Estadísticas del sistema
- `GET /admin.php/usuarios` - Gestión de usuarios
- `GET /admin.php/moderacion` - Cola de moderación
- `GET /admin.php/reportes` - Reportes pendientes
- `POST /admin.php/moderar` - Aprobar/rechazar contenido
- `GET /admin.php/logs` - Logs de actividad

## 🗃️ Esquema de Base de Datos

### Tablas Principales

#### usuarios
```sql
- id (PK, AUTO_INCREMENT)
- nombre, apellido, email, password
- rol (usuario, proveedor, administrador)
- activo, verificado, fecha_registro
- fecha_ultimo_acceso, avatar, biografia
```

#### plantas_medicinales
```sql
- id (PK), usuario_id (FK)
- nombre, nombre_cientifico, familia
- descripcion, habitat, distribucion
- beneficios (JSON), usos_tradicionales (JSON)
- contraindicaciones (JSON), preparacion (JSON)
- estado, categoria, origen, imagen_url
- visualizaciones, total_favoritos
```

#### recetas
```sql
- id (PK), usuario_id (FK), planta_id (FK)
- titulo, descripcion, ingredientes (JSON)
- preparacion (JSON), dosis, tiempo_preparacion
- dificultad, estado_moderacion
- calificacion_promedio, total_calificaciones
- total_comentarios, total_favoritos
```

#### comunidades, posts_foro, comentarios_post
```sql
- Sistema completo de foros y comunidades
- Votación de posts, comentarios anidados
- Moderación y reportes de contenido
```

#### sesiones, logs_actividad, notificaciones
```sql
- Gestión de sesiones de usuario
- Auditoría completa del sistema
- Sistema de notificaciones
```

### 🔧 Características Técnicas

#### Seguridad
- **Prepared Statements** - Prevención de inyección SQL
- **Password Hashing** - Contraseñas encriptadas con PHP password_hash()
- **Token de Sesión** - Autenticación segura con tokens únicos
- **Validación de Entrada** - Sanitización de todos los inputs
- **Control de Acceso** - Verificación de roles y permisos

#### Rendimiento
- **Índices Optimizados** - Consultas rápidas en campos clave
- **Triggers Automáticos** - Actualización de contadores en tiempo real
- **Paginación Eficiente** - Carga de datos por páginas
- **Cache de Sesiones** - Reducción de consultas repetitivas

#### Escalabilidad
- **Arquitectura Modular** - Fácil extensión de funcionalidades
- **APIs RESTful** - Integración con aplicaciones externas
- **Base de Datos Normalizada** - Estructura escalable
- **Separación de Capas** - Frontend y backend independientes

## 👤 Usuarios de Prueba

La base de datos incluye usuarios precargados:

```
🔑 Administrador:
Email: admin@plantamedicinal.com
Password: admin123

🌿 Proveedor:
Email: proveedor@plantamedicinal.com  
Password: proveedor123

👤 Usuario:
Email: usuario@plantamedicinal.com
Password: usuario123
```

## 🌟 Características Principales

### ✅ Funcionalidades Migradas y Mejoradas

#### 🏠 Sistema Base
- **Autenticación robusta** con base de datos MySQL
- **Roles diferenciados** con control de acceso real
- **Sesiones persistentes** con tokens de servidor
- **Arquitectura escalable** preparada para crecimiento

#### 🌿 Gestión de Plantas
- **Base de datos completa** con plantas reales
- **Búsqueda optimizada** con índices de base de datos
- **Sistema de favoritos** persistente por usuario
- **Ratings y comentarios** con datos reales

#### 🥄 Recetas Tradicionales
- **Moderación real** con workflow de aprobación
- **Comentarios y calificaciones** almacenados
- **Sistema de favoritos** personalizado
- **Categorización automática** basada en plantas

#### 👥 Comunidad Activa
- **Foros de discusión** con base de datos
- **Sistema de votación** real para posts
- **Notificaciones** persistentes de actividad
- **Comunidades verificadas** con perfiles completos

#### ⚙️ Panel Administrativo
- **Dashboard en tiempo real** con datos MySQL
- **Moderación eficiente** de todo el contenido
- **Gestión de usuarios** con suspensión/activación
- **Reportes y estadísticas** basados en datos reales
- **Logs de auditoría** para trazabilidad completa

#### 🔍 Búsqueda Avanzada
- **Consultas SQL optimizadas** con relevancia
- **Filtros combinados** eficientes
- **Paginación de servidor** para grandes volúmenes
- **Búsqueda fuzzy** mejorada con algoritmos de base de datos

## 🌐 URLs Funcionales

### Páginas Principales
- `/index.html` - Página de inicio (migrada a APIs)
- `/plantas.html` - Catálogo con datos reales de MySQL
- `/recetas.html` - Recetas con sistema de moderación
- `/comunidad.html` - Foros y comunidades activas
- `/admin.html` - Panel administrativo con datos en vivo

### APIs de Desarrollo
- `/php/api/auth.php?action=test` - Test de conexión a BD
- `/php/api/plantas.php` - API de plantas medicinales
- `/php/api/recetas.php` - API de recetas tradicionales
- `/php/api/comunidad.php` - API de foros y comunidad
- `/php/api/admin.php` - API administrativa

## 🛠️ Configuración de Desarrollo

### Requisitos del Sistema
- **XAMPP 7.4+** o servidor Apache/PHP/MySQL equivalente
- **PHP 7.4+** con extensiones PDO, MySQLi, JSON
- **MySQL 8.0+** o MariaDB 10.4+
- **Navegador moderno** con soporte JavaScript ES6+

### Variables de Configuración

#### Base de Datos (php/config/database.php)
```php
private $host = 'localhost';        // Host de MySQL
private $dbname = 'plantamedicinal'; // Nombre de la BD
private $username = 'root';          // Usuario MySQL
private $password = '';              // Contraseña (vacía en XAMPP)
```

#### Frontend (js/api-config.js)
```javascript
baseURL: window.location.origin + '/php/api'  // URL base de las APIs
timeout: 30000                                // Timeout de peticiones
```

## 🔄 Migración de Datos

### Datos Incluidos
El archivo `database/plantamedicinal.sql` incluye:
- **Estructura completa** de 12 tablas con relaciones
- **Datos de ejemplo** para testing inmediato
- **Triggers y procedimientos** para automatización
- **Índices optimizados** para rendimiento
- **Configuración inicial** del sistema

### Datos de Prueba
- **5 plantas medicinales** con información completa
- **8 recetas tradicionales** de diferentes comunidades  
- **4 comunidades indígenas** colaboradoras
- **15 posts de foro** en diferentes categorías
- **25 comentarios** en posts y recetas
- **3 usuarios de ejemplo** con diferentes roles

## 📈 Próximas Funcionalidades

### En Desarrollo
- **API externa de validación** científica de plantas
- **Sistema de notificaciones** push en tiempo real
- **Exportación avanzada** de datos en múltiples formatos
- **Geolocalización** de plantas por coordenadas GPS
- **Dashboard analytics** avanzado con más métricas

### Roadmap 2024
- **Aplicación móvil** React Native con sincronización
- **Modo offline** con SQLite local
- **Inteligencia artificial** para recomendaciones
- **Marketplace** integrado para productos de comunidades
- **Certificaciones digitales** blockchain para autenticidad

## 🚨 Notas Importantes

### Migración Completada
- ✅ **Base de datos MySQL** completamente funcional
- ✅ **APIs PHP** con todas las funcionalidades  
- ✅ **Frontend adaptado** para usar nuevas APIs
- ✅ **Sistema de autenticación** mejorado y seguro
- ✅ **Datos de ejemplo** listos para testing
- ✅ **Documentación completa** de instalación

### Compatibilidad
- El sistema mantiene **100% compatibilidad** con la interfaz anterior
- Los datos simulados han sido **migrados completamente** a MySQL
- Las funcionalidades existentes han sido **mejoradas** con la nueva arquitectura
- La experiencia de usuario **no ha cambiado**, pero ahora es más robusta

## 🤝 Contribución y Soporte

### Principios del Proyecto
- **Respeto cultural** - Valoración del conocimiento tradicional
- **Colaboración** - Trabajo conjunto con comunidades indígenas  
- **Verificación** - Moderación responsable del contenido
- **Accesibilidad** - Diseño inclusivo para todos los usuarios
- **Preservación** - Documentación fiel de saberes ancestrales

### Soporte Técnico
Para problemas técnicos con la migración:
1. Revisa la [Guía de Instalación XAMPP](XAMPP_SETUP.md)
2. Verifica los logs de Apache y MySQL en el panel XAMPP
3. Confirma que la base de datos se importó correctamente
4. Prueba la conexión API: `http://localhost/plantamedicinal/php/api/auth.php?action=test`

## 📜 Licencia y Reconocimientos

Este proyecto está desarrollado con el más profundo respeto hacia las comunidades indígenas y sus conocimientos ancestrales. La migración a base de datos permite mejor preservación y acceso al patrimonio cultural.

**Desarrollado con ❤️ para la conservación del conocimiento ancestral sobre plantas medicinales.**

---

## 🎉 ¡Migración Exitosa!

**PlantaMedicinal ahora ejecuta con una base de datos MySQL completa a través de XAMPP, manteniendo toda la funcionalidad existente pero con una arquitectura robusta y escalable.**

*Conectando tradición, tecnología y comunidad para preservar la sabiduría ancestral de las plantas medicinales nativas.*