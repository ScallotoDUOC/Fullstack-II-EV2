package juegaYa.Catalogo.Dto;

import java.time.Instant;
import java.util.Map;

/**
 * Forma estándar de los errores que devuelve la API (lo arma el GlobalExceptionHandler).
 * "errores" solo viene lleno cuando el problema fue de validación de campos
 * (queda null en los demás casos, para no mandar un objeto vacío de adorno).
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