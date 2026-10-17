package com.todoo.notificaciones;

import java.time.Instant;

public record Notificacion(
        long id,
        long usuario_id,
        long tarea_id,
        String mensaje,
        boolean leida,
        Instant fecha_creacion,
        Instant fecha_lectura) {
}
