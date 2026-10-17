package com.todoo.notificaciones;

import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.IllegalTransactionStateException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.WebApplicationContext;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:notificaciones;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.sql.init.mode=always", "spring.sql.init.schema-locations=file:database/001_notificaciones.sql"
})
class NotificacionesIntegrationTest {
    @Autowired WebApplicationContext context;
    @Autowired JdbcTemplate jdbc;
    @Autowired NotificacionRepository repository;
    @Autowired NotificacionService service;
    @Autowired SesionNotificaciones sesion;
    @Autowired PlatformTransactionManager transactionManager;
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        jdbc.update("DELETE FROM notificaciones");
        mvc = MockMvcBuilders.webAppContextSetup(context).build();
    }

    private MockHttpSession login(long id) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SesionNotificaciones.USUARIO_ID, id);
        return session;
    }

    private long aviso(long usuarioId, long tareaId) {
        repository.crear(usuarioId, tareaId, "Te asignaron la tarea: Revisar tablero", LocalDateTime.of(2026, 10, 16, 15, 0));
        return repository.listar(usuarioId).get(0).id();
    }

    @Test
    void noAceptaUsuarioElegidoDesdeElNavegador() throws Exception {
        mvc.perform(get("/api/notificaciones").param("usuarioId", "1"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/notificaciones/csrf"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void listaSoloLosAvisosPropiosConSuEstadoDeLectura() throws Exception {
        long propio = aviso(1, 10);
        aviso(2, 11);
        aviso(1, 12);
        service.marcarLeida(propio, 1);
        mvc.perform(get("/api/notificaciones").session(login(1)))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].usuario_id").value(1))
                .andExpect(jsonPath("$[1].usuario_id").value(1))
                .andExpect(jsonPath("$[0].leida").value(false))
                .andExpect(jsonPath("$[1].leida").value(true))
                .andExpect(jsonPath("$[0].fecha_creacion").value("2026-10-16T15:00:00Z"));
    }

    @Test
    void muestraPrimeroLosAvisosMasRecientes() throws Exception {
        aviso(1, 10);
        long ultimo = aviso(1, 11);
        mvc.perform(get("/api/notificaciones").session(login(1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(ultimo));
    }

    @Test
    void exigeCsrfParaCambiarUnAviso() throws Exception {
        long id = aviso(1, 10);
        mvc.perform(patch("/api/notificaciones/{id}/leida", id).session(login(1)))
                .andExpect(status().isForbidden());
        assertFalse(repository.buscarPropia(id, 1).orElseThrow().leida());
    }

    @Test
    void noPermiteLeerAvisosAjenos() throws Exception {
        long id = aviso(2, 10);
        MockHttpSession session = login(1);
        mvc.perform(patch("/api/notificaciones/{id}/leida", id).session(session)
                .header("X-CSRF-TOKEN", sesion.csrfToken(session)))
                .andExpect(status().isNotFound());
        assertFalse(repository.buscarPropia(id, 2).orElseThrow().leida());
    }

    @Test
    void marcadoEsPersistenteEIdempotente() throws Exception {
        long id = aviso(1, 10);
        MockHttpSession session = login(1);
        String csrf = sesion.csrfToken(session);
        mvc.perform(get("/api/notificaciones/csrf").session(session))
                .andExpect(jsonPath("$.token").value(csrf));
        mvc.perform(patch("/api/notificaciones/{id}/leida", id).session(session).header("X-CSRF-TOKEN", csrf))
                .andExpect(status().isOk()).andExpect(jsonPath("$.leida").value(true));
        var primeraLectura = repository.buscarPropia(id, 1).orElseThrow().fecha_lectura();
        mvc.perform(patch("/api/notificaciones/{id}/leida", id).session(session).header("X-CSRF-TOKEN", csrf))
                .andExpect(status().isOk());
        assertEquals(primeraLectura, repository.buscarPropia(id, 1).orElseThrow().fecha_lectura());
        mvc.perform(get("/api/notificaciones").session(session))
                .andExpect(jsonPath("$[0].leida").value(true));
    }

    @Test
    void soloNotificaAlNuevoResponsableYNoDuplicaEdiciones() {
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            service.notificarAsignacion(10, "Disenar pantalla", null, 1L);
            service.notificarAsignacion(10, "Disenar pantalla", 1L, 1L);
            service.notificarAsignacion(10, "Disenar pantalla", 1L, null);
            service.notificarAsignacion(10, "Disenar pantalla", 1L, 2L);
        });
        assertEquals(1, repository.listar(1).size());
        assertEquals(1, repository.listar(2).size());
    }

    @Test
    void revierteElAvisoSiFallaLaTransaccionDeAsignacion() {
        assertThrows(IllegalStateException.class, () ->
                new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
                    service.notificarAsignacion(10, "Revisar tarea", null, 1L);
                    throw new IllegalStateException("Fallo de la asignacion");
                }));
        assertEquals(0, repository.listar(1).size());
    }

    @Test
    void exigeUnaTransaccionParaCrearAvisos() {
        assertThrows(IllegalTransactionStateException.class, () ->
                service.notificarAsignacion(10, "Revisar tarea", null, 1L));
    }
}
