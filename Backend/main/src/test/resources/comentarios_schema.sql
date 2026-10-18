-- Subconjunto de database/propuesta_mysql.sql para las pruebas en H2 (modo MySQL).
-- Conservar los mismos nombres de columnas que usa ComentarioRepository.
CREATE TABLE usuarios (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE miembros_proyecto (
    proyecto_id INT NOT NULL,
    usuario_id INT NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'miembro',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (proyecto_id, usuario_id)
);

CREATE TABLE tareas (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    titulo VARCHAR(100) NOT NULL,
    archivada BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE comentarios (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    tarea_id INT NULL,
    autor_id INT NOT NULL,
    contenido TEXT NOT NULL,
    fecha_creacion DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    fecha_actualizacion DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);
