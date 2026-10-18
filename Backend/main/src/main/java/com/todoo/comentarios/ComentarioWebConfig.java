package com.todoo.comentarios;

import com.todoo.notificaciones.SesionNotificaciones;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// Reutiliza la sesion del modulo de notificaciones: exige el atributo "usuarioId" y, en
// POST/PATCH/DELETE, el encabezado X-CSRF-TOKEN. El token se pide con GET /api/notificaciones/csrf.
// Cuando exista el login definitivo, solo debe seguir estableciendo "usuarioId" en la sesion.
@Configuration
public class ComentarioWebConfig implements WebMvcConfigurer {
    private final SesionNotificaciones sesion;

    public ComentarioWebConfig(SesionNotificaciones sesion) {
        this.sesion = sesion;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(sesion).addPathPatterns(
                "/api/proyectos/*/tareas/*/comentarios", "/api/proyectos/*/tareas/*/comentarios/*");
    }
}
