-- Base de datos PlantaMedicinal
-- Esquema actualizado para coincidir con APIs PHP

CREATE DATABASE IF NOT EXISTS plantamedicinal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE plantamedicinal;

-- Tabla de usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol ENUM('usuario', 'proveedor', 'administrador') DEFAULT 'usuario',
    activo BOOLEAN DEFAULT TRUE,
    verificado BOOLEAN DEFAULT FALSE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultimo_acceso TIMESTAMP NULL,
    avatar VARCHAR(500) DEFAULT NULL,
    biografia TEXT DEFAULT NULL,
    comunidad VARCHAR(100) DEFAULT NULL,
    region VARCHAR(100) DEFAULT NULL,
    telefono VARCHAR(20) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_rol (rol),
    INDEX idx_activo (activo)
);

-- Tabla de plantas medicinales
CREATE TABLE plantas_medicinales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL,
    nombre VARCHAR(150) NOT NULL,
    nombre_cientifico VARCHAR(200) NOT NULL,
    familia VARCHAR(100) DEFAULT NULL,
    descripcion TEXT NOT NULL,
    habitat TEXT DEFAULT NULL,
    distribucion VARCHAR(200) DEFAULT NULL,
    beneficios JSON DEFAULT NULL,
    usos_tradicionales JSON DEFAULT NULL,
    contraindicaciones JSON DEFAULT NULL,
    preparacion JSON DEFAULT NULL,
    estado ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    categoria VARCHAR(100) DEFAULT NULL,
    origen VARCHAR(100) DEFAULT NULL,
    imagen_url VARCHAR(500) DEFAULT NULL,
    visualizaciones INT DEFAULT 0,
    total_favoritos INT DEFAULT 0,
    calificacion_promedio DECIMAL(3,2) DEFAULT 0.00,
    total_calificaciones INT DEFAULT 0,
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    motivo_moderacion TEXT DEFAULT NULL,
    fecha_moderacion TIMESTAMP NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_nombre (nombre),
    INDEX idx_categoria (categoria),
    INDEX idx_estado (estado),
    INDEX idx_activa (activa)
);

-- Tabla de recetas
CREATE TABLE recetas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    planta_id INT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT NOT NULL,
    ingredientes JSON NOT NULL,
    preparacion JSON NOT NULL,
    dosis VARCHAR(200) DEFAULT NULL,
    tiempo_preparacion VARCHAR(100) DEFAULT NULL,
    dificultad ENUM('facil', 'intermedio', 'dificil') DEFAULT 'facil',
    estado_moderacion ENUM('pendiente', 'aprobada', 'rechazada') DEFAULT 'pendiente',
    motivo_moderacion TEXT DEFAULT NULL,
    fecha_moderacion TIMESTAMP NULL,
    calificacion_promedio DECIMAL(3,2) DEFAULT 0.00,
    total_calificaciones INT DEFAULT 0,
    total_comentarios INT DEFAULT 0,
    total_favoritos INT DEFAULT 0,
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (planta_id) REFERENCES plantas_medicinales(id) ON DELETE SET NULL,
    INDEX idx_titulo (titulo),
    INDEX idx_estado_moderacion (estado_moderacion),
    INDEX idx_activa (activa)
);

-- Tabla de comunidades
CREATE TABLE comunidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    creador_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    categoria VARCHAR(100) DEFAULT NULL,
    es_publica BOOLEAN DEFAULT TRUE,
    activa BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_nombre (nombre),
    INDEX idx_categoria (categoria),
    INDEX idx_activa (activa)
);

