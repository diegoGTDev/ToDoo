package com.todoo.comentarios;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/proyectos/{proyectoId}/tareas/{tareaId}/comentarios")
public class ComentarioController {
    private final ComentarioService service;

    public ComentarioController(ComentarioService service) {
        this.service = service;
    }

    // Del mas antiguo al mas reciente, como una conversacion.
    @GetMapping
    public List<Comentario> listar(@PathVariable long proyectoId, @PathVariable long tareaId,
                                   @RequestAttribute("usuarioId") long usuarioId) {
        return service.listar(proyectoId, tareaId, usuarioId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Comentario crear(@PathVariable long proyectoId, @PathVariable long tareaId,
                            @RequestAttribute("usuarioId") long usuarioId, @RequestBody NuevoComentario cuerpo) {
        return service.crear(proyectoId, tareaId, usuarioId, cuerpo);
    }

    @PatchMapping("/{id}")
    public Comentario editar(@PathVariable long proyectoId, @PathVariable long tareaId, @PathVariable long id,
                             @RequestAttribute("usuarioId") long usuarioId, @RequestBody NuevoComentario cuerpo) {
        return service.editar(proyectoId, tareaId, id, usuarioId, cuerpo);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable long proyectoId, @PathVariable long tareaId, @PathVariable long id,
                         @RequestAttribute("usuarioId") long usuarioId) {
        service.eliminar(proyectoId, tareaId, id, usuarioId);
    }
}
