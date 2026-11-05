package juegaYa.Usuarios.Dto;

import java.time.Instant;
import java.util.Map;

/**
 * Forma estándar de los errores de la API (la arma el GlobalExceptionHandler),
 * igual que en Catalogo. "errores" solo viene lleno en fallas de validación.
 */
public record ErrorResponse(
        Instant momento,
        int status,
        String mensaje,
        Map<String, String> errores
) {

    public ErrorResponse(int status, String mensaje) {
        this(Instant.now(), status, mensaje, null);
    }

    public ErrorResponse(int status, String mensaje, Map<String, String> errores) {
        this(Instant.now(), status, mensaje, errores);
    }
}
