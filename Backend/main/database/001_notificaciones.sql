CREATE TABLE notificaciones (
    id INT NOT NULL AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    tarea_id INT NOT NULL,
    mensaje VARCHAR(500) NOT NULL,
    leida BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    fecha_lectura DATETIME(6) NULL,
    PRIMARY KEY (id),
    INDEX idx_notificaciones_fecha (usuario_id, fecha_creacion, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

