package com.todoo.comentarios;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ComentarioService {
    private static final String ADMINISTRADOR = "administrador";

    private final ComentarioRepository repository;
    private final Clock clock;

    public ComentarioService(ComentarioRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<Comentario> listar(long proyectoId, long tareaId, long usuarioId) {
        String rol = validarAcceso(proyectoId, tareaId, usuarioId);
        return repository.listar(proyectoId, tareaId).stream()
                .map(fila -> fila.aComentario(puedeModificar(fila, usuarioId, rol)))
                .toList();
    }

    @Transactional
    public Comentario crear(long proyectoId, long tareaId, long usuarioId, NuevoComentario cuerpo) {
        validarAcceso(proyectoId, tareaId, usuarioId);
        exigirTareaActiva(proyectoId, tareaId);
        long id = repository.crear(proyectoId, tareaId, usuarioId, cuerpo.validado(), LocalDateTime.now(clock));
        // Quien acaba de escribir el comentario siempre puede modificarlo.
        return buscar(proyectoId, tareaId, id).aComentario(true);
    }

    @Transactional
    public Comentario editar(long proyectoId, long tareaId, long id, long usuarioId, NuevoComentario cuerpo) {
        String rol = validarAcceso(proyectoId, tareaId, usuarioId);
        ComentarioRepository.Fila fila = buscar(proyectoId, tareaId, id);
        // Solo el autor edita: un administrador puede moderar (eliminar) pero no reescribir lo que dijo otra persona.
        if (fila.autor().id() != usuarioId) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el autor puede editar el comentario.");
        }
        exigirTareaActiva(proyectoId, tareaId);
        repository.actualizar(id, cuerpo.validado(), LocalDateTime.now(clock));
        return buscar(proyectoId, tareaId, id).aComentario(puedeModificar(fila, usuarioId, rol));
    }

    @Transactional
    public void eliminar(long proyectoId, long tareaId, long id, long usuarioId) {
        String rol = validarAcceso(proyectoId, tareaId, usuarioId);
        ComentarioRepository.Fila fila = buscar(proyectoId, tareaId, id);
        if (!puedeModificar(fila, usuarioId, rol)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo el autor o un administrador pueden eliminar el comentario.");
        }
        repository.eliminar(id);
    }

    private ComentarioRepository.Fila buscar(long proyectoId, long tareaId, long id) {
        return repository.buscar(proyectoId, tareaId, id).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Comentario no encontrado."));
    }

    private boolean puedeModificar(ComentarioRepository.Fila fila, long usuarioId, String rol) {
        return fila.autor().id() == usuarioId || ADMINISTRADOR.equals(rol);
    }

    // Devuelve el rol del usuario. 404 en lugar de 403 para no revelar que proyectos o tareas existen.
    private String validarAcceso(long proyectoId, long tareaId, long usuarioId) {
        if (proyectoId <= 0 || tareaId <= 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Tarea no encontrada.");
        }
        String rol = repository.rolActivo(proyectoId, usuarioId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Tarea no encontrada."));
        repository.tareaArchivada(proyectoId, tareaId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Tarea no encontrada."));
        return rol;
    }

    // Una tarea archivada conserva su conversacion para leerla, pero ya no admite cambios.
    private void exigirTareaActiva(long proyectoId, long tareaId) {
        if (repository.tareaArchivada(proyectoId, tareaId).orElse(true)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "La tarea esta archivada y no admite cambios.");
        }
    }
}