-- Tabla de miembros de comunidad
CREATE TABLE miembros_comunidad (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comunidad_id INT NOT NULL,
    usuario_id INT NOT NULL,
    rol ENUM('miembro', 'moderador', 'admin') DEFAULT 'miembro',
    estado ENUM('activo', 'suspendido', 'bloqueado') DEFAULT 'activo',
    fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (comunidad_id) REFERENCES comunidades(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_miembro (comunidad_id, usuario_id)
);

-- Tabla de posts del foro
CREATE TABLE posts_foro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    comunidad_id INT NULL,
    titulo VARCHAR(200) NOT NULL,
    contenido TEXT NOT NULL,
    categoria VARCHAR(100) DEFAULT 'general',
    tags JSON DEFAULT NULL,
    votos_positivos INT DEFAULT 0,
    votos_negativos INT DEFAULT 0,
    total_comentarios INT DEFAULT 0,
    visualizaciones INT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    requiere_moderacion BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (comunidad_id) REFERENCES comunidades(id) ON DELETE SET NULL,
    INDEX idx_titulo (titulo),
    INDEX idx_categoria (categoria),
    INDEX idx_activo (activo)
);

-- Tabla de comentarios de posts
CREATE TABLE comentarios_post (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    usuario_id INT NOT NULL,
    comentario_padre_id INT NULL,
    contenido TEXT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts_foro(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (comentario_padre_id) REFERENCES comentarios_post(id) ON DELETE CASCADE,
    INDEX idx_post_id (post_id),
    INDEX idx_activo (activo)
);

-- Tabla de votos de posts
CREATE TABLE votos_post (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo ENUM('positivo', 'negativo') NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts_foro(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_voto (post_id, usuario_id)
);

-- Tabla de sesiones
CREATE TABLE sesiones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expira_en TIMESTAMP NOT NULL,
    activa BOOLEAN DEFAULT TRUE,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_activa (activa)
);

-- Tabla de favoritos de plantas
CREATE TABLE favoritos_plantas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    planta_id INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (planta_id) REFERENCES plantas_medicinales(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorito (usuario_id, planta_id)
);

-- Tabla de favoritos de recetas
CREATE TABLE favoritos_recetas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    receta_id INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorito (usuario_id, receta_id)
);

-- Tabla de valoraciones de plantas
CREATE TABLE valoraciones_plantas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    planta_id INT NOT NULL,
    calificacion INT NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    comentario TEXT DEFAULT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (planta_id) REFERENCES plantas_medicinales(id) ON DELETE CASCADE,
    UNIQUE KEY unique_valoracion (usuario_id, planta_id)
);

-- Tabla de valoraciones de recetas
CREATE TABLE valoraciones_recetas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    receta_id INT NOT NULL,
    calificacion INT NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    comentario TEXT DEFAULT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_valoracion (usuario_id, receta_id)
);

-- Tabla de comentarios de recetas
CREATE TABLE comentarios_recetas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receta_id INT NOT NULL,
    usuario_id INT NOT NULL,
    comentario_padre_id INT NULL,
    contenido TEXT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (receta_id) REFERENCES recetas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (comentario_padre_id) REFERENCES comentarios_recetas(id) ON DELETE CASCADE,
    INDEX idx_receta_id (receta_id),
    INDEX idx_activo (activo)
);

-- Tabla de logs de actividad
CREATE TABLE logs_actividad (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL,
    accion VARCHAR(100) NOT NULL,
    detalles JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_accion (accion),
    INDEX idx_fecha (fecha_creacion)
);

-- Tabla de notificaciones
CREATE TABLE notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    leida BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_leida (leida)
);

-- Tabla de reportes
CREATE TABLE reportes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_reportante_id INT NOT NULL,
    usuario_reportado_id INT NULL,
    tipo_contenido ENUM('planta', 'receta', 'post', 'comentario', 'usuario') NOT NULL,
    contenido_id INT NOT NULL,
    motivo VARCHAR(200) NOT NULL,
    descripcion TEXT DEFAULT NULL,
    estado ENUM('pendiente', 'en_revision', 'resuelto', 'desestimado') DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_resolucion TIMESTAMP NULL,
    FOREIGN KEY (usuario_reportante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_reportado_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_tipo_contenido (tipo_contenido),
    INDEX idx_estado (estado)
);

-- Tabla de suspensiones
CREATE TABLE suspensiones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    administrador_id INT NOT NULL,
    motivo TEXT NOT NULL,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_vencimiento TIMESTAMP NULL,
    activa BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (administrador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_activa (activa)
);

