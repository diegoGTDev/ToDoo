package com.todoo.notificaciones;

import jakarta.servlet.http.HttpSession;
import java.util.Map;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/notificaciones")
public class NotificacionController {
    private final NotificacionService service;
    private final SesionNotificaciones sesion;

    public NotificacionController(NotificacionService service, SesionNotificaciones sesion) {
        this.service = service;
        this.sesion = sesion;
    }

    @GetMapping
    public List<Notificacion> listar(@RequestAttribute("usuarioId") long usuarioId) {
        return service.listar(usuarioId);
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(HttpSession session) {
        return Map.of("token", sesion.csrfToken(session));
    }

    @PatchMapping("/{id}/leida")
    public Notificacion marcarLeida(@PathVariable long id, @RequestAttribute("usuarioId") long usuarioId) {
        if (id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Identificador invalido.");
        }
        return service.marcarLeida(id, usuarioId);
    }
}
