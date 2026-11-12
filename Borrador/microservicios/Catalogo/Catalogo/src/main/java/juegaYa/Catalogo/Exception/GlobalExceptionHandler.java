package juegaYa.Catalogo.Exception;

import juegaYa.Catalogo.Dto.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
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

    /** La fecha ya está ocupada u otro choque con el estado actual -> 409. */
    @ExceptionHandler(ConflictoException.class)
    public ResponseEntity<ErrorResponse> manejarConflicto(ConflictoException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(HttpStatus.CONFLICT.value(), ex.getMessage()));
    }

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

    /** El cuerpo de la solicitud no es un JSON válido (o le falta un campo de tipo incorrecto) -> 400. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> manejarJsonInvalido(HttpMessageNotReadableException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(HttpStatus.BAD_REQUEST.value(), "El cuerpo de la solicitud no es un JSON válido"));
    }

    /** Un parámetro de la URL trae un valor del tipo equivocado (ej. una categoría que no existe, una fecha mal escrita) -> 400. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> manejarTipoInvalido(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(HttpStatus.BAD_REQUEST.value(),
                        "El parámetro '" + ex.getName() + "' tiene un valor inválido"));
    }

    /**
     * Cualquier otra cosa que no esperábamos -> 500. Va al final a propósito.
     * Ojo: las excepciones propias de Spring MVC (ruta que no existe, método HTTP no
     * permitido, falta un parámetro obligatorio, etc.) ya traen su código correcto
     * (404, 405, 400...). Antes caían acá y se convertían en 500; ahora se respeta ese código.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> manejarErrorInesperado(Exception ex) {
        if (ex instanceof org.springframework.web.ErrorResponse errorSpring) {
            int codigo = errorSpring.getStatusCode().value();
            String detalle = errorSpring.getBody().getDetail();
            return ResponseEntity.status(codigo)
                    .body(new ErrorResponse(codigo, (detalle != null && !detalle.isBlank()) ? detalle : "Solicitud no válida"));
        }
        log.error("Error inesperado", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Ocurrió un error inesperado"));
    }
}
