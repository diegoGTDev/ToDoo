package com.todoo.notificaciones;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class NotificacionWebConfig implements WebMvcConfigurer {
    private final SesionNotificaciones sesion;

    public NotificacionWebConfig(SesionNotificaciones sesion) {
        this.sesion = sesion;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(sesion).addPathPatterns("/api/notificaciones", "/api/notificaciones/**");
    }
}
