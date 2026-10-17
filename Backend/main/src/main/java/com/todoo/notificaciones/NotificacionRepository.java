package com.todoo.notificaciones;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
public class NotificacionRepository {
    private final JdbcTemplate jdbc;
    private static final RowMapper<Notificacion> MAPPER = (rs, row) -> {
        LocalDateTime lectura = rs.getObject("fecha_lectura", LocalDateTime.class);
        return new Notificacion(
                rs.getLong("id"), rs.getLong("usuario_id"), rs.getLong("tarea_id"),
                rs.getString("mensaje"), rs.getBoolean("leida"),
                rs.getObject("fecha_creacion", LocalDateTime.class).toInstant(ZoneOffset.UTC),
                lectura == null ? null : lectura.toInstant(ZoneOffset.UTC));
    };

    public NotificacionRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Notificacion> listar(long usuarioId) {
        return jdbc.query("SELECT * FROM notificaciones WHERE usuario_id = ?"
                + " ORDER BY fecha_creacion DESC, id DESC", MAPPER, usuarioId);
    }

    public Optional<Notificacion> buscarPropia(long id, long usuarioId) {
        return jdbc.query("SELECT * FROM notificaciones WHERE id = ? AND usuario_id = ?",
                MAPPER, id, usuarioId).stream().findFirst();
    }

    public void marcarLeida(long id, long usuarioId, LocalDateTime fecha) {
        jdbc.update("UPDATE notificaciones SET leida = TRUE, fecha_lectura = ?"
                + " WHERE id = ? AND usuario_id = ? AND leida = FALSE", fecha, id, usuarioId);
    }

    public void crear(long usuarioId, long tareaId, String mensaje, LocalDateTime fecha) {
        jdbc.update("INSERT INTO notificaciones (usuario_id, tarea_id, mensaje, leida, fecha_creacion)"
                + " VALUES (?, ?, ?, FALSE, ?)", usuarioId, tareaId, mensaje, fecha);
    }
}