-- Tabla de configuración del sistema
CREATE TABLE configuracion_sistema (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT NOT NULL,
    descripcion TEXT DEFAULT NULL,
    tipo ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- TRIGGERS para mantener contadores automáticamente

-- Trigger para actualizar contador de favoritos en plantas
DELIMITER //
CREATE TRIGGER tr_favoritos_plantas_insert 
AFTER INSERT ON favoritos_plantas
FOR EACH ROW
BEGIN
    UPDATE plantas_medicinales 
    SET total_favoritos = (
        SELECT COUNT(*) FROM favoritos_plantas 
        WHERE planta_id = NEW.planta_id
    ) 
    WHERE id = NEW.planta_id;
END//

CREATE TRIGGER tr_favoritos_plantas_delete 
AFTER DELETE ON favoritos_plantas
FOR EACH ROW
BEGIN
    UPDATE plantas_medicinales 
    SET total_favoritos = (
        SELECT COUNT(*) FROM favoritos_plantas 
        WHERE planta_id = OLD.planta_id
    ) 
    WHERE id = OLD.planta_id;
END//

-- Trigger para actualizar contador de comentarios en posts
CREATE TRIGGER tr_comentarios_post_insert 
AFTER INSERT ON comentarios_post
FOR EACH ROW
BEGIN
    UPDATE posts_foro 
    SET total_comentarios = (
        SELECT COUNT(*) FROM comentarios_post 
        WHERE post_id = NEW.post_id AND activo = TRUE
    ) 
    WHERE id = NEW.post_id;
END//

CREATE TRIGGER tr_comentarios_post_update 
AFTER UPDATE ON comentarios_post
FOR EACH ROW
BEGIN
    UPDATE posts_foro 
    SET total_comentarios = (
        SELECT COUNT(*) FROM comentarios_post 
        WHERE post_id = NEW.post_id AND activo = TRUE
    ) 
    WHERE id = NEW.post_id;
END//

-- Trigger para actualizar votos en posts
CREATE TRIGGER tr_votos_post_insert 
AFTER INSERT ON votos_post
FOR EACH ROW
BEGIN
    UPDATE posts_foro 
    SET 
        votos_positivos = (
            SELECT COUNT(*) FROM votos_post 
            WHERE post_id = NEW.post_id AND tipo = 'positivo'
        ),
        votos_negativos = (
            SELECT COUNT(*) FROM votos_post 
            WHERE post_id = NEW.post_id AND tipo = 'negativo'
        )
    WHERE id = NEW.post_id;
END//

CREATE TRIGGER tr_votos_post_update 
AFTER UPDATE ON votos_post
FOR EACH ROW
BEGIN
    UPDATE posts_foro 
    SET 
        votos_positivos = (
            SELECT COUNT(*) FROM votos_post 
            WHERE post_id = NEW.post_id AND tipo = 'positivo'
        ),
        votos_negativos = (
            SELECT COUNT(*) FROM votos_post 
            WHERE post_id = NEW.post_id AND tipo = 'negativo'
        )
    WHERE id = NEW.post_id;
END//

-- Trigger para actualizar calificación promedio de plantas
CREATE TRIGGER tr_valoraciones_plantas_insert 
AFTER INSERT ON valoraciones_plantas
FOR EACH ROW
BEGIN
    UPDATE plantas_medicinales 
    SET 
        calificacion_promedio = (
            SELECT AVG(calificacion) FROM valoraciones_plantas 
            WHERE planta_id = NEW.planta_id
        ),
        total_calificaciones = (
            SELECT COUNT(*) FROM valoraciones_plantas 
            WHERE planta_id = NEW.planta_id
        )
    WHERE id = NEW.planta_id;
END//

CREATE TRIGGER tr_valoraciones_plantas_update 
AFTER UPDATE ON valoraciones_plantas
FOR EACH ROW
BEGIN
    UPDATE plantas_medicinales 
    SET 
        calificacion_promedio = (
            SELECT AVG(calificacion) FROM valoraciones_plantas 
            WHERE planta_id = NEW.planta_id
        ),
        total_calificaciones = (
            SELECT COUNT(*) FROM valoraciones_plantas 
            WHERE planta_id = NEW.planta_id
        )
    WHERE id = NEW.planta_id;
END//

DELIMITER ;

-- DATOS DE EJEMPLO

-- Insertar usuarios de prueba
INSERT INTO usuarios (nombre, apellido, email, password, rol, activo, verificado, comunidad, region) VALUES
('Administrador', 'Sistema', 'admin@plantamedicinal.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'administrador', TRUE, TRUE, NULL, 'Nacional'),
('Carlos', 'Wayuu', 'proveedor@plantamedicinal.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'proveedor', TRUE, TRUE, 'Wayuu', 'La Guajira'),
('María', 'González', 'usuario@plantamedicinal.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'usuario', TRUE, TRUE, NULL, 'Bogotá'),
('Ana', 'Emberá', 'ana.embera@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'proveedor', TRUE, TRUE, 'Emberá', 'Chocó'),
('Luis', 'Muisca', 'luis.muisca@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'proveedor', TRUE, TRUE, 'Muisca', 'Cundinamarca');

-- Insertar plantas medicinales
INSERT INTO plantas_medicinales (usuario_id, nombre, nombre_cientifico, familia, descripcion, beneficios, usos_tradicionales, contraindicaciones, categoria, origen, estado) VALUES
(2, 'Trupillo', 'Prosopis juliflora', 'Fabaceae', 
'Árbol resistente de zonas áridas, conocido por sus propiedades medicinales en el tratamiento de afecciones digestivas.',
'["Antiinflamatorio", "Digestivo", "Cicatrizante", "Antimicrobiano"]',
'["Infusión de corteza para diarrea", "Cataplasma de hojas para heridas", "Decocción para problemas estomacales"]',
'["Embarazo", "Lactancia", "Hipersensibilidad conocida"]',
'Digestiva', 'La Guajira', 'aprobada'),

(3, 'Frailejón', 'Espeletia grandiflora', 'Asteraceae',
'Planta endémica de páramos andinos, utilizada tradicionalmente para problemas respiratorios y como cicatrizante.',
'["Expectorante", "Cicatrizante", "Antiinflamatorio", "Diurético"]',
'["Infusión de hojas para tos", "Ungüento para heridas", "Baños para inflamaciones"]',
'["Dosis excesivas", "Reacciones alérgicas"]',
'Respiratoria', 'Páramos andinos', 'aprobada'),

(4, 'Chontaduro', 'Bactris gasipaes', 'Arecaceae',
'Palmera tropical cuyos frutos y hojas tienen propiedades nutritivas y medicinales, especialmente para la piel.',
'["Nutritivo", "Antioxidante", "Dermatológico", "Energizante"]',
'["Consumo de frutos para nutrición", "Aceite para tratamientos de piel", "Infusión de hojas"]',
'["Diabetes no controlada", "Obesidad severa"]',
'Dermatológica', 'Pacífico colombiano', 'aprobada'),

(5, 'Coca', 'Erythroxylum coca', 'Erythroxylaceae',
'Planta sagrada de culturas andinas, utilizada tradicionalmente para dar energía y tratar diversos malestares.',
'["Energizante", "Digestivo", "Analgésico", "Adaptógeno"]',
'["Masticación de hojas", "Té de coca", "Cataplasmas"]',
'["Embarazo", "Hipertensión", "Problemas cardíacos", "Uso recreativo prohibido"]',
'Energética', 'Región andina', 'pendiente'),

(2, 'Wuayusa', 'Ilex guayusa', 'Aquifoliaceae',
'Planta amazónica conocida por sus propiedades energizantes y su uso en ceremonias tradicionales.',
'["Estimulante natural", "Antioxidante", "Digestivo", "Neuroprotector"]',
'["Infusión ceremonial", "Té energizante matutino", "Preparaciones rituales"]',
'["Sensibilidad a la cafeína", "Insomnio", "Ansiedad"]',
'Energética', 'Amazonia', 'aprobada');

-- Insertar recetas
INSERT INTO recetas (usuario_id, planta_id, titulo, descripcion, ingredientes, preparacion, dosis, dificultad, estado_moderacion) VALUES
(2, 1, 'Infusión digestiva de Trupillo', 'Remedio tradicional wayuu para problemas estomacales y digestivos',
'["10g de corteza de trupillo", "500ml de agua", "Miel al gusto"]',
'["Hervir el agua", "Agregar la corteza de trupillo", "Dejar reposar 15 minutos", "Colar y endulzar"]',
'Una taza después de las comidas', 'facil', 'aprobada'),

(3, 2, 'Ungüento cicatrizante de Frailejón', 'Preparación para acelerar la cicatrización de heridas menores',
'["Hojas frescas de frailejón", "Aceite de coco", "Cera de abejas"]',
'["Macerar las hojas", "Calentar con aceite de coco", "Agregar cera de abejas", "Enfriar y conservar"]',
'Aplicar 2-3 veces al día sobre la herida limpia', 'intermedio', 'aprobada'),

(4, 3, 'Mascarilla nutritiva de Chontaduro', 'Tratamiento natural para nutrir y rejuvenecer la piel',
'["Pulpa de chontaduro maduro", "Miel pura", "Aceite de coco"]',
'["Triturar la pulpa", "Mezclar con miel y aceite", "Aplicar en rostro limpio", "Dejar 20 minutos"]',
'2-3 veces por semana', 'facil', 'aprobada');

-- Insertar comunidades
INSERT INTO comunidades (creador_id, nombre, descripcion, categoria) VALUES
(2, 'Wayuu - Guardianes del desierto', 'Comunidad wayuu especializada en plantas medicinales del desierto de La Guajira', 'Medicina ancestral'),
(4, 'Emberá - Sabiduria del Pacífico', 'Conocedores tradicionales de la medicina de la región pacífica colombiana', 'Medicina ancestral'),
(5, 'Muisca - Herederos del páramo', 'Preservadores del conocimiento ancestral de las plantas de páramo', 'Medicina ancestral');

-- Insertar posts del foro
INSERT INTO posts_foro (usuario_id, comunidad_id, titulo, contenido, categoria) VALUES
(2, 1, '¿Cómo preparar remedios con plantas del desierto?', 'Compartamos técnicas tradicionales para aprovechar las plantas de zonas áridas...', 'consultas'),
(3, NULL, 'Importancia de la documentación científica', 'Es crucial que documentemos correctamente nuestros conocimientos ancestrales...', 'investigacion'),
(4, 2, 'Plantas sagradas del Pacífico', 'Las plantas de nuestra región tienen un significado espiritual profundo...', 'cultura'),
(5, 3, 'Conservación de plantas de páramo', 'Los páramos están en peligro y con ellos nuestras plantas medicinales...', 'conservacion');

-- Insertar comentarios en posts
INSERT INTO comentarios_post (post_id, usuario_id, contenido) VALUES
(1, 3, 'Muy interesante el tema de las plantas desérticas. ¿Tienes más información sobre el trupillo?'),
(1, 4, 'En el Pacífico también tenemos plantas que resisten condiciones extremas de humedad.'),
(2, 2, 'Totalmente de acuerdo. La ciencia occidental debe dialogar con nuestros saberes.'),
(3, 5, 'Las plantas sagradas requieren un manejo especial y respetuoso.'),
(4, 1, 'Los frailejones son fundamentales para el ecosistema de páramo.');

-- Insertar configuración del sistema
INSERT INTO configuracion_sistema (clave, valor, descripcion, tipo) VALUES
('sitio_nombre', 'PlantaMedicinal', 'Nombre del sitio web', 'string'),
('sitio_descripcion', 'Plataforma de conservación del conocimiento ancestral sobre plantas medicinales', 'Descripción del sitio', 'string'),
('moderacion_automatica', 'false', 'Activar moderación automática de contenido', 'boolean'),
('max_plantas_por_dia', '5', 'Máximo de plantas que puede subir un usuario por día', 'number'),
('max_recetas_por_dia', '3', 'Máximo de recetas que puede subir un usuario por día', 'number'),
('email_contacto', 'contacto@plantamedicinal.com', 'Email de contacto del sitio', 'string');