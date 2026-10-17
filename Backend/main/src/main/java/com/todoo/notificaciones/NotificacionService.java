package com.todoo.notificaciones;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class NotificacionService {
    private final NotificacionRepository repository;
    private final Clock clock;

    public NotificacionService(NotificacionRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<Notificacion> listar(long usuarioId) {
        return repository.listar(usuarioId);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Notificacion marcarLeida(long id, long usuarioId) {
        repository.marcarLeida(id, usuarioId, LocalDateTime.now(clock));
        return repository.buscarPropia(id, usuarioId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Notificacion no encontrada."));
    }

    // Invocar desde la transaccion que guarda la tarea, despues de validar permisos.
    @Transactional(propagation = Propagation.MANDATORY)
    public void notificarAsignacion(long tareaId, String titulo, Long responsableAnterior, Long responsableNuevo) {
        if (responsableNuevo == null || Objects.equals(responsableAnterior, responsableNuevo)) {
            return;
        }
        if (tareaId <= 0 || responsableNuevo <= 0 || titulo == null || titulo.isBlank()) {
            throw new IllegalArgumentException("La tarea y el responsable deben ser validos.");
        }
        String mensaje = "Te asignaron la tarea: " + titulo.strip();
        if (mensaje.codePointCount(0, mensaje.length()) > 500) {
            mensaje = mensaje.substring(0, mensaje.offsetByCodePoints(0, 497)) + "...";
        }
        repository.crear(responsableNuevo, tareaId, mensaje, LocalDateTime.now(clock));
    }
}
