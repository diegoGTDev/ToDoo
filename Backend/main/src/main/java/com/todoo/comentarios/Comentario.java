package com.todoo.comentarios;

import java.time.Instant;

// puede_modificar lo calcula el servidor para el usuario de la sesion:
// el navegador no necesita conocer roles ni compararlos.
public record Comentario(
        long id,
        long proyecto_id,
        long tarea_id,
        Autor autor,
        String contenido,
        Instant fecha_creacion,
        Instant fecha_actualizacion,
        boolean editado,
        boolean puede_modificar) {
}
