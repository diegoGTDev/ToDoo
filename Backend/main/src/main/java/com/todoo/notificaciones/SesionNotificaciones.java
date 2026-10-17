package com.todoo.notificaciones;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class SesionNotificaciones implements HandlerInterceptor {
    public static final String USUARIO_ID = "usuarioId";
    private static final String CSRF_TOKEN = "notificacionesCsrf";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        response.setHeader("Cache-Control", "no-store");
        HttpSession session = request.getSession(false);
        Object value = session == null ? null : session.getAttribute(USUARIO_ID);
        if (!(value instanceof Long || value instanceof Integer) || ((Number) value).longValue() <= 0) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Inicia sesion para consultar tus notificaciones.");
        }
        request.setAttribute(USUARIO_ID, ((Number) value).longValue());
        if (!"GET".equals(request.getMethod()) && !"HEAD".equals(request.getMethod())) {
            String expected = (String) session.getAttribute(CSRF_TOKEN);
            String supplied = request.getHeader("X-CSRF-TOKEN");
            if (expected == null || supplied == null || !MessageDigest.isEqual(
                    expected.getBytes(StandardCharsets.UTF_8), supplied.getBytes(StandardCharsets.UTF_8))) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Actualiza la pagina e intenta de nuevo.");
            }
        }
        return true;
    }

    public String csrfToken(HttpSession session) {
        synchronized (session) {
            String token = (String) session.getAttribute(CSRF_TOKEN);
            if (token == null) {
                token = UUID.randomUUID().toString();
                session.setAttribute(CSRF_TOKEN, token);
            }
            return token;
        }
    }
}
