package juegaYa.Catalogo.Exception;

import juegaYa.Catalogo.Dto.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Centraliza el manejo de errores de toda la API del catálogo, para que los
 * controllers no tengan que andar poniendo try/catch en cada endpoint y para
 * que el cliente (front, Postman, lo que sea) siempre reciba el mismo formato
 * de error (ver ErrorResponse), en vez del stacktrace feo que tira Spring por
 * defecto.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** El recurso pedido (juego, bloqueo, etc.) no existe -> 404. */
    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<ErrorResponse> manejarNoEncontrado(RecursoNoEncontradoException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(HttpStatus.NOT_FOUND.value(), ex.getMessage()));
    }

    /** Algo que mandó el cliente no tiene sentido de negocio (ej. reseña inválida) -> 400. */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> manejarArgumentoInvalido(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(HttpStatus.BAD_REQUEST.value(), ex.getMessage()));
    }

    /**
     * Falló alguna @NotBlank/@Positive/@Min/etc. de un @Valid @RequestBody.
     * Acá sí vale la pena decirle al cliente campo por campo qué estuvo mal.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> manejarValidacion(MethodArgumentNotValidException ex) {
        Map<String, String> errores = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                errores.put(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(HttpStatus.BAD_REQUEST.value(), "Hay datos inválidos en la solicitud", errores));
    }

    /**
     * Cualquier otra cosa que no esperábamos. Esta va al final a propósito: Spring
     * prueba los @ExceptionHandler más específicos primero, así que esta solo
     * agarra lo que ningún otro manejador de arriba capturó.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> manejarErrorInesperado(Exception ex) {
        log.error("Error inesperado en el catálogo", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Ocurrió un error inesperado"));
    }
}