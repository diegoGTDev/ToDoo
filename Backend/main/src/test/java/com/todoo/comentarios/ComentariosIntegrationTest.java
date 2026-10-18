package com.todoo.comentarios;

import com.todoo.notificaciones.SesionNotificaciones;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.contains;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:comentarios;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa", "spring.datasource.password=",
        "spring.sql.init.mode=always", "spring.sql.init.schema-locations=classpath:comentarios_schema.sql"
})
class ComentariosIntegrationTest {
    private static final String RUTA = "/api/proyectos/1/tareas/10/comentarios";

    @Autowired WebApplicationContext context;
    @Autowired JdbcTemplate jdbc;
    @Autowired SesionNotificaciones sesion;
    private MockMvc mvc;

    // Proyecto 1: Ana (1, administradora), Beto (2) y Dani (4, ya fuera del proyecto).
    // Proyecto 2: Carla (3). Tarea 10 y 11 en el proyecto 1, 12 archivada, 20 en el proyecto 2.
    @BeforeEach
    void setup() {
        jdbc.update("DELETE FROM comentarios");
        jdbc.update("DELETE FROM tareas");
        jdbc.update("DELETE FROM miembros_proyecto");
        jdbc.update("DELETE FROM usuarios");
        jdbc.update("INSERT INTO usuarios (id, nombre) VALUES (1, 'Ana'), (2, 'Beto'), (3, 'Carla'), (4, 'Dani')");
        jdbc.update("INSERT INTO miembros_proyecto (proyecto_id, usuario_id, rol, activo) VALUES"
                + " (1, 1, 'administrador', TRUE), (1, 2, 'miembro', TRUE), (2, 3, 'administrador', TRUE),"
                + " (1, 4, 'miembro', FALSE)");
        jdbc.update("INSERT INTO tareas (id, proyecto_id, titulo, archivada) VALUES"
                + " (10, 1, 'Disenar login', FALSE), (11, 1, 'Crear API', FALSE),"
                + " (12, 1, 'Tarea vieja', TRUE), (20, 2, 'Tarea ajena', FALSE)");
        mvc = MockMvcBuilders.webAppContextSetup(context).build();
    }

