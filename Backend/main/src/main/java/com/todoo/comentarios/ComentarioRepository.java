package com.todoo.comentarios;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Repository;

// Todo el SQL del modulo vive aqui: si el esquema definitivo cambia nombres de
// tablas o columnas, solo este archivo necesita ajustarse.
// Basado en database/propuesta_mysql.sql (comentarios, tareas, miembros_proyecto, usuarios).
@Repository
public class ComentarioRepository {
    private static final String SELECT = "SELECT c.id, c.proyecto_id, c.tarea_id, c.autor_id,"
            + " u.nombre AS autor_nombre, c.contenido, c.fecha_creacion, c.fecha_actualizacion"
            + " FROM comentarios c JOIN usuarios u ON u.id = c.autor_id";

    private final JdbcTemplate jdbc;

    public ComentarioRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // Fila sin "puede_modificar": el servicio lo completa segun el usuario de la sesion.
    public record Fila(long id, long proyectoId, long tareaId, Autor autor, String contenido,
                       LocalDateTime creado, LocalDateTime actualizado) {
        Comentario aComentario(boolean puedeModificar) {
            return new Comentario(id, proyectoId, tareaId, autor, contenido,
                    creado.toInstant(ZoneOffset.UTC), actualizado.toInstant(ZoneOffset.UTC),
                    !actualizado.equals(creado), puedeModificar);
        }
    }

    private static final RowMapper<Fila> MAPPER = (rs, row) -> new Fila(
            rs.getLong("id"), rs.getLong("proyecto_id"), rs.getLong("tarea_id"),
            new Autor(rs.getLong("autor_id"), rs.getString("autor_nombre")),
            rs.getString("contenido"),
            rs.getObject("fecha_creacion", LocalDateTime.class),
            rs.getObject("fecha_actualizacion", LocalDateTime.class));

    /** Rol del usuario en el proyecto ("administrador" o "miembro"); vacio si no es miembro activo. */
    public Optional<String> rolActivo(long proyectoId, long usuarioId) {
        return jdbc.query("SELECT rol FROM miembros_proyecto"
                + " WHERE proyecto_id = ? AND usuario_id = ? AND activo = TRUE",
                (rs, row) -> rs.getString("rol"), proyectoId, usuarioId).stream().findFirst();
    }

    /** Vacio si la tarea no existe en el proyecto; si existe, indica si esta archivada. */
    public Optional<Boolean> tareaArchivada(long proyectoId, long tareaId) {
        return jdbc.query("SELECT archivada FROM tareas WHERE id = ? AND proyecto_id = ?",
                (rs, row) -> rs.getBoolean("archivada"), tareaId, proyectoId).stream().findFirst();
    }

    public List<Fila> listar(long proyectoId, long tareaId) {
        return jdbc.query(SELECT + " WHERE c.proyecto_id = ? AND c.tarea_id = ?"
                + " ORDER BY c.fecha_creacion, c.id", MAPPER, proyectoId, tareaId);
    }

    public Optional<Fila> buscar(long proyectoId, long tareaId, long id) {
        return jdbc.query(SELECT + " WHERE c.id = ? AND c.proyecto_id = ? AND c.tarea_id = ?",
                MAPPER, id, proyectoId, tareaId).stream().findFirst();
    }

    public long crear(long proyectoId, long tareaId, long autorId, String contenido, LocalDateTime fecha) {
        GeneratedKeyHolder claves = new GeneratedKeyHolder();
        jdbc.update(conexion -> {
            var sentencia = conexion.prepareStatement("INSERT INTO comentarios"
                    + " (proyecto_id, tarea_id, autor_id, contenido, fecha_creacion, fecha_actualizacion)"
                    + " VALUES (?, ?, ?, ?, ?, ?)", new String[]{"id"});
            sentencia.setLong(1, proyectoId);
            sentencia.setLong(2, tareaId);
            sentencia.setLong(3, autorId);
            sentencia.setString(4, contenido);
            sentencia.setObject(5, fecha);
            sentencia.setObject(6, fecha);
            return sentencia;
        }, claves);
        return claves.getKey().longValue();
    }

    public void actualizar(long id, String contenido, LocalDateTime fecha) {
        jdbc.update("UPDATE comentarios SET contenido = ?, fecha_actualizacion = ? WHERE id = ?",
                contenido, fecha, id);
    }

    public void eliminar(long id) {
        jdbc.update("DELETE FROM comentarios WHERE id = ?", id);
    }
}
