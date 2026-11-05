package juegaYa.Usuarios.Exception;

import juegaYa.Usuarios.Dto.ErrorResponse;
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
 * Traduce las excepciones del microservicio de usuarios a respuestas HTTP con
 * el mismo formato de error que usa Catalogo (ver ErrorResponse).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** Credenciales malas, token inválido o sesión vencida -> 401. */
    @ExceptionHandler(AutenticacionException.class)
    public ResponseEntity<ErrorResponse> manejarAutenticacion(AutenticacionException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse(HttpStatus.UNAUTHORIZED.value(), ex.getMessage()));
    }

    /** Ya existe una cuenta con ese email -> 409. */
    @ExceptionHandler(EmailYaRegistradoException.class)
    public ResponseEntity<ErrorResponse> manejarEmailRepetido(EmailYaRegistradoException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(HttpStatus.CONFLICT.value(), ex.getMessage()));
    }

    /** Datos que no tienen sentido de negocio (ej. email sin @) -> 400. */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> manejarArgumentoInvalido(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(HttpStatus.BAD_REQUEST.value(), ex.getMessage()));
    }

    /** Falló alguna validación (@NotBlank, @Email, @Size) de un @Valid @RequestBody -> 400 con detalle por campo. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> manejarValidacion(MethodArgumentNotValidException ex) {
        Map<String, String> errores = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                errores.put(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(HttpStatus.BAD_REQUEST.value(), "Hay datos inválidos en la solicitud", errores));
    }

    /** Cualquier otra cosa inesperada -> 500, sin filtrar detalles al cliente. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> manejarErrorInesperado(Exception ex) {
        log.error("Error inesperado en usuarios", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Ocurrió un error inesperado"));
    }
}
