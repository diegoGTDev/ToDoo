package com.todoo.comentarios;

// Cuerpo de POST y PATCH. El autor nunca viene del navegador: se toma de la sesion.
public record NuevoComentario(String contenido) {
    public static final int MAXIMO = 1000;

    // Devuelve el texto sin espacios sobrantes o lanza IllegalArgumentException si no es valido.
    public String validado() {
        String texto = contenido == null ? "" : contenido.strip();
        if (texto.isEmpty()) {
            throw new IllegalArgumentException("Escribe un comentario.");
        }
        if (texto.codePointCount(0, texto.length()) > MAXIMO) {
            throw new IllegalArgumentException("El comentario no puede superar " + MAXIMO + " caracteres.");
        }
        return texto;
    }
}