    private MockHttpSession login(long id) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SesionNotificaciones.USUARIO_ID, id);
        return session;
    }

    private String json(String contenido) {
        return "{\"contenido\":" + (contenido == null ? "null" : "\"" + contenido + "\"") + "}";
    }

    private long comentar(long usuario, String ruta, String contenido) throws Exception {
        MockHttpSession session = login(usuario);
        mvc.perform(post(ruta).session(session).header("X-CSRF-TOKEN", sesion.csrfToken(session))
                        .contentType(MediaType.APPLICATION_JSON).content(json(contenido)))
                .andExpect(status().isCreated());
        return jdbc.queryForObject("SELECT MAX(id) FROM comentarios", Long.class);
    }

    @Test
    void exigeSesion() throws Exception {
        mvc.perform(get(RUTA)).andExpect(status().isUnauthorized());
        mvc.perform(post(RUTA).contentType(MediaType.APPLICATION_JSON).content(json("Hola")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void publicaUnComentarioConElAutorDeLaSesion() throws Exception {
        MockHttpSession session = login(2);
        mvc.perform(post(RUTA).session(session).header("X-CSRF-TOKEN", sesion.csrfToken(session))
                        .contentType(MediaType.APPLICATION_JSON)
                        // Un "autor" enviado por el navegador se ignora.
                        .content("{\"contenido\":\"  Ya lo estoy revisando  \",\"autor\":{\"id\":1}}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.autor.id").value(2))
                .andExpect(jsonPath("$.autor.nombre").value("Beto"))
                .andExpect(jsonPath("$.contenido").value("Ya lo estoy revisando"))
                .andExpect(jsonPath("$.tarea_id").value(10))
                .andExpect(jsonPath("$.editado").value(false))
                .andExpect(jsonPath("$.puede_modificar").value(true));
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM comentarios WHERE autor_id = 2", Integer.class));
    }

    @Test
    void exigeCsrfParaPublicar() throws Exception {
        mvc.perform(post(RUTA).session(login(1)).contentType(MediaType.APPLICATION_JSON).content(json("Hola")))
                .andExpect(status().isForbidden());
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM comentarios", Integer.class));
    }

    @Test
    void listaLaConversacionDeLaTareaEnOrdenYSoloDeEsaTarea() throws Exception {
        comentar(1, RUTA, "Primero");
        comentar(2, "/api/proyectos/1/tareas/11/comentarios", "Otra tarea");
        comentar(2, RUTA, "Segundo");
        mvc.perform(get(RUTA).session(login(2)))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$[*].contenido", contains("Primero", "Segundo")))
                // Beto solo puede modificar lo suyo; Ana (administradora) puede moderar todo.
                .andExpect(jsonPath("$[0].puede_modificar").value(false))
                .andExpect(jsonPath("$[1].puede_modificar").value(true));
        mvc.perform(get(RUTA).session(login(1)))
                .andExpect(jsonPath("$[0].puede_modificar").value(true))
                .andExpect(jsonPath("$[1].puede_modificar").value(true));
    }

    @Test
    void rechazaComentariosVaciosOMuyLargos() throws Exception {
        MockHttpSession session = login(1);
        String csrf = sesion.csrfToken(session);
        for (String cuerpo : new String[]{json("   "), json(null), json("a".repeat(1001)), "{", "[]"}) {
            mvc.perform(post(RUTA).session(session).header("X-CSRF-TOKEN", csrf)
                            .contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(post(RUTA).session(session).header("X-CSRF-TOKEN", csrf)
                        .contentType(MediaType.APPLICATION_JSON).content(json("a".repeat(1000))))
                .andExpect(status().isCreated());
    }

    @Test
    void noMuestraTareasDeProyectosAjenosNiDeQuienYaSalio() throws Exception {
        mvc.perform(get("/api/proyectos/2/tareas/20/comentarios").session(login(1))).andExpect(status().isNotFound());
        mvc.perform(get(RUTA).session(login(4))).andExpect(status().isNotFound());
        mvc.perform(get(RUTA).session(login(3))).andExpect(status().isNotFound());
        // La tarea 20 existe, pero en otro proyecto: no se puede leer desde el proyecto 1.
        mvc.perform(get("/api/proyectos/1/tareas/20/comentarios").session(login(1))).andExpect(status().isNotFound());
        mvc.perform(get("/api/proyectos/1/tareas/99/comentarios").session(login(1))).andExpect(status().isNotFound());
        MockHttpSession session = login(4);
        mvc.perform(post(RUTA).session(session).header("X-CSRF-TOKEN", sesion.csrfToken(session))
                        .contentType(MediaType.APPLICATION_JSON).content(json("Hola")))
                .andExpect(status().isNotFound());
    }

    @Test
    void soloElAutorEditaYSeMarcaComoEditado() throws Exception {
        long id = comentar(2, RUTA, "Texto original");
        MockHttpSession ana = login(1);
        mvc.perform(patch(RUTA + "/" + id).session(ana).header("X-CSRF-TOKEN", sesion.csrfToken(ana))
                        .contentType(MediaType.APPLICATION_JSON).content(json("Reescrito por otra persona")))
                .andExpect(status().isForbidden());
        // Fija una fecha de creacion pasada para que la edicion sea distinguible.
        jdbc.update("UPDATE comentarios SET fecha_creacion = TIMESTAMP '2026-10-01 10:00:00',"
                + " fecha_actualizacion = TIMESTAMP '2026-10-01 10:00:00' WHERE id = ?", id);
        MockHttpSession beto = login(2);
        mvc.perform(patch(RUTA + "/" + id).session(beto).header("X-CSRF-TOKEN", sesion.csrfToken(beto))
                        .contentType(MediaType.APPLICATION_JSON).content(json("Texto corregido")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contenido").value("Texto corregido"))
                .andExpect(jsonPath("$.editado").value(true))
                .andExpect(jsonPath("$.fecha_creacion").value("2026-10-01T10:00:00Z"));
    }

    @Test
    void elAutorYUnAdministradorEliminanPeroOtroMiembroNo() throws Exception {
        long deAna = comentar(1, RUTA, "De Ana");
        long deBeto = comentar(2, RUTA, "De Beto");
        MockHttpSession beto = login(2);
        String csrfBeto = sesion.csrfToken(beto);
        mvc.perform(delete(RUTA + "/" + deAna).session(beto).header("X-CSRF-TOKEN", csrfBeto))
                .andExpect(status().isForbidden());
        mvc.perform(delete(RUTA + "/" + deBeto).session(beto).header("X-CSRF-TOKEN", csrfBeto))
                .andExpect(status().isNoContent());
        long otro = comentar(2, RUTA, "Otro de Beto");
        MockHttpSession ana = login(1);
        mvc.perform(delete(RUTA + "/" + otro).session(ana).header("X-CSRF-TOKEN", sesion.csrfToken(ana)))
                .andExpect(status().isNoContent());
        mvc.perform(delete(RUTA + "/" + otro).session(ana).header("X-CSRF-TOKEN", sesion.csrfToken(ana)))
                .andExpect(status().isNotFound());
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM comentarios", Integer.class));
    }

    @Test
    void noPermiteTocarUnComentarioDesdeOtraTarea() throws Exception {
        long id = comentar(1, RUTA, "De la tarea 10");
        MockHttpSession ana = login(1);
        mvc.perform(delete("/api/proyectos/1/tareas/11/comentarios/" + id).session(ana)
                        .header("X-CSRF-TOKEN", sesion.csrfToken(ana)))
                .andExpect(status().isNotFound());
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM comentarios", Integer.class));
    }

    @Test
    void unaTareaArchivadaSeLeePeroNoAdmiteCambios() throws Exception {
        jdbc.update("INSERT INTO comentarios (proyecto_id, tarea_id, autor_id, contenido) VALUES (1, 12, 1, 'Historial')");
        String ruta = "/api/proyectos/1/tareas/12/comentarios";
        mvc.perform(get(ruta).session(login(2)))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].contenido").value("Historial"));
        MockHttpSession ana = login(1);
        String csrf = sesion.csrfToken(ana);
        mvc.perform(post(ruta).session(ana).header("X-CSRF-TOKEN", csrf)
                        .contentType(MediaType.APPLICATION_JSON).content(json("Nuevo")))
                .andExpect(status().isConflict());
        long id = jdbc.queryForObject("SELECT MAX(id) FROM comentarios", Long.class);
        mvc.perform(patch(ruta + "/" + id).session(ana).header("X-CSRF-TOKEN", csrf)
                        .contentType(MediaType.APPLICATION_JSON).content(json("Cambio")))
                .andExpect(status().isConflict());
    }
}
